import 'package:frontend/core/constants/api_constants.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/models/category_model.dart';

class CategoryService {
  final ApiService _apiService = ApiService();

  /// Fetch all available categories
  Future<List<CategoryModel>> getCategories() async {
    final response = await _apiService.get(ApiConstants.categories);

    if (response.success && response.data != null) {
      final List<dynamic> categoriesData = response.data['categories'] ?? [];
      return categoriesData.map((json) => CategoryModel.fromJson(json)).toList();
    } else {
      throw Exception(response.message.isNotEmpty 
          ? response.message 
          : 'Failed to fetch categories');
    }
  }
}
