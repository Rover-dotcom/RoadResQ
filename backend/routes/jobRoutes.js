/**
 * Job Routes — Week 2 Task 2 + Week 3 Tasks 2, 6, 7, 8
 *
 * POST   /api/jobs                → create job
 * GET    /api/jobs                → get all jobs (or ?userId= / ?driverId=)
 * GET    /api/jobs/available      → available pending jobs (Week 3)
 * GET    /api/jobs/price-estimate → price estimate
 * GET    /api/jobs/:id            → get single job
 * PUT    /api/jobs/:id/accept     → driver accepts job (Week 3)
 * PUT    /api/jobs/:id/status     → update job status
 */

const express = require('express');
const { body } = require('express-validator');
const {
  createJobHandler,
  getJobsHandler,
  getAvailableJobsHandler,
  getJobByIdHandler,
  acceptJobHandler,
  updateStatusHandler,
  getPriceEstimate,
} = require('../controllers/jobController');

const router = express.Router();

// GET /api/jobs/available  — must be BEFORE /:id route
router.get('/available', getAvailableJobsHandler);

// GET /api/jobs/price-estimate
router.get('/price-estimate', getPriceEstimate);

// POST /api/jobs
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('serviceType')
      .notEmpty()
      .isIn(['tow', 'repair', 'heavy', 'quote'])
      .withMessage('serviceType must be tow, repair, heavy, or quote'),
    body('vehicleType').notEmpty().withMessage('vehicleType is required'),
    body('pickup').notEmpty().withMessage('pickup location is required'),
    body('drop').notEmpty().withMessage('drop location is required'),
    body('distanceKm')
      .optional()
      .isNumeric()
      .withMessage('distanceKm must be a number'),
  ],
  createJobHandler
);

// GET /api/jobs  (also handles ?userId= and ?driverId=)
router.get('/', getJobsHandler);

// GET /api/jobs/:id
router.get('/:id', getJobByIdHandler);

// PUT /api/jobs/:id/accept
router.put('/:id/accept', acceptJobHandler);

// PUT /api/jobs/:id/status
router.put(
  '/:id/status',
  [
    body('status')
      .notEmpty()
      .isIn(['pending', 'accepted', 'in_progress', 'at_garage', 'completed', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  updateStatusHandler
);

module.exports = router;
