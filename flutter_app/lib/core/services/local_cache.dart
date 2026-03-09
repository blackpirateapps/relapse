import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// SharedPreferences-backed JSON cache for offline-first support.
class LocalCache {
  static const _stateKey = 'cached_state';
  static const _shopKey = 'cached_shop';
  static const _historyKey = 'cached_history';

  Future<void> saveState(Map<String, dynamic> json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_stateKey, jsonEncode(json));
  }

  Future<Map<String, dynamic>?> loadState() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_stateKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveShop(Map<String, dynamic> json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_shopKey, jsonEncode(json));
  }

  Future<Map<String, dynamic>?> loadShop() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_shopKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveHistory(List<dynamic> json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_historyKey, jsonEncode(json));
  }

  Future<List<dynamic>?> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_historyKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as List<dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_stateKey);
    await prefs.remove(_shopKey);
    await prefs.remove(_historyKey);
  }
}
