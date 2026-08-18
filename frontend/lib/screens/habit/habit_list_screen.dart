import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Habit List Screen
/// Displays all user habits with options to add, edit, and delete
class HabitListScreen extends StatefulWidget {
  const HabitListScreen({super.key});

  @override
  State<HabitListScreen> createState() => _HabitListScreenState();
}

class _HabitListScreenState extends State<HabitListScreen> {
  final Set<int> _processingActivations = {};
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HabitProvider>(context, listen: false).fetchHabits();
    });
  }

  Future<void> _confirmActivation(habitProvider, habit) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Add to Today's Habits?"),
        content: Text('Add "${habit.title}" to your active habits?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      if (_processingActivations.contains(habit.id)) return;
      setState(() => _processingActivations.add(habit.id));

      final success = await habitProvider.updateHabit(habit.id, {
        'title': habit.title,
        'description': habit.description,
        'categoryId': habit.categoryId,
        'priority': habit.priority,
        'target': habit.target,
        'status': 'active',
        'scheduleDays': habit.scheduleDays,
      });

      if (!mounted) return;
      
      if (mounted) {
        setState(() => _processingActivations.remove(habit.id));
        if (success) {
          // Refresh Today's Habits so it appears on Home
          await habitProvider.fetchTodayHabits();
          
          if (mounted) {
            await showResultPopup(
              // ignore: use_build_context_synchronously
              context,
              true,
              'Habit Added to Today\'s Habits!',
            );
          }
        } else {
          await showResultPopup(
            // ignore: use_build_context_synchronously
            context,
            false,
            'Failed to Add Habit',
            subtitle: habitProvider.error,
          );
        }
      }
    }
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
                    title: Text(habit.title),
                    subtitle: Text(
                      '${habit.categoryName ?? 'Uncategorized'} • ${habit.priority} • ${habit.status == 'active' ? 'Active' : 'Inactive'}',
                    ),
                    trailing: habit.status == 'active'
                        ? const Icon(Icons.check, color: Colors.green)
                        : IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () => _confirmActivation(habitProvider, habit),
                          ),
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
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: FloatingActionButton.extended(
            onPressed: () => Navigator.pushNamed(context, '/add-habit'),
            icon: const Icon(Icons.add),
            label: const Text(
              'Create New Habit',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 4,
          ),
        ),
      ),
      // floatingActionButton: FloatingActionButton.extended(
      //   onPressed: () => Navigator.pushNamed(context, '/add-habit'),
      //   icon: const Icon(Icons.add),
      //   label: const Text('Create Habit'),
      //   tooltip: 'Add Habit',
      // ),
    );
  }
}
