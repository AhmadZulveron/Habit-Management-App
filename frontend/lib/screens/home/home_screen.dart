import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/models/habit_model.dart';
import 'package:frontend/models/badge_model.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Home Screen
/// Main screen showing today's habits and navigation to other sections
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final Set<int> _processingCompletions = {};

  @override
  void initState() {
    super.initState();
    // Fetch today's habits when home screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HabitProvider>(context, listen: false).fetchTodayHabits();
    });
  }

  Future<void> _confirmCompletion(HabitProvider habitProvider, int habitId, String title) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Complete Habit?'),
        content: Text('Have you completed $title today?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      if (_processingCompletions.contains(habitId)) return;
      setState(() => _processingCompletions.add(habitId));

      final result = await habitProvider.completeHabit(habitId);
      final success = result['success'] == true;
      final earnedBadges = result['earnedBadges'] as List<BadgeModel>? ?? [];

      if (!mounted) return;
      
      if (mounted) {
        setState(() => _processingCompletions.remove(habitId));
        if (success) {
          String subtitleText = '+10 Points';
          if (earnedBadges.isNotEmpty) {
            final badgeNames = earnedBadges.map((b) => b.name).join(', ');
            subtitleText += '\n\n🏆 New Badge Earned: $badgeNames';
          }
          
          await showResultPopup(
            // ignore: use_build_context_synchronously
            context,
            true,
            'Habit Completed!',
            subtitle: subtitleText,
          );
        } else {
          showResultPopup(
            // ignore: use_build_context_synchronously
            context,
            false,
            'Failed to complete habit',
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
        title: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            final name = authProvider.user?.name ?? 'User';
            return Text('Hello, $name!');
          },
        ),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.lightbulb_outline),
            onPressed: () => Navigator.pushNamed(context, '/recommendations'),
            tooltip: 'Recommendations',
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: FloatingActionButton.extended(
            onPressed: () => Navigator.pushNamed(context, '/habits'),
            icon: const Icon(Icons.add),
            label: const Text(
              'Add New Habits',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 4,
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    return Consumer<HabitProvider>(
      builder: (context, habitProvider, child) {
        final isLoading = habitProvider.isLoading;
        final hasError = habitProvider.error != null && !isLoading;
        final isEmpty = habitProvider.todayHabits.isEmpty && !isLoading && !hasError;
        
        // When loading, use dummy data to populate the Skeletonizer
        final List<HabitModel> displayHabits = isLoading
            ? List.generate(
                3,
                (index) => HabitModel(
                  id: index,
                  title: 'Loading Habit Title Placeholder',
                  isCompletedToday: false,
                  categoryName: 'Category',
                  priority: 'High',
                  userId: 1,
                  categoryId: 1,
                  target: 1,
                  scheduleDays: [1, 2, 3],
                  status: 'active',
                ),
              )
            : habitProvider.todayHabits;

        return RefreshIndicator(
          onRefresh: () => habitProvider.fetchTodayHabits(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Today's Habits section header
                Text(
                  "Today's Habits",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),

                if (hasError)
                  Center(
                    child: Column(
                      children: [
                        Text(
                          habitProvider.error!,
                          style: const TextStyle(color: Colors.red),
                        ),
                        TextButton(
                          onPressed: () => habitProvider.fetchTodayHabits(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                else if (isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Icon(Icons.check_circle_outline, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text(
                            'No habits scheduled for today',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  Skeletonizer(
                    enabled: isLoading,
                    child: ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: displayHabits.length,
                      itemBuilder: (context, index) {
                        final habit = displayHabits[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: Checkbox(
                              value: habit.isCompletedToday,
                              onChanged: habit.isCompletedToday
                                  ? null
                                  : (value) {
                                      // Do nothing if skeleton is active
                                      if (isLoading) return;
                                      _confirmCompletion(habitProvider, habit.id, habit.title);
                                    },
                            ),
                            title: Text(
                              habit.title,
                              style: TextStyle(
                                decoration: habit.isCompletedToday ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            subtitle: Text(
                              habit.isCompletedToday
                                  ? '${habit.categoryName ?? 'Uncategorized'} • ${habit.priority}\nCompleted (+10 Points)'
                                  : '${habit.categoryName ?? 'Uncategorized'} • ${habit.priority}',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              if (isLoading) return;
                              Navigator.pushNamed(
                                context,
                                '/habit-detail',
                                arguments: habit.id,
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
