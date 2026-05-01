/**
 * Dispute Model — RoadResQ Automated Dispute Resolution (ADR)
 *
 * Types: overcharging, service_not_completed, delay, wrong_service,
 *        damage, no_show, fraud
 */

const { db } = require('../config/firebase');
const COLLECTION = 'disputes';

const DISPUTE_TYPES = [
  'overcharging', 'service_not_completed', 'delay',
  'wrong_service', 'damage', 'no_show', 'fraud',
];

const DISPUTE_OUTCOMES = [
  'refund_user', 'partial_refund', 'charge_user',
  'pay_driver', 'warning_issued', 'escalate', 'no_action',
];

function buildDisputeDocument(data) {
  return {
    jobId:       data.jobId,
    type:        data.type,               // DISPUTE_TYPES
    description: data.description || '',
    reportedBy:  data.reportedBy,         // user | driver | garage
    reporterId:  data.reporterId,
    driverId:    data.driverId || null,
    userId:      data.userId || null,
    garageId:    data.garageId || null,
    status:      'pending',               // pending | auto_resolved | escalated | closed
    evidence: {
      arrivedOnTime:    data.arrivedOnTime    ?? null,
      jobCompleted:     data.jobCompleted     ?? null,
      pinVerified:      data.pinVerified      ?? false,
      photosUploaded:   data.photosUploaded   ?? false,
      priceDeviation:   data.priceDeviation   ?? null,   // ratio
      driverMovement:   data.driverMovement   ?? null,   // gps trace summary
    },
    decision:    null,       // DISPUTE_OUTCOMES
    confidence:  null,       // 0-100
    autoResolved: false,
    adminOverride: null,
    adminId:     null,
    adminNotes:  null,
    paymentAction: null,     // hold | release | refund
    resolvedAt:  null,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
}

async function createDispute(data) {
  const doc = buildDisputeDocument(data);
  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, ...doc };
}

async function getDisputeById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function listDisputes({ status, type, reportedBy, limit = 50 } = {}) {
  let q = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (status)     q = q.where('status', '==', status);
  if (type)       q = q.where('type', '==', type);
  if (reportedBy) q = q.where('reportedBy', '==', reportedBy);
  q = q.limit(parseInt(limit));
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateDispute(id, updates) {
  updates.updatedAt = new Date().toISOString();
  await db.collection(COLLECTION).doc(id).update(updates);
  return getDisputeById(id);
}

module.exports = {
  buildDisputeDocument, createDispute, getDisputeById,
  listDisputes, updateDispute, DISPUTE_TYPES, DISPUTE_OUTCOMES,
};
