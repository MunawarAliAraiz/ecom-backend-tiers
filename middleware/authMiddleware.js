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

// Admin middleware
const adminAuth = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token, authorization denied"
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, password); // Replace with your actual secret key

        // Assuming your decoded token contains a 'role' property indicating the user's role
        if (decoded.user.email === 'admin@gmail.com') {
            req.user = decoded.user; // Attach the decoded user information to the request
            next();
        } else {
            res.status(401).json({
                success: false,
                message: "Not authorized as an admin"
            });
        }
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

module.exports = { auth, adminAuth };
