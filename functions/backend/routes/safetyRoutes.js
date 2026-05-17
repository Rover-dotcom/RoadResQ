/**
 * Safety 2.0 Routes — RoadResQ
 *
 * Includes: risk check, PIN, confirmations, feedback, service-specific checklists
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  riskCheck, generatePIN, verifyPIN, confirmSafety,
  submitSafetyFeedback, getJobSafetyState,
  getChecklistHandler, getAllChecklistsHandler, submitServiceCheckHandler,
} = require('../controllers/safetyController');

// Existing routes
router.post('/risk-check',   riskCheck);
router.post('/pin/generate', body('jobId').notEmpty(), generatePIN);
router.post('/pin/verify',
  [body('jobId').notEmpty(), body('pin').isLength({ min: 4, max: 4 })],
  verifyPIN
);
router.post('/confirm',       confirmSafety);
router.post('/feedback',      submitSafetyFeedback);
router.get('/job/:jobId',     getJobSafetyState);

// Week 4 addition: service-specific safety checklists (tow mount check, etc.)
router.get('/checklists',                getAllChecklistsHandler);   // All checklists
router.get('/checklist/:serviceType',    getChecklistHandler);      // Specific checklist
router.post('/service-check',            submitServiceCheckHandler); // Submit service check

module.exports = router;
