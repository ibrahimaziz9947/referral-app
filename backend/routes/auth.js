const express = require('express');
const router = express.Router();
const { signupUser, loginUser, resetPassword, getMe, updateMe, getAllUsers } = require('../controllers/userController');
const authenticateUser = require('../middleware/authenticateUser');
const { admin, protect } = require('../middleware/authMiddleware');
const User = require('../models/user');

// Middleware to validate referral code
const validateReferralCode = async (req, res, next) => {
  const { referralCode } = req.body;
  
  if (!referralCode) {
    // Referral code is optional, so proceed without it
    return next();
  }
  
  try {
    // Check if a user exists with this referral code
    const userWithCode = await User.findOne({ referralCode: referralCode });
    
    // If no user has this code, it's invalid for signup referral purposes
    if (!userWithCode) {
      return res.status(400).json({ message: 'Invalid referral code' });
    }
    
    // Valid referral code (a user has it), proceed to signup controller
    next();
  } catch (error) {
    console.error('Error validating referral code:', error); // Log the actual error
    return res.status(500).json({ message: 'Error validating referral code' });
  }
};

router.post('/signup', validateReferralCode, signupUser);

router.post('/login', loginUser);

router.post('/reset-password', resetPassword);

// Add /me endpoints
router.get('/me', authenticateUser, getMe);
router.put('/me', authenticateUser, updateMe);

// Admin routes
router.get('/users', protect, admin, getAllUsers);

module.exports = router;
