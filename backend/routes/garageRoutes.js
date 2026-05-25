/**
 * Garage Request Routes — RoadResQ (Week 4)
 *
 * POST   /api/garage-requests                    → Create on-site repair request
 * GET    /api/garage-requests                    → List requests (by userId/garageId/status)
 * GET    /api/garage-requests/:id                → Get single request
 * POST   /api/garage-requests/:id/estimate       → Garage submits estimate
 * GET    /api/garage-requests/:id/estimates      → User views all estimates
 * PUT    /api/garage-requests/:id/accept         → User accepts an estimate
 * PUT    /api/garage-requests/:id/status         → Update status
 * POST   /api/garage-requests/:id/auto-cancel    → Check/trigger auto-cancel
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

const {
  createGarageRequestHandler,
  submitEstimateHandler,
  getEstimatesHandler,
  acceptEstimateHandler,
  updateGarageRequestStatusHandler,
  getGarageRequestsHandler,
  getGarageRequestByIdHandler,
  autoCancelCheckHandler,
} = require('../controllers/garageController');

// ─── Validation ───────────────────────────────────────────────────────────────

const createRequestValidation = [
  body('userId').notEmpty().withMessage('userId is required'),
  body('location').isObject().withMessage('location object { lat, lng } is required'),
  body('location.lat').isFloat().withMessage('location.lat must be a number'),
  body('location.lng').isFloat().withMessage('location.lng must be a number'),
  body('issue').notEmpty().withMessage('issue description is required'),
  // Scheduling (optional)
  body('isScheduled').optional().isBoolean().withMessage('isScheduled must be true or false'),
  body('preferredDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('preferredDate must be YYYY-MM-DD'),
  body('preferredTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('preferredTime must be HH:MM (24h)'),
];

const submitEstimateValidation = [
  body('garageId').notEmpty().withMessage('garageId is required'),
  body('price').isInt({ min: 1 }).withMessage('price must be a positive integer (halala, e.g. 12000 = QR 120.00)'),
  body('eta').isInt({ min: 1 }).withMessage('eta (minutes) must be a positive integer'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/', verifyToken, createRequestValidation, createGarageRequestHandler);
router.get('/', verifyToken, getGarageRequestsHandler);
router.get('/:id', verifyToken, getGarageRequestByIdHandler);
router.post('/:id/estimate', verifyToken, requireRole('garage', 'admin'), submitEstimateValidation, submitEstimateHandler);
router.get('/:id/estimates', verifyToken, getEstimatesHandler);
router.put('/:id/accept', [
  body('estimateId').notEmpty().withMessage('estimateId is required'),
], acceptEstimateHandler);
router.put('/:id/status', [
  body('status').notEmpty().withMessage('status is required'),
], updateGarageRequestStatusHandler);
router.post('/:id/auto-cancel', verifyToken, autoCancelCheckHandler);

module.exports = router;
