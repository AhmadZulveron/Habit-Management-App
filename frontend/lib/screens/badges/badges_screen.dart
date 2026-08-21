import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/badge_provider.dart';

/// Badges Screen
/// Displays earned and unearned badges
class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});

  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch badges when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BadgeProvider>(context, listen: false).fetchBadges();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Badges'),
      ),
      body: Consumer<BadgeProvider>(
        builder: (context, badgeProvider, child) {
          if (badgeProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (badgeProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Error: ${badgeProvider.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => badgeProvider.fetchBadges(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final badges = badgeProvider.badges;
          if (badges.isEmpty) {
            return const Center(child: Text('No badges available.'));
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.85,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: badges.length,
            itemBuilder: (context, index) {
              final badge = badges[index];
              return Card(
                elevation: badge.isEarned ? 4 : 1,
                color: badge.isEarned ? Colors.white : Colors.grey[100],
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: badge.isEarned ? Colors.amber.shade300 : Colors.grey.shade300,
                    width: badge.isEarned ? 2 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _getBadgeIcon(badge.criteriaType),
                        size: 48,
                        color: badge.isEarned ? Colors.amber : Colors.grey,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        badge.name,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: badge.isEarned ? Colors.black87 : Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        badge.description ?? '',
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: badge.isEarned ? Colors.grey[800] : Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  IconData _getBadgeIcon(String criteriaType) {
    switch (criteriaType) {
      case 'streak':
        return Icons.local_fire_department;
      case 'total_completions':
        return Icons.check_circle;
      default:
        return Icons.star;
    }
  }
}
