/**
 * Auth Routes — Week 1 Task 3
 *
 * POST /api/auth/register
 * POST /api/auth/login
 */

const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role')
      .optional()
      .isIn(['customer', 'driver', 'admin', 'garage'])
      .withMessage('Role must be customer, driver, admin, or garage'),
  ],
  registerUser
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post(
  '/login',
  [body('idToken').notEmpty().withMessage('Firebase ID token is required')],
  loginUser
);

module.exports = router;
