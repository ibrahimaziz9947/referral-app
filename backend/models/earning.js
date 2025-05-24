const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['referral', 'investment', 'task', 'other'],
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'withdrawn'],
    default: 'pending',
  },
  // If the earning is related to a specific entity
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
  },
  referenceModel: {
    type: String,
    enum: ['User', 'UserInvestment', 'TaskCompletion'],
  }
}, { timestamps: true });

const Earning = mongoose.model('Earning', earningSchema);

module.exports = Earning; 