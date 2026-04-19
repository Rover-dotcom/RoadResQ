/**
 * Driver Model — Week 2 Task 1 + Week 3 Driver Filtering
 *
 * Handles Firestore operations for the 'drivers' collection.
 * Used by: driverController.js, jobController.js (matching)
 */

const { db } = require('../config/firebase');

const COLLECTION = 'drivers';

/**
 * Creates a driver document in Firestore.
 */
const createDriver = async (uid, data) => {
  const driver = {
    uid,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    vehicleType: data.vehicleType || '',
    licenseNumber: data.licenseNumber || '',
    experience: data.experience || '',
    isOnline: false,
    isApproved: false,
    lastLocation: null,
    createdAt: new Date().toISOString(),
  };
  await db.collection(COLLECTION).doc(uid).set(driver);
  return driver;
};

/**
 * Fetches a driver by UID.
 */
const getDriverById = async (uid) => {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

/**
 * Returns all drivers (admin use).
 */
const getAllDrivers = async () => {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Week 3 Task 5 — Driver Filtering
 * Equivalent to: Driver.find({ isOnline: true, isApproved: true, vehicleType: job.vehicleType })
 *
 * @param {string} vehicleType - must match driver's vehicleType exactly
 */
const getMatchingDrivers = async (vehicleType) => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('isOnline', '==', true)
    .where('isApproved', '==', true)
    .where('vehicleType', '==', vehicleType)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Updates specific fields on a driver document.
 */
const updateDriver = async (uid, updates) => {
  await db.collection(COLLECTION).doc(uid).update(updates);
};

/**
 * Sets online/offline status.
 * Week 3 Task 10: PUT /driver/status
 */
const setOnlineStatus = async (uid, isOnline, location = null) => {
  const updates = { isOnline };
  if (location) updates.lastLocation = location;
  await db.collection(COLLECTION).doc(uid).update(updates);
};

/**
 * Approve or revoke a driver (admin action).
 */
const setApprovalStatus = async (uid, isApproved) => {
  await db.collection(COLLECTION).doc(uid).update({ isApproved });
};

module.exports = {
  createDriver,
  getDriverById,
  getAllDrivers,
  getMatchingDrivers,
  updateDriver,
  setOnlineStatus,
  setApprovalStatus,
};
