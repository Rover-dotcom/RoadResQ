/**
 * Auth Routes — RoadResQ v4.1.0
 *
 * POST /api/auth/register  — Create account (Firebase Auth + Firestore)
 * POST /api/auth/login     — Verify Firebase ID token, return user profile
 * GET  /api/auth/me        — Get own profile (requires Bearer token)
 * GET  /api/auth/user/:uid — Get user profile by UID (admin/internal)
 */

const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { getUserById } = require('../models/userModel');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role')
      .optional()
      .isIn(['customer', 'driver', 'admin', 'garage'])
      .withMessage('Role must be: customer | driver | admin | garage'),
  ],
  registerUser
);

// POST /api/auth/login  — Flutter sends Firebase ID token here
router.post(
  '/login',
  [body('idToken').notEmpty().withMessage('Firebase ID token is required')],
  loginUser
);

// GET /api/auth/me — Protected: Authorization: Bearer <Firebase ID Token>
router.get('/me', verifyToken, getUserProfile);

// GET /api/auth/user/:uid — Lookup any user profile by UID
router.get('/user/:uid', async (req, res) => {
  try {
    const user = await getUserById(req.params.uid);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    return res.json({ status: 'success', data: user });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch user.' });
  }
});

module.exports = router;
