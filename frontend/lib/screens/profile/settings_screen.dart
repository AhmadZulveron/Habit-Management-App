import 'package:flutter/material.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Settings Screen
/// Placeholder for application settings
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreen(
      title: 'Settings',
      subtitle: 'App preferences, notifications, and theme settings will go here.',
      icon: Icons.settings_suggest,
    );
  }
}
