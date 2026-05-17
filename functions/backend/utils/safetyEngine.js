/**
 * Safety Engine — RoadResQ Safety System 2.0
 *
 * Features:
 * 1. Pre-job risk score calculation (location, time, service type)
 * 2. PIN generation and verification
 * 3. Job safety state management
 * 4. Panic button handler
 * 5. In-activity timer alerts
 * 6. Live job safety monitoring
 */

const { db } = require('../config/firebase');
const crypto = require('crypto');

// ─── Risk Constants ───────────────────────────────────────────────────────────

const QATAR_PEAK_HOURS = [[7, 9], [12, 14], [17, 20]]; // [startH, endH]
const INACTIVITY_THRESHOLD_MINUTES = 15;

// ─── 1. Risk Score Engine ─────────────────────────────────────────────────────

/**
 * Calculates pre-job risk level based on location type, time, and service.
 * @param {{ locationType, serviceType, pickupCoords, vehicleType }} data
 * @returns {{ riskScore, riskLevel, warnings[] }}
 */
function calculateRiskScore({ locationType, serviceType, pickupCoords, vehicleType, scheduledPickupTime } = {}) {
  let riskScore = 0;
  const warnings = [];

  // Location type
  if (locationType === 'highway')         { riskScore += 3; warnings.push('You are on a high-speed road. Stay inside your vehicle and turn hazard lights ON.'); }
  if (locationType === 'industrial_zone') { riskScore += 2; warnings.push('Industrial area — stay clear of heavy machinery.'); }
  if (locationType === 'desert')          { riskScore += 2; warnings.push('Remote desert location — stay hydrated and remain with your vehicle.'); }
  if (locationType === 'basement')        { riskScore += 1; warnings.push('Basement / underground — ensure ventilation is adequate.'); }

  // Service type risk
  if (serviceType === 'heavy_equipment')  { riskScore += 2; warnings.push('Heavy equipment transport — do not approach machinery during loading.'); }
  if (serviceType === 'tow' && vehicleType && vehicleType.toLowerCase().includes('motorcycle')) {
    riskScore += 1; warnings.push('Motorcycle tow — ensure bike is secured before transport.');
  }

  // Time of day
  const hour = scheduledPickupTime
    ? parseInt(scheduledPickupTime.split(':')[0])
    : new Date().getHours();
  const isNight = hour >= 22 || hour < 5;
  if (isNight) { riskScore += 2; warnings.push('Night-time job — stay in a well-lit area and keep your phone charged.'); }

  // Peak hours
  const isPeak = QATAR_PEAK_HOURS.some(([s, e]) => hour >= s && hour < e);
  if (isPeak) { riskScore += 1; warnings.push('Peak traffic hours — expect higher wait times. Stay safe on the roadside.'); }

  // Determine level
  let riskLevel;
  if (riskScore === 0)      riskLevel = 'low';
  else if (riskScore <= 3)  riskLevel = 'medium';
  else if (riskScore <= 5)  riskLevel = 'high';
  else                      riskLevel = 'critical';

  return { riskScore, riskLevel, warnings };
}

// ─── 2. PIN Generation & Verification ────────────────────────────────────────

/**
 * Generates a 4-digit PIN for job verification.
 * Stores it in Firestore on the job document.
 * Driver must enter this PIN at arrival to start the job.
 */
async function generateJobPIN(jobId) {
  const pin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  await db.collection('jobs').doc(jobId).update({
    verificationPIN: pinHash,
    verificationPINCreatedAt: new Date().toISOString(),
    pinVerified: false,
    updatedAt: new Date().toISOString(),
  });

  return pin; // Return raw PIN to send to customer (NOT stored in DB)
}

/**
 * Verifies the PIN entered by driver at arrival.
 * Returns true if correct, false otherwise.
 */
async function verifyJobPIN(jobId, enteredPin) {
  const snap = await db.collection('jobs').doc(jobId).get();
  if (!snap.exists) return { success: false, error: 'Job not found.' };

  const job = snap.data();
  if (!job.verificationPIN) return { success: false, error: 'No PIN set for this job.' };

  const hash = crypto.createHash('sha256').update(String(enteredPin)).digest('hex');
  const isCorrect = hash === job.verificationPIN;

  if (isCorrect) {
    await db.collection('jobs').doc(jobId).update({
      pinVerified: true,
      pinVerifiedAt: new Date().toISOString(),
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });
  }

  return { success: isCorrect, error: isCorrect ? null : 'Incorrect PIN. Please check with customer.' };
}

// ─── 2b. Service-Specific Safety Checklists ──────────────────────────────────

/**
 * Service-specific safety checklists that drivers MUST complete before starting a job.
 * For tow jobs: the car must be securely mounted on the tow truck.
 * For heavy equipment: the load must be secured with heavy-duty chains.
 * For garage/on-site: tools and area must be verified.
 */
const SERVICE_SAFETY_CHECKLISTS = {
  tow: {
    label: 'Tow — Vehicle Mount Safety Check',
    items: {
      vehicleLoadedSecurely:    'Vehicle is securely loaded on flatbed / tow hook',
      strapsChainsTightened:    'All straps and chains are tightened and locked',
      handbrakeEngaged:         'Handbrake engaged on towed vehicle',
      towHookWinchConnected:    'Tow hook / winch properly connected and tested',
      towedVehicleInNeutral:    'Towed vehicle is in neutral gear',
      tailLightsReflectors:     'Tail lights and reflectors are visible from behind',
      noLooseItems:             'No loose items inside or on top of towed vehicle',
      wheelLiftSecured:         'Wheel lift / dolly secured (if applicable)',
    },
  },
  heavy_equipment: {
    label: 'Heavy Equipment — Load Safety Check',
    items: {
      heavyDutyChainsSecured:   'Equipment secured with heavy-duty chains on all corners',
      boomArmRetracted:         'Boom / arm fully retracted and locked',
      outriggersRetracted:      'Outriggers retracted and pinned',
      transportPinsInPlace:     'Transport pins and locking devices in place',
      loadWithinCapacity:       'Load weight does not exceed flatbed rated capacity',
      heightClearanceChecked:   'Height clearance checked for route (bridges, tunnels)',
      warningFlagsPlaced:       'Wide-load warning flags / lights placed (if oversized)',
    },
  },
  garage: {
    label: 'On-Site Repair — Work Area Safety Check',
    items: {
      areaSecured:              'Work area is clear of traffic and pedestrians',
      toolsReady:               'All required tools and parts are ready',
      vehicleLiftSafe:          'Vehicle lift / jack stands are stable (if raised)',
      fireExtinguisherNearby:   'Fire extinguisher accessible nearby',
      customerInformedOfScope:  'Customer has been informed of repair scope and duration',
    },
  },
  quote_industrial: {
    label: 'Industrial Load — Transport Safety Check',
    items: {
      loadSecured:              'Industrial load secured and balanced on trailer',
      dimensionsVerified:       'Load dimensions verified against route clearance',
      weightDistributed:        'Weight is evenly distributed across axles',
      specialPermitsReady:      'Special permits and gate pass documents ready',
      escortVehicleArranged:    'Escort vehicle arranged (if oversized load)',
    },
  },
};

/**
 * Returns the checklist items for a given service type.
 * @param {string} serviceType — 'tow' | 'heavy_equipment' | 'garage' | 'quote_industrial'
 * @returns {{ label: string, items: Record<string, string> } | null}
 */
function getServiceChecklist(serviceType) {
  return SERVICE_SAFETY_CHECKLISTS[serviceType] || null;
}

/**
 * Validates and records a service-specific safety check.
 * All items must be checked (true) before the job can proceed.
 *
 * @param {string} jobId
 * @param {string} driverId
 * @param {string} serviceType
 * @param {Record<string, boolean>} submittedChecks — e.g. { vehicleLoadedSecurely: true, ... }
 * @returns {{ success, failedItems?, record? }}
 */
async function submitServiceSafetyCheck(jobId, driverId, serviceType, submittedChecks) {
  const checklist = SERVICE_SAFETY_CHECKLISTS[serviceType];
  if (!checklist) {
    return { success: false, error: `No safety checklist defined for service type: ${serviceType}` };
  }

  const requiredKeys = Object.keys(checklist.items);
  const results = {};
  const failedItems = [];

  for (const key of requiredKeys) {
    const passed = !!submittedChecks[key];
    results[key] = passed;
    if (!passed) failedItems.push({ key, label: checklist.items[key] });
  }

  if (failedItems.length > 0) {
    return {
      success: false,
      error: `Safety check incomplete. ${failedItems.length} item(s) not confirmed.`,
      failedItems,
      results,
    };
  }

  // All passed — save to Firestore
  const record = {
    jobId,
    driverId,
    serviceType,
    checklistLabel: checklist.label,
    type: 'service_safety_check',
    checks: results,
    allPassed: true,
    submittedAt: new Date().toISOString(),
  };

  await db.collection('safety_checklists').doc(`service_${jobId}`).set(record);

  // Update job to indicate service safety check passed
  await db.collection('jobs').doc(jobId).update({
    serviceSafetyCheckPassed: true,
    serviceSafetyCheckAt: record.submittedAt,
    serviceSafetyCheckType: serviceType,
    updatedAt: new Date().toISOString(),
  });

  return { success: true, record };
}

// ─── 3. Job Safety State ─────────────────────────────────────────────────────

/**
 * Updates the safety state of a job.
 * Called after customer confirms safety, or system detects issues.
 */
async function updateJobSafetyState(jobId, updates) {
  const safetyUpdates = {
    updatedAt: new Date().toISOString(),
  };
  if (updates.safetyConfirmed !== undefined) safetyUpdates.safetyConfirmed = updates.safetyConfirmed;
  if (updates.riskLevel)      safetyUpdates.riskLevel = updates.riskLevel;
  if (updates.safetyFlags)    safetyUpdates.safetyFlags = updates.safetyFlags;
  if (updates.completionPhotoUrl) safetyUpdates.completionPhotoUrl = updates.completionPhotoUrl;
  if (updates.arrivalPhotoUrl)    safetyUpdates.arrivalPhotoUrl = updates.arrivalPhotoUrl;

  await db.collection('jobs').doc(jobId).update(safetyUpdates);
}

// ─── 4. Panic Button ─────────────────────────────────────────────────────────

/**
 * Triggered when customer or driver hits the panic button.
 * Logs incident, flags job critical, notifies admin via Firestore.
 */
async function triggerPanic(jobId, triggeredBy, location) {
  const batch = db.batch();

  // Flag job as panic
  const jobRef = db.collection('jobs').doc(jobId);
  batch.update(jobRef, {
    isPanicTriggered: true,
    panicAt: new Date().toISOString(),
    panicTriggeredBy: triggeredBy, // userId or driverId
    riskLevel: 'critical',
    safetyFlags: db.FieldValue ? db.FieldValue.arrayUnion('PANIC_TRIGGERED') : ['PANIC_TRIGGERED'],
    updatedAt: new Date().toISOString(),
  });

  // Create admin alert
  const alertRef = db.collection('admin_alerts').doc();
  batch.set(alertRef, {
    type: 'PANIC_BUTTON',
    jobId,
    triggeredBy,
    location: location || null,
    message: '🚨 PANIC BUTTON triggered — immediate admin attention required.',
    severity: 'critical',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Create incident
  const incidentRef = db.collection('incidents').doc();
  batch.set(incidentRef, {
    jobId,
    type: 'panic_triggered',
    description: 'Customer/Driver triggered panic button during active job.',
    reportedBy: 'system',
    reporterId: triggeredBy,
    status: 'open',
    riskLevel: 'critical',
    isPanicAlert: true,
    location: location || null,
    evidence: { pinVerified: false, photosUploaded: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await batch.commit();
  return { jobId, panicLogged: true, message: 'Emergency alert sent to admin.' };
}

// ─── 5. Inactivity Check ─────────────────────────────────────────────────────

/**
 * Checks if a job has been inactive (no status update) for too long.
 * Called periodically (or on-demand by admin dashboard).
 */
async function checkInactiveJobs() {
  const threshold = new Date(Date.now() - INACTIVITY_THRESHOLD_MINUTES * 60 * 1000).toISOString();

  const snap = await db.collection('jobs')
    .where('status', 'in', ['assigned', 'accepted', 'in_progress', 'on_site'])
    .where('updatedAt', '<', threshold)
    .limit(50).get();

  const inactive = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Flag each inactive job
  const batch = db.batch();
  inactive.forEach(job => {
    batch.update(db.collection('jobs').doc(job.id), {
      safetyFlags: ['INACTIVE_JOB'],
      inactivityFlaggedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  if (inactive.length) await batch.commit();

  return inactive;
}

// ─── 6. Safety Feedback ──────────────────────────────────────────────────────

/**
 * Records post-job safety feedback from customer.
 */
async function recordSafetyFeedback(jobId, userId, { feltSafe, safetyRating, incidentReport }) {
  const feedback = {
    jobId, userId,
    feltSafe:  feltSafe ?? true,
    safetyRating: safetyRating || 5,     // 1-5
    incidentReport: incidentReport || null,
    createdAt: new Date().toISOString(),
  };

  await db.collection('safety_feedback').add(feedback);

  // If not safe, auto-create incident
  if (!feltSafe || safetyRating <= 2) {
    await db.collection('incidents').add({
      jobId, userId,
      type: 'unsafe_behavior',
      description: incidentReport || 'Customer reported feeling unsafe after job.',
      reportedBy: 'user',
      reporterId: userId,
      status: 'open',
      riskLevel: safetyRating === 1 ? 'high' : 'medium',
      evidence: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return feedback;
}

module.exports = {
  calculateRiskScore, generateJobPIN, verifyJobPIN,
  getServiceChecklist, submitServiceSafetyCheck, SERVICE_SAFETY_CHECKLISTS,
  updateJobSafetyState, triggerPanic, checkInactiveJobs, recordSafetyFeedback,
};
