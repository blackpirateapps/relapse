import 'package:flutter/material.dart';

import 'core/state/app_state.dart';
import 'core/theme/app_theme.dart';
import 'features/aviary/aviary_page.dart';
import 'features/journey/journey_page.dart';
import 'features/placeholder/placeholder_page.dart';
import 'features/progression/progression_page.dart';
import 'features/shop/shop_page.dart';
import 'widgets/login_gate.dart';

class PhoenixNativeApp extends StatefulWidget {
  const PhoenixNativeApp({super.key});

  @override
  State<PhoenixNativeApp> createState() => _PhoenixNativeAppState();
}

class _PhoenixNativeAppState extends State<PhoenixNativeApp> {
  late final AppState _appState;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _appState = AppState()..bootstrap();
  }

  @override
  void dispose() {
    _appState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Phoenix Journey',
      theme: buildAppTheme(),
      home: AnimatedBuilder(
        animation: _appState,
        builder: (context, _) {
          if (!_appState.isAuthenticated) {
            return LoginGate(appState: _appState);
          }

          final pages = [
            JourneyPage(appState: _appState),
            ProgressionPage(appState: _appState),
            const PlaceholderPage(title: 'Forest', detail: 'Native forest module is planned.'),
            ShopPage(appState: _appState),
            AviaryPage(appState: _appState),
          ];

          return Scaffold(
            appBar: AppBar(
              title: Text(_titleForIndex(_index)),
            ),
            body: SafeArea(child: pages[_index]),
            bottomNavigationBar: NavigationBar(
              selectedIndex: _index,
              onDestinationSelected: (value) => setState(() => _index = value),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.local_fire_department_outlined), selectedIcon: Icon(Icons.local_fire_department), label: 'Journey'),
                NavigationDestination(icon: Icon(Icons.trending_up_outlined), selectedIcon: Icon(Icons.trending_up), label: 'Progression'),
                NavigationDestination(icon: Icon(Icons.park_outlined), selectedIcon: Icon(Icons.park), label: 'Forest'),
                NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Shop'),
                NavigationDestination(icon: Icon(Icons.history_toggle_off_outlined), selectedIcon: Icon(Icons.history_toggle_off), label: 'Aviary'),
              ],
            ),
          );
        },
      ),
    );
  }

  String _titleForIndex(int index) {
    switch (index) {
      case 0: return 'Journey';
      case 1: return 'Progression';
      case 2: return 'Forest';
      case 3: return 'Shop';
      case 4: return 'Aviary';
      default: return 'Phoenix Journey';
    }
  }
}
