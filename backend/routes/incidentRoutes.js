/**
 * Incident Routes — Admin Safety Dashboard
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  reportIncident, getIncidents, getLiveMonitor, getAnalytics,
  getIncidentDetail, adminAction, panicButton, inactivityCheck,
  getAdminAlerts, markAlertRead,
} = require('../controllers/incidentController');

// Live monitor & analytics (no ID required — register BEFORE /:id)
router.get('/live',         verifyToken, requireRole('admin'), getLiveMonitor);
router.get('/analytics',    verifyToken, requireRole('admin'), getAnalytics);
router.get('/alerts',       verifyToken, requireRole('admin'), getAdminAlerts);
router.post('/inactivity-check', verifyToken, requireRole('admin'), inactivityCheck);

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

router.get('/',               verifyToken, getIncidents);
router.get('/:id',            verifyToken, getIncidentDetail);
router.put('/:id/action',     verifyToken, requireRole('admin'), adminAction);
router.put('/alerts/:id/read', verifyToken, requireRole('admin'), markAlertRead);

module.exports = router;
