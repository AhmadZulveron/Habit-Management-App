import 'package:flutter/material.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Recommendation Screen
/// Placeholder for displaying personalized habit recommendations
/// Full recommendation logic will be implemented in the next phase
class RecommendationScreen extends StatelessWidget {
  const RecommendationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreen(
      title: 'Recommendations',
      subtitle: 'Personalized habit recommendations will appear here.\nRule-based recommendation engine is in development.',
      icon: Icons.lightbulb_outline,
    );
  }
}
