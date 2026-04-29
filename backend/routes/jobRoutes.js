const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const {
  createJobHandler,
  getJobsHandler,
  getMyJobsHandler,
  getAvailableJobsHandler,
  getPriceEstimateHandler,
  getServiceInfoHandler,
  getJobByIdHandler,
  getJobStatusHandler,
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

  // ─── Scheduling fields ─────────────────────────────────────────
  body('isScheduled')
    .optional()
    .isBoolean()
    .withMessage('isScheduled must be true or false'),
  body('scheduledPickupDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('scheduledPickupDate must be in YYYY-MM-DD format (e.g. 2026-05-10)'),
  body('scheduledPickupTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('scheduledPickupTime must be in HH:MM 24-hour format (e.g. 09:00)'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: specific paths BEFORE parameterized paths (:id)

// Catalog / Info
router.get('/service-info', getServiceInfoHandler);         // All service types + pricing catalog
router.get('/price-estimate', getPriceEstimateHandler);    // ?vehicleType=Sedan&distanceKm=12
router.get('/available', getAvailableJobsHandler);         // ?truckType=standard_tow&serviceType=tow (driver use)
router.get('/my-jobs', getMyJobsHandler);                  // ?userId=xxx&status=pending (customer use)

// CRUD
router.post('/', createJobValidation, createJobHandler);   // POST /api/jobs
router.get('/', getJobsHandler);                           // GET  /api/jobs?userId=|driverId=|status=

// Job by ID
router.get('/:id', getJobByIdHandler);                     // GET /api/jobs/:id (full details)
router.get('/:id/status', getJobStatusHandler);            // GET /api/jobs/:id/status (live status + driver ETA)
router.get('/:id/match', matchDriversHandler);             // GET /api/jobs/:id/match (matching drivers list)

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

router.delete('/:id/cancel', cancelJobHandler);            // DELETE /api/jobs/:id/cancel

module.exports = router;
