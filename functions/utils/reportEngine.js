/**
 * Report Engine — RoadResQ (Week 5)
 *
 * Generates comprehensive job completion reports.
 * Reports stored permanently in Firestore `reports` collection.
 */

const { db } = require('../config/firebase');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const COLLECTION = 'reports';

/**
 * Builds a chronological timeline from job timestamp fields.
 */
function buildTimeline(job) {
  const events = [];
  const add = (label, ts) => { if (ts) events.push({ event: label, timestamp: ts }); };

  add('Job Created', job.createdAt);
  if (job.isScheduled) add('Scheduled Pickup', `${job.scheduledPickupDate} ${job.scheduledPickupTime || ''}`);
  add('Driver Assigned', job.assignedAt);
  add('Job Accepted', job.acceptedAt);
  add('PIN Verified', job.pinVerifiedAt);
  add('Driver Safety Check', job.driverSafetyCheckAt);
  add('Customer Safety Confirmed', job.customerSafetyConfirmedAt);
  add('Service Safety Check', job.serviceSafetyCheckAt);
  add('Job Started', job.startedAt);
  add('Job Completed', job.completedAt);
  add('Job Cancelled', job.cancelledAt);
  if (job.isPanicTriggered) add('Panic Triggered', job.panicAt);

  events.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  return events;
}

/**
 * Creates a comprehensive job report and stores it permanently.
 */
async function generateJobReport(jobId) {
  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) return { success: false, error: 'Job not found.' };
  const job = jobSnap.data();

  const timeline = buildTimeline(job);

  // Fetch driver info
  let driverInfo = null;
  if (job.driverId) {
    const dSnap = await db.collection('drivers').doc(job.driverId).get();
    if (dSnap.exists) {
      const d = dSnap.data();
      driverInfo = { id: job.driverId, name: d.name, phone: d.phone || null, truckType: d.truckType, vehicleModel: d.vehicleModel || null, rating: d.rating || null, completedJobs: d.completedJobs || 0 };
    }
  }

  // Fetch payment info
  let paymentInfo = null;
  const paySnap = await db.collection('payments').doc(jobId).get();
  if (paySnap.exists) {
    const p = paySnap.data();
    paymentInfo = { amount: p.amount, amountDisplay: p.amountDisplay, status: p.status, heldAt: p.heldAt, releasedAt: p.releasedAt, refundedAt: p.refundedAt };
  } else {
    paymentInfo = { amount: job.price, amountDisplay: job.priceDisplay, status: 'no_record', breakdown: job.pricingBreakdown || null };
  }

  // Fetch safety data
  const [svcSnap, drvSnap, custSnap] = await Promise.all([
    db.collection('safety_checklists').doc(`service_${jobId}`).get(),
    db.collection('safety_checklists').doc(`driver_${jobId}`).get(),
    db.collection('safety_checklists').doc(`customer_${jobId}`).get(),
  ]);
  const safetyData = {
    riskLevel: job.riskLevel || 'low', pinVerified: job.pinVerified || false,
    driverSafetyCheckPassed: job.driverSafetyCheckPassed || false,
    customerSafetyConfirmed: job.customerSafetyConfirmed || false,
    serviceSafetyCheckPassed: job.serviceSafetyCheckPassed || false,
    isPanicTriggered: job.isPanicTriggered || false,
    serviceChecklist: svcSnap.exists ? svcSnap.data() : null,
    driverChecklist: drvSnap.exists ? drvSnap.data() : null,
    customerChecklist: custSnap.exists ? custSnap.data() : null,
  };

  // Fetch disputes
  const dispSnap = await db.collection('disputes').where('jobId', '==', jobId).limit(10).get();
  const disputes = dispSnap.docs.map(d => ({ id: d.id, type: d.data().type, status: d.data().status, decision: d.data().decision || null, createdAt: d.data().createdAt }));

  // Fetch incidents
  const incSnap = await db.collection('incidents').where('jobId', '==', jobId).limit(10).get();
  const incidents = incSnap.docs.map(d => ({ id: d.id, type: d.data().type, status: d.data().status, riskLevel: d.data().riskLevel, createdAt: d.data().createdAt }));

  // Collect photo URLs before cleanup
  const photos = [];
  if (job.completionPhotoUrl) photos.push({ type: 'completion', url: job.completionPhotoUrl });
  if (job.arrivalPhotoUrl) photos.push({ type: 'arrival', url: job.arrivalPhotoUrl });
  (job.customPhotoUrls || []).forEach((u, i) => photos.push({ type: `custom_${i + 1}`, url: u }));
  (job.logisticsPhotoUrls || []).forEach((u, i) => photos.push({ type: `logistics_${i + 1}`, url: u }));

  const now = new Date().toISOString();
  const report = {
    jobId, reportType: 'job_completion', generatedAt: now,
    jobSummary: { serviceType: job.serviceType, vehicleType: job.vehicleType, vehicleModel: job.vehicleModel || null, vehiclePlate: job.vehiclePlate || null, pickup: job.pickup, drop: job.drop, distanceKm: job.distanceKm, isScheduled: job.isScheduled || false, status: job.status, customerNotes: job.customerNotes || null },
    gpsData: { pickupCoords: job.pickupCoords || null, dropCoords: job.dropCoords || null, driverDistanceKm: job.driverDistanceKm || null },
    timeline, driver: driverInfo, payment: paymentInfo, safety: safetyData, photos, disputes, incidents,
    userId: job.userId, driverId: job.driverId || null, createdAt: now,
  };

  await db.collection(COLLECTION).doc(jobId).set(report);
  await db.collection('jobs').doc(jobId).update({ reportId: jobId, reportGeneratedAt: now, updatedAt: now });
  await logEvent(EVENT_TYPES.REPORT_GENERATED, { entityId: jobId, entityType: 'report', details: { photoCount: photos.length, hasDisputes: disputes.length > 0 } });

  return { success: true, report };
}

async function getReportByJobId(jobId) {
  const snap = await db.collection(COLLECTION).doc(jobId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function getReports({ userId, driverId, limit = 20 } = {}) {
  let query = db.collection(COLLECTION).orderBy('generatedAt', 'desc');
  if (userId) query = query.where('userId', '==', userId);
  if (driverId) query = query.where('driverId', '==', driverId);
  query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

module.exports = { generateJobReport, getReportByJobId, getReports, buildTimeline };
