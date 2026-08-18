const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Require authentication for category routes to match other endpoints
router.use(authenticate);

/**
 * GET /api/categories
 * Get all available categories
 */
router.get('/', categoryController.getCategories);

module.exports = router;
