const express = require('express');
const badgeController = require('../controllers/badgeController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All badge routes require authentication
router.use(authenticate);

/**
 * GET /api/badges
 * Get all badges and user's earned state
 */
router.get('/', badgeController.getBadges);

module.exports = router;
