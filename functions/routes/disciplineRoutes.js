const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/disciplineController');

// ─── Driver Discipline ────────────────────────────────────────────────────────

// POST /api/discipline/no-show          — apply no-show fee to customer
router.post('/no-show', applyNoShowHandler);

// POST /api/discipline/warning/:driverId — issue late warning
router.post('/warning/:driverId', issueLateWarningHandler);

// PUT  /api/discipline/clear/:driverId   — admin clears suspension
router.put('/clear/:driverId', clearSuspensionHandler);

// ─── Compliance ───────────────────────────────────────────────────────────────

// POST /api/discipline/compliance-check           — run for all drivers
router.post('/compliance-check', runComplianceCheckHandler);

// GET  /api/discipline/compliance/:driverId        — single driver check
router.get('/compliance/:driverId', getDriverComplianceHandler);

// ─── Priority Queue & Admin Review ───────────────────────────────────────────

// GET  /api/discipline/priority-queue              — pending jobs by priority
router.get('/priority-queue', getPriorityQueueHandler);

// GET  /api/discipline/admin-review                — custom jobs needing admin
router.get('/admin-review', getAdminReviewQueueHandler);

// PUT  /api/discipline/admin-review/:jobId/assign  — admin assigns driver
router.put('/admin-review/:jobId/assign', adminAssignJobHandler);

// ─── Safety Checklists ────────────────────────────────────────────────────────

// POST /api/discipline/safety-check/:jobId/driver   — driver pre-trip check
router.post('/safety-check/:jobId/driver', submitDriverSafetyCheckHandler);

// POST /api/discipline/safety-check/:jobId/customer — customer safety confirm
router.post('/safety-check/:jobId/customer', submitCustomerSafetyCheckHandler);

// GET  /api/discipline/safety-check/:jobId           — get both check records
router.get('/safety-check/:jobId', getSafetyChecksHandler);

module.exports = router;
