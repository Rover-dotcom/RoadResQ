/**
 * Driver Controller — RoadResQ (Updated)
 *
 * POST  /api/drivers              → createDriverHandler()
 * GET   /api/drivers              → getDriversHandler()
 * GET   /api/drivers/:id          → getDriverByIdHandler()
 * PUT   /api/drivers/status       → setStatusHandler()
 * PUT   /api/drivers/:id/approve  → approveDriverHandler()
 * PUT   /api/drivers/:id          → updateDriverHandler()
 */

const { validationResult } = require('express-validator');
const {
  createDriver,
  getDriverById,
  getAllDrivers,
  setOnlineStatus,
  setApprovalStatus,
  updateDriver,
  VALID_TRUCK_TYPES,
  VALID_SERVICE_TYPES,
} = require('../models/driverModel');
const { findMatchingDrivers } = require('../utils/matchingEngine');
const { TRUCK_TYPES } = require('../utils/serviceEngine');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

// ─── POST /api/drivers ────────────────────────────────────────────────────────

/**
 * Create a driver profile in Firestore.
 * Run this AFTER POST /api/auth/register with role='driver'.
 *
 * Required: uid, name, email, phone, truckType
 * Optional: truckModel, truckPlate, maxCapacityKg, maxLengthM, serviceTypes, licenseNumber
 */
const createDriverHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 400, {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { uid, name, email, phone, truckType, truckModel, truckPlate, truckColor,
    maxCapacityKg, maxLengthM, serviceTypes, licenseNumber, licenseExpiry,
    experience, profilePhotoUrl } = req.body;

  // Validate truck type
  if (truckType && !VALID_TRUCK_TYPES.includes(truckType)) {
    return error(res, `Invalid truckType. Must be one of: ${VALID_TRUCK_TYPES.join(', ')}`);
  }

  // Check if driver already exists
  const existing = await getDriverById(uid);
  if (existing) return error(res, 'Driver profile already exists for this UID.', 409);

  try {
    const driver = await createDriver(uid, {
      name, email, phone, truckType, truckModel, truckPlate, truckColor,
      maxCapacityKg: maxCapacityKg ? parseFloat(maxCapacityKg) : null,
      maxLengthM: maxLengthM ? parseFloat(maxLengthM) : null,
      serviceTypes: serviceTypes || ['tow'],
      licenseNumber, licenseExpiry, experience, profilePhotoUrl,
    });
    return success(res, driver, 201);
  } catch (err) {
    console.error('Create driver error:', err);
    return error(res, 'Failed to create driver profile.', 500);
  }
};

// ─── GET /api/drivers ─────────────────────────────────────────────────────────

/**
 * Get all drivers.
 * Query: ?truckType=standard_tow&isOnline=true&isApproved=true
 */
const getDriversHandler = async (req, res) => {
  const { truckType, isOnline, isApproved } = req.query;
  try {
    const drivers = await getAllDrivers({
      truckType,
      isOnline: isOnline !== undefined ? isOnline === 'true' : undefined,
      isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
    });
    return success(res, { drivers, count: drivers.length });
  } catch (err) {
    console.error('Get drivers error:', err);
    return error(res, 'Failed to fetch drivers.', 500);
  }
};

// ─── GET /api/drivers/:id ─────────────────────────────────────────────────────

const getDriverByIdHandler = async (req, res) => {
  try {
    const driver = await getDriverById(req.params.id);
    if (!driver) return error(res, 'Driver not found.', 404);
    return success(res, driver);
  } catch (err) {
    return error(res, 'Failed to fetch driver.', 500);
  }
};

// ─── PUT /api/drivers/status ──────────────────────────────────────────────────

/**
 * Toggle driver online/offline.
 * Body: { driverUid, isOnline, location: { lat, lng } }
 */
const setStatusHandler = async (req, res) => {
  const { driverUid, isOnline, location } = req.body;
  if (!driverUid) return error(res, 'driverUid is required.');
  if (typeof isOnline !== 'boolean') return error(res, 'isOnline must be a boolean.');

  try {
    const driver = await getDriverById(driverUid);
    if (!driver) return error(res, 'Driver not found.', 404);
    if (!driver.isApproved) return error(res, 'Driver is not approved. Contact admin.', 403);

    await setOnlineStatus(driverUid, isOnline, location);

    return success(res, {
      driverId: driverUid,
      isOnline,
      isAvailable: isOnline, // going online sets available; offline removes
      lastLocation: location || driver.lastLocation,
      message: isOnline ? 'You are now online and accepting jobs.' : 'You are now offline.',
    });
  } catch (err) {
    console.error('Set status error:', err);
    return error(res, 'Failed to update driver status.', 500);
  }
};

// ─── PUT /api/drivers/:id/approve ────────────────────────────────────────────

/**
 * Admin approves or revokes a driver.
 * Body: { approve: true/false, adminNotes }
 */
const approveDriverHandler = async (req, res) => {
  const { approve, adminNotes } = req.body;
  if (typeof approve !== 'boolean') return error(res, 'approve must be a boolean (true/false).');

  try {
    const driver = await getDriverById(req.params.id);
    if (!driver) return error(res, 'Driver not found.', 404);

    await setApprovalStatus(req.params.id, approve, adminNotes || null);

    return success(res, {
      driverId: req.params.id,
      isApproved: approve,
      message: approve ? 'Driver approved successfully.' : 'Driver approval revoked.',
    });
  } catch (err) {
    console.error('Approve driver error:', err);
    return error(res, 'Failed to update driver approval.', 500);
  }
};

// ─── PUT /api/drivers/:id ─────────────────────────────────────────────────────

/**
 * Update driver profile fields.
 * Body: any updatable field (truckType, truckModel, phone, etc.)
 */
const updateDriverHandler = async (req, res) => {
  const { truckType, serviceTypes, ...rest } = req.body;

  if (truckType && !VALID_TRUCK_TYPES.includes(truckType)) {
    return error(res, `Invalid truckType. Valid: ${VALID_TRUCK_TYPES.join(', ')}`);
  }

  const updates = { ...rest };
  if (truckType) updates.truckType = truckType;
  if (serviceTypes) {
    const invalid = serviceTypes.filter((t) => !VALID_SERVICE_TYPES.includes(t));
    if (invalid.length > 0) {
      return error(res, `Invalid serviceTypes: ${invalid.join(', ')}`);
    }
    updates.serviceTypes = serviceTypes;
  }

  // Remove protected fields
  delete updates.isApproved;
  delete updates.approvedAt;
  delete updates.uid;
  delete updates.createdAt;

  try {
    const driver = await getDriverById(req.params.id);
    if (!driver) return error(res, 'Driver not found.', 404);

    await updateDriver(req.params.id, updates);
    return success(res, { driverId: req.params.id, updated: updates });
  } catch (err) {
    console.error('Update driver error:', err);
    return error(res, 'Failed to update driver.', 500);
  }
};

// ─── GET /api/drivers/truck-types ────────────────────────────────────────────

/**
 * Returns all valid truck types with labels.
 * Used by registration form in the app.
 */
const getTruckTypesHandler = (req, res) => {
  const truckTypeLabels = {
    light_tow: 'Light Tow Truck (Motorcycles, ATVs — up to 500kg)',
    standard_tow: 'Standard Tow Truck (Sedans, SUVs — up to 2500kg)',
    heavy_tow: 'Heavy Tow Truck (4x4, Pickup trucks — up to 4000kg)',
    flatbed_small: 'Small Flatbed Trailer (Skid Loaders — up to 5000kg)',
    flatbed_heavy: 'Heavy Flatbed Trailer (JCB, Excavators — up to 15000kg)',
    service_van: 'Service Van (Garage/Repair)',
  };
  return success(res, { truckTypes: truckTypeLabels, serviceTypes: VALID_SERVICE_TYPES });
};

module.exports = {
  createDriverHandler,
  getDriversHandler,
  getDriverByIdHandler,
  setStatusHandler,
  approveDriverHandler,
  updateDriverHandler,
  getTruckTypesHandler,
};
