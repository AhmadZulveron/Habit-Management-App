const express = require('express');
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * GET /api/profile
 * Get authenticated user's profile
 */
router.get('/', profileController.getProfile);

/**
 * PUT /api/profile
 * Update authenticated user's profile
 */
router.put(
  '/',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 255 })
      .withMessage('Name must be between 2 and 255 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address'),
  ],
  validate,
  profileController.updateProfile
);

module.exports = router;
