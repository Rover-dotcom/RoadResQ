/**
 * Dashboard Routes — RoadResQ (Week 4 Addition)
 *
 * Role-separated dashboards:
 *   GET /api/dashboard/admin           — admin overview
 *   GET /api/dashboard/driver/:driverId — driver dashboard
 *   GET /api/dashboard/user/:userId     — user dashboard
 *   GET /api/dashboard/garage/:garageId — garage dashboard
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAdminDashboard,
  getDriverDashboard,
  getUserDashboard,
  getGarageDashboard,
} = require('../controllers/dashboardController');

router.get('/admin', verifyToken, requireRole('admin'), getAdminDashboard);
router.get('/driver/:driverId', verifyToken, getDriverDashboard);
router.get('/user/:userId', verifyToken, getUserDashboard);
router.get('/garage/:garageId', verifyToken, getGarageDashboard);

module.exports = router;
