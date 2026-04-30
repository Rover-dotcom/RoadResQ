/**
 * Firebase Auth Middleware — RoadResQ
 *
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches decoded token to req.user = { uid, email, role }.
 *
 * Usage:
 *   const { verifyToken, requireRole } = require('../middleware/auth');
 *   router.get('/protected', verifyToken, requireRole('driver'), handler);
 *
 * Flutter sends:  Authorization: Bearer <Firebase ID Token>
 */

const { auth, db } = require('../config/firebase');

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Verifies Firebase ID token. Sets req.user = { uid, email, role, name }.
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authorization header missing or invalid. Expected: Bearer <Firebase ID Token>' });
  }

  const idToken = header.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(idToken);
    // Fetch role from Firestore user profile
    const snap = await db.collection('users').doc(decoded.uid).get();
    const profile = snap.exists ? snap.data() : {};
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: profile.role || 'customer',
      name: profile.name || decoded.name || '',
    };
    next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ status: 'error', message: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ status: 'error', message: 'Invalid or expired Firebase token.' });
  }
};

// ─── requireRole ──────────────────────────────────────────────────────────────
// Must be used after verifyToken. Pass one or more allowed roles.
// requireRole('driver')           — driver only
// requireRole('admin', 'garage')  — admin or garage
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
    });
  }
  next();
};

module.exports = { verifyToken, requireRole };
