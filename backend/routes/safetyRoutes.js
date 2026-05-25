/**
 * Safety 2.0 Routes — RoadResQ
 *
 * Includes: risk check, PIN, confirmations, feedback, service-specific checklists
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  riskCheck, generatePIN, verifyPIN, confirmSafety,
  submitSafetyFeedback, getJobSafetyState,
  getChecklistHandler, getAllChecklistsHandler, submitServiceCheckHandler,
} = require('../controllers/safetyController');

// Existing routes
router.post('/risk-check',   verifyToken, riskCheck);
router.post('/pin/generate', body('jobId').notEmpty(), generatePIN);
router.post('/pin/verify',
  [body('jobId').notEmpty(), body('pin').isLength({ min: 4, max: 4 })],
  verifyPIN
);
router.post('/confirm',       verifyToken, confirmSafety);
router.post('/feedback',      verifyToken, submitSafetyFeedback);
router.get('/job/:jobId',     verifyToken, getJobSafetyState);

// Week 4 addition: service-specific safety checklists (tow mount check, etc.)
router.get('/checklists',                getAllChecklistsHandler);   // All checklists
router.get('/checklist/:serviceType',    getChecklistHandler);      // Specific checklist
router.post('/service-check',            verifyToken, submitServiceCheckHandler); // Submit service check

module.exports = router;
