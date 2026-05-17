/**
 * Dispatch Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const {
  dispatchJobHandler,
  acceptJobHandler,
  declineJobHandler,
  cancelDispatchHandler,
  dispatchStatusHandler,
} = require('../controllers/dispatchController');

const router = Router();

router.post('/:jobId', dispatchJobHandler);
router.post('/:jobId/accept', acceptJobHandler);
router.post('/:jobId/decline', declineJobHandler);
router.post('/:jobId/cancel', cancelDispatchHandler);
router.get('/:jobId/status', dispatchStatusHandler);

module.exports = router;
