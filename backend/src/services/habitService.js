const pool = require('../config/database');

/**
 * Habit Service
 * Business logic for habit CRUD operations
 */
class HabitService {
  /**
   * Create a new habit with optional schedule
   * @param {number} userId
   * @param {object} habitData - { name, description, category, priorityLevel, scheduleDays, reminderTime }
   * @returns {object} Created habit
   */
  async createHabit(userId, habitData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { name, description, category, priorityLevel, scheduleDays, reminderTime } = habitData;

      // Insert habit
      const [result] = await connection.query(
        `INSERT INTO habits (user_id, name, description, category, priority_level)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name, description || null, category || null, priorityLevel || 'medium']
      );

      const habitId = result.insertId;

      // Insert schedule days if provided
      // scheduleDays is an array of integers (0-6), e.g. [1, 2, 3, 4, 5] for weekdays
      if (scheduleDays && scheduleDays.length > 0) {
        const scheduleValues = scheduleDays.map((day) => [habitId, day, reminderTime || null]);
        await connection.query(
          'INSERT INTO habit_schedules (habit_id, day_of_week, reminder_time) VALUES ?',
          [scheduleValues]
        );
      }

      await connection.commit();

      // Return the created habit with schedule
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
              GROUP_CONCAT(hs.day_of_week ORDER BY hs.day_of_week) AS schedule_days,
              hs.reminder_time
       FROM habits h
       LEFT JOIN habit_schedules hs ON h.id = hs.habit_id
       WHERE h.user_id = ?
       GROUP BY h.id
       ORDER BY h.created_at DESC`,
      [userId]
    );

    return habits.map(this._formatHabit);
  }

  /**
   * Get today's active habits for a user
   * Filters by: is_active = true AND scheduled for today's day_of_week
   * @param {number} userId
   * @returns {Array} Today's habits
   */
  async getTodayHabits(userId) {
    const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    const [habits] = await pool.query(
      `SELECT h.*, 
              GROUP_CONCAT(hs2.day_of_week ORDER BY hs2.day_of_week) AS schedule_days,
              hs2.reminder_time,
              CASE WHEN hc.id IS NOT NULL THEN 1 ELSE 0 END AS is_completed_today
       FROM habits h
       INNER JOIN habit_schedules hs ON h.id = hs.habit_id AND hs.day_of_week = ?
       LEFT JOIN habit_schedules hs2 ON h.id = hs2.habit_id
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = CURDATE()
       WHERE h.user_id = ? AND h.is_active = 1
       GROUP BY h.id
       ORDER BY FIELD(h.priority_level, 'high', 'medium', 'low'), h.name`,
      [todayDayOfWeek, userId]
    );

    return habits.map(this._formatHabit);
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
              GROUP_CONCAT(hs.day_of_week ORDER BY hs.day_of_week) AS schedule_days,
              hs.reminder_time
       FROM habits h
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

      const { name, description, category, priorityLevel, isActive, scheduleDays, reminderTime } = habitData;

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (name !== undefined) { updates.push('name = ?'); values.push(name); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (category !== undefined) { updates.push('category = ?'); values.push(category); }
      if (priorityLevel !== undefined) { updates.push('priority_level = ?'); values.push(priorityLevel); }
      if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

      if (updates.length > 0) {
        values.push(habitId, userId);
        await connection.query(
          `UPDATE habits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values
        );
      }

      // Update schedule if provided
      if (scheduleDays !== undefined) {
        // Remove existing schedule
        await connection.query('DELETE FROM habit_schedules WHERE habit_id = ?', [habitId]);

        // Insert new schedule
        if (scheduleDays.length > 0) {
          const scheduleValues = scheduleDays.map((day) => [habitId, day, reminderTime || null]);
          await connection.query(
            'INSERT INTO habit_schedules (habit_id, day_of_week, reminder_time) VALUES ?',
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
   * Delete (deactivate) a habit
   * Soft delete by setting is_active = 0
   * @param {number} userId
   * @param {number} habitId
   */
  async deleteHabit(userId, habitId) {
    const [result] = await pool.query(
      'UPDATE habits SET is_active = 0 WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (result.affectedRows === 0) {
      throw { status: 404, message: 'Habit not found' };
    }

    return { message: 'Habit deactivated successfully' };
  }

  /**
   * Mark a habit as completed for today
   * @param {number} userId
   * @param {number} habitId
   * @param {string} notes - Optional notes
   */
  async completeHabit(userId, habitId, notes) {
    // Verify ownership
    const [habits] = await pool.query(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (habits.length === 0) {
      throw { status: 404, message: 'Habit not found' };
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const [result] = await pool.query(
        `INSERT INTO habit_completions (habit_id, user_id, completed_date, notes)
         VALUES (?, ?, ?, ?)`,
        [habitId, userId, today, notes || null]
      );

      return {
        id: result.insertId,
        habitId,
        completedDate: today,
        notes: notes || null,
      };
    } catch (error) {
      // Duplicate entry means already completed today
      if (error.code === 'ER_DUP_ENTRY') {
        throw { status: 409, message: 'Habit already completed for today' };
      }
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
      name: habit.name,
      description: habit.description,
      category: habit.category,
      priorityLevel: habit.priority_level,
      isActive: habit.is_active === 1,
      scheduleDays: habit.schedule_days
        ? habit.schedule_days.split(',').map(Number)
        : [],
      reminderTime: habit.reminder_time || null,
      isCompletedToday: habit.is_completed_today === 1 || false,
      createdAt: habit.created_at,
      updatedAt: habit.updated_at,
    };
  }
}

module.exports = new HabitService();
