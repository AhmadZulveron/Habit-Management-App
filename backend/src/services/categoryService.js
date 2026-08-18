const pool = require('../config/database');

/**
 * Category Service
 * Handles business logic for categories
 */
class CategoryService {
  /**
   * Get all categories
   * @returns {Array} List of categories
   */
  async getCategories() {
    const [categories] = await pool.query(
      `SELECT id, name, icon, color 
       FROM categories 
       ORDER BY id ASC`
    );

    return categories;
  }
}

module.exports = new CategoryService();
