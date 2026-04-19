/**
 * Auth Controller — Week 1 Task 3
 *
 * POST /api/auth/register  → registerUser()
 * POST /api/auth/login     → loginUser()
 *
 * Uses Firebase Auth Admin SDK to create/verify users.
 * Creates a Firestore user document on registration.
 */

const { auth } = require('../config/firebase');
const { createUser, getUserById, getUserByEmail } = require('../models/userModel');
const { validationResult } = require('express-validator');

// ─── POST /api/auth/register ──────────────────────────────────────────────────

/**
 * Registers a new user.
 *
 * Body: { name, email, password, phone, role? }
 * Creates Firebase Auth account + Firestore user document.
 *
 * Postman test: POST http://localhost:3000/api/auth/register
 */
const registerUser = async (req, res) => {
  // Week 3 Task 12: validation / error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, email, password, phone, role } = req.body;

  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create Firestore document
    const user = await createUser(userRecord.uid, {
      name,
      email,
      phone,
      role: role || 'customer',
    });

    return res.status(201).json({
      status: 'success',
      data: {
        uid: userRecord.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // Firebase Auth error codes
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({
        status: 'error',
        message: 'Email is already registered.',
      });
    }
    if (err.code === 'auth/invalid-password') {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters.',
      });
    }
    console.error('Register error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.',
    });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

/**
 * Validates a Firebase ID token sent from the Flutter client.
 *
 * The Flutter app signs users in via Firebase Auth SDK (client-side),
 * then sends the ID token to this endpoint for server-side verification.
 *
 * Body: { idToken }
 *
 * Postman test: POST http://localhost:3000/api/auth/login
 *   Body: { "idToken": "<Firebase ID token from Flutter>" }
 */
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { idToken } = req.body;

  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile from Firestore
    const user = await getUserById(uid);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found. Please register first.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired. Please sign in again.',
      });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.',
      });
    }
    console.error('Login error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Login verification failed.',
    });
  }
};

module.exports = { registerUser, loginUser };
