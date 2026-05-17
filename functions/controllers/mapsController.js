/**
 * Maps Controller — RoadResQ (Week 6 v8.0.0)
 *
 * GET  /api/maps/route          — route distance, ETA, polyline
 * GET  /api/maps/distance-matrix — batch distance calculation
 * GET  /api/maps/geocode         — address to lat/lng
 * GET  /api/maps/reverse-geocode — lat/lng to address
 * GET  /api/maps/polyline        — encoded polyline for map drawing
 * GET  /api/maps/status          — Google Maps API status
 * POST /api/maps/clear-cache     — clear route cache
 */

const {
  getRoute,
  getDistanceMatrix,
  geocodeAddress,
  reverseGeocode,
  getPolyline,
  checkMapsStatus,
  clearCache,
} = require('../utils/mapsEngine');

const ok = (res, data) => res.json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// GET /api/maps/route?originLat=&originLng=&destLat=&destLng=
async function getRouteHandler(req, res) {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return fail(res, 'originLat, originLng, destLat, destLng are required.');
    }

    const route = await getRoute(
      { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      { lat: parseFloat(destLat), lng: parseFloat(destLng) }
    );

    return ok(res, {
      origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
      route,
    });
  } catch (err) {
    console.error('[Maps] Route error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/maps/distance-matrix?origins=lat,lng|lat,lng&destinations=lat,lng|lat,lng
async function getDistanceMatrixHandler(req, res) {
  try {
    const { origins, destinations } = req.query;
    if (!origins || !destinations) {
      return fail(res, 'origins and destinations query params required. Format: lat,lng|lat,lng');
    }

    const parseCoords = (str) => str.split('|').map(pair => {
      const [lat, lng] = pair.split(',').map(Number);
      return { lat, lng };
    });

    const result = await getDistanceMatrix(parseCoords(origins), parseCoords(destinations));
    return ok(res, result);
  } catch (err) {
    console.error('[Maps] Distance matrix error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/maps/geocode?address=The Pearl, Doha
async function geocodeHandler(req, res) {
  try {
    const { address } = req.query;
    if (!address) return fail(res, 'address query param is required.');

    const result = await geocodeAddress(address);
    if (!result) return fail(res, 'Could not geocode address.', 404);
    if (result.error) return fail(res, result.error);

    return ok(res, result);
  } catch (err) {
    console.error('[Maps] Geocode error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/maps/reverse-geocode?lat=25.28&lng=51.53
async function reverseGeocodeHandler(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return fail(res, 'lat and lng query params are required.');

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    if (!result) return fail(res, 'Could not reverse geocode.', 404);
    if (result.error) return fail(res, result.error);

    return ok(res, result);
  } catch (err) {
    console.error('[Maps] Reverse geocode error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/maps/polyline?originLat=&originLng=&destLat=&destLng=
async function getPolylineHandler(req, res) {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return fail(res, 'originLat, originLng, destLat, destLng are required.');
    }

    const result = await getPolyline(
      { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      { lat: parseFloat(destLat), lng: parseFloat(destLng) }
    );

    return ok(res, result);
  } catch (err) {
    console.error('[Maps] Polyline error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/maps/status
async function mapsStatusHandler(_req, res) {
  try {
    const status = await checkMapsStatus();
    return ok(res, status);
  } catch (err) {
    console.error('[Maps] Status error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/maps/clear-cache
async function clearCacheHandler(_req, res) {
  try {
    const result = clearCache();
    return ok(res, { message: `Cleared ${result.cleared} cached entries.`, ...result });
  } catch (err) {
    console.error('[Maps] Clear cache error:', err);
    return fail(res, err.message, 500);
  }
}

module.exports = {
  getRouteHandler,
  getDistanceMatrixHandler,
  geocodeHandler,
  reverseGeocodeHandler,
  getPolylineHandler,
  mapsStatusHandler,
  clearCacheHandler,
};
