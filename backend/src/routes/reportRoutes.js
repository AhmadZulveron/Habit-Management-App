const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

/**
 * GET /api/reports
 * Get habit completion report (placeholder)
 */
router.get('/', reportController.getReport);

module.exports = router;
