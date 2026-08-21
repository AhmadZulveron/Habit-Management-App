const pool = require('../config/database');
const badgeService = require('./badgeService');
const { quickSort } = require('../engines/quickSort');

const PRIORITY_RANKS = {
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Habit Service
 * Business logic for habit CRUD operations
 */
class HabitService {
  /**
   * Create a new habit with optional schedule
   * @param {number} userId
   * @param {object} habitData
   * @returns {object} Created habit
   */
  async createHabit(userId, habitData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { title, description, categoryId, priority, target, status, scheduleDays } = habitData;

      // Check if category exists
      const [categories] = await connection.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
      if (categories.length === 0) {
        throw { status: 400, message: 'Invalid category ID' };
      }

      // Insert habit
      const [result] = await connection.query(
        `INSERT INTO habits (user_id, category_id, title, description, priority, target, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, categoryId, title, description || null, priority || 'medium', target || 1, status || 'active']
      );

      const habitId = result.insertId;

      // Insert schedule days if provided
      if (scheduleDays && scheduleDays.length > 0) {
        const scheduleValues = scheduleDays.map((day) => [habitId, day]);
        await connection.query(
          'INSERT INTO habit_schedules (habit_id, day_of_week) VALUES ?',
          [scheduleValues]
        );
      }

      await connection.commit();

      return this.getHabitById(userId, habitId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all habits for a user
   * @param {number} userId
   * @returns {Array} List of habits with schedules
   */
  async getHabits(userId) {
    const [habits] = await pool.query(
      `SELECT h.*, 
              c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              GROUP_CONCAT(hs.day_of_week ORDER BY hs.day_of_week) AS schedule_days
       FROM habits h
       LEFT JOIN categories c ON h.category_id = c.id
       LEFT JOIN habit_schedules hs ON h.id = hs.habit_id
       WHERE h.user_id = ?
       GROUP BY h.id`,
      [userId]
    );

    const formattedHabits = habits.map(this._formatHabit);

    const { sortedArray } = quickSort(formattedHabits, (a, b) => {
      const rankA = PRIORITY_RANKS[a.priority] || 0;
      const rankB = PRIORITY_RANKS[b.priority] || 0;
      
      if (rankA !== rankB) {
        return rankB - rankA; // Priority DESC
      }
      
      // Tie-breaker: created_at DESC
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sortedArray;
  }

  /**
   * Get today's active habits for a user
   * Filters by: status = 'active' AND scheduled for today's day_of_week
   * @param {number} userId
   * @returns {Array} Today's habits
   */
  async getTodayHabits(userId) {
    const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    const [habits] = await pool.query(
      `SELECT h.*, 
              c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              GROUP_CONCAT(hs2.day_of_week ORDER BY hs2.day_of_week) AS schedule_days,
              CASE WHEN hc.id IS NOT NULL THEN 1 ELSE 0 END AS is_completed_today
       FROM habits h
       INNER JOIN habit_schedules hs ON h.id = hs.habit_id AND hs.day_of_week = ?
       LEFT JOIN categories c ON h.category_id = c.id
       LEFT JOIN habit_schedules hs2 ON h.id = hs2.habit_id
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND DATE(hc.completed_at) = CURDATE()
       WHERE h.user_id = ? AND h.status = 'active'
       GROUP BY h.id`,
      [todayDayOfWeek, userId]
    );

    const formattedHabits = habits.map(this._formatHabit);

    const { sortedArray } = quickSort(formattedHabits, (a, b) => {
      const rankA = PRIORITY_RANKS[a.priority] || 0;
      const rankB = PRIORITY_RANKS[b.priority] || 0;
      
      if (rankA !== rankB) {
        return rankB - rankA; // Priority DESC
      }
      
      // Tie-breaker: title ASC
      return a.title.localeCompare(b.title);
    });

    return sortedArray;
  }

  /**
   * Get a specific habit by ID
   * @param {number} userId
   * @param {number} habitId
   * @returns {object} Habit with schedule
   */
  async getHabitById(userId, habitId) {
    const [habits] = await pool.query(
      `SELECT h.*, 
              c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              GROUP_CONCAT(hs.day_of_week ORDER BY hs.day_of_week) AS schedule_days
       FROM habits h
       LEFT JOIN categories c ON h.category_id = c.id
       LEFT JOIN habit_schedules hs ON h.id = hs.habit_id
       WHERE h.id = ? AND h.user_id = ?
       GROUP BY h.id`,
      [habitId, userId]
    );

    if (habits.length === 0) {
      throw { status: 404, message: 'Habit not found' };
    }

    return this._formatHabit(habits[0]);
  }

  /**
   * Update a habit
   * @param {number} userId
   * @param {number} habitId
   * @param {object} habitData
   * @returns {object} Updated habit
   */
  async updateHabit(userId, habitId, habitData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership
      const [existing] = await connection.query(
        'SELECT id FROM habits WHERE id = ? AND user_id = ?',
        [habitId, userId]
      );

      if (existing.length === 0) {
        throw { status: 404, message: 'Habit not found' };
      }

      const { title, description, categoryId, priority, target, status, scheduleDays } = habitData;

      if (categoryId !== undefined) {
        const [categories] = await connection.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
        if (categories.length === 0) {
          throw { status: 400, message: 'Invalid category ID' };
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (categoryId !== undefined) { updates.push('category_id = ?'); values.push(categoryId); }
      if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
      if (target !== undefined) { updates.push('target = ?'); values.push(target); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }

      if (updates.length > 0) {
        values.push(habitId, userId);
        await connection.query(
          `UPDATE habits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values
        );
      }

      // Update schedule if provided
      if (scheduleDays !== undefined) {
        await connection.query('DELETE FROM habit_schedules WHERE habit_id = ?', [habitId]);

        if (scheduleDays.length > 0) {
          const scheduleValues = scheduleDays.map((day) => [habitId, day]);
          await connection.query(
            'INSERT INTO habit_schedules (habit_id, day_of_week) VALUES ?',
            [scheduleValues]
          );
        }
      }

      await connection.commit();

      return this.getHabitById(userId, habitId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete a habit (hard delete)
   * @param {number} userId
   * @param {number} habitId
   */
  async deleteHabit(userId, habitId) {
    const [result] = await pool.query(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Habit not found' };
    }

    return { message: 'Habit deleted successfully' };
  }

  /**
   * Mark a habit as completed for today
   * @param {number} userId
   * @param {number} habitId
   */
  async completeHabit(userId, habitId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership, active status, and scheduled for today
      const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      const [habits] = await connection.query(
        `SELECT h.id, h.status, hs.id AS schedule_id
         FROM habits h
         LEFT JOIN habit_schedules hs ON h.id = hs.habit_id AND hs.day_of_week = ?
         WHERE h.id = ? AND h.user_id = ?`,
        [todayDayOfWeek, habitId, userId]
      );

      if (habits.length === 0) {
        throw { status: 404, message: 'Habit not found' };
      }
      
      const habit = habits[0];
      if (habit.status !== 'active') {
        throw { status: 400, message: 'Habit is inactive and cannot be completed' };
      }
      if (!habit.schedule_id) {
        throw { status: 400, message: 'Habit is not scheduled for today' };
      }

      // Check if already completed today
      const [completions] = await connection.query(
        'SELECT id FROM habit_completions WHERE habit_id = ? AND DATE(completed_at) = CURDATE()',
        [habitId]
      );

      if (completions.length > 0) {
        throw { status: 409, message: 'Habit already completed for today' };
      }

      const pointsToAward = 10;

      // Insert completion
      const [result] = await connection.query(
        'INSERT INTO habit_completions (habit_id, points_earned) VALUES (?, ?)',
        [habitId, pointsToAward]
      );

      // Award points to user
      await connection.query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [pointsToAward, userId]
      );

      await connection.commit();
      connection.release();

      // ==========================================
      // BADGE EVALUATION (OUTSIDE TRANSACTION)
      // ==========================================
      let earnedBadges = [];
      try {
        earnedBadges = await badgeService.evaluateAndAwardBadges(userId);
      } catch (badgeError) {
        console.error('Badge evaluation failed after habit completion:', badgeError);
        // Swallow error: habit completion succeeded, do not fail the request
      }

      return {
        id: result.insertId,
        habitId,
        pointsEarned: pointsToAward,
        earned_badges: earnedBadges,
      };
    } catch (error) {
      await connection.rollback();
      if (connection) connection.release();
      throw error;
    }
  }

  /**
   * Format habit data for response
   * @private
   */
  _formatHabit(habit) {
    return {
      id: habit.id,
      userId: habit.user_id,
      title: habit.title,
      description: habit.description,
      categoryId: habit.category_id,
      categoryName: habit.category_name,
      categoryIcon: habit.category_icon,
      categoryColor: habit.category_color,
      priority: habit.priority,
      target: habit.target,
      status: habit.status,
      scheduleDays: habit.schedule_days
        ? habit.schedule_days.split(',').map(Number)
        : [],
      isCompletedToday: habit.is_completed_today === 1 || false,
      createdAt: habit.created_at,
      updatedAt: habit.updated_at,
    };
  }
}

module.exports = new HabitService();
