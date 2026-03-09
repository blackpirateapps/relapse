import 'dart:convert';

class UserState {
  UserState({
    required this.lastRelapse,
    required this.coinsAtLastRelapse,
    required this.equippedUpgrades,
    this.upgrades = const {},
    this.potionInventory = 0,
    this.potionActiveUntil,
    this.potionPurchasesThisStreak = 0,
    this.potionLastPurchaseAt,
    this.lastClaimedLevel = 0,
  });

  final DateTime lastRelapse;
  final int coinsAtLastRelapse;
  final Map<String, dynamic> equippedUpgrades;
  final Map<String, dynamic> upgrades;
  final int potionInventory;
  final DateTime? potionActiveUntil;
  final int potionPurchasesThisStreak;
  final DateTime? potionLastPurchaseAt;
  final int lastClaimedLevel;

  /// Returns the equipped item ID for a given type, or null.
  String? equippedIdForType(String type) {
    for (final entry in equippedUpgrades.entries) {
      if (entry.value == true) {
        // We check by matching known IDs to types
        if (_itemTypeFromId(entry.key) == type) {
          return entry.key;
        }
      }
    }
    return null;
  }

  bool isOwned(String itemId) => upgrades.containsKey(itemId);
  bool isEquipped(String itemId) => equippedUpgrades[itemId] == true;

  static String _itemTypeFromId(String id) {
    if (id.contains('_skin') || id == 'scarlet_phoenix_skin') return 'phoenix_skin';
    if (id.contains('_bg')) return 'background_theme';
    if (id == 'dark_forest_bg') return 'forest_theme';
    if (id.startsWith('aura_')) return 'phoenix_aura';
    if (id.contains('potion')) return 'potion';
    if (id.contains('tree')) return 'tree_sapling';
    return 'unknown';
  }

  factory UserState.fromJson(Map<String, dynamic> json) {
    final equipped = json['equipped_upgrades'];
    final owned = json['upgrades'];

    Map<String, dynamic> parseJsonField(dynamic value) {
      if (value is Map<String, dynamic>) return value;
      if (value is String && value.isNotEmpty) {
        try {
          final decoded = jsonDecode(value);
          if (decoded is Map<String, dynamic>) return decoded;
        } catch (_) {}
      }
      return const {};
    }

    DateTime? tryParseDate(dynamic v) {
      if (v == null) return null;
      if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
      return null;
    }

    return UserState(
      lastRelapse: DateTime.parse(json['lastRelapse'] as String),
      coinsAtLastRelapse: (json['coinsAtLastRelapse'] as num?)?.toInt() ?? 0,
      equippedUpgrades: parseJsonField(equipped),
      upgrades: parseJsonField(owned),
      potionInventory: (json['potion_inventory'] as num?)?.toInt() ?? 0,
      potionActiveUntil: tryParseDate(json['potion_active_until']),
      potionPurchasesThisStreak: (json['potion_purchases_this_streak'] as num?)?.toInt() ?? 0,
      potionLastPurchaseAt: tryParseDate(json['potion_last_purchase_at']),
      lastClaimedLevel: (json['lastClaimedLevel'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'lastRelapse': lastRelapse.toIso8601String(),
    'coinsAtLastRelapse': coinsAtLastRelapse,
    'equipped_upgrades': equippedUpgrades,
    'upgrades': upgrades,
    'potion_inventory': potionInventory,
    'potion_active_until': potionActiveUntil?.toIso8601String(),
    'potion_purchases_this_streak': potionPurchasesThisStreak,
    'potion_last_purchase_at': potionLastPurchaseAt?.toIso8601String(),
    'lastClaimedLevel': lastClaimedLevel,
  };
}
