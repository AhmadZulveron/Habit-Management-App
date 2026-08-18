/**
 * Scoring Engine
 * 
 * Calculates relevance scores for recommendations based on
 * user context and rule evaluation results.
 * 
 * Architecture flow:
 * Rule Engine → Scoring Engine → QuickSort → Sorted Recommendations
 * 
 * This module is a placeholder structure.
 * Scoring formulas and weights will be defined in the next development phase.
 * 
 * DO NOT assign arbitrary scores (e.g., relevance_score = 100 for new users)
 * without clear rules and justification.
 */

/**
 * Calculate relevance score for a single recommendation
 * 
 * @param {object} userContext - User data including:
 *   - userId: number
 *   - habits: Array of user's current habits
 *   - completionHistory: Array of recent completions
 *   - profile: User profile data
 *   - points: User points and streaks
 * @param {object} recommendation - The recommendation to score
 * @param {object} ruleResults - Results from rule engine evaluation
 * @returns {number} Calculated relevance score
 * 
 * TODO: Implement scoring formula in next phase
 * Possible scoring factors:
 * - Category relevance
 * - User activity level
 * - Completion rate
 * - Diversity of habits
 * - Time-based factors
 */
function calculateScore(userContext, recommendation, ruleResults) {
  // Placeholder: returns 0 as default score
  // Will be replaced with actual scoring formula
  return 0;
}

/**
 * Calculate scores for multiple recommendations
 * 
 * @param {object} userContext - User data
 * @param {Array} recommendations - Filtered recommendations from rule engine
 * @param {object} ruleResults - Results from rule engine
 * @returns {Array} Recommendations with relevanceScore property added
 * 
 * TODO: Implement batch scoring
 */
function calculateScores(userContext, recommendations, ruleResults) {
  // Placeholder: adds relevanceScore = 0 to each recommendation
  return recommendations.map((rec) => ({
    ...rec,
    relevanceScore: calculateScore(userContext, rec, ruleResults),
  }));
}

module.exports = {
  calculateScore,
  calculateScores,
};
