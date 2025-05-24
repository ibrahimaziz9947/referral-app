const Withdrawal = require('../models/withdrawal');
const User = require('../models/user');
const mongoose = require('mongoose');

// @desc    Get withdrawal requests (filter by status)
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
const getWithdrawalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    } else {
      // Default to pending if no valid status or no status provided
      filter.status = 'pending';
    }

    // Fetch requests and populate user's email and name for display
    const requests = await Withdrawal.find(filter)
      .populate('user', 'email firstName lastName') // Select specific user fields
      .sort({ createdAt: -1 }); // Show newest first

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

// @desc    Approve a withdrawal request
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private/Admin
const approveWithdrawal = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid withdrawal request ID' });
  }

  try {
    const request = await Withdrawal.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    // Update status to approved
    request.status = 'approved';
    request.processedAt = Date.now();
    await request.save();

    // Note: Actual money transfer happens manually based on request details
    // No balance deduction happens here as it was deducted on request creation (presumably)

    res.status(200).json({ message: 'Withdrawal request approved successfully', request });
  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    res.status(500).json({ message: 'Server error approving request' });
  }
};

// @desc    Reject a withdrawal request
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private/Admin
const rejectWithdrawal = async (req, res) => {
  const { id } = req.params;
   // Optional: Add reason from request body later if needed
   // const { reason } = req.body; 

   if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid withdrawal request ID' });
  }

  const session = await mongoose.startSession(); // Use transaction for atomicity
  session.startTransaction();

  try {
    const request = await Withdrawal.findById(id).session(session);

    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (request.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    // Find the user to refund
    const user = await User.findById(request.user).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User associated with request not found' });
    }

    // Add the amount back to the user's wallet
    user.walletBalance += request.amount;
    await user.save({ session }); // Save user within the transaction

    // Update request status to rejected
    request.status = 'rejected';
    request.processedAt = Date.now();
    // request.rejectionReason = reason; // Add if implementing reason field
    await request.save({ session }); // Save request within the transaction

    await session.commitTransaction(); // Commit both changes
    session.endSession();

    res.status(200).json({ message: 'Withdrawal request rejected and funds returned to user', request });

  } catch (error) {
    await session.abortTransaction(); // Rollback on error
    session.endSession();
    console.error('Error rejecting withdrawal request:', error);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};

module.exports = {
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
}; 