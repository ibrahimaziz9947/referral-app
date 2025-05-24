const User = require('../models/user');
const Referral = require('../models/referral');
const crypto = require('crypto');

// Get all team members (users referred by the current user)
exports.getTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all users referred by the current user
    const teamMembers = await User.find({ referredBy: userId })
      .select('_id firstName lastName email username createdAt');
      
    // Process the team members data to add additional info
    const processedMembers = await Promise.all(teamMembers.map(async (member) => {
      // Check if member has been active in last 30 days (made any transactions)
      const isActive = true; // TODO: Implement actual activity check
      
      // Calculate earnings generated from this member
      // This could be from transaction fees, tasks completed, etc.
      const earnings = 0; // TODO: Implement actual earnings calculation
      
      return {
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        username: member.username,
        joinedAt: member.createdAt,
        isActive,
        earnings
      };
    }));
    
    return res.status(200).json(processedMembers);
  } catch (error) {
    console.error('Error getting team members:', error);
    return res.status(500).json({ message: 'Failed to get team members' });
  }
};

// Get referral statistics
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total number of direct referrals
    const totalMembers = await User.countDocuments({ referredBy: userId });
    
    // Get number of active members (active in last 30 days)
    // TODO: Implement actual activity check
    const activeMembers = totalMembers; // For now, assume all are active
    
    // Calculate total earnings from referrals
    // TODO: Implement actual earnings calculation
    const referral = await Referral.findOne({ userId });
    const totalEarnings = referral ? referral.earnings : 0;
    
    return res.status(200).json({
      totalMembers,
      activeMembers,
      totalEarnings
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return res.status(500).json({ message: 'Failed to get referral statistics' });
  }
};

// Get current user's referral link
exports.getReferralLink = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has a referral code
    let referral = await Referral.findOne({ userId, isActive: true });
    
    if (!referral) {
      // Generate a new referral code
      const code = generateReferralCode(userId);
      
      referral = new Referral({
        userId,
        code
      });
      
      await referral.save();
    }
    
    // Construct the full referral link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/signup?ref=${referral.code}`;
    
    return res.status(200).json({ link });
  } catch (error) {
    console.error('Error getting referral link:', error);
    return res.status(500).json({ message: 'Failed to get referral link' });
  }
};

// Generate a new referral link
exports.generateReferralLink = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Deactivate existing referral codes
    await Referral.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );
    
    // Generate a new referral code
    const code = generateReferralCode(userId);
    
    // Create a new referral record
    const referral = new Referral({
      userId,
      code
    });
    
    await referral.save();
    
    // Construct the full referral link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/signup?ref=${referral.code}`;
    
    return res.status(201).json({ link });
  } catch (error) {
    console.error('Error generating referral link:', error);
    return res.status(500).json({ message: 'Failed to generate referral link' });
  }
};

// Helper function to generate a unique referral code
function generateReferralCode(userId) {
  const timestamp = Date.now().toString();
  const random = Math.random().toString().slice(2, 8);
  const hash = crypto.createHash('sha256')
    .update(userId + timestamp + random)
    .digest('hex')
    .slice(0, 8);
    
  return hash.toUpperCase();
} 