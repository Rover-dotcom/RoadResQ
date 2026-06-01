/**
 * Maps Engine — RoadResQ (Week 8 v9.1.0)
 *
 * Google Maps integration layer with automatic fallback.
 *
 * When GOOGLE_MAPS_API_KEY is set (Week 8: now using production key):
 *   → Uses Google Distance Matrix, Directions, Geocoding APIs
 *   → Returns real road distances, durations, polylines
 *   → Traffic-aware ETAs with departure_time=now
 *
 * When GOOGLE_MAPS_API_KEY is NOT set:
 *   → Falls back to Haversine formula + 1.3x road factor
 *   → Still returns usable data for all endpoints
 *
 * All responses are cached for 5 minutes to reduce API quota usage.
 *
 * API Keys (from Google Cloud Console — blackburnxprojects@gmail.com):
 *   Browser Key: Used here for server-side API calls
 *   iOS Key:     Used in Flutter iOS app (AppDelegate.swift)
 *   Android Key: Used in Flutter Android app (AndroidManifest.xml)
 */

const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const EARTH_RADIUS_KM = 6371;

// Startup log: show Maps mode
if (GOOGLE_MAPS_API_KEY) {
  const masked = GOOGLE_MAPS_API_KEY.slice(0, 10) + '...' + GOOGLE_MAPS_API_KEY.slice(-4);
  console.log(`[Maps] ✅ Google Maps API active (key: ${masked})`);
} else {
  console.log('[Maps] ⚠️  No API key — using Haversine fallback for all calculations');
}

// Simple in-memory cache
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Evict oldest entries if cache grows too large
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Haversine Fallback ──────────────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }

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
 * Qatar peak-hour traffic detection (UTC+3).
 */
function isQatarPeakHour() {
  const qatarHour = (new Date().getUTCHours() + 3) % 24;
  return (
    (qatarHour >= 7 && qatarHour < 9) ||
    (qatarHour >= 12 && qatarHour < 13) ||
    (qatarHour >= 17 && qatarHour < 20)
  );
}

/**
 * Fallback route calculation using Haversine + road factor.
 */
function fallbackRoute(originLat, originLng, destLat, destLng) {
  const straightLine = haversineDistanceKm(originLat, originLng, destLat, destLng);
  const roadDistance = straightLine * 1.3;
  const isPeak = isQatarPeakHour();
  const speed = isPeak ? 32 : 40; // km/h
  const durationMinutes = Math.ceil((roadDistance / speed) * 60);

  return {
    distanceKm: Math.round(roadDistance * 100) / 100,
    distanceMeters: Math.round(roadDistance * 1000),
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    durationText: `${durationMinutes} min`,
    distanceText: `${(roadDistance).toFixed(1)} km`,
    isPeakHour: isPeak,
    trafficCondition: isPeak ? 'heavy' : 'normal',
    polyline: null, // No polyline without Google API
    method: 'haversine_fallback',
  };
}

// ─── Google API Helpers ──────────────────────────────────────────────────────

/**
 * Make an HTTPS GET request to Google API.
 */
function googleApiRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse Google API response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get route between two points with distance, duration, and optional polyline.
 *
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<object>}
 */
async function getRoute(origin, destination) {
  const cacheKey = `route:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  // Try Google API first
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}&departure_time=now`;
      const response = await googleApiRequest(url);

      if (response.status === 'OK' && response.routes.length > 0) {
        const route = response.routes[0];
        const leg = route.legs[0];

        const result = {
          distanceKm: Math.round((leg.distance.value / 1000) * 100) / 100,
          distanceMeters: leg.distance.value,
          durationMinutes: Math.ceil(leg.duration.value / 60),
          durationSeconds: leg.duration.value,
          durationText: leg.duration.text,
          distanceText: leg.distance.text,
          durationInTraffic: leg.duration_in_traffic
            ? { minutes: Math.ceil(leg.duration_in_traffic.value / 60), text: leg.duration_in_traffic.text }
            : null,
          isPeakHour: isQatarPeakHour(),
          trafficCondition: leg.duration_in_traffic
            ? (leg.duration_in_traffic.value > leg.duration.value * 1.2 ? 'heavy' : 'normal')
            : (isQatarPeakHour() ? 'heavy' : 'normal'),
          polyline: route.overview_polyline?.points || null,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          steps: leg.steps.map(s => ({
            instruction: s.html_instructions?.replace(/<[^>]*>/g, '') || '',
            distanceText: s.distance?.text,
            durationText: s.duration?.text,
            startLocation: s.start_location,
            endLocation: s.end_location,
          })),
          method: 'google_directions',
        };

        setCache(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('[Maps] Google Directions API failed, falling back to Haversine:', err.message);
    }
  }

  // Fallback to Haversine
  const result = fallbackRoute(origin.lat, origin.lng, destination.lat, destination.lng);
  setCache(cacheKey, result);
  return result;
}

/**
 * Get distance matrix for multiple origin/destination pairs.
 * Used by matching engine to batch-calculate distances.
 *
 * @param {Array<{lat, lng}>} origins
 * @param {Array<{lat, lng}>} destinations
 * @returns {Promise<object>}
 */
async function getDistanceMatrix(origins, destinations) {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destsStr}&key=${GOOGLE_MAPS_API_KEY}&departure_time=now`;

      const response = await googleApiRequest(url);

      if (response.status === 'OK') {
        return {
          rows: response.rows.map((row, i) => ({
            origin: origins[i],
            elements: row.elements.map((el, j) => ({
              destination: destinations[j],
              distanceKm: el.status === 'OK' ? Math.round((el.distance.value / 1000) * 100) / 100 : null,
              distanceText: el.status === 'OK' ? el.distance.text : null,
              durationMinutes: el.status === 'OK' ? Math.ceil(el.duration.value / 60) : null,
              durationText: el.status === 'OK' ? el.duration.text : null,
              durationInTraffic: el.duration_in_traffic
                ? { minutes: Math.ceil(el.duration_in_traffic.value / 60), text: el.duration_in_traffic.text }
                : null,
              status: el.status,
            })),
          })),
          method: 'google_distance_matrix',
        };
      }
    } catch (err) {
      console.warn('[Maps] Google Distance Matrix failed, falling back:', err.message);
    }
  }

  // Fallback: calculate all pairs with Haversine
  return {
    rows: origins.map((origin) => ({
      origin,
      elements: destinations.map((dest) => {
        const route = fallbackRoute(origin.lat, origin.lng, dest.lat, dest.lng);
        return {
          destination: dest,
          distanceKm: route.distanceKm,
          distanceText: route.distanceText,
          durationMinutes: route.durationMinutes,
          durationText: route.durationText,
          durationInTraffic: null,
          status: 'OK',
        };
      }),
    })),
    method: 'haversine_fallback',
  };
}

/**
 * Convert an address string to lat/lng coordinates.
 *
 * @param {string} address — e.g. "The Pearl, Doha, Qatar"
 * @returns {Promise<{ lat, lng, formattedAddress, placeId } | null>}
 */
async function geocodeAddress(address) {
  const cacheKey = `geocode:${address}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API key is required for geocoding. Set GOOGLE_MAPS_API_KEY in .env', method: 'unavailable' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=qa`;
    const response = await googleApiRequest(url);

    if (response.status === 'OK' && response.results.length > 0) {
      const result = {
        lat: response.results[0].geometry.location.lat,
        lng: response.results[0].geometry.location.lng,
        formattedAddress: response.results[0].formatted_address,
        placeId: response.results[0].place_id,
        types: response.results[0].types,
        method: 'google_geocode',
      };
      setCache(cacheKey, result);
      return result;
    }

    return null;
  } catch (err) {
    console.warn('[Maps] Geocoding failed:', err.message);
    return null;
  }
}

/**
 * Convert lat/lng to a human-readable address.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ address, placeId } | null>}
 */
async function reverseGeocode(lat, lng) {
  const cacheKey = `reverse:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API key is required for reverse geocoding. Set GOOGLE_MAPS_API_KEY in .env', method: 'unavailable' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await googleApiRequest(url);

    if (response.status === 'OK' && response.results.length > 0) {
      const result = {
        address: response.results[0].formatted_address,
        placeId: response.results[0].place_id,
        types: response.results[0].types,
        components: response.results[0].address_components?.map(c => ({
          name: c.long_name,
          types: c.types,
        })),
        method: 'google_reverse_geocode',
      };
      setCache(cacheKey, result);
      return result;
    }

    return null;
  } catch (err) {
    console.warn('[Maps] Reverse geocoding failed:', err.message);
    return null;
  }
}

/**
 * Get only the encoded polyline for map drawing (lighter than full route).
 */
async function getPolyline(origin, destination) {
  const route = await getRoute(origin, destination);
  return {
    polyline: route.polyline,
    distanceKm: route.distanceKm,
    durationMinutes: route.durationMinutes,
    method: route.method,
  };
}

/**
 * Check if Google Maps API is available and working.
 */
async function checkMapsStatus() {
  const hasKey = !!GOOGLE_MAPS_API_KEY;

  if (!hasKey) {
    return {
      available: false,
      method: 'haversine_fallback',
      message: 'Google Maps API key not configured. Using Haversine fallback for all calculations.',
      cacheSize: cache.size,
    };
  }

  // Quick validation ping
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Doha,Qatar&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await googleApiRequest(url);
    return {
      available: response.status === 'OK',
      method: 'google_maps',
      apiStatus: response.status,
      cacheSize: cache.size,
    };
  } catch (err) {
    return {
      available: false,
      method: 'haversine_fallback',
      error: err.message,
      cacheSize: cache.size,
    };
  }
}

/**
 * Clear the route cache.
 */
function clearCache() {
  const size = cache.size;
  cache.clear();
  return { cleared: size };
}

/**
 * Places Autocomplete — for address search bar in the app.
 * Returns up to 5 suggestions biased toward Qatar.
 *
 * @param {string} input — partial address typed by user
 * @returns {Promise<Array<{ description, placeId, mainText, secondaryText }>>}
 */
async function placesAutocomplete(input) {
  const cacheKey = `autocomplete:${input.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API key required for Places Autocomplete.', method: 'unavailable' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:qa&types=geocode|establishment&language=en`;
    const response = await googleApiRequest(url);

    if (response.status === 'OK') {
      const predictions = response.predictions.map(p => ({
        description: p.description,
        placeId: p.place_id,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
        types: p.types,
      }));
      setCache(cacheKey, predictions);
      return predictions;
    }

    return [];
  } catch (err) {
    console.warn('[Maps] Places Autocomplete failed:', err.message);
    return [];
  }
}

/**
 * Get place details by Place ID — returns lat/lng, address, name, phone.
 *
 * @param {string} placeId — Google Place ID
 * @returns {Promise<object|null>}
 */
async function getPlaceDetails(placeId) {
  const cacheKey = `place:${placeId}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API key required for Place Details.', method: 'unavailable' };
  }

  try {
    const fields = 'geometry,formatted_address,name,place_id,types,formatted_phone_number,opening_hours,rating';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await googleApiRequest(url);

    if (response.status === 'OK' && response.result) {
      const r = response.result;
      const result = {
        lat: r.geometry?.location?.lat,
        lng: r.geometry?.location?.lng,
        formattedAddress: r.formatted_address,
        name: r.name,
        placeId: r.place_id,
        types: r.types,
        phone: r.formatted_phone_number || null,
        rating: r.rating || null,
        isOpen: r.opening_hours?.open_now || null,
        method: 'google_place_details',
      };
      setCache(cacheKey, result);
      return result;
    }

    return null;
  } catch (err) {
    console.warn('[Maps] Place Details failed:', err.message);
    return null;
  }
}

/**
 * Get ETA from driver to pickup — used by dispatch engine.
 * Returns minutes and distance in km.
 *
 * @param {{ lat, lng }} driverLocation
 * @param {{ lat, lng }} pickupLocation
 * @returns {Promise<{ etaMinutes, distanceKm, method }>}
 */
async function getDriverETA(driverLocation, pickupLocation) {
  const route = await getRoute(driverLocation, pickupLocation);
  return {
    etaMinutes: route.durationMinutes,
    etaText: route.durationText,
    distanceKm: route.distanceKm,
    distanceText: route.distanceText,
    trafficCondition: route.trafficCondition,
    method: route.method,
  };
}

module.exports = {
  getRoute,
  getDistanceMatrix,
  geocodeAddress,
  reverseGeocode,
  getPolyline,
  checkMapsStatus,
  clearCache,
  placesAutocomplete,
  getPlaceDetails,
  getDriverETA,
  // Expose internals for other engines
  haversineDistanceKm,
  isQatarPeakHour,
  fallbackRoute,
};

