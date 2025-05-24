const User = require('../models/user');
const RechargeRequest = require('../models/rechargeRequest');
const Earning = require('../models/earning');
const Withdrawal = require('../models/withdrawal');
const UserInvestment = require('../models/userInvestment');

// User: Request recharge
const requestRecharge = async (req, res) => {
  const { amount, proof } = req.body;
  const userId = req.user._id; // Get userId from the authenticated user

  try {
    const rechargeRequest = new RechargeRequest({
      user: userId,
      amount,
      proof,
    });

    await rechargeRequest.save();

    res.status(201).json({ message: 'Recharge request submitted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Review recharge
const reviewRecharge = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const { requestId } = req.params;

  try {
    const rechargeRequest = await RechargeRequest.findById(requestId).populate('user');

    if (!rechargeRequest) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }

    if (status === 'approved') {
      rechargeRequest.status = 'approved';
      // Update the wallet field instead of walletBalance
      rechargeRequest.user.wallet += rechargeRequest.amount;
      await rechargeRequest.user.save();
    } else {
      rechargeRequest.status = 'rejected';
    }

    await rechargeRequest.save();

    res.status(200).json({ 
      message: `Recharge request ${status}`,
      user: {
        _id: rechargeRequest.user._id,
        wallet: rechargeRequest.user.wallet
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Admin: View all recharge requests
const viewAllRechargeRequests = async (req, res) => {
  try {
    const rechargeRequests = await RechargeRequest.find().populate('user');
    res.status(200).json(rechargeRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get user's wallet balance
const getWalletBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('wallet');
        res.json({ balance: user.wallet });
    } catch (error) {
        res.status(500).json({ message: error.message });
  }
};

// Get user's recharge history
const getUserRechargeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const rechargeHistory = await RechargeRequest.find({ user: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .select('-__v');
    
    res.status(200).json(rechargeHistory);
  } catch (error) {
    console.error('Error fetching recharge history:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get combined wallet transaction history for the logged-in user
const getWalletHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const queryFilters = { user: userId };
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      // Adjust end date to include the whole day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter.$lte = endOfDay;
    }

    let combinedHistory = [];

    // Map types from query to internal models/sources
    const typeMap = {
      deposit: ['RechargeRequest'],
      withdrawal: ['Withdrawal'],
      investment_made: ['UserInvestment'],
      investment_return: ['Earning_investment'],
      referral_commission: ['Earning_referral'],
      task_reward: ['Earning_task']
    };

    const fetchTypes = type ? typeMap[type] || [] : Object.values(typeMap).flat();

    // 1. Fetch Approved Deposits (Credits)
    if (fetchTypes.includes('RechargeRequest')) {
        const depositFilters = { user: userId, status: 'approved' };
        if (Object.keys(dateFilter).length > 0) depositFilters.updatedAt = dateFilter; // Filter by approval date
        const deposits = await RechargeRequest.find(depositFilters).sort({ updatedAt: -1 });
        deposits.forEach(d => combinedHistory.push({
            id: d._id,
            date: d.updatedAt,
            type: 'deposit',
            description: `Wallet deposit approved`,
            amount: d.amount,
            status: 'completed'
        }));
    }

    // 2. Fetch Completed Withdrawals (Debits)
    if (fetchTypes.includes('Withdrawal')) {
        const withdrawalFilters = { user: userId, status: 'completed' };
        if (Object.keys(dateFilter).length > 0) withdrawalFilters.updatedAt = dateFilter; // Filter by completion date
        const withdrawals = await Withdrawal.find(withdrawalFilters).sort({ updatedAt: -1 });
        withdrawals.forEach(w => combinedHistory.push({
            id: w._id,
            date: w.updatedAt,
            type: 'withdrawal',
            description: `Withdrawal via ${w.paymentMethod}`,
            amount: -Math.abs(w.amount), // Ensure negative
            status: 'completed'
        }));
    }

    // 3. Fetch Credited Earnings (Credits)
    const earningTypes = fetchTypes.filter(t => t.startsWith('Earning_')).map(t => t.split('_')[1]);
    if (earningTypes.length > 0) {
        const earningFilters = { user: userId, status: 'credited', source: { $in: earningTypes } };
        if (Object.keys(dateFilter).length > 0) earningFilters.createdAt = dateFilter;
        const earnings = await Earning.find(earningFilters).sort({ createdAt: -1 });
        earnings.forEach(e => combinedHistory.push({
            id: e._id,
            date: e.createdAt,
            type: e.source === 'investment' ? 'investment_return' : 
                  e.source === 'referral' ? 'referral_commission' :
                  e.source === 'task' ? 'task_reward' : 'other_earning',
            description: e.description || `${e.source.charAt(0).toUpperCase() + e.source.slice(1)} Earning`,
            amount: e.amount,
            status: 'completed'
        }));
    }

    // 4. Fetch Initial Investments (Debits)
    if (fetchTypes.includes('UserInvestment')) {
        const investmentFilters = { user: userId };
        if (Object.keys(dateFilter).length > 0) investmentFilters.createdAt = dateFilter;
        const investments = await UserInvestment.find(investmentFilters).populate('investmentProduct', 'name').sort({ createdAt: -1 });
        investments.forEach(inv => combinedHistory.push({
            id: inv._id,
            date: inv.createdAt,
            type: 'investment_made',
            description: `Investment in ${inv.investmentProduct?.name || 'product'}`,
            amount: -Math.abs(inv.amountInvested), // Ensure negative
            status: 'completed'
        }));
    }

    // Sort combined history by date descending
    combinedHistory.sort((a, b) => b.date - a.date);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedHistory = combinedHistory.slice(startIndex, endIndex);
    const totalItems = combinedHistory.length;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
        history: paginatedHistory,
        currentPage: Number(page),
        totalPages,
        totalItems
    });

  } catch (error) {
    console.error('Error fetching wallet history:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestRecharge, reviewRecharge, viewAllRechargeRequests, getWalletBalance, getUserRechargeHistory, getWalletHistory };
