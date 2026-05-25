const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
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

router.post('/', verifyToken, createDriverValidation, createDriverHandler);  // POST /api/drivers
router.get('/', verifyToken, getDriversHandler);                             // GET  /api/drivers?truckType=&isOnline=&isApproved=

// Legacy: set online/offline via body { driverUid, isOnline }
router.put('/status', [
  body('driverUid').notEmpty().withMessage('driverUid is required'),
  body('isOnline').isBoolean().withMessage('isOnline must be true or false'),
], setStatusHandler);

// Per-driver routes (IMPORTANT: specific sub-paths before bare /:id)
router.get('/:id/status', verifyToken, getDriverStatusHandler);         // GET  /api/drivers/:id/status (full status + compliance)
router.put('/:id/online', verifyToken, goOnlineHandler);                // PUT  /api/drivers/:id/online  { lastLocation? }
router.put('/:id/offline', verifyToken, goOfflineHandler);              // PUT  /api/drivers/:id/offline

router.get('/:id', verifyToken, getDriverByIdHandler);                  // GET /api/drivers/:id
router.put('/:id/approve', [
  body('approve').isBoolean().withMessage('approve must be true or false'),
], approveDriverHandler);

router.put('/:id', verifyToken, updateDriverHandler);                   // PUT /api/drivers/:id

module.exports = router;
