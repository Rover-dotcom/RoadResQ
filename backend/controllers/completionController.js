/**
 * Completion Controller — RoadResQ (Week 5)
 *
 * Handles job finalization, report generation, payment release,
 * file cleanup, archiving, and audit logging.
 *
 * POST   /api/completion/:id/complete     — finalize a job (the main flow)
 * GET    /api/completion/:id/report       — get job report
 * GET    /api/completion/reports           — list reports
 * POST   /api/completion/archive-old       — archive jobs older than 30 days
 * POST   /api/completion/cleanup-files     — process pending file deletions
 * GET    /api/completion/storage-status    — check storage usage
 * GET    /api/completion/:id/payment       — get payment status for a job
 * POST   /api/completion/:id/hold-payment  — hold payment in escrow
 * GET    /api/completion/audit-logs        — get audit logs
 * GET    /api/completion/:id/audit-trail   — get audit trail for a specific entity
 */

const { db } = require('../config/firebase');
const { generateJobReport, getReportByJobId, getReports } = require('../utils/reportEngine');
const { releasePayment, holdPayment, getPaymentStatus, getPayments } = require('../utils/paymentEngine');
const { softDeleteFiles, executePendingDeletions, collectJobFileUrls, checkStorageUsage } = require('../utils/cleanupEngine');
const { logEvent, getAuditLogs, getEntityAuditTrail, EVENT_TYPES } = require('../utils/auditEngine');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

// ─── POST /api/completion/:id/complete ────────────────────────────────────────

/**
 * THE MAIN FINALIZATION FLOW.
 *
 * Steps (using Firestore batch writes for atomicity):
 * 1. Validate job exists and is in_progress / on_site
 * 2. Check prerequisites (PIN verified, photos, safety check)
 * 3. Check for active disputes — BLOCK if any exist
 * 4. Generate report (permanent storage)
 * 5. Release payment (if no dispute)
 * 6. Soft-delete temp images (24h grace period)
 * 7. Update job status to completed
 * 8. Log audit events
 * 9. Return success with report + payment summary
 */
const completeJobHandler = async (req, res) => {
  const jobId = req.params.id;

  try {
    // 1. Validate job
    const jobSnap = await db.collection('jobs').doc(jobId).get();
    if (!jobSnap.exists) return error(res, 'Job not found.', 404);

    const job = jobSnap.data();

    if (!['in_progress', 'on_site', 'at_garage'].includes(job.status)) {
      return error(res, `Cannot complete a job with status '${job.status}'. Job must be in_progress, on_site, or at_garage.`, 409);
    }

    // 2. Check prerequisites (warn but don't block — some may be optional)
    const prerequisites = {
      pinVerified: job.pinVerified || false,
      driverSafetyCheckPassed: job.driverSafetyCheckPassed || false,
      customerSafetyConfirmed: job.customerSafetyConfirmed || false,
      serviceSafetyCheckPassed: job.serviceSafetyCheckPassed || false,
    };

    const warnings = [];
    if (!prerequisites.pinVerified) warnings.push('PIN was not verified');
    if (!prerequisites.driverSafetyCheckPassed) warnings.push('Driver pre-trip safety check was not completed');

    // 3. Check for active disputes — BLOCK
    const disputeSnap = await db.collection('disputes')
      .where('jobId', '==', jobId)
      .where('status', 'in', ['open', 'pending', 'under_review'])
      .limit(1)
      .get();

    if (!disputeSnap.empty) {
      return error(res, 'Cannot finalize job — there is an active dispute. Resolve the dispute first.', 409, {
        disputeId: disputeSnap.docs[0].id,
        disputeStatus: disputeSnap.docs[0].data().status,
      });
    }

    // 4. Generate report (permanent storage)
    const reportResult = await generateJobReport(jobId);

    // 5. Release payment
    let paymentResult = { success: true, message: 'No payment record to release.' };
    const paymentSnap = await db.collection('payments').doc(jobId).get();
    if (paymentSnap.exists) {
      paymentResult = await releasePayment(jobId);
    }

    // 6. Soft-delete temp images (24h grace period)
    const fileUrls = collectJobFileUrls(job);
    const cleanupResult = await softDeleteFiles(jobId, fileUrls);

    // 7. Update job status to completed using batch write
    const now = new Date().toISOString();
    const batch = db.batch();

    const jobRef = db.collection('jobs').doc(jobId);
    batch.update(jobRef, {
      status: 'completed',
      completedAt: now,
      finalizedAt: now,
      isFinalized: true,
      updatedAt: now,
    });

    // Release the driver
    if (job.driverId) {
      const driverRef = db.collection('drivers').doc(job.driverId);
      batch.update(driverRef, {
        isAvailable: true,
        activeJobId: null,
        updatedAt: now,
      });

      // Increment driver completed jobs count
      const driverSnap = await db.collection('drivers').doc(job.driverId).get();
      if (driverSnap.exists) {
        const currentCount = driverSnap.data().completedJobs || 0;
        batch.update(driverRef, { completedJobs: currentCount + 1 });
      }
    }

    await batch.commit();

    // 8. Log audit event
    await logEvent(EVENT_TYPES.JOB_FINALIZED, {
      entityId: jobId,
      entityType: 'job',
      actorId: req.body.completedBy || 'system',
      actorRole: req.body.completedByRole || 'system',
      details: {
        paymentReleased: paymentResult.success,
        reportGenerated: reportResult.success,
        filesMarkedForDeletion: cleanupResult.marked,
        warnings,
      },
    });

    return success(res, {
      message: 'Job finalized successfully.',
      jobId,
      status: 'completed',
      report: reportResult.success ? { generated: true, reportId: jobId } : { generated: false, error: reportResult.error },
      payment: paymentResult,
      cleanup: { filesMarkedForDeletion: cleanupResult.marked, gracePeriod: '24 hours' },
      warnings: warnings.length > 0 ? warnings : null,
    });
  } catch (err) {
    console.error('Complete job error:', err);
    return error(res, 'Failed to finalize job.', 500);
  }
};

// ─── GET /api/completion/:id/report ───────────────────────────────────────────

const getJobReportHandler = async (req, res) => {
  try {
    const report = await getReportByJobId(req.params.id);
    if (!report) return error(res, 'Report not found. Job may not be completed yet.', 404);
    return success(res, report);
  } catch (err) {
    console.error('Get report error:', err);
    return error(res, 'Failed to fetch report.', 500);
  }
};

// ─── GET /api/completion/reports ──────────────────────────────────────────────

const getReportsHandler = async (req, res) => {
  const { userId, driverId, limit } = req.query;
  try {
    const reports = await getReports({ userId, driverId, limit: parseInt(limit) || 20 });
    return success(res, { reports, count: reports.length });
  } catch (err) {
    console.error('Get reports error:', err);
    return error(res, 'Failed to fetch reports.', 500);
  }
};

// ─── POST /api/completion/archive-old ─────────────────────────────────────────

/**
 * Archives jobs older than 30 days.
 * Moves status from 'completed' to 'archived'.
 */
const archiveOldJobsHandler = async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const snap = await db.collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '<', thirtyDaysAgo)
      .limit(200)
      .get();

    if (snap.empty) {
      return success(res, { message: 'No jobs to archive.', archived: 0 });
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    snap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'archived',
        archivedAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    await logEvent(EVENT_TYPES.JOB_ARCHIVED, {
      entityId: 'batch',
      entityType: 'job',
      actorId: 'system',
      details: { count: snap.size, olderThan: thirtyDaysAgo },
    });

    return success(res, { message: `Archived ${snap.size} jobs.`, archived: snap.size });
  } catch (err) {
    console.error('Archive old jobs error:', err);
    return error(res, 'Failed to archive jobs.', 500);
  }
};

// ─── POST /api/completion/cleanup-files ───────────────────────────────────────

const cleanupFilesHandler = async (_req, res) => {
  try {
    const result = await executePendingDeletions();
    return success(res, result);
  } catch (err) {
    console.error('Cleanup files error:', err);
    return error(res, 'Failed to process file deletions.', 500);
  }
};

// ─── GET /api/completion/storage-status ───────────────────────────────────────

const storageStatusHandler = async (_req, res) => {
  try {
    const stats = await checkStorageUsage();
    return success(res, stats);
  } catch (err) {
    console.error('Storage status error:', err);
    return error(res, 'Failed to check storage.', 500);
  }
};

// ─── GET /api/completion/:id/payment ──────────────────────────────────────────

const getPaymentHandler = async (req, res) => {
  try {
    const payment = await getPaymentStatus(req.params.id);
    if (!payment) return error(res, 'No payment record found.', 404);
    return success(res, payment);
  } catch (err) {
    return error(res, 'Failed to fetch payment status.', 500);
  }
};

// ─── POST /api/completion/:id/hold-payment ────────────────────────────────────

const holdPaymentHandler = async (req, res) => {
  const jobId = req.params.id;
  const { amount, customerId, driverId } = req.body;

  if (!amount || !customerId || !driverId) {
    return error(res, 'amount, customerId, and driverId are required.');
  }

  try {
    const payment = await holdPayment(jobId, parseInt(amount), customerId, driverId);
    return success(res, payment, 201);
  } catch (err) {
    console.error('Hold payment error:', err);
    return error(res, 'Failed to hold payment.', 500);
  }
};

// ─── GET /api/completion/audit-logs ───────────────────────────────────────────

const getAuditLogsHandler = async (req, res) => {
  const { eventType, entityId, entityType, actorId, limit } = req.query;
  try {
    const logs = await getAuditLogs({
      eventType, entityId, entityType, actorId,
      limit: parseInt(limit) || 50,
    });
    return success(res, { logs, count: logs.length });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return error(res, 'Failed to fetch audit logs.', 500);
  }
};

// ─── GET /api/completion/:id/audit-trail ──────────────────────────────────────

const getAuditTrailHandler = async (req, res) => {
  try {
    const trail = await getEntityAuditTrail(req.params.id);
    return success(res, { entityId: req.params.id, trail, count: trail.length });
  } catch (err) {
    console.error('Get audit trail error:', err);
    return error(res, 'Failed to fetch audit trail.', 500);
  }
};

// ─── GET /api/completion/payments ─────────────────────────────────────────────

const getPaymentsHandler = async (req, res) => {
  const { status, driverId, customerId, limit } = req.query;
  try {
    const payments = await getPayments({ status, driverId, customerId, limit: parseInt(limit) || 50 });
    return success(res, { payments, count: payments.length });
  } catch (err) {
    return error(res, 'Failed to fetch payments.', 500);
  }
};

module.exports = {
  completeJobHandler,
  getJobReportHandler,
  getReportsHandler,
  archiveOldJobsHandler,
  cleanupFilesHandler,
  storageStatusHandler,
  getPaymentHandler,
  holdPaymentHandler,
  getAuditLogsHandler,
  getAuditTrailHandler,
  getPaymentsHandler,
};
