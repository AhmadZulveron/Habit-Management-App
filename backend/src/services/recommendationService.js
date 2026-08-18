const pool = require('../config/database');
const { evaluateRules } = require('../engines/ruleEngine');
const { calculateScores } = require('../engines/scoringEngine');
const { quickSort } = require('../engines/quickSort');

/**
 * Recommendation Service
 * 
 * Orchestrates the recommendation pipeline:
 * 1. Fetch user context (habits, completions, profile, points)
 * 2. Fetch available recommendation templates
 * 3. Rule Engine: filter applicable templates
 * 4. Scoring Engine: calculate relevance scores
 * 5. QuickSort: sort by relevance score descending
 * 6. Return sorted recommendations
 * 
 * This service currently provides placeholder functionality.
 * Full implementation will be completed in the next development phase.
 */
class RecommendationService {
  /**
   * Get personalized recommendations for a user
   * 
   * @param {number} userId
   * @returns {Array} Sorted recommendations with relevance scores
   */
  async getRecommendations(userId) {
    // Step 1: Fetch user context
    const userContext = await this._getUserContext(userId);

    // Step 2: Fetch all recommendation candidates from habit_templates
    const [templates] = await pool.query(
      'SELECT * FROM habit_templates'
    );

    // Step 3: Rule Engine - filter applicable recommendations
    const filteredRecommendations = evaluateRules(userContext, templates);

    // Step 4: Scoring Engine - calculate relevance scores
    const scoredRecommendations = calculateScores(
      userContext,
      filteredRecommendations,
      {} // Rule results placeholder
    );

    // Step 5: QuickSort - sort by relevance score descending
    // NOTE: Using custom QuickSort, NOT Array.sort()
    quickSort(scoredRecommendations, (a, b) => b.relevanceScore - a.relevanceScore);

    return scoredRecommendations;
  }

  /**
   * Fetch user context data for recommendation engine
   * @private
   * @param {number} userId
   * @returns {object} User context with habits, completions, profile, points
   */
  async _getUserContext(userId) {
    // Fetch user habits
    const [habits] = await pool.query(
      "SELECT * FROM habits WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    // Fetch recent completions (last 30 days)
    const [completions] = await pool.query(
      `SELECT hc.* FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE h.user_id = ? AND hc.completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY hc.completed_at DESC`,
      [userId]
    );

    // Fetch user profile & points
    const [users] = await pool.query(
      'SELECT id, name, email, total_points, created_at FROM users WHERE id = ?',
      [userId]
    );

    return {
      userId,
      habits,
      completionHistory: completions,
      profile: users[0] || null,
    };
  }
}

module.exports = new RecommendationService();
