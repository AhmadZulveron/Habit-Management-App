import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/habit_provider.dart';

/// Habit List Screen
/// Displays all user habits with options to add, edit, and delete
class HabitListScreen extends StatefulWidget {
  const HabitListScreen({super.key});

  @override
  State<HabitListScreen> createState() => _HabitListScreenState();
}

class _HabitListScreenState extends State<HabitListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HabitProvider>(context, listen: false).fetchHabits();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Habits'),
      ),
      body: Consumer<HabitProvider>(
        builder: (context, habitProvider, child) {
          if (habitProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (habitProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(habitProvider.error!, style: const TextStyle(color: Colors.red)),
                  TextButton(
                    onPressed: () => habitProvider.fetchHabits(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (habitProvider.habits.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.checklist, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No habits yet', style: TextStyle(color: Colors.grey, fontSize: 16)),
                  SizedBox(height: 8),
                  Text('Tap + to add your first habit', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => habitProvider.fetchHabits(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: habitProvider.habits.length,
              itemBuilder: (context, index) {
                final habit = habitProvider.habits[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(habit.name),
                    subtitle: Text(
                      '${habit.category ?? 'Uncategorized'} • ${habit.priorityLevel} • ${habit.isActive ? 'Active' : 'Inactive'}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      Navigator.pushNamed(context, '/habit-detail', arguments: habit.id);
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/add-habit'),
        child: const Icon(Icons.add),
        tooltip: 'Add Habit',
      ),
    );
  }
}
