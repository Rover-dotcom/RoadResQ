/**
 * Payout Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const {
  requestPayoutHandler,
  pendingPayoutsHandler,
  approvePayoutHandler,
  rejectPayoutHandler,
  driverPayoutHistoryHandler,
  getPayoutHandler,
} = require('../controllers/payoutController');

const router = Router();

router.post('/request', requestPayoutHandler);
router.get('/pending', pendingPayoutsHandler);
router.post('/:id/approve', approvePayoutHandler);
router.post('/:id/reject', rejectPayoutHandler);
router.get('/driver/:driverId', driverPayoutHistoryHandler);
router.get('/:id', getPayoutHandler);

module.exports = router;
