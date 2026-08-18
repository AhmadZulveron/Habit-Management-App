const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { sendError } = require('../utils/responseHelper');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header (Bearer scheme)
 * Attaches decoded user data to req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(res, 'Access denied. Invalid token format. Use: Bearer <token>', 401);
    }

    const token = parts[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please login again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token.', 401);
    }
    return sendError(res, 'Authentication failed.', 401);
  }
};

module.exports = { authenticate };
