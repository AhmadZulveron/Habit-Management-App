const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All recommendation routes require authentication
router.use(authenticate);

/**
 * GET /api/recommendations
 * Get personalized recommendations for the authenticated user
 */
router.get('/', recommendationController.getRecommendations);

module.exports = router;
