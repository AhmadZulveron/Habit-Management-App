import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/habit_provider.dart';

/// Habit Detail Screen
/// Displays detailed information about a specific habit
class HabitDetailScreen extends StatefulWidget {
  const HabitDetailScreen({super.key});

  @override
  State<HabitDetailScreen> createState() => _HabitDetailScreenState();
}

class _HabitDetailScreenState extends State<HabitDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final habitId = ModalRoute.of(context)?.settings.arguments as int?;
      if (habitId != null) {
        Provider.of<HabitProvider>(context, listen: false).fetchHabitById(habitId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Habit Detail'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              final habit = Provider.of<HabitProvider>(context, listen: false).selectedHabit;
              if (habit != null) {
                Navigator.pushNamed(context, '/edit-habit', arguments: habit.id);
              }
            },
            tooltip: 'Edit Habit',
          ),
        ],
      ),
      body: Consumer<HabitProvider>(
        builder: (context, habitProvider, child) {
          if (habitProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final habit = habitProvider.selectedHabit;
          if (habit == null) {
            return const Center(child: Text('Habit not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  habit.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow('Category', habit.category ?? 'Uncategorized'),
                _buildInfoRow('Priority', habit.priorityLevel.toUpperCase()),
                _buildInfoRow('Status', habit.isActive ? 'Active' : 'Inactive'),
                _buildInfoRow('Schedule', habit.scheduleDayNames.join(', ')),
                if (habit.description != null && habit.description!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(habit.description!),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
