import 'package:frontend/core/constants/api_constants.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/models/habit_model.dart';

/// Habit Service
/// Handles habit-related API calls
class HabitService {
  final ApiService _apiService = ApiService();

  /// Create a new habit
  Future<HabitModel> createHabit(Map<String, dynamic> habitData) async {
    final response = await _apiService.post(
      ApiConstants.habits,
      body: habitData,
    );

    if (response.success && response.data != null) {
      return HabitModel.fromJson(response.data['habit']);
    } else {
      throw Exception(response.message);
    }
  }

  /// Get all habits for the authenticated user
  Future<List<HabitModel>> getHabits() async {
    final response = await _apiService.get(ApiConstants.habits);

    if (response.success && response.data != null) {
      final List habits = response.data['habits'];
      return habits.map((h) => HabitModel.fromJson(h)).toList();
    } else {
      throw Exception(response.message);
    }
  }

  /// Get today's habits
  Future<List<HabitModel>> getTodayHabits() async {
    final response = await _apiService.get(ApiConstants.todayHabits);

    if (response.success && response.data != null) {
      final List habits = response.data['habits'];
      return habits.map((h) => HabitModel.fromJson(h)).toList();
    } else {
      throw Exception(response.message);
    }
  }

  /// Get a specific habit by ID
  Future<HabitModel> getHabitById(int id) async {
    final response = await _apiService.get(ApiConstants.habitById(id));

    if (response.success && response.data != null) {
      return HabitModel.fromJson(response.data['habit']);
    } else {
      throw Exception(response.message);
    }
  }

  /// Update a habit
  Future<HabitModel> updateHabit(int id, Map<String, dynamic> habitData) async {
    final response = await _apiService.put(
      ApiConstants.habitById(id),
      body: habitData,
    );

    if (response.success && response.data != null) {
      return HabitModel.fromJson(response.data['habit']);
    } else {
      throw Exception(response.message);
    }
  }

  /// Delete a habit (hard delete)
  Future<void> deleteHabit(int id) async {
    final response = await _apiService.delete(ApiConstants.habitById(id));

    if (!response.success) {
      throw Exception(response.message);
    }
  }

  /// Mark a habit as completed for today
  Future<Map<String, dynamic>> completeHabit(int id) async {
    final response = await _apiService.post(
      ApiConstants.completeHabit(id),
      body: {},
    );

    if (!response.success) {
      throw Exception(response.message);
    }
    
    return response.data ?? {};
  }
}
