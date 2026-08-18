import 'package:flutter/material.dart';

/// Report Screen (Stats)
/// Displays habit completion reports and statistics.
/// Currently uses mock data for layout structure preparation.
class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stats'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildPeriodSelector(context),
            const SizedBox(height: 16),
            _buildPerformanceSummary(context),
            const SizedBox(height: 16),
            _buildProgressChart(context),
            const SizedBox(height: 32),
            _buildCompletionHistory(context),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodSelector(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {},
          tooltip: 'Previous Week',
        ),
        const SizedBox(width: 8),
        const Text(
          'Aug 11 – Aug 17',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {},
          tooltip: 'Next Week',
        ),
      ],
    );
  }

  Widget _buildPerformanceSummary(BuildContext context) {
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
              '75%',
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
            const Text(
              '15 Completed | 20 Scheduled',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressChart(BuildContext context) {
    // Static mock data for UI visual representation
    final List<String> days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final List<double> heights = [0.4, 0.8, 0.6, 0.2, 0.9, 0.5, 0.7]; // percentages (0.0 to 1.0)

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
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        width: 24,
                        height: 90 * heights[index], // Scales to max 90px height
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        days[index],
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

  Widget _buildCompletionHistory(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Completion History',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        _buildHistoryGroup(context, 'Today', [
          _HistoryItem(title: 'Morning Exercise', time: 'Completed at 08:15'),
          _HistoryItem(title: 'Read a Book', time: 'Completed at 21:30'),
        ]),
        const SizedBox(height: 16),
        _buildHistoryGroup(context, 'Yesterday', [
          _HistoryItem(title: 'Drink Water', time: 'Completed at 10:00'),
          _HistoryItem(title: 'Study Flutter', time: 'Completed at 19:45'),
        ]),
        const SizedBox(height: 16),
        _buildHistoryGroup(context, 'Aug 16, 2026', [
          _HistoryItem(title: 'Morning Exercise', time: 'Completed at 07:30'),
        ]),
      ],
    );
  }

  Widget _buildHistoryGroup(BuildContext context, String date, List<_HistoryItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          date,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
        ),
        const SizedBox(height: 8),
        ...items.map((item) => Card(
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
                subtitle: Text(item.time, style: const TextStyle(fontSize: 12)),
              ),
            )),
      ],
    );
  }
}

class _HistoryItem {
  final String title;
  final String time;

  _HistoryItem({required this.title, required this.time});
}
