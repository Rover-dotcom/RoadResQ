/**
 * Dispatch Controller — RoadResQ (Week 6 v8.0.0)
 *
 * POST /api/dispatch/:jobId          — dispatch a job
 * POST /api/dispatch/:jobId/accept   — driver accepts
 * POST /api/dispatch/:jobId/decline  — driver declines
 * POST /api/dispatch/:jobId/cancel   — cancel dispatch
 * GET  /api/dispatch/:jobId/status   — dispatch state
 */

const {
  dispatchJob,
  handleDriverAccept,
  handleDriverDecline,
  cancelDispatch,
  getDispatchStatus,
} = require('../utils/dispatchEngine');

const ok = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// POST /api/dispatch/:jobId
async function dispatchJobHandler(req, res) {
  try {
    const { jobId } = req.params;
    const result = await dispatchJob(jobId);
    return ok(res, result, 201);
  } catch (err) {
    console.error('[Dispatch] Error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/dispatch/:jobId/accept
async function acceptJobHandler(req, res) {
  try {
    const { jobId } = req.params;
    const { driverId } = req.body;
    if (!driverId) return fail(res, 'driverId is required.');

    const result = await handleDriverAccept(jobId, driverId);
    if (!result.success) return fail(res, result.error);
    return ok(res, result);
  } catch (err) {
    console.error('[Dispatch] Accept error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/dispatch/:jobId/decline
async function declineJobHandler(req, res) {
  try {
    const { jobId } = req.params;
    const { driverId, reason } = req.body;
    if (!driverId) return fail(res, 'driverId is required.');

    const result = await handleDriverDecline(jobId, driverId, reason);
    if (!result.success) return fail(res, result.error || result.message);
    return ok(res, result);
  } catch (err) {
    console.error('[Dispatch] Decline error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/dispatch/:jobId/cancel
async function cancelDispatchHandler(req, res) {
  try {
    const { jobId } = req.params;
    const { reason, cancelledBy } = req.body;

    const result = await cancelDispatch(jobId, reason || 'Cancelled', cancelledBy || 'system');
    if (!result.success) return fail(res, result.error);
    return ok(res, result);
  } catch (err) {
    console.error('[Dispatch] Cancel error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/dispatch/:jobId/status
async function dispatchStatusHandler(req, res) {
  try {
    const { jobId } = req.params;
    const status = await getDispatchStatus(jobId);
    if (!status) return fail(res, 'No dispatch state found for this job.', 404);
    return ok(res, status);
  } catch (err) {
    console.error('[Dispatch] Status error:', err);
    return fail(res, err.message, 500);
  }
}

module.exports = {
  dispatchJobHandler,
  acceptJobHandler,
  declineJobHandler,
  cancelDispatchHandler,
  dispatchStatusHandler,
};
