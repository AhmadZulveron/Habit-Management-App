import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/providers/category_provider.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Edit Habit Screen
/// Form to update an existing habit
class EditHabitScreen extends StatefulWidget {
  const EditHabitScreen({super.key});

  @override
  State<EditHabitScreen> createState() => _EditHabitScreenState();
}

class _EditHabitScreenState extends State<EditHabitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetController = TextEditingController();
  
  int? _categoryId;
  String _priority = 'medium';
  String _status = 'active';
  List<int> _selectedDays = [];
  bool _isInit = false;
  int? _habitId;

  static const List<String> _dayLabels = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInit) {
      _habitId = ModalRoute.of(context)?.settings.arguments as int?;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Provider.of<CategoryProvider>(context, listen: false).fetchCategories();
        if (_habitId != null) {
          final habit = Provider.of<HabitProvider>(context, listen: false).habits.firstWhere(
                (h) => h.id == _habitId,
              );
          
          _titleController.text = habit.title;
          _descriptionController.text = habit.description ?? '';
          _targetController.text = habit.target.toString();
          setState(() {
            _categoryId = habit.categoryId;
            _priority = habit.priority;
            _status = habit.status;
            _selectedDays = List.from(habit.scheduleDays);
            _isInit = true;
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate() || _habitId == null) return;
    if (_categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save Changes?'),
        content: const Text('Do you want to save these changes?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    // ignore: use_build_context_synchronously
    final habitProvider = Provider.of<HabitProvider>(context, listen: false);
    final success = await habitProvider.updateHabit(_habitId!, {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'categoryId': _categoryId,
      'priority': _priority,
      'target': int.tryParse(_targetController.text.trim()) ?? 1,
      'status': _status,
      'scheduleDays': _selectedDays,
    });

    if (!mounted) return;

    if (success) {
      // Refresh Today's Habits in case status or schedule changed
      await habitProvider.fetchTodayHabits();
      
      if (!mounted) return;
      
      // ignore: use_build_context_synchronously
      await showResultPopup(context, true, 'Habit Updated Successfully!');
      if (mounted) {
        // ignore: use_build_context_synchronously
        Navigator.pop(context);
      }
    } else {
      await showResultPopup(
        // ignore: use_build_context_synchronously
        context,
        false,
        'Failed to Update Habit',
        subtitle: habitProvider.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInit) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Habit'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.red),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Delete Habit?'),
                  content: const Text('Are you sure you want to delete this habit?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Delete', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              );

              if (confirmed == true && context.mounted) {
                final habitProvider = Provider.of<HabitProvider>(context, listen: false);
                final success = await habitProvider.deleteHabit(_habitId!);
                
                if (!context.mounted) return;

                if (success) {
                  // Option A: Show popup safely, allow automatic dismissal, then navigate back
                  // ignore: use_build_context_synchronously
                  await showResultPopup(context, true, 'Habit Deleted Successfully!');
                  if (context.mounted) {
                    Navigator.popUntil(context, (route) => route.isFirst);
                  }
                } else {
                  // ignore: use_build_context_synchronously
                  await showResultPopup(
                    context, 
                    false, 
                    'Failed to Delete Habit',
                    subtitle: habitProvider.error,
                  );
                }
              }
            },
          ),
        ],
      ),
      body: Consumer2<HabitProvider, CategoryProvider>(
        builder: (context, habitProvider, categoryProvider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Habit Title',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Habit title is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Description
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Description (optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Category Dropdown
                  DropdownButtonFormField<int>(
                    value: _categoryId,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                    items: categoryProvider.categories.map((category) {
                      return DropdownMenuItem<int>(
                        value: category.id,
                        child: Text(category.name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _categoryId = value);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Priority
                  DropdownButtonFormField<String>(
                    value: _priority,
                    decoration: const InputDecoration(
                      labelText: 'Priority Level',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'high', child: Text('High')),
                      DropdownMenuItem(value: 'medium', child: Text('Medium')),
                      DropdownMenuItem(value: 'low', child: Text('Low')),
                    ],
                    onChanged: (value) {
                      setState(() => _priority = value ?? 'medium');
                    },
                  ),
                  const SizedBox(height: 16),

                  // Status
                  DropdownButtonFormField<String>(
                    value: _status,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'active', child: Text('Active')),
                      DropdownMenuItem(value: 'inactive', child: Text('Inactive')),
                    ],
                    onChanged: (value) {
                      setState(() => _status = value ?? 'active');
                    },
                  ),
                  const SizedBox(height: 16),

                  // Target
                  TextFormField(
                    controller: _targetController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Target',
                      border: OutlineInputBorder(),
                      helperText: 'Descriptive target quantity (e.g. 1)',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Target is required';
                      }
                      if (int.tryParse(value) == null) {
                        return 'Please enter a valid number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Schedule days
                  const Text('Schedule Days', style: TextStyle(fontSize: 16)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: List.generate(7, (index) {
                      final isSelected = _selectedDays.contains(index);
                      return FilterChip(
                        label: Text(_dayLabels[index]),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              _selectedDays.add(index);
                            } else {
                              _selectedDays.remove(index);
                            }
                          });
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 8),

                  // Error message
                  if (habitProvider.error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        habitProvider.error!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Submit button
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: habitProvider.isLoading ? null : _handleSubmit,
                      child: habitProvider.isLoading
                          ? const SizedBox(
                              height: 20, width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save Changes'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
