const express = require('express');
const { body } = require('express-validator');
const habitController = require('../controllers/habitController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// All habit routes require authentication
router.use(authenticate);

/**
 * POST /api/habits
 * Create a new habit
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Habit name is required')
      .isLength({ max: 255 })
      .withMessage('Habit name must be at most 255 characters'),
    body('description')
      .optional()
      .trim(),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be at most 100 characters'),
    body('priorityLevel')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority level must be high, medium, or low'),
    body('scheduleDays')
      .optional()
      .isArray()
      .withMessage('Schedule days must be an array'),
    body('scheduleDays.*')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Each schedule day must be between 0 (Sunday) and 6 (Saturday)'),
  ],
  validate,
  habitController.createHabit
);

/**
 * GET /api/habits/today
 * Get today's active habits
 * NOTE: This route must be before /:id to avoid conflict
 */
router.get('/today', habitController.getTodayHabits);

/**
 * GET /api/habits
 * Get all habits for the authenticated user
 */
router.get('/', habitController.getHabits);

/**
 * GET /api/habits/:id
 * Get a specific habit by ID
 */
router.get('/:id', habitController.getHabitById);

/**
 * PUT /api/habits/:id
 * Update a habit
 */
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Habit name cannot be empty')
      .isLength({ max: 255 })
      .withMessage('Habit name must be at most 255 characters'),
    body('priorityLevel')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority level must be high, medium, or low'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('scheduleDays')
      .optional()
      .isArray()
      .withMessage('Schedule days must be an array'),
    body('scheduleDays.*')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Each schedule day must be between 0 (Sunday) and 6 (Saturday)'),
  ],
  validate,
  habitController.updateHabit
);

/**
 * DELETE /api/habits/:id
 * Deactivate a habit (soft delete)
 */
router.delete('/:id', habitController.deleteHabit);

/**
 * POST /api/habits/:id/complete
 * Mark a habit as completed for today
 */
router.post(
  '/:id/complete',
  [
    body('notes')
      .optional()
      .trim(),
  ],
  validate,
  habitController.completeHabit
);

module.exports = router;
