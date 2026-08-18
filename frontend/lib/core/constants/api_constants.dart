/// API Constants
/// Centralized configuration for all API endpoints
class ApiConstants {
  // Base URL - change this based on your environment
  // For Android Emulator: use 10.0.2.2 (maps to host machine's localhost)
  // For iOS Simulator: use localhost
  // For physical device: use your machine's local IP address
  static const String baseUrl = 'http://192.168.4.101:3000/api';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';

  // Profile endpoints
  static const String profile = '/profile';

  // Habit endpoints
  static const String habits = '/habits';
  static const String todayHabits = '/habits/today';
  static String habitById(int id) => '/habits/$id';
  static String completeHabit(int id) => '/habits/$id/complete';

  // Category endpoints
  static const String categories = '/categories';

  // Recommendation endpoints
  static const String recommendations = '/recommendations';

  // Report endpoints
  static const String reports = '/reports';
}
