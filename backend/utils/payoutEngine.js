/**
 * Payout Engine — RoadResQ (Week 6 v8.0.0)
 *
 * Handles driver payout requests (wallet to bank account).
 *
 * Flow:
 *   1. Driver requests payout (POST /api/payouts/request)
 *   2. System validates: minimum QR 50, cooldown 24h, sufficient balance
 *   3. Admin reviews pending payouts (GET /api/payouts/pending)
 *   4. Admin approves or rejects (POST /api/payouts/:id/approve | reject)
 *   5. On approval: wallet is debited, payout status = 'completed'
 *
 * Payout states: pending -> approved -> completed | rejected
 *
 * Firestore collection: `payouts`
 */

const { db } = require('../config/firebase');
const { withdrawFunds, getWalletBalance } = require('./walletEngine');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const PAYOUTS_COL = 'payouts';
const MIN_PAYOUT_HALALA = 5000;       // QR 50 minimum
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const PAYOUT_STATES = {
  PENDING:   'pending',
  APPROVED:  'approved',
  COMPLETED: 'completed',
  REJECTED:  'rejected',
};

// ─── Request Payout ──────────────────────────────────────────────────────────

/**
 * Driver requests a payout from their wallet balance to bank.
 *
 * @param {string} driverId
 * @param {number} amount — in halala
 * @param {object} bankDetails — { bankName, accountNumber, iban }
 * @returns {Promise<{success, payout?, error?}>}
 */
async function requestPayout(driverId, amount, bankDetails = {}) {
  // Validate minimum amount
  if (amount < MIN_PAYOUT_HALALA) {
    return {
      success: false,
      error: `Minimum payout is QR ${(MIN_PAYOUT_HALALA / 100).toFixed(2)}. Requested: QR ${(amount / 100).toFixed(2)}.`,
    };
  }

  // Check wallet balance
  const balance = await getWalletBalance(driverId);
  if (balance.availableBalance < amount) {
    return {
      success: false,
      error: `Insufficient balance. Available: QR ${(balance.availableBalance / 100).toFixed(2)}, Requested: QR ${(amount / 100).toFixed(2)}.`,
    };
  }

  // Check 24-hour cooldown
  const recentPayout = await db.collection(PAYOUTS_COL)
    .where('driverId', '==', driverId)
    .where('status', 'in', ['pending', 'approved', 'completed'])
    .orderBy('requestedAt', 'desc')
    .limit(1)
    .get();

  if (!recentPayout.empty) {
    const lastPayout = recentPayout.docs[0].data();
    const timeSince = Date.now() - new Date(lastPayout.requestedAt).getTime();
    if (timeSince < COOLDOWN_MS) {
      const hoursLeft = Math.ceil((COOLDOWN_MS - timeSince) / (60 * 60 * 1000));
      return {
        success: false,
        error: `Payout cooldown active. You can request again in ${hoursLeft} hour(s).`,
      };
    }
  }

  // Create payout request
  const payoutRef = db.collection(PAYOUTS_COL).doc();
  const payout = {
    driverId,
    amount,
    amountDisplay: `QR ${(amount / 100).toFixed(2)}`,
    bankDetails: {
      bankName: bankDetails.bankName || 'Not specified',
      accountNumber: bankDetails.accountNumber || 'Not specified',
      iban: bankDetails.iban || 'Not specified',
    },
    status: PAYOUT_STATES.PENDING,
    requestedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    completedAt: null,
  };

  await payoutRef.set(payout);

  await logEvent(EVENT_TYPES.ADMIN_ACTION, {
    entityId: payoutRef.id,
    entityType: 'payout',
    actorId: driverId,
    actorRole: 'driver',
    details: { action: 'PAYOUT_REQUESTED', amount },
  });

  return { success: true, payout: { id: payoutRef.id, ...payout } };
}

// ─── Approve Payout ──────────────────────────────────────────────────────────

/**
 * Admin approves a payout request. Debits the driver's wallet.
 *
 * @param {string} payoutId
 * @param {string} approvedBy — admin user ID
 * @returns {Promise<{success, payout?, error?}>}
 */
async function approvePayout(payoutId, approvedBy = 'admin') {
  const payoutRef = db.collection(PAYOUTS_COL).doc(payoutId);
  const snap = await payoutRef.get();

  if (!snap.exists) return { success: false, error: 'Payout request not found.' };

  const payout = snap.data();

  if (payout.status !== PAYOUT_STATES.PENDING) {
    return { success: false, error: `Cannot approve payout with status '${payout.status}'.` };
  }

  // Re-verify balance
  const balance = await getWalletBalance(payout.driverId);
  if (balance.availableBalance < payout.amount) {
    return {
      success: false,
      error: `Driver no longer has sufficient balance. Available: QR ${(balance.availableBalance / 100).toFixed(2)}.`,
    };
  }

  // Debit wallet
  try {
    await withdrawFunds(payout.driverId, payout.amount, `Payout approved: ${payoutId}`);
  } catch (err) {
    return { success: false, error: `Wallet debit failed: ${err.message}` };
  }

  // Update payout status
  const now = new Date().toISOString();
  await payoutRef.update({
    status: PAYOUT_STATES.COMPLETED,
    reviewedAt: now,
    reviewedBy: approvedBy,
    completedAt: now,
  });

  await logEvent(EVENT_TYPES.PAYMENT_RELEASED, {
    entityId: payoutId,
    entityType: 'payout',
    actorId: approvedBy,
    actorRole: 'admin',
    details: { driverId: payout.driverId, amount: payout.amount, action: 'PAYOUT_APPROVED' },
  });

  return { success: true, payout: { id: payoutId, ...payout, status: PAYOUT_STATES.COMPLETED } };
}

// ─── Reject Payout ───────────────────────────────────────────────────────────

/**
 * Admin rejects a payout request.
 */
async function rejectPayout(payoutId, reason = 'Rejected by admin', rejectedBy = 'admin') {
  const payoutRef = db.collection(PAYOUTS_COL).doc(payoutId);
  const snap = await payoutRef.get();

  if (!snap.exists) return { success: false, error: 'Payout request not found.' };

  const payout = snap.data();
  if (payout.status !== PAYOUT_STATES.PENDING) {
    return { success: false, error: `Cannot reject payout with status '${payout.status}'.` };
  }

  const now = new Date().toISOString();
  await payoutRef.update({
    status: PAYOUT_STATES.REJECTED,
    reviewedAt: now,
    reviewedBy: rejectedBy,
    rejectionReason: reason,
  });

  await logEvent(EVENT_TYPES.ADMIN_ACTION, {
    entityId: payoutId,
    entityType: 'payout',
    actorId: rejectedBy,
    actorRole: 'admin',
    details: { driverId: payout.driverId, amount: payout.amount, reason, action: 'PAYOUT_REJECTED' },
  });

  return { success: true, message: 'Payout rejected.', payoutId };
}

// ─── Read Operations ─────────────────────────────────────────────────────────

/**
 * Get all pending payouts (admin view).
 */
async function getPendingPayouts(limit = 50) {
  const snap = await db.collection(PAYOUTS_COL)
    .where('status', '==', PAYOUT_STATES.PENDING)
    .orderBy('requestedAt', 'asc')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get payout history for a specific driver.
 */
async function getPayoutHistory(driverId, limit = 50) {
  const snap = await db.collection(PAYOUTS_COL)
    .where('driverId', '==', driverId)
    .orderBy('requestedAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get a single payout by ID.
 */
async function getPayoutById(payoutId) {
  const snap = await db.collection(PAYOUTS_COL).doc(payoutId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

module.exports = {
  requestPayout,
  approvePayout,
  rejectPayout,
  getPendingPayouts,
  getPayoutHistory,
  getPayoutById,
  PAYOUT_STATES,
  MIN_PAYOUT_HALALA,
};
