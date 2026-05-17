/**
 * Location Engine — RoadResQ (Week 6)
 *
 * Handles all GPS/location operations:
 * - Driver live location updates via Firebase Realtime Database
 * - Nearby driver search using Haversine formula
 * - ETA calculation with Qatar peak-hour traffic buffers
 * - Route distance calculation (haversine + optional Google Distance Matrix)
 * - Driver arrival auto-detection (< 100m threshold)
 * - Job tracking state management
 *
 * Why Firebase RTDB (not Firestore)?
 * - Sub-second latency for GPS updates (5-10 second intervals)
 * - Lower cost per write for high-frequency location data
 * - Built-in real-time listeners for Flutter frontend
 */

const { db, admin } = require('../config/firebase');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

// Initialize Realtime Database
let rtdb;
try {
  rtdb = admin.database();
} catch (err) {
  console.warn('[Location] Firebase RTDB not initialized — using Firestore fallback');
  rtdb = null;
}

const LOCATIONS_REF = 'locations';
const JOB_TRACKING_REF = 'job_tracking';
const ARRIVAL_THRESHOLD_METERS = 100;
const EARTH_RADIUS_KM = 6371;

// ─── Geo Utils ────────────────────────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }

/**
 * Haversine formula — distance between two lat/lng points in km.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert km to meters.
 */
function kmToMeters(km) { return km * 1000; }

// ─── ETA Calculation ──────────────────────────────────────────────────────────

const AVG_SPEED_KMH = 40; // Average city speed in Qatar

/**
 * Calculate ETA with Qatar peak-hour traffic buffer.
 * Peak hours (Qatar UTC+3): 07-09, 12-13, 17-20
 *
 * @param {number} distanceKm
 * @returns {{ etaMinutes, distanceKm, isPeakHour, trafficMultiplier, effectiveSpeed }}
 */
function calculateETA(distanceKm) {
  const nowUtc = new Date();
  const qatarHour = (nowUtc.getUTCHours() + 3) % 24;

  const isPeakHour =
    (qatarHour >= 7 && qatarHour < 9) ||
    (qatarHour >= 12 && qatarHour < 13) ||
    (qatarHour >= 17 && qatarHour < 20);

  const trafficMultiplier = isPeakHour ? 1.25 : 1.0;
  const effectiveSpeed = AVG_SPEED_KMH / trafficMultiplier;
  const etaMinutes = Math.ceil((distanceKm / effectiveSpeed) * 60);

  return {
    etaMinutes,
    distanceKm: Math.round(distanceKm * 100) / 100,
    isPeakHour,
    trafficMultiplier,
    effectiveSpeed: Math.round(effectiveSpeed * 10) / 10,
  };
}

/**
 * Calculate ETA between two coordinate pairs.
 */
function calculateETABetweenPoints(lat1, lng1, lat2, lng2) {
  const distance = haversineDistanceKm(lat1, lng1, lat2, lng2);
  return calculateETA(distance);
}

// ─── Driver Location Updates (Firebase RTDB) ─────────────────────────────────

/**
 * Updates a driver's live location in Firebase RTDB.
 * Called by driver app every 5-10 seconds.
 *
 * @param {string} driverId
 * @param {object} locationData — { lat, lng, heading, speed }
 */
async function updateDriverLocation(driverId, locationData) {
  const { lat, lng, heading = 0, speed = 0 } = locationData;

  if (!lat || !lng) throw new Error('lat and lng are required');

  const update = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    heading: parseFloat(heading),
    speed: parseFloat(speed),
    updatedAt: Date.now(),
    isOnline: true,
  };

  if (rtdb) {
    await rtdb.ref(`${LOCATIONS_REF}/${driverId}`).set(update);
  } else {
    // Firestore fallback
    await db.collection('driver_locations').doc(driverId).set(update, { merge: true });
  }

  return update;
}

/**
 * Gets a driver's latest location.
 */
async function getDriverLocation(driverId) {
  if (rtdb) {
    const snap = await rtdb.ref(`${LOCATIONS_REF}/${driverId}`).once('value');
    return snap.val();
  }

  // Firestore fallback
  const doc = await db.collection('driver_locations').doc(driverId).get();
  return doc.exists ? doc.data() : null;
}

/**
 * Sets a driver as offline (called when driver goes offline or app closes).
 */
async function setDriverOffline(driverId) {
  if (rtdb) {
    await rtdb.ref(`${LOCATIONS_REF}/${driverId}/isOnline`).set(false);
  } else {
    await db.collection('driver_locations').doc(driverId).update({ isOnline: false });
  }
}

// ─── Nearby Driver Search ─────────────────────────────────────────────────────

/**
 * Finds all online drivers within a radius of a given point.
 * Uses Haversine formula for accurate geo-filtering.
 *
 * @param {number} lat — center latitude
 * @param {number} lng — center longitude
 * @param {number} [radiusKm=10] — search radius in km
 * @param {number} [limit=20] — max results
 * @returns {Promise<Array>} — sorted by distance ascending
 */
async function findNearbyDrivers(lat, lng, radiusKm = 10, limit = 20) {
  let allDriverLocations = [];

  if (rtdb) {
    const snap = await rtdb.ref(LOCATIONS_REF).once('value');
    const data = snap.val() || {};
    allDriverLocations = Object.entries(data).map(([id, loc]) => ({ driverId: id, ...loc }));
  } else {
    const snap = await db.collection('driver_locations').where('isOnline', '==', true).get();
    allDriverLocations = snap.docs.map(doc => ({ driverId: doc.id, ...doc.data() }));
  }

  // Filter online drivers within radius
  const nearby = allDriverLocations
    .filter(d => d.isOnline && d.lat && d.lng)
    .map(d => {
      const distance = haversineDistanceKm(lat, lng, d.lat, d.lng);
      const eta = calculateETA(distance);
      return {
        driverId: d.driverId,
        lat: d.lat,
        lng: d.lng,
        heading: d.heading || 0,
        speed: d.speed || 0,
        distanceKm: Math.round(distance * 100) / 100,
        etaMinutes: eta.etaMinutes,
        lastUpdate: d.updatedAt,
      };
    })
    .filter(d => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return nearby;
}

// ─── Job Tracking ─────────────────────────────────────────────────────────────

/**
 * Initializes live tracking for a job.
 * Called when a driver accepts a job.
 */
async function startJobTracking(jobId, driverId, pickupLat, pickupLng, dropoffLat, dropoffLng) {
  const trackingData = {
    driverId,
    status: 'assigned',
    pickupLat: parseFloat(pickupLat),
    pickupLng: parseFloat(pickupLng),
    dropoffLat: dropoffLat ? parseFloat(dropoffLat) : null,
    dropoffLng: dropoffLng ? parseFloat(dropoffLng) : null,
    etaMinutes: null,
    distanceKm: null,
    lastUpdate: Date.now(),
    startedAt: Date.now(),
  };

  if (rtdb) {
    await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).set(trackingData);
  } else {
    await db.collection('job_tracking').doc(jobId).set(trackingData);
  }

  return trackingData;
}

/**
 * Updates job tracking with driver's current position and recalculated ETA.
 */
async function updateJobTracking(jobId, driverLat, driverLng) {
  let trackingData;

  if (rtdb) {
    const snap = await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).once('value');
    trackingData = snap.val();
  } else {
    const doc = await db.collection('job_tracking').doc(jobId).get();
    trackingData = doc.exists ? doc.data() : null;
  }

  if (!trackingData) return null;

  // Calculate distance and ETA to pickup or dropoff based on status
  let targetLat, targetLng;
  if (trackingData.status === 'assigned' || trackingData.status === 'en_route') {
    targetLat = trackingData.pickupLat;
    targetLng = trackingData.pickupLng;
  } else {
    targetLat = trackingData.dropoffLat || trackingData.pickupLat;
    targetLng = trackingData.dropoffLng || trackingData.pickupLng;
  }

  const distanceKm = haversineDistanceKm(driverLat, driverLng, targetLat, targetLng);
  const eta = calculateETA(distanceKm);

  const update = {
    currentLat: driverLat,
    currentLng: driverLng,
    distanceKm: eta.distanceKm,
    etaMinutes: eta.etaMinutes,
    isPeakHour: eta.isPeakHour,
    lastUpdate: Date.now(),
  };

  if (rtdb) {
    await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).update(update);
  } else {
    await db.collection('job_tracking').doc(jobId).update(update);
  }

  return { ...trackingData, ...update };
}

/**
 * Gets the current tracking state for a job.
 */
async function getJobTracking(jobId) {
  if (rtdb) {
    const snap = await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).once('value');
    return snap.val();
  }

  const doc = await db.collection('job_tracking').doc(jobId).get();
  return doc.exists ? doc.data() : null;
}

/**
 * Updates the tracking status for a job.
 */
async function updateTrackingStatus(jobId, status) {
  const update = { status, lastUpdate: Date.now() };

  if (rtdb) {
    await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).update(update);
  } else {
    await db.collection('job_tracking').doc(jobId).update(update);
  }

  return update;
}

// ─── Driver Arrival Detection ─────────────────────────────────────────────────

/**
 * Checks if a driver has arrived at the pickup point (< 100m).
 * If arrived, auto-updates job status to 'arrived'.
 *
 * @param {string} driverId
 * @param {string} jobId
 * @param {number} [thresholdMeters=100]
 * @returns {{ arrived, distanceMeters, autoUpdated }}
 */
async function checkDriverArrival(driverId, jobId, thresholdMeters = ARRIVAL_THRESHOLD_METERS) {
  // Get driver's current location
  const driverLoc = await getDriverLocation(driverId);
  if (!driverLoc || !driverLoc.lat || !driverLoc.lng) {
    return { arrived: false, error: 'Driver location not available' };
  }

  // Get job tracking data for pickup coordinates
  const tracking = await getJobTracking(jobId);
  if (!tracking) {
    return { arrived: false, error: 'Job tracking not found' };
  }

  const distanceKm = haversineDistanceKm(
    driverLoc.lat, driverLoc.lng,
    tracking.pickupLat, tracking.pickupLng
  );
  const distanceMeters = Math.round(kmToMeters(distanceKm));
  const arrived = distanceMeters < thresholdMeters;

  if (arrived) {
    // Auto-update job status
    await updateTrackingStatus(jobId, 'arrived');

    // Also update the Firestore job document
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();
    if (jobDoc.exists && jobDoc.data().status !== 'arrived') {
      await jobRef.update({
        status: 'arrived',
        arrivedAt: new Date().toISOString(),
      });
    }

    await logEvent(EVENT_TYPES.DRIVER_ARRIVED, {
      entityId: jobId,
      entityType: 'job',
      actorId: driverId,
      details: { distanceMeters, threshold: thresholdMeters },
    });
  }

  return {
    arrived,
    distanceMeters,
    autoUpdated: arrived,
    driverLocation: { lat: driverLoc.lat, lng: driverLoc.lng },
    pickupLocation: { lat: tracking.pickupLat, lng: tracking.pickupLng },
  };
}

// ─── Route Distance Calculation ───────────────────────────────────────────────

/**
 * Calculate route distance and ETA between two points.
 * Uses Haversine formula (straight-line). For road-distance, integrate
 * Google Distance Matrix API when API key is available.
 *
 * @param {{ lat, lng }} origin
 * @param {{ lat, lng }} destination
 * @returns {{ distanceKm, etaMinutes, isPeakHour, method }}
 */
function calculateRouteDistance(origin, destination) {
  const distance = haversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  // Apply road-factor multiplier (roads are ~1.3x longer than straight-line)
  const roadDistance = distance * 1.3;
  const eta = calculateETA(roadDistance);

  return {
    straightLineKm: Math.round(distance * 100) / 100,
    roadDistanceKm: Math.round(roadDistance * 100) / 100,
    etaMinutes: eta.etaMinutes,
    isPeakHour: eta.isPeakHour,
    trafficMultiplier: eta.trafficMultiplier,
    method: 'haversine_with_road_factor',
  };
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Removes tracking data when a job is completed.
 */
async function clearJobTracking(jobId) {
  if (rtdb) {
    await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).remove();
  } else {
    await db.collection('job_tracking').doc(jobId).delete();
  }
}

// ─── Route Recalculation (Week 6 v8.0.0) ────────────────────────────────────

/**
 * Recalculate ETA when driver deviates from original route.
 * Uses mapsEngine if available, otherwise Haversine fallback.
 *
 * @param {string} jobId
 * @param {number} driverLat — current driver lat
 * @param {number} driverLng — current driver lng
 * @returns {Promise<object>} — new ETA + distance info
 */
async function recalculateRoute(jobId, driverLat, driverLng) {
  const tracking = await getJobTracking(jobId);
  if (!tracking) throw new Error('No tracking data for this job');

  const destLat = tracking.dropoffLat || tracking.pickupLat;
  const destLng = tracking.dropoffLng || tracking.pickupLng;

  let routeData;
  try {
    const mapsEngine = require('./mapsEngine');
    routeData = await mapsEngine.getRoute(
      { lat: driverLat, lng: driverLng },
      { lat: destLat, lng: destLng }
    );
  } catch (_) {
    // Fallback to Haversine
    const distance = haversineDistanceKm(driverLat, driverLng, destLat, destLng);
    const eta = calculateETA(distance);
    routeData = {
      distanceKm: Math.round(distance * 1.3 * 100) / 100,
      durationMinutes: eta.etaMinutes,
      method: 'haversine_fallback',
    };
  }

  // Update tracking with new ETA
  const now = new Date().toISOString();
  if (rtdb) {
    await rtdb.ref(`${JOB_TRACKING_REF}/${jobId}`).update({
      currentEtaMinutes: routeData.durationMinutes,
      currentDistanceKm: routeData.distanceKm,
      routeRecalculatedAt: now,
      recalculationMethod: routeData.method,
    });
  } else {
    await db.collection('job_tracking').doc(jobId).update({
      currentEtaMinutes: routeData.durationMinutes,
      currentDistanceKm: routeData.distanceKm,
      routeRecalculatedAt: now,
      recalculationMethod: routeData.method,
    });
  }

  return {
    jobId,
    newEtaMinutes: routeData.durationMinutes,
    newDistanceKm: routeData.distanceKm,
    driverLocation: { lat: driverLat, lng: driverLng },
    destination: { lat: destLat, lng: destLng },
    method: routeData.method,
    recalculatedAt: now,
  };
}

/**
 * Get percentage-based trip completion.
 *
 * @param {string} jobId
 * @returns {Promise<object>} — { progressPercent, distanceCovered, distanceRemaining, ... }
 */
async function getTripProgress(jobId) {
  const tracking = await getJobTracking(jobId);
  if (!tracking) return null;

  const driverLoc = await getDriverLocation(tracking.driverId);
  if (!driverLoc) return { jobId, progressPercent: 0, message: 'Driver location unavailable' };

  const pickupLat = tracking.pickupLat;
  const pickupLng = tracking.pickupLng;
  const dropoffLat = tracking.dropoffLat || pickupLat;
  const dropoffLng = tracking.dropoffLng || pickupLng;

  const totalDistance = haversineDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const remainingDistance = haversineDistanceKm(driverLoc.lat, driverLoc.lng, dropoffLat, dropoffLng);
  const coveredDistance = Math.max(0, totalDistance - remainingDistance);

  let progressPercent = totalDistance > 0 ? Math.min(100, Math.round((coveredDistance / totalDistance) * 100)) : 0;

  // If the driver is within arrival threshold of destination, snap to 100%
  if (kmToMeters(remainingDistance) < ARRIVAL_THRESHOLD_METERS) {
    progressPercent = 100;
  }

  return {
    jobId,
    progressPercent,
    totalDistanceKm: Math.round(totalDistance * 100) / 100,
    coveredDistanceKm: Math.round(coveredDistance * 100) / 100,
    remainingDistanceKm: Math.round(remainingDistance * 100) / 100,
    driverLocation: { lat: driverLoc.lat, lng: driverLoc.lng },
    destination: { lat: dropoffLat, lng: dropoffLng },
    trackingStatus: tracking.status,
    currentEtaMinutes: tracking.currentEtaMinutes || null,
  };
}

/**
 * Get encoded polyline for map drawing.
 */
async function getRoutePolyline(origin, destination) {
  try {
    const mapsEngine = require('./mapsEngine');
    return await mapsEngine.getPolyline(origin, destination);
  } catch (_) {
    return {
      polyline: null,
      distanceKm: haversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1.3,
      durationMinutes: calculateETA(haversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1.3).etaMinutes,
      method: 'haversine_fallback',
      message: 'Polyline unavailable without Google Maps API key',
    };
  }
}

/**
 * Set driver online (opposite of setDriverOffline).
 */
async function setDriverOnline(driverId) {
  if (rtdb) {
    await rtdb.ref(`${LOCATIONS_REF}/${driverId}`).update({
      isOnline: true,
      isAvailable: true,
      updatedAt: new Date().toISOString(),
    });
  }

  await db.collection('drivers').doc(driverId).update({
    isOnline: true,
    isAvailable: true,
    updatedAt: new Date().toISOString(),
  });

  return { driverId, status: 'online', updatedAt: new Date().toISOString() };
}

// ─── GPS Throttle (max 1 update per 3 seconds per driver) ────────────────────

const lastUpdateTimestamp = new Map();
const GPS_THROTTLE_MS = 3000;

/**
 * Batch update driver locations with throttle enforcement.
 *
 * @param {Array<{driverId, lat, lng, heading, speed}>} updates
 * @returns {Promise<{processed, throttled, errors}>}
 */
async function batchUpdateLocations(updates) {
  const results = { processed: 0, throttled: 0, errors: 0 };

  for (const update of updates) {
    const { driverId, lat, lng, heading, speed } = update;

    // Check throttle
    const lastUpdate = lastUpdateTimestamp.get(driverId);
    if (lastUpdate && (Date.now() - lastUpdate) < GPS_THROTTLE_MS) {
      results.throttled++;
      continue;
    }

    try {
      await updateDriverLocation(driverId, lat, lng, heading || 0, speed || 0);
      lastUpdateTimestamp.set(driverId, Date.now());
      results.processed++;
    } catch (err) {
      console.warn(`[Location] Batch update failed for ${driverId}:`, err.message);
      results.errors++;
    }
  }

  // Clean old throttle entries (> 60 seconds old)
  const cutoff = Date.now() - 60000;
  for (const [key, ts] of lastUpdateTimestamp) {
    if (ts < cutoff) lastUpdateTimestamp.delete(key);
  }

  return results;
}

module.exports = {
  // Geo utils
  haversineDistanceKm,
  kmToMeters,
  calculateETA,
  calculateETABetweenPoints,
  calculateRouteDistance,

  // Driver location
  updateDriverLocation,
  getDriverLocation,
  setDriverOffline,
  setDriverOnline,

  // Nearby search
  findNearbyDrivers,

  // Job tracking
  startJobTracking,
  updateJobTracking,
  getJobTracking,
  updateTrackingStatus,
  clearJobTracking,

  // Arrival detection
  checkDriverArrival,

  // Route recalculation (Week 6 v8.0.0)
  recalculateRoute,
  getTripProgress,
  getRoutePolyline,

  // Batch updates (Week 6 v8.0.0)
  batchUpdateLocations,
};
