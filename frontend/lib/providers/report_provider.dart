import 'package:flutter/foundation.dart';
import 'package:frontend/models/report_model.dart';
import 'package:frontend/services/report_service.dart';

class ReportProvider with ChangeNotifier {
  final ReportService _reportService = ReportService();

  ReportModel? _report;
  bool _isLoading = false;
  String _error = '';
  
  DateTime _currentWeekStart;

  ReportProvider() : _currentWeekStart = _getMondayOfCurrentWeek() {
    _fetchReport();
  }

  ReportModel? get report => _report;
  bool get isLoading => _isLoading;
  String get error => _error;
  DateTime get currentWeekStart => _currentWeekStart;
  DateTime get currentWeekEnd => _currentWeekStart.add(const Duration(days: 6));

  static DateTime _getMondayOfCurrentWeek() {
    final now = DateTime.now();
    // In Dart, weekday is 1 for Monday and 7 for Sunday.
    final int daysSinceMonday = now.weekday - 1;
    return DateTime(now.year, now.month, now.day).subtract(Duration(days: daysSinceMonday));
  }

  String _formatDate(DateTime date) {
    final y = date.year.toString();
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  Future<void> _fetchReport() async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final startDate = _formatDate(_currentWeekStart);
      final endDate = _formatDate(currentWeekEnd);
      _report = await _reportService.getWeeklyReport(startDate, endDate);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void nextWeek() {
    _currentWeekStart = _currentWeekStart.add(const Duration(days: 7));
    _fetchReport();
  }

  void previousWeek() {
    _currentWeekStart = _currentWeekStart.subtract(const Duration(days: 7));
    _fetchReport();
  }

  Future<void> refreshReport() async {
    await _fetchReport();
  }
}
