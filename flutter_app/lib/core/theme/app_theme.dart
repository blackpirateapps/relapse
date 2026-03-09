import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  const seed = Color(0xFFFFB300);
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
    scaffoldBackgroundColor: const Color(0xFF0B1020),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF111A2F),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: const CardThemeData(
      color: Color(0xFF151F36),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(18))),
    ),
  );
}
