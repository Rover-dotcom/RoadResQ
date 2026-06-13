import 'package:flutter/material.dart';
import 'package:road_resq/models/user_model.dart';
import 'package:road_resq/services/auth_services.dart';

/// Login Provider — Week 1 + Week 2
///
/// Manages all auth flows:
///   - Google Sign-In
///   - Email/Password Login
///   - Email/Password Registration
///   - Password Reset
///   - Sign Out
class LoginProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isGoogleLoginLoading = false;
  bool _isEmailLoginLoading = false;
  bool _isRegisterLoading = false;
  bool _isResetLoading = false;
  String? _errorMessage;
  UserModel? _currentUser;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isGoogleLoginLoading => _isGoogleLoginLoading;
  bool get isEmailLoginLoading => _isEmailLoginLoading;
  bool get isRegisterLoading => _isRegisterLoading;
  bool get isResetLoading => _isResetLoading;
  bool get isLoading =>
      _isGoogleLoginLoading || _isEmailLoginLoading || _isRegisterLoading || _isResetLoading;
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
        notifyListeners();
        // AuthGate in main.dart will automatically redirect to HomeScreen
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

  /// Returns true on success, false on failure. 
  /// AuthGate handles navigation automatically on auth state change.
  Future<bool> handleEmailLogin({
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
        notifyListeners();
        // AuthGate will auto-redirect on auth state change
        return true;
      } else {
        if (!context.mounted) return false;
        _showSnack(context, 'Login failed. Please try again.');
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      if (!context.mounted) return false;
      _showSnack(context, _errorMessage!);
      return false;
    } finally {
      _isEmailLoginLoading = false;
      notifyListeners();
    }
  }

  // ─── Email Registration ───────────────────────────────────────────────────────

  /// Returns true on success, false on failure.
  Future<bool> handleEmailRegister({
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
        notifyListeners();
        // AuthGate will auto-redirect on auth state change
        return true;
      } else {
        if (!context.mounted) return false;
        _showSnack(context, 'Registration failed. Please try again.');
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      if (!context.mounted) return false;
      _showSnack(context, _errorMessage!);
      return false;
    } finally {
      _isRegisterLoading = false;
      notifyListeners();
    }
  }

  // ─── Password Reset ──────────────────────────────────────────────────────────

  /// Sends a password reset email via Firebase Auth.
  /// Returns true on success, false on failure.
  Future<bool> sendPasswordReset({
    required BuildContext context,
    required String email,
  }) async {
    _isResetLoading = true;
    _clearError();
    notifyListeners();

    try {
      await _authService.sendPasswordResetEmail(email);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      if (!context.mounted) return false;
      _showSnack(context, _errorMessage!);
      return false;
    } finally {
      _isResetLoading = false;
      notifyListeners();
    }
  }

  // ─── Load Current User Profile ───────────────────────────────────────────────

  /// Loads the user profile from Firestore for the given uid.
  Future<void> loadUserProfile(String uid) async {
    try {
      _currentUser = await _authService.getUserProfile(uid);
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to load profile: $e';
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