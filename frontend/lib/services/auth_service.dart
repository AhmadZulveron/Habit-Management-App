import 'package:frontend/core/constants/api_constants.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/models/user_model.dart';

/// Auth Service
/// Handles authentication-related API calls
class AuthService {
  final ApiService _apiService = ApiService();

  /// Login with email and password
  /// Returns UserModel on success, throws on failure
  Future<UserModel> login(String email, String password) async {
    final response = await _apiService.post(
      ApiConstants.login,
      body: {
        'email': email,
        'password': password,
      },
      requireAuth: false,
    );

    if (response.success && response.data != null) {
      // Store the JWT token securely
      final token = response.data['token'];
      await _apiService.saveToken(token);

      // Parse and return user data
      return UserModel.fromJson(response.data['user']);
    } else {
      throw Exception(response.message);
    }
  }

  /// Register a new user
  /// Returns UserModel on success, throws on failure
  Future<UserModel> signup(String email, String password, String fullName) async {
    final response = await _apiService.post(
      ApiConstants.signup,
      body: {
        'email': email,
        'password': password,
        'fullName': fullName,
      },
      requireAuth: false,
    );

    if (response.success && response.data != null) {
      return UserModel.fromJson(response.data['user']);
    } else {
      throw Exception(response.message);
    }
  }

  /// Logout - remove stored token
  Future<void> logout() async {
    await _apiService.removeToken();
  }

  /// Check if user is logged in (has stored token)
  Future<bool> isLoggedIn() async {
    return await _apiService.hasToken();
  }

  /// Get stored token
  Future<String?> getToken() async {
    return await _apiService.getToken();
  }
}
