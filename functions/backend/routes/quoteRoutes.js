const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  submitQuoteHandler,
  getQuotesHandler,
  getMyQuotesHandler,
  getQuoteByIdHandler,
  respondToQuoteHandler,
  acceptQuoteByCustomerHandler,
  rejectQuoteByCustomerHandler,
  submitQuoteBidHandler,
  getQuoteBidsHandler,
  acceptQuoteBidHandler,
} = require('../controllers/quoteController');

// ─── Validation ───────────────────────────────────────────────────────────────

const submitQuoteValidation = [
  body('userId').notEmpty().withMessage('userId is required'),
  body('pickup').notEmpty().withMessage('pickup location is required'),
  body('drop').notEmpty().withMessage('drop location is required'),
  body('itemDescription').notEmpty().withMessage('itemDescription is required'),
  body('serviceType')
    .optional()
    .isIn(['garage', 'heavy_equipment', 'quote_industrial'])
    .withMessage('serviceType must be: garage | heavy_equipment | quote_industrial'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('urgency must be: low | medium | high'),
  body('estimatedWeight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('estimatedWeight must be a positive number (kg)'),
  // Scheduling (optional)
  body('preferredDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('preferredDate must be in YYYY-MM-DD format'),
  body('preferredTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('preferredTime must be in HH:MM 24-hour format'),
];

const respondValidation = [
  body('garageId').notEmpty().withMessage('garageId is required — only garages can respond to quotes'),
  body('quotedPrice')
    .isInt({ min: 1 })
    .withMessage('quotedPrice must be a positive integer in halala (e.g. 15000 = QR 150.00)'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// IMPORTANT: specific paths BEFORE :id param
router.get('/my-quotes', getMyQuotesHandler);                          // Customer: their quotes + status

router.post('/', submitQuoteValidation, submitQuoteHandler);           // Submit new quote request
router.get('/', getQuotesHandler);                                     // Admin read-only report: all quotes

router.get('/:id', getQuoteByIdHandler);                              // Single quote details
router.put('/:id/respond', respondValidation, respondToQuoteHandler); // Garage responds with price
router.put('/:id/accept', acceptQuoteByCustomerHandler);              // Customer accepts
router.put('/:id/reject', rejectQuoteByCustomerHandler);              // Customer rejects

// ─── Bidding System (Industrial / Heavy Equipment) ────────────────────────────
// POST /api/quotes/:id/bid              — driver/garage submits bid (price + ETA + equipment)
// GET  /api/quotes/:id/bids             — customer views all bids (sorted by price, highlights best)
// PUT  /api/quotes/:id/bids/:bidId/accept — customer accepts winning bid → creates linked job

router.post('/:id/bid', submitQuoteBidHandler);
router.get('/:id/bids', getQuoteBidsHandler);
router.put('/:id/bids/:bidId/accept', acceptQuoteBidHandler);

module.exports = router;
