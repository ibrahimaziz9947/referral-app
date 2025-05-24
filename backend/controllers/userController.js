const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Referral = require('../models/referral');
const Earning = require('../models/earning');


function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to generate JWT token
const generateToken = (userId) => {
  console.log('Generating token for userId:', userId);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
  console.log('JWT_SECRET value (first 5 chars):', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : 'undefined');
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  console.log('Token generated successfully:', !!token);
  return token;
};

const signupUser = async (req, res) => {
  const { firstName, lastName, phoneContact, username, email, password, passkey, isAdmin, referralCode } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !passkey) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'password', 'passkey']
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check for referral code and find referring user
    let referredByUserId = null;
    let referrer = null;
    if (referralCode) {
      // Find the user who owns this referral code
      referrer = await User.findOne({ referralCode: referralCode });
      if (referrer) {
        referredByUserId = referrer._id;
        
        // Increment the referrer's count
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        // Update the referrer's level (this will save the user)
        await referrer.updateReferralLevel(); 
        // Note: updateReferralLevel now handles saving the referrer
      } else {
        // Optional: Handle invalid referral code more strictly if needed
        console.warn(`Referral code ${referralCode} provided but no user found.`);
        // return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    // Generate a referral code for the new user
    const newReferralCode = generateReferralCode();

    const newUser = new User({
      firstName,
      lastName,
      phoneContact,
      username,
      email,
      password: '',
      passkey,
      referredBy: referredByUserId,
      referralCode: newReferralCode,
      isAdmin: isAdmin || false
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      yourReferralCode: newReferralCode,
      token,
      isAdmin: newUser.isAdmin
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ 
      message: 'Server error during signup',
      error: err.message 
    });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        required: ['email', 'password']
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      referralCode: user.referralCode,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ 
      message: 'Server error during login',
      error: err.message 
    });
  }
};


const resetPassword = async (req, res) => {
  const { email, passkey, newPassword } = req.body;

  try {
    if (!email || !passkey || !newPassword) {
      return res.status(400).json({ 
        message: 'Email, passkey, and new password are required',
        required: ['email', 'passkey', 'newPassword']
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.passkey !== passkey) {
      return res.status(400).json({ message: 'Invalid passkey' });
    }

    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(500).json({ 
      message: 'Server error during password reset',
      error: err.message 
    });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    // Ensure referralLevel is included
    const user = await User.findById(req.user.id).select('-password -__v'); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user); // Send the full user object including referralLevel
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update current user profile
const updateMe = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password update here
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all users with their teams and earnings (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -__v');
    
    // Get the result with additional details
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      // Find all team members (users who have this user as referredBy)
      const teamMembers = await User.find({ referredBy: user._id }).select('_id username email firstName lastName createdAt');
      
      // Get user's earnings summary
      const earnings = await Earning.findOne({ user: user._id }) || { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 };
      
      // Return user with team and earnings details
      return {
        ...user.toObject(),
        team: {
          members: teamMembers,
          count: teamMembers.length
        },
        earnings: {
          total: earnings.totalEarnings || 0,
          pending: earnings.pendingEarnings || 0,
          paid: earnings.paidEarnings || 0
        }
      };
    }));
    
    res.json(usersWithDetails);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { signupUser, loginUser, resetPassword, getMe, updateMe, getAllUsers };
