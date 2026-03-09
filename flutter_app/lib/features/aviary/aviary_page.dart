import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/state/app_state.dart';
import '../../core/utils/image_urls.dart';

class AviaryPage extends StatelessWidget {
  const AviaryPage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final history = appState.history;

    if (history.isEmpty && appState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (history.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history_toggle_off, size: 64, color: Colors.white24),
            const SizedBox(height: 16),
            const Text(
              'No archived phoenixes yet.',
              style: TextStyle(color: Colors.white60, fontSize: 16),
            ),
            const SizedBox(height: 6),
            const Text(
              'Past phoenixes will appear here after a relapse.',
              style: TextStyle(color: Colors.white38, fontSize: 13),
            ),
            const SizedBox(height: 20),
            FilledButton.tonal(
              onPressed: appState.refreshHistory,
              child: const Text('Refresh'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: appState.refreshHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: history.length,
        itemBuilder: (context, index) {
          final entry = history[index];

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Phoenix image for this archived entry
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 64,
                      height: 64,
                      color: const Color(0xFF1A2744),
                      child: CachedNetworkImage(
                        imageUrl: phoenixImageUrl(entry.rankId),
                        width: 64,
                        height: 64,
                        fit: BoxFit.contain,
                        placeholder: (_, __) => const Center(
                          child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                        ),
                        errorWidget: (_, __, ___) => const Icon(
                          Icons.local_fire_department,
                          color: Colors.white24,
                          size: 28,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        if (entry.finalRankName != null)
                          Text(
                            'Final Rank: ${entry.finalRankName}',
                            style: const TextStyle(fontSize: 13, color: Colors.white60),
                          ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.timer_outlined, size: 14, color: Colors.white38),
                            const SizedBox(width: 4),
                            Text(
                              entry.formattedDuration,
                              style: const TextStyle(fontSize: 13, color: Colors.white54),
                            ),
                            const SizedBox(width: 16),
                            const Icon(Icons.calendar_today_outlined, size: 14, color: Colors.white38),
                            const SizedBox(width: 4),
                            Text(
                              entry.formattedEndDate,
                              style: const TextStyle(fontSize: 13, color: Colors.white54),
                            ),
                          ],
                        ),
                      ],
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
