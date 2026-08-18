/// Habit Model
/// Represents a habit entity from the API
class HabitModel {
  final int id;
  final int userId;
  final String name;
  final String? description;
  final String? category;
  final String priorityLevel;
  final bool isActive;
  final List<int> scheduleDays;
  final String? reminderTime;
  final bool isCompletedToday;
  final String? createdAt;
  final String? updatedAt;

  HabitModel({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.category,
    required this.priorityLevel,
    required this.isActive,
    required this.scheduleDays,
    this.reminderTime,
    this.isCompletedToday = false,
    this.createdAt,
    this.updatedAt,
  });

  factory HabitModel.fromJson(Map<String, dynamic> json) {
    return HabitModel(
      id: json['id'],
      userId: json['userId'],
      name: json['name'],
      description: json['description'],
      category: json['category'],
      priorityLevel: json['priorityLevel'] ?? 'medium',
      isActive: json['isActive'] ?? true,
      scheduleDays: json['scheduleDays'] != null
          ? List<int>.from(json['scheduleDays'])
          : [],
      reminderTime: json['reminderTime'],
      isCompletedToday: json['isCompletedToday'] ?? false,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'category': category,
      'priorityLevel': priorityLevel,
      'isActive': isActive,
      'scheduleDays': scheduleDays,
      'reminderTime': reminderTime,
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
