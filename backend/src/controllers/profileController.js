const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Profile Controller
 * Handles HTTP layer for user profile endpoints
 */
class ProfileController {
  /**
   * GET /api/profile
   * Get authenticated user's profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const [profiles] = await pool.query(
        `SELECT u.id, u.email, u.created_at AS member_since,
                up.full_name, up.date_of_birth, up.gender, up.avatar_url,
                upt.total_points, upt.current_streak, upt.longest_streak
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         LEFT JOIN user_points upt ON u.id = upt.user_id
         WHERE u.id = ?`,
        [userId]
      );

      if (profiles.length === 0) {
        return sendError(res, 'Profile not found', 404);
      }

      const profile = profiles[0];

      return sendSuccess(res, 'Profile retrieved successfully', {
        profile: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender,
          avatarUrl: profile.avatar_url,
          totalPoints: profile.total_points,
          currentStreak: profile.current_streak,
          longestStreak: profile.longest_streak,
          memberSince: profile.member_since,
        },
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      return sendError(res, 'Failed to retrieve profile');
    }
  }

  /**
   * PUT /api/profile
   * Update authenticated user's profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { fullName, dateOfBirth, gender, avatarUrl } = req.body;

      const updates = [];
      const values = [];

      if (fullName !== undefined) { updates.push('full_name = ?'); values.push(fullName); }
      if (dateOfBirth !== undefined) { updates.push('date_of_birth = ?'); values.push(dateOfBirth); }
      if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
      if (avatarUrl !== undefined) { updates.push('avatar_url = ?'); values.push(avatarUrl); }

      if (updates.length === 0) {
        return sendError(res, 'No fields to update', 400);
      }

      values.push(userId);
      await pool.query(
        `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      // Return updated profile
      return this.getProfile(req, res);
    } catch (error) {
      console.error('Update Profile Error:', error);
      return sendError(res, 'Failed to update profile');
    }
  }
}

module.exports = new ProfileController();
