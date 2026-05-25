/**
 * Dispute Resolution Routes (ADR)
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  submitDispute, getDisputes, getDisputeDetail, getMyDisputes, resolveDispute,
} = require('../controllers/disputeController');

router.get('/my/:userId',    verifyToken, getMyDisputes);   // Before /:id
router.post('/',
  [
    body('jobId').notEmpty(),
    body('type').notEmpty(),
    body('reportedBy').isIn(['user', 'driver', 'garage']),
    body('reporterId').notEmpty(),
  ],
  submitDispute
);
router.get('/',              verifyToken, requireRole('admin'), getDisputes);
router.get('/:id',           verifyToken, getDisputeDetail);
router.put('/:id/resolve',   verifyToken, requireRole('admin'), resolveDispute);

module.exports = router;
