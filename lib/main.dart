import 'package:flutter/material.dart';
import 'package:road_resq/screens/login_screen.dart';
import 'package:road_resq/theme/app_theme.dart';

void main() {
  runApp(const RoadResQApp());
}

class RoadResQApp extends StatelessWidget {
  const RoadResQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,

      themeMode: ThemeMode.system,
      home: const LoginScreen()
    );
  }
}
