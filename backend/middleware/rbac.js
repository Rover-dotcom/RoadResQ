/**
 * RBAC Middleware — RoadResQ v9.0.0 (Week 7)
 *
 * Pre-built role guard middleware arrays for route protection.
 *
 * Usage:
 *   const { requireAdmin, requireDriver, requireOwnerOrAdmin } = require('../middleware/rbac');
 *   router.get('/admin-only', ...requireAdmin, handler);
 *   router.get('/user/:userId', ...requireOwnerOrAdmin('userId'), handler);
 */

const { verifyToken, requireRole } = require('./auth');

// ─── Pre-built Role Guards ───────────────────────────────────────────────────
// Each is an array of middleware that can be spread into route definitions.

/** Any authenticated user */
const requireAuth = [verifyToken];

/** Customer role only */
const requireCustomer = [verifyToken, requireRole('customer')];

/** Driver role only */
const requireDriver = [verifyToken, requireRole('driver')];

/** Garage role only */
const requireGarage = [verifyToken, requireRole('garage')];

/** Admin role only */
const requireAdmin = [verifyToken, requireRole('admin')];

/** Driver or Admin */
const requireDriverOrAdmin = [verifyToken, requireRole('driver', 'admin')];

/** Customer or Admin */
const requireCustomerOrAdmin = [verifyToken, requireRole('customer', 'admin')];

/** Any of the specified roles */
const requireAny = (...roles) => [verifyToken, requireRole(...roles)];

/**
 * Owner-or-Admin guard.
 * Checks that req.user.uid matches req.params[paramName] OR user is admin.
 * Must be used after verifyToken.
 *
 * @param {string} paramName — route param containing the user ID (default: 'userId')
 */
const requireOwnerOrAdmin = (paramName = 'userId') => [
  verifyToken,
  (req, res, next) => {
    const targetId = req.params[paramName] || req.body[paramName];
    if (req.user.role === 'admin' || req.user.uid === targetId) {
      return next();
    }
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. You can only access your own resources.',
    });
  },
];

module.exports = {
  requireAuth,
  requireCustomer,
  requireDriver,
  requireGarage,
  requireAdmin,
  requireDriverOrAdmin,
  requireCustomerOrAdmin,
  requireAny,
  requireOwnerOrAdmin,
};
