/**
 * Fraud Detection Routes
 */
const express = require('express');
const router = express.Router();
const {
  getFlaggedJobsList, getFlaggedUsersList, getJobFraudScore,
  checkJobFraud, applyPenalty,
} = require('../controllers/fraudController');

router.get('/jobs',          getFlaggedJobsList);
router.get('/users',         getFlaggedUsersList);
router.get('/score/:jobId',  getJobFraudScore);
router.post('/check',        checkJobFraud);
router.put('/action',        applyPenalty);

module.exports = router;
