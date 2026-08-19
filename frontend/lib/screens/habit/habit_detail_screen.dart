import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/models/habit_model.dart';
import 'package:frontend/widgets/common_widgets.dart';

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
          final isLoading = habitProvider.isLoading;
          final realHabit = habitProvider.selectedHabit;
          
          if (!isLoading && realHabit == null) {
            return const Center(child: Text('Habit not found'));
          }

          final habit = isLoading
              ? HabitModel(
                  id: 0,
                  userId: 1,
                  title: 'Loading Habit Title Placeholder',
                  description: 'This is a placeholder description for the skeleton loading state.',
                  categoryId: 1,
                  categoryName: 'Category',
                  priority: 'High',
                  target: 1,
                  status: 'active',
                  scheduleDays: [1, 2, 3],
                )
              : realHabit!;

          return Skeletonizer(
            enabled: isLoading,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSummaryCard(context, habit),
                  if (habit.description != null && habit.description!.trim().isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildDescriptionCard(context, habit.description!),
                  ],
                  const SizedBox(height: 16),
                  _buildHabitInformationCard(context, habit),
                  const SizedBox(height: 16),
                  _buildScheduleCard(context, habit),
                  const SizedBox(height: 16),
                  _buildTargetCard(context, habit),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Consumer<HabitProvider>(
        builder: (context, habitProvider, child) {
          final isLoading = habitProvider.isLoading;
          final realHabit = habitProvider.selectedHabit;
          
          if (!isLoading && realHabit == null) return const SizedBox.shrink();

          final habit = isLoading
              ? HabitModel(
                  id: 0,
                  userId: 1,
                  title: 'Loading',
                  categoryId: 1,
                  priority: 'high',
                  target: 1,
                  status: 'active',
                  scheduleDays: [],
                )
              : realHabit!;

          final isActive = habit.status == 'active';

          return Skeletonizer(
            enabled: isLoading,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: FloatingActionButton.extended(
                  onPressed: isLoading ? null : () => _handleStatusToggle(context, habitProvider, habit),
                  backgroundColor: isActive ? Colors.orange : Colors.green,
                  icon: Icon(
                    isActive ? Icons.pause_circle_outline : Icons.play_circle_outline,
                    color: Colors.white,
                  ),
                  label: Text(
                    isActive ? 'Deactivate Habit' : 'Activate Habit',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _handleStatusToggle(BuildContext context, HabitProvider habitProvider, habit) async {
    final isActive = habit.status == 'active';
    final actionName = isActive ? 'Deactivate' : 'Activate';
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$actionName Habit?'),
        content: Text(
          isActive 
            ? 'This habit will no longer appear in Today\'s Habits until activated again.'
            : 'This habit will become active and appear on its scheduled days.'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(actionName, style: TextStyle(color: isActive ? Colors.orange : Colors.green)),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final payload = {
      'title': habit.title,
      'description': habit.description ?? '',
      'categoryId': habit.categoryId,
      'priority': habit.priority,
      'target': habit.target,
      'status': isActive ? 'inactive' : 'active',
      'scheduleDays': habit.scheduleDays,
    };

    final success = await habitProvider.updateHabit(habit.id, payload);

    if (!mounted) return;

    if (success) {
      await habitProvider.fetchTodayHabits();
      
      if (!mounted) return;
      
      // ignore: use_build_context_synchronously
      await showResultPopup(context, true, 'Habit ${actionName}d Successfully!');
    } else {
      await showResultPopup(
        // ignore: use_build_context_synchronously
        context, 
        false, 
        'Failed to $actionName Habit',
        subtitle: habitProvider.error,
      );
    }
  }

  Color _parseColor(String? colorString) {
    if (colorString == null || colorString.isEmpty) return Colors.teal;
    try {
      final hex = colorString.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (e) {
      return Colors.teal;
    }
  }

  IconData _getIconData(String? iconName) {
    if (iconName == null) return Icons.category;
    switch (iconName.toLowerCase()) {
      case 'fitness': return Icons.fitness_center;
      case 'health': return Icons.favorite;
      case 'education': return Icons.school;
      case 'work': return Icons.work;
      case 'finance': return Icons.attach_money;
      case 'mindfulness': return Icons.self_improvement;
      case 'social': return Icons.people;
      default: return Icons.category;
    }
  }

  Widget _buildSummaryCard(BuildContext context, habit) {
    final color = _parseColor(habit.categoryColor);
    final icon = _getIconData(habit.categoryIcon);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40, color: color),
            ),
            const SizedBox(height: 16),
            Text(
              habit.title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              habit.categoryName ?? 'Uncategorized',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[700],
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionCard(BuildContext context, String description) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Description',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHabitInformationCard(BuildContext context, habit) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Habit Information',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Priority', habit.priority.toUpperCase()),
            const Divider(height: 24),
            _buildInfoRow('Status', habit.status == 'active' ? 'Active' : 'Inactive'),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleCard(BuildContext context, habit) {
    final List<String> shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Assuming backend scheduleDays is 0=Sun, 1=Mon, ..., 6=Sat
    // To display Monday to Sunday, we map index 0..6 to actual backend days:
    // Display index 0 (Mon) -> Backend day 1
    // Display index 6 (Sun) -> Backend day 0
    final displayToBackendMap = [1, 2, 3, 4, 5, 6, 0];
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Schedule',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(7, (index) {
                final backendDay = displayToBackendMap[index];
                final isScheduled = habit.scheduleDays.contains(backendDay);
                return Column(
                  children: [
                    Text(
                      shortDays[index],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isScheduled ? FontWeight.bold : FontWeight.normal,
                        color: isScheduled ? Theme.of(context).primaryColor : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Icon(
                      isScheduled ? Icons.circle : Icons.circle_outlined,
                      size: 16,
                      color: isScheduled ? Theme.of(context).primaryColor : Colors.grey[400],
                    ),
                  ],
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTargetCard(BuildContext context, habit) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Target',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              '${habit.target}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 16, color: Colors.black87)),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
