/**
 * Payment Engine — RoadResQ (Week 5)
 *
 * Internal payment escrow and release system.
 * Tracks payment state through the job lifecycle.
 *
 * Payment states: pending -> held -> released | refunded | disputed
 *
 * Firestore collection: `payments`
 *
 * Note: This is an internal ledger. To integrate with a real payment
 * gateway (Stripe, etc.), connect at holdPayment() and releasePayment().
 */

const { db } = require('../config/firebase');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const COLLECTION = 'payments';

// ─── Payment States ───────────────────────────────────────────────────────────

const PAYMENT_STATES = {
  PENDING:   'pending',     // Job created, no payment action yet
  HELD:      'held',        // Payment held in escrow (job accepted by driver)
  RELEASED:  'released',    // Payment released to driver (job completed, no dispute)
  REFUNDED:  'refunded',    // Payment refunded to customer (dispute won by customer)
  DISPUTED:  'disputed',    // Payment frozen due to active dispute
  CANCELLED: 'cancelled',   // Job cancelled, no payment processed
};

// ─── Hold Payment ─────────────────────────────────────────────────────────────

/**
 * Creates a payment record and holds the amount in escrow.
 * Called when a driver accepts a job.
 *
 * @param {string} jobId
 * @param {number} amount — in halala (integer)
 * @param {string} customerId
 * @param {string} driverId
 * @returns {Promise<object>} payment record
 */
async function holdPayment(jobId, amount, customerId, driverId) {
  const payment = {
    jobId,
    customerId,
    driverId,
    amount,                                  // halala integer
    amountDisplay: `QR ${(amount / 100).toFixed(2)}`,
    status: PAYMENT_STATES.HELD,
    heldAt: new Date().toISOString(),
    releasedAt: null,
    refundedAt: null,
    disputedAt: null,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection(COLLECTION).doc(jobId).set(payment);

  await logEvent(EVENT_TYPES.PAYMENT_HELD, {
    entityId: jobId,
    entityType: 'payment',
    actorId: 'system',
    actorRole: 'system',
    details: { amount, customerId, driverId },
  });

  return payment;
}

// ─── Release Payment ──────────────────────────────────────────────────────────

/**
 * Releases the escrowed payment to the driver.
 * Only allowed when:
 *   1. Job status is 'completed'
 *   2. No active dispute exists for this job
 *
 * @param {string} jobId
 * @returns {Promise<{success: boolean, payment?: object, error?: string}>}
 */
async function releasePayment(jobId) {
  const paymentRef = db.collection(COLLECTION).doc(jobId);
  const snap = await paymentRef.get();

  if (!snap.exists) {
    return { success: false, error: 'No payment record found for this job.' };
  }

  const payment = snap.data();

  if (payment.status === PAYMENT_STATES.RELEASED) {
    return { success: true, payment, message: 'Payment already released.' };
  }

  if (payment.status === PAYMENT_STATES.DISPUTED) {
    return { success: false, error: 'Cannot release payment — job has an active dispute.' };
  }

  if (payment.status === PAYMENT_STATES.REFUNDED) {
    return { success: false, error: 'Payment was already refunded.' };
  }

  // Check for active disputes in Firestore
  const disputeSnap = await db.collection('disputes')
    .where('jobId', '==', jobId)
    .where('status', 'in', ['open', 'pending', 'under_review'])
    .limit(1)
    .get();

  if (!disputeSnap.empty) {
    // Mark payment as disputed
    await paymentRef.update({
      status: PAYMENT_STATES.DISPUTED,
      disputedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logEvent(EVENT_TYPES.PAYMENT_DISPUTED, {
      entityId: jobId,
      entityType: 'payment',
      details: { reason: 'Active dispute found during release attempt' },
    });

    return { success: false, error: 'Active dispute detected. Payment moved to disputed state.' };
  }

  // Release payment
  const now = new Date().toISOString();
  await paymentRef.update({
    status: PAYMENT_STATES.RELEASED,
    releasedAt: now,
    updatedAt: now,
  });

  await logEvent(EVENT_TYPES.PAYMENT_RELEASED, {
    entityId: jobId,
    entityType: 'payment',
    actorId: 'system',
    details: { amount: payment.amount, driverId: payment.driverId },
  });

  return { success: true, payment: { ...payment, status: PAYMENT_STATES.RELEASED, releasedAt: now } };
}

// ─── Refund Payment ───────────────────────────────────────────────────────────

/**
 * Refunds the payment to the customer.
 * Used by dispute resolution when customer wins.
 *
 * @param {string} jobId
 * @param {string} reason
 * @param {string} [refundedBy] — 'system' | 'admin'
 * @returns {Promise<{success: boolean, payment?: object, error?: string}>}
 */
async function refundPayment(jobId, reason = 'dispute_resolved', refundedBy = 'system') {
  const paymentRef = db.collection(COLLECTION).doc(jobId);
  const snap = await paymentRef.get();

  if (!snap.exists) {
    return { success: false, error: 'No payment record found.' };
  }

  const payment = snap.data();

  if (payment.status === PAYMENT_STATES.REFUNDED) {
    return { success: true, payment, message: 'Already refunded.' };
  }

  if (payment.status === PAYMENT_STATES.RELEASED) {
    return { success: false, error: 'Payment already released to driver. Manual reversal needed.' };
  }

  const now = new Date().toISOString();
  await paymentRef.update({
    status: PAYMENT_STATES.REFUNDED,
    refundedAt: now,
    refundReason: reason,
    refundedBy,
    updatedAt: now,
  });

  await logEvent(EVENT_TYPES.PAYMENT_REFUNDED, {
    entityId: jobId,
    entityType: 'payment',
    actorId: refundedBy,
    actorRole: refundedBy === 'system' ? 'system' : 'admin',
    details: { amount: payment.amount, reason, customerId: payment.customerId },
  });

  return { success: true, payment: { ...payment, status: PAYMENT_STATES.REFUNDED, refundedAt: now } };
}

// ─── Cancel Payment ───────────────────────────────────────────────────────────

/**
 * Cancels a payment when a job is cancelled before completion.
 */
async function cancelPayment(jobId, cancelledBy = 'system') {
  const paymentRef = db.collection(COLLECTION).doc(jobId);
  const snap = await paymentRef.get();

  if (!snap.exists) return { success: true, message: 'No payment to cancel.' };

  const payment = snap.data();
  if (['released', 'refunded'].includes(payment.status)) {
    return { success: false, error: `Cannot cancel — payment already ${payment.status}.` };
  }

  await paymentRef.update({
    status: PAYMENT_STATES.CANCELLED,
    cancelledAt: new Date().toISOString(),
    cancelledBy,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}

// ─── Get Payment Status ───────────────────────────────────────────────────────

/**
 * Returns the current payment record for a job.
 */
async function getPaymentStatus(jobId) {
  const snap = await db.collection(COLLECTION).doc(jobId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all payments with optional filters.
 */
async function getPayments({ status, driverId, customerId, limit = 50 } = {}) {
  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (status)     query = query.where('status', '==', status);
  if (driverId)   query = query.where('driverId', '==', driverId);
  if (customerId) query = query.where('customerId', '==', customerId);
  query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

module.exports = {
  holdPayment, releasePayment, refundPayment, cancelPayment,
  getPaymentStatus, getPayments, PAYMENT_STATES,
};
