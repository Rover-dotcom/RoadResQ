/**
 * History Routes — RoadResQ v9.0.0 (Week 7)
 */
const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  bookingHistoryHandler, driverEarningsHandler, driverPerformanceHandler,
  garageRepairHistoryHandler, autoOfflineHandler,
} = require('../controllers/historyController');

const router = Router();

router.get('/bookings',                verifyToken, bookingHistoryHandler);
router.get('/driver-earnings/:id',     verifyToken, driverEarningsHandler);
router.get('/driver-performance/:id',  verifyToken, driverPerformanceHandler);
router.get('/garage-repairs/:id',      verifyToken, garageRepairHistoryHandler);
router.post('/auto-offline',           verifyToken, requireRole('admin'), autoOfflineHandler);

module.exports = router;
