import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:frontend/core/constants/api_constants.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// API Service
/// Centralized HTTP client for communicating with the backend REST API.
/// Handles JWT token injection, error handling, and response parsing.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  static const String _tokenKey = 'jwt_token';

  // ================================
  // Token Management
  // ================================

  /// Store JWT token securely
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
  }

  /// Retrieve stored JWT token
  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  /// Remove stored JWT token
  Future<void> removeToken() async {
    await _secureStorage.delete(key: _tokenKey);
  }

  /// Check if user has a stored token
  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ================================
  // HTTP Methods
  // ================================

  /// Build headers with optional JWT token
  Future<Map<String, String>> _buildHeaders({bool requireAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  /// GET request
  Future<ApiResponse> get(String endpoint, {bool requireAuth = true}) async {
    try {
      final headers = await _buildHeaders(requireAuth: requireAuth);
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: headers,
      );
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection error: ${e.toString()}',
        statusCode: 0,
      );
    }
  }

  /// POST request
  Future<ApiResponse> post(String endpoint,
      {Map<String, dynamic>? body, bool requireAuth = true}) async {
    try {
      final headers = await _buildHeaders(requireAuth: requireAuth);
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection error: ${e.toString()}',
        statusCode: 0,
      );
    }
  }

  /// PUT request
  Future<ApiResponse> put(String endpoint,
      {Map<String, dynamic>? body, bool requireAuth = true}) async {
    try {
      final headers = await _buildHeaders(requireAuth: requireAuth);
      final response = await http.put(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection error: ${e.toString()}',
        statusCode: 0,
      );
    }
  }

  /// DELETE request
  Future<ApiResponse> delete(String endpoint,
      {bool requireAuth = true}) async {
    try {
      final headers = await _buildHeaders(requireAuth: requireAuth);
      final response = await http.delete(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: headers,
      );
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Connection error: ${e.toString()}',
        statusCode: 0,
      );
    }
  }

  /// Handle HTTP response and parse JSON
  ApiResponse _handleResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      return ApiResponse(
        success: body['success'] ?? false,
        message: body['message'] ?? '',
        data: body['data'],
        errors: body['errors'],
        statusCode: response.statusCode,
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Failed to parse server response',
        statusCode: response.statusCode,
      );
    }
  }
}

/// Standardized API Response model
class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final dynamic errors;
  final int statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.errors,
    required this.statusCode,
  });
}
