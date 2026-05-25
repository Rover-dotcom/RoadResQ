/**
 * Wallet Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  listAllWallets,
  getBalance,
  getTransactions,
  deposit,
  withdraw,
} = require('../controllers/walletController');

const router = Router();

// Admin: list all wallets
router.get('/all', verifyToken, requireRole('admin'), listAllWallets);

// User-specific routes
router.get('/:userId', verifyToken, getBalance);
router.get('/:userId/transactions', verifyToken, getTransactions);
router.post('/:userId/deposit', verifyToken, deposit);
router.post('/:userId/withdraw', verifyToken, withdraw);

module.exports = router;
