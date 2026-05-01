/**
 * Dispute Resolution Routes (ADR)
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  submitDispute, getDisputes, getDisputeDetail, getMyDisputes, resolveDispute,
} = require('../controllers/disputeController');

router.get('/my/:userId',    getMyDisputes);   // Before /:id
router.post('/',
  [
    body('jobId').notEmpty(),
    body('type').notEmpty(),
    body('reportedBy').isIn(['user', 'driver', 'garage']),
    body('reporterId').notEmpty(),
  ],
  submitDispute
);
router.get('/',              getDisputes);
router.get('/:id',           getDisputeDetail);
router.put('/:id/resolve',   resolveDispute);

module.exports = router;
