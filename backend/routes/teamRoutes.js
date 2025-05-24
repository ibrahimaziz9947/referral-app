const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get team members (users referred by the current user)
router.get('/members', teamController.getTeamMembers);

// Get referral statistics
router.get('/stats', teamController.getReferralStats);

// Get current user's referral link
router.get('/referral-link', teamController.getReferralLink);

// Generate a new referral link
router.post('/generate-link', teamController.generateReferralLink);

module.exports = router; 