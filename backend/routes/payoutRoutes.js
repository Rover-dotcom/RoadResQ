/**
 * Payout Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  requestPayoutHandler,
  pendingPayoutsHandler,
  approvePayoutHandler,
  rejectPayoutHandler,
  driverPayoutHistoryHandler,
  getPayoutHandler,
} = require('../controllers/payoutController');

const router = Router();

router.post('/request', verifyToken, requireRole('driver'), requestPayoutHandler);
router.get('/pending', verifyToken, requireRole('admin'), pendingPayoutsHandler);
router.post('/:id/approve', verifyToken, requireRole('admin'), approvePayoutHandler);
router.post('/:id/reject', verifyToken, requireRole('admin'), rejectPayoutHandler);
router.get('/driver/:driverId', verifyToken, driverPayoutHistoryHandler);
router.get('/:id', verifyToken, getPayoutHandler);

module.exports = router;
