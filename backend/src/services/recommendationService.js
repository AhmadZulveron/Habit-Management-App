const pool = require('../config/database');
const { evaluateRules } = require('../engines/ruleEngine');
const { calculateScores } = require('../engines/scoringEngine');

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
 * Final target architecture: Rule Engine → Scoring Engine → QuickSort
 * 
 * Current Phase D implementation status: 
 * Rule Engine active; Scoring Engine active; QuickSort not yet integrated.
 */
class RecommendationService {
  /**
   * Get personalized recommendations for a user
   * 
   * @param {number} userId
   * @returns {Object} { userContext: [...], candidates: [...] } evaluated by the Rule Engine
   */
  async getRecommendations(userId) {
    // Step 1: Fetch user context
    const userContext = await this._getUserContext(userId);

    // Step 2: Fetch all recommendation candidates from habit_templates with category info
    const [templates] = await pool.query(`
      SELECT 
        ht.id, ht.title, ht.description, ht.difficulty, ht.priority, ht.popularity_score,
        c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM habit_templates ht
      JOIN categories c ON ht.category_id = c.id
    `);

    // Phase C: Apply Rule Engine
    // 1. Evaluate context and filter eligible templates
    // 2. Attach reasons to eligible candidates
    const ruleEngineResult = evaluateRules(userContext, templates);

    // Phase D: Apply Scoring Engine
    // Calculates a numeric relevanceScore for each remaining eligible candidate.
    const scoredCandidates = calculateScores(userContext, ruleEngineResult.candidates);

    // Phase E: Apply QuickSort
    // Sort scored candidates by relevanceScore DESC using Lomuto Median-of-Three
    const { quickSort } = require('../engines/quickSort');
    const { sortedArray, metrics } = quickSort(scoredCandidates, (a, b) => b.relevanceScore - a.relevanceScore);
    
    ruleEngineResult.candidates = sortedArray;
    ruleEngineResult.sortMetrics = metrics;

    return ruleEngineResult;
  }

  /**
   * Fetch user context data for recommendation engine
   * @private
   * @param {number} userId
   * @returns {object} User context with habits, completions, profile, points
   */
  async _getUserContext(userId) {
    // Fetch ALL user habits (active and inactive) for duplicate checking and context evaluation
    const [habits] = await pool.query(
      "SELECT * FROM habits WHERE user_id = ?",
      [userId]
    );

    // Fetch ALL lifetime completions (needed for Completion Rate)
    const [completions] = await pool.query(
      `SELECT hc.* FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE h.user_id = ?
       ORDER BY hc.completed_at DESC`,
      [userId]
    );

    // Fetch schedules for active habits (needed for Completion Rate denominator)
    const [schedules] = await pool.query(
      `SELECT hs.* FROM habit_schedules hs
       JOIN habits h ON hs.habit_id = h.id
       WHERE h.user_id = ? AND h.status = 'active'`,
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
      schedules,
      completionHistory: completions,
      profile: users[0] || null,
    };
  }
}

module.exports = new RecommendationService();
