const User = require('../models/user');
const RechargeRequest = require('../models/rechargeRequest');

// User: Request recharge
const requestRecharge = async (req, res) => {
  const { amount, proof } = req.body;
  const userId = req.userId; // We'll get userId from token (assume it's extracted from middleware)

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
    res.status(500).send('Server error');
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
      rechargeRequest.user.walletBalance += rechargeRequest.amount;
      await rechargeRequest.user.save();
    } else {
      rechargeRequest.status = 'rejected';
    }

    await rechargeRequest.save();

    res.status(200).json({ message: `Recharge request ${status}` });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// Admin: View all recharge requests
const viewAllRechargeRequests = async (req, res) => {
  try {
    const rechargeRequests = await RechargeRequest.find().populate('user');
    res.status(200).json(rechargeRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = { requestRecharge, reviewRecharge, viewAllRechargeRequests };
