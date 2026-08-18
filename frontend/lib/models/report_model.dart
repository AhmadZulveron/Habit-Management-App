class ReportModel {
  final String startDate;
  final String endDate;
  final int totalScheduled;
  final int totalCompleted;
  final double completionRate;
  final List<DailyProgress> dailyProgress;
  final List<CompletionHistoryItem> history;

  ReportModel({
    required this.startDate,
    required this.endDate,
    required this.totalScheduled,
    required this.totalCompleted,
    required this.completionRate,
    required this.dailyProgress,
    required this.history,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      startDate: json['startDate'] ?? '',
      endDate: json['endDate'] ?? '',
      totalScheduled: json['totalScheduled'] ?? 0,
      totalCompleted: json['totalCompleted'] ?? 0,
      completionRate: (json['completionRate'] ?? 0).toDouble(),
      dailyProgress: (json['dailyProgress'] as List?)
              ?.map((item) => DailyProgress.fromJson(item))
              .toList() ??
          [],
      history: (json['history'] as List?)
              ?.map((item) => CompletionHistoryItem.fromJson(item))
              .toList() ??
          [],
    );
  }
}

class DailyProgress {
  final String date;
  final String dayName;
  final int scheduled;
  final int completed;
  final double rate;

  DailyProgress({
    required this.date,
    required this.dayName,
    required this.scheduled,
    required this.completed,
    required this.rate,
  });

  factory DailyProgress.fromJson(Map<String, dynamic> json) {
    return DailyProgress(
      date: json['date'] ?? '',
      dayName: json['dayName'] ?? '',
      scheduled: json['scheduled'] ?? 0,
      completed: json['completed'] ?? 0,
      rate: (json['rate'] ?? 0).toDouble(),
    );
  }
}

class CompletionHistoryItem {
  final int id;
  final String title;
  final DateTime completedAt;

  CompletionHistoryItem({
    required this.id,
    required this.title,
    required this.completedAt,
  });

  factory CompletionHistoryItem.fromJson(Map<String, dynamic> json) {
    return CompletionHistoryItem(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      completedAt: DateTime.parse(json['completedAt']),
    );
  }
}
