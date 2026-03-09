import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/constants/app_config.dart';
import '../../core/models/shop_item.dart';
import '../../core/state/app_state.dart';
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
                    SizedBox(
                      height: 200,
                      child: _PhoenixDisplay(
                        rankId: rank.id,
                        equippedSkin: equippedSkin,
                        equippedAura: equippedAura,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(rank.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    if (state != null)
                      StreakTicker(lastRelapse: state.lastRelapse)
                    else
                      const Text('--', textAlign: TextAlign.center, style: TextStyle(fontSize: 20, color: Color(0xFF73F0A9))),
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
        // Aura behind phoenix (if equipped)
        if (equippedAura != null)
          _buildWebImage(
            _resolveAuraUrl(equippedAura!),
            size: 200,
            opacity: 0.6,
          ),

        // Phoenix image: use skin if equipped, else default SVG
        if (equippedSkin != null)
          _buildSkinImage(equippedSkin!, rankId)
        else
          SizedBox(height: 180, child: _DefaultPhoenixArt(rankId)),
      ],
    );
  }

  Widget _buildSkinImage(ShopItem skin, String rankId) {
    // Find the image matching the current rank stage
    final matchingImage = skin.images.where((img) => img.stageName == rankId).firstOrNull;
    if (matchingImage != null && matchingImage.imageUrl.isNotEmpty) {
      final url = matchingImage.imageUrl.startsWith('http')
          ? matchingImage.imageUrl
          : '${AppConfig.apiBaseUrl}${matchingImage.imageUrl}';
      return Image.network(
        url,
        height: 180,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => SizedBox(height: 180, child: _DefaultPhoenixArt(rankId)),
      );
    }
    // Fallback: use preview image
    final previewUrl = skin.previewImage;
    if (previewUrl != null && previewUrl.isNotEmpty) {
      final url = previewUrl.startsWith('http') ? previewUrl : '${AppConfig.apiBaseUrl}$previewUrl';
      return Image.network(
        url,
        height: 180,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => SizedBox(height: 180, child: _DefaultPhoenixArt(rankId)),
      );
    }
    return SizedBox(height: 180, child: _DefaultPhoenixArt(rankId));
  }

  String _resolveAuraUrl(ShopItem aura) {
    final preview = aura.previewImage ?? '';
    if (preview.startsWith('http')) return preview;
    return '${AppConfig.apiBaseUrl}$preview';
  }

  Widget _buildWebImage(String url, {double size = 180, double opacity = 1.0}) {
    return Opacity(
      opacity: opacity,
      child: Image.network(
        url,
        width: size,
        height: size,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
      ),
    );
  }
}

class _DefaultPhoenixArt extends StatelessWidget {
  const _DefaultPhoenixArt(this.rankId);

  final String rankId;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(_assetPath(rankId), fit: BoxFit.contain);
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
