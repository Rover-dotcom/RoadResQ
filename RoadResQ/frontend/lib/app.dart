import 'package:flutter/material.dart';
import 'routes/app_routes.dart';
import 'core/theme/app_theme.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RoadResQ',
      theme: AppTheme.light,
      initialRoute: '/',
      routes: AppRoutes.routes,
    );
  }
}
