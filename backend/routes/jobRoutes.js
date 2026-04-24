const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const {
  createJobHandler,
  getJobsHandler,
  getAvailableJobsHandler,
  getPriceEstimateHandler,
  getServiceInfoHandler,
  getJobByIdHandler,
  matchDriversHandler,
  acceptJobHandler,
  updateStatusHandler,
  cancelJobHandler,
  rateDriverHandler,
} = require('../controllers/jobController');

// ─── Validation Rules ─────────────────────────────────────────────────────────

const createJobValidation = [
  body('userId').notEmpty().withMessage('userId is required'),
  body('pickup').notEmpty().withMessage('pickup location is required'),
  body('drop').notEmpty().withMessage('drop location is required'),
  body('distanceKm')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('distanceKm must be a positive number'),
  body('vehicleType')
    .optional()
    .isString()
    .withMessage('vehicleType must be a string'),
  body('serviceType')
    .optional()
    .isIn(['tow', 'garage', 'heavy_equipment', 'quote_industrial'])
    .withMessage('serviceType must be: tow | garage | heavy_equipment | quote_industrial'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// IMPORTANT: specific paths BEFORE parameterized paths (:id)

// Catalog / Info endpoints
router.get('/service-info', getServiceInfoHandler);           // All service types + pricing
router.get('/price-estimate', getPriceEstimateHandler);      // GET /api/jobs/price-estimate?vehicleType=&distanceKm=
router.get('/available', getAvailableJobsHandler);           // GET /api/jobs/available?truckType=&serviceType=

// CRUD
router.post('/', createJobValidation, createJobHandler);     // POST  /api/jobs
router.get('/', getJobsHandler);                             // GET   /api/jobs?userId=|driverId=|status=

// Job by ID
router.get('/:id', getJobByIdHandler);                       // GET   /api/jobs/:id
router.get('/:id/match', matchDriversHandler);               // GET   /api/jobs/:id/match (list matching drivers)

// Job actions
router.put('/:id/accept', [
  body('driverId').notEmpty().withMessage('driverId is required'),
], acceptJobHandler);

router.put('/:id/status', [
  body('status').notEmpty().withMessage('status is required'),
], updateStatusHandler);

router.put('/:id/rate-driver', [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('rating must be 1–5'),
], rateDriverHandler);

router.delete('/:id/cancel', cancelJobHandler);              // DELETE /api/jobs/:id/cancel

module.exports = router;
