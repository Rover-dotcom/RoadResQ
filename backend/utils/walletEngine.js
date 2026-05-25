/**
 * Wallet Engine — RoadResQ v9.0.0 (Week 6 base + Week 7 idempotency)
 *
 * Full double-entry ledger for drivers, customers, and garages.
 *
 * Week 7 additions:
 *   - Idempotency key support (prevents duplicate operations)
 *   - Amount limits (max deposit QR 10,000, max withdrawal QR 5,000)
 *   - checkIdempotency / saveIdempotencyKey helpers
 */

const { db } = require('../config/firebase');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const WALLETS_COL = 'wallets';
const TRANSACTIONS_COL = 'wallet_transactions';
const IDEMPOTENCY_COL = 'idempotency_keys';
const CURRENCY = 'QAR';

// ─── Week 7: Amount Limits ───────────────────────────────────────────────────
const MAX_DEPOSIT    = 1000000;  // QR 10,000 in fils
const MAX_WITHDRAWAL = 500000;   // QR 5,000 in fils
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Week 7: Idempotency ────────────────────────────────────────────────────

async function checkIdempotency(key) {
  if (!key) return null;
  const snap = await db.collection(IDEMPOTENCY_COL).doc(key).get();
  if (!snap.exists) return null;
  const data = snap.data();
  // Check TTL
  const age = Date.now() - new Date(data.createdAt).getTime();
  if (age > IDEMPOTENCY_TTL_MS) {
    await db.collection(IDEMPOTENCY_COL).doc(key).delete();
    return null;
  }
  return data.result;
}

async function saveIdempotencyKey(key, result) {
  if (!key) return;
  await db.collection(IDEMPOTENCY_COL).doc(key).set({
    result,
    createdAt: new Date().toISOString(),
  });
}


// ─── Get or Create Wallet ────────────────────────────────────────────────────

/**
 * Returns existing wallet or creates a new one with zero balance.
 *
 * @param {string} userId
 * @param {string} role — 'customer' | 'driver' | 'garage' | 'admin'
 * @returns {Promise<object>} wallet document
 */
async function getOrCreateWallet(userId, role = 'customer') {
  const ref = db.collection(WALLETS_COL).doc(userId);
  const snap = await ref.get();

  if (snap.exists) return { id: snap.id, ...snap.data() };

  const wallet = {
    userId,
    role,
    availableBalance: 0,   // halala (1 QAR = 100 halala)
    heldBalance: 0,         // held in escrow
    totalEarned: 0,         // lifetime credits
    totalSpent: 0,          // lifetime debits
    totalWithdrawn: 0,      // lifetime payouts
    currency: CURRENCY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ref.set(wallet);
  return { id: userId, ...wallet };
}

// ─── Internal Transaction Writer ─────────────────────────────────────────────

/**
 * Atomically updates wallet balance and writes a transaction record.
 * Uses Firestore transaction for consistency.
 */
async function writeTransaction(userId, type, amount, reason, refJobId = null) {
  if (amount <= 0) throw new Error('Transaction amount must be positive');

  return db.runTransaction(async (txn) => {
    const walletRef = db.collection(WALLETS_COL).doc(userId);
    const walletSnap = await txn.get(walletRef);

    if (!walletSnap.exists) {
      throw new Error(`Wallet not found for user ${userId}. Call getOrCreateWallet first.`);
    }

    const wallet = walletSnap.data();
    const balanceBefore = wallet.availableBalance;
    const heldBefore = wallet.heldBalance;
    const now = new Date().toISOString();

    let availableDelta = 0;
    let heldDelta = 0;
    let earnedDelta = 0;
    let spentDelta = 0;
    let withdrawnDelta = 0;

    switch (type) {
      case 'DEPOSIT':
        availableDelta = amount;
        break;

      case 'DEBIT':
        if (wallet.availableBalance < amount) {
          throw new Error(`Insufficient balance. Available: ${wallet.availableBalance}, Required: ${amount}`);
        }
        availableDelta = -amount;
        spentDelta = amount;
        break;

      case 'CREDIT':
        availableDelta = amount;
        earnedDelta = amount;
        break;

      case 'HOLD':
        if (wallet.availableBalance < amount) {
          throw new Error(`Insufficient balance to hold. Available: ${wallet.availableBalance}, Required: ${amount}`);
        }
        availableDelta = -amount;
        heldDelta = amount;
        break;

      case 'RELEASE':
        if (wallet.heldBalance < amount) {
          throw new Error(`Insufficient held balance. Held: ${wallet.heldBalance}, Required: ${amount}`);
        }
        heldDelta = -amount;
        availableDelta = amount;
        earnedDelta = amount;
        break;

      case 'REFUND':
        // Refund from held back to available (customer refund)
        availableDelta = amount;
        break;

      case 'WITHDRAWAL':
        if (wallet.availableBalance < amount) {
          throw new Error(`Insufficient balance to withdraw. Available: ${wallet.availableBalance}, Required: ${amount}`);
        }
        availableDelta = -amount;
        withdrawnDelta = amount;
        break;

      case 'BONUS':
        availableDelta = amount;
        earnedDelta = amount;
        break;

      case 'PENALTY':
        availableDelta = -Math.min(amount, wallet.availableBalance);
        break;

      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }

    const balanceAfter = wallet.availableBalance + availableDelta;
    const heldAfter = wallet.heldBalance + heldDelta;

    // Update wallet
    txn.update(walletRef, {
      availableBalance: balanceAfter,
      heldBalance: heldAfter,
      totalEarned: wallet.totalEarned + earnedDelta,
      totalSpent: wallet.totalSpent + spentDelta,
      totalWithdrawn: wallet.totalWithdrawn + withdrawnDelta,
      updatedAt: now,
    });

    // Write transaction record
    const txnRef = db.collection(TRANSACTIONS_COL).doc();
    const transaction = {
      walletId: userId,
      type,
      amount,
      amountDisplay: `QR ${(amount / 100).toFixed(2)}`,
      balanceBefore,
      balanceAfter,
      heldBefore,
      heldAfter,
      reason,
      refJobId,
      currency: CURRENCY,
      createdAt: now,
    };
    txn.set(txnRef, transaction);

    return { transactionId: txnRef.id, ...transaction };
  });
}

// ─── Public Operations ───────────────────────────────────────────────────────

/**
 * Add funds to a wallet (customer tops up).
 */
async function depositFunds(userId, amount, reason = 'Wallet top-up', idempotencyKey = null) {
  // Week 7: Amount limit
  if (amount > MAX_DEPOSIT) {
    throw new Error(`Deposit exceeds maximum of QR ${(MAX_DEPOSIT / 100).toFixed(2)}`);
  }

  // Week 7: Idempotency check
  const cached = await checkIdempotency(idempotencyKey);
  if (cached) return { ...cached, idempotent: true };

  await getOrCreateWallet(userId);
  const txn = await writeTransaction(userId, 'DEPOSIT', amount, reason);

  await logEvent(EVENT_TYPES.PAYMENT_HELD, {
    entityId: userId,
    entityType: 'wallet',
    actorId: userId,
    details: { type: 'DEPOSIT', amount, reason },
  });

  // Week 7: Save idempotency key
  await saveIdempotencyKey(idempotencyKey, txn);

  return txn;
}

/**
 * Debit customer wallet when job is dispatched (escrow hold).
 */
async function holdFunds(userId, amount, refJobId) {
  await getOrCreateWallet(userId, 'customer');
  const txn = await writeTransaction(userId, 'HOLD', amount, 'Escrow hold for job', refJobId);

  await logEvent(EVENT_TYPES.PAYMENT_HELD, {
    entityId: refJobId,
    entityType: 'payment',
    actorId: 'system',
    details: { customerId: userId, amount, type: 'HOLD' },
  });

  return txn;
}

/**
 * Release escrow to driver wallet (job completed successfully).
 */
async function releaseToDriver(customerId, driverId, amount, refJobId) {
  // 1. Remove hold from customer
  const customerWalletRef = db.collection(WALLETS_COL).doc(customerId);
  const customerSnap = await customerWalletRef.get();
  if (customerSnap.exists) {
    const cw = customerSnap.data();
    await customerWalletRef.update({
      heldBalance: Math.max(0, cw.heldBalance - amount),
      totalSpent: cw.totalSpent + amount,
      updatedAt: new Date().toISOString(),
    });

    // Log customer debit transaction
    await db.collection(TRANSACTIONS_COL).add({
      walletId: customerId,
      type: 'DEBIT',
      amount,
      amountDisplay: `QR ${(amount / 100).toFixed(2)}`,
      reason: 'Job payment released to driver',
      refJobId,
      currency: CURRENCY,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Credit driver wallet
  await getOrCreateWallet(driverId, 'driver');
  const txn = await writeTransaction(driverId, 'CREDIT', amount, 'Job payment received', refJobId);

  await logEvent(EVENT_TYPES.PAYMENT_RELEASED, {
    entityId: refJobId,
    entityType: 'payment',
    actorId: 'system',
    details: { customerId, driverId, amount, type: 'RELEASE_TO_DRIVER' },
  });

  return txn;
}

/**
 * Refund held funds back to customer (dispute won by customer, or cancel).
 */
async function refundToCustomer(customerId, amount, refJobId, reason = 'Refund') {
  await getOrCreateWallet(customerId, 'customer');

  // Remove the hold and add back to available
  const walletRef = db.collection(WALLETS_COL).doc(customerId);
  const walletSnap = await walletRef.get();
  if (walletSnap.exists) {
    const w = walletSnap.data();
    await walletRef.update({
      heldBalance: Math.max(0, w.heldBalance - amount),
      availableBalance: w.availableBalance + amount,
      updatedAt: new Date().toISOString(),
    });
  }

  // Log refund transaction
  const txnRef = db.collection(TRANSACTIONS_COL).doc();
  const transaction = {
    walletId: customerId,
    type: 'REFUND',
    amount,
    amountDisplay: `QR ${(amount / 100).toFixed(2)}`,
    reason,
    refJobId,
    currency: CURRENCY,
    createdAt: new Date().toISOString(),
  };
  await txnRef.set(transaction);

  await logEvent(EVENT_TYPES.PAYMENT_REFUNDED, {
    entityId: refJobId,
    entityType: 'payment',
    actorId: 'system',
    details: { customerId, amount, reason },
  });

  return { transactionId: txnRef.id, ...transaction };
}

/**
 * Withdraw funds from driver wallet to bank account.
 */
async function withdrawFunds(userId, amount, reason = 'Payout to bank', idempotencyKey = null) {
  // Week 7: Amount limit
  if (amount > MAX_WITHDRAWAL) {
    throw new Error(`Withdrawal exceeds maximum of QR ${(MAX_WITHDRAWAL / 100).toFixed(2)}`);
  }

  // Week 7: Idempotency check
  const cached = await checkIdempotency(idempotencyKey);
  if (cached) return { ...cached, idempotent: true };

  const txn = await writeTransaction(userId, 'WITHDRAWAL', amount, reason);

  await saveIdempotencyKey(idempotencyKey, txn);
  return txn;
}

// ─── Read Operations ─────────────────────────────────────────────────────────

/**
 * Get wallet balance for a user.
 */
async function getWalletBalance(userId) {
  const wallet = await getOrCreateWallet(userId);
  return {
    userId: wallet.userId || userId,
    role: wallet.role,
    availableBalance: wallet.availableBalance,
    availableDisplay: `QR ${(wallet.availableBalance / 100).toFixed(2)}`,
    heldBalance: wallet.heldBalance,
    heldDisplay: `QR ${(wallet.heldBalance / 100).toFixed(2)}`,
    totalBalance: wallet.availableBalance + wallet.heldBalance,
    totalDisplay: `QR ${((wallet.availableBalance + wallet.heldBalance) / 100).toFixed(2)}`,
    totalEarned: wallet.totalEarned,
    totalSpent: wallet.totalSpent,
    totalWithdrawn: wallet.totalWithdrawn,
    currency: CURRENCY,
  };
}

/**
 * Get transaction history for a user.
 */
async function getTransactionHistory(userId, limit = 50) {
  const snap = await db.collection(TRANSACTIONS_COL)
    .where('walletId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all wallets (admin view).
 */
async function getAllWallets({ role, limit = 50 } = {}) {
  let query = db.collection(WALLETS_COL).orderBy('updatedAt', 'desc');
  if (role) query = query.where('role', '==', role);
  query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

module.exports = {
  getOrCreateWallet,
  depositFunds,
  holdFunds,
  releaseToDriver,
  refundToCustomer,
  withdrawFunds,
  getWalletBalance,
  getTransactionHistory,
  getAllWallets,
  // Week 7
  checkIdempotency,
  saveIdempotencyKey,
  MAX_DEPOSIT,
  MAX_WITHDRAWAL,
};
