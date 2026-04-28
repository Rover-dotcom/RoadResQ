/**
 * Discipline Engine — RoadResQ (Week 4)
 *
 * Handles:
 *   1. NO-SHOW PENALTY
 *      If customer does not respond within 10 minutes after driver arrives
 *      → charge customer QR 50 (5000 halala) wait fee
 *
 *   2. DRIVER LATE WARNING
 *      If driver is late (ETA exceeded significantly)
 *      → add 1 warning to driver record
 *      → at 3 warnings → suspend account
 *
 *   3. AUTO-SUSPEND LOGIC
 *      warnings >= 3 → isSuspended = true
 *      Admin must manually clear suspension
 *
 *   4. DOCUMENT COMPLIANCE NOTIFIER
 *      30 days before expiry → notify (complianceStatus: 'expiring_soon')
 *       7 days before expiry → daily notify (complianceStatus: 'expiring_critical')
 *      Expired              → block driver (complianceBlocked: true)
 *
 *   5. JOB PRIORITY QUEUE
 *      Jobs are scored by urgency, wait time, and service type
 *      Higher score = dispatched first
 */

const { db } = require('../config/firebase');

const DRIVERS_COLLECTION = 'drivers';
const JOBS_COLLECTION = 'jobs';
const DISCIPLINE_LOGS_COLLECTION = 'discipline_logs';
const COMPLIANCE_ALERTS_COLLECTION = 'compliance_alerts';

const NO_SHOW_WAIT_FEE = 5000;        // QR 50.00 in halala
const LATE_THRESHOLD_MINUTES = 15;    // Minutes over ETA before "late"
const WARNINGS_BEFORE_SUSPEND = 3;
const NOTIFY_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NOTIFY_7_DAYS_MS  =  7 * 24 * 60 * 60 * 1000;

// ─── 1. NO-SHOW PENALTY ───────────────────────────────────────────────────────

/**
 * Apply no-show wait fee to customer when they don't respond
 * within 10 minutes after driver arrival.
 *
 * @param {string} jobId
 * @param {string} customerId
 * @param {string} driverId
 */
async function applyNoShowPenalty(jobId, customerId, driverId) {
  const now = new Date().toISOString();

  const logEntry = {
    id: `penalty_${jobId}_${Date.now()}`,
    type: 'no_show_fee',
    jobId,
    customerId,
    driverId,
    amount: NO_SHOW_WAIT_FEE,
    amountDisplay: `QR ${(NO_SHOW_WAIT_FEE / 100).toFixed(2)}`,
    reason: 'Customer did not respond within 10 minutes after driver arrival.',
    appliedAt: now,
  };

  // Log to discipline collection
  await db.collection(DISCIPLINE_LOGS_COLLECTION).doc(logEntry.id).set(logEntry);

  // Update job with fee flag
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    noShowFeeApplied: true,
    noShowFeeAmount: NO_SHOW_WAIT_FEE,
    noShowFeeAt: now,
  });

  return logEntry;
}

// ─── 2. DRIVER LATE WARNING ───────────────────────────────────────────────────

/**
 * Issue a late warning to a driver.
 * At 3 warnings → auto-suspend.
 *
 * @param {string} driverId
 * @param {string} jobId
 * @param {string} reason
 * @returns {{ warned: boolean, suspended: boolean, warnings: number }}
 */
async function issueLateWarning(driverId, jobId, reason = 'Driver arrived significantly late') {
  const driverRef = db.collection(DRIVERS_COLLECTION).doc(driverId);
  const driverSnap = await driverRef.get();

  if (!driverSnap.exists) throw new Error(`Driver ${driverId} not found`);
  const driver = driverSnap.data();

  const currentWarnings = driver.warningCount || 0;
  const newWarnings = currentWarnings + 1;
  const shouldSuspend = newWarnings >= WARNINGS_BEFORE_SUSPEND;

  const now = new Date().toISOString();

  const updates = {
    warningCount: newWarnings,
    lastWarningAt: now,
    lastWarningReason: reason,
    lastWarningJobId: jobId,
  };

  if (shouldSuspend) {
    updates.isSuspended = true;
    updates.suspendedAt = now;
    updates.suspensionReason = `Auto-suspended after ${WARNINGS_BEFORE_SUSPEND} late warnings.`;
  }

  await driverRef.update(updates);

  // Log warning
  const logEntry = {
    id: `warning_${driverId}_${Date.now()}`,
    type: 'late_warning',
    driverId,
    jobId,
    reason,
    warningNumber: newWarnings,
    autoSuspended: shouldSuspend,
    issuedAt: now,
  };
  await db.collection(DISCIPLINE_LOGS_COLLECTION).doc(logEntry.id).set(logEntry);

  return {
    warned: true,
    suspended: shouldSuspend,
    warnings: newWarnings,
    message: shouldSuspend
      ? `Driver account suspended after ${WARNINGS_BEFORE_SUSPEND} warnings.`
      : `Warning ${newWarnings}/${WARNINGS_BEFORE_SUSPEND} issued.`,
  };
}

// ─── 3. CLEAR SUSPENSION (Admin) ──────────────────────────────────────────────

/**
 * Admin clears a driver's suspension and resets warning count.
 * @param {string} driverId
 * @param {string} adminNote
 */
async function clearDriverSuspension(driverId, adminNote = '') {
  const now = new Date().toISOString();

  await db.collection(DRIVERS_COLLECTION).doc(driverId).update({
    isSuspended: false,
    warningCount: 0,
    suspensionClearedAt: now,
    suspensionClearedNote: adminNote,
  });

  const logEntry = {
    id: `clear_${driverId}_${Date.now()}`,
    type: 'suspension_cleared',
    driverId,
    adminNote,
    clearedAt: now,
  };
  await db.collection(DISCIPLINE_LOGS_COLLECTION).doc(logEntry.id).set(logEntry);

  return { cleared: true, driverId };
}

// ─── 4. DOCUMENT COMPLIANCE NOTIFIER ─────────────────────────────────────────

/**
 * Check a single driver's documents and return compliance status.
 * Also writes a compliance_alerts record if action is needed.
 *
 * Tiers:
 *   'valid'             — all documents fine
 *   'expiring_soon'     — something expires in 8–30 days
 *   'expiring_critical' — something expires in 1–7 days
 *   'expired'           — something already expired → block driver
 *
 * @param {string} driverId
 * @param {object} driverData — Firestore document data
 */
async function checkAndNotifyCompliance(driverId, driverData) {
  const now = Date.now();
  const documents = [
    { key: 'licenseExpiry',          label: 'Driving License' },
    { key: 'insuranceExpiry',        label: 'Vehicle Insurance' },
    { key: 'visaExpiry',             label: 'Residence Visa' },
    { key: 'roadworthinessExpiry',   label: 'Roadworthiness Certificate' },
  ];

  let overallStatus = 'valid';
  const alerts = [];

  for (const doc of documents) {
    const expiryStr = driverData[doc.key];
    if (!expiryStr) continue;

    const expiryMs = new Date(expiryStr).getTime();
    const diffMs = expiryMs - now;

    if (diffMs < 0) {
      // Expired
      alerts.push({
        document: doc.label,
        status: 'expired',
        expiryDate: expiryStr,
        daysRemaining: Math.floor(diffMs / (24 * 60 * 60 * 1000)),
      });
      overallStatus = 'expired';
    } else if (diffMs <= NOTIFY_7_DAYS_MS) {
      alerts.push({
        document: doc.label,
        status: 'expiring_critical',
        expiryDate: expiryStr,
        daysRemaining: Math.ceil(diffMs / (24 * 60 * 60 * 1000)),
      });
      if (overallStatus !== 'expired') overallStatus = 'expiring_critical';
    } else if (diffMs <= NOTIFY_30_DAYS_MS) {
      alerts.push({
        document: doc.label,
        status: 'expiring_soon',
        expiryDate: expiryStr,
        daysRemaining: Math.ceil(diffMs / (24 * 60 * 60 * 1000)),
      });
      if (overallStatus === 'valid') overallStatus = 'expiring_soon';
    }
  }

  // Apply compliance block if expired
  const shouldBlock = overallStatus === 'expired';
  if (shouldBlock !== (driverData.complianceBlocked === true)) {
    await db.collection(DRIVERS_COLLECTION).doc(driverId).update({
      complianceBlocked: shouldBlock,
      complianceStatus: overallStatus,
      complianceCheckedAt: new Date().toISOString(),
    });
  }

  // Save alert record if anything to report
  if (alerts.length > 0) {
    const alertRecord = {
      driverId,
      driverName: driverData.name || '',
      overallStatus,
      alerts,
      checkedAt: new Date().toISOString(),
    };
    await db.collection(COMPLIANCE_ALERTS_COLLECTION).doc(driverId).set(alertRecord, { merge: true });
  }

  return { driverId, overallStatus, alerts, blocked: shouldBlock };
}

/**
 * Run compliance check across ALL drivers.
 * Called by a scheduled Cloud Function or admin endpoint.
 * Blocks expired drivers, writes alerts for expiring ones.
 */
async function runComplianceCheckForAllDrivers() {
  const snapshot = await db.collection(DRIVERS_COLLECTION).get();
  const results = [];

  for (const doc of snapshot.docs) {
    try {
      const result = await checkAndNotifyCompliance(doc.id, doc.data());
      results.push(result);
    } catch (err) {
      console.error(`Compliance check failed for driver ${doc.id}:`, err.message);
    }
  }

  const summary = {
    total: results.length,
    valid: results.filter((r) => r.overallStatus === 'valid').length,
    expiringSoon: results.filter((r) => r.overallStatus === 'expiring_soon').length,
    expiringCritical: results.filter((r) => r.overallStatus === 'expiring_critical').length,
    expired: results.filter((r) => r.overallStatus === 'expired').length,
    blocked: results.filter((r) => r.blocked).length,
  };

  return { summary, results };
}

// ─── 5. JOB PRIORITY QUEUE ────────────────────────────────────────────────────

/**
 * Calculate a priority score for a job in the dispatch queue.
 * Higher score = dispatched first.
 *
 * Factors:
 *   +50  — urgent / emergency service
 *   +30  — garage / onsite_repair
 *   +20  — heavy equipment
 *   +10  — standard tow
 *   +1 per minute waiting (rewards jobs that have been waiting longer)
 *   -10  — Others (custom — needs human review, lower priority)
 */
function calculateJobPriority(job) {
  let score = 0;

  const serviceType = (job.serviceType || '').toLowerCase();
  const vehicleType = (job.vehicleType || '').toLowerCase();

  // Service type base priority
  if (job.garageUrgency === 'urgent' || serviceType === 'emergency') score += 50;
  else if (serviceType === 'onsite_repair' || serviceType === 'garage') score += 30;
  else if (serviceType === 'heavy_equipment') score += 20;
  else if (serviceType === 'tow') score += 10;

  // Custom/Others jobs go to admin review queue — slightly deprioritized
  if (vehicleType === 'others' || job.customItem) score -= 10;

  // Wait time bonus — 1 point per minute waiting
  if (job.createdAt) {
    const waitMinutes = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 60000);
    score += Math.min(waitMinutes, 60); // cap at 60 bonus points
  }

  return score;
}

/**
 * Get all pending jobs ordered by priority score.
 * Highest score = most urgent = dispatched first.
 */
async function getPriorityQueue() {
  const snapshot = await db.collection(JOBS_COLLECTION)
    .where('status', '==', 'pending')
    .get();

  const jobs = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      _priorityScore: calculateJobPriority(data),
    };
  });

  jobs.sort((a, b) => b._priorityScore - a._priorityScore);

  return jobs;
}

// ─── 6. AUTO-FLAG CUSTOM JOBS FOR ADMIN REVIEW ────────────────────────────────

/**
 * Flag a job with vehicleType='Others' or customItem for admin review.
 * Admin can then manually assign or broadcast.
 * @param {string} jobId
 * @param {object} jobData
 */
async function flagJobForAdminReview(jobId, jobData) {
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    requiresAdminReview: true,
    adminReviewReason: 'Custom vehicle/item type — system cannot auto-match driver.',
    adminReviewAt: new Date().toISOString(),
  });

  // Write to admin_review_queue collection
  await db.collection('admin_review_queue').doc(jobId).set({
    jobId,
    type: 'custom_job',
    customItem: jobData.customItem || null,
    customDetails: jobData.customDetails || null,
    serviceType: jobData.serviceType || null,
    userId: jobData.userId || null,
    createdAt: jobData.createdAt || new Date().toISOString(),
    flaggedAt: new Date().toISOString(),
    status: 'pending_review',
  });

  return { flagged: true, jobId };
}

module.exports = {
  applyNoShowPenalty,
  issueLateWarning,
  clearDriverSuspension,
  checkAndNotifyCompliance,
  runComplianceCheckForAllDrivers,
  calculateJobPriority,
  getPriorityQueue,
  flagJobForAdminReview,
  NO_SHOW_WAIT_FEE,
  WARNINGS_BEFORE_SUSPEND,
};
