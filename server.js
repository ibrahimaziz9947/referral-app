require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const connectDB = require('./databases/db');

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

connectDB();
/*mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB'); */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
    });

  /*}) 
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); */
