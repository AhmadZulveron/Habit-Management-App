import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/habit_provider.dart';
import 'package:frontend/providers/category_provider.dart';

// Import Screens
import 'package:frontend/screens/auth/login_screen.dart';
import 'package:frontend/screens/auth/signup_screen.dart';
import 'package:frontend/screens/main_navigation_screen.dart';
import 'package:frontend/screens/habit/habit_list_screen.dart';
import 'package:frontend/screens/habit/add_habit_screen.dart';
import 'package:frontend/screens/habit/habit_detail_screen.dart';
import 'package:frontend/screens/habit/edit_habit_screen.dart';
import 'package:frontend/screens/recommendation/recommendation_screen.dart';
import 'package:frontend/screens/report/report_screen.dart';
import 'package:frontend/screens/profile/profile_screen.dart';
import 'package:frontend/screens/profile/edit_profile_screen.dart';
import 'package:frontend/screens/profile/settings_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuthStatus()),
        ChangeNotifierProvider(create: (_) => HabitProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
      ],
      child: MaterialApp(
        title: 'Habit Tracker Base',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.teal,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          inputDecorationTheme: const InputDecorationTheme(
            filled: true,
            border: OutlineInputBorder(),
          ),
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
        ),
        // Auth gate
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            if (authProvider.isLoading) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            return authProvider.isAuthenticated
                ? const MainNavigationScreen()
                : const LoginScreen();
          },
        ),
        // Routes mapping
        routes: {
          '/login': (context) => const LoginScreen(),
          '/signup': (context) => const SignupScreen(),
          '/home': (context) => const MainNavigationScreen(),
          '/habits': (context) => const HabitListScreen(),
          '/add-habit': (context) => const AddHabitScreen(),
          '/habit-detail': (context) => const HabitDetailScreen(),
          '/edit-habit': (context) => const EditHabitScreen(),
          '/recommendations': (context) => const RecommendationScreen(),
          '/reports': (context) => const ReportScreen(),
          '/profile': (context) => const ProfileScreen(),
          '/edit-profile': (context) => const EditProfileScreen(),
          '/settings': (context) => const SettingsScreen(),
        },
      ),
    );
  }
}
