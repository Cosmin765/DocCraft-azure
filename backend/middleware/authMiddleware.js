// const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');

function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
         const decoded = jwtDecode(token);
         req.email = decoded.email;
        //  const decoded = jwt.verify(token, 'your-secret-key');
        //TODO: decode jwt, the secret key is neeeded
        next(req, res);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;