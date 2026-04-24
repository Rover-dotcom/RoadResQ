/**
 * Driver Model — RoadResQ (Updated)
 *
 * Enhanced driver schema with:
 *   - truckType: what truck/transport they operate
 *   - maxCapacityKg: maximum load the truck can carry
 *   - serviceTypes[]: which services they support
 *   - isAvailable: false when on an active job
 *   - rating: driver rating (0-5)
 *   - completedJobs: total completed job count
 */

const { db } = require('../config/firebase');
const { TRUCK_TYPES, SERVICE_TYPES } = require('../utils/serviceEngine');

const COLLECTION = 'drivers';

/**
 * Build a full driver profile document.
 */
function buildDriverDocument(uid, data) {
  return {
    uid,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',

    // ─── Truck / Transport Info ────────────────────────────────
    truckType: data.truckType || TRUCK_TYPES.STANDARD_TOW,
    // Options: light_tow | standard_tow | heavy_tow | flatbed_small | flatbed_heavy | service_van

    truckModel: data.truckModel || null,         // e.g. "Isuzu Elf 2020"
    truckPlate: data.truckPlate || null,
    truckColor: data.truckColor || null,
    maxCapacityKg: data.maxCapacityKg || null,   // e.g. 2500 (kg)
    maxLengthM: data.maxLengthM || null,          // e.g. 5.5 (metres) — for flatbeds

    // ─── Service Capabilities ──────────────────────────────────
    serviceTypes: data.serviceTypes || [SERVICE_TYPES.TOW],
    // Options: tow | garage | heavy_equipment | quote_industrial
    // A driver can support multiple service types

    // ─── Credentials ───────────────────────────────────────────
    licenseNumber: data.licenseNumber || '',
    licenseExpiry: data.licenseExpiry || null,   // ISO date string
    experience: data.experience || '',
    profilePhotoUrl: data.profilePhotoUrl || null,

    // ─── Status ────────────────────────────────────────────────
    isOnline: false,                             // toggled by driver
    isApproved: false,                           // set by admin
    isAvailable: true,                           // false when on active job
    activeJobId: null,                           // currently assigned job

    // ─── Location (last known) ─────────────────────────────────
    lastLocation: null,                          // { lat, lng }
    lastLocationUpdatedAt: null,

    // ─── Performance ───────────────────────────────────────────
    rating: 0,                                   // 0–5 average rating
    totalRatings: 0,
    completedJobs: 0,
    cancelledJobs: 0,

    // ─── Timestamps ────────────────────────────────────────────
    createdAt: new Date().toISOString(),
    approvedAt: null,
    lastActiveAt: null,

    // ─── Admin Notes ───────────────────────────────────────────
    adminNotes: null,
    rejectionReason: null,
  };
}

/**
 * Create a new driver profile in Firestore.
 */
async function createDriver(uid, data) {
  const driver = buildDriverDocument(uid, data);
  await db.collection(COLLECTION).doc(uid).set(driver);
  return driver;
}

/**
 * Get a driver by Firebase UID.
 */
async function getDriverById(uid) {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Get all drivers (admin). Optionally filter by status/type.
 */
async function getAllDrivers({ truckType, isOnline, isApproved } = {}) {
  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (truckType) query = query.where('truckType', '==', truckType);
  if (typeof isOnline === 'boolean') query = query.where('isOnline', '==', isOnline);
  if (typeof isApproved === 'boolean') query = query.where('isApproved', '==', isApproved);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Week 3 Driver Filtering (enhanced):
 * isOnline + isApproved + isAvailable + compatible with job requirements.
 * Actual filtering by truck type happens in matchingEngine.js.
 */
async function getAvailableDrivers() {
  const snapshot = await db
    .collection(COLLECTION)
    .where('isOnline', '==', true)
    .where('isApproved', '==', true)
    .where('isAvailable', '==', true)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update specific fields on a driver document.
 */
async function updateDriver(uid, updates) {
  await db.collection(COLLECTION).doc(uid).update(updates);
}

/**
 * PUT /api/drivers/status — Toggle online/offline.
 * Also updates last known location.
 */
async function setOnlineStatus(uid, isOnline, location = null) {
  const updates = {
    isOnline,
    lastActiveAt: new Date().toISOString(),
  };
  if (location && location.lat && location.lng) {
    updates.lastLocation = { lat: location.lat, lng: location.lng };
    updates.lastLocationUpdatedAt = new Date().toISOString();
  }
  // When going offline, mark as unavailable for jobs too
  if (!isOnline) {
    updates.isAvailable = false;
  } else {
    updates.isAvailable = true;
  }
  await db.collection(COLLECTION).doc(uid).update(updates);
}

/**
 * Admin approves or revokes a driver.
 */
async function setApprovalStatus(uid, isApproved, adminNotes = null) {
  const updates = {
    isApproved,
    approvedAt: isApproved ? new Date().toISOString() : null,
    rejectionReason: isApproved ? null : adminNotes,
  };
  if (adminNotes) updates.adminNotes = adminNotes;
  await db.collection(COLLECTION).doc(uid).update(updates);
}

/**
 * Update driver rating after job completion.
 * Recalculates average rating.
 */
async function updateDriverRating(uid, newRating) {
  const driver = await getDriverById(uid);
  if (!driver) throw new Error('Driver not found');

  const totalRatings = (driver.totalRatings || 0) + 1;
  const currentTotal = (driver.rating || 0) * (driver.totalRatings || 0);
  const newAverage = (currentTotal + newRating) / totalRatings;

  await db.collection(COLLECTION).doc(uid).update({
    rating: Math.round(newAverage * 10) / 10,
    totalRatings,
    completedJobs: (driver.completedJobs || 0) + 1,
  });
}

/**
 * Valid truck types and service types for validation.
 */
const VALID_TRUCK_TYPES = Object.values(TRUCK_TYPES);
const VALID_SERVICE_TYPES = Object.values(SERVICE_TYPES);

module.exports = {
  createDriver,
  buildDriverDocument,
  getDriverById,
  getAllDrivers,
  getAvailableDrivers,
  updateDriver,
  setOnlineStatus,
  setApprovalStatus,
  updateDriverRating,
  VALID_TRUCK_TYPES,
  VALID_SERVICE_TYPES,
};
