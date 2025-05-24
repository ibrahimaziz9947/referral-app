const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Drop the database
    mongoose.connection.db.dropDatabase()
      .then(() => {
        console.log('Database has been reset successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error dropping database:', err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 