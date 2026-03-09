import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../models/rank.dart';
import '../models/shop_item.dart';
import '../models/user_state.dart';
import '../services/api_client.dart';
import '../services/local_cache.dart';
import '../services/session_store.dart';
import '../utils/rank_utils.dart';

class AppState extends ChangeNotifier {
  AppState({
    ApiClient? apiClient,
    SessionStore? sessionStore,
    LocalCache? localCache,
  })  : _apiClient = apiClient ?? const ApiClient(),
        _sessionStore = sessionStore ?? SessionStore(),
        _localCache = localCache ?? LocalCache();

  final ApiClient _apiClient;
  final SessionStore _sessionStore;
  final LocalCache _localCache;

  UserState? state;
  String? password;
  String? error;
  bool isLoading = false;
  List<ShopItem> shopItems = [];
  Timer? _syncTimer;
  String? actionMessage;

  bool get isAuthenticated => state != null && (password?.isNotEmpty ?? false);

  Duration get streakDuration {
    final s = state;
    if (s == null) return Duration.zero;
    return DateTime.now().difference(s.lastRelapse);
  }

  double get totalHours => state == null ? 0 : totalHoursSince(state!.lastRelapse);
  Rank get currentRank => rankFromHours(totalHours);

  int get totalCoins {
    final s = state;
    if (s == null) return 0;
    final safeHours = totalHours > 0 ? totalHours : 0;
    final streak = (10 * math.pow(safeHours, 1.2)).floor();
    return s.coinsAtLastRelapse + streak;
  }

  // ── Bootstrap: offline-first ──────────────────────────────────
  Future<void> bootstrap() async {
    password = await _sessionStore.readPassword();
    if (password == null || password!.isEmpty) {
      notifyListeners();
      return;
    }

    // Load from cache first → instant UI
    await _loadFromCache();
    notifyListeners();

    // Then sync in background
    _syncInBackground();
    _startSyncTimer();
  }

  Future<void> _loadFromCache() async {
    try {
      final cachedState = await _localCache.loadState();
      if (cachedState != null) {
        state = UserState.fromJson(cachedState);
      }
      final cachedShop = await _localCache.loadShop();
      if (cachedShop != null) {
        final items = cachedShop['shopItems'] as List<dynamic>? ?? [];
        shopItems = items.map((e) => ShopItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {
      // Cache corrupted — will be overwritten on next sync
    }
  }

  void _syncInBackground() {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) return;

    // Fire and forget — don't block UI
    _syncState(pwd);
    _syncShop(pwd);
  }

  Future<void> _syncState(String pwd) async {
    try {
      final rawJson = await _apiClient.fetchStateRaw(pwd);
      state = UserState.fromJson(rawJson);
      await _localCache.saveState(rawJson);
      notifyListeners();
    } catch (_) {
      // Offline — keep cached state
    }
  }

  Future<void> _syncShop(String pwd) async {
    try {
      final rawJson = await _apiClient.fetchShopRaw(pwd);
      final items = rawJson['shopItems'] as List<dynamic>? ?? [];
      shopItems = items.map((e) => ShopItem.fromJson(e as Map<String, dynamic>)).toList();
      await _localCache.saveShop(rawJson);
      notifyListeners();
    } catch (_) {
      // Offline — keep cached shop
    }
  }

  void _startSyncTimer() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) => _syncInBackground());
  }

  // ── Login ─────────────────────────────────────────────────────
  Future<bool> login(String inputPassword) async {
    password = inputPassword.trim();
    final pwd = password!;

    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final rawJson = await _apiClient.fetchStateRaw(pwd);
      state = UserState.fromJson(rawJson);
      await _sessionStore.savePassword(pwd);
      await _localCache.saveState(rawJson);
      _syncShop(pwd);
      _startSyncTimer();
    } catch (err) {
      state = null;
      error = err.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return isAuthenticated;
  }

  // ── Manual refresh ────────────────────────────────────────────
  Future<void> refresh({bool saveOnSuccess = false}) async {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) {
      error = 'Password is required';
      notifyListeners();
      return;
    }

    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final rawJson = await _apiClient.fetchStateRaw(pwd);
      state = UserState.fromJson(rawJson);
      await _localCache.saveState(rawJson);
      if (saveOnSuccess) {
        await _sessionStore.savePassword(pwd);
      }
    } catch (err) {
      // Keep existing cached state, just show error
      error = err.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ── Relapse ───────────────────────────────────────────────────
  Future<void> postRelapse() async {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) return;

    isLoading = true;
    error = null;
    notifyListeners();

    try {
      await _apiClient.relapse(pwd);
      await refresh();
    } catch (err) {
      error = err.toString();
      isLoading = false;
      notifyListeners();
    }
  }

  // ── Shop actions ──────────────────────────────────────────────
  Future<void> refreshShop() async {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) return;
    await _syncShop(pwd);
  }

  Future<bool> buyItem(String itemId) async {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) return false;

    isLoading = true;
    actionMessage = null;
    notifyListeners();

    try {
      final newState = await _apiClient.buyItem(pwd, itemId);
      state = newState;
      await _localCache.saveState(newState.toJson());
      actionMessage = 'Purchase successful!';
      // Refresh shop to update ownership
      _syncShop(pwd);
    } catch (err) {
      actionMessage = err.toString();
      isLoading = false;
      notifyListeners();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return true;
  }

  Future<bool> equipItem(String itemId, bool equip) async {
    final pwd = password;
    if (pwd == null || pwd.isEmpty) return false;

    isLoading = true;
    actionMessage = null;
    notifyListeners();

    try {
      final newState = await _apiClient.equipItem(pwd, itemId, equip);
      state = newState;
      await _localCache.saveState(newState.toJson());
      actionMessage = equip ? 'Item equipped!' : 'Item unequipped!';
    } catch (err) {
      actionMessage = err.toString();
      isLoading = false;
      notifyListeners();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return true;
  }

  // ── Logout ────────────────────────────────────────────────────
  Future<void> logout() async {
    state = null;
    password = null;
    shopItems = [];
    _syncTimer?.cancel();
    await _sessionStore.clearPassword();
    await _localCache.clearAll();
    notifyListeners();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}
