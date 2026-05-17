/**
 * Wallet Controller — RoadResQ (Week 6 v8.0.0)
 *
 * GET  /api/wallet/:userId              — wallet balance
 * GET  /api/wallet/:userId/transactions — transaction history
 * POST /api/wallet/:userId/deposit      — add funds
 * POST /api/wallet/:userId/withdraw     — withdraw funds
 * GET  /api/wallet/all                  — admin: all wallets
 */

const {
  getOrCreateWallet,
  depositFunds,
  withdrawFunds,
  getWalletBalance,
  getTransactionHistory,
  getAllWallets,
} = require('../utils/walletEngine');

const ok = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// GET /api/wallet/all — admin: list all wallets
async function listAllWallets(req, res) {
  try {
    const { role, limit } = req.query;
    const wallets = await getAllWallets({ role, limit: parseInt(limit) || 50 });
    return ok(res, { wallets, count: wallets.length });
  } catch (err) {
    console.error('[Wallet] List all error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/wallet/:userId
async function getBalance(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.query;
    await getOrCreateWallet(userId, role || 'customer');
    const balance = await getWalletBalance(userId);
    return ok(res, balance);
  } catch (err) {
    console.error('[Wallet] Get balance error:', err);
    return fail(res, err.message, 500);
  }
}

// GET /api/wallet/:userId/transactions
async function getTransactions(req, res) {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const transactions = await getTransactionHistory(userId, parseInt(limit) || 50);
    return ok(res, { userId, transactions, count: transactions.length });
  } catch (err) {
    console.error('[Wallet] Get transactions error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/wallet/:userId/deposit
async function deposit(req, res) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) return fail(res, 'amount is required and must be positive (in halala).');

    const txn = await depositFunds(userId, parseInt(amount), reason || 'Wallet top-up');
    const balance = await getWalletBalance(userId);

    return ok(res, {
      message: `Deposited QR ${(parseInt(amount) / 100).toFixed(2)} successfully.`,
      transaction: txn,
      currentBalance: balance,
    }, 201);
  } catch (err) {
    console.error('[Wallet] Deposit error:', err);
    return fail(res, err.message, 500);
  }
}

// POST /api/wallet/:userId/withdraw
async function withdraw(req, res) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) return fail(res, 'amount is required and must be positive (in halala).');

    const txn = await withdrawFunds(userId, parseInt(amount), reason || 'Withdrawal');
    const balance = await getWalletBalance(userId);

    return ok(res, {
      message: `Withdrew QR ${(parseInt(amount) / 100).toFixed(2)} successfully.`,
      transaction: txn,
      currentBalance: balance,
    });
  } catch (err) {
    console.error('[Wallet] Withdraw error:', err);
    return fail(res, err.message, 400);
  }
}

module.exports = { listAllWallets, getBalance, getTransactions, deposit, withdraw };
