/**
 * Quote Controller — RoadResQ (Enhanced)
 *
 * POST /api/quotes              → submitQuoteHandler()
 * GET  /api/quotes              → getQuotesHandler()
 * GET  /api/quotes/:id          → getQuoteByIdHandler()
 * PUT  /api/quotes/:id/respond  → respondToQuoteHandler()
 * PUT  /api/quotes/:id/accept   → acceptQuoteByCustomerHandler()
 * PUT  /api/quotes/:id/reject   → rejectQuoteByCustomerHandler()
 *
 * Quote flow:
 *   1. Customer submits quote (POST /api/quotes)
 *      → status: 'pending', job created with status: 'quote_pending'
 *   2. Admin responds with price (PUT /api/quotes/:id/respond)
 *      → status: 'quoted', job updated with quotedPrice
 *   3. Customer accepts/rejects (PUT /api/quotes/:id/accept OR /reject)
 *      → 'accepted_by_customer' → triggers auto-assign
 *      → 'rejected'
 */

const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { createJob, getJobById, updateJobStatus } = require('../models/jobModel');
const { autoAssignDriver } = require('../utils/matchingEngine');
const { INDUSTRIAL_TYPES, HEAVY_EQUIPMENT_TYPES } = require('../utils/serviceEngine');

const COLLECTION = 'quote_requests';

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

// ─── POST /api/quotes ─────────────────────────────────────────────────────────

/**
 * Customer submits a quote request.
 *
 * Used for:
 *   - Quote Industrial: Precast, Pallets, Container, Generator
 *   - Heavy Equipment with 'Others' type
 *   - Garage Standard (non-urgent)
 *   - Any 'Others' vehicle type
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
    serviceType,        // 'garage' | 'heavy_equipment' | 'quote_industrial'
    vehicleType,        // e.g. 'Container', 'Heavy Others', 'Garage Standard'
    itemDescription,    // detailed description of what needs transporting/repair
    pickup,
    drop,
    estimatedWeight,    // customer's estimate in kg (optional)
    dimensions,         // { length, width, height } in metres (optional)
    urgency,            // 'low' | 'medium' | 'high'
    preferredDate,      // ISO date string (for non-urgent jobs)
    attachmentUrls,     // Array of photo URLs from storage
    customerNotes,
  } = req.body;

  try {
    const quoteId = uuidv4();

    // Create the quote request document
    const quoteDoc = {
      id: quoteId,
      userId,
      serviceType: serviceType || 'quote_industrial',
      vehicleType: vehicleType || null,
      itemDescription,
      pickup,
      drop,
      estimatedWeight: estimatedWeight || null,
      dimensions: dimensions || null,
      urgency: urgency || 'medium',
      preferredDate: preferredDate || null,
      attachmentUrls: attachmentUrls || [],
      customerNotes: customerNotes || null,

      // Quote state
      status: 'pending',        // pending → quoted → accepted_by_customer | rejected
      quotedPrice: null,
      adminNotes: null,
      respondedAt: null,
      respondedBy: null,

      // Linked job (created when customer accepts the quote)
      linkedJobId: null,

      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).doc(quoteId).set(quoteDoc);

    return success(res, {
      quote: quoteDoc,
      message: 'Quote request submitted. Our team will review and get back to you shortly.',
    }, 201);
  } catch (err) {
    console.error('Submit quote error:', err);
    return error(res, 'Failed to submit quote request.', 500);
  }
};

// ─── GET /api/quotes ──────────────────────────────────────────────────────────

const getQuotesHandler = async (req, res) => {
  const { userId, status } = req.query;
  try {
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
    if (userId) query = query.where('userId', '==', userId);
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
    return success(res, { id: doc.id, ...doc.data() });
  } catch (err) {
    return error(res, 'Failed to fetch quote.', 500);
  }
};

// ─── PUT /api/quotes/:id/respond ─────────────────────────────────────────────

/**
 * Admin responds to a quote with a final price.
 * Body: { quotedPrice, adminNotes, respondedBy }
 */
const respondToQuoteHandler = async (req, res) => {
  const { quotedPrice, adminNotes, respondedBy } = req.body;
  if (!quotedPrice || quotedPrice <= 0) {
    return error(res, 'quotedPrice must be a positive number.');
  }

  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);

    const quote = { id: doc.id, ...doc.data() };
    if (quote.status !== 'pending') {
      return error(res, `Quote already has status '${quote.status}'. Can only respond to pending quotes.`, 409);
    }

    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'quoted',
      quotedPrice: parseFloat(quotedPrice),
      adminNotes: adminNotes || null,
      respondedBy: respondedBy || 'admin',
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return success(res, {
      quoteId: req.params.id,
      status: 'quoted',
      quotedPrice,
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
 * Creates a full job document from the quote and attempts auto-assign.
 */
const acceptQuoteByCustomerHandler = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return error(res, 'Quote not found.', 404);

    const quote = { id: doc.id, ...doc.data() };
    if (quote.status !== 'quoted') {
      return error(res, `Cannot accept. Quote status is '${quote.status}'. Must be 'quoted'.`, 409);
    }

    // Create the actual job from the accepted quote
    const job = await createJob({
      userId: quote.userId,
      serviceType: quote.serviceType,
      vehicleType: quote.vehicleType,
      pickup: quote.pickup,
      drop: quote.drop,
      loadDescription: quote.itemDescription,
      customerNotes: quote.customerNotes,
      requiresQuote: false,
      // Price comes from the admin's quoted price
    });

    // Override price with the admin-quoted price
    await db.collection('jobs').doc(job.id).update({
      price: quote.quotedPrice,
      pricingBreakdown: {
        label: 'Admin Quoted Price',
        baseFare: quote.quotedPrice,
        distanceKm: 0,
        perKm: 0,
        distanceCharge: 0,
        total: quote.quotedPrice,
        note: 'Price set by admin based on custom quote.',
      },
      status: 'pending',
    });

    // Update quote status
    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'accepted_by_customer',
      linkedJobId: job.id,
      updatedAt: new Date().toISOString(),
    });

    // Try auto-assign
    let assignedDriver = null;
    try {
      assignedDriver = await autoAssignDriver(job.id, {
        serviceType: job.serviceType,
        requiredTruckType: job.requiredTruckType,
        minTruckCapacityKg: job.minTruckCapacityKg || 0,
      });
    } catch (matchErr) {
      console.warn('Auto-assign after quote acceptance skipped:', matchErr.message);
    }

    return success(res, {
      quoteId: req.params.id,
      jobId: job.id,
      quotedPrice: quote.quotedPrice,
      assignedDriver: assignedDriver ? { id: assignedDriver.id, name: assignedDriver.name } : null,
      message: 'Quote accepted. Your job has been created.',
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
      message: 'Quote rejected.',
    });
  } catch (err) {
    console.error('Reject quote error:', err);
    return error(res, 'Failed to reject quote.', 500);
  }
};

module.exports = {
  submitQuoteHandler,
  getQuotesHandler,
  getQuoteByIdHandler,
  respondToQuoteHandler,
  acceptQuoteByCustomerHandler,
  rejectQuoteByCustomerHandler,
};
