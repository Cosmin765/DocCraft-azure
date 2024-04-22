app.get('/contents/:filename', async (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).send('Filename is required.');
  }

  const file = storage.bucket(bucketName).file(filename);

    try {
      const exists = await file.exists();
      if (exists[0]) {
        const contents = await file.download();
        console.log(contents)
        res.status(200).send(contents);
      } else {
        res.status(404).send(`File ${filename} not found.`);
      }
    } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Internal Server Error');
    }
});

app.post('/save/:filename', express.json(), async (req, res) => {
  const { filename } = req.params;
  const { content } = req.body;

  if (!filename) {
    return res.status(400).send('Filename is required.');
  }

  try {
    await uploadFromMemory(bucketName, filename, content);
    res.status(200).send('File saved successfully.');
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send('Error saving file.');
  }
});