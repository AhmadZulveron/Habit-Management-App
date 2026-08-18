import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/report_provider.dart';
import 'package:frontend/models/report_model.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Provider.of<ReportProvider>(context, listen: false).refreshReport();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stats'),
      ),
      body: Consumer<ReportProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildPeriodSelector(context, provider),
                const SizedBox(height: 16),
                if (provider.isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (provider.error.isNotEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Text('Error: ${provider.error}', style: const TextStyle(color: Colors.red)),
                    ),
                  )
                else ...[
                  _buildPerformanceSummary(context, provider.report),
                  const SizedBox(height: 16),
                  _buildProgressChart(context, provider.report),
                  const SizedBox(height: 32),
                  _buildCompletionHistory(context, provider.report),
                ]
              ],
            ),
          );
        },
      ),
    );
  }

  String _formatMonthDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}';
  }

  String _formatFullDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _formatTime(DateTime date) {
    final h = date.hour.toString().padLeft(2, '0');
    final m = date.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Widget _buildPeriodSelector(BuildContext context, ReportProvider provider) {
    final startStr = _formatMonthDate(provider.currentWeekStart);
    final endStr = _formatMonthDate(provider.currentWeekEnd);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: provider.isLoading ? null : () => provider.previousWeek(),
          tooltip: 'Previous Week',
        ),
        const SizedBox(width: 8),
        Text(
          '$startStr – $endStr',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: provider.isLoading ? null : () => provider.nextWeek(),
          tooltip: 'Next Week',
        ),
      ],
    );
  }

  Widget _buildPerformanceSummary(BuildContext context, ReportModel? report) {
    final rate = report?.completionRate.toStringAsFixed(0) ?? '0';
    final completed = report?.totalCompleted ?? 0;
    final scheduled = report?.totalScheduled ?? 0;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text(
              'Weekly Performance',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            Text(
              '$rate%',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const Text(
              'Completion Rate',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            Text(
              '$completed Completed | $scheduled Scheduled',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressChart(BuildContext context, ReportModel? report) {
    // Expected to have exactly 7 items from backend corresponding to M,T,W,T,F,S,S
    // If not, provide safe fallbacks
    final progress = report?.dailyProgress ?? [];
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weekly Progress',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            SizedBox(
              height: 120, // Fixed height for the chart container
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(7, (index) {
                  final dayData = index < progress.length ? progress[index] : null;
                  final String dayName = dayData?.dayName ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
                  final double rate = dayData?.rate ?? 0.0;
                  final double fraction = (rate / 100.0).clamp(0.0, 1.0);

                  return Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        width: 24,
                        height: 90 * fraction, // Scales to max 90px height
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        dayName,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionHistory(BuildContext context, ReportModel? report) {
    final history = report?.history ?? [];

    if (history.isEmpty) {
      return const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Completion History',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'No completions this week.',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      );
    }

    // Group history by date
    Map<String, List<CompletionHistoryItem>> grouped = {};
    for (var item in history) {
      final local = item.completedAt.toLocal();
      final now = DateTime.now();
      
      final itemDate = DateTime(local.year, local.month, local.day);
      final todayDate = DateTime(now.year, now.month, now.day);
      final diff = todayDate.difference(itemDate).inDays;

      String groupLabel;
      if (diff == 0) {
        groupLabel = 'Today';
      } else if (diff == 1) {
        groupLabel = 'Yesterday';
      } else {
        groupLabel = _formatFullDate(local);
      }

      if (!grouped.containsKey(groupLabel)) {
        grouped[groupLabel] = [];
      }
      grouped[groupLabel]!.add(item);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Completion History',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...grouped.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: _buildHistoryGroup(context, entry.key, entry.value),
          );
        }),
      ],
    );
  }

  Widget _buildHistoryGroup(BuildContext context, String date, List<CompletionHistoryItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          date,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          final timeStr = _formatTime(item.completedAt.toLocal());
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            elevation: 1,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, size: 16, color: Colors.white),
              ),
              title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('Completed at $timeStr', style: const TextStyle(fontSize: 12)),
            ),
          );
        }),
      ],
    );
  }
}
