/**
 * Incident Model — RoadResQ Safety Dashboard
 *
 * Covers: unsafe behavior, fraud, delay, damage, no-show,
 *         panic button triggers, and admin complaints.
 */

const { db } = require('../config/firebase');
const COLLECTION = 'incidents';

const INCIDENT_TYPES = [
  'unsafe_behavior', 'fraud', 'delay', 'damage',
  'no_show', 'wrong_service', 'overcharging', 'panic_triggered',
];

const INCIDENT_STATUS = ['open', 'under_review', 'resolved', 'escalated'];

/**
 * Build a new incident document.
 */
function buildIncidentDocument(data) {
  return {
    jobId:        data.jobId || null,
    type:         data.type || 'unsafe_behavior',     // INCIDENT_TYPES
    description:  data.description || '',
    reportedBy:   data.reportedBy || 'user',          // user | driver | admin | system
    reporterId:   data.reporterId || null,
    driverId:     data.driverId || null,
    userId:       data.userId || null,
    garageId:     data.garageId || null,
    status:       'open',
    riskLevel:    data.riskLevel || 'medium',         // low | medium | high | critical
    evidence: {
      photos:           data.photos || [],
      gpsLog:           data.gpsLog || null,
      pinVerified:      data.pinVerified || false,
      photosUploaded:   data.photosUploaded || false,
      arrivalTime:      data.arrivalTime || null,
      completionTime:   data.completionTime || null,
      priceDeviation:   data.priceDeviation || null,  // ratio: actual/estimated
    },
    adminAction:  null,   // warn | suspend | ban | resolve | escalate
    adminNotes:   null,
    adminId:      null,
    resolvedAt:   null,
    fraudScore:   data.fraudScore || 0,
    isPanicAlert: data.isPanicAlert || false,
    location:     data.location || null,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };
}

async function createIncident(data) {
  const doc = buildIncidentDocument(data);
  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, ...doc };
}

async function getIncidentById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function listIncidents({ status, type, riskLevel, jobId, limit = 50 } = {}) {
  let q = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (status)    q = q.where('status', '==', status);
  if (type)      q = q.where('type', '==', type);
  if (riskLevel) q = q.where('riskLevel', '==', riskLevel);
  if (jobId)     q = q.where('jobId', '==', jobId);
  q = q.limit(parseInt(limit));
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateIncident(id, updates) {
  updates.updatedAt = new Date().toISOString();
  await db.collection(COLLECTION).doc(id).update(updates);
  return getIncidentById(id);
}

module.exports = {
  buildIncidentDocument, createIncident, getIncidentById,
  listIncidents, updateIncident, INCIDENT_TYPES, INCIDENT_STATUS,
};
