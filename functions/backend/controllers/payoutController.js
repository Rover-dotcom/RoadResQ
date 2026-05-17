/**
 * Payout Controller — RoadResQ (Week 6 v8.0.0)
 *
 * POST /api/payouts/request            — driver requests payout
 * GET  /api/payouts/pending            — admin: pending payouts
 * POST /api/payouts/:id/approve        — admin approves
 * POST /api/payouts/:id/reject         — admin rejects
 * GET  /api/payouts/driver/:driverId   — driver payout history
 * GET  /api/payouts/:id                — single payout detail
 */

const {
  requestPayout,
  approvePayout,
  rejectPayout,
  getPendingPayouts,
  getPayoutHistory,
  getPayoutById,
} = require('../utils/payoutEngine');

const ok = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// POST /api/payouts/request
async function requestPayoutHandler(req, res) {
  try {
    const { driverId, amount, bankDetails } = req.body;
    if (!driverId) return fail(res, 'driverId is required.');
    if (!amount || amount <= 0) return fail(res, 'amount is required and must be positive (in halala).');

    const result = await requestPayout(driverId, parseInt(amount), bankDetails || {});
    if (!result.success) return fail(res, result.error);
    return ok(res, result.payout, 201);
  } catch (err) {
    console.error('[Payout] Request error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/payouts/pending
async function pendingPayoutsHandler(req, res) {
  try {
    const { limit } = req.query;
    const payouts = await getPendingPayouts(parseInt(limit) || 50);
    return ok(res, { payouts, count: payouts.length });
  } catch (err) {
    console.error('[Payout] Pending error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/payouts/:id/approve
async function approvePayoutHandler(req, res) {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    const result = await approvePayout(id, approvedBy || 'admin');
    if (!result.success) return fail(res, result.error);
    return ok(res, result.payout);
  } catch (err) {
    console.error('[Payout] Approve error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/payouts/:id/reject
async function rejectPayoutHandler(req, res) {
  try {
    const { id } = req.params;
    const { reason, rejectedBy } = req.body;
    const result = await rejectPayout(id, reason || 'Rejected by admin', rejectedBy || 'admin');
    if (!result.success) return fail(res, result.error);
    return ok(res, result);
  } catch (err) {
    console.error('[Payout] Reject error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/payouts/driver/:driverId
async function driverPayoutHistoryHandler(req, res) {
  try {
    const { driverId } = req.params;
    const { limit } = req.query;
    const payouts = await getPayoutHistory(driverId, parseInt(limit) || 50);
    return ok(res, { driverId, payouts, count: payouts.length });
  } catch (err) {
    console.error('[Payout] Driver history error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/payouts/:id
async function getPayoutHandler(req, res) {
  try {
    const payout = await getPayoutById(req.params.id);
    if (!payout) return fail(res, 'Payout not found.', 404);
    return ok(res, payout);
  } catch (err) {
    console.error('[Payout] Get error:', err);
    return fail(res, err.message, 500);
  }
}

module.exports = {
  requestPayoutHandler,
  pendingPayoutsHandler,
  approvePayoutHandler,
  rejectPayoutHandler,
  driverPayoutHistoryHandler,
  getPayoutHandler,
};
