const express = require('express');
const { requestRecharge, reviewRecharge, viewAllRechargeRequests, getWalletBalance, getUserRechargeHistory, getWalletHistory } = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// User: Get wallet balance
router.get('/balance', protect, getWalletBalance);

// User: Create recharge request
router.post('/recharge', protect, requestRecharge);

// User: Get recharge history
router.get('/recharge-history', protect, getUserRechargeHistory);

// User: Get combined wallet transaction history
router.get('/history', protect, getWalletHistory);

// Admin: Review recharge request
router.post('/admin/review-recharge/:requestId', protect, admin, reviewRecharge);

// Admin: View all recharge requests
router.get('/admin/recharge-requests', protect, admin, viewAllRechargeRequests);

module.exports = router;
