/**
 * Job Model — Week 2 Task 1 + Week 3 Updated Job Model
 *
 * Week 3 Job fields:
 *   serviceType, vehicleType, category, pickup, drop,
 *   price, status, driverId, createdAt
 *
 * Handles Firestore operations for the 'jobs' collection.
 * Used by: jobController.js
 */

const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { getCategory, calculatePrice } = require('../utils/categoryEngine');

const COLLECTION = 'jobs';

/**
 * Week 2 Task 2 + Week 3 Task 2: Create Job
 *
 * Auto-detects category, calculates price, saves to Firestore.
 *
 * @param {object} data - { userId, serviceType, vehicleType, pickup, drop, distanceKm?, description? }
 * @returns {object} Saved job document
 */
const createJob = async (data) => {
  // Week 3: Category engine
  const category = getCategory(data.vehicleType);

  // Week 3: Pricing engine
  const distanceKm = data.distanceKm || 5; // fallback 5km
  const price = calculatePrice(data.vehicleType, distanceKm);

  const id = uuidv4();
  const job = {
    id,
    userId: data.userId,
    driverId: null,
    garageId: data.garageId || null,
    serviceType: data.serviceType, // 'tow' | 'repair' | 'heavy' | 'quote'
    vehicleType: data.vehicleType,
    category,                          // auto-detected
    pickup: data.pickup,
    drop: data.drop,
    price,                             // auto-calculated
    distanceKm,
    status: 'pending',
    description: data.description || null,
    repairOption: data.repairOption || null,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
  };

  await db.collection(COLLECTION).doc(id).set(job);
  return job;
};

/**
 * Week 2 Task 2: GET /jobs — all jobs (admin).
 */
const getAllJobs = async () => {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Week 3 Task 8: GET /jobs?userId= — customer job history.
 */
const getJobsByUser = async (userId) => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Week 3 Task 8: GET /jobs?driverId= — driver job history.
 */
const getJobsByDriver = async (driverId) => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('driverId', '==', driverId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Week 3 Task 6: GET /jobs/available
 * Returns pending jobs that match the driver's vehicleType.
 */
const getAvailableJobs = async (vehicleType) => {
  let query = db.collection(COLLECTION).where('status', '==', 'pending');
  if (vehicleType) {
    query = query.where('vehicleType', '==', vehicleType);
  }
  const snapshot = await query.orderBy('createdAt', 'asc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches a single job by ID.
 */
const getJobById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

/**
 * Week 3 Task 7: PUT /jobs/:id/accept
 * Assigns a driver to the job and updates status.
 */
const acceptJob = async (jobId, driverId) => {
  const updates = {
    status: 'accepted',
    driverId,
    acceptedAt: new Date().toISOString(),
  };
  await db.collection(COLLECTION).doc(jobId).update(updates);
};

/**
 * Updates job status to any valid state.
 * Valid: pending | accepted | in_progress | at_garage | completed | cancelled
 */
const updateJobStatus = async (jobId, newStatus) => {
  const updates = { status: newStatus };
  if (newStatus === 'completed') {
    updates.completedAt = new Date().toISOString();
  }
  await db.collection(COLLECTION).doc(jobId).update(updates);
};

module.exports = {
  createJob,
  getAllJobs,
  getJobsByUser,
  getJobsByDriver,
  getAvailableJobs,
  getJobById,
  acceptJob,
  updateJobStatus,
};
