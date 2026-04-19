/**
 * Job Controller — Week 2 Task 2 + Week 3 Tasks 1-8
 *
 * POST   /api/jobs                → createJobHandler()
 * GET    /api/jobs                → getJobsHandler()
 * GET    /api/jobs/available      → getAvailableJobsHandler()   (Week 3)
 * GET    /api/jobs/:id            → getJobByIdHandler()
 * GET    /api/jobs?userId=        → getJobsHandler() (filtered)
 * GET    /api/jobs?driverId=      → getJobsHandler() (filtered)
 * PUT    /api/jobs/:id/accept     → acceptJobHandler()          (Week 3)
 * PUT    /api/jobs/:id/status     → updateStatusHandler()
 */

const { validationResult } = require('express-validator');
const {
  createJob,
  getAllJobs,
  getJobsByUser,
  getJobsByDriver,
  getAvailableJobs,
  getJobById,
  acceptJob,
  updateJobStatus,
} = require('../models/jobModel');
const { getCategory, calculatePrice } = require('../utils/categoryEngine');

// ─── POST /api/jobs ───────────────────────────────────────────────────────────

/**
 * Week 2 Task 2 + Week 3 Task 2: Create Job
 * ✔ Detects category   ✔ Calculates price   ✔ Saves job
 *
 * Body: { userId, serviceType, vehicleType, pickup, drop, distanceKm?, description? }
 *
 * Postman: POST http://localhost:3000/api/jobs
 */
const createJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { userId, serviceType, vehicleType, pickup, drop, distanceKm, description, garageId, repairOption } = req.body;

  try {
    const job = await createJob({
      userId,
      serviceType,
      vehicleType,
      pickup,
      drop,
      distanceKm: distanceKm ? parseFloat(distanceKm) : 5,
      description,
      garageId,
      repairOption,
    });

    return res.status(201).json({
      status: 'success',
      data: job,
    });
  } catch (err) {
    console.error('Create job error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create job.',
    });
  }
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────

/**
 * Week 2 Task 2: GET /jobs
 * Also handles: GET /jobs?userId=  and  GET /jobs?driverId=  (Week 3 Task 8)
 *
 * Postman: GET http://localhost:3000/api/jobs
 *          GET http://localhost:3000/api/jobs?userId=<uid>
 *          GET http://localhost:3000/api/jobs?driverId=<uid>
 */
const getJobsHandler = async (req, res) => {
  const { userId, driverId } = req.query;

  try {
    let jobs;
    if (userId) {
      jobs = await getJobsByUser(userId);
    } else if (driverId) {
      jobs = await getJobsByDriver(driverId);
    } else {
      jobs = await getAllJobs();
    }

    return res.status(200).json({
      status: 'success',
      data: jobs,
    });
  } catch (err) {
    console.error('Get jobs error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch jobs.',
    });
  }
};

// ─── GET /api/jobs/available ──────────────────────────────────────────────────

/**
 * Week 3 Task 6: GET /jobs/available
 * Query: ?vehicleType=  (optional — filters to driver's vehicle type)
 *
 * Postman: GET http://localhost:3000/api/jobs/available?vehicleType=Sedan
 */
const getAvailableJobsHandler = async (req, res) => {
  const { vehicleType } = req.query;
  try {
    const jobs = await getAvailableJobs(vehicleType);
    return res.status(200).json({
      status: 'success',
      data: jobs,
    });
  } catch (err) {
    console.error('Get available jobs error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available jobs.',
    });
  }
};

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────

const getJobByIdHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await getJobById(id);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found.' });
    }
    return res.status(200).json({ status: 'success', data: job });
  } catch (err) {
    console.error('Get job by ID error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch job.' });
  }
};

// ─── PUT /api/jobs/:id/accept ─────────────────────────────────────────────────

/**
 * Week 3 Task 7: PUT /jobs/:id/accept
 * Body: { driverId }
 *
 * Postman: PUT http://localhost:3000/api/jobs/:id/accept
 *   Body: { "driverId": "<driver uid>" }
 */
const acceptJobHandler = async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  if (!driverId) {
    return res.status(400).json({ status: 'error', message: 'driverId is required.' });
  }

  try {
    const job = await getJobById(id);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found.' });
    }
    if (job.status !== 'pending') {
      return res.status(409).json({
        status: 'error',
        message: `Job cannot be accepted — current status is '${job.status}'.`,
      });
    }

    await acceptJob(id, driverId);
    return res.status(200).json({
      status: 'success',
      data: { jobId: id, driverId, status: 'accepted' },
    });
  } catch (err) {
    console.error('Accept job error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to accept job.' });
  }
};

// ─── PUT /api/jobs/:id/status ─────────────────────────────────────────────────

const updateStatusHandler = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'accepted', 'in_progress', 'at_garage', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    await updateJobStatus(id, status);
    return res.status(200).json({
      status: 'success',
      data: { jobId: id, status },
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update status.' });
  }
};

// ─── GET /api/jobs/price-estimate ─────────────────────────────────────────────

/**
 * Utility: Calculate price estimate before booking.
 * Query: ?vehicleType=Sedan&distanceKm=10
 */
const getPriceEstimate = (req, res) => {
  const { vehicleType, distanceKm } = req.query;
  if (!vehicleType) {
    return res.status(400).json({ status: 'error', message: 'vehicleType is required.' });
  }
  const km = parseFloat(distanceKm) || 5;
  const category = getCategory(vehicleType);
  const price = calculatePrice(vehicleType, km);
  return res.status(200).json({
    status: 'success',
    data: { vehicleType, category, distanceKm: km, estimatedPrice: price },
  });
};

module.exports = {
  createJobHandler,
  getJobsHandler,
  getAvailableJobsHandler,
  getJobByIdHandler,
  acceptJobHandler,
  updateStatusHandler,
  getPriceEstimate,
};
