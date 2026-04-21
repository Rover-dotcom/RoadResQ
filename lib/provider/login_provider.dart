import 'package:flutter/material.dart';
import 'package:road_resq/screens/home_screen.dart';
import 'package:road_resq/services/auth_services.dart';

class LoginProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  bool _isGoogleLoginLoading = false;
  bool get isGoogleLoginLoading => _isGoogleLoginLoading;

  Future<void> handleGoogleLogin(BuildContext context) async {
    _setLoading(true);

    try {
      final user = await _authService.signInWithGoogle();

      if (user != null) {
        if (!context.mounted) return;

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      } else {
        if (!context.mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Login cancelled or failed")),
        );
      }
    } catch (e) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isGoogleLoginLoading = value;
    notifyListeners(); // 🔥 THIS is required
  }
}