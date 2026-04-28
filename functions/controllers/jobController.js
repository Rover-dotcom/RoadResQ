/**
 * Job Controller — RoadResQ (v3.1.0)
 *
 * POST   /api/jobs                     → createJobHandler()
 * GET    /api/jobs                     → getJobsHandler()
 * GET    /api/jobs/my-jobs             → getMyJobsHandler()   ← customer: all their jobs + status
 * GET    /api/jobs/available           → getAvailableJobsHandler()
 * GET    /api/jobs/price-estimate      → getPriceEstimateHandler()
 * GET    /api/jobs/service-info        → getServiceInfoHandler()
 * GET    /api/jobs/:id                 → getJobByIdHandler()
 * GET    /api/jobs/:id/status          → getJobStatusHandler() ← real-time status + driver ETA
 * GET    /api/jobs/:id/match           → matchDriversHandler()
 * PUT    /api/jobs/:id/accept          → acceptJobHandler()
 * PUT    /api/jobs/:id/status          → updateStatusHandler()
 * DELETE /api/jobs/:id/cancel          → cancelJobHandler()
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
const { getVehicleSpec, getServiceCategory, requiresQuote, ALL_VEHICLE_TYPES, SERVICE_TYPES, TRUCK_TYPES, deriveJobConstraints } = require('../utils/serviceEngine');
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
    // Week 4: Others support
    customItem, customDetails, customPhotoUrls,
    // Week 4: Logistics builder
    dimensions, weightKg, loadingType, pickupAccessibility,
    isFragile, specialNotes, logisticsPhotoUrls,
    // Week 4: Basement / restricted access
    isRestrictedArea, clearanceHeightMm,
    // Week 4: Equipment + gate pass
    equipmentType, requiresGatePass, isSpecialLoad,
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
      // Week 4 fields
      customItem, customDetails, customPhotoUrls,
      dimensions, weightKg, loadingType, pickupAccessibility,
      isFragile, specialNotes, logisticsPhotoUrls,
      isRestrictedArea, clearanceHeightMm,
      equipmentType, requiresGatePass, isSpecialLoad,
    });

    // ── Auto-assign: derive all constraints from vehicleType automatically
    let assignedDriver = null;
    if (job.status === 'pending' && !job.requiresQuote) {
      try {
        // deriveJobConstraints auto-figures out truck type, equipment, capacity,
        // isSpecialLoad — customer fields override only what they explicitly set
        const matchConstraints = deriveJobConstraints(job.vehicleType, {
          pickupCoords: job.pickupCoords,
          isRestrictedArea: job.isRestrictedArea || false,
          clearanceHeightMm: job.clearanceHeightMm || null,
          requiresGatePass: job.requiresGatePass || false,
          // equipmentType from body is an extra override (e.g. customer specifies boom_truck)
          ...(job.equipmentType ? { requiredEquipmentTypes: [job.equipmentType] } : {}),
        });

        assignedDriver = await autoAssignDriver(job.id, matchConstraints);
      } catch (matchErr) {
        console.warn('Auto-assign skipped:', matchErr.message);
      }
    }

    // Build a clear response: tell the customer what truck + equipment is coming
    const constraints = job.vehicleType ? deriveJobConstraints(job.vehicleType) : {};
    const driverSummary = assignedDriver
      ? {
          id: assignedDriver.id,
          name: assignedDriver.name,
          truckType: assignedDriver.truckType,
          vehicleModel: assignedDriver.vehicleModel || null,
          equipmentTypes: assignedDriver.equipmentTypes || [],
          maxCapacityKg: assignedDriver.maxCapacityKg || null,
          rating: assignedDriver.rating || null,
          yearsExperience: assignedDriver.yearsExperience || null,
          estimatedETA: assignedDriver._eta || null,
          distanceKm: assignedDriver._distanceKm
            ? Math.round(assignedDriver._distanceKm * 10) / 10
            : null,
        }
      : null;

    // Dispatch status: if no driver found, give a clear fallback explanation
    const dispatchStatus = assignedDriver
      ? {
          dispatched: true,
          message: 'A qualified driver has been assigned to your job.',
        }
      : {
          dispatched: false,
          message: job.requiresQuote
            ? 'Your job requires a custom quote. A garage will review it and respond with a price.'
            : `No driver is currently available for a ${constraints.vehicleLabel || job.vehicleType || 'your vehicle'} in your area. Your job has been queued and will be assigned as soon as a driver becomes available.`,
          whatIsNeeded: job.requiresQuote ? null : {
            truckType: constraints.requiredTruckType || job.requiredTruckType,
            equipmentTypes: constraints.requiredEquipmentTypes || [],
            isSpecialLoad: constraints.isSpecialLoad || false,
          },
          nextSteps: job.requiresQuote
            ? 'Check the Quotes section for a response from the garage.'
            : 'We will notify you as soon as a driver accepts your job. You can also check job status anytime.',
        };

    return success(res, { job, assignedDriver: driverSummary, dispatchStatus }, 201);

  } catch (err) {
    console.error('Create job error:', err);
    return error(res, 'Failed to create job.', 500);
  }
};

// ─── GET /api/jobs/my-jobs (← customer-facing) ─────────────────────────────

/**
 * Customer sees all their own jobs with current status, driver info, and ETA.
 * Query: ?userId=xxx&status=pending (status optional)
 *
 * Fallback messages:
 *  - no driver yet → explains what we’re waiting for
 *  - quote pending → tells them to wait for garage response
 *  - cancelled    → explains what happened
 */
const getMyJobsHandler = async (req, res) => {
  const { userId, status } = req.query;
  if (!userId) return error(res, 'userId is required.');

  try {
    const jobs = await getJobsByUser(userId, { status });

    // Enrich each job with a customer-friendly status message
    const enriched = jobs.map((job) => ({
      ...job,
      statusMessage: buildCustomerStatusMessage(job),
      pricingDisplay: job.price ? `QR ${(job.price / 100).toFixed(2)}` : null,
    }));

    return success(res, { jobs: enriched, count: enriched.length });
  } catch (err) {
    console.error('Get my jobs error:', err);
    return error(res, 'Failed to fetch your jobs.', 500);
  }
};

// ─── GET /api/jobs/:id/status (← real-time single job) ──────────────────────

/**
 * Returns current status + driver ETA for a single job.
 * Used by Flutter to power the live tracking screen.
 */
const getJobStatusHandler = async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found.', 404);

    let driver = null;
    if (job.driverId) {
      driver = await getDriverById(job.driverId);
    }

    return success(res, {
      jobId: job.id,
      status: job.status,
      statusMessage: buildCustomerStatusMessage(job),
      vehicleType: job.vehicleType,
      vehicleLabel: job.vehicleLabel || job.vehicleType,
      pickup: job.pickup,
      drop: job.drop,
      price: job.price,
      pricingDisplay: job.price ? `QR ${(job.price / 100).toFixed(2)}` : null,
      requiresQuote: job.requiresQuote || false,
      assignedDriver: driver
        ? {
            id: driver.id,
            name: driver.name,
            phone: driver.phone || null,
            truckType: driver.truckType,
            vehicleModel: driver.vehicleModel || null,
            rating: driver.rating || null,
            lastLocation: driver.lastLocation || null,
          }
        : null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (err) {
    console.error('Get job status error:', err);
    return error(res, 'Failed to fetch job status.', 500);
  }
};

/**
 * Build a human-readable status message for the customer.
 * Covers all states including fallback cases.
 */
function buildCustomerStatusMessage(job) {
  const STATUS_MESSAGES = {
    pending: job.driverId
      ? 'A driver has been assigned. Waiting for confirmation.'
      : 'Looking for an available driver near you…',
    assigned: 'A driver has been assigned and will contact you shortly.',
    accepted: 'Driver accepted your job and is preparing to depart.',
    in_progress: 'Your vehicle is being transported.',
    on_site: 'Driver has arrived at the pickup location.',
    at_garage: 'Your vehicle has arrived at the garage.',
    completed: 'Job completed. Thank you for using RoadResQ!',
    cancelled: 'This job was cancelled.',
    quote_pending:
      'Your quote request has been received. A garage will respond shortly with a price.',
    quoted:
      'A garage has sent you a price. Please accept or reject the quote in the Quotes section.',
  };

  // Extra context for pending with no driver
  if (job.status === 'pending' && !job.driverId) {
    if (job.requiresQuote) {
      return 'Waiting for a garage to review your request and send a quote.';
    }
    if (job.vehicleType) {
      return `Searching for a qualified driver to transport your ${job.vehicleType}. This may take a few minutes.`;
    }
  }

  return STATUS_MESSAGES[job.status] || `Job status: ${job.status}`;
}

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

    // Derive all constraints from vehicleType automatically
    const constraints = deriveJobConstraints(job.vehicleType, {
      pickupCoords: job.pickupCoords,
      isRestrictedArea: job.isRestrictedArea,
      clearanceHeightMm: job.clearanceHeightMm,
      requiresGatePass: job.requiresGatePass,
      ...(job.equipmentType ? { requiredEquipmentTypes: [job.equipmentType] } : {}),
    });

    const drivers = await findMatchingDrivers(constraints);

    return success(res, {
      jobId: job.id,
      vehicleType: job.vehicleType,
      vehicleLabel: constraints.vehicleLabel,
      requiredTruckType: constraints.requiredTruckType,
      requiredEquipmentTypes: constraints.requiredEquipmentTypes,
      isSpecialLoad: constraints.isSpecialLoad,
      matchedDrivers: drivers.map((d) => ({
        id: d.id,
        name: d.name,
        truckType: d.truckType,
        vehicleModel: d.vehicleModel || null,
        equipmentTypes: d.equipmentTypes || [],
        maxCapacityKg: d.maxCapacityKg,
        vehicleHeightMm: d.vehicleHeightMm || null,
        hasGatePass: d.hasGatePass || false,
        rating: d.rating,
        yearsExperience: d.yearsExperience || 0,
        completedJobs: d.completedJobs || 0,
        estimatedETA: d._eta,
        distanceKm: d._distanceKm ? Math.round(d._distanceKm * 10) / 10 : null,
        matchedOn: d._matchedOn,
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
  getMyJobsHandler,
  getAvailableJobsHandler,
  getPriceEstimateHandler,
  getServiceInfoHandler,
  getJobByIdHandler,
  getJobStatusHandler,
  matchDriversHandler,
  acceptJobHandler,
  updateStatusHandler,
  cancelJobHandler,
  rateDriverHandler,
};

