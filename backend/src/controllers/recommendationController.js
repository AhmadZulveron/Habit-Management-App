const recommendationService = require('../services/recommendationService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Recommendation Controller
 * Handles HTTP layer for recommendation endpoints
 */
class RecommendationController {
  /**
   * GET /api/recommendations
   * Get personalized recommendations for the authenticated user
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const recommendations = await recommendationService.getRecommendations(userId);
      return sendSuccess(res, 'Recommendations retrieved successfully', { recommendations });
    } catch (error) {
      console.error('Get Recommendations Error:', error);
      return sendError(res, 'Failed to retrieve recommendations');
    }
  }
}

module.exports = new RecommendationController();
