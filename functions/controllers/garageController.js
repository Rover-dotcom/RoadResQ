/**
 * On-Site Repair Controller — RoadResQ (Week 4)
 *
 * NEW request type: "onsite_repair"
 *
 * Flow:
 *   1. Customer creates on-site repair request
 *      POST /api/garage-requests
 *      { type: "onsite_repair", issue, location: { lat, lng } }
 *
 *   2. System broadcasts to all garages within 10km
 *      → stored in collection: garage_live_requests
 *
 *   3. Garage submits estimate
 *      POST /api/garage-requests/:id/estimate
 *      { price: 12000, eta: 25 }  // 12000 halala = QR 120.00
 *
 *   4. User views estimates
 *      GET /api/garage-requests/:id/estimates
 *
 *   5. User accepts an estimate (FIRST ACCEPT WINS per garage)
 *      PUT /api/garage-requests/:id/accept
 *      { estimateId }
 *
 *   6. After accept → status = "mechanic_assigned"
 *      Garage gets user name, phone, location, issue
 *
 * STATUS FLOW:
 *   pending → collecting_estimates → accepted → on_the_way
 *           → in_progress → completed
 *
 * AUTO-CANCEL:
 *   If no garage accepts within 15 minutes → status = "cancelled"
 *   (set via a scheduled check endpoint or client-triggered)
 *
 * GARAGE SAFETY CHECKLIST (pre-job):
 *   - Area is safe
 *   - Vehicle secured
 *   - Proper tools used
 *   - Hazard lights ON
 */

const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { findDriversWithinRadius, calculateETA, haversineDistanceKm } = require('../utils/matchingEngine');

const COLLECTION = 'garage_requests';
const GARAGES_COLLECTION = 'garages';
const AUTO_CANCEL_MINUTES = 15;

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

// ─── POST /api/garage-requests ────────────────────────────────────────────────

/**
 * Customer creates a new on-site repair request.
 * Auto-broadcasts to all garages within 10km.
 *
 * Required: userId, issue, location: { lat, lng }
 * Optional: additionalNotes, photoUrls, customIssue (if "Others")
 */
const createGarageRequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 400, {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const {
    userId,
    issue,
    customIssue,      // when issue = "Others", user types what it is
    customDetails,    // multiline description
    location,        // { lat, lng }
    additionalNotes,
    photoUrls,
    contactInfo,     // { name, phone } — auto-filled from app usually
  } = req.body;

  try {
    const requestId = uuidv4();
    const autoCancelAt = new Date(Date.now() + AUTO_CANCEL_MINUTES * 60 * 1000).toISOString();

    const garageRequest = {
      id: requestId,
      type: 'onsite_repair',
      userId,

      // Issue details
      issue: issue || 'Others',
      customIssue: customIssue || null,
      customDetails: customDetails || null,
      additionalNotes: additionalNotes || null,
      photoUrls: photoUrls || [],

      // Location
      location,                          // { lat, lng }

      // Contact (sent to garage after accept)
      contactInfo: contactInfo || null,

      // Status flow
      status: 'pending',
      // pending → collecting_estimates → accepted → on_the_way → in_progress → completed

      // Estimates
      estimates: [],
      acceptedEstimateId: null,
      assignedGarageId: null,

      // Auto-cancel
      autoCancelAt,

      // Safety
      garageSafetyChecklist: null,

      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acceptedAt: null,
      completedAt: null,
    };

    await db.collection(COLLECTION).doc(requestId).set(garageRequest);

    // Broadcast to garages within 10km
    const nearbyGarages = await findGaragesWithinRadius(location, 10);
    const broadcastCount = nearbyGarages.length;

    // Write to garage_live_requests so each garage's app can listen
    const broadcastPromises = nearbyGarages.map((garage) =>
      db.collection('garage_live_requests').add({
        requestId,
        garageId: garage.id,
        broadcastAt: new Date().toISOString(),
        issue: garageRequest.issue,
        customIssue: garageRequest.customIssue,
        location,
        status: 'sent',
      })
    );
    await Promise.all(broadcastPromises);

    // Update status to collecting_estimates if garages were found
    if (broadcastCount > 0) {
      await db.collection(COLLECTION).doc(requestId).update({
        status: 'collecting_estimates',
        broadcastCount,
        broadcastAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      garageRequest.status = 'collecting_estimates';
    }

    return success(res, {
      request: garageRequest,
      broadcastCount,
      message: broadcastCount > 0
        ? `Request sent to ${broadcastCount} nearby garage(s). Waiting for estimates.`
        : 'No garages found nearby. Try again or expand search radius.',
      autoCancelAt,
    }, 201);
  } catch (err) {
    console.error('Create garage request error:', err);
    return error(res, 'Failed to create garage request.', 500);
  }
};

// ─── POST /api/garage-requests/:id/estimate ───────────────────────────────────

/**
 * Garage submits a price estimate for the request.
 * Body: { garageId, garageName, price, eta, rating }
 * price is in halala (integer): 12000 = QR 120.00
 */
const submitEstimateHandler = async (req, res) => {
  const { garageId, garageName, price, eta, rating } = req.body;

  if (!garageId) return error(res, 'garageId is required.');
  if (!price || price <= 0) return error(res, 'price must be a positive integer (halala).');
  if (!eta || eta <= 0) return error(res, 'eta (minutes) must be a positive number.');

  try {
    const requestRef = db.collection(COLLECTION).doc(req.params.id);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return error(res, 'Garage request not found.', 404);

    const garageRequest = requestDoc.data();

    if (!['pending', 'collecting_estimates'].includes(garageRequest.status)) {
      return error(res, `Cannot submit estimate. Request status is '${garageRequest.status}'.`, 409);
    }

    const estimateId = uuidv4();
    const estimate = {
      id: estimateId,
      garageId,
      garageName: garageName || 'Unknown Garage',
      price: parseInt(price),                          // halala integer
      priceDisplay: `QR ${(parseInt(price) / 100).toFixed(2)}`,
      eta: parseInt(eta),                              // minutes
      rating: parseFloat(rating) || 0,
      submittedAt: new Date().toISOString(),
    };

    // Append estimate to array
    await requestRef.update({
      estimates: [...(garageRequest.estimates || []), estimate],
      updatedAt: new Date().toISOString(),
    });

    return success(res, {
      estimateId,
      requestId: req.params.id,
      estimate,
      message: 'Estimate submitted successfully.',
    });
  } catch (err) {
    console.error('Submit estimate error:', err);
    return error(res, 'Failed to submit estimate.', 500);
  }
};

// ─── GET /api/garage-requests/:id/estimates ───────────────────────────────────

/**
 * User views all estimates for their request.
 * Sorted by price ASC (cheapest first), with rating as tiebreaker.
 */
const getEstimatesHandler = async (req, res) => {
  try {
    const requestDoc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!requestDoc.exists) return error(res, 'Garage request not found.', 404);

    const garageRequest = requestDoc.data();
    const estimates = (garageRequest.estimates || []).sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price; // cheapest first
      return (b.rating || 0) - (a.rating || 0);          // higher rating first
    });

    // Flag best price and fastest arrival
    if (estimates.length > 0) {
      const lowestPrice = Math.min(...estimates.map((e) => e.price));
      const lowestETA = Math.min(...estimates.map((e) => e.eta));

      estimates.forEach((e) => {
        e.isBestPrice = e.price === lowestPrice;
        e.isFastestArrival = e.eta === lowestETA;
      });
    }

    return success(res, {
      requestId: req.params.id,
      status: garageRequest.status,
      estimates,
      count: estimates.length,
      autoCancelAt: garageRequest.autoCancelAt,
    });
  } catch (err) {
    console.error('Get estimates error:', err);
    return error(res, 'Failed to fetch estimates.', 500);
  }
};

// ─── PUT /api/garage-requests/:id/accept ─────────────────────────────────────

/**
 * User accepts a garage estimate.
 * FIRST ACCEPT WINS — prevents multiple garages from taking the same job.
 *
 * Body: { estimateId }
 */
const acceptEstimateHandler = async (req, res) => {
  const { estimateId } = req.body;
  if (!estimateId) return error(res, 'estimateId is required.');

  try {
    const requestRef = db.collection(COLLECTION).doc(req.params.id);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return error(res, 'Garage request not found.', 404);

    const garageRequest = requestDoc.data();

    // FIRST ACCEPT WINS — prevent race condition
    if (garageRequest.status === 'accepted' || garageRequest.acceptedEstimateId) {
      return error(res, 'This request has already been accepted by another garage.', 409);
    }

    // Find the estimate
    const estimate = (garageRequest.estimates || []).find((e) => e.id === estimateId);
    if (!estimate) return error(res, 'Estimate not found.', 404);

    // Accept: assign garage, update status
    await requestRef.update({
      status: 'accepted',
      acceptedEstimateId: estimateId,
      assignedGarageId: estimate.garageId,
      assignedGarageName: estimate.garageName,
      acceptedPrice: estimate.price,
      acceptedPriceDisplay: estimate.priceDisplay,
      acceptedETA: estimate.eta,
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Send user details to garage
      userDetailsForGarage: garageRequest.contactInfo || null,
    });

    return success(res, {
      requestId: req.params.id,
      status: 'accepted',
      assignedGarage: {
        id: estimate.garageId,
        name: estimate.garageName,
        price: estimate.price,
        priceDisplay: estimate.priceDisplay,
        eta: estimate.eta,
      },
      message: `Mechanic from ${estimate.garageName} is on the way. ETA: ${estimate.eta} minutes.`,
    });
  } catch (err) {
    console.error('Accept estimate error:', err);
    return error(res, 'Failed to accept estimate.', 500);
  }
};

// ─── PUT /api/garage-requests/:id/status ─────────────────────────────────────

/**
 * Update the status of a garage request.
 * Valid transitions:
 *   accepted → on_the_way → in_progress → completed
 *   Any → cancelled
 */
const updateGarageRequestStatusHandler = async (req, res) => {
  const { status, garageSafetyChecklist } = req.body;

  const VALID_STATUSES = [
    'pending', 'collecting_estimates', 'accepted',
    'on_the_way', 'in_progress', 'completed', 'cancelled',
  ];

  if (!status || !VALID_STATUSES.includes(status)) {
    return error(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const requestRef = db.collection(COLLECTION).doc(req.params.id);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return error(res, 'Garage request not found.', 404);

    const updates = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'in_progress' && garageSafetyChecklist) {
      updates.garageSafetyChecklist = garageSafetyChecklist;
    }
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    if (status === 'cancelled') {
      updates.cancelledAt = new Date().toISOString();
    }

    await requestRef.update(updates);
    return success(res, { requestId: req.params.id, status });
  } catch (err) {
    console.error('Update garage request status error:', err);
    return error(res, 'Failed to update status.', 500);
  }
};

// ─── GET /api/garage-requests ─────────────────────────────────────────────────

const getGarageRequestsHandler = async (req, res) => {
  const { userId, garageId, status } = req.query;
  try {
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
    if (userId) query = query.where('userId', '==', userId);
    if (garageId) query = query.where('assignedGarageId', '==', garageId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(res, { requests, count: requests.length });
  } catch (err) {
    console.error('Get garage requests error:', err);
    return error(res, 'Failed to fetch garage requests.', 500);
  }
};

// ─── GET /api/garage-requests/:id ─────────────────────────────────────────────

const getGarageRequestByIdHandler = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Garage request not found.', 404);
    return success(res, { id: doc.id, ...doc.data() });
  } catch (err) {
    return error(res, 'Failed to fetch garage request.', 500);
  }
};

// ─── POST /api/garage-requests/:id/auto-cancel-check ─────────────────────────

/**
 * Check if a request should be auto-cancelled (no garage accepted in time).
 * Called by client or a scheduled function.
 */
const autoCancelCheckHandler = async (req, res) => {
  try {
    const requestRef = db.collection(COLLECTION).doc(req.params.id);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return error(res, 'Garage request not found.', 404);

    const garageRequest = requestDoc.data();

    if (['accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled'].includes(garageRequest.status)) {
      return success(res, { requestId: req.params.id, status: garageRequest.status, cancelTriggered: false });
    }

    const now = new Date();
    const autoCancelAt = new Date(garageRequest.autoCancelAt);

    if (now > autoCancelAt) {
      await requestRef.update({
        status: 'cancelled',
        cancelledAt: now.toISOString(),
        cancellationReason: 'No garage accepted within the time limit.',
        updatedAt: now.toISOString(),
      });
      return success(res, {
        requestId: req.params.id,
        status: 'cancelled',
        cancelTriggered: true,
        reason: 'No garage accepted within the time limit.',
      });
    }

    const minutesLeft = Math.ceil((autoCancelAt - now) / 60000);
    return success(res, {
      requestId: req.params.id,
      status: garageRequest.status,
      cancelTriggered: false,
      minutesUntilAutoCancel: minutesLeft,
    });
  } catch (err) {
    console.error('Auto-cancel check error:', err);
    return error(res, 'Failed to check auto-cancel.', 500);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find garages within a radius.
 * Falls back to finding drivers with service_van truck type.
 */
async function findGaragesWithinRadius(location, radiusKm = 10) {
  const snapshot = await db
    .collection(GARAGES_COLLECTION)
    .where('isActive', '==', true)
    .get();

  if (snapshot.empty) {
    // Fallback: use drivers with service_van
    return findDriversWithinRadius(location, radiusKm, {
      requiredTruckType: 'service_van',
      serviceType: 'garage',
    });
  }

  const garages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (!location || !location.lat || !location.lng) return garages;

  return garages.filter((garage) => {
    if (!garage.location?.lat) return true; // include if no location
    const dist = haversineDistanceKm(
      location.lat, location.lng,
      garage.location.lat, garage.location.lng,
    );
    return dist <= radiusKm;
  });
}

module.exports = {
  createGarageRequestHandler,
  submitEstimateHandler,
  getEstimatesHandler,
  acceptEstimateHandler,
  updateGarageRequestStatusHandler,
  getGarageRequestsHandler,
  getGarageRequestByIdHandler,
  autoCancelCheckHandler,
};
