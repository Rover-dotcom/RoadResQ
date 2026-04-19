/**
 * Quote Routes — Week 3 Task 9
 *
 * POST /api/quotes                → submit quote request
 * GET  /api/quotes                → get all quotes (admin) or ?userId= (customer)
 * PUT  /api/quotes/:id/respond    → admin responds with price
 */

const express = require('express');
const { body } = require('express-validator');
const {
  submitQuoteHandler,
  getQuotesHandler,
  respondToQuoteHandler,
} = require('../controllers/quoteController');

const router = express.Router();

// POST /api/quotes
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('description').notEmpty().withMessage('description is required'),
    body('pickup').notEmpty().withMessage('pickup is required'),
    body('drop').notEmpty().withMessage('drop is required'),
  ],
  submitQuoteHandler
);

// GET /api/quotes  (or ?userId=)
router.get('/', getQuotesHandler);

// PUT /api/quotes/:id/respond
router.put('/:id/respond', respondToQuoteHandler);

module.exports = router;
