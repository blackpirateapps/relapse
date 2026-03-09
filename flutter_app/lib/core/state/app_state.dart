import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../models/rank.dart';
import '../models/user_state.dart';
import '../services/api_client.dart';
import '../services/session_store.dart';
import '../utils/rank_utils.dart';

class AppState extends ChangeNotifier {
  AppState({
    ApiClient? apiClient,
    SessionStore? sessionStore,
  })  : _apiClient = apiClient ?? const ApiClient(),
        _sessionStore = sessionStore ?? SessionStore();

  final ApiClient _apiClient;
  final SessionStore _sessionStore;

  UserState? state;
  String? password;
  String? error;
  bool isLoading = false;
  Timer? _ticker;

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

  Future<void> bootstrap() async {
    password = await _sessionStore.readPassword();
    if (password == null || password!.isEmpty) {
      notifyListeners();
      return;
    }
    await refresh();
  }

  Future<bool> login(String inputPassword) async {
    password = inputPassword.trim();
    await refresh(saveOnSuccess: true);
    return isAuthenticated;
  }

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
      final nextState = await _apiClient.fetchState(pwd);
      state = nextState;
      if (saveOnSuccess) {
        await _sessionStore.savePassword(pwd);
      }
      _startTicker();
    } catch (err) {
      state = null;
      error = err.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

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

  Future<void> logout() async {
    state = null;
    password = null;
    _ticker?.cancel();
    await _sessionStore.clearPassword();
    notifyListeners();
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => notifyListeners());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }
}
