require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const connectDB = require('./databases/db');
const walletRoutes = require('./routes/wallet');

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
    });


