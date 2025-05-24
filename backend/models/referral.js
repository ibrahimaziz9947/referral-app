const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral; 