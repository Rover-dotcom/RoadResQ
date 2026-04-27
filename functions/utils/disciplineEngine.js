/**
 * Driver Discipline System — RoadResQ (Week 4)
 *
 * Tracks driver behaviour and enforces penalties:
 *
 *   1. Customer not responding > 10min → charge customer QR 50.00 (5000 halala)
 *   2. Driver late → warnings += 1
 *   3. Warnings >= 3 → suspend account
 *   4. No-show by driver → warnings += 1, job marked as no_driver
 *
 * Document compliance (separate but enforced here for blocking):
 *   30 days to expiry → notify driver
 *    7 days to expiry → daily notify driver
 *   Expired            → BLOCK (isAvailable=false, complianceBlocked=true)
 */

const { db } = require('../config/firebase');

const DRIVERS_COLLECTION = 'drivers';
const DISCIPLINE_COLLECTION = 'driver_discipline_log';
const NOSHOW_WAIT_MINUTES = 10;
const NOSHOW_CHARGE_HALALA = 5000; // QR 50.00
const SUSPENSION_WARNING_THRESHOLD = 3;

// ─── Record Discipline Event ──────────────────────────────────────────────────

/**
 * Log a discipline event for a driver.
 *
 * @param {string} driverId
 * @param {string} eventType - 'late' | 'noshow' | 'customer_noshow' | 'complaint'
 * @param {string} jobId
 * @param {string} [notes]
 */
async function logDisciplineEvent(driverId, eventType, jobId, notes = '') {
  const logEntry = {
    driverId,
    eventType,
    jobId,
    notes,
    createdAt: new Date().toISOString(),
  };
  await db.collection(DISCIPLINE_COLLECTION).add(logEntry);
  return logEntry;
}

// ─── Driver Late Penalty ──────────────────────────────────────────────────────

/**
 * Record a "driver late" warning.
 * After 3 warnings, account is suspended.
 *
 * @param {string} driverId
 * @param {string} jobId
 */
async function recordDriverLate(driverId, jobId) {
  const driverRef = db.collection(DRIVERS_COLLECTION).doc(driverId);
  const driverDoc = await driverRef.get();

  if (!driverDoc.exists) throw new Error('Driver not found');
  const driver = driverDoc.data();

  const warnings = (driver.warnings || 0) + 1;
  const updates = {
    warnings,
    lastWarningAt: new Date().toISOString(),
    lastWarningJobId: jobId,
  };

  if (warnings >= SUSPENSION_WARNING_THRESHOLD) {
    updates.isSuspended = true;
    updates.suspendedAt = new Date().toISOString();
    updates.suspensionReason = `Auto-suspended: ${warnings} late/no-show warnings.`;
    updates.isAvailable = false;
    updates.isOnline = false;
    console.warn(`[Discipline] Driver ${driverId} suspended after ${warnings} warnings.`);
  }

  await driverRef.update(updates);
  await logDisciplineEvent(driverId, 'late', jobId, `Warning ${warnings}/${SUSPENSION_WARNING_THRESHOLD}`);

  return { warnings, suspended: warnings >= SUSPENSION_WARNING_THRESHOLD };
}

// ─── Driver No-Show ───────────────────────────────────────────────────────────

/**
 * Mark driver as no-show for a job.
 * Adds a warning and updates job status.
 *
 * @param {string} driverId
 * @param {string} jobId
 */
async function recordDriverNoShow(driverId, jobId) {
  const result = await recordDriverLate(driverId, jobId);
  await logDisciplineEvent(driverId, 'noshow', jobId, 'Driver did not show up');

  // Reset the job back to pending so it can be reassigned
  await db.collection('jobs').doc(jobId).update({
    status: 'pending',
    driverId: null,
    assignedAt: null,
    noShowAt: new Date().toISOString(),
    noShowDriverId: driverId,
    adminNotes: `Driver ${driverId} no-show. Job re-opened for reassignment.`,
  });

  return result;
}

// ─── Customer No-Show Charge ──────────────────────────────────────────────────

/**
 * Charge customer when they do not respond for 10+ minutes.
 * Creates a charge record on the job document.
 *
 * @param {string} jobId
 * @param {string} driverId - The driver who waited
 */
async function chargeCustomerNoShow(jobId, driverId) {
  const jobRef = db.collection('jobs').doc(jobId);
  const jobDoc = await jobRef.get();
  if (!jobDoc.exists) throw new Error('Job not found');

  const job = jobDoc.data();

  await jobRef.update({
    customerNoShowCharge: NOSHOW_CHARGE_HALALA,
    customerNoShowChargeDisplay: `QR ${(NOSHOW_CHARGE_HALALA / 100).toFixed(2)}`,
    customerNoShowAt: new Date().toISOString(),
    noShowWaitMinutes: NOSHOW_WAIT_MINUTES,
    status: 'cancelled',
  });

  await logDisciplineEvent(driverId, 'customer_noshow', jobId,
    `Customer did not respond after ${NOSHOW_WAIT_MINUTES} minutes. Charge: QR ${(NOSHOW_CHARGE_HALALA / 100).toFixed(2)}`
  );

  return {
    jobId,
    charge: NOSHOW_CHARGE_HALALA,
    chargeDisplay: `QR ${(NOSHOW_CHARGE_HALALA / 100).toFixed(2)}`,
    waitMinutes: NOSHOW_WAIT_MINUTES,
  };
}

// ─── Unsuspend Driver ─────────────────────────────────────────────────────────

/**
 * Admin manually unsuspends a driver and resets warnings.
 *
 * @param {string} driverId
 * @param {string} adminNotes
 */
async function unsuspendDriver(driverId, adminNotes = '') {
  await db.collection(DRIVERS_COLLECTION).doc(driverId).update({
    isSuspended: false,
    suspendedAt: null,
    suspensionReason: null,
    warnings: 0,
    unsuspendedAt: new Date().toISOString(),
    adminNotes: adminNotes || 'Suspension lifted by admin.',
  });

  await logDisciplineEvent(driverId, 'unsuspended', 'N/A', adminNotes);
  return { driverId, status: 'unsuspended' };
}

// ─── Document Compliance Checker ──────────────────────────────────────────────

/**
 * Check all driver documents and:
 *  - Notify at 30 days remaining
 *  - Notify daily at 7 days remaining
 *  - Block (complianceBlocked=true) if expired
 *
 * Should be run on a schedule (e.g., Cloud Scheduler daily).
 *
 * @param {string} driverId
 * @returns {{ blocked: boolean, warnings: string[] }}
 */
async function checkAndEnforceDocumentCompliance(driverId) {
  const driverRef = db.collection(DRIVERS_COLLECTION).doc(driverId);
  const driverDoc = await driverRef.get();
  if (!driverDoc.exists) throw new Error('Driver not found');

  const driver = driverDoc.data();
  const now = new Date();
  const warnings = [];
  let shouldBlock = false;

  const docFields = [
    { field: 'licenseExpiry', label: 'Driver License' },
    { field: 'insuranceExpiry', label: 'Vehicle Insurance' },
    { field: 'roadworthinessExpiry', label: 'Vehicle Roadworthiness Certificate' },
    { field: 'visaExpiry', label: 'Work Visa' },
  ];

  const expiryNotifications = driver.expiryNotifications || {};

  for (const { field, label } of docFields) {
    if (!driver[field]) continue;

    const expiry = new Date(driver[field]);
    const daysRemaining = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      // Expired → block
      shouldBlock = true;
      warnings.push(`${label} has EXPIRED. Account blocked.`);
    } else if (daysRemaining <= 7) {
      warnings.push(`${label} expires in ${daysRemaining} day(s). Renew immediately.`);
      expiryNotifications[field] = { daysRemaining, notifiedAt: now.toISOString() };
    } else if (daysRemaining <= 30) {
      warnings.push(`${label} expires in ${daysRemaining} day(s).`);
      if (!expiryNotifications[field] || daysRemaining <= 7) {
        expiryNotifications[field] = { daysRemaining, notifiedAt: now.toISOString() };
      }
    }
  }

  const updates = {
    complianceWarnings: warnings,
    expiryNotifications,
    lastComplianceCheck: now.toISOString(),
  };

  if (shouldBlock) {
    updates.complianceBlocked = true;
    updates.isAvailable = false;
    updates.isApproved = false; // block from taking jobs
  } else {
    updates.complianceBlocked = false;
  }

  await driverRef.update(updates);

  return { blocked: shouldBlock, warnings };
}

/**
 * Run compliance check for ALL drivers.
 * Intended to be called from a Cloud Scheduler job daily.
 */
async function runComplianceCheckAll() {
  const snapshot = await db.collection(DRIVERS_COLLECTION).get();
  const results = [];

  for (const doc of snapshot.docs) {
    try {
      const result = await checkAndEnforceDocumentCompliance(doc.id);
      results.push({ driverId: doc.id, ...result });
    } catch (err) {
      console.error(`Compliance check failed for driver ${doc.id}:`, err.message);
    }
  }

  return results;
}

module.exports = {
  logDisciplineEvent,
  recordDriverLate,
  recordDriverNoShow,
  chargeCustomerNoShow,
  unsuspendDriver,
  checkAndEnforceDocumentCompliance,
  runComplianceCheckAll,
  NOSHOW_CHARGE_HALALA,
  NOSHOW_WAIT_MINUTES,
  SUSPENSION_WARNING_THRESHOLD,
};
