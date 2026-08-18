import 'package:flutter/material.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Edit Habit Screen
/// Placeholder for editing an existing habit
/// UI details will be implemented in the next phase
class EditHabitScreen extends StatelessWidget {
  const EditHabitScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final habitId = ModalRoute.of(context)?.settings.arguments as int?;

    return const PlaceholderScreen(
      title: 'Edit Habit',
      subtitle: 'Edit habit form will be implemented in the next phase.\nStructure is similar to Add Habit screen.',
      icon: Icons.edit_note,
    );
  }
}
