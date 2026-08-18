const { sendSuccess, sendError } = require('../utils/responseHelper');
const reportService = require('../services/reportService');

/**
 * Report Controller
 * 
 * Handles habit completion reports and statistics.
 */
class ReportController {
  /**
   * GET /api/reports
   * Get habit completion report for the authenticated user.
   * Expects query parameters: startDate (YYYY-MM-DD) and endDate (YYYY-MM-DD).
   */
  async getReport(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendError(res, 'startDate and endDate query parameters are required', 400);
      }

      // Regex validation for YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return sendError(res, 'startDate and endDate must be in YYYY-MM-DD format', 400);
      }

      const reportData = await reportService.getWeeklyReport(userId, startDate, endDate);

      return sendSuccess(res, 'Report generated successfully', reportData);
    } catch (error) {
      console.error('Get Report Error:', error);
      return sendError(res, 'Failed to retrieve report');
    }
  }
}

module.exports = new ReportController();
