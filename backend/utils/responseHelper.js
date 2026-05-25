/**
 * Response Helper — RoadResQ v9.0.0 (Week 7)
 *
 * Standardized API response format.
 *
 * Usage:
 *   const { success, error, created, paginated } = require('../utils/responseHelper');
 *   return success(res, { user }, 'User fetched.');
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data,
    requestId: res.req?.requestId || null,
  });

const created = (res, data = {}, message = 'Created successfully.') =>
  success(res, data, message, 201);

const error = (res, message = 'An error occurred.', statusCode = 400, errorCode = null) =>
  res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    errorCode: errorCode || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
    requestId: res.req?.requestId || null,
  });

const paginated = (res, data = [], page = 1, limit = 20, total = 0, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    status: 'success',
    message,
    data,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages,
      hasMore: page < totalPages,
    },
    requestId: res.req?.requestId || null,
  });
};

module.exports = { success, created, error, paginated };
