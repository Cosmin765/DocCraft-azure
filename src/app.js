'use strict';

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const os = require('os');
const {PubSub} = require('@google-cloud/pubsub');

const HOSTNAME = os.hostname();
const { WebPubSubServiceClient } = require("@azure/web-pubsub");

const { PrismaClient, Prisma } = require('@prisma/client')
const verifyToken = require('./middleware/authMiddleware');
const { jwtDecode } = require('jwt-decode');
const { env } = require('process');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const prisma = new PrismaClient();
const storage = new Storage();
const { EventHubProducerClient } = require("@azure/event-hubs");

// async function uploadFromMemory(bucketName, destFileName, contents) {
//   await storage.bucket(bucketName).file(destFileName).save(contents);

//   console.log(
//     `${destFileName} with contents ${contents} uploaded to ${bucketName}.`
//   );
// }

const upload = multer({});

const app = express();
const eventHubName = process.env.EVENT_HUB_NAME;
const connectionString = process.env.HUB_CONNECTION_STRING;
const eventHubProducer = new EventHubProducerClient(connectionString, eventHubName);

app.use(express.static('public'));

app.use(cors({
  origin: ['http://localhost:3000', 'https://frontend-dot-cloud-419006.lm.r.appspot.com'],
  optionsSuccessStatus: 200,
  credentials: true
}));

app.use(cookieParser());

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Salutare, lume!').end();
});

// async function fetchFile(fileName) {
//   const options = {
//     destination: destFileName,
//   };

//   const bucket = storage.bucket(bucketName)
//   await bucket.file(fileName).download(options);

//   console.log(
//     `gs://${bucketName}/${fileName} contents sent to frontend.`
//   );
// }


app.post('/login', async (req, res) => {
  const { name, email } = jwtDecode(req.cookies.authToken);
  const date = new Date();

  const user = await prisma.users.findFirst({where: { email }});
  if (!user) {
    await prisma.users.create({data: {email, username: name}});
  }

  res.status(200).json("ok");
});


// TODO: de vazut aici
// app.post('/upload', upload.single('file'), (req, res) => {
//   verifyToken(req, res, async (req, res) => {
//     const contents = req.file.buffer;
//     await prisma.files.create({
//       data: {
//         file_name: req.file.originalname,
//         file_size: req.file.size
//       }
//     });

//     const blobClient = containerClient.getBlockBlobClient(filename);
//     await blobClient.uploadData(Buffer.from(content));
//     res.status(200).json("ok");
//   })
// });

const accountName = "doccraftfiles"
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new StorageSharedKeyCredential(accountName, env.BLOB_ACCESS_KEY)
);

const containerName = "files";

app.get('/files', async (req, res) => {
  try {
    // TODO: auth
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const files = [];
    for await (const file of containerClient.listBlobsFlat()) {
      files.push(file.name);
    }

    res.json(files);
    return;
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
});

app.get('/contents/:filename', async (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).send('Filename is required.');
  }
  // TODO: auth
  // const { email } = jwtDecode(req.cookies.authToken);
  const email = 'default@default.default';
  const owner = await prisma.users.findFirst({ where: { email: email } });

  // TODO: verifica permisiunea de write
  // prisma.files.findFirst({where: {email: email, file_name}})
  const fileInDB = await prisma.files.findFirst({where:{file_name: filename}})

  if (!fileInDB) {
    return res.status(404).send("Not Found");
  }

  const permission = await prisma.file_permissions.findFirst({where: {file_id: fileInDB.file_id, user_id: owner.user_id, permission_type: 'READ'}});
  if(!permission){
    return res.status(403).send("Permission denied!");
  }
  
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const file = containerClient.getBlobClient(filename);

  if (!await file.exists()) {
    return res.status(404).send('Not Found');
  }

  try {
    const buffer = await file.downloadToBuffer();

    return res.status(200).end(buffer);
  } catch(err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/save/:filename', express.json(), async (req, res) => {
  const { filename } = req.params;
  const { content } = req.body;

  // TODO: auth
  // const { email } = jwtDecode(req.cookies.authToken);
  const email = 'default@default.default'

  const containerClient = blobServiceClient.getContainerClient(containerName);

  if (!email) {
    return res.status(400).send('Email is required.');
  }

  if (!filename) {
    return res.status(400).send('Filename is required.');
  }

  try {
    const owner = await prisma.users.findFirst({ where: { email: email } });

    const file = await prisma.files.findFirst({where:{file_name: filename}})
    if (!file) {
      const file = await prisma.files.create({ data: { file_name: filename, file_size: content.length, owner_id: owner.user_id } });
      await prisma.file_permissions.create({data: {file_id: file.file_id, user_id: owner.user_id, permission_type: 'READ'}});
      await prisma.file_permissions.create({data: {file_id: file.file_id, user_id: owner.user_id, permission_type: 'WRITE'}});
      await prisma.file_permissions.create({data: {file_id: file.file_id, user_id: owner.user_id, permission_type: 'SHARE'}});
    }
    else{
      const permission = await prisma.file_permissions.findFirst({where: {file_id: file.file_id, user_id: owner.user_id, permission_type: 'WRITE'}});
      if(!permission){
        return res.status(403).send("Permission denied!");
      }
    }

    const blobClient = containerClient.getBlockBlobClient(filename);
    await blobClient.uploadData(Buffer.from(content));
    res.status(200).send('File saved successfully.');
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send('Error saving file.');
  }
});


app.get('/users', async (req, res) => {
  try {
    const { email } = jwtDecode(req.cookies.authToken);

    const emails = (await prisma.users.findMany({where: {NOT: {email}}})).map(user => user.email);
    return res.status(200).json(emails);
  } catch(error) {
    console.log(error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/share', async (req, res) => {
  try {
    const { emailTo, permissionType, filename } = req.body;
    const { email } = jwtDecode(req.cookies.authToken);

    const file = await prisma.files.findFirst({where: {file_name: filename}});

    const user = await prisma.users.findFirst({where: {email}});

    const sharePermission = await prisma.file_permissions.findFirst({where: {file_id: file.file_id, user_id: user.user_id, permission_type: 'SHARE'}});
    if (!sharePermission) {
      return res.status(403).send('Unauthorized');
    }

    const userTo = await prisma.users.findFirst({where: {email: emailTo}});

    try {
      await prisma.file_permissions.create({data: {file_id: file.file_id, user_id: userTo.user_id, permission_type: permissionType}});
      // pubsubTopic.publishJSON({emailFrom: email, emailTo: emailTo, permissionType: permissionType, fileName: filename})
      // pubsubTopic.publishMessage({data: Buffer.from(JSON.stringify({emailFrom: email, emailTo: emailTo, permissionType: permissionType, fileName: filename}))})
      const batch = await eventHubProducer.createBatch();
      batch.tryAdd({body: {emailFrom: email, emailTo: emailTo, permissionType: permissionType, fileName: filename}});
      await eventHubProducer.sendBatch(batch);

    } catch(_) {}

    return res.status(200).send('Ok');
  } catch(error) {
    console.log(error);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/test-event', async (req, res) => {
  try {
    try {
      const batch = await eventHubProducer.createBatch();
      batch.tryAdd({body: {emailFrom: "email", emailTo: "emailTo", permissionType: "permissionType", fileName: ":"}});
      await eventHubProducer.sendBatch(batch);

    } catch(_) {}

    return res.status(200).send('Ok');
  } catch(error) {
    console.log(error);
    return res.status(500).send('Internal Server Error');
  }
});

const PORT = parseInt(process.env.PORT) || 8083;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}, ${HOSTNAME}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
