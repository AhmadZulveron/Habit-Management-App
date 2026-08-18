const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Category Controller
 * Handles HTTP layer for category endpoints
 */
class CategoryController {
  /**
   * GET /api/categories
   * Get all available categories
   */
  async getCategories(req, res) {
    try {
      const categories = await categoryService.getCategories();
      return sendSuccess(res, 'Categories retrieved successfully', { categories });
    } catch (error) {
      console.error('Get Categories Error:', error);
      return sendError(res, 'Failed to retrieve categories');
    }
  }
}

module.exports = new CategoryController();
