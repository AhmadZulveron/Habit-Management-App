/// User Model
/// Represents user data received from the API
class UserModel {
  final int id;
  final String name;
  final String email;
  final int? totalPoints;
  final String? memberSince;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.totalPoints,
    this.memberSince,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      totalPoints: json['totalPoints'] ?? json['total_points'], // Handle potential naming variations
      memberSince: json['memberSince'] ?? json['member_since'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'totalPoints': totalPoints,
      'memberSince': memberSince,
    };
  }
}
