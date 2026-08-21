/// Badge Model
/// Represents a gamification badge that a user can earn
class BadgeModel {
  final int id;
  final String name;
  final String? description;
  final String criteriaType;
  final int criteriaValue;
  final bool isEarned;
  final DateTime? earnedAt;

  BadgeModel({
    required this.id,
    required this.name,
    this.description,
    required this.criteriaType,
    required this.criteriaValue,
    required this.isEarned,
    this.earnedAt,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      criteriaType: json['criteriaType'] ?? json['criteria_type'] ?? '',
      criteriaValue: json['criteriaValue'] ?? json['criteria_value'] ?? 0,
      isEarned: json['isEarned'] ?? false,
      earnedAt: json['earnedAt'] != null || json['earned_at'] != null
          ? DateTime.parse(json['earnedAt'] ?? json['earned_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'criteriaType': criteriaType,
      'criteriaValue': criteriaValue,
      'isEarned': isEarned,
      'earnedAt': earnedAt?.toIso8601String(),
    };
  }
}
