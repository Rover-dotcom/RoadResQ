const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  submitQuoteHandler,
  getQuotesHandler,
  getQuoteByIdHandler,
  respondToQuoteHandler,
  acceptQuoteByCustomerHandler,
  rejectQuoteByCustomerHandler,
} = require('../controllers/quoteController');

// ─── Validation ───────────────────────────────────────────────────────────────

const submitQuoteValidation = [
  body('userId').notEmpty().withMessage('userId is required'),
  body('pickup').notEmpty().withMessage('pickup location is required'),
  body('drop').notEmpty().withMessage('drop location is required'),
  body('itemDescription').notEmpty().withMessage('itemDescription is required — describe what needs to be transported/repaired'),
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
    .withMessage('estimatedWeight must be a positive number (in kg)'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/', submitQuoteValidation, submitQuoteHandler);     // Submit quote
router.get('/', getQuotesHandler);                               // Get all / by userId / by status
router.get('/:id', getQuoteByIdHandler);                        // Single quote
router.put('/:id/respond', [
  body('quotedPrice').isFloat({ min: 1 }).withMessage('quotedPrice must be a positive number'),
], respondToQuoteHandler);                                       // Admin responds
router.put('/:id/accept', acceptQuoteByCustomerHandler);         // Customer accepts
router.put('/:id/reject', rejectQuoteByCustomerHandler);         // Customer rejects

module.exports = router;
