import 'package:flutter/material.dart';
import '../screens/home/home_screen.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> routes = {
    '/': (context) => const HomeScreen(),
  };
}
