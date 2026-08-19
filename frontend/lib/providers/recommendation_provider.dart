import 'package:flutter/foundation.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/core/constants/api_constants.dart';

class RecommendationModel {
  final int id;
  final String title;
  final String description;
  final String difficulty;
  final String priority;
  final int categoryId;
  final String categoryName;
  final String? categoryIcon;
  final String? categoryColor;
  
  // Future fields
  final double? relevanceScore;
  
  // Phase C Rule Engine
  final List<String> matchedRules;
  final String? reason;

  RecommendationModel({
    required this.id,
    required this.title,
    required this.description,
    required this.difficulty,
    required this.priority,
    required this.categoryId,
    required this.categoryName,
    this.categoryIcon,
    this.categoryColor,
    this.relevanceScore,
    this.matchedRules = const [],
    this.reason,
  });

  factory RecommendationModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedMatchedRules = [];
    if (json['matchedRules'] != null) {
      parsedMatchedRules = List<String>.from(json['matchedRules']);
    }

    String? parsedReason;
    if (json['candidateReasons'] != null && (json['candidateReasons'] as List).isNotEmpty) {
      parsedReason = json['candidateReasons'][0]['text'] as String?;
    } else {
      parsedReason = json['reason'] as String?; // Fallback if backend still returns old format
    }

    return RecommendationModel(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      difficulty: json['difficulty'] as String? ?? 'easy',
      priority: json['priority'] as String? ?? 'medium',
      categoryId: json['category_id'] as int,
      categoryName: json['category_name'] as String,
      categoryIcon: json['category_icon'] as String?,
      categoryColor: json['category_color'] as String?,
      relevanceScore: json['relevanceScore'] != null ? (json['relevanceScore'] as num).toDouble() : null,
      matchedRules: parsedMatchedRules,
      reason: parsedReason,
    );
  }
}

class RecommendationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<RecommendationModel> _recommendations = [];
  bool _isLoading = false;
  String _error = '';

  List<RecommendationModel> get recommendations => _recommendations;
  bool get isLoading => _isLoading;
  String get error => _error;

  Future<void> fetchRecommendations() async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final response = await _apiService.get(ApiConstants.recommendations);
      
      if (response.success && response.data != null) {
        final dynamic data = response.data['recommendations'];
        List<dynamic> candidates = [];
        
        if (data is List) {
          candidates = data; // Fallback for old raw array response
        } else if (data is Map<String, dynamic> && data['candidates'] != null) {
          candidates = data['candidates']; // New Phase C response structure
        }

        _recommendations = candidates.map((json) => RecommendationModel.fromJson(json)).toList();
      } else {
        _error = response.message;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
