/**
 * Job Model — RoadResQ (Updated)
 *
 * Full job schema with service type, category, vehicle weight,
 * required truck type, pricing breakdown, and status lifecycle.
 *
 * Status lifecycle:
 *   pending → assigned → accepted → in_progress → at_garage/on_site → completed
 *   Any status → cancelled
 *   pending → quote_pending (for quote jobs)
 *   quote_pending → quoted → accepted_by_customer → assigned
 */

const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { getVehicleSpec, getServiceCategory, getRequiredTruckType, GARAGE_SPECS } = require('../utils/serviceEngine');
const { calculatePrice } = require('../utils/pricingEngine');

const COLLECTION = 'jobs';

/**
 * Build a complete job document from request data.
 * Used by createJob() and quote acceptance.
 */
function buildJobDocument(data) {
  const vehicleType = data.vehicleType;
  const spec = getVehicleSpec(vehicleType);

  // Determine category and truck requirements
  const serviceType = data.serviceType || (spec ? spec.serviceType : 'quote_industrial');
  const requiredTruckType = spec ? spec.requiredTruckType : 'quote_required';
  const estimatedWeightKg = spec ? spec.estimatedWeightKg : null;
  const minTruckCapacityKg = spec ? spec.minTruckCapacityKg : null;
  const requiresQuote = spec ? spec.requiresQuote : true;

  // Garage urgency
  let garageLevel = null;
  if (serviceType === 'garage') {
    garageLevel = data.garageUrgency || 'standard';
    const garageSpec = GARAGE_SPECS[garageLevel];
    if (garageSpec) {
      requiredTruckType = garageSpec.requiredTruckType;
    }
  }

  // Auto-calculate price (if not quote)
  const distanceKm = parseFloat(data.distanceKm) || 5;
  let price = null;
  let pricingBreakdown = null;
  let status = 'pending';

  if (!requiresQuote && !data.requiresQuote) {
    const priceKey = spec ? spec.priceKey : null;
    const result = calculatePrice(priceKey, distanceKm);
    if (result) {
      price = result.price;
      pricingBreakdown = result.breakdown;
    }
  } else {
    status = 'quote_pending';
  }

  const id = data.id || uuidv4();

  return {
    id,
    // ─── User ─────────────────────────────────────────────────
    userId: data.userId,
    driverId: null,
    garageId: data.garageId || null,

    // ─── Service Info ──────────────────────────────────────────
    serviceType,
    vehicleType: vehicleType || null,
    category: serviceType,                    // alias for frontend
    requiredTruckType,

    // ─── Vehicle / Load Details ────────────────────────────────
    estimatedWeightKg,
    minTruckCapacityKg,
    vehicleModel: data.vehicleModel || null,  // e.g. "Toyota Fortuner 2022"
    vehiclePlate: data.vehiclePlate || null,
    vehicleColor: data.vehicleColor || null,
    vehicleCondition: data.vehicleCondition || null, // 'running' | 'non_running'
    loadDescription: data.loadDescription || null,   // for heavy/industrial

    // ─── Location ──────────────────────────────────────────────
    pickup: data.pickup,
    drop: data.drop,
    pickupCoords: data.pickupCoords || null,  // { lat, lng }
    dropCoords: data.dropCoords || null,
    distanceKm,

    // ─── Garage Specifics ──────────────────────────────────────
    garageUrgency: garageLevel,               // 'urgent' | 'standard'
    repairDescription: data.repairDescription || null,

    // ─── Pricing ───────────────────────────────────────────────
    price,
    pricingBreakdown,
    requiresQuote: requiresQuote || data.requiresQuote || false,
    quotedPrice: null,                        // set by admin for quote jobs
    quotedAt: null,

    // ─── Status ────────────────────────────────────────────────
    status,
    // pending → assigned → accepted → in_progress → at_garage/on_site → completed
    // OR: quote_pending → quoted → accepted_by_customer → assigned

    // ─── Matching ──────────────────────────────────────────────
    matchedTruckType: null,                   // actual truck type used
    autoAssigned: false,

    // ─── Timestamps ────────────────────────────────────────────
    createdAt: new Date().toISOString(),
    assignedAt: null,
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,

    // ─── Notes ─────────────────────────────────────────────────
    customerNotes: data.customerNotes || null,
    adminNotes: null,
  };
}

/**
 * POST /api/jobs — Create a new job.
 * Auto-detects category, pricing, required truck type.
 */
async function createJob(data) {
  const job = buildJobDocument(data);
  await db.collection(COLLECTION).doc(job.id).set(job);
  return job;
}

/**
 * GET /api/jobs — All jobs (admin).
 */
async function getAllJobs({ status, limit = 50 } = {}) {
  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (status) query = query.where('status', '==', status);
  if (limit) query = query.limit(limit);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * GET /api/jobs?userId= — Customer job history.
 */
async function getJobsByUser(userId, { status } = {}) {
  let query = db.collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');
  if (status) query = query.where('status', '==', status);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * GET /api/jobs?driverId= — Driver job history.
 */
async function getJobsByDriver(driverId, { status } = {}) {
  let query = db.collection(COLLECTION)
    .where('driverId', '==', driverId)
    .orderBy('createdAt', 'desc');
  if (status) query = query.where('status', '==', status);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * GET /api/jobs/available — Jobs a driver can pick up.
 * Filtered by: status=pending, requiredTruckType
 */
async function getAvailableJobs({ requiredTruckType, serviceType } = {}) {
  let query = db.collection(COLLECTION).where('status', '==', 'pending');
  if (serviceType) query = query.where('serviceType', '==', serviceType);
  // Note: Firestore doesn't support 'IN' with variable arrays easily without index
  // We fetch pending and filter by compatible truck types in controller
  const snapshot = await query.orderBy('createdAt', 'asc').get();
  const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (requiredTruckType) {
    const { getCompatibleTruckTypes } = require('../utils/serviceEngine');
    // Filter: driver's compatible truck types must include the job's required type
    return jobs.filter((job) => {
      const compatible = getCompatibleTruckTypes(job.requiredTruckType);
      return compatible.includes(requiredTruckType);
    });
  }
  return jobs;
}

/**
 * GET /api/jobs/:id — Single job.
 */
async function getJobById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * PUT /api/jobs/:id/accept — Driver accepts a job.
 */
async function acceptJob(jobId, driverId, driverTruckType) {
  await db.collection(COLLECTION).doc(jobId).update({
    status: 'accepted',
    driverId,
    matchedTruckType: driverTruckType || null,
    acceptedAt: new Date().toISOString(),
  });
}

/**
 * PUT /api/jobs/:id/status — Update job status.
 */
async function updateJobStatus(jobId, newStatus, extras = {}) {
  const updates = { status: newStatus, ...extras };

  const timestamps = {
    accepted: 'acceptedAt',
    in_progress: 'startedAt',
    completed: 'completedAt',
    cancelled: 'cancelledAt',
    assigned: 'assignedAt',
  };

  if (timestamps[newStatus]) {
    updates[timestamps[newStatus]] = new Date().toISOString();
  }

  await db.collection(COLLECTION).doc(jobId).update(updates);
}

/**
 * Cancel a job and release the driver.
 */
async function cancelJob(jobId) {
  const job = await getJobById(jobId);
  if (!job) throw new Error('Job not found');

  await updateJobStatus(jobId, 'cancelled');

  // Release driver if one was assigned
  if (job.driverId) {
    const { releaseDriver } = require('../utils/matchingEngine');
    await releaseDriver(job.driverId);
  }
}

module.exports = {
  createJob,
  buildJobDocument,
  getAllJobs,
  getJobsByUser,
  getJobsByDriver,
  getAvailableJobs,
  getJobById,
  acceptJob,
  updateJobStatus,
  cancelJob,
};
