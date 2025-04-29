// Load environment variables
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const connectDB = require('./databases/db');
const walletRoutes = require('./routes/wallet');
const taskRoutes = require('./routes/taskRoutes');
const investmentRoutes = require('./routes/investmentRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/investments', investmentRoutes);

// Test endpoint for JWT verification
app.post('/api/test-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  
  try {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Token being verified:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    res.json({ 
      message: 'Token verified successfully',
      decoded 
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});


