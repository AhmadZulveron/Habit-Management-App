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
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Habit title is required')
      .isLength({ max: 150 })
      .withMessage('Habit title must be at most 150 characters'),
    body('description')
      .optional()
      .trim(),
    body('categoryId')
      .notEmpty()
      .withMessage('Category is required')
      .isInt()
      .withMessage('Category must be a valid ID'),
    body('priority')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority level must be high, medium, or low'),
    body('target')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Target must be at least 1'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
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
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Habit title cannot be empty')
      .isLength({ max: 150 })
      .withMessage('Habit title must be at most 150 characters'),
    body('categoryId')
      .optional()
      .isInt()
      .withMessage('Category must be a valid ID'),
    body('priority')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority level must be high, medium, or low'),
    body('target')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Target must be at least 1'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
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
 * Delete a habit (hard delete)
 */
router.delete('/:id', habitController.deleteHabit);

/**
 * POST /api/habits/:id/complete
 * Mark a habit as completed for today
 */
router.post(
  '/:id/complete',
  [],
  validate,
  habitController.completeHabit
);

module.exports = router;
