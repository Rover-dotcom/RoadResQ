/**
 * Fraud Detection Routes
 */
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getFlaggedJobsList, getFlaggedUsersList, getJobFraudScore,
  checkJobFraud, applyPenalty,
} = require('../controllers/fraudController');

router.get('/jobs',          verifyToken, requireRole('admin'), getFlaggedJobsList);
router.get('/users',         verifyToken, requireRole('admin'), getFlaggedUsersList);
router.get('/score/:jobId',  verifyToken, requireRole('admin'), getJobFraudScore);
router.post('/check',        verifyToken, requireRole('admin'), checkJobFraud);
router.put('/action',        verifyToken, requireRole('admin'), applyPenalty);

module.exports = router;
