/**
 * Driver Routes — Week 3 Tasks 5, 10
 *
 * POST  /api/drivers            → create driver profile
 * GET   /api/drivers            → get all drivers (admin) or ?vehicleType= filter
 * GET   /api/drivers/:id        → get driver by UID
 * PUT   /api/drivers/status     → set online/offline
 * PUT   /api/drivers/:id/approve → admin approve/revoke
 */

const express = require('express');
const { body } = require('express-validator');
const {
  setStatusHandler,
  getDriverHandler,
  getAllDriversHandler,
  approveDriverHandler,
  createDriverHandler,
} = require('../controllers/driverController');

const router = express.Router();

// PUT /api/drivers/status  — must be BEFORE /:id
router.put('/status', setStatusHandler);

// POST /api/drivers
router.post(
  '/',
  [
    body('uid').notEmpty().withMessage('uid is required'),
    body('name').notEmpty().withMessage('name is required'),
    body('vehicleType').notEmpty().withMessage('vehicleType is required'),
    body('licenseNumber').notEmpty().withMessage('licenseNumber is required'),
  ],
  createDriverHandler
);

// GET /api/drivers
router.get('/', getAllDriversHandler);

// GET /api/drivers/:id
router.get('/:id', getDriverHandler);

// PUT /api/drivers/:id/approve
router.put('/:id/approve', approveDriverHandler);

module.exports = router;
