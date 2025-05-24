const express = require('express');
const router = express.Router();
const { 
    getWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal 
} = require('../controllers/adminWithdrawalController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

// GET /api/admin/withdrawals?status=pending (or approved, rejected)
router.get('/', getWithdrawalRequests);

// PUT /api/admin/withdrawals/:id/approve
router.put('/:id/approve', approveWithdrawal);

// PUT /api/admin/withdrawals/:id/reject
router.put('/:id/reject', rejectWithdrawal);

module.exports = router; 