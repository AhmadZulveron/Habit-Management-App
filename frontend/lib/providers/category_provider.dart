import 'package:flutter/material.dart';
import 'package:frontend/models/category_model.dart';
import 'package:frontend/services/category_service.dart';

class CategoryProvider with ChangeNotifier {
  final CategoryService _categoryService = CategoryService();

  List<CategoryModel> _categories = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  /// Fetch categories from the backend
  Future<void> fetchCategories() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      _categories = await _categoryService.getCategories();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
