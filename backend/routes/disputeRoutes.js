/**
 * Dispute Resolution Routes (ADR) — Week 7: evidence, timeline, escrow
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  submitDispute, getDisputes, getDisputeDetail, getMyDisputes, resolveDispute,
  addEvidence, getDisputeTimeline, holdEscrowForDispute,
} = require('../controllers/disputeController');

router.get('/my/:userId',        verifyToken, getMyDisputes);   // Before /:id
router.post('/',
  [
    body('jobId').notEmpty(),
    body('type').notEmpty(),
    body('reportedBy').isIn(['user', 'driver', 'garage']),
    body('reporterId').notEmpty(),
  ],
  submitDispute
);
router.get('/',                  verifyToken, requireRole('admin'), getDisputes);
router.get('/:id',               verifyToken, getDisputeDetail);
router.put('/:id/resolve',       verifyToken, requireRole('admin'), resolveDispute);
router.put('/:id/evidence',      verifyToken, addEvidence);
router.get('/:id/timeline',      verifyToken, getDisputeTimeline);
router.post('/:id/hold-escrow',  verifyToken, requireRole('admin'), holdEscrowForDispute);

module.exports = router;

