/**
 * Matching Engine — RoadResQ (v3.1.0)
 *
 * Intelligent driver-to-job matching. Filters in this order:
 *
 *   FILTER 1  — Document compliance (expired license/insurance/visa → blocked)
 *   FILTER 2  — Truck type compatibility (correct type + upgrade path)
 *   FILTER 3  — Payload capacity (driver truck kg rating ≥ vehicle weight)
 *   FILTER 4  — Geo radius (driver within 10 km of pickup)
 *   FILTER 5  — Basement / restricted clearance (truck height ≤ site limit)
 *   FILTER 6  — Gate pass (industrial sites)
 *   FILTER 7  — Equipment type (ANY ONE of required types in driver's list)
 *   FILTER 8  — Special load → expert-only (≥2 yr experience or isExpert flag)
 *   FILTER 9  — Service type support (driver registered for this service)
 *
 *   SORT      — yearsExperience DESC → rating DESC → distance ASC
 *
 * Key design: vehicleType drives ALL matching constraints automatically.
 * The customer never specifies truck type or equipment — the engine derives it.
 */

const { db } = require('../config/firebase');
const {
  getCompatibleTruckTypes,
  getVehicleSpec,
  deriveJobConstraints,
  TRUCK_TYPES,
} = require('./serviceEngine');

const DRIVERS_COLLECTION = 'drivers';
const JOBS_COLLECTION = 'jobs';

// ─── Geo Utils ────────────────────────────────────────────────────────────────

/**
 * Haversine formula — distance between two lat/lng points in km.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) { return (deg * Math.PI) / 180; }

// ─── ETA Calculation ──────────────────────────────────────────────────────────

const AVG_SPEED_KMH = 40; // Average city speed in Qatar

/**
 * Calculate ETA with Qatar peak-hour traffic buffer.
 * Peak hours (Qatar UTC+3): 07–09, 12–13, 17–20
 */
function calculateETA(distanceKm) {
  const nowUtc = new Date();
  const qatarHour = (nowUtc.getUTCHours() + 3) % 24;

  const isPeakHour =
    (qatarHour >= 7 && qatarHour < 9) ||
    (qatarHour >= 12 && qatarHour < 13) ||
    (qatarHour >= 17 && qatarHour < 20);

  const effectiveSpeed = isPeakHour ? AVG_SPEED_KMH * 0.8 : AVG_SPEED_KMH;
  const etaMinutes = Math.ceil((distanceKm / effectiveSpeed) * 60);

  return {
    etaMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
    isPeakHour,
    trafficBufferApplied: isPeakHour,
  };
}

// ─── Document Compliance ──────────────────────────────────────────────────────

/**
 * Hard-block if any critical document is expired or account is suspended.
 * @returns {{ compliant: boolean, reason?: string }}
 */
function checkDocumentCompliance(driver) {
  const now = new Date();

  if (driver.isSuspended) {
    return { compliant: false, reason: 'Driver account is suspended due to repeated violations.' };
  }

  if (driver.licenseExpiry && new Date(driver.licenseExpiry) < now) {
    return { compliant: false, reason: 'Driver license has expired.' };
  }

  if (driver.insuranceExpiry && new Date(driver.insuranceExpiry) < now) {
    return { compliant: false, reason: 'Vehicle insurance has expired.' };
  }

  if (driver.visaExpiry && new Date(driver.visaExpiry) < now) {
    return { compliant: false, reason: 'Driver visa has expired.' };
  }

  if (driver.roadworthinessExpiry && new Date(driver.roadworthinessExpiry) < now) {
    return { compliant: false, reason: 'Vehicle roadworthiness certificate has expired.' };
  }

  // Firestore-level compliance block (set by daily compliance checker)
  if (driver.complianceBlocked) {
    return { compliant: false, reason: 'Driver is compliance-blocked. Documents must be renewed.' };
  }

  return { compliant: true };
}

// ─── Equipment Match ──────────────────────────────────────────────────────────

/**
 * Check if a driver has ANY ONE of the required equipment types.
 *
 * Logic:
 *   - If requiredEquipmentTypes is empty ([]) → no equipment needed → pass
 *   - If requiredEquipmentTypes has values → driver needs at least one
 *
 * @param {string[]} required  - e.g. ['boom_truck', 'flatbed']
 * @param {string[]} driverHas - e.g. ['flatbed', 'flatbed_tow']
 * @returns {boolean}
 */
function hasRequiredEquipment(required, driverHas) {
  if (!required || required.length === 0) return true;           // no equipment needed
  if (!driverHas || driverHas.length === 0) return false;       // driver has nothing
  return required.some((req) => driverHas.includes(req));        // any-one match
}

// ─── Main Matching Function ───────────────────────────────────────────────────

/**
 * Find the best matched drivers for a job.
 *
 * The engine auto-derives constraints from vehicleType via deriveJobConstraints().
 * Customer-supplied fields (clearanceHeightMm, requiresGatePass) override the
 * auto-derived values.
 *
 * @param {object} jobData
 * @param {string}  jobData.vehicleType            — e.g. 'Excavator', 'Sedan'
 * @param {string}  jobData.serviceType            — overrides auto-derived if given
 * @param {string}  jobData.requiredTruckType      — overrides auto-derived if given
 * @param {number}  jobData.minTruckCapacityKg     — overrides auto-derived if given
 * @param {string[]} jobData.requiredEquipmentTypes— overrides auto-derived if given
 * @param {object}  jobData.pickupCoords           — { lat, lng } for geo filter
 * @param {boolean} jobData.isRestrictedArea       — basement / low-clearance site
 * @param {number}  jobData.clearanceHeightMm      — max vehicle height allowed (mm)
 * @param {boolean} jobData.requiresGatePass       — industrial gate pass needed
 * @param {boolean} jobData.isSpecialLoad          — expert-only routing
 * @param {number}  jobData.radiusKm               — geo radius (default 10)
 *
 * @returns {Promise<Array>} Matched driver objects sorted by score, enriched with ETA
 */
async function findMatchingDrivers(jobData) {
  // ── Auto-derive constraints from vehicleType, then merge with any explicit overrides
  const autoConstraints = jobData.vehicleType
    ? deriveJobConstraints(jobData.vehicleType, {})
    : {};

  const {
    serviceType       = autoConstraints.serviceType,
    requiredTruckType = autoConstraints.requiredTruckType,
    minTruckCapacityKg = autoConstraints.minTruckCapacityKg || 0,
    // requiredEquipmentTypes: use explicit override > auto-derived > []
    requiredEquipmentTypes = (
      Array.isArray(jobData.requiredEquipmentTypes) && jobData.requiredEquipmentTypes.length
        ? jobData.requiredEquipmentTypes
        : (autoConstraints.requiredEquipmentTypes || [])
    ),
    pickupCoords,
    isRestrictedArea  = false,
    clearanceHeightMm = null,
    requiresGatePass  = false,
    isSpecialLoad     = autoConstraints.isSpecialLoad || false,
    radiusKm          = 10,
  } = { ...autoConstraints, ...jobData };

  // Get all truck types that can handle this job (upgrade path)
  const compatibleTruckTypes = requiredTruckType
    ? getCompatibleTruckTypes(requiredTruckType)
    : [];

  // Query: online + approved + available drivers
  const snapshot = await db
    .collection(DRIVERS_COLLECTION)
    .where('isOnline', '==', true)
    .where('isApproved', '==', true)
    .where('isAvailable', '==', true)
    .get();

  if (snapshot.empty) return [];

  const allDrivers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const matched = allDrivers.filter((driver) => {

    // ── FILTER 1: Document compliance (hard block)
    const compliance = checkDocumentCompliance(driver);
    if (!compliance.compliant) return false;

    // ── FILTER 2: Truck type compatibility
    if (compatibleTruckTypes.length > 0) {
      if (!compatibleTruckTypes.includes(driver.truckType)) return false;
    }

    // ── FILTER 3: Payload capacity
    if (minTruckCapacityKg > 0 && driver.maxCapacityKg) {
      if (driver.maxCapacityKg < minTruckCapacityKg) return false;
    }

    // ── FILTER 4: Geo radius (skip if driver has no known location — include as fallback)
    if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
      const driverLoc = driver.lastLocation;
      if (driverLoc && driverLoc.lat && driverLoc.lng) {
        const dist = haversineDistanceKm(
          pickupCoords.lat, pickupCoords.lng,
          driverLoc.lat, driverLoc.lng,
        );
        if (dist > radiusKm) return false;
      }
    }

    // ── FILTER 5: Basement / restricted clearance
    // Driver's vehicle must physically FIT under the clearance height
    if (isRestrictedArea && clearanceHeightMm) {
      if (driver.vehicleHeightMm && driver.vehicleHeightMm > clearanceHeightMm) {
        return false;
      }
    }

    // ── FILTER 6: Gate pass
    if (requiresGatePass && !driver.hasGatePass) return false;

    // ── FILTER 7: Equipment type (any-of match)
    // Auto-derived from vehicleType — customer never needs to set this manually
    if (!hasRequiredEquipment(requiredEquipmentTypes, driver.equipmentTypes)) {
      return false;
    }

    // ── FILTER 8: Special load → expert drivers only
    if (isSpecialLoad) {
      const isExpert = driver.isExpert || (driver.yearsExperience && driver.yearsExperience >= 2);
      if (!isExpert) return false;
    }

    // ── FILTER 9: Service type support
    if (serviceType && driver.serviceTypes && driver.serviceTypes.length > 0) {
      if (!driver.serviceTypes.includes(serviceType)) return false;
    }

    return true;
  });

  // ── Enrich each matched driver with distance and ETA
  const enriched = matched.map((driver) => {
    let distKm = null;
    let eta = null;

    if (pickupCoords && pickupCoords.lat && driver.lastLocation?.lat) {
      distKm = haversineDistanceKm(
        pickupCoords.lat, pickupCoords.lng,
        driver.lastLocation.lat, driver.lastLocation.lng,
      );
      eta = calculateETA(distKm);
    }

    return {
      ...driver,
      _distanceKm: distKm,
      _eta: eta,
      // Attach why this driver qualified (for debugging / admin panel)
      _matchedOn: {
        truckType: driver.truckType,
        equipmentTypes: driver.equipmentTypes || [],
        requiredEquipmentTypes,
        capacityKg: driver.maxCapacityKg,
        vehicleHeightMm: driver.vehicleHeightMm,
        hasGatePass: driver.hasGatePass,
      },
    };
  });

  // ── Sort: experience DESC → rating DESC → distance ASC
  enriched.sort((a, b) => {
    const expA = a.yearsExperience || 0;
    const expB = b.yearsExperience || 0;
    if (expB !== expA) return expB - expA;

    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingB !== ratingA) return ratingB - ratingA;

    const dA = a._distanceKm ?? 999;
    const dB = b._distanceKm ?? 999;
    return dA - dB;
  });

  return enriched;
}

// ─── Garage Broadcast ─────────────────────────────────────────────────────────

/**
 * Find all available drivers within radius of a location.
 * Used for garage repair broadcast (no equipment/truck constraints).
 */
async function findDriversWithinRadius(location, radiusKm = 10, filters = {}) {
  return findMatchingDrivers({
    pickupCoords: location,
    radiusKm,
    ...filters,
  });
}

// ─── Auto-Assign ──────────────────────────────────────────────────────────────

/**
 * Auto-assign the best available driver to a job.
 * All constraints are derived from vehicleType automatically.
 *
 * @param {string} jobId
 * @param {object} jobData
 * @returns {object|null} Assigned driver or null if none available
 */
async function autoAssignDriver(jobId, jobData) {
  const drivers = await findMatchingDrivers(jobData);
  if (drivers.length === 0) return null;

  const assigned = drivers[0];

  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    driverId: assigned.id,
    status: 'assigned',
    assignedAt: new Date().toISOString(),
    matchedTruckType: assigned.truckType,
    matchedEquipmentTypes: assigned.equipmentTypes || [],
    autoAssigned: true,
    driverDistanceKm: assigned._distanceKm || null,
    estimatedETA: assigned._eta || null,
  });

  await db.collection(DRIVERS_COLLECTION).doc(assigned.id).update({
    isAvailable: false,
    activeJobId: jobId,
  });

  return assigned;
}

// ─── Release Driver ───────────────────────────────────────────────────────────

async function releaseDriver(driverId) {
  await db.collection(DRIVERS_COLLECTION).doc(driverId).update({
    isAvailable: true,
    activeJobId: null,
  });
}

// ─── Manual Compatibility Check ───────────────────────────────────────────────

/**
 * Used when a driver manually picks up a job.
 * Validates all constraints before accepting.
 *
 * @returns {{ compatible: boolean, reason?: string }}
 */
function checkDriverJobCompatibility(driver, job) {
  const compliance = checkDocumentCompliance(driver);
  if (!compliance.compliant) return { compatible: false, reason: compliance.reason };

  if (!driver.isOnline)    return { compatible: false, reason: 'You must be online to accept jobs.' };
  if (!driver.isApproved)  return { compatible: false, reason: 'Your account is not yet approved.' };
  if (!driver.isAvailable) return { compatible: false, reason: 'You are currently on another job.' };

  // Auto-derive constraints from vehicleType (same logic as auto-assign)
  if (job.vehicleType) {
    const constraints = deriveJobConstraints(job.vehicleType, {
      isRestrictedArea: job.isRestrictedArea,
      clearanceHeightMm: job.clearanceHeightMm,
      requiresGatePass: job.requiresGatePass,
    });

    const compatibleTruckTypes = getCompatibleTruckTypes(constraints.requiredTruckType);
    if (compatibleTruckTypes.length > 0 && !compatibleTruckTypes.includes(driver.truckType)) {
      return {
        compatible: false,
        reason: `Your truck type '${driver.truckType}' cannot transport a ${constraints.vehicleLabel}. Required: ${constraints.requiredTruckType} or higher.`,
      };
    }

    if (constraints.minTruckCapacityKg > 0 && driver.maxCapacityKg) {
      if (driver.maxCapacityKg < constraints.minTruckCapacityKg) {
        return {
          compatible: false,
          reason: `Your truck capacity (${driver.maxCapacityKg} kg) is below the minimum required for a ${constraints.vehicleLabel} (${constraints.minTruckCapacityKg} kg).`,
        };
      }
    }

    if (!hasRequiredEquipment(constraints.requiredEquipmentTypes, driver.equipmentTypes)) {
      return {
        compatible: false,
        reason: `This job requires one of [${constraints.requiredEquipmentTypes.join(', ')}] equipment. Your registered equipment: [${(driver.equipmentTypes || []).join(', ') || 'none'}].`,
      };
    }

    if (constraints.isSpecialLoad) {
      const isExpert = driver.isExpert || (driver.yearsExperience && driver.yearsExperience >= 2);
      if (!isExpert) {
        return {
          compatible: false,
          reason: 'This job is marked as a special load and requires a driver with at least 2 years of experience.',
        };
      }
    }
  }

  // Basement / clearance check
  if (job.isRestrictedArea && job.clearanceHeightMm && driver.vehicleHeightMm) {
    if (driver.vehicleHeightMm > job.clearanceHeightMm) {
      return {
        compatible: false,
        reason: `Your vehicle height (${driver.vehicleHeightMm} mm) exceeds the site clearance limit (${job.clearanceHeightMm} mm).`,
      };
    }
  }

  // Gate pass check
  if (job.requiresGatePass && !driver.hasGatePass) {
    return { compatible: false, reason: 'This job requires a gate pass. You do not have one registered.' };
  }

  return { compatible: true };
}

module.exports = {
  findMatchingDrivers,
  findDriversWithinRadius,
  autoAssignDriver,
  releaseDriver,
  checkDriverJobCompatibility,
  calculateETA,
  haversineDistanceKm,
  checkDocumentCompliance,
  hasRequiredEquipment,
};
