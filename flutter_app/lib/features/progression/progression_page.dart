import 'package:flutter/material.dart';

import '../../core/constants/ranks.dart';
import '../../core/state/app_state.dart';

class ProgressionPage extends StatelessWidget {
  const ProgressionPage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final currentLevel = appState.currentRank.level;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: ranks.length,
      itemBuilder: (context, index) {
        final rank = ranks[index];
        final isCurrent = rank.level == currentLevel;
        final isComplete = rank.level < currentLevel;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: isCurrent ? const Color(0xFF28395E) : null,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isCurrent ? const Color(0xFFFFB300) : const Color(0xFF22304D),
              child: Text('${rank.level + 1}'),
            ),
            title: Text(rank.name),
            subtitle: Text('${rank.hours}h · +${rank.reward} coins\n${rank.storyline}'),
            trailing: isCurrent
                ? const Icon(Icons.local_fire_department, color: Color(0xFFFFB300))
                : Icon(isComplete ? Icons.check_circle : Icons.lock_clock, color: isComplete ? Colors.greenAccent : Colors.white38),
            isThreeLine: true,
          ),
        );
      },
    );
  }
}
