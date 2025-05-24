const express = require('express');
const router = express.Router();
const { 
    getOverviewStats, 
    getUserGrowth, 
    getInvestmentSummary 
} = require('../controllers/adminAnalyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

// GET /api/admin/analytics/overview
router.get('/overview', getOverviewStats);

// GET /api/admin/analytics/user-growth
router.get('/user-growth', getUserGrowth);

// GET /api/admin/analytics/investment-summary
router.get('/investment-summary', getInvestmentSummary);

module.exports = router; 