/**
 * Matching Engine — RoadResQ
 *
 * Smart driver-to-job matching based on:
 *   1. Required truck type (must be compatible with vehicle being towed/transported)
 *   2. Driver's truck carrying capacity (must meet minimum for vehicle weight)
 *   3. Driver availability (not currently on an active job)
 *   4. Driver online + approved status
 *   5. Service type support (driver must support the service category)
 *
 * Upgrade path: A heavier truck CAN take a lighter job.
 *   heavy_tow → can also take standard_tow + light_tow jobs
 *   flatbed_heavy → can also take flatbed_small jobs
 *   standard_tow → can also take light_tow jobs
 */

const { db } = require('../config/firebase');
const { getCompatibleTruckTypes, getVehicleSpec, TRUCK_TYPES } = require('./serviceEngine');

const DRIVERS_COLLECTION = 'drivers';
const JOBS_COLLECTION = 'jobs';

/**
 * Find the best matched drivers for a job.
 *
 * Matching criteria (all must be true):
 *   ✔ isOnline: true
 *   ✔ isApproved: true
 *   ✔ isAvailable: true (not on an active job)
 *   ✔ truckType in compatible truck types for this vehicle
 *   ✔ maxCapacityKg >= vehicle's minTruckCapacityKg
 *   ✔ serviceTypes array includes the required service type
 *
 * @param {object} jobData - { vehicleType, serviceType, requiredTruckType, minTruckCapacityKg }
 * @returns {Array} Array of matched driver objects, sorted by rating desc
 */
async function findMatchingDrivers(jobData) {
  const {
    vehicleType,
    serviceType,
    requiredTruckType,
    minTruckCapacityKg = 0,
  } = jobData;

  // Get all truck types that can handle this job (upgrade path)
  const compatibleTruckTypes = getCompatibleTruckTypes(requiredTruckType);

  // Query: online + approved + available drivers
  // Firestore doesn't support OR queries on different fields,
  // so we query online+approved+available, then filter in memory by truck type
  const snapshot = await db
    .collection(DRIVERS_COLLECTION)
    .where('isOnline', '==', true)
    .where('isApproved', '==', true)
    .where('isAvailable', '==', true)
    .get();

  if (snapshot.empty) return [];

  const allDrivers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // In-memory filter: truck type + capacity + service type support
  const matched = allDrivers.filter((driver) => {
    // Must have correct truck type (or a compatible larger truck)
    const hasTruckType = compatibleTruckTypes.includes(driver.truckType);
    if (!hasTruckType) return false;

    // Truck must have sufficient capacity for the vehicle weight
    const hasCapacity =
      !minTruckCapacityKg ||
      !driver.maxCapacityKg ||
      driver.maxCapacityKg >= minTruckCapacityKg;
    if (!hasCapacity) return false;

    // Driver must support this service type
    const supportsService =
      !driver.serviceTypes ||
      driver.serviceTypes.length === 0 ||
      driver.serviceTypes.includes(serviceType);
    if (!supportsService) return false;

    return true;
  });

  // Sort: prefer drivers with higher rating, then closer proximity (if available)
  matched.sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    return ratingB - ratingA;
  });

  return matched;
}

/**
 * Auto-assign the best available driver to a job.
 * Returns the assigned driver, or null if none available.
 *
 * @param {string} jobId - The Firestore job document ID
 * @param {object} jobData - Job details for matching
 * @returns {object|null} Assigned driver or null
 */
async function autoAssignDriver(jobId, jobData) {
  const drivers = await findMatchingDrivers(jobData);

  if (drivers.length === 0) return null;

  // Pick the top-rated available driver
  const assigned = drivers[0];

  // Update job: assign driverId, change status to 'assigned'
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    driverId: assigned.id,
    status: 'assigned',
    assignedAt: new Date().toISOString(),
    matchedTruckType: assigned.truckType,
  });

  // Update driver: set isAvailable = false (they're on a job)
  await db.collection(DRIVERS_COLLECTION).doc(assigned.id).update({
    isAvailable: false,
    activeJobId: jobId,
  });

  return assigned;
}

/**
 * Release a driver back to available status after job completion/cancellation.
 *
 * @param {string} driverId
 */
async function releaseDriver(driverId) {
  await db.collection(DRIVERS_COLLECTION).doc(driverId).update({
    isAvailable: true,
    activeJobId: null,
  });
}

/**
 * Check if a specific driver is compatible with a job.
 * Used when a driver manually picks a job from the available list.
 *
 * @param {object} driver - Driver document
 * @param {object} job - Job document
 * @returns {{ compatible: boolean, reason?: string }}
 */
function checkDriverJobCompatibility(driver, job) {
  const spec = getVehicleSpec(job.vehicleType);
  if (!spec) {
    return { compatible: false, reason: 'Unknown vehicle type in job.' };
  }

  const compatibleTruckTypes = getCompatibleTruckTypes(spec.requiredTruckType);

  if (!compatibleTruckTypes.includes(driver.truckType)) {
    return {
      compatible: false,
      reason: `Your truck type '${driver.truckType}' cannot transport a ${job.vehicleType}. Required: ${spec.requiredTruckType}.`,
    };
  }

  if (driver.maxCapacityKg && spec.minTruckCapacityKg) {
    if (driver.maxCapacityKg < spec.minTruckCapacityKg) {
      return {
        compatible: false,
        reason: `Your truck capacity (${driver.maxCapacityKg}kg) is below the minimum required (${spec.minTruckCapacityKg}kg) for a ${job.vehicleType}.`,
      };
    }
  }

  if (!driver.isOnline) {
    return { compatible: false, reason: 'You must be online to accept jobs.' };
  }

  if (!driver.isApproved) {
    return { compatible: false, reason: 'Your account is not yet approved.' };
  }

  if (!driver.isAvailable) {
    return { compatible: false, reason: 'You are currently on another job.' };
  }

  return { compatible: true };
}

module.exports = {
  findMatchingDrivers,
  autoAssignDriver,
  releaseDriver,
  checkDriverJobCompatibility,
};
