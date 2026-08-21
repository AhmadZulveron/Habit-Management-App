import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/providers/category_provider.dart';
import 'package:frontend/providers/recommendation_provider.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Add Habit Screen
/// Form to create a new habit
class AddHabitScreen extends StatefulWidget {
  const AddHabitScreen({super.key});

  @override
  State<AddHabitScreen> createState() => _AddHabitScreenState();
}

class _AddHabitScreenState extends State<AddHabitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetController = TextEditingController(text: '1');
  
  int? _categoryId;
  String _priority = 'medium';
  final List<int> _selectedDays = [];
  bool _isInit = false;

  static const List<String> _dayLabels = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CategoryProvider>(context, listen: false).fetchCategories();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInit) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is RecommendationModel) {
        _titleController.text = args.title;
        _descriptionController.text = args.description;
        _categoryId = args.categoryId;
        
        final priorityLower = args.priority.toLowerCase();
        if (['high', 'medium', 'low'].contains(priorityLower)) {
          _priority = priorityLower;
        }
      }
      _isInit = true;
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
    if (!_formKey.currentState!.validate()) return;
    if (_categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    final habitProvider = Provider.of<HabitProvider>(context, listen: false);
    final success = await habitProvider.createHabit({
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'categoryId': _categoryId,
      'priority': _priority,
      'target': int.tryParse(_targetController.text.trim()) ?? 1,
      'status': 'inactive', // default for new habits
      'scheduleDays': _selectedDays,
    });

    if (!context.mounted) return;
    
    if (success) {
      // ignore: use_build_context_synchronously
      await showResultPopup(context, true, 'Habit Created Successfully!');
      if (context.mounted) {
        // ignore: use_build_context_synchronously
        Navigator.pop(context);
      }
    } else {
      await showResultPopup(
        // ignore: use_build_context_synchronously
        context,
        false,
        'Failed to Create Habit',
        subtitle: habitProvider.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Habit'),
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
                    value: categoryProvider.categories.any((c) => c.id == _categoryId) 
                        ? _categoryId 
                        : null,
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
                    validator: (value) {
                      if (value == null) {
                        return 'Category is required';
                      }
                      return null;
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
                          : const Text('Create Habit'),
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
