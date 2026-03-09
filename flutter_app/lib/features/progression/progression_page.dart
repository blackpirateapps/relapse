import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/constants/ranks.dart';
import '../../core/state/app_state.dart';
import '../../core/utils/image_urls.dart';

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
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Phoenix graphic from URL
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 56,
                    height: 56,
                    color: const Color(0xFF1A2744),
                    child: CachedNetworkImage(
                      imageUrl: phoenixImageUrl(rank.id),
                      width: 56,
                      height: 56,
                      fit: BoxFit.contain,
                      placeholder: (_, __) => const Center(
                        child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (_, __, ___) => Icon(
                        Icons.local_fire_department,
                        color: isCurrent ? const Color(0xFFFFB300) : Colors.white24,
                        size: 28,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Lvl ${rank.level + 1}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isCurrent ? const Color(0xFFFFB300) : Colors.white54,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              rank.name,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                            ),
                          ),
                          if (isCurrent)
                            const Icon(Icons.local_fire_department, color: Color(0xFFFFB300), size: 18)
                          else
                            Icon(
                              isComplete ? Icons.check_circle : Icons.lock_clock,
                              color: isComplete ? Colors.greenAccent : Colors.white38,
                              size: 18,
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${rank.hours}h · +${rank.reward} coins',
                        style: const TextStyle(fontSize: 12, color: Colors.white60),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        rank.storyline,
                        style: const TextStyle(fontSize: 12, color: Colors.white38),
                      ),
                    ],
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
