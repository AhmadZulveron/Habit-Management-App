import 'package:flutter/material.dart';
import 'package:frontend/models/badge_model.dart';
import 'package:frontend/services/badge_service.dart';

/// Badge Provider
/// Manages badge state across the application
class BadgeProvider with ChangeNotifier {
  final BadgeService _badgeService = BadgeService();

  List<BadgeModel> _badges = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<BadgeModel> get badges => _badges;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch all badges
  Future<void> fetchBadges() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _badges = await _badgeService.getBadges();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }
}
