import 'dart:convert';
import 'package:frontend/models/user_model.dart';

void main() {
  final jsonString = '{"success":true,"message":"Profile updated successfully","data":{"profile":{"id":1,"name":"Test User","email":"achmadyuandrisk@gmail.com","totalPoints":60,"memberSince":"2026-08-18T19:16:33.000Z"}}}';
  final response = jsonDecode(jsonString);
  
  if (response['success'] == true && response['data'] != null) {
    try {
      final user = UserModel.fromJson(response['data']['profile']);
      print('Success: ${user.name}');
    } catch (e) {
      print('Error parsing UserModel: $e');
    }
  }
}
