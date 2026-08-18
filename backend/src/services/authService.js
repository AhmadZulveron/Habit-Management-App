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
   * @param {object} userData - { email, password, name }
   * @returns {object} Created user data (without password)
   */
  async signup({ email, password, name }) {
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
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );

      const userId = userResult.insertId;

      await connection.commit();

      return {
        id: userId,
        email,
        name,
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
      `SELECT id, name, email, password, total_points 
       FROM users 
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
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
        name: user.name,
        email: user.email,
        totalPoints: user.total_points,
      },
    };
  }
}

module.exports = new AuthService();
