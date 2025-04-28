const express = require('express');
const { requestRecharge, reviewRecharge, viewAllRechargeRequests } = require('../controllers/walletController');
const authenticateUser = require('../middleware/authenticateUser');
const router = express.Router();

// User: Create recharge request
router.post('/recharge', authenticateUser, requestRecharge);

// Admin: Review recharge request
router.post('/admin/review-recharge/:requestId', reviewRecharge);

router.get('/admin/recharge-requests', viewAllRechargeRequests)
module.exports = router;
