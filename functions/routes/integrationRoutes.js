/**
 * Integration Routes — RoadResQ (Week 6)
 *
 * System testing and validation endpoints.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/integrationController');

// System health check (no auth needed)
router.get('/system-health', ctrl.systemHealth);

// Payment validation (admin)
router.get('/payment-validation', verifyToken, ctrl.paymentValidation);

// Service check (admin)
router.get('/service-check', verifyToken, ctrl.serviceCheck);

// Full flow simulation (admin)
router.post('/full-flow', verifyToken, ctrl.simulateFullFlow);

// Tracking simulation (dev/testing)
router.post('/simulate-tracking', verifyToken, ctrl.simulateTracking);

module.exports = router;
