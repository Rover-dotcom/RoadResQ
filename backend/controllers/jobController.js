/**
 * Job Controller — RoadResQ (Complete Rebuild)
 *
 * POST   /api/jobs                     → createJobHandler()
 * GET    /api/jobs                     → getJobsHandler()
 * GET    /api/jobs/available           → getAvailableJobsHandler()
 * GET    /api/jobs/price-estimate      → getPriceEstimateHandler()
 * GET    /api/jobs/service-info        → getServiceInfoHandler()
 * GET    /api/jobs/:id                 → getJobByIdHandler()
 * PUT    /api/jobs/:id/accept          → acceptJobHandler()
 * PUT    /api/jobs/:id/status          → updateStatusHandler()
 * DELETE /api/jobs/:id/cancel          → cancelJobHandler()
 * GET    /api/jobs/:id/match           → matchDriversHandler()
 * PUT    /api/jobs/:id/rate-driver     → rateDriverHandler()
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
  cancelJob,
} = require('../models/jobModel');
const { getDriverById, updateDriverRating } = require('../models/driverModel');
const { getVehicleSpec, getServiceCategory, requiresQuote, ALL_VEHICLE_TYPES, SERVICE_TYPES, TRUCK_TYPES } = require('../utils/serviceEngine');
const { getPriceEstimate } = require('../utils/pricingEngine');
const { findMatchingDrivers, autoAssignDriver, checkDriverJobCompatibility } = require('../utils/matchingEngine');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400, extras = {}) =>
  res.status(code).json({ status: 'error', message, ...extras });

const VALID_STATUSES = ['pending', 'assigned', 'accepted', 'in_progress', 'at_garage', 'on_site', 'completed', 'cancelled', 'quote_pending', 'quoted'];

// ─── POST /api/jobs ───────────────────────────────────────────────────────────

/**
 * Creates a new job.
 *
 * Auto-detects: service category, required truck type, vehicle weight
 * Auto-calculates: price (if not a quote type)
 * Quote jobs: status set to 'quote_pending' automatically
 *
 * Body required: userId, vehicleType OR serviceType, pickup, drop
 */
const createJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 400, {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const {
    userId, vehicleType, serviceType, pickup, drop,
    distanceKm, vehicleModel, vehiclePlate, vehicleColor,
    vehicleCondition, loadDescription, garageUrgency,
    repairDescription, customerNotes, garageId,
    pickupCoords, dropCoords,
  } = req.body;

  // Validate vehicle type if provided
  if (vehicleType) {
    const spec = getVehicleSpec(vehicleType);
    if (!spec && vehicleType !== 'Others') {
      return error(res, `Unknown vehicle type: '${vehicleType}'. Valid types: ${ALL_VEHICLE_TYPES.join(', ')}`);
    }
  }

  try {
    const job = await createJob({
      userId, vehicleType, serviceType, pickup, drop,
      distanceKm, vehicleModel, vehiclePlate, vehicleColor,
      vehicleCondition, loadDescription, garageUrgency,
      repairDescription, customerNotes, garageId,
      pickupCoords, dropCoords,
    });

    // Try auto-assign for non-quote jobs with pending status
    let assignedDriver = null;
    if (job.status === 'pending' && !job.requiresQuote) {
      try {
        assignedDriver = await autoAssignDriver(job.id, {
          vehicleType: job.vehicleType,
          serviceType: job.serviceType,
          requiredTruckType: job.requiredTruckType,
          minTruckCapacityKg: job.minTruckCapacityKg || 0,
        });
      } catch (matchErr) {
        // Auto-assign failure is non-fatal — job stays pending, driver can pick it up manually
        console.warn('Auto-assign skipped:', matchErr.message);
      }
    }

    return success(res, { job, assignedDriver: assignedDriver ? { id: assignedDriver.id, name: assignedDriver.name, truckType: assignedDriver.truckType } : null }, 201);
  } catch (err) {
    console.error('Create job error:', err);
    return error(res, 'Failed to create job.', 500);
  }
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────

const getJobsHandler = async (req, res) => {
  const { userId, driverId, status } = req.query;
  try {
    let jobs;
    if (userId) {
      jobs = await getJobsByUser(userId, { status });
    } else if (driverId) {
      jobs = await getJobsByDriver(driverId, { status });
    } else {
      jobs = await getAllJobs({ status });
    }
    return success(res, { jobs, count: jobs.length });
  } catch (err) {
    console.error('Get jobs error:', err);
    return error(res, 'Failed to fetch jobs.', 500);
  }
};

// ─── GET /api/jobs/available ──────────────────────────────────────────────────

/**
 * Returns pending jobs the driver can pick up.
 * Filtered by compatible truck types + optional service type.
 *
 * Query: ?truckType=standard_tow&serviceType=tow
 */
const getAvailableJobsHandler = async (req, res) => {
  const { truckType, serviceType } = req.query;
  try {
    const jobs = await getAvailableJobs({ requiredTruckType: truckType, serviceType });
    return success(res, { jobs, count: jobs.length });
  } catch (err) {
    console.error('Get available jobs error:', err);
    return error(res, 'Failed to fetch available jobs.', 500);
  }
};

// ─── GET /api/jobs/price-estimate ────────────────────────────────────────────

/**
 * Calculate price estimate before booking.
 * Query: ?vehicleType=Sedan&distanceKm=10
 */
const getPriceEstimateHandler = (req, res) => {
  const { vehicleType, distanceKm } = req.query;
  if (!vehicleType) return error(res, 'vehicleType is required.');

  const estimate = getPriceEstimate(vehicleType, parseFloat(distanceKm) || 5);
  return success(res, estimate);
};

// ─── GET /api/jobs/service-info ───────────────────────────────────────────────

/**
 * Returns full service catalog — all vehicle types, categories, pricing info.
 * Frontend uses this to populate the booking form.
 */
const getServiceInfoHandler = (req, res) => {
  const { VEHICLE_SPECS, TOW_VEHICLES, HEAVY_EQUIPMENT_TYPES, INDUSTRIAL_TYPES, GARAGE_SPECS, SERVICE_TYPES: ST, TRUCK_TYPES: TT } = require('../utils/serviceEngine');
  const { PRICING_TABLE } = require('../utils/pricingEngine');

  return success(res, {
    serviceStructure: {
      tow: {
        label: 'Tow Service',
        description: 'Standard vehicle towing to garage or preferred location',
        vehicles: TOW_VEHICLES,
        autoPrice: true,
      },
      garage: {
        label: 'Garage / Repair',
        description: 'On-site mechanic or garage delivery',
        levels: {
          urgent: GARAGE_SPECS.urgent,
          standard: GARAGE_SPECS.standard,
        },
        autoPrice: 'urgent only',
      },
      heavy_equipment: {
        label: 'Heavy Equipment Transport',
        description: 'Flatbed transport for construction machinery',
        vehicles: HEAVY_EQUIPMENT_TYPES,
        autoPrice: true,
      },
      quote_industrial: {
        label: 'Quote (Industrial)',
        description: 'Custom quote for precast, containers, pallets, generators',
        vehicles: INDUSTRIAL_TYPES,
        autoPrice: false,
      },
    },
    truckTypes: Object.values(TT),
    pricingTable: PRICING_TABLE,
    vehicleSpecs: VEHICLE_SPECS,
  });
};

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────

const getJobByIdHandler = async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);
    return success(res, job);
  } catch (err) {
    return error(res, 'Failed to fetch job.', 500);
  }
};

// ─── GET /api/jobs/:id/match ──────────────────────────────────────────────────

/**
 * Returns matching drivers for a specific job.
 * Useful for admin assignment or showing driver options to customer.
 */
const matchDriversHandler = async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);

    const drivers = await findMatchingDrivers({
      vehicleType: job.vehicleType,
      serviceType: job.serviceType,
      requiredTruckType: job.requiredTruckType,
      minTruckCapacityKg: job.minTruckCapacityKg || 0,
    });

    return success(res, {
      jobId: job.id,
      requiredTruckType: job.requiredTruckType,
      matchedDrivers: drivers.map((d) => ({
        id: d.id,
        name: d.name,
        truckType: d.truckType,
        truckModel: d.truckModel,
        maxCapacityKg: d.maxCapacityKg,
        rating: d.rating,
        completedJobs: d.completedJobs,
        lastLocation: d.lastLocation,
      })),
      count: drivers.length,
    });
  } catch (err) {
    console.error('Match drivers error:', err);
    return error(res, 'Failed to find matching drivers.', 500);
  }
};

// ─── PUT /api/jobs/:id/accept ─────────────────────────────────────────────────

/**
 * Driver manually accepts a pending job (self-selection flow).
 * Validates driver-job compatibility before accepting.
 * Body: { driverId }
 */
const acceptJobHandler = async (req, res) => {
  const { driverId } = req.body;
  if (!driverId) return error(res, 'driverId is required.');

  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);
    if (!['pending', 'assigned'].includes(job.status)) {
      return error(res, `Cannot accept a job with status '${job.status}'. Only 'pending' or 'assigned' jobs can be accepted.`, 409);
    }

    const driver = await getDriverById(driverId);
    if (!driver) return error(res, 'Driver not found.', 404);

    // Compatibility check
    const compatibility = checkDriverJobCompatibility(driver, job);
    if (!compatibility.compatible) {
      return error(res, compatibility.reason, 409);
    }

    await acceptJob(job.id, driverId, driver.truckType);

    // Mark driver as unavailable
    const { updateDriver } = require('../models/driverModel');
    await updateDriver(driverId, { isAvailable: false, activeJobId: job.id });

    return success(res, {
      jobId: job.id,
      driverId,
      driverName: driver.name,
      truckType: driver.truckType,
      status: 'accepted',
    });
  } catch (err) {
    console.error('Accept job error:', err);
    return error(res, 'Failed to accept job.', 500);
  }
};

// ─── PUT /api/jobs/:id/status ─────────────────────────────────────────────────

const updateStatusHandler = async (req, res) => {
  const { status, adminNotes } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return error(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);

    const extras = {};
    if (adminNotes) extras.adminNotes = adminNotes;

    await updateJobStatus(req.params.id, status, extras);

    // If completed/cancelled, release the driver
    if (['completed', 'cancelled'].includes(status) && job.driverId) {
      const { releaseDriver } = require('../utils/matchingEngine');
      await releaseDriver(job.driverId);
    }

    return success(res, { jobId: job.id, status });
  } catch (err) {
    console.error('Update status error:', err);
    return error(res, 'Failed to update status.', 500);
  }
};

// ─── DELETE /api/jobs/:id/cancel ─────────────────────────────────────────────

const cancelJobHandler = async (req, res) => {
  try {
    await cancelJob(req.params.id);
    return success(res, { jobId: req.params.id, status: 'cancelled' });
  } catch (err) {
    console.error('Cancel job error:', err);
    return error(res, err.message || 'Failed to cancel job.', err.message === 'Job not found' ? 404 : 500);
  }
};

// ─── PUT /api/jobs/:id/rate-driver ────────────────────────────────────────────

const rateDriverHandler = async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return error(res, 'Rating must be between 1 and 5.');
  }

  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);
    if (!job.driverId) return error(res, 'No driver assigned to this job.');
    if (job.status !== 'completed') return error(res, 'Can only rate a completed job.', 409);

    await updateDriverRating(job.driverId, parseFloat(rating));
    return success(res, { jobId: job.id, driverId: job.driverId, rating });
  } catch (err) {
    console.error('Rate driver error:', err);
    return error(res, 'Failed to submit rating.', 500);
  }
};

module.exports = {
  createJobHandler,
  getJobsHandler,
  getAvailableJobsHandler,
  getPriceEstimateHandler,
  getServiceInfoHandler,
  getJobByIdHandler,
  matchDriversHandler,
  acceptJobHandler,
  updateStatusHandler,
  cancelJobHandler,
  rateDriverHandler,
};
