import 'package:flutter/material.dart';
import 'package:frontend/widgets/common_widgets.dart';

/// Edit Profile Screen
/// Placeholder for editing user profile information
class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreen(
      title: 'Edit Profile',
      subtitle: 'Form to update name, birthdate, and avatar will go here.',
      icon: Icons.person_search,
    );
  }
}
