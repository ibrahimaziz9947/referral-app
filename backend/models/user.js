const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneContact: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  passkey: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond', 'platinum'],
    default: 'bronze'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  wallet: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Helper function to determine level based on count
const getLevelFromCount = (count) => {
  if (count >= 40) return 'platinum';
  if (count >= 20) return 'diamond';
  if (count >= 10) return 'gold';
  if (count >= 5) return 'silver';
  return 'bronze';
};

// Method to update referral level based on count
userSchema.methods.updateReferralLevel = async function() {
  const newLevel = getLevelFromCount(this.referralCount);
  if (newLevel !== this.referralLevel) {
    this.referralLevel = newLevel;
    await this.save(); // Save the change
    console.log(`User ${this.email} updated to level: ${this.referralLevel}`);
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
