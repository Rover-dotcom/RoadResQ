/**
 * Dispute Controller — RoadResQ ADR (Automated Dispute Resolution)
 *
 * POST /api/disputes                  - Submit a dispute
 * GET  /api/disputes                  - List disputes (admin)
 * GET  /api/disputes/:id              - Get dispute detail
 * PUT  /api/disputes/:id/resolve      - Auto or admin resolve
 * GET  /api/disputes/my/:userId       - User's own disputes
 */

const { createDispute, getDisputeById, listDisputes, updateDispute, DISPUTE_TYPES } = require('../models/disputeModel');
const { db } = require('../config/firebase');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail    = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// ─── Decision Engine ──────────────────────────────────────────────────────────

/**
 * Rule-based ADR decision engine.
 * Returns { decision, confidence, autoResolved }
 */
function runDecisionEngine(dispute, job = {}) {
  const ev = dispute.evidence || {};
  let decision = null;
  let confidence = 0;

  // CASE 1: Service not completed + no proof
  if (dispute.type === 'service_not_completed') {
    if (!ev.jobCompleted && !ev.photosUploaded) {
      decision = 'refund_user'; confidence = 90;
    } else if (!ev.jobCompleted && ev.photosUploaded) {
      decision = 'escalate'; confidence = 50;
    } else {
      decision = 'no_action'; confidence = 70;
    }
  }

  // CASE 2: Overcharging
  else if (dispute.type === 'overcharging') {
    if (ev.priceDeviation && ev.priceDeviation > 1.5) {
      decision = ev.priceDeviation > 2 ? 'refund_user' : 'partial_refund';
      confidence = 85;
    } else {
      decision = 'no_action'; confidence = 75;
    }
  }

  // CASE 3: Driver no-show
  else if (dispute.type === 'no_show' && dispute.reportedBy === 'user') {
    if (!ev.arrivedOnTime) {
      decision = 'penalize_driver' || 'refund_user'; confidence = 88;
      decision = 'refund_user';
    } else {
      decision = 'escalate'; confidence = 55;
    }
  }

  // CASE 4: User no-show
  else if (dispute.type === 'no_show' && dispute.reportedBy === 'driver') {
    decision = 'charge_user'; confidence = 80;
  }

  // CASE 5: Delay
  else if (dispute.type === 'delay') {
    decision = 'partial_refund'; confidence = 70;
  }

  // CASE 6: Damage
  else if (dispute.type === 'damage') {
    decision = ev.photosUploaded ? 'escalate' : 'escalate';
    confidence = 60;
  }

  // DEFAULT
  else {
    decision = 'escalate'; confidence = 40;
  }

  const autoResolved = confidence >= 80;
  return { decision, confidence, autoResolved };
}

// ─── POST /api/disputes ───────────────────────────────────────────────────────
const submitDispute = async (req, res) => {
  const { jobId, type, description, reportedBy, reporterId } = req.body;
  if (!jobId || !type || !reportedBy) {
    return fail(res, 'jobId, type, and reportedBy are required.');
  }
  if (!DISPUTE_TYPES.includes(type)) {
    return fail(res, `Invalid type. Use: ${DISPUTE_TYPES.join(' | ')}`);
  }

  try {
    // Fetch job evidence automatically
    const jobSnap = await db.collection('jobs').doc(jobId).get();
    let jobData = {};
    if (jobSnap.exists) {
      jobData = jobSnap.data();
      req.body.arrivedOnTime    = !!jobData.driverArrivedAt;
      req.body.jobCompleted     = jobData.status === 'completed';
      req.body.pinVerified      = !!jobData.pinVerified;
      req.body.photosUploaded   = !!(jobData.completionPhotoUrl || jobData.arrivalPhotoUrl);
      req.body.driverId         = req.body.driverId || jobData.assignedDriver;
      req.body.userId           = req.body.userId   || jobData.userId;
      // Price deviation
      if (jobData.price && jobData.estimatedPrice) {
        req.body.priceDeviation = jobData.price / jobData.estimatedPrice;
      }
    }

    const dispute = await createDispute(req.body);

    // Run decision engine immediately
    const { decision, confidence, autoResolved } = runDecisionEngine(dispute, jobData);
    const updates = {
      decision, confidence, autoResolved,
      paymentAction: autoResolved ? (decision === 'refund_user' ? 'refund' : 'hold') : 'hold',
      status: autoResolved ? 'auto_resolved' : 'pending',
      resolvedAt: autoResolved ? new Date().toISOString() : null,
    };
    const resolved = await updateDispute(dispute.id, updates);

    return success(res, { dispute: resolved, decisionEngine: { decision, confidence, autoResolved } }, 201);
  } catch (err) {
    console.error('submitDispute:', err);
    return fail(res, 'Failed to submit dispute.', 500);
  }
};

// ─── GET /api/disputes ────────────────────────────────────────────────────────
const getDisputes = async (req, res) => {
  try {
    const { status, type, reportedBy, limit } = req.query;
    const disputes = await listDisputes({ status, type, reportedBy, limit });
    return success(res, { disputes, count: disputes.length });
  } catch (err) {
    return fail(res, 'Failed to list disputes.', 500);
  }
};

// ─── GET /api/disputes/:id ────────────────────────────────────────────────────
const getDisputeDetail = async (req, res) => {
  try {
    const dispute = await getDisputeById(req.params.id);
    if (!dispute) return fail(res, 'Dispute not found.', 404);
    return success(res, { dispute });
  } catch (err) {
    return fail(res, 'Failed to get dispute.', 500);
  }
};

// ─── GET /api/disputes/my/:userId ─────────────────────────────────────────────
const getMyDisputes = async (req, res) => {
  try {
    const snap = await db.collection('disputes')
      .where('reporterId', '==', req.params.userId)
      .orderBy('createdAt', 'desc').limit(20).get();
    const disputes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return success(res, { disputes, count: disputes.length });
  } catch (err) {
    return fail(res, 'Failed to fetch your disputes.', 500);
  }
};

// ─── PUT /api/disputes/:id/resolve ────────────────────────────────────────────
// Admin can approve or override the auto decision
const resolveDispute = async (req, res) => {
  const { adminDecision, adminId, adminNotes } = req.body;
  if (!adminDecision) return fail(res, 'adminDecision is required.');
  try {
    const updates = {
      adminOverride: adminDecision,
      adminId:       adminId || null,
      adminNotes:    adminNotes || null,
      status:        'closed',
      resolvedAt:    new Date().toISOString(),
    };
    const dispute = await updateDispute(req.params.id, updates);
    return success(res, { dispute });
  } catch (err) {
    return fail(res, 'Failed to resolve dispute.', 500);
  }
};

// ─── PUT /api/disputes/:id/evidence ───────────────────────────────────────────
// Add evidence (photo URLs, notes, chat logs) to a dispute
const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const dispute = await getDisputeById(id);
    if (!dispute) return fail(res, 'Dispute not found.', 404);

    const { photoUrls, notes, chatLogs } = req.body;
    if (!photoUrls && !notes && !chatLogs) {
      return fail(res, 'Provide photoUrls, notes, or chatLogs.');
    }

    const existingEvidence = dispute.evidence || {};
    const updatedEvidence = {
      ...existingEvidence,
      photoUrls: [...(existingEvidence.photoUrls || []), ...(photoUrls || [])],
      notes: [...(existingEvidence.notes || []), ...(notes ? [{ text: notes, addedAt: new Date().toISOString(), addedBy: req.user?.uid || 'unknown' }] : [])],
      chatLogs: [...(existingEvidence.chatLogs || []), ...(chatLogs || [])],
      photosUploaded: true,
      lastUpdatedAt: new Date().toISOString(),
    };

    // Add to timeline
    const timeline = dispute.timeline || [];
    timeline.push({
      action: 'evidence_added',
      addedBy: req.user?.uid || 'unknown',
      timestamp: new Date().toISOString(),
      details: `Added ${(photoUrls || []).length} photos, ${notes ? '1 note' : '0 notes'}`,
    });

    const updated = await updateDispute(id, { evidence: updatedEvidence, timeline });
    return success(res, { dispute: updated });
  } catch (err) {
    return fail(res, 'Failed to add evidence.', 500);
  }
};

// ─── GET /api/disputes/:id/timeline ───────────────────────────────────────────
const getDisputeTimeline = async (req, res) => {
  try {
    const dispute = await getDisputeById(req.params.id);
    if (!dispute) return fail(res, 'Dispute not found.', 404);
    return success(res, { timeline: dispute.timeline || [], disputeId: req.params.id });
  } catch (err) {
    return fail(res, 'Failed to get timeline.', 500);
  }
};

// ─── POST /api/disputes/:id/hold-escrow ───────────────────────────────────────
// Place funds in escrow during dispute
const holdEscrowForDispute = async (req, res) => {
  try {
    const dispute = await getDisputeById(req.params.id);
    if (!dispute) return fail(res, 'Dispute not found.', 404);

    // Mark as escrow held
    const timeline = dispute.timeline || [];
    timeline.push({
      action: 'escrow_held',
      addedBy: req.user?.uid || 'admin',
      timestamp: new Date().toISOString(),
      details: 'Funds held in escrow pending dispute resolution',
    });

    const updated = await updateDispute(req.params.id, {
      escrowHeld: true,
      escrowHeldAt: new Date().toISOString(),
      escrowHeldBy: req.user?.uid || 'admin',
      timeline,
    });

    return success(res, { dispute: updated, message: 'Escrow held for dispute.' });
  } catch (err) {
    return fail(res, 'Failed to hold escrow.', 500);
  }
};

module.exports = {
  submitDispute, getDisputes, getDisputeDetail, getMyDisputes, resolveDispute,
  addEvidence, getDisputeTimeline, holdEscrowForDispute,
};
