const { sign, verify } = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'; // Adjust the fallback secret as necessary

const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Authorization Header:', authHeader); 
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired' });
        }
        console.log('Decoded Token:', decoded); // Log the decoded token
        req.user = decoded; // Attach decoded info to request object
        next();
    });
};

module.exports = { authenticateToken };
