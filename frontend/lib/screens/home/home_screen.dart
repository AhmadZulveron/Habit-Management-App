import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/habit_provider.dart';

/// Home Screen
/// Main screen showing today's habits and navigation to other sections
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Fetch today's habits when home screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HabitProvider>(context, listen: false).fetchTodayHabits();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Habit Tracker'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outlined),
            onPressed: () => Navigator.pushNamed(context, '/profile'),
            tooltip: 'Profile',
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
            tooltip: 'Settings',
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          // Navigate to corresponding screen
          switch (index) {
            case 0:
              break; // Already on home
            case 1:
              Navigator.pushNamed(context, '/habits');
              break;
            case 2:
              Navigator.pushNamed(context, '/recommendations');
              break;
            case 3:
              Navigator.pushNamed(context, '/reports');
              break;
          }
        },
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.checklist_outlined),
            activeIcon: Icon(Icons.checklist),
            label: 'Habits',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.lightbulb_outline),
            activeIcon: Icon(Icons.lightbulb),
            label: 'Recommend',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart_outlined),
            activeIcon: Icon(Icons.bar_chart),
            label: 'Report',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/add-habit'),
        child: const Icon(Icons.add),
        tooltip: 'Add Habit',
      ),
    );
  }

  Widget _buildBody() {
    return Consumer<HabitProvider>(
      builder: (context, habitProvider, child) {
        return RefreshIndicator(
          onRefresh: () => habitProvider.fetchTodayHabits(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Greeting
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final name = authProvider.user?.fullName ?? 'User';
                    return Text(
                      'Hello, $name!',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    );
                  },
                ),
                const SizedBox(height: 4),
                Text(
                  "Here are today's habits",
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                ),
                const SizedBox(height: 24),

                // Today's Habits section
                Text(
                  "Today's Habits",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),

                if (habitProvider.isLoading)
                  const Center(child: CircularProgressIndicator())
                else if (habitProvider.error != null)
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
                else if (habitProvider.todayHabits.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Icon(Icons.check_circle_outline,
                              size: 48, color: Colors.grey),
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
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: habitProvider.todayHabits.length,
                    itemBuilder: (context, index) {
                      final habit = habitProvider.todayHabits[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Checkbox(
                            value: habit.isCompletedToday,
                            onChanged: habit.isCompletedToday
                                ? null
                                : (value) {
                                    habitProvider.completeHabit(habit.id);
                                  },
                          ),
                          title: Text(
                            habit.name,
                            style: TextStyle(
                              decoration: habit.isCompletedToday
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                          ),
                          subtitle: Text(
                            '${habit.category ?? 'Uncategorized'} • ${habit.priorityLevel}',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
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
              ],
            ),
          ),
        );
      },
    );
  }
}
