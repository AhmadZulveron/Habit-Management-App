import 'package:flutter/material.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Report Screen
/// Placeholder for habit completion reports and statistics
/// Full reporting features will be implemented in the next phase
class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreen(
      title: 'Reports',
      subtitle: 'Habit completion statistics and reports will appear here.\nDaily, weekly, and monthly summaries are planned.',
      icon: Icons.bar_chart,
    );
  }
}
