const express = require('express');
const { 
  getEarningsSummary, 
  getEarningsHistory, 
  requestWithdrawal, 
  getWithdrawalHistory, 
  reviewWithdrawal,
  getEarningsByType
} = require('../controllers/earningsController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// User routes
router.get('/summary', protect, getEarningsSummary);
router.get('/history', protect, getEarningsHistory);
router.get('/by-type', protect, getEarningsByType);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals', protect, getWithdrawalHistory);

// Admin routes
router.post('/admin/review-withdrawal/:withdrawalId', protect, admin, reviewWithdrawal);

module.exports = router; 