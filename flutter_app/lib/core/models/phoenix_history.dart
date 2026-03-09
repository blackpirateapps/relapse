class PhoenixHistory {
  const PhoenixHistory({
    required this.id,
    required this.name,
    this.finalRankName,
    this.finalRankLevel,
    this.streakDurationMs,
    this.startDate,
    this.endDate,
    this.upgradesJson,
  });

  final int id;
  final String name;
  final String? finalRankName;
  final int? finalRankLevel;
  final int? streakDurationMs;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? upgradesJson;

  String get formattedDuration {
    if (streakDurationMs == null) return '--';
    final d = Duration(milliseconds: streakDurationMs!);
    final days = d.inDays;
    final hours = d.inHours % 24;
    if (days > 0) return '${days}d ${hours}h';
    return '${hours}h ${d.inMinutes % 60}m';
  }

  String get formattedEndDate {
    if (endDate == null) return '--';
    final d = endDate!;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  /// The rank ID for image lookup. Map level to rank ID.
  String get rankId {
    const levelToId = {
      0: 'egg-1', 1: 'egg-2', 2: 'egg-3',
      3: 'hatchling-1', 4: 'hatchling-2', 5: 'hatchling-3',
      6: 'chick-1', 7: 'chick-2',
      8: 'youngling-1', 9: 'youngling-2',
      10: 'sunfire-1', 11: 'sunfire-2',
      12: 'guardian-1', 13: 'guardian-2',
      14: 'drake', 15: 'celestial-phoenix',
    };
    return levelToId[finalRankLevel] ?? 'egg-1';
  }

  factory PhoenixHistory.fromJson(Map<String, dynamic> json) {
    return PhoenixHistory(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? 'Phoenix',
      finalRankName: json['final_rank_name'] as String?,
      finalRankLevel: (json['final_rank_level'] as num?)?.toInt(),
      streakDurationMs: (json['streak_duration_ms'] as num?)?.toInt(),
      startDate: json['start_date'] != null ? DateTime.tryParse(json['start_date'] as String) : null,
      endDate: json['end_date'] != null ? DateTime.tryParse(json['end_date'] as String) : null,
      upgradesJson: json['upgrades_json'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'final_rank_name': finalRankName,
    'final_rank_level': finalRankLevel,
    'streak_duration_ms': streakDurationMs,
    'start_date': startDate?.toIso8601String(),
    'end_date': endDate?.toIso8601String(),
    'upgrades_json': upgradesJson,
  };
}
