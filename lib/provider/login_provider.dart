import 'package:flutter/material.dart';
import 'package:road_resq/models/user_model.dart';
import 'package:road_resq/screens/home_screen.dart';
import 'package:road_resq/services/auth_services.dart';

/// Login Provider — Week 1 + Week 2
///
/// Manages all auth flows:
///   - Google Sign-In
///   - Email/Password Login
///   - Email/Password Registration
///   - Sign Out
class LoginProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isGoogleLoginLoading = false;
  bool _isEmailLoginLoading = false;
  bool _isRegisterLoading = false;
  String? _errorMessage;
  UserModel? _currentUser;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isGoogleLoginLoading => _isGoogleLoginLoading;
  bool get isEmailLoginLoading => _isEmailLoginLoading;
  bool get isRegisterLoading => _isRegisterLoading;
  bool get isLoading =>
      _isGoogleLoginLoading || _isEmailLoginLoading || _isRegisterLoading;
  String? get errorMessage => _errorMessage;
  UserModel? get currentUser => _currentUser;

  // ─── Google Sign-In ──────────────────────────────────────────────────────────

  Future<void> handleGoogleLogin(BuildContext context) async {
    _isGoogleLoginLoading = true;
    _clearError();
    notifyListeners();

    try {
      final user = await _authService.signInWithGoogle();

      if (user != null) {
        _currentUser = user;
        if (!context.mounted) return;
        _navigateToHome(context);
      } else {
        if (!context.mounted) return;
        _showSnack(context, 'Login cancelled.');
      }
    } catch (e) {
      if (!context.mounted) return;
      _showSnack(context, e.toString().replaceFirst('Exception: ', ''));
    } finally {
      _isGoogleLoginLoading = false;
      notifyListeners();
    }
  }

  // ─── Email Login ──────────────────────────────────────────────────────────────

  Future<void> handleEmailLogin({
    required BuildContext context,
    required String email,
    required String password,
  }) async {
    _isEmailLoginLoading = true;
    _clearError();
    notifyListeners();

    try {
      final user = await _authService.loginWithEmail(
        email: email,
        password: password,
      );

      if (user != null) {
        _currentUser = user;
        if (!context.mounted) return;
        _navigateToHome(context);
      } else {
        if (!context.mounted) return;
        _showSnack(context, 'Login failed. Please try again.');
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      if (!context.mounted) return;
      _showSnack(context, _errorMessage!);
    } finally {
      _isEmailLoginLoading = false;
      notifyListeners();
    }
  }

  // ─── Email Registration ───────────────────────────────────────────────────────

  Future<void> handleEmailRegister({
    required BuildContext context,
    required String name,
    required String email,
    required String password,
    required String phone,
    String role = 'customer',
  }) async {
    _isRegisterLoading = true;
    _clearError();
    notifyListeners();

    try {
      final user = await _authService.registerWithEmail(
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: role,
      );

      if (user != null) {
        _currentUser = user;
        if (!context.mounted) return;
        _navigateToHome(context);
      } else {
        if (!context.mounted) return;
        _showSnack(context, 'Registration failed. Please try again.');
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      if (!context.mounted) return;
      _showSnack(context, _errorMessage!);
    } finally {
      _isRegisterLoading = false;
      notifyListeners();
    }
  }

  // ─── Sign Out ────────────────────────────────────────────────────────────────

  Future<void> signOut(BuildContext context) async {
    await _authService.signOut();
    _currentUser = null;
    notifyListeners();
    // AuthGate in main.dart will automatically redirect to LoginScreen
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  void _navigateToHome(BuildContext context) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const HomeScreen()),
    );
  }

  void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _clearError() {
    _errorMessage = null;
  }

  void clearError() => _clearError();
}