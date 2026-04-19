/**
 * Driver Controller — Week 3 Tasks 5, 10
 *
 * PUT  /api/drivers/status       → setStatusHandler()    (Week 3 Task 10)
 * GET  /api/drivers/:id          → getDriverHandler()
 * GET  /api/drivers              → getAllDriversHandler() (admin)
 * PUT  /api/drivers/:id/approve  → approveDriverHandler() (admin)
 */

const { validationResult } = require('express-validator');
const {
  createDriver,
  getDriverById,
  getAllDrivers,
  getMatchingDrivers,
  updateDriver,
  setOnlineStatus,
  setApprovalStatus,
} = require('../models/driverModel');

// ─── PUT /api/drivers/status ──────────────────────────────────────────────────

/**
 * Week 3 Task 10: Driver Online/Offline
 * Body: { driverUid, isOnline, location?: { lat, lng } }
 *
 * Postman: PUT http://localhost:3000/api/drivers/status
 *   Body: { "driverUid": "...", "isOnline": true }
 */
const setStatusHandler = async (req, res) => {
  const { driverUid, isOnline, location } = req.body;

  if (!driverUid || typeof isOnline !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      message: 'driverUid (string) and isOnline (boolean) are required.',
    });
  }

  try {
    await setOnlineStatus(driverUid, isOnline, location || null);
    return res.status(200).json({
      status: 'success',
      data: { driverUid, isOnline },
    });
  } catch (err) {
    console.error('Set driver status error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update driver status.' });
  }
};

// ─── GET /api/drivers/:id ────────────────────────────────────────────────────

const getDriverHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const driver = await getDriverById(id);
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver not found.' });
    }
    return res.status(200).json({ status: 'success', data: driver });
  } catch (err) {
    console.error('Get driver error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch driver.' });
  }
};

// ─── GET /api/drivers ────────────────────────────────────────────────────────

/**
 * Returns all drivers (admin panel).
 * Query: ?vehicleType=  — filters to matching drivers (Week 3 Task 5)
 */
const getAllDriversHandler = async (req, res) => {
  const { vehicleType } = req.query;
  try {
    let drivers;
    if (vehicleType) {
      drivers = await getMatchingDrivers(vehicleType);
    } else {
      drivers = await getAllDrivers();
    }
    return res.status(200).json({ status: 'success', data: drivers });
  } catch (err) {
    console.error('Get all drivers error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch drivers.' });
  }
};

// ─── PUT /api/drivers/:id/approve ────────────────────────────────────────────

const approveDriverHandler = async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body; // true = approve, false = revoke

  if (typeof approve !== 'boolean') {
    return res.status(400).json({ status: 'error', message: 'approve (boolean) is required.' });
  }

  try {
    await setApprovalStatus(id, approve);
    return res.status(200).json({
      status: 'success',
      data: { driverUid: id, isApproved: approve },
    });
  } catch (err) {
    console.error('Approve driver error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update approval status.' });
  }
};

// ─── POST /api/drivers ────────────────────────────────────────────────────────

const createDriverHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { uid, name, email, phone, vehicleType, licenseNumber, experience } = req.body;
  try {
    const driver = await createDriver(uid, { name, email, phone, vehicleType, licenseNumber, experience });
    return res.status(201).json({ status: 'success', data: driver });
  } catch (err) {
    console.error('Create driver error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create driver profile.' });
  }
};

module.exports = {
  setStatusHandler,
  getDriverHandler,
  getAllDriversHandler,
  approveDriverHandler,
  createDriverHandler,
};
