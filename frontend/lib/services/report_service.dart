import 'package:frontend/core/constants/api_constants.dart';
import 'package:frontend/core/services/api_service.dart';
import 'package:frontend/models/report_model.dart';

class ReportService {
  final ApiService _apiService = ApiService();

  Future<ReportModel> getWeeklyReport(String startDate, String endDate) async {
    final response = await _apiService.get(
      '${ApiConstants.reports}?startDate=$startDate&endDate=$endDate',
    );

    if (response.success && response.data != null) {
      return ReportModel.fromJson(response.data);
    } else {
      throw Exception(response.message);
    }
  }
}
