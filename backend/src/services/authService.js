const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { env } = require('../config/env');

const SALT_ROUNDS = 10;

/**
 * Auth Service
 * Handles business logic for user authentication
 */
class AuthService {
  /**
   * Register a new user
   * @param {object} userData - { email, password, fullName }
   * @returns {object} Created user data (without password)
   */
  async signup({ email, password, fullName }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if email already exists
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        throw { status: 409, message: 'Email is already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
      );

      const userId = userResult.insertId;

      // Create user profile
      await connection.query(
        'INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)',
        [userId, fullName]
      );

      // Initialize user points
      await connection.query(
        'INSERT INTO user_points (user_id) VALUES (?)',
        [userId]
      );

      await connection.commit();

      return {
        id: userId,
        email,
        fullName,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Authenticate user and generate JWT
   * @param {object} credentials - { email, password }
   * @returns {object} { token, user }
   */
  async login({ email, password }) {
    // Find user by email
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, 
              up.full_name, up.avatar_url
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const user = users[0];

    if (!user.is_active) {
      throw { status: 403, message: 'Account is deactivated' };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
      },
    };
  }
}

module.exports = new AuthService();
