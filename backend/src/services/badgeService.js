const pool = require('../config/database');
const { calculateMaxStreak } = require('../utils/streakHelper');

class BadgeService {
  /**
   * Evaluates the user's current progress against badge criteria,
   * awards any newly earned badges, and returns ONLY the newly earned badges.
   * Duplicate awards are prevented via INSERT IGNORE and the database UNIQUE constraint.
   * 
   * @param {number} userId 
   * @returns {Promise<Array>} List of newly earned badges
   */
  async evaluateAndAwardBadges(userId) {
    const connection = await pool.getConnection();
    
    try {
      // 1. Get all available badges
      const [allBadges] = await connection.query('SELECT * FROM badges');
      if (allBadges.length === 0) return []; // No badges to award

      // 2. Get user's active habits, schedules, and completions for streak calculation
      const [habits] = await connection.query(
        'SELECT id, created_at, status FROM habits WHERE user_id = ? AND status = "active"', 
        [userId]
      );
      
      let maxStreak = 0;
      let totalCompletions = 0;

      if (habits.length > 0) {
        const habitIds = habits.map(h => h.id);
        
        // Get schedules
        const [schedules] = await connection.query(
          'SELECT habit_id, day_of_week FROM habit_schedules WHERE habit_id IN (?)',
          [habitIds]
        );

        // Get completions (all time for these habits)
        const [completions] = await connection.query(
          'SELECT habit_id, completed_at FROM habit_completions WHERE habit_id IN (?)',
          [habitIds]
        );
        
        // Count total completions across ALL habits for the user (not just active)
        const [totalCompletionsResult] = await connection.query(
          `SELECT COUNT(*) as total 
           FROM habit_completions hc 
           JOIN habits h ON hc.habit_id = h.id 
           WHERE h.user_id = ?`,
          [userId]
        );
        totalCompletions = totalCompletionsResult[0].total;

        // Calculate global max streak using the shared helper
        const todayDate = new Date();
        maxStreak = calculateMaxStreak(habits, completions, schedules, todayDate);
      } else {
        // Even if no active habits, get total completions
        const [totalCompletionsResult] = await connection.query(
          `SELECT COUNT(*) as total 
           FROM habit_completions hc 
           JOIN habits h ON hc.habit_id = h.id 
           WHERE h.user_id = ?`,
          [userId]
        );
        totalCompletions = totalCompletionsResult[0].total;
      }

      // 3. Determine which badges are eligible
      const eligibleBadges = allBadges.filter(badge => {
        if (badge.badge_type === 'total_completions') {
          return totalCompletions >= badge.requirement_value;
        } else if (badge.badge_type === 'streak') {
          return maxStreak >= badge.requirement_value;
        }
        return false;
      });

      if (eligibleBadges.length === 0) return [];

      // 4. Get already earned badges
      const eligibleBadgeIds = eligibleBadges.map(b => b.id);
      const [existingUserBadges] = await connection.query(
        'SELECT badge_id FROM user_badges WHERE user_id = ? AND badge_id IN (?)',
        [userId, eligibleBadgeIds]
      );
      
      const existingBadgeIdSet = new Set(existingUserBadges.map(ub => ub.badge_id));
      
      // 5. Filter for newly earned badges
      const newlyEarnedBadges = eligibleBadges.filter(b => !existingBadgeIdSet.has(b.id));

      if (newlyEarnedBadges.length === 0) return [];

      // 6. Insert newly earned badges using INSERT IGNORE to be absolutely safe
      const insertValues = newlyEarnedBadges.map(b => [userId, b.id]);
      await connection.query(
        'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES ?',
        [insertValues]
      );

      return newlyEarnedBadges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        criteriaType: b.badge_type,
        criteriaValue: b.requirement_value,
        isEarned: true,
        earnedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error evaluating badges:', error);
      throw error; // Rethrow so the caller can decide to swallow it
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieves all badges for the system, decorating them with the user's earned state.
   * 
   * @param {number} userId 
   * @returns {Promise<Array>} List of badges with isEarned flags
   */
  async getUserBadges(userId) {
    const [badges] = await pool.query(
      `SELECT b.*, ub.earned_at 
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
       ORDER BY badge_type DESC, requirement_value ASC`,
      [userId]
    );

    return badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      criteriaType: b.badge_type,
      criteriaValue: b.requirement_value,
      isEarned: b.earned_at !== null,
      earnedAt: b.earned_at
    }));
  }
}

module.exports = new BadgeService();
