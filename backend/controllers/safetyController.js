/**
 * Safety Controller — RoadResQ Safety System 2.0
 *
 * POST /api/safety/risk-check        - Pre-job risk assessment
 * POST /api/safety/pin/generate      - Generate verification PIN for job
 * POST /api/safety/pin/verify        - Driver enters PIN at arrival
 * POST /api/safety/confirm           - Customer confirms safety before job
 * POST /api/safety/feedback          - Post-job safety feedback
 * GET  /api/safety/job/:jobId        - Get safety state of a job
 */

const {
  calculateRiskScore, generateJobPIN, verifyJobPIN,
  updateJobSafetyState, recordSafetyFeedback,
} = require('../utils/safetyEngine');
const { db } = require('../config/firebase');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail    = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// ─── POST /api/safety/risk-check ──────────────────────────────────────────────
const riskCheck = async (req, res) => {
  try {
    const { locationType, serviceType, vehicleType, scheduledPickupTime, pickupCoords } = req.body;
    const result = calculateRiskScore({ locationType, serviceType, vehicleType, scheduledPickupTime, pickupCoords });

    // Dynamic prompt messages based on risk
    let userPrompt = null;
    if (result.riskLevel === 'medium') {
      userPrompt = '⚠️ Some safety factors detected. Please review the warnings below.';
    } else if (result.riskLevel === 'high') {
      userPrompt = '⚠️ High-risk situation detected. Please confirm you are safe before proceeding.';
    } else if (result.riskLevel === 'critical') {
      userPrompt = '🚨 Critical risk detected. Your safety is the priority. Please move to a safe location before requesting service.';
    }

    return success(res, { ...result, userPrompt, requiresConfirmation: result.riskLevel !== 'low' });
  } catch (err) {
    return fail(res, 'Failed to calculate risk.', 500);
  }
};

// ─── POST /api/safety/pin/generate ───────────────────────────────────────────
const generatePIN = async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) return fail(res, 'jobId is required.');
  try {
    const pin = await generateJobPIN(jobId);
    // Return PIN to customer (they share it verbally or via app to driver)
    return success(res, {
      jobId,
      pin,
      message: 'Share this 4-digit PIN with your assigned driver when they arrive. Do not share it beforehand.',
      expiresNote: 'PIN is valid for the duration of this job only.',
    });
  } catch (err) {
    return fail(res, 'Failed to generate PIN.', 500);
  }
};

// ─── POST /api/safety/pin/verify ─────────────────────────────────────────────
const verifyPIN = async (req, res) => {
  const { jobId, pin } = req.body;
  if (!jobId || !pin) return fail(res, 'jobId and pin are required.');
  try {
    const result = await verifyJobPIN(jobId, pin);
    if (result.success) {
      return success(res, { jobId, verified: true, message: 'PIN verified. Job started.' });
    } else {
      return fail(res, result.error || 'PIN verification failed.', 400);
    }
  } catch (err) {
    return fail(res, 'Failed to verify PIN.', 500);
  }
};

// ─── POST /api/safety/confirm ─────────────────────────────────────────────────
// Customer confirms safety checklist before job starts
const confirmSafety = async (req, res) => {
  const { jobId, userId, confirmations } = req.body;
  if (!jobId || !userId) return fail(res, 'jobId and userId are required.');
  try {
    await updateJobSafetyState(jobId, {
      safetyConfirmed: true,
      safetyFlags: [],
    });

    // Log confirmation
    await db.collection('safety_confirmations').add({
      jobId, userId,
      confirmations: confirmations || [],
      confirmedAt: new Date().toISOString(),
    });

    return success(res, { jobId, safetyConfirmed: true, message: 'Safety confirmed. Assigning driver now.' });
  } catch (err) {
    return fail(res, 'Failed to confirm safety.', 500);
  }
};

// ─── POST /api/safety/feedback ────────────────────────────────────────────────
const submitSafetyFeedback = async (req, res) => {
  const { jobId, userId, feltSafe, safetyRating, incidentReport } = req.body;
  if (!jobId || !userId) return fail(res, 'jobId and userId are required.');
  try {
    const feedback = await recordSafetyFeedback(jobId, userId, { feltSafe, safetyRating, incidentReport });
    return success(res, { feedback, incidentCreated: !feltSafe || safetyRating <= 2 });
  } catch (err) {
    return fail(res, 'Failed to submit safety feedback.', 500);
  }
};

// ─── GET /api/safety/job/:jobId ───────────────────────────────────────────────
const getJobSafetyState = async (req, res) => {
  try {
    const snap = await db.collection('jobs').doc(req.params.jobId).get();
    if (!snap.exists) return fail(res, 'Job not found.', 404);
    const job = snap.data();
    return success(res, {
      jobId:            req.params.jobId,
      riskLevel:        job.riskLevel        || 'low',
      safetyConfirmed:  job.safetyConfirmed  || false,
      pinVerified:      job.pinVerified       || false,
      isPanicTriggered: job.isPanicTriggered  || false,
      safetyFlags:      job.safetyFlags       || [],
      arrivalPhotoUrl:  job.arrivalPhotoUrl   || null,
      completionPhotoUrl: job.completionPhotoUrl || null,
    });
  } catch (err) {
    return fail(res, 'Failed to get safety state.', 500);
  }
};

module.exports = { riskCheck, generatePIN, verifyPIN, confirmSafety, submitSafetyFeedback, getJobSafetyState };
