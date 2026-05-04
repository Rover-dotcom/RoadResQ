/**
 * Completion Routes — RoadResQ (Week 5)
 *
 * Job finalization, reports, payments, cleanup, archiving, audit.
 *
 *   POST   /api/completion/:id/complete      — finalize a job
 *   GET    /api/completion/:id/report        — get job report
 *   GET    /api/completion/:id/payment       — get payment status
 *   POST   /api/completion/:id/hold-payment  — hold payment in escrow
 *   GET    /api/completion/:id/audit-trail   — audit trail for entity
 *   GET    /api/completion/reports            — list reports
 *   GET    /api/completion/payments           — list payments
 *   POST   /api/completion/archive-old        — archive 30+ day old jobs
 *   POST   /api/completion/cleanup-files      — process pending file deletions
 *   GET    /api/completion/storage-status     — check storage usage
 *   GET    /api/completion/audit-logs         — get audit logs
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/completionController');

// Static routes FIRST (before parameterized :id routes)
router.get('/reports', getReportsHandler);
router.get('/payments', getPaymentsHandler);
router.post('/archive-old', archiveOldJobsHandler);
router.post('/cleanup-files', cleanupFilesHandler);
router.get('/storage-status', storageStatusHandler);
router.get('/audit-logs', getAuditLogsHandler);

// Parameterized routes
router.post('/:id/complete', completeJobHandler);
router.get('/:id/report', getJobReportHandler);
router.get('/:id/payment', getPaymentHandler);
router.post('/:id/hold-payment', holdPaymentHandler);
router.get('/:id/audit-trail', getAuditTrailHandler);

module.exports = router;
