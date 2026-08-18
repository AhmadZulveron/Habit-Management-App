const habitService = require('../services/habitService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Habit Controller
 * Handles HTTP layer for habit endpoints
 */
class HabitController {
  /**
   * POST /api/habits
   * Create a new habit
   */
  async createHabit(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, categoryId, priority, target, status, scheduleDays } = req.body;
      const habit = await habitService.createHabit(userId, {
        title,
        description,
        categoryId,
        priority,
        target,
        status,
        scheduleDays,
      });
      return sendSuccess(res, 'Habit created successfully', { habit }, 201);
    } catch (error) {
      console.error('Create Habit Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to create habit';
      return sendError(res, message, status);
    }
  }

  /**
   * GET /api/habits
   * Get all habits for the authenticated user
   */
  async getHabits(req, res) {
    try {
      const userId = req.user.id;
      const habits = await habitService.getHabits(userId);
      return sendSuccess(res, 'Habits retrieved successfully', { habits });
    } catch (error) {
      console.error('Get Habits Error:', error);
      return sendError(res, 'Failed to retrieve habits');
    }
  }

  /**
   * GET /api/habits/today
   * Get today's active habits for the authenticated user
   */
  async getTodayHabits(req, res) {
    try {
      const userId = req.user.id;
      const habits = await habitService.getTodayHabits(userId);
      return sendSuccess(res, "Today's habits retrieved successfully", { habits });
    } catch (error) {
      console.error('Get Today Habits Error:', error);
      return sendError(res, "Failed to retrieve today's habits");
    }
  }

  /**
   * GET /api/habits/:id
   * Get a specific habit by ID
   */
  async getHabitById(req, res) {
    try {
      const userId = req.user.id;
      const habitId = parseInt(req.params.id);
      const habit = await habitService.getHabitById(userId, habitId);
      return sendSuccess(res, 'Habit retrieved successfully', { habit });
    } catch (error) {
      console.error('Get Habit Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to retrieve habit';
      return sendError(res, message, status);
    }
  }

  /**
   * PUT /api/habits/:id
   * Update a habit
   */
  async updateHabit(req, res) {
    try {
      const userId = req.user.id;
      const habitId = parseInt(req.params.id);
      const { title, description, categoryId, priority, target, status, scheduleDays } = req.body;
      const habit = await habitService.updateHabit(userId, habitId, {
        title,
        description,
        categoryId,
        priority,
        target,
        status,
        scheduleDays,
      });
      return sendSuccess(res, 'Habit updated successfully', { habit });
    } catch (error) {
      console.error('Update Habit Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to update habit';
      return sendError(res, message, status);
    }
  }

  /**
   * DELETE /api/habits/:id
   * Delete a habit (hard delete)
   */
  async deleteHabit(req, res) {
    try {
      const userId = req.user.id;
      const habitId = parseInt(req.params.id);
      await habitService.deleteHabit(userId, habitId);
      return sendSuccess(res, 'Habit deleted successfully');
    } catch (error) {
      console.error('Delete Habit Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to delete habit';
      return sendError(res, message, status);
    }
  }

  /**
   * POST /api/habits/:id/complete
   * Mark a habit as completed for today
   */
  async completeHabit(req, res) {
    try {
      const userId = req.user.id;
      const habitId = parseInt(req.params.id);
      const completion = await habitService.completeHabit(userId, habitId);
      return sendSuccess(res, 'Habit completed successfully', { completion }, 201);
    } catch (error) {
      console.error('Complete Habit Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to complete habit';
      return sendError(res, message, status);
    }
  }
}

module.exports = new HabitController();
