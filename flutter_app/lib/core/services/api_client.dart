import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/app_config.dart';
import '../models/phoenix_history.dart';
import '../models/shop_item.dart';
import '../models/user_state.dart';

class ApiClient {
  const ApiClient();

  static const _timeout = Duration(seconds: 8);

  Map<String, String> _headers(String password) {
    return {
      'Content-Type': 'application/json',
      'X-App-Password': password,
    };
  }

  Future<Map<String, dynamic>> fetchStateRaw(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/state');
    final response = await http.get(uri, headers: _headers(password)).timeout(_timeout);

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    if (response.statusCode != 200) {
      throw ApiException('Failed to load state (${response.statusCode})');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<UserState> fetchState(String password) async {
    final json = await fetchStateRaw(password);
    return UserState.fromJson(json);
  }

  Future<Map<String, dynamic>> fetchShopRaw(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/shop');
    final response = await http.get(uri, headers: _headers(password)).timeout(_timeout);

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    if (response.statusCode != 200) {
      throw ApiException('Failed to load shop (${response.statusCode})');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<List<ShopItem>> fetchShop(String password) async {
    final json = await fetchShopRaw(password);
    final items = json['shopItems'] as List<dynamic>? ?? [];
    return items.map((e) => ShopItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<UserState> buyItem(String password, String itemId) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/shop');
    final response = await http.post(
      uri,
      headers: _headers(password),
      body: jsonEncode({'action': 'buy', 'itemId': itemId}),
    ).timeout(_timeout);

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw ApiException(body['message'] as String? ?? 'Purchase failed');
    }
    return UserState.fromJson(body['userState'] as Map<String, dynamic>);
  }

  Future<UserState> equipItem(String password, String itemId, bool equip) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/shop');
    final response = await http.post(
      uri,
      headers: _headers(password),
      body: jsonEncode({'action': 'equip', 'itemId': itemId, 'equip': equip}),
    ).timeout(_timeout);

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw ApiException(body['message'] as String? ?? 'Equip failed');
    }
    return UserState.fromJson(body['userState'] as Map<String, dynamic>);
  }

  Future<void> relapse(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/relapse');
    final response = await http.post(uri, headers: _headers(password)).timeout(_timeout);

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    if (response.statusCode != 200) {
      throw ApiException('Failed to post relapse (${response.statusCode})');
    }
  }

  Future<List<dynamic>> fetchHistoryRaw(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/history');
    final response = await http.get(uri, headers: _headers(password)).timeout(_timeout);

    if (response.statusCode != 200) {
      throw ApiException('Failed to load history (${response.statusCode})');
    }
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<List<PhoenixHistory>> fetchHistory(String password) async {
    final raw = await fetchHistoryRaw(password);
    return raw.map((e) => PhoenixHistory.fromJson(e as Map<String, dynamic>)).toList();
  }
}

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
