/**
 * Safety 2.0 Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  riskCheck, generatePIN, verifyPIN, confirmSafety, submitSafetyFeedback, getJobSafetyState,
} = require('../controllers/safetyController');

router.post('/risk-check',   riskCheck);
router.post('/pin/generate', body('jobId').notEmpty(), generatePIN);
router.post('/pin/verify',
  [body('jobId').notEmpty(), body('pin').isLength({ min: 4, max: 4 })],
  verifyPIN
);
router.post('/confirm',       confirmSafety);
router.post('/feedback',      submitSafetyFeedback);
router.get('/job/:jobId',     getJobSafetyState);

module.exports = router;
