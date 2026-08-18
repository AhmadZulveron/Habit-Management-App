const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Auth Controller
 * Handles HTTP layer for authentication endpoints
 */
class AuthController {
  /**
   * POST /api/auth/signup
   * Register a new user
   */
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;

      const user = await authService.signup({ email, password, name });

      return sendSuccess(res, 'User registered successfully', { user }, 201);
    } catch (error) {
      console.error('Signup Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to register user';
      return sendError(res, message, status);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      return sendSuccess(res, 'Login successful', result);
    } catch (error) {
      console.error('Login Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Failed to login';
      return sendError(res, message, status);
    }
  }
}

module.exports = new AuthController();
