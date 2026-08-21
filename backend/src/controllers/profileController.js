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
        `SELECT id, name, email, total_points, created_at AS member_since
         FROM users
         WHERE id = ?`,
        [userId]
      );

      if (profiles.length === 0) {
        return sendError(res, 'Profile not found', 404);
      }

      const profile = profiles[0];

      return sendSuccess(res, 'Profile retrieved successfully', {
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          totalPoints: profile.total_points,
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
      const { name, email } = req.body;

      const updates = [];
      const values = [];

      if (name !== undefined) { updates.push('name = ?'); values.push(name); }
      if (email !== undefined) {
        // Check if email already exists for another user
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length > 0) {
          return sendError(res, 'Email is already in use by another account', 400);
        }
        updates.push('email = ?'); values.push(email);
      }

      if (updates.length === 0) {
        return sendError(res, 'No fields to update', 400);
      }

      values.push(userId);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Return updated profile
      const [profiles] = await pool.query(
        `SELECT id, name, email, total_points, created_at AS member_since
         FROM users
         WHERE id = ?`,
        [userId]
      );
      const profile = profiles[0];
      return sendSuccess(res, 'Profile updated successfully', {
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          totalPoints: profile.total_points,
          memberSince: profile.member_since,
        },
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      return sendError(res, 'Failed to update profile');
    }
  }
}

module.exports = new ProfileController();
