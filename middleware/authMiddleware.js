// authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const password = process.env.MONGO_DB_PASSWORD; // Update the password accordingly

// Middleware for authentication

const auth = (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        res.status(401).json({
            success: false,
            message: "No token, authorization denied"
        })
    }
    try {
        const decoded = jwt.verify(token, password)
        req.user = decoded.user
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Token is not valid"
        })
    }
}

module.exports = auth;
