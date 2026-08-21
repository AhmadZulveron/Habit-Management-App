import 'package:flutter/material.dart';
import 'package:frontend/models/habit_model.dart';
import 'package:frontend/models/badge_model.dart';
import 'package:frontend/services/habit_service.dart';

/// Habit Provider
/// Manages habit state across the application
class HabitProvider with ChangeNotifier {
  final HabitService _habitService = HabitService();

  List<HabitModel> _habits = [];
  List<HabitModel> _todayHabits = [];
  HabitModel? _selectedHabit;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<HabitModel> get habits => _habits;
  List<HabitModel> get todayHabits => _todayHabits;
  HabitModel? get selectedHabit => _selectedHabit;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch all habits
  Future<void> fetchHabits() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _habits = await _habitService.getHabits();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch today's habits
  Future<void> fetchTodayHabits() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _todayHabits = await _habitService.getTodayHabits();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch a specific habit
  Future<void> fetchHabitById(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedHabit = await _habitService.getHabitById(id);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Create a new habit
  Future<bool> createHabit(Map<String, dynamic> habitData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final habit = await _habitService.createHabit(habitData);
      _habits.insert(0, habit);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Update a habit
  Future<bool> updateHabit(int id, Map<String, dynamic> habitData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedHabit = await _habitService.updateHabit(id, habitData);
      final index = _habits.indexWhere((h) => h.id == id);
      if (index != -1) {
        _habits[index] = updatedHabit;
      }
      _selectedHabit = updatedHabit;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Delete a habit (hard delete)
  Future<bool> deleteHabit(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _habitService.deleteHabit(id);
      _habits.removeWhere((h) => h.id == id);
      _todayHabits.removeWhere((h) => h.id == id);
      if (_selectedHabit?.id == id) {
        _selectedHabit = null;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Complete a habit for today
  Future<Map<String, dynamic>> completeHabit(int id) async {
    try {
      final data = await _habitService.completeHabit(id);
      // Refresh today's habits to update completion status
      await fetchTodayHabits();
      
      // Parse badges if present
      List<BadgeModel> earnedBadges = [];
      if (data['completion'] != null && data['completion']['earned_badges'] != null) {
        final badgesData = data['completion']['earned_badges'] as List;
        earnedBadges = badgesData.map((b) => BadgeModel.fromJson(b)).toList();
      }

      return {'success': true, 'earnedBadges': earnedBadges};
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return {'success': false, 'earnedBadges': []};
    }
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
