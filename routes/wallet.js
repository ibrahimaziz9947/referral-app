const express = require('express');
const { requestRecharge, reviewRecharge, viewAllRechargeRequests, getWalletBalance } = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// User: Get wallet balance
router.get('/balance', protect, getWalletBalance);

// User: Create recharge request
router.post('/recharge', protect, requestRecharge);

// Admin: Review recharge request
router.post('/admin/review-recharge/:requestId', protect, admin, reviewRecharge);

// Admin: View all recharge requests
router.get('/admin/recharge-requests', protect, admin, viewAllRechargeRequests);

module.exports = router;
