const admin = require('../config/firebase-admin');

async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(403).json({ error: 'Unauthorized', details: error.message });
    }
}

module.exports = { verifyFirebaseToken };