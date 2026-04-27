/**
 * Discipline Routes — RoadResQ (Week 4)
 *
 * POST /api/discipline/driver-late          → Record driver late warning
 * POST /api/discipline/driver-noshow        → Record driver no-show + re-open job
 * POST /api/discipline/customer-noshow      → Charge customer for no-show
 * PUT  /api/discipline/:driverId/unsuspend  → Admin unsuspends driver
 * POST /api/discipline/compliance/:driverId → Run compliance check for one driver
 * POST /api/discipline/compliance-all       → Run compliance check for all drivers
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  recordDriverLate,
  recordDriverNoShow,
  chargeCustomerNoShow,
  unsuspendDriver,
  checkAndEnforceDocumentCompliance,
  runComplianceCheckAll,
} = require('../utils/disciplineEngine');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

// POST /api/discipline/driver-late
router.post('/driver-late', [
  body('driverId').notEmpty().withMessage('driverId is required'),
  body('jobId').notEmpty().withMessage('jobId is required'),
], async (req, res) => {
  const { driverId, jobId } = req.body;
  try {
    const result = await recordDriverLate(driverId, jobId);
    return success(res, {
      ...result,
      message: result.suspended
        ? `Driver ${driverId} has been suspended after ${result.warnings} warnings.`
        : `Warning ${result.warnings} recorded for driver ${driverId}.`,
    });
  } catch (err) {
    return error(res, err.message || 'Failed to record driver late event.', 500);
  }
});

// POST /api/discipline/driver-noshow
router.post('/driver-noshow', [
  body('driverId').notEmpty().withMessage('driverId is required'),
  body('jobId').notEmpty().withMessage('jobId is required'),
], async (req, res) => {
  const { driverId, jobId } = req.body;
  try {
    const result = await recordDriverNoShow(driverId, jobId);
    return success(res, {
      ...result,
      message: `Driver no-show recorded. Job ${jobId} re-opened for reassignment.`,
    });
  } catch (err) {
    return error(res, err.message || 'Failed to record driver no-show.', 500);
  }
});

// POST /api/discipline/customer-noshow
router.post('/customer-noshow', [
  body('jobId').notEmpty().withMessage('jobId is required'),
  body('driverId').notEmpty().withMessage('driverId is required'),
], async (req, res) => {
  const { jobId, driverId } = req.body;
  try {
    const result = await chargeCustomerNoShow(jobId, driverId);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to charge customer no-show.', 500);
  }
});

// PUT /api/discipline/:driverId/unsuspend
router.put('/:driverId/unsuspend', [
  body('adminNotes').optional().isString(),
], async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const result = await unsuspendDriver(req.params.driverId, adminNotes);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to unsuspend driver.', 500);
  }
});

// POST /api/discipline/compliance/:driverId
router.post('/compliance/:driverId', async (req, res) => {
  try {
    const result = await checkAndEnforceDocumentCompliance(req.params.driverId);
    return success(res, { driverId: req.params.driverId, ...result });
  } catch (err) {
    return error(res, err.message || 'Failed to run compliance check.', 500);
  }
});

// POST /api/discipline/compliance-all — run for all drivers (admin / scheduled)
router.post('/compliance-all', async (req, res) => {
  try {
    const results = await runComplianceCheckAll();
    const blocked = results.filter((r) => r.blocked).length;
    return success(res, {
      processed: results.length,
      blocked,
      results,
    });
  } catch (err) {
    return error(res, err.message || 'Failed to run compliance check for all drivers.', 500);
  }
});

module.exports = router;
