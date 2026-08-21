import 'package:frontend/core/constants/api_constants.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/models/badge_model.dart';

/// Badge Service
/// Handles badge-related API calls
class BadgeService {
  final ApiService _apiService = ApiService();

  /// Get all badges and user's earned state
  Future<List<BadgeModel>> getBadges() async {
    final response = await _apiService.get(ApiConstants.badges);

    if (response.success && response.data != null) {
      final List badges = response.data['badges'];
      return badges.map((b) => BadgeModel.fromJson(b)).toList();
    } else {
      throw Exception(response.message);
    }
  }
}
