/**
 * Incident Routes — Admin Safety Dashboard
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  reportIncident, getIncidents, getLiveMonitor, getAnalytics,
  getIncidentDetail, adminAction, panicButton, inactivityCheck,
  getAdminAlerts, markAlertRead,
} = require('../controllers/incidentController');

// Live monitor & analytics (no ID required — register BEFORE /:id)
router.get('/live',         getLiveMonitor);
router.get('/analytics',    getAnalytics);
router.get('/alerts',       getAdminAlerts);
router.post('/inactivity-check', inactivityCheck);

// Panic button
router.post('/panic',
  [
    body('jobId').notEmpty(),
    body('triggeredBy').notEmpty(),
  ],
  panicButton
);

// CRUD
router.post('/',
  [
    body('type').notEmpty().withMessage('type is required'),
    body('reportedBy').notEmpty(),
  ],
  reportIncident
);

router.get('/',               getIncidents);
router.get('/:id',            getIncidentDetail);
router.put('/:id/action',     adminAction);
router.put('/alerts/:id/read', markAlertRead);

module.exports = router;
