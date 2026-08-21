const badgeService = require('../services/badgeService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Badge Controller
 * Handles HTTP layer for badge endpoints
 */
class BadgeController {
  /**
   * GET /api/badges
   * Get all badges with user's earned state
   */
  async getBadges(req, res) {
    try {
      const userId = req.user.id;
      const badges = await badgeService.getUserBadges(userId);
      return sendSuccess(res, 'Badges retrieved successfully', { badges });
    } catch (error) {
      console.error('Get Badges Error:', error);
      return sendError(res, 'Failed to retrieve badges');
    }
  }
}

module.exports = new BadgeController();
