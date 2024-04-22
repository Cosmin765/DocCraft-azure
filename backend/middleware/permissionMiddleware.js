const { PrismaClient } =  require('@prisma/client')
const prisma = new PrismaClient()

async function verifyRole (req, res, next){
        const token = req.header('Authorization');
        if (!token) return res.status(401).json({ error: 'Access denied' });
        try {
             const decoded = jwtDecode(token);
             req.email = decoded.email;
             const user = await prisma.users.findFirst({where: {email: req.email}})
             prisma.file_permissions.findFirst({where: {file_id: req.body.fileId} })
            next(req, res);
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
};