const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8);
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
  const { firstName, lastName, phoneContact, username, email, password, passkey, isAdmin } = req.body;

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

    const newUser = new User({
      firstName,
      lastName,
      phoneContact,
      username,
      email,
      password: '',
      passkey,
      referralCode: generateReferralCode(),
      isAdmin: isAdmin || false
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      yourReferralCode: newUser.referralCode,
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

module.exports = { signupUser, loginUser, resetPassword };
