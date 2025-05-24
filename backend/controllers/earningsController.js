const User = require('../models/user');
const Earning = require('../models/earning');
const Withdrawal = require('../models/withdrawal');

// Get earnings summary for the current user
const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get total earnings (all earnings regardless of status)
    const totalEarningsResult = await Earning.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Calculate total of PENDING withdrawals instead of pending earnings
    const pendingWithdrawalsResult = await Withdrawal.aggregate([
      { $match: { user: userId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Calculate total of APPROVED withdrawals for the withdrawn card
    const withdrawnResult = await Withdrawal.aggregate([
      { $match: { user: userId, status: 'approved' } }, // Use 'approved' or 'completed' depending on your exact status flow
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Get the user's wallet balance for available withdrawal
    const user = await User.findById(userId).select('wallet');
    
    // Calculate totals (handle cases where no records are found)
    const totalEarnings = totalEarningsResult[0]?.total || 0;
    const pendingEarnings = pendingWithdrawalsResult[0]?.total || 0;
    const withdrawnEarnings = withdrawnResult[0]?.total || 0;
    const availableForWithdrawal = user?.wallet || 0;
    
    res.status(200).json({
      totalEarnings,
      pendingEarnings,
      withdrawnEarnings,
      availableForWithdrawal
    });
  } catch (error) {
    console.error('Error getting earnings summary:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get earnings history for the current user
const getEarningsHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const earnings = await Earning.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);  // Limit to recent 50 entries
    
    res.status(200).json(earnings);
  } catch (error) {
    console.error('Error getting earnings history:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Request a withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, paymentMethod, paymentDetails } = req.body;
    
    if (!amount || !paymentMethod || !paymentDetails) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['amount', 'paymentMethod', 'paymentDetails']
      });
    }
    
    // Check if user has enough balance
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient funds for withdrawal' });
    }
    
    // Create withdrawal request
    const withdrawal = new Withdrawal({
      user: userId,
      amount,
      paymentMethod,
      paymentDetails
    });
    
    // Deduct amount from user's wallet
    user.wallet -= amount;
    
    // Save changes
    await withdrawal.save();
    await user.save();
    
    res.status(201).json({ 
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get withdrawal history for the current user
const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const withdrawals = await Withdrawal.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);  // Limit to recent 50 entries
    
    res.status(200).json(withdrawals);
  } catch (error) {
    console.error('Error getting withdrawal history:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Review withdrawal request
const reviewWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'This withdrawal request has already been processed' });
    }
    
    // If rejecting, add the amount back to user's wallet
    if (status === 'rejected') {
      const user = await User.findById(withdrawal.user);
      if (user) {
        user.wallet += withdrawal.amount;
        await user.save();
      }
    }
    
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    res.status(200).json({
      message: `Withdrawal request ${status}`,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt
      }
    });
  } catch (error) {
    console.error('Error reviewing withdrawal:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get earnings summary grouped by source type
const getEarningsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'all_time' } = req.query; // e.g., 'last_30_days', 'all_time'

    const matchCriteria = { user: userId, status: 'credited' };

    // Add date filter based on period
    if (period === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchCriteria.createdAt = { $gte: thirtyDaysAgo };
    }
    // Add more periods like 'last_7_days', 'current_month' if needed

    const earningsByType = await Earning.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$source", // Group by source (referral, investment, task)
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          totalAmount: 1
        }
      }
    ]);

    // Format results into a simple object { referral: X, investment: Y, task: Z }
    const formattedResult = earningsByType.reduce((acc, item) => {
      acc[item.source] = item.totalAmount;
      return acc;
    }, {
      referral: 0,
      investment: 0,
      task: 0,
      other: 0 // Include 'other' if used
    });

    res.status(200).json(formattedResult);

  } catch (error) {
    console.error('Error getting earnings by type:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEarningsSummary,
  getEarningsHistory,
  requestWithdrawal,
  getWithdrawalHistory,
  reviewWithdrawal,
  getEarningsByType
}; 