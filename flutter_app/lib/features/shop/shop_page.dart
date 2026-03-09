import 'package:flutter/material.dart';

import '../../core/constants/app_config.dart';
import '../../core/models/shop_item.dart';
import '../../core/state/app_state.dart';

/// Map of item types to the categories shown as filter chips.
const _categoryOrder = [
  'phoenix_skin',
  'phoenix_aura',
  'background_theme',
  'forest_theme',
  'potion',
  'tree_sapling',
];

const _categoryLabels = {
  'phoenix_skin': 'Skins',
  'phoenix_aura': 'Auras',
  'background_theme': 'Backgrounds',
  'forest_theme': 'Forest',
  'potion': 'Potions',
  'tree_sapling': 'Trees',
};

class ShopPage extends StatefulWidget {
  const ShopPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends State<ShopPage> {
  String? _selectedCategory;

  List<ShopItem> get _filteredItems {
    final items = widget.appState.shopItems;
    if (_selectedCategory == null) return items;
    return items.where((i) => i.type == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems;
    final appState = widget.appState;

    if (appState.shopItems.isEmpty && appState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (appState.shopItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.storefront_outlined, size: 64, color: Colors.white38),
            const SizedBox(height: 16),
            const Text('Shop is loading...', style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: appState.refreshShop,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await appState.refresh();
        await appState.refreshShop();
      },
      child: CustomScrollView(
        slivers: [
          // Coin balance header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(
                children: [
                  const Icon(Icons.monetization_on, color: Color(0xFFFFB300), size: 22),
                  const SizedBox(width: 8),
                  Text(
                    '${appState.totalCoins} coins',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFFFB300)),
                  ),
                ],
              ),
            ),
          ),

          // Category filter chips
          SliverToBoxAdapter(
            child: SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: FilterChip(
                      label: const Text('All'),
                      selected: _selectedCategory == null,
                      onSelected: (_) => setState(() => _selectedCategory = null),
                    ),
                  ),
                  for (final type in _categoryOrder)
                    if (appState.shopItems.any((i) => i.type == type))
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: FilterChip(
                          label: Text(_categoryLabels[type] ?? type),
                          selected: _selectedCategory == type,
                          onSelected: (_) => setState(() => _selectedCategory = _selectedCategory == type ? null : type),
                        ),
                      ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // Item grid
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _ShopItemCard(
                  item: items[index],
                  appState: appState,
                ),
                childCount: items.length,
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

// ── Individual shop item card ───────────────────────────────────
class _ShopItemCard extends StatelessWidget {
  const _ShopItemCard({required this.item, required this.appState});

  final ShopItem item;
  final AppState appState;

  bool get _isOwned => appState.state?.isOwned(item.id) ?? false;
  bool get _isEquipped => appState.state?.isEquipped(item.id) ?? false;
  bool get _canAfford => appState.totalCoins >= item.cost;
  bool get _isEquippable => const ['phoenix_skin', 'background_theme', 'forest_theme', 'phoenix_aura'].contains(item.type);
  bool get _isConsumable => item.type == 'potion' || item.type == 'tree_sapling';

  String? get _imageUrl {
    final preview = item.previewImage;
    if (preview == null || preview.isEmpty) return null;
    if (preview.startsWith('http')) return preview;
    return '${AppConfig.apiBaseUrl}$preview';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview image
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 64,
                height: 64,
                color: const Color(0xFF1A2744),
                child: _imageUrl != null
                    ? Image.network(
                        _imageUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported, color: Colors.white24),
                      )
                    : _iconForType(),
              ),
            ),
            const SizedBox(width: 14),

            // Info + actions
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(item.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                      if (_isOwned && _isEquippable)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _isEquipped ? const Color(0xFF2E7D32) : const Color(0xFF37474F),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _isEquipped ? 'Equipped' : 'Owned',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(item.description, style: const TextStyle(fontSize: 13, color: Colors.white60)),
                  const SizedBox(height: 8),
                  Text(
                    _categoryLabels[item.type] ?? item.type,
                    style: TextStyle(fontSize: 11, color: Colors.white.withAlpha(90)),
                  ),
                  const SizedBox(height: 8),

                  // Action row
                  Row(
                    children: [
                      // Price
                      if (!_isOwned || _isConsumable) ...[
                        Icon(Icons.monetization_on, size: 16, color: _canAfford ? const Color(0xFFFFB300) : Colors.white38),
                        const SizedBox(width: 4),
                        Text(
                          '${item.cost}',
                          style: TextStyle(fontWeight: FontWeight.bold, color: _canAfford ? const Color(0xFFFFB300) : Colors.white38),
                        ),
                        const Spacer(),
                      ] else ...[
                        const Spacer(),
                      ],

                      // Buttons
                      if (_isOwned && _isEquippable)
                        SizedBox(
                          height: 32,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: _isEquipped
                                  ? const Color(0xFF37474F)
                                  : const Color(0xFFFFB300),
                              foregroundColor: _isEquipped ? Colors.white : Colors.black,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                            ),
                            onPressed: appState.isLoading ? null : () => _toggleEquip(context),
                            child: Text(_isEquipped ? 'Unequip' : 'Equip', style: const TextStyle(fontSize: 13)),
                          ),
                        )
                      else if (!_isOwned || _isConsumable)
                        SizedBox(
                          height: 32,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                            ),
                            onPressed: (appState.isLoading || !_canAfford) ? null : () => _buy(context),
                            child: const Text('Buy', style: TextStyle(fontSize: 13)),
                          ),
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
  }

  Widget _iconForType() {
    IconData icon;
    switch (item.type) {
      case 'phoenix_skin': icon = Icons.auto_awesome; break;
      case 'background_theme': icon = Icons.wallpaper; break;
      case 'forest_theme': icon = Icons.forest; break;
      case 'phoenix_aura': icon = Icons.flare; break;
      case 'potion': icon = Icons.science; break;
      case 'tree_sapling': icon = Icons.park; break;
      default: icon = Icons.shopping_bag;
    }
    return Icon(icon, color: Colors.white38, size: 28);
  }

  Future<void> _buy(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Buy ${item.name}?'),
        content: Text('This costs ${item.cost} coins.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Buy')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final success = await appState.buyItem(item.id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? '${item.name} purchased!' : (appState.actionMessage ?? 'Purchase failed')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _toggleEquip(BuildContext context) async {
    final equip = !_isEquipped;
    final success = await appState.equipItem(item.id, equip);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? '${item.name} ${equip ? 'equipped' : 'unequipped'}!'
              : (appState.actionMessage ?? 'Action failed')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
