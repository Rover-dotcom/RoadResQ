/**
 * Discipline Controller — RoadResQ (Week 4)
 *
 * Handles driver discipline, compliance enforcement, and admin job review.
 *
 * Driver Discipline:
 *   POST /api/discipline/no-show          → applyNoShowHandler()
 *   POST /api/discipline/warning/:driverId → issueLateWarningHandler()
 *   PUT  /api/discipline/clear/:driverId   → clearSuspensionHandler()
 *
 * Compliance:
 *   POST /api/discipline/compliance-check          → runComplianceCheckHandler()  (all drivers)
 *   GET  /api/discipline/compliance/:driverId       → getDriverComplianceHandler() (single driver)
 *
 * Priority Queue & Admin Review:
 *   GET  /api/discipline/priority-queue            → getPriorityQueueHandler()
 *   GET  /api/discipline/admin-review              → getAdminReviewQueueHandler()
 *   PUT  /api/discipline/admin-review/:jobId/assign → adminAssignJobHandler()
 *
 * Safety Checklists:
 *   POST /api/discipline/safety-check/:jobId/driver   → submitDriverSafetyCheckHandler()
 *   POST /api/discipline/safety-check/:jobId/customer → submitCustomerSafetyCheckHandler()
 *   GET  /api/discipline/safety-check/:jobId           → getSafetyChecksHandler()
 */

const { db } = require('../config/firebase');
const {
  applyNoShowPenalty,
  issueLateWarning,
  clearDriverSuspension,
  checkAndNotifyCompliance,
  runComplianceCheckForAllDrivers,
  getPriorityQueue,
  flagJobForAdminReview,
} = require('../utils/disciplineEngine');
const { getDriverById, updateDriver } = require('../models/driverModel');
const { autoAssignDriver } = require('../utils/matchingEngine');

const JOBS_COLLECTION = 'jobs';
const DRIVERS_COLLECTION = 'drivers';

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

// ─── POST /api/discipline/no-show ─────────────────────────────────────────────

/**
 * Apply no-show penalty to a customer.
 * Called after driver has been waiting 10+ minutes with no customer response.
 */
const applyNoShowHandler = async (req, res) => {
  const { jobId, customerId, driverId } = req.body;
  if (!jobId || !customerId || !driverId) {
    return error(res, 'jobId, customerId, and driverId are required.', 400);
  }
  try {
    const result = await applyNoShowPenalty(jobId, customerId, driverId);
    return success(res, {
      ...result,
      message: `No-show fee of QR ${(result.amount / 100).toFixed(2)} has been applied.`,
    });
  } catch (err) {
    console.error('No-show penalty error:', err);
    return error(res, 'Failed to apply no-show penalty.', 500);
  }
};

// ─── POST /api/discipline/warning/:driverId ───────────────────────────────────

/**
 * Issue a late warning to a driver.
 * At 3 warnings → auto-suspend.
 */
const issueLateWarningHandler = async (req, res) => {
  const { driverId } = req.params;
  const { jobId, reason } = req.body;

  if (!jobId) return error(res, 'jobId is required.', 400);

  try {
    const driver = await getDriverById(driverId);
    if (!driver) return error(res, 'Driver not found.', 404);

    const result = await issueLateWarning(driverId, jobId, reason);
    return success(res, result);
  } catch (err) {
    console.error('Issue warning error:', err);
    return error(res, 'Failed to issue warning.', 500);
  }
};

// ─── PUT /api/discipline/clear/:driverId ──────────────────────────────────────

/**
 * Admin clears a driver's suspension and resets warning count.
 */
const clearSuspensionHandler = async (req, res) => {
  const { driverId } = req.params;
  const { adminNote } = req.body;

  try {
    const driver = await getDriverById(driverId);
    if (!driver) return error(res, 'Driver not found.', 404);
    if (!driver.isSuspended) return error(res, 'Driver is not suspended.', 400);

    const result = await clearDriverSuspension(driverId, adminNote || '');
    return success(res, { ...result, message: 'Driver suspension cleared and warning count reset.' });
  } catch (err) {
    console.error('Clear suspension error:', err);
    return error(res, 'Failed to clear suspension.', 500);
  }
};

// ─── POST /api/discipline/compliance-check ────────────────────────────────────

/**
 * Run compliance check for ALL drivers.
 * Blocks expired drivers, logs alerts.
 * In production: trigger this via a scheduled Cloud Function daily.
 */
const runComplianceCheckHandler = async (req, res) => {
  try {
    const result = await runComplianceCheckForAllDrivers();
    return success(res, {
      message: 'Compliance check complete.',
      ...result,
    });
  } catch (err) {
    console.error('Compliance check error:', err);
    return error(res, 'Failed to run compliance check.', 500);
  }
};

// ─── GET /api/discipline/compliance/:driverId ─────────────────────────────────

/**
 * Get compliance status for a specific driver.
 * Returns tier: valid / expiring_soon / expiring_critical / expired
 */
const getDriverComplianceHandler = async (req, res) => {
  try {
    const driver = await getDriverById(req.params.driverId);
    if (!driver) return error(res, 'Driver not found.', 404);

    const result = await checkAndNotifyCompliance(req.params.driverId, driver);
    return success(res, {
      driverId: driver.id,
      name: driver.name,
      overallStatus: result.overallStatus,
      blocked: result.blocked,
      alerts: result.alerts,
      canTakeJobs: !result.blocked && !driver.isSuspended && driver.isApproved,
    });
  } catch (err) {
    console.error('Driver compliance check error:', err);
    return error(res, 'Failed to check compliance.', 500);
  }
};

// ─── GET /api/discipline/priority-queue ───────────────────────────────────────

/**
 * Get all pending jobs ranked by dispatch priority.
 * Highest priority → dispatched first.
 * Factors: urgency, service type, wait time, Others penalty.
 */
const getPriorityQueueHandler = async (req, res) => {
  try {
    const queue = await getPriorityQueue();
    return success(res, {
      count: queue.length,
      jobs: queue.map((j) => ({
        id: j.id,
        serviceType: j.serviceType,
        vehicleType: j.vehicleType,
        customItem: j.customItem || null,
        userId: j.userId,
        status: j.status,
        requiresAdminReview: j.requiresAdminReview || false,
        priorityScore: j._priorityScore,
        createdAt: j.createdAt,
      })),
    });
  } catch (err) {
    console.error('Priority queue error:', err);
    return error(res, 'Failed to fetch priority queue.', 500);
  }
};

// ─── GET /api/discipline/admin-review ─────────────────────────────────────────

/**
 * Get all jobs in the admin review queue.
 * These are custom/Others jobs the system could not auto-match.
 */
const getAdminReviewQueueHandler = async (req, res) => {
  try {
    const snapshot = await db.collection('admin_review_queue')
      .where('status', '==', 'pending_review')
      .orderBy('flaggedAt', 'asc')
      .get();

    const jobs = snapshot.docs.map((doc) => doc.data());
    return success(res, { count: jobs.length, jobs });
  } catch (err) {
    console.error('Admin review queue error:', err);
    return error(res, 'Failed to fetch admin review queue.', 500);
  }
};

// ─── PUT /api/discipline/admin-review/:jobId/assign ───────────────────────────

/**
 * Admin manually assigns a driver to a custom/Others job.
 * Marks the admin_review_queue entry as resolved.
 */
const adminAssignJobHandler = async (req, res) => {
  const { jobId } = req.params;
  const { driverId, adminNote } = req.body;

  if (!driverId) return error(res, 'driverId is required.', 400);

  try {
    // Get job
    const jobSnap = await db.collection(JOBS_COLLECTION).doc(jobId).get();
    if (!jobSnap.exists) return error(res, 'Job not found.', 404);

    // Get driver
    const driver = await getDriverById(driverId);
    if (!driver) return error(res, 'Driver not found.', 404);

    const now = new Date().toISOString();

    // Assign job
    await db.collection(JOBS_COLLECTION).doc(jobId).update({
      driverId,
      status: 'assigned',
      assignedAt: now,
      adminAssigned: true,
      adminNote: adminNote || '',
      requiresAdminReview: false,
    });

    // Mark driver unavailable
    await updateDriver(driverId, {
      isAvailable: false,
      activeJobId: jobId,
    });

    // Mark review queue entry resolved
    await db.collection('admin_review_queue').doc(jobId).update({
      status: 'resolved',
      resolvedAt: now,
      assignedDriverId: driverId,
      adminNote: adminNote || '',
    });

    return success(res, {
      jobId,
      driverId,
      status: 'assigned',
      message: 'Job manually assigned by admin.',
    });
  } catch (err) {
    console.error('Admin assign job error:', err);
    return error(res, 'Failed to assign job.', 500);
  }
};

// ─── POST /api/discipline/safety-check/:jobId/driver ─────────────────────────

/**
 * Driver submits pre-trip safety checklist BEFORE starting a job.
 *
 * Required checks:
 *   [ ] Hook secured
 *   [ ] Winch locked
 *   [ ] Safety lights ON
 *   [ ] Area is safe
 *   [ ] Vehicle secured
 *   [ ] Hazard lights ON
 *
 * All must be true to start job.
 */
const submitDriverSafetyCheckHandler = async (req, res) => {
  const { jobId } = req.params;
  const {
    driverId,
    hookSecured,
    winchLocked,
    safetyLightsOn,
    areaIsSafe,
    vehicleSecured,
    hazardLightsOn,
    properToolsUsed,
  } = req.body;

  if (!driverId) return error(res, 'driverId is required.', 400);

  const checks = {
    hookSecured: !!hookSecured,
    winchLocked: !!winchLocked,
    safetyLightsOn: !!safetyLightsOn,
    areaIsSafe: !!areaIsSafe,
    vehicleSecured: !!vehicleSecured,
    hazardLightsOn: !!hazardLightsOn,
    properToolsUsed: !!properToolsUsed,
  };

  const allPassed = Object.values(checks).every(Boolean);

  if (!allPassed) {
    const failed = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    return error(res, `Safety check incomplete. Failed items: ${failed.join(', ')}. All checks must be confirmed before starting.`, 400, { failedChecks: failed });
  }

  const checkRecord = {
    jobId,
    driverId,
    type: 'driver_pre_trip',
    checks,
    allPassed: true,
    submittedAt: new Date().toISOString(),
  };

  await db.collection('safety_checklists').doc(`driver_${jobId}`).set(checkRecord);

  // Update job to indicate driver safety check passed
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    driverSafetyCheckPassed: true,
    driverSafetyCheckAt: checkRecord.submittedAt,
  });

  return success(res, {
    message: 'Pre-trip safety check passed. Job can now begin.',
    checks,
    jobId,
  });
};

// ─── POST /api/discipline/safety-check/:jobId/customer ───────────────────────

/**
 * Customer confirms safety notice before job confirmation.
 *
 * Safety Notice:
 *   [ ] I am in a safe location away from traffic
 *   [ ] I understand I should not stand behind the vehicle
 *   [ ] I will verify mechanic/driver identity before service begins
 */
const submitCustomerSafetyCheckHandler = async (req, res) => {
  const { jobId } = req.params;
  const {
    userId,
    inSafeLocation,
    notStandingBehindVehicle,
    willVerifyIdentity,
  } = req.body;

  if (!userId) return error(res, 'userId is required.', 400);

  const checks = {
    inSafeLocation: !!inSafeLocation,
    notStandingBehindVehicle: !!notStandingBehindVehicle,
    willVerifyIdentity: !!willVerifyIdentity,
  };

  const allPassed = Object.values(checks).every(Boolean);

  if (!allPassed) {
    const failed = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    return error(res, `Safety confirmation incomplete. Please confirm all safety items.`, 400, { failedChecks: failed });
  }

  const checkRecord = {
    jobId,
    userId,
    type: 'customer_safety_confirmation',
    checks,
    allPassed: true,
    submittedAt: new Date().toISOString(),
  };

  await db.collection('safety_checklists').doc(`customer_${jobId}`).set(checkRecord);

  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    customerSafetyConfirmed: true,
    customerSafetyConfirmedAt: checkRecord.submittedAt,
  });

  return success(res, {
    message: 'Safety confirmation recorded. Your service request is confirmed.',
    checks,
    jobId,
  });
};

// ─── GET /api/discipline/safety-check/:jobId ─────────────────────────────────

/**
 * Get all safety check records for a job.
 */
const getSafetyChecksHandler = async (req, res) => {
  const { jobId } = req.params;

  try {
    const [driverSnap, customerSnap] = await Promise.all([
      db.collection('safety_checklists').doc(`driver_${jobId}`).get(),
      db.collection('safety_checklists').doc(`customer_${jobId}`).get(),
    ]);

    return success(res, {
      jobId,
      driverPreTrip: driverSnap.exists ? driverSnap.data() : null,
      customerSafetyConfirmation: customerSnap.exists ? customerSnap.data() : null,
      bothCompleted: driverSnap.exists && customerSnap.exists,
    });
  } catch (err) {
    console.error('Get safety checks error:', err);
    return error(res, 'Failed to fetch safety checks.', 500);
  }
};

module.exports = {
  applyNoShowHandler,
  issueLateWarningHandler,
  clearSuspensionHandler,
  runComplianceCheckHandler,
  getDriverComplianceHandler,
  getPriorityQueueHandler,
  getAdminReviewQueueHandler,
  adminAssignJobHandler,
  submitDriverSafetyCheckHandler,
  submitCustomerSafetyCheckHandler,
  getSafetyChecksHandler,
};
