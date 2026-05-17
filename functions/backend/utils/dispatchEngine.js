/**
 * Dispatch Engine — RoadResQ (Week 6 v8.0.0)
 *
 * Real-time dispatch state machine for job assignment.
 *
 * Flow:
 *   1. Job created -> dispatchJob(jobId)
 *   2. Engine finds best drivers via matchingEngine
 *   3. Offers job to top driver (60s timeout)
 *   4. If declined or timeout -> offer to next driver
 *   5. After 3 failed attempts -> expand radius by 5km and retry
 *   6. After 2 radius expansions (max 20km) -> mark as no_driver_available
 *
 * Dispatch states:
 *   searching -> offered -> accepted | declined | timeout -> no_driver_available
 *
 * On accept:
 *   - Hold payment in escrow (wallet)
 *   - Start GPS tracking
 *   - Update job status to 'assigned'
 *
 * Firestore collection: `dispatch_state`
 */

const { db } = require('../config/firebase');
const { findMatchingDrivers } = require('./matchingEngine');
const { holdFunds, getWalletBalance } = require('./walletEngine');
const { holdPayment } = require('./paymentEngine');
const { startJobTracking } = require('./locationEngine');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const DISPATCH_COL = 'dispatch_state';

const DISPATCH_STATES = {
  SEARCHING:          'searching',
  OFFERED:            'offered',
  ACCEPTED:           'accepted',
  DECLINED:           'declined',
  TIMEOUT:            'timeout',
  NO_DRIVER:          'no_driver_available',
  CANCELLED:          'cancelled',
};

const MAX_OFFER_ATTEMPTS = 3;
const OFFER_TIMEOUT_MS = 60 * 1000; // 60 seconds
const INITIAL_RADIUS_KM = 10;
const RADIUS_INCREMENT_KM = 5;
const MAX_RADIUS_KM = 20;

// ─── Dispatch Job ────────────────────────────────────────────────────────────

/**
 * Start the dispatch process for a job.
 *
 * 1. Find matching drivers
 * 2. Create dispatch state
 * 3. Offer to best driver
 *
 * @param {string} jobId
 * @returns {Promise<object>} dispatch state
 */
async function dispatchJob(jobId) {
  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new Error('Job not found');

  const job = jobSnap.data();

  if (!['pending', 'searching'].includes(job.status)) {
    throw new Error(`Cannot dispatch job with status '${job.status}'.`);
  }

  // Find matching drivers
  const currentRadius = INITIAL_RADIUS_KM;
  const matchedDrivers = await findMatchingDrivers({
    ...job,
    radiusKm: currentRadius,
  });

  // Create dispatch state
  const dispatchRef = db.collection(DISPATCH_COL).doc(jobId);
  const dispatchState = {
    jobId,
    status: matchedDrivers.length > 0 ? DISPATCH_STATES.OFFERED : DISPATCH_STATES.NO_DRIVER,
    candidateDrivers: matchedDrivers.slice(0, 10).map(d => ({
      driverId: d.id,
      name: d.name || d.id,
      distanceKm: d._distanceKm,
      etaMinutes: d._eta?.etaMinutes,
      truckType: d.truckType,
    })),
    currentOfferIndex: 0,
    currentDriverId: matchedDrivers.length > 0 ? matchedDrivers[0].id : null,
    offeredAt: matchedDrivers.length > 0 ? new Date().toISOString() : null,
    attempts: 0,
    maxAttempts: MAX_OFFER_ATTEMPTS,
    currentRadius: currentRadius,
    radiusExpansions: 0,
    acceptedBy: null,
    declinedBy: [],
    timeoutDrivers: [],
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dispatchRef.set(dispatchState);

  // Update job status to searching
  await db.collection('jobs').doc(jobId).update({
    status: 'searching',
    dispatchStartedAt: new Date().toISOString(),
  });

  await logEvent(EVENT_TYPES.JOB_CREATED, {
    entityId: jobId,
    entityType: 'dispatch',
    actorId: 'system',
    details: {
      candidateCount: matchedDrivers.length,
      radiusKm: currentRadius,
      offeredTo: matchedDrivers.length > 0 ? matchedDrivers[0].id : null,
    },
  });

  return dispatchState;
}

// ─── Driver Accept ───────────────────────────────────────────────────────────

/**
 * Driver accepts the offered job.
 * Triggers: escrow hold, tracking start, job assignment.
 */
async function handleDriverAccept(jobId, driverId) {
  const dispatchRef = db.collection(DISPATCH_COL).doc(jobId);
  const dispatchSnap = await dispatchRef.get();

  if (!dispatchSnap.exists) throw new Error('No dispatch state found for this job');

  const dispatch = dispatchSnap.data();

  if (dispatch.status !== DISPATCH_STATES.OFFERED) {
    return { success: false, error: `Cannot accept — dispatch status is '${dispatch.status}'.` };
  }

  if (dispatch.currentDriverId !== driverId) {
    return { success: false, error: 'This job is not currently offered to you.' };
  }

  // Get job data
  const jobSnap = await db.collection('jobs').doc(jobId).get();
  const job = jobSnap.data();

  // 1. Hold payment in escrow (payment record)
  let paymentResult = null;
  if (job.totalPrice && job.userId) {
    try {
      paymentResult = await holdPayment(jobId, job.totalPrice, job.userId, driverId);
    } catch (err) {
      console.warn('[Dispatch] Payment hold failed (non-blocking):', err.message);
    }

    // 1b. Also hold in wallet if customer has wallet
    try {
      const walletBalance = await getWalletBalance(job.userId);
      if (walletBalance.availableBalance >= job.totalPrice) {
        await holdFunds(job.userId, job.totalPrice, jobId);
      }
    } catch (err) {
      console.warn('[Dispatch] Wallet hold failed (non-blocking):', err.message);
    }
  }

  // 2. Start GPS tracking
  let trackingResult = null;
  if (job.pickupLat && job.pickupLng) {
    try {
      trackingResult = await startJobTracking(
        jobId, driverId,
        job.pickupLat, job.pickupLng,
        job.dropoffLat, job.dropoffLng
      );
    } catch (err) {
      console.warn('[Dispatch] Tracking start failed (non-blocking):', err.message);
    }
  }

  // 3. Update job status
  const now = new Date().toISOString();
  await db.collection('jobs').doc(jobId).update({
    status: 'assigned',
    driverId,
    assignedAt: now,
    autoAssigned: true,
  });

  // 4. Mark driver as unavailable
  await db.collection('drivers').doc(driverId).update({
    isAvailable: false,
    activeJobId: jobId,
  });

  // 5. Update dispatch state
  await dispatchRef.update({
    status: DISPATCH_STATES.ACCEPTED,
    acceptedBy: driverId,
    acceptedAt: now,
    updatedAt: now,
  });

  await logEvent(EVENT_TYPES.JOB_CREATED, {
    entityId: jobId,
    entityType: 'dispatch',
    actorId: driverId,
    actorRole: 'driver',
    details: { action: 'ACCEPTED', paymentHeld: !!paymentResult, trackingStarted: !!trackingResult },
  });

  return {
    success: true,
    message: 'Job accepted successfully.',
    jobId,
    driverId,
    paymentHeld: !!paymentResult,
    trackingStarted: !!trackingResult,
  };
}

// ─── Driver Decline ──────────────────────────────────────────────────────────

/**
 * Driver declines the offered job. System moves to next candidate.
 */
async function handleDriverDecline(jobId, driverId, reason = 'Declined by driver') {
  const dispatchRef = db.collection(DISPATCH_COL).doc(jobId);
  const dispatchSnap = await dispatchRef.get();

  if (!dispatchSnap.exists) throw new Error('No dispatch state found');
  const dispatch = dispatchSnap.data();

  if (dispatch.currentDriverId !== driverId) {
    return { success: false, error: 'This job is not currently offered to you.' };
  }

  const declinedBy = [...(dispatch.declinedBy || []), driverId];
  const nextIndex = dispatch.currentOfferIndex + 1;
  const attempts = dispatch.attempts + 1;
  const now = new Date().toISOString();

  // Check if there are more candidates
  if (nextIndex < dispatch.candidateDrivers.length && attempts < MAX_OFFER_ATTEMPTS) {
    const nextDriver = dispatch.candidateDrivers[nextIndex];

    await dispatchRef.update({
      currentOfferIndex: nextIndex,
      currentDriverId: nextDriver.driverId,
      offeredAt: now,
      attempts,
      declinedBy,
      status: DISPATCH_STATES.OFFERED,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Driver ${driverId} declined. Offering to next driver: ${nextDriver.driverId}.`,
      nextDriver: nextDriver.driverId,
    };
  }

  // No more candidates — try expanding radius
  const newRadius = dispatch.currentRadius + RADIUS_INCREMENT_KM;
  if (newRadius <= MAX_RADIUS_KM) {
    // Re-search with expanded radius
    const jobSnap = await db.collection('jobs').doc(jobId).get();
    const job = jobSnap.data();

    const newMatches = await findMatchingDrivers({
      ...job,
      radiusKm: newRadius,
    });

    // Filter out already-declined drivers
    const freshDrivers = newMatches.filter(d => !declinedBy.includes(d.id));

    if (freshDrivers.length > 0) {
      await dispatchRef.update({
        candidateDrivers: freshDrivers.slice(0, 10).map(d => ({
          driverId: d.id,
          name: d.name || d.id,
          distanceKm: d._distanceKm,
          etaMinutes: d._eta?.etaMinutes,
          truckType: d.truckType,
        })),
        currentOfferIndex: 0,
        currentDriverId: freshDrivers[0].id,
        offeredAt: now,
        currentRadius: newRadius,
        radiusExpansions: dispatch.radiusExpansions + 1,
        attempts: 0,
        declinedBy,
        status: DISPATCH_STATES.OFFERED,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Radius expanded to ${newRadius}km. Found ${freshDrivers.length} new drivers.`,
        nextDriver: freshDrivers[0].id,
        radiusKm: newRadius,
      };
    }
  }

  // No drivers available at all
  await dispatchRef.update({
    status: DISPATCH_STATES.NO_DRIVER,
    declinedBy,
    updatedAt: now,
  });

  await db.collection('jobs').doc(jobId).update({
    status: 'no_driver_available',
    updatedAt: now,
  });

  return {
    success: false,
    message: 'No drivers available. All candidates declined or out of range.',
    status: DISPATCH_STATES.NO_DRIVER,
  };
}

// ─── Cancel Dispatch ─────────────────────────────────────────────────────────

/**
 * Cancel the dispatch process.
 */
async function cancelDispatch(jobId, reason = 'Cancelled', cancelledBy = 'system') {
  const dispatchRef = db.collection(DISPATCH_COL).doc(jobId);
  const snap = await dispatchRef.get();

  if (!snap.exists) return { success: false, error: 'No dispatch state found.' };

  const dispatch = snap.data();
  if (['accepted', 'completed'].includes(dispatch.status)) {
    return { success: false, error: `Cannot cancel dispatch with status '${dispatch.status}'.` };
  }

  const now = new Date().toISOString();
  await dispatchRef.update({
    status: DISPATCH_STATES.CANCELLED,
    cancelledAt: now,
    cancelReason: reason,
    updatedAt: now,
  });

  await db.collection('jobs').doc(jobId).update({
    status: 'cancelled',
    cancelledAt: now,
    cancelReason: reason,
  });

  return { success: true, message: 'Dispatch cancelled.' };
}

// ─── Get Dispatch Status ─────────────────────────────────────────────────────

/**
 * Get current dispatch state for a job.
 */
async function getDispatchStatus(jobId) {
  const snap = await db.collection(DISPATCH_COL).doc(jobId).get();
  if (!snap.exists) return null;

  const dispatch = snap.data();

  // Check for offer timeout
  if (dispatch.status === DISPATCH_STATES.OFFERED && dispatch.offeredAt) {
    const elapsed = Date.now() - new Date(dispatch.offeredAt).getTime();
    if (elapsed > OFFER_TIMEOUT_MS) {
      dispatch.offerTimedOut = true;
      dispatch.timeoutSeconds = Math.round(elapsed / 1000);
    }
  }

  return { id: snap.id, ...dispatch };
}

module.exports = {
  dispatchJob,
  handleDriverAccept,
  handleDriverDecline,
  cancelDispatch,
  getDispatchStatus,
  DISPATCH_STATES,
};
