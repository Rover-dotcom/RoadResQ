/**
 * Quote Controller — RoadResQ (v3.1.0)
 *
 * Quote flow (GARAGE-DRIVEN — Admin is read-only):
 *
 *   1. Customer submits quote request
 *      POST /api/quotes
 *      → status: 'pending'
 *      → broadcast to nearby garages (garageId list)
 *
 *   2. Garage responds with price (NOT admin)
 *      PUT /api/quotes/:id/respond
 *      Body: { garageId, garageName, quotedPrice, garageNotes }
 *      → status: 'quoted'
 *
 *   3. Customer accepts or rejects
 *      PUT /api/quotes/:id/accept   → triggers auto-assign, creates linked job
 *      PUT /api/quotes/:id/reject
 *
 *   Admin role: READ ONLY — GET /api/quotes for reports. No write access.
 *
 * Endpoints:
 *   POST /api/quotes                → submitQuoteHandler()
 *   GET  /api/quotes                → getQuotesHandler()   (admin read-only)
 *   GET  /api/quotes/:id            → getQuoteByIdHandler()
 *   GET  /api/quotes/my-quotes      → getMyQuotesHandler() (customer)
 *   PUT  /api/quotes/:id/respond    → respondToQuoteHandler()  ← GARAGE ONLY
 *   PUT  /api/quotes/:id/accept     → acceptQuoteByCustomerHandler()
 *   PUT  /api/quotes/:id/reject     → rejectQuoteByCustomerHandler()
 */

const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { createJob, getJobById, updateJobStatus } = require('../models/jobModel');
const { autoAssignDriver } = require('../utils/matchingEngine');
const { deriveJobConstraints, INDUSTRIAL_TYPES, HEAVY_EQUIPMENT_TYPES } = require('../utils/serviceEngine');
const { haversineDistanceKm } = require('../utils/matchingEngine');

const COLLECTION = 'quote_requests';
const GARAGES_COLLECTION = 'garages';
const BROADCAST_RADIUS_KM = 15;

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

// ─── POST /api/quotes ─────────────────────────────────────────────────────────

/**
 * Customer submits a quote request.
 * Broadcasts to nearby garages automatically.
 *
 * Used for:
 *   - Quote Industrial: Precast, Pallets, Container, Generator, Others
 *   - Heavy Equipment: JCB, Excavator, Telehandler with quote_required
 *   - Garage Standard (non-urgent, goes to garage for estimate)
 *
 * Required: userId, serviceType, itemDescription, pickup, drop
 */
const submitQuoteHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 400, {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const {
    userId,
    serviceType,         // 'garage' | 'heavy_equipment' | 'quote_industrial'
    vehicleType,         // e.g. 'Container', 'Excavator', 'Garage Standard'
    itemDescription,
    pickup,
    drop,
    pickupCoords,        // { lat, lng } — used to broadcast to nearby garages
    estimatedWeight,
    dimensions,
    urgency,
    preferredDate,       // 'YYYY-MM-DD' — customer's preferred pickup/service date
    preferredTime,       // 'HH:MM' 24h — customer's preferred time (Qatar)
    attachmentUrls,
    customerNotes,
  } = req.body;

  try {
    const quoteId = uuidv4();

    // Auto-derive what's needed for this vehicle type
    const constraints = vehicleType ? deriveJobConstraints(vehicleType) : {};

    // Find nearby garages to broadcast to
    let broadcastGarages = [];
    if (pickupCoords && pickupCoords.lat) {
      broadcastGarages = await findNearbyGarages(pickupCoords, BROADCAST_RADIUS_KM);
    }

    const quoteDoc = {
      id: quoteId,
      userId,
      serviceType: serviceType || 'quote_industrial',
      vehicleType: vehicleType || null,
      vehicleLabel: constraints.vehicleLabel || vehicleType || null,
      itemDescription,
      pickup,
      drop,
      pickupCoords: pickupCoords || null,
      estimatedWeight: estimatedWeight || null,
      dimensions: dimensions || null,
      urgency: urgency || 'medium',
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      attachmentUrls: attachmentUrls || [],
      customerNotes: customerNotes || null,

      // Derived constraints (for garage to understand what equipment is needed)
      requiredTruckType: constraints.requiredTruckType || null,
      requiredEquipmentTypes: constraints.requiredEquipmentTypes || [],
      isSpecialLoad: constraints.isSpecialLoad || false,

      // Quote state
      status: 'pending',         // pending → quoted → accepted_by_customer | rejected
      quotedPrice: null,
      quotedPriceDisplay: null,
      garageNotes: null,
      respondedAt: null,
      respondedBy: null,         // garageId (not admin)
      respondedByName: null,     // garage name (shown to customer)

      // Broadcast info (which garages received this)
      broadcastGarageIds: broadcastGarages.map((g) => g.id),
      broadcastCount: broadcastGarages.length,
      broadcastAt: broadcastGarages.length > 0 ? new Date().toISOString() : null,

      // Linked job (created when customer accepts)
      linkedJobId: null,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).doc(quoteId).set(quoteDoc);

    // Write to garage_live_quotes so each garage's app can listen
    if (broadcastGarages.length > 0) {
      const broadcastPromises = broadcastGarages.map((garage) =>
        db.collection('garage_live_quotes').add({
          quoteId,
          garageId: garage.id,
          broadcastAt: new Date().toISOString(),
          serviceType: quoteDoc.serviceType,
          vehicleType: quoteDoc.vehicleType,
          vehicleLabel: quoteDoc.vehicleLabel,
          itemDescription,
          pickupCoords: pickupCoords || null,
          requiredEquipmentTypes: constraints.requiredEquipmentTypes || [],
          status: 'sent',
        })
      );
      await Promise.all(broadcastPromises);
    }

    return success(res, {
      quote: quoteDoc,
      broadcastCount: broadcastGarages.length,
      message: broadcastGarages.length > 0
        ? `Quote request sent to ${broadcastGarages.length} nearby garage(s). They will respond with a price shortly.`
        : 'Quote request submitted. A garage will review your request and respond with a price.',
      nextSteps: 'Monitor your quote in the Quotes section. You will be notified when a garage responds.',
    }, 201);
  } catch (err) {
    console.error('Submit quote error:', err);
    return error(res, 'Failed to submit quote request.', 500);
  }
};

// ─── GET /api/quotes/my-quotes ────────────────────────────────────────────────

/**
 * Customer views their own quotes with status messages.
 * Query: ?userId=xxx&status=pending
 */
const getMyQuotesHandler = async (req, res) => {
  const { userId, status } = req.query;
  if (!userId) return error(res, 'userId is required.');

  try {
    let query = db.collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const quotes = snapshot.docs.map((doc) => {
      const q = { id: doc.id, ...doc.data() };
      return {
        ...q,
        statusMessage: buildQuoteStatusMessage(q),
        quotedPriceDisplay: q.quotedPrice ? `QR ${(q.quotedPrice / 100).toFixed(2)}` : null,
      };
    });

    return success(res, { quotes, count: quotes.length });
  } catch (err) {
    console.error('Get my quotes error:', err);
    return error(res, 'Failed to fetch your quotes.', 500);
  }
};

// ─── GET /api/quotes ──────────────────────────────────────────────────────────

/** Admin read-only: all quotes for reporting. */
const getQuotesHandler = async (req, res) => {
  const { userId, garageId, status } = req.query;
  try {
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
    if (userId) query = query.where('userId', '==', userId);
    if (garageId) query = query.where('respondedBy', '==', garageId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const quotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(res, { quotes, count: quotes.length });
  } catch (err) {
    console.error('Get quotes error:', err);
    return error(res, 'Failed to fetch quotes.', 500);
  }
};

// ─── GET /api/quotes/:id ──────────────────────────────────────────────────────

const getQuoteByIdHandler = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);
    const q = { id: doc.id, ...doc.data() };
    return success(res, {
      ...q,
      statusMessage: buildQuoteStatusMessage(q),
      quotedPriceDisplay: q.quotedPrice ? `QR ${(q.quotedPrice / 100).toFixed(2)}` : null,
    });
  } catch (err) {
    return error(res, 'Failed to fetch quote.', 500);
  }
};

// ─── PUT /api/quotes/:id/respond ─────────────────────────────────────────────

/**
 * GARAGE responds to a quote with a price.
 * Admin does NOT respond — only garages do.
 *
 * Body: { garageId, garageName, quotedPrice (halala integer), garageNotes }
 *
 * quotedPrice is in halala (integer): 15000 = QR 150.00
 */
const respondToQuoteHandler = async (req, res) => {
  const { garageId, garageName, quotedPrice, garageNotes } = req.body;

  if (!garageId) return error(res, 'garageId is required. Only garages can respond to quotes.');
  if (!quotedPrice || quotedPrice <= 0) {
    return error(res, 'quotedPrice must be a positive integer (halala). Example: 15000 = QR 150.00');
  }

  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);

    const quote = { id: doc.id, ...doc.data() };
    if (quote.status !== 'pending') {
      return error(res, `Quote already has status '${quote.status}'. Can only respond to pending quotes.`, 409);
    }

    const priceInt = parseInt(quotedPrice);

    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'quoted',
      quotedPrice: priceInt,
      quotedPriceDisplay: `QR ${(priceInt / 100).toFixed(2)}`,
      garageNotes: garageNotes || null,
      respondedBy: garageId,
      respondedByName: garageName || null,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return success(res, {
      quoteId: req.params.id,
      status: 'quoted',
      quotedPrice: priceInt,
      quotedPriceDisplay: `QR ${(priceInt / 100).toFixed(2)}`,
      respondedBy: garageId,
      respondedByName: garageName,
      message: 'Quote response sent to customer.',
    });
  } catch (err) {
    console.error('Respond to quote error:', err);
    return error(res, 'Failed to respond to quote.', 500);
  }
};

// ─── PUT /api/quotes/:id/accept ───────────────────────────────────────────────

/**
 * Customer accepts the quoted price.
 * Creates a full job and auto-assigns a driver.
 * All constraints are derived from vehicleType automatically.
 */
const acceptQuoteByCustomerHandler = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);

    const quote = { id: doc.id, ...doc.data() };
    if (quote.status !== 'quoted') {
      return error(res, `Cannot accept. Quote status is '${quote.status}'. Must be 'quoted' first.`, 409);
    }

    // Create job from accepted quote
    const job = await createJob({
      userId: quote.userId,
      serviceType: quote.serviceType,
      vehicleType: quote.vehicleType,
      pickup: quote.pickup,
      drop: quote.drop,
      pickupCoords: quote.pickupCoords || null,
      loadDescription: quote.itemDescription,
      customerNotes: quote.customerNotes,
      requiresQuote: false,
    });

    // Override price with garage-quoted price
    await db.collection('jobs').doc(job.id).update({
      price: quote.quotedPrice,
      pricingBreakdown: {
        label: 'Garage Quoted Price',
        baseFare: quote.quotedPrice,
        distanceKm: 0,
        perKm: 0,
        distanceCharge: 0,
        total: quote.quotedPrice,
        quotedPriceDisplay: quote.quotedPriceDisplay,
        respondedBy: quote.respondedBy,
        respondedByName: quote.respondedByName,
        note: `Price quoted by ${quote.respondedByName || 'garage'}.`,
      },
      status: 'pending',
    });

    // Update quote
    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'accepted_by_customer',
      linkedJobId: job.id,
      updatedAt: new Date().toISOString(),
    });

    // Auto-assign using intelligent matching (derived from vehicleType)
    let assignedDriver = null;
    try {
      const matchConstraints = deriveJobConstraints(job.vehicleType, {
        pickupCoords: job.pickupCoords,
      });
      assignedDriver = await autoAssignDriver(job.id, matchConstraints);
    } catch (matchErr) {
      console.warn('Auto-assign after quote acceptance skipped:', matchErr.message);
    }

    return success(res, {
      quoteId: req.params.id,
      jobId: job.id,
      quotedPrice: quote.quotedPrice,
      quotedPriceDisplay: quote.quotedPriceDisplay,
      assignedDriver: assignedDriver
        ? {
            id: assignedDriver.id,
            name: assignedDriver.name,
            truckType: assignedDriver.truckType,
            equipmentTypes: assignedDriver.equipmentTypes || [],
            estimatedETA: assignedDriver._eta || null,
          }
        : null,
      dispatchStatus: assignedDriver
        ? { dispatched: true, message: 'A driver has been assigned to your job.' }
        : {
            dispatched: false,
            message: 'Job created. We are looking for an available driver. You will be notified shortly.',
          },
      message: 'Quote accepted. Your job has been created and queued for dispatch.',
    });
  } catch (err) {
    console.error('Accept quote error:', err);
    return error(res, 'Failed to accept quote.', 500);
  }
};

// ─── PUT /api/quotes/:id/reject ───────────────────────────────────────────────

const rejectQuoteByCustomerHandler = async (req, res) => {
  const { reason } = req.body;
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);

    const quote = doc.data();
    if (!['quoted', 'pending'].includes(quote.status)) {
      return error(res, `Cannot reject. Quote status is '${quote.status}'.`, 409);
    }

    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'rejected',
      rejectionReason: reason || null,
      updatedAt: new Date().toISOString(),
    });

    return success(res, {
      quoteId: req.params.id,
      status: 'rejected',
      message: 'Quote rejected. You can submit a new quote request anytime.',
    });
  } catch (err) {
    console.error('Reject quote error:', err);
    return error(res, 'Failed to reject quote.', 500);
  }
};

// ─── POST /api/quotes/:id/bid ─────────────────────────────────────────────────

/**
 * Driver/Garage submits a BID on an industrial/heavy quote.
 * Multiple bids allowed — customer compares and picks the best.
 *
 * Used for:
 *   - Quote Industrial (Precast, Container, Generator, Others)
 *   - Heavy Equipment jobs with quote_required
 *
 * Body: { driverId OR garageId, bidderName, price, etaMinutes, equipment, notes }
 *
 * Stored in subcollection: quote_requests/{quoteId}/bids
 */
const submitQuoteBidHandler = async (req, res) => {
  const { id: quoteId } = req.params;
  const {
    driverId,
    garageId,
    bidderName,
    price,         // integer halala — e.g. 120000 = QR 1200.00
    etaMinutes,
    equipment,     // e.g. ['boom_truck', 'flatbed']
    notes,
    rating,        // bidder's rating (denormalized for display)
    vehicleModel,
  } = req.body;

  if (!price || price <= 0) return error(res, 'price is required and must be greater than 0.', 400);
  if (!etaMinutes) return error(res, 'etaMinutes is required.', 400);
  if (!driverId && !garageId) return error(res, 'driverId or garageId is required.', 400);

  try {
    const quoteSnap = await db.collection(COLLECTION).doc(quoteId).get();
    if (!quoteSnap.exists) return error(res, 'Quote not found.', 404);

    const quote = quoteSnap.data();
    if (!['pending', 'collecting_bids'].includes(quote.status)) {
      return error(res, `Cannot bid on a quote with status '${quote.status}'.`, 409);
    }

    const bidderId = driverId || garageId;
    const bidId = `${bidderId}_${Date.now()}`;

    const bid = {
      id: bidId,
      quoteId,
      driverId: driverId || null,
      garageId: garageId || null,
      bidderId,
      bidderName: bidderName || 'Unknown',
      bidderType: driverId ? 'driver' : 'garage',
      price,
      priceDisplay: `QR ${(price / 100).toFixed(2)}`,
      etaMinutes,
      equipment: equipment || [],
      notes: notes || null,
      rating: rating || null,
      vehicleModel: vehicleModel || null,
      status: 'pending',             // pending → accepted | rejected
      submittedAt: new Date().toISOString(),
    };

    // Write to bids subcollection
    await db.collection(COLLECTION).doc(quoteId)
      .collection('bids').doc(bidId).set(bid);

    // Update quote status to show it has bids
    await db.collection(COLLECTION).doc(quoteId).update({
      status: 'collecting_bids',
      updatedAt: new Date().toISOString(),
    });

    return success(res, {
      bid,
      message: `Bid of ${bid.priceDisplay} submitted. Customer will review your bid.`,
    }, 201);
  } catch (err) {
    console.error('Submit bid error:', err);
    return error(res, 'Failed to submit bid.', 500);
  }
};

// ─── GET /api/quotes/:id/bids ─────────────────────────────────────────────────

/**
 * Customer views all bids on their quote.
 * Sorted by: price ASC, then ETA ASC (best value first).
 * Highlights: lowest price and fastest arrival.
 *
 * Card fields: bidderName | price | ETA | rating | equipment
 */
const getQuoteBidsHandler = async (req, res) => {
  const { id: quoteId } = req.params;

  try {
    const quoteSnap = await db.collection(COLLECTION).doc(quoteId).get();
    if (!quoteSnap.exists) return error(res, 'Quote not found.', 404);

    const bidsSnap = await db.collection(COLLECTION).doc(quoteId)
      .collection('bids')
      .where('status', '==', 'pending')
      .get();

    const bids = bidsSnap.docs.map((doc) => doc.data());

    // Sort: price ASC
    bids.sort((a, b) => a.price - b.price);

    // Highlight best bids
    const lowestPrice = bids.length > 0 ? bids[0].price : null;
    const fastestEta = bids.length > 0 ? Math.min(...bids.map((b) => b.etaMinutes)) : null;

    const enriched = bids.map((bid) => ({
      ...bid,
      isBestPrice: bid.price === lowestPrice,
      isFastestArrival: bid.etaMinutes === fastestEta,
    }));

    return success(res, {
      quoteId,
      bidCount: enriched.length,
      bids: enriched,
      lowestPriceDisplay: lowestPrice ? `QR ${(lowestPrice / 100).toFixed(2)}` : null,
      fastestEtaMinutes: fastestEta,
      message: enriched.length > 0
        ? `${enriched.length} bid(s) available. Compare and accept the best offer.`
        : 'No bids yet. Waiting for drivers/garages to submit their offers.',
    });
  } catch (err) {
    console.error('Get bids error:', err);
    return error(res, 'Failed to fetch bids.', 500);
  }
};

// ─── PUT /api/quotes/:id/bids/:bidId/accept ───────────────────────────────────

/**
 * Customer accepts a specific bid.
 * Rejects all other bids on this quote automatically.
 * Creates a linked job with the winning driver/garage.
 */
const acceptQuoteBidHandler = async (req, res) => {
  const { id: quoteId, bidId } = req.params;

  try {
    const quoteSnap = await db.collection(COLLECTION).doc(quoteId).get();
    if (!quoteSnap.exists) return error(res, 'Quote not found.', 404);
    const quote = quoteSnap.data();

    if (quote.status === 'accepted_by_customer') {
      return error(res, 'A bid has already been accepted for this quote.', 409);
    }

    const bidSnap = await db.collection(COLLECTION).doc(quoteId)
      .collection('bids').doc(bidId).get();
    if (!bidSnap.exists) return error(res, 'Bid not found.', 404);
    const bid = bidSnap.data();

    const now = new Date().toISOString();

    // Accept the winning bid
    await db.collection(COLLECTION).doc(quoteId)
      .collection('bids').doc(bidId).update({ status: 'accepted', acceptedAt: now });

    // Reject all other bids
    const allBids = await db.collection(COLLECTION).doc(quoteId)
      .collection('bids').where('status', '==', 'pending').get();
    const rejectPromises = allBids.docs
      .filter((d) => d.id !== bidId)
      .map((d) => d.ref.update({ status: 'rejected', rejectedAt: now }));
    await Promise.all(rejectPromises);

    // Create linked job
    const { createJob } = require('../models/jobModel');
    const { deriveJobConstraints } = require('../utils/serviceEngine');
    const constraints = quote.vehicleType ? deriveJobConstraints(quote.vehicleType) : {};

    const jobData = {
      userId: quote.userId,
      serviceType: quote.serviceType || 'quote_industrial',
      vehicleType: quote.vehicleType || null,
      pickup: quote.pickup,
      drop: quote.drop,
      pickupCoords: quote.pickupCoords || null,
      status: 'pending',
      price: bid.price,
      priceDisplay: bid.priceDisplay,
      quotedPrice: bid.price,
      estimatedETA: { etaMinutes: bid.etaMinutes },
      linkedQuoteId: quoteId,
      linkedBidId: bidId,
      assignedGarageId: bid.garageId || null,
      driverId: bid.driverId || null,
      itemDescription: quote.itemDescription || null,
      customItem: quote.customItem || null,
      dimensions: quote.dimensions || null,
      estimatedWeight: quote.estimatedWeight || null,
      requiredEquipmentTypes: constraints.requiredEquipmentTypes || [],
      isSpecialLoad: constraints.isSpecialLoad || false,
      source: 'bid_accepted',
    };

    const linkedJob = await createJob(jobData);

    // Update quote
    await db.collection(COLLECTION).doc(quoteId).update({
      status: 'accepted_by_customer',
      acceptedBidId: bidId,
      acceptedBidderId: bid.bidderId,
      acceptedBidderName: bid.bidderName,
      acceptedPrice: bid.price,
      acceptedPriceDisplay: bid.priceDisplay,
      linkedJobId: linkedJob.id,
      updatedAt: now,
    });

    return success(res, {
      quoteId,
      acceptedBid: bid,
      linkedJobId: linkedJob.id,
      message: `Bid from ${bid.bidderName} accepted. Job created and driver will be dispatched.`,
    });
  } catch (err) {
    console.error('Accept bid error:', err);
    return error(res, 'Failed to accept bid.', 500);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuoteStatusMessage(quote) {
  switch (quote.status) {
    case 'pending':
      return quote.broadcastCount > 0
        ? `Waiting for a garage to respond. Your request was sent to ${quote.broadcastCount} nearby garage(s).`
        : 'Your quote request is pending. A garage will review it shortly.';
    case 'collecting_bids':
      return 'Bids are being collected. Review available bids and accept the best offer.';
    case 'quoted':
      return `A garage (${quote.respondedByName || 'unknown'}) has sent you a price of ${quote.quotedPriceDisplay}. Please accept or reject.`;
    case 'accepted_by_customer':
      return 'You accepted the quote. Your job has been created and is being dispatched.';
    case 'rejected':
      return `Quote rejected${quote.rejectionReason ? `: ${quote.rejectionReason}` : '.'}`;
    default:
      return `Quote status: ${quote.status}`;
  }
}

async function findNearbyGarages(coords, radiusKm = 15) {
  try {
    const snapshot = await db.collection(GARAGES_COLLECTION)
      .where('isActive', '==', true)
      .get();

    if (snapshot.empty) return [];

    const garages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (!coords || !coords.lat) return garages;

    return garages.filter((garage) => {
      if (!garage.location?.lat) return true;
      const dist = haversineDistanceKm(
        coords.lat, coords.lng,
        garage.location.lat, garage.location.lng,
      );
      return dist <= radiusKm;
    });
  } catch (err) {
    console.warn('findNearbyGarages error:', err.message);
    return [];
  }
}

module.exports = {
  submitQuoteHandler,
  getQuotesHandler,
  getMyQuotesHandler,
  getQuoteByIdHandler,
  respondToQuoteHandler,
  acceptQuoteByCustomerHandler,
  rejectQuoteByCustomerHandler,
  // Bidding system
  submitQuoteBidHandler,
  getQuoteBidsHandler,
  acceptQuoteBidHandler,
};
