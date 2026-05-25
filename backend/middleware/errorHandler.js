/**
 * Centralized Error Handling — RoadResQ v9.0.0 (Week 7)
 *
 * Custom error classes + async wrapper + validation middleware.
 *
 * Usage:
 *   const { catchAsync, AppError, NotFoundError, validateRequest } = require('../middleware/errorHandler');
 *   router.get('/item/:id', catchAsync(async (req, res) => { ... }));
 */

const { validationResult } = require('express-validator');

// ─── Custom Error Classes ────────────────────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 404, 'NOT_FOUND');
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed.') {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT');
  }
}

// ─── Async Wrapper ───────────────────────────────────────────────────────────
// Wraps async route handlers to catch rejected promises and pass to next().

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Validation Middleware ───────────────────────────────────────────────────
// Checks express-validator results and throws ValidationError if invalid.

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value,
    }));
    throw new ValidationError('Validation failed.', formatted);
  }
  next();
};

// ─── Global Error Handler ────────────────────────────────────────────────────
// Must be the LAST middleware registered on the Express app.

const globalErrorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    status: err.status || 'error',
    message: err.message || 'Internal server error.',
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    requestId: req.requestId || null,
  };

  // Include validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Include stack trace in development only
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`, {
      requestId: req.requestId,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  PaymentError,
  RateLimitError,
  catchAsync,
  validateRequest,
  globalErrorHandler,
};
