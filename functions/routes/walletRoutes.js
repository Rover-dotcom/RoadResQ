/**
 * Wallet Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const {
  listAllWallets,
  getBalance,
  getTransactions,
  deposit,
  withdraw,
} = require('../controllers/walletController');

const router = Router();

// Admin: list all wallets
router.get('/all', listAllWallets);

// User-specific routes
router.get('/:userId', getBalance);
router.get('/:userId/transactions', getTransactions);
router.post('/:userId/deposit', deposit);
router.post('/:userId/withdraw', withdraw);

module.exports = router;
