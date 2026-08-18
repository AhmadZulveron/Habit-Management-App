const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHelper');

/**
 * Validation Middleware
 * Checks express-validator results and returns errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return sendError(res, 'Validation failed', 422, extractedErrors);
  }
  next();
};

module.exports = { validate };
