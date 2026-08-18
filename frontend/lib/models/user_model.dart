/// User Model
/// Represents user data received from the API
class UserModel {
  final int id;
  final String email;
  final String? fullName;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      fullName: json['fullName'],
      avatarUrl: json['avatarUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'avatarUrl': avatarUrl,
    };
  }
}
