/**
 * History Controller — RoadResQ v9.0.0 (Week 7)
 *
 * GET /api/history/bookings             — Customer booking history
 * GET /api/history/driver-earnings/:id  — Driver earnings history
 * GET /api/history/driver-performance/:id — Driver performance metrics
 * GET /api/history/garage-repairs/:id   — Garage repair history
 * POST /api/history/auto-offline        — Trigger auto-offline check (admin)
 */

const {
  checkInactiveDrivers, getDriverEarnings, getDriverPerformance,
  getBookingHistory, getGarageRepairHistory,
} = require('../utils/autoDriverEngine');

const ok   = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

const bookingHistoryHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getBookingHistory(req.user.uid, limit);
    return ok(res, { history, count: history.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const driverEarningsHandler = async (req, res) => {
  try {
    const driverId = req.params.id;
    // Only the driver themselves or admin can view
    if (req.user.uid !== driverId && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }
    const period = req.query.period || 'all'; // today | week | month | all
    const earnings = await getDriverEarnings(driverId, period);
    return ok(res, earnings);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const driverPerformanceHandler = async (req, res) => {
  try {
    const driverId = req.params.id;
    if (req.user.uid !== driverId && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }
    const performance = await getDriverPerformance(driverId);
    return ok(res, performance);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const garageRepairHistoryHandler = async (req, res) => {
  try {
    const garageId = req.params.id;
    if (req.user.uid !== garageId && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }
    const limit = parseInt(req.query.limit) || 50;
    const history = await getGarageRepairHistory(garageId, limit);
    return ok(res, { history, count: history.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const autoOfflineHandler = async (req, res) => {
  try {
    const result = await checkInactiveDrivers();
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

module.exports = {
  bookingHistoryHandler, driverEarningsHandler, driverPerformanceHandler,
  garageRepairHistoryHandler, autoOfflineHandler,
};
