const User = require('../models/user');
const RechargeRequest = require('../models/rechargeRequest');

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

module.exports = { requestRecharge, reviewRecharge, viewAllRechargeRequests, getWalletBalance };
