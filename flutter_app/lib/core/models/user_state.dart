class UserState {
  UserState({
    required this.lastRelapse,
    required this.coinsAtLastRelapse,
    required this.equippedUpgrades,
  });

  final DateTime lastRelapse;
  final int coinsAtLastRelapse;
  final Map<String, dynamic> equippedUpgrades;

  factory UserState.fromJson(Map<String, dynamic> json) {
    final equipped = json['equipped_upgrades'];
    return UserState(
      lastRelapse: DateTime.parse(json['lastRelapse'] as String),
      coinsAtLastRelapse: (json['coinsAtLastRelapse'] as num?)?.toInt() ?? 0,
      equippedUpgrades: equipped is Map<String, dynamic> ? equipped : const {},
    );
  }
}
