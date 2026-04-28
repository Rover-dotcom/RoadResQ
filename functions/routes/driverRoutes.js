const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createDriverHandler,
  getDriversHandler,
  getDriverByIdHandler,
  getDriverStatusHandler,
  setStatusHandler,
  goOnlineHandler,
  goOfflineHandler,
  approveDriverHandler,
  updateDriverHandler,
  getTruckTypesHandler,
} = require('../controllers/driverController');

// ─── Validation Rules ─────────────────────────────────────────────────────────

const createDriverValidation = [
  body('uid').notEmpty().withMessage('uid (Firebase UID) is required'),
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required'),
  body('phone').notEmpty().withMessage('phone is required'),
  body('truckType')
    .notEmpty()
    .withMessage('truckType is required')
    .isIn(['light_tow', 'standard_tow', 'heavy_tow', 'flatbed_small', 'flatbed_heavy', 'service_van'])
    .withMessage('truckType must be: light_tow | standard_tow | heavy_tow | flatbed_small | flatbed_heavy | service_van'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: specific paths BEFORE parameterized paths (:id)

router.get('/truck-types', getTruckTypesHandler);          // GET /api/drivers/truck-types

router.post('/', createDriverValidation, createDriverHandler);  // POST /api/drivers
router.get('/', getDriversHandler);                             // GET  /api/drivers?truckType=&isOnline=&isApproved=

// Legacy: set online/offline via body { driverUid, isOnline }
router.put('/status', [
  body('driverUid').notEmpty().withMessage('driverUid is required'),
  body('isOnline').isBoolean().withMessage('isOnline must be true or false'),
], setStatusHandler);

// Per-driver routes (IMPORTANT: specific sub-paths before bare /:id)
router.get('/:id/status', getDriverStatusHandler);         // GET  /api/drivers/:id/status (full status + compliance)
router.put('/:id/online', goOnlineHandler);                // PUT  /api/drivers/:id/online  { lastLocation? }
router.put('/:id/offline', goOfflineHandler);              // PUT  /api/drivers/:id/offline

router.get('/:id', getDriverByIdHandler);                  // GET /api/drivers/:id
router.put('/:id/approve', [
  body('approve').isBoolean().withMessage('approve must be true or false'),
], approveDriverHandler);

router.put('/:id', updateDriverHandler);                   // PUT /api/drivers/:id

module.exports = router;
