/// Habit Model
/// Represents a habit entity from the API
class HabitModel {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final int categoryId;
  final String? categoryName;
  final String? categoryIcon;
  final String? categoryColor;
  final String priority;
  final int target;
  final String status;
  final List<int> scheduleDays;
  final bool isCompletedToday;
  final String? createdAt;
  final String? updatedAt;

  HabitModel({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.categoryId,
    this.categoryName,
    this.categoryIcon,
    this.categoryColor,
    required this.priority,
    required this.target,
    required this.status,
    required this.scheduleDays,
    this.isCompletedToday = false,
    this.createdAt,
    this.updatedAt,
  });

  factory HabitModel.fromJson(Map<String, dynamic> json) {
    return HabitModel(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      description: json['description'],
      categoryId: json['categoryId'],
      categoryName: json['categoryName'],
      categoryIcon: json['categoryIcon'],
      categoryColor: json['categoryColor'],
      priority: json['priority'] ?? 'medium',
      target: json['target'] ?? 1,
      status: json['status'] ?? 'active',
      scheduleDays: json['scheduleDays'] != null
          ? List<int>.from(json['scheduleDays'])
          : [],
      isCompletedToday: json['isCompletedToday'] ?? false,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'categoryId': categoryId,
      'categoryName': categoryName,
      'categoryIcon': categoryIcon,
      'categoryColor': categoryColor,
      'priority': priority,
      'target': target,
      'status': status,
      'scheduleDays': scheduleDays,
      'isCompletedToday': isCompletedToday,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Get day names from schedule
  static const List<String> dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  List<String> get scheduleDayNames {
    return scheduleDays.map((day) => dayNames[day]).toList();
  }
}
