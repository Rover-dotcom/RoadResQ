/**
 * Tracking Controller — RoadResQ (Week 6)
 *
 * Handles all GPS tracking and location-based endpoints:
 * - POST /api/tracking/location — driver pushes GPS
 * - GET /api/tracking/nearby — find nearby drivers
 * - GET /api/tracking/job/:jobId — get live job tracking
 * - GET /api/tracking/job/:jobId/eta — get ETA only
 * - POST /api/tracking/job/:jobId/start — start job tracking
 * - POST /api/tracking/driver-arrived/:jobId — check/auto-detect arrival
 * - GET /api/tracking/route — calculate route distance + ETA
 * - POST /api/tracking/offline/:driverId — set driver offline
 */

const {
  updateDriverLocation,
  getDriverLocation,
  setDriverOffline,
  findNearbyDrivers,
  startJobTracking,
  updateJobTracking,
  getJobTracking,
  checkDriverArrival,
  calculateRouteDistance,
  calculateETABetweenPoints,
} = require('../utils/locationEngine');

// ─── POST /api/tracking/location ─────────────────────────────────────────────
// Driver sends GPS update every 5-10 seconds

async function pushLocation(req, res) {
  try {
    const { driverId, lat, lng, heading, speed } = req.body;

    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const location = await updateDriverLocation(driverId, { lat, lng, heading, speed });

    // If driver has active jobs, update their tracking too
    if (req.body.activeJobId) {
      await updateJobTracking(req.body.activeJobId, parseFloat(lat), parseFloat(lng));
    }

    res.json({
      status: 'ok',
      message: 'Location updated',
      location,
    });
  } catch (err) {
    console.error('[Tracking] Push location error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/tracking/nearby ────────────────────────────────────────────────
// Find drivers within radius of a point

async function getNearbyDrivers(req, res) {
  try {
    const { lat, lng, radius, limit } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params required' });

    const drivers = await findNearbyDrivers(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 10,
      parseInt(limit) || 20
    );

    res.json({
      status: 'ok',
      count: drivers.length,
      radiusKm: parseFloat(radius) || 10,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) },
      drivers,
    });
  } catch (err) {
    console.error('[Tracking] Nearby drivers error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/tracking/job/:jobId ────────────────────────────────────────────
// Get live tracking data for a job

async function getJobTrackingData(req, res) {
  try {
    const { jobId } = req.params;
    const tracking = await getJobTracking(jobId);

    if (!tracking) {
      return res.status(404).json({ error: 'No tracking data found for this job' });
    }

    // Also get driver's latest location for real-time position
    let driverLocation = null;
    if (tracking.driverId) {
      driverLocation = await getDriverLocation(tracking.driverId);
    }

    res.json({
      status: 'ok',
      jobId,
      tracking,
      driverLocation,
    });
  } catch (err) {
    console.error('[Tracking] Get job tracking error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/tracking/job/:jobId/eta ────────────────────────────────────────
// Get current ETA for a job

async function getJobETA(req, res) {
  try {
    const { jobId } = req.params;
    const tracking = await getJobTracking(jobId);

    if (!tracking) {
      return res.status(404).json({ error: 'No tracking data found for this job' });
    }

    // Get driver's current location for fresh ETA
    let eta = null;
    if (tracking.driverId) {
      const driverLoc = await getDriverLocation(tracking.driverId);
      if (driverLoc && driverLoc.lat && driverLoc.lng) {
        // Calculate ETA to pickup or current destination
        const targetLat = (tracking.status === 'in_progress' && tracking.dropoffLat)
          ? tracking.dropoffLat : tracking.pickupLat;
        const targetLng = (tracking.status === 'in_progress' && tracking.dropoffLng)
          ? tracking.dropoffLng : tracking.pickupLng;

        eta = calculateETABetweenPoints(driverLoc.lat, driverLoc.lng, targetLat, targetLng);
      }
    }

    res.json({
      status: 'ok',
      jobId,
      trackingStatus: tracking.status,
      eta: eta || { etaMinutes: tracking.etaMinutes, distanceKm: tracking.distanceKm },
      lastUpdate: tracking.lastUpdate,
    });
  } catch (err) {
    console.error('[Tracking] Get ETA error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/tracking/job/:jobId/start ─────────────────────────────────────
// Initialize tracking when driver accepts a job

async function startTracking(req, res) {
  try {
    const { jobId } = req.params;
    const { driverId, pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    if (!pickupLat || !pickupLng) return res.status(400).json({ error: 'pickupLat and pickupLng are required' });

    const tracking = await startJobTracking(jobId, driverId, pickupLat, pickupLng, dropoffLat, dropoffLng);

    res.json({
      status: 'ok',
      message: 'Job tracking started',
      jobId,
      tracking,
    });
  } catch (err) {
    console.error('[Tracking] Start tracking error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/tracking/driver-arrived/:jobId ────────────────────────────────
// Auto-detect if driver has arrived at pickup (< 100m)

async function detectArrival(req, res) {
  try {
    const { jobId } = req.params;
    const { driverId, thresholdMeters } = req.body;

    if (!driverId) return res.status(400).json({ error: 'driverId is required' });

    const result = await checkDriverArrival(driverId, jobId, thresholdMeters || 100);

    res.json({
      status: 'ok',
      jobId,
      ...result,
    });
  } catch (err) {
    console.error('[Tracking] Arrival detection error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/tracking/route ─────────────────────────────────────────────────
// Calculate route distance and ETA between two points

async function getRouteInfo(req, res) {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: 'originLat, originLng, destLat, destLng query params required' });
    }

    const route = calculateRouteDistance(
      { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      { lat: parseFloat(destLat), lng: parseFloat(destLng) }
    );

    res.json({
      status: 'ok',
      origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
      route,
    });
  } catch (err) {
    console.error('[Tracking] Route calculation error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── POST /api/tracking/offline/:driverId ────────────────────────────────────
// Set driver offline

async function goOffline(req, res) {
  try {
    const { driverId } = req.params;
    await setDriverOffline(driverId);

    res.json({
      status: 'ok',
      message: 'Driver set to offline',
      driverId,
    });
  } catch (err) {
    console.error('[Tracking] Go offline error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/tracking/driver/:driverId ──────────────────────────────────────
// Get a specific driver's location

async function getDriverLocationEndpoint(req, res) {
  try {
    const { driverId } = req.params;
    const location = await getDriverLocation(driverId);

    if (!location) {
      return res.status(404).json({ error: 'Driver location not found' });
    }

    res.json({
      status: 'ok',
      driverId,
      location,
    });
  } catch (err) {
    console.error('[Tracking] Get driver location error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  pushLocation,
  getNearbyDrivers,
  getJobTrackingData,
  getJobETA,
  startTracking,
  detectArrival,
  getRouteInfo,
  goOffline,
  getDriverLocationEndpoint,
};
