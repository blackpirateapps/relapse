import 'dart:math' as math;

import '../constants/ranks.dart';
import '../models/rank.dart';

Rank rankFromHours(double hours) {
  for (var i = ranks.length - 1; i >= 0; i--) {
    if (hours >= ranks[i].hours) {
      return ranks[i];
    }
  }
  return ranks.first;
}

double totalHoursSince(DateTime lastRelapse) {
  return DateTime.now().difference(lastRelapse).inMilliseconds / (1000 * 60 * 60);
}

int streakCoins(double totalHours) {
  final safeHours = totalHours > 0 ? totalHours : 0;
  return (10 * math.pow(safeHours, 1.2)).floor();
}
