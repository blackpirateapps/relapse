import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/state/app_state.dart';
import '../../core/utils/time_format.dart';

class JourneyPage extends StatelessWidget {
  const JourneyPage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final rank = appState.currentRank;
    final streakText = formatStreak(appState.streakDuration);

    return RefreshIndicator(
      onRefresh: appState.refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Current Phoenix', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 12),
                  SizedBox(height: 180, child: _PhoenixArt(rank.id)),
                  const SizedBox(height: 12),
                  Text(rank.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(streakText, textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, color: Color(0xFF73F0A9))),
                  const SizedBox(height: 8),
                  Text(rank.storyline, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Coin Balance', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 6),
                  Text('${appState.totalCoins}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  FilledButton.tonal(
                    onPressed: appState.isLoading ? null : appState.refresh,
                    child: const Text('Refresh State'),
                  ),
                  const SizedBox(height: 10),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFD14A4A)),
                    onPressed: appState.isLoading ? null : () => _confirmRelapse(context),
                    child: const Text('I Relapsed'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(onPressed: appState.logout, child: const Text('Log out'))
        ],
      ),
    );
  }

  Future<void> _confirmRelapse(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirm Relapse'),
        content: const Text('This resets the current streak. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirmed == true) {
      await appState.postRelapse();
    }
  }
}

class _PhoenixArt extends StatelessWidget {
  const _PhoenixArt(this.rankId);

  final String rankId;

  @override
  Widget build(BuildContext context) {
    final path = _assetPath(rankId);
    return SvgPicture.asset(path, fit: BoxFit.contain);
  }

  String _assetPath(String id) {
    const fallback = 'assets/images/phoenix/celestial-phoenix.svg';
    if (id.startsWith('egg-')) return 'assets/images/phoenix/$id.svg';
    if (id == 'hatchling-1') return 'assets/images/phoenix/hatchling-1.svg';
    if (id == 'hatchling-2') return 'assets/images/phoenix/hatchling-1.svg';
    if (id == 'hatchling-3') return 'assets/images/phoenix/hatchling-3.svg';
    if (id == 'chick-1') return 'assets/images/phoenix/chick-1.svg';
    if (id == 'chick-2') return 'assets/images/phoenix/chick-2.svg';
    if (id == 'youngling-1' || id == 'youngling-2') return 'assets/images/phoenix/youngling.svg';
    if (id == 'celestial-phoenix') return 'assets/images/phoenix/celestial-phoenix.svg';
    return fallback;
  }
}
