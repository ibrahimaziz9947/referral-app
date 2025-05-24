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
const cors = require('cors');
const authRoutes = require('./routes/auth');
const connectDB = require('./databases/db');
const siteSettingRoutes = require('./routes/siteSettingRoutes');
const walletRoutes = require('./routes/wallet');
const taskRoutes = require('./routes/taskRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const teamRoutes = require('./routes/teamRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const siteSettingsRoutes = require('./routes/siteSettings');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const adminWithdrawalRoutes = require('./routes/adminWithdrawalRoutes');
const cron = require('node-cron');
const { processInvestmentReturns } = require('./controllers/investmentController');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://cashczar.site', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/settings', siteSettingRoutes); 
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);

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

// --- Scheduled Tasks --- 

let isProcessing = false;
let lastRunTime = null;

// Schedule investment return processing (runs every minute for testing)
cron.schedule('* * * * *', async () => {
  const currentTime = new Date();
  
  if (isProcessing) {
    console.log(`[${currentTime.toISOString()}] Previous investment processing still running, skipping this cycle`);
    return;
  }

  // Log time since last run
  if (lastRunTime) {
    const timeSinceLastRun = (currentTime - lastRunTime) / 1000;
    console.log(`[${currentTime.toISOString()}] Time since last run: ${timeSinceLastRun.toFixed(2)} seconds`);
  }

  try {
    isProcessing = true;
    lastRunTime = currentTime;
    console.log(`[${currentTime.toISOString()}] Starting scheduled investment processing job`);
    await processInvestmentReturns();
    console.log(`[${currentTime.toISOString()}] Completed scheduled investment processing job`);
  } catch (error) {
    console.error(`[${currentTime.toISOString()}] Critical error in investment processing job:`, error);
  } finally {
    isProcessing = false;
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log(`[${new Date().toISOString()}] Scheduled investment processing job (every minute for testing)`);

// --- End Scheduled Tasks ---

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

