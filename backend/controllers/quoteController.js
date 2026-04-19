/**
 * Quote Controller — Week 3 Task 9
 *
 * POST /api/quotes          → submitQuoteHandler()
 * GET  /api/quotes          → getQuotesHandler() (admin)
 * GET  /api/quotes?userId=  → getQuotesHandler() (customer)
 * PUT  /api/quotes/:id/respond → respondToQuoteHandler() (admin)
 */

const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const COLLECTION = 'quote_requests';

// ─── POST /api/quotes ─────────────────────────────────────────────────────────

/**
 * Week 3 Task 9: POST /quote-request
 * Body: { userId, itemType, description, pickup, drop }
 *
 * Postman: POST http://localhost:3000/api/quotes
 */
const submitQuoteHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { userId, itemType, description, pickup, drop } = req.body;

  try {
    const id = uuidv4();
    const quote = {
      id,
      userId,
      itemType: itemType || '',
      description,
      pickup,
      drop,
      status: 'pending',
      quotedPrice: null,
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    await db.collection(COLLECTION).doc(id).set(quote);

    return res.status(201).json({ status: 'success', data: quote });
  } catch (err) {
    console.error('Submit quote error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to submit quote request.' });
  }
};

// ─── GET /api/quotes ──────────────────────────────────────────────────────────

const getQuotesHandler = async (req, res) => {
  const { userId } = req.query;
  try {
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
    if (userId) query = query.where('userId', '==', userId);

    const snapshot = await query.get();
    const quotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ status: 'success', data: quotes });
  } catch (err) {
    console.error('Get quotes error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch quotes.' });
  }
};

// ─── PUT /api/quotes/:id/respond ─────────────────────────────────────────────

const respondToQuoteHandler = async (req, res) => {
  const { id } = req.params;
  const { quotedPrice } = req.body;

  if (quotedPrice === undefined || isNaN(parseFloat(quotedPrice))) {
    return res.status(400).json({ status: 'error', message: 'quotedPrice (number) is required.' });
  }

  try {
    await db.collection(COLLECTION).doc(id).update({
      quotedPrice: parseFloat(quotedPrice),
      status: 'quoted',
      respondedAt: new Date().toISOString(),
    });
    return res.status(200).json({
      status: 'success',
      data: { quoteId: id, quotedPrice: parseFloat(quotedPrice), status: 'quoted' },
    });
  } catch (err) {
    console.error('Respond to quote error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to respond to quote.' });
  }
};

module.exports = { submitQuoteHandler, getQuotesHandler, respondToQuoteHandler };
