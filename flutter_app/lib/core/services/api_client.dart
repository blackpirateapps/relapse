import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/app_config.dart';
import '../models/user_state.dart';

class ApiClient {
  const ApiClient();

  Map<String, String> _headers(String password) {
    return {
      'Content-Type': 'application/json',
      'X-App-Password': password,
    };
  }

  Future<UserState> fetchState(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/state');
    final response = await http.get(uri, headers: _headers(password));

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    if (response.statusCode != 200) {
      throw ApiException('Failed to load state (${response.statusCode})');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return UserState.fromJson(decoded);
  }

  Future<void> relapse(String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/api/relapse');
    final response = await http.post(uri, headers: _headers(password));

    if (response.statusCode == 401) {
      throw const ApiException('Invalid password');
    }
    if (response.statusCode != 200) {
      throw ApiException('Failed to post relapse (${response.statusCode})');
    }
  }
}

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
