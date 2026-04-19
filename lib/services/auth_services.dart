import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:road_resq/models/user_model.dart';

/// Authentication service — Week 1 + Week 2
///
/// Handles:
///  - Email/password registration + login
///  - Google Sign-In
///  - Sign out
///  - Firestore user profile creation on register
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  // ─── Collections ────────────────────────────────────────────────────────────

  CollectionReference get _usersRef => _db.collection('users');

  // ─── Current User ────────────────────────────────────────────────────────────

  User? get currentUser => _auth.currentUser;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // ─── Register with Email & Password ─────────────────────────────────────────

  /// POST /register equivalent.
  /// Creates a Firebase Auth account AND a Firestore user document.
  Future<UserModel?> registerWithEmail({
    required String name,
    required String email,
    required String password,
    required String phone,
    String role = 'customer',
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final user = credential.user;
      if (user == null) return null;

      // Update Firebase Auth display name
      await user.updateDisplayName(name);

      // Create Firestore user document
      final userModel = UserModel(
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        createdAt: DateTime.now(),
      );

      await _usersRef.doc(user.uid).set(userModel.toMap());

      return userModel;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  // ─── Login with Email & Password ─────────────────────────────────────────────

  /// POST /login equivalent.
  Future<UserModel?> loginWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final user = credential.user;
      if (user == null) return null;

      return await _fetchUserProfile(user.uid);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  // ─── Google Sign-In ──────────────────────────────────────────────────────────

  Future<UserModel?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user;
      if (user == null) return null;

      // Check if Firestore document already exists
      final existing = await _usersRef.doc(user.uid).get();
      if (!existing.exists) {
        // First-time Google sign-in — create profile
        final userModel = UserModel(
          uid: user.uid,
          name: user.displayName ?? 'User',
          email: user.email ?? '',
          phone: user.phoneNumber ?? '',
          role: 'customer',
          createdAt: DateTime.now(),
        );
        await _usersRef.doc(user.uid).set(userModel.toMap());
        return userModel;
      }

      return await _fetchUserProfile(user.uid);
    } catch (e) {
      throw Exception('Google Sign-In failed: $e');
    }
  }

  // ─── Sign Out ────────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  // ─── Fetch User Profile ──────────────────────────────────────────────────────

  /// Fetch the Firestore user document for the given uid.
  Future<UserModel?> _fetchUserProfile(String uid) async {
    final doc = await _usersRef.doc(uid).get();
    if (!doc.exists) return null;
    return UserModel.fromDocument(doc);
  }

  /// Public version — used by providers and screens.
  Future<UserModel?> getUserProfile(String uid) => _fetchUserProfile(uid);

  // ─── Password Reset ──────────────────────────────────────────────────────────

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    }
  }

  // ─── Error Handling ──────────────────────────────────────────────────────────

  Exception _handleAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'email-already-in-use':
        return Exception('This email is already registered.');
      case 'invalid-email':
        return Exception('Invalid email address.');
      case 'weak-password':
        return Exception('Password must be at least 6 characters.');
      case 'user-not-found':
        return Exception('No account found with this email.');
      case 'wrong-password':
        return Exception('Incorrect password.');
      case 'too-many-requests':
        return Exception('Too many attempts. Please try again later.');
      default:
        return Exception(e.message ?? 'Authentication error.');
    }
  }
}