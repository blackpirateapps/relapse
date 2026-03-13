import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/models/shop_item.dart';
import '../../core/state/app_state.dart';
import '../../core/utils/image_urls.dart';
import '../../widgets/streak_ticker.dart';

/// Maps background theme IDs to gradient color pairs.
const _bgGradients = <String, List<Color>>{
  'burning_fire_bg': [Color(0xFF1A0500), Color(0xFF4A1500), Color(0xFF8B2500)],
  'phoenix_constellation_bg': [Color(0xFF050520), Color(0xFF0A0A40), Color(0xFF15154D)],
  'solar_system_bg': [Color(0xFF050510), Color(0xFF0F0F30), Color(0xFF1A1A50)],
  'kawaii_city_bg': [Color(0xFF1A0A2E), Color(0xFF2D1B4E), Color(0xFF4A2C6E)],
  'starfield_warp_bg': [Color(0xFF000510), Color(0xFF000A20), Color(0xFF001040)],
};

class JourneyPage extends StatelessWidget {
  const JourneyPage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final rank = appState.currentRank;
    final state = appState.state;

    // Resolve equipped background gradient
    final equippedBgId = state?.equippedIdForType('background_theme');
    final bgColors = _bgGradients[equippedBgId];

    // Resolve equipped skin
    final equippedSkinId = state?.equippedIdForType('phoenix_skin');
    ShopItem? equippedSkin;
    if (equippedSkinId != null) {
      try {
        equippedSkin = appState.shopItems.firstWhere((i) => i.id == equippedSkinId);
      } catch (_) {}
    }

    // Resolve equipped aura
    final equippedAuraId = state?.equippedIdForType('phoenix_aura');
    ShopItem? equippedAura;
    if (equippedAuraId != null) {
      try {
        equippedAura = appState.shopItems.firstWhere((i) => i.id == equippedAuraId);
      } catch (_) {}
    }

    return Container(
      decoration: bgColors != null
          ? BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: bgColors,
              ),
            )
          : null,
      child: RefreshIndicator(
        onRefresh: appState.refresh,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // ── Notification toggle ──
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(
                  appState.notificationEnabled
                      ? Icons.notifications_active
                      : Icons.notifications_off_outlined,
                  size: 18,
                  color: Colors.white54,
                ),
                const SizedBox(width: 4),
                SizedBox(
                  height: 28,
                  child: Switch.adaptive(
                    value: appState.notificationEnabled,
                    onChanged: appState.toggleNotification,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // ── Phoenix graphic (big) ──
            SizedBox(
              height: 280,
              child: _PhoenixDisplay(
                rankId: rank.id,
                equippedSkin: equippedSkin,
                equippedAura: equippedAura,
              ),
            ),

            const SizedBox(height: 20),

            // ── Rank name ──
            Text(
              rank.name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),

            const SizedBox(height: 4),

            Text(
              rank.storyline,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white54, fontSize: 13),
            ),

            const SizedBox(height: 24),

            // ── Streak timer (big) ──
            if (state != null)
              StreakTicker(
                lastRelapse: state.lastRelapse,
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF73F0A9),
                  letterSpacing: 2,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
                textAlign: TextAlign.center,
              )
            else
              const Text(
                '--',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 40, color: Color(0xFF73F0A9)),
              ),

            const SizedBox(height: 8),

            // Coin balance
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.monetization_on, color: Color(0xFFFFB300), size: 20),
                const SizedBox(width: 6),
                Text(
                  '${appState.totalCoins}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFFFB300),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 40),

            // ── Action buttons ──
            FilledButton.tonal(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Urge tasks coming soon to the native app.'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Text('I Feel an Urge', style: TextStyle(fontSize: 16)),
            ),

            const SizedBox(height: 12),

            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFD14A4A),
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: appState.isLoading ? null : () => _confirmRelapse(context),
              child: const Text('I Relapsed', style: TextStyle(fontSize: 16)),
            ),

            const SizedBox(height: 24),
            TextButton(onPressed: appState.logout, child: const Text('Log out')),
          ],
        ),
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

// ── Phoenix display with optional skin and aura overlays ────────
class _PhoenixDisplay extends StatelessWidget {
  const _PhoenixDisplay({
    required this.rankId,
    this.equippedSkin,
    this.equippedAura,
  });

  final String rankId;
  final ShopItem? equippedSkin;
  final ShopItem? equippedAura;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Aura behind phoenix
        if (equippedAura != null)
          Opacity(
            opacity: 0.6,
            child: CachedNetworkImage(
              imageUrl: auraImageUrl(equippedAura!.previewImage ?? ''),
              width: 280,
              height: 280,
              fit: BoxFit.contain,
              errorWidget: (_, __, ___) => const SizedBox.shrink(),
            ),
          ),

        // Phoenix image: skin or default (from URL)
        if (equippedSkin != null)
          _buildSkinImage(equippedSkin!, rankId)
        else
          CachedNetworkImage(
            imageUrl: phoenixImageUrl(rankId),
            height: 240,
            fit: BoxFit.contain,
            placeholder: (_, __) => const SizedBox(
              height: 240,
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            errorWidget: (_, __, ___) => const Icon(Icons.local_fire_department, size: 120, color: Colors.white24),
          ),
      ],
    );
  }

  Widget _buildSkinImage(ShopItem skin, String rankId) {
    final matchingImage = skin.images.where((img) => img.stageName == rankId).firstOrNull;
    if (matchingImage != null && matchingImage.imageUrl.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: skinStageImageUrl(matchingImage.imageUrl),
        height: 240,
        fit: BoxFit.contain,
        placeholder: (_, __) => const SizedBox(height: 240, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
        errorWidget: (_, __, ___) => const Icon(Icons.local_fire_department, size: 120, color: Colors.white24),
      );
    }
    return const SizedBox(
      height: 240,
      child: Center(
        child: Icon(Icons.help_outline, size: 120, color: Colors.white24),
      ),
    );
  }
}
