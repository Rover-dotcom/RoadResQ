/**
 * Safety Controller — RoadResQ Safety System 2.0
 *
 * POST /api/safety/risk-check             - Pre-job risk assessment
 * POST /api/safety/pin/generate           - Generate verification PIN for job
 * POST /api/safety/pin/verify             - Driver enters PIN at arrival
 * POST /api/safety/confirm                - Customer confirms safety before job
 * POST /api/safety/feedback               - Post-job safety feedback
 * GET  /api/safety/job/:jobId             - Get safety state of a job
 * GET  /api/safety/checklist/:serviceType - Get checklist items for a service type
 * POST /api/safety/service-check          - Submit service-specific safety check
 */

const {
  calculateRiskScore, generateJobPIN, verifyJobPIN,
  updateJobSafetyState, recordSafetyFeedback,
  getServiceChecklist, submitServiceSafetyCheck, SERVICE_SAFETY_CHECKLISTS,
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

// ─── GET /api/safety/checklist/:serviceType ───────────────────────────────────
/**
 * Returns the checklist items for a specific service type.
 * Frontend uses this to render the checklist UI for the driver.
 */
const getChecklistHandler = (req, res) => {
  const { serviceType } = req.params;
  const checklist = getServiceChecklist(serviceType);
  if (!checklist) {
    return fail(res, `No checklist defined for service type: ${serviceType}. Available: ${Object.keys(SERVICE_SAFETY_CHECKLISTS).join(', ')}`, 404);
  }
  return success(res, { serviceType, ...checklist });
};

// ─── GET /api/safety/checklists ───────────────────────────────────────────────
/**
 * Returns all available service safety checklists.
 */
const getAllChecklistsHandler = (_req, res) => {
  return success(res, SERVICE_SAFETY_CHECKLISTS);
};

// ─── POST /api/safety/service-check ───────────────────────────────────────────
/**
 * Driver submits the service-specific safety check.
 * e.g. for tow: vehicle mounted, straps tightened, etc.
 * All items MUST be true before job can proceed.
 *
 * Body: { jobId, driverId, serviceType, checks: { vehicleLoadedSecurely: true, ... } }
 */
const submitServiceCheckHandler = async (req, res) => {
  const { jobId, driverId, serviceType, checks } = req.body;
  if (!jobId || !driverId || !serviceType) {
    return fail(res, 'jobId, driverId, and serviceType are required.');
  }
  if (!checks || typeof checks !== 'object') {
    return fail(res, 'checks must be an object with boolean values for each checklist item.');
  }

  try {
    const result = await submitServiceSafetyCheck(jobId, driverId, serviceType, checks);
    if (!result.success) {
      return fail(res, result.error, 400, { failedItems: result.failedItems, results: result.results });
    }
    return success(res, {
      message: `${result.record.checklistLabel} passed. Job can proceed.`,
      record: result.record,
    });
  } catch (err) {
    console.error('Service safety check error:', err);
    return fail(res, 'Failed to submit service safety check.', 500);
  }
};

module.exports = {
  riskCheck, generatePIN, verifyPIN, confirmSafety,
  submitSafetyFeedback, getJobSafetyState,
  getChecklistHandler, getAllChecklistsHandler, submitServiceCheckHandler,
};
