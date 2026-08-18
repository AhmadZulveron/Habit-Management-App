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
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty')
      .isLength({ min: 2, max: 255 })
      .withMessage('Full name must be between 2 and 255 characters'),
    body('dateOfBirth')
      .optional()
      .isDate()
      .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
  ],
  validate,
  profileController.updateProfile
);

module.exports = router;
