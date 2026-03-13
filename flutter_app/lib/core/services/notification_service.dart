import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/rank_utils.dart';
import '../utils/time_format.dart';

/// Manages a persistent Android notification showing streak timer + coin balance.
/// Uses platform channels to create/update/cancel a foreground-style notification.
class NotificationService {
  static const _channel = MethodChannel('com.relapse.phoenix/notification');
  static const _prefKey = 'notification_enabled';

  Timer? _timer;
  bool _enabled = false;

  bool get enabled => _enabled;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _enabled = prefs.getBool(_prefKey) ?? false;
  }

  Future<bool> _ensurePermissionIfNeeded() async {
    try {
      final ok = await _channel.invokeMethod<bool>('requestPermission');
      return ok ?? true;
    } catch (_) {
      // Platform channel not available (e.g. tests or missing native side)
      return true;
    }
  }

  Future<bool> setEnabled(bool value) async {
    if (value) {
      final ok = await _ensurePermissionIfNeeded();
      if (!ok) return false;
    }

    _enabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, value);
    if (!value) {
      stop();
    }
    return true;
  }

  void startIfEnabled(DateTime lastRelapse, int coinsAtLastRelapse) {
    if (!_enabled) return;
    start(lastRelapse, coinsAtLastRelapse);
  }

  void start(DateTime lastRelapse, int coinsAtLastRelapse) {
    stop();
    _updateNotification(lastRelapse, coinsAtLastRelapse);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _updateNotification(lastRelapse, coinsAtLastRelapse);
    });
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _cancelNotification();
  }

  void _updateNotification(DateTime lastRelapse, int coinsAtLastRelapse) {
    final duration = DateTime.now().difference(lastRelapse);
    final safe = duration.isNegative ? Duration.zero : duration;
    final totalHrs = totalHoursSince(lastRelapse);
    final safeHours = totalHrs > 0 ? totalHrs : 0;
    final streak = (10 * math.pow(safeHours, 1.2)).floor();
    final coins = coinsAtLastRelapse + streak;

    final streakText = formatStreak(safe);

    try {
      _channel.invokeMethod('showNotification', {
        'title': 'Phoenix Streak: $streakText',
        'body': 'Coins: $coins',
      });
    } catch (_) {
      // Platform channel not available (e.g. debug mode without native side)
    }
  }

  void _cancelNotification() {
    try {
      _channel.invokeMethod('cancelNotification');
    } catch (_) {}
  }

  void dispose() {
    stop();
  }
}
