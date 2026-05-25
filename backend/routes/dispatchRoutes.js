/**
 * Dispatch Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  dispatchJobHandler,
  acceptJobHandler,
  declineJobHandler,
  cancelDispatchHandler,
  dispatchStatusHandler,
} = require('../controllers/dispatchController');

const router = Router();

router.post('/:jobId', verifyToken, dispatchJobHandler);
router.post('/:jobId/accept', verifyToken, requireRole('driver'), acceptJobHandler);
router.post('/:jobId/decline', verifyToken, requireRole('driver'), declineJobHandler);
router.post('/:jobId/cancel', verifyToken, cancelDispatchHandler);
router.get('/:jobId/status', verifyToken, dispatchStatusHandler);

module.exports = router;
