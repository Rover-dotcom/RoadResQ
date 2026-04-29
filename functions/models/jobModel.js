/**
 * Job Model — RoadResQ (v4.1.0)
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
  let requiredTruckType = spec ? spec.requiredTruckType : 'quote_required';
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

    // ─── Week 4: "Others" Custom Item Support ─────────────────
    // When vehicleType = 'Others', user fills these custom fields
    customItem: data.customItem || null,       // "What is it?" — short label
    customDetails: data.customDetails || null, // multiline description
    customPhotoUrls: data.customPhotoUrls || [],
    // Fallback: if customItem provided, admin reviews OR broader matching applied

    // ─── Week 4: Logistics Builder ────────────────────────────
    // Used in Heavy Equipment + Quote Industrial jobs
    dimensions: data.dimensions || null,       // { lengthM, widthM, heightM }
    weightKg: data.weightKg ? parseFloat(data.weightKg) : null,
    loadingType: data.loadingType || null,     // 'boom_truck' | 'flatbed' | 'precast_trailer'
    pickupAccessibility: data.pickupAccessibility || 'easy', // 'easy' | 'restricted'
    isFragile: data.isFragile || false,
    specialNotes: data.specialNotes || null,
    logisticsPhotoUrls: data.logisticsPhotoUrls || [],

    // ─── Week 4: Basement / Restricted Access ─────────────────
    isRestrictedArea: data.isRestrictedArea || false,
    clearanceHeightMm: data.clearanceHeightMm ? parseInt(data.clearanceHeightMm) : null,
    // e.g. underground parking with 2100mm max height

    // ─── Week 4: Equipment + Gate Pass Requirements ────────────
    equipmentType: data.equipmentType || null, // 'boom_truck' | 'flatbed' | 'flatbed_tow'
    requiresGatePass: data.requiresGatePass || false,
    isSpecialLoad: data.isSpecialLoad || false, // heavy/industrial → expert-only drivers

    // ─── Scheduling ────────────────────────────────────────────
    // isScheduled = true means customer wants a future pickup, not immediate
    isScheduled: data.isScheduled || false,
    scheduledPickupDate: data.scheduledPickupDate || null,  // 'YYYY-MM-DD' e.g. '2026-05-10'
    scheduledPickupTime: data.scheduledPickupTime || null,  // 'HH:MM' e.g. '09:00' (24h, Qatar time)
    scheduledAt: data.scheduledPickupDate ? new Date().toISOString() : null, // when this was scheduled

    // ─── Location ──────────────────────────────────────────────
    pickup: data.pickup,
    drop: data.drop,
    pickupCoords: data.pickupCoords || null,  // { lat, lng }
    dropCoords: data.dropCoords || null,
    distanceKm,

    // ─── Garage Specifics ──────────────────────────────────────
    garageUrgency: garageLevel,               // 'urgent' | 'standard'
    repairDescription: data.repairDescription || null,

    // ─── Pricing (Week 4: integer halala — 5000 = QR 50.00) ───
    price,                                    // integer halala
    priceDisplay: price ? `QR ${(price / 100).toFixed(2)}` : null,
    pricingBreakdown,
    requiresQuote: requiresQuote || data.requiresQuote || false,
    quotedPrice: null,                        // halala — set by admin/driver for quote jobs
    quotedAt: null,

    // ─── Status ────────────────────────────────────────────────
    status,
    // pending → assigned → accepted → in_progress → at_garage/on_site → completed
    // OR: quote_pending → quoted → accepted_by_customer → assigned

    // ─── Matching ──────────────────────────────────────────────
    matchedTruckType: null,                   // actual truck type used
    autoAssigned: false,
    driverDistanceKm: null,                   // distance from driver to pickup at time of assign
    estimatedETA: null,                       // { etaMinutes, isPeakHour, trafficBufferApplied }

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

    // ─── Cancellation Detail ───────────────────────────────────
    // Filled when status transitions to 'cancelled'
    cancellationReason: null, // e.g. 'customer_request' | 'no_driver_available' | 'driver_no_show'
    cancelledBy: null,        // 'customer' | 'driver' | 'system'
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
 * @param {string} jobId
 * @param {object} [options] - { reason, cancelledBy }
 */
async function cancelJob(jobId, options = {}) {
  const job = await getJobById(jobId);
  if (!job) throw new Error('Job not found');

  const extras = {
    cancellationReason: options.reason || 'customer_request',
    cancelledBy: options.cancelledBy || 'customer',
  };

  await updateJobStatus(jobId, 'cancelled', extras);

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
