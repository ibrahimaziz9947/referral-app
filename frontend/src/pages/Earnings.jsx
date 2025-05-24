import { useState, useEffect } from 'react';
import { earnings, wallet, team } from '../services/api';
import { FiDollarSign, FiArrowDown, FiClock, FiCalendar, FiArrowUp, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import WithdrawalMethods from '../components/WithdrawalMethods';
import { useSettings } from '../context/SettingsContext';

const Earnings = () => {
  const { getSetting } = useSettings();
  const minWithdrawal = getSetting('minimum_withdrawal', 20);
  const [earningsSummary, setEarningsSummary] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    withdrawnEarnings: 0,
    availableForWithdrawal: 0
  });
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [isEligibleForWithdrawal, setIsEligibleForWithdrawal] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  
  // Withdrawal form states
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        console.log('[Earnings] Fetching withdrawal history...');
        // Fetch withdrawal history
        const withdrawalRes = await earnings.getWithdrawalHistory();
        const withdrawalData = withdrawalRes.data || [];
        setWithdrawalHistory(withdrawalData);
        console.log('[Earnings] Withdrawal history:', withdrawalData);

        console.log('[Earnings] Fetching referral stats...');
        // Fetch referral stats
        const statsRes = await team.getReferralStats();
        const totalReferrals = statsRes.data?.totalMembers || 0;
        setReferralCount(totalReferrals);
        console.log('[Earnings] Referral count:', totalReferrals);

        // --- New Eligibility Logic ---
        // Find first approved/completed withdrawal
        const firstWithdrawal = withdrawalData
          .filter(w => ['completed', 'approved'].includes(w.status?.toLowerCase()))
          .sort((a, b) => new Date(a.approvedAt || a.createdAt) - new Date(b.approvedAt || b.createdAt))[0];

        let eligible = false;
        let message = '';
        if (!firstWithdrawal) {
          // No withdrawals yet
          if (totalReferrals < 1) {
            eligible = false;
            message = 'Withdrawals are enabled after referring at least 1 member.';
          } else {
            eligible = true;
            message = '';
          }
        } else {
          // At least one withdrawal
          // Use approvedAt if available, else fallback to createdAt
          const firstWithdrawalDate = new Date(firstWithdrawal.approvedAt || firstWithdrawal.createdAt);
          const now = new Date();
          const daysSinceFirstWithdrawal = (now - firstWithdrawalDate) / (1000 * 60 * 60 * 24);
          console.log('[Earnings] Days since first withdrawal:', daysSinceFirstWithdrawal);
          if (daysSinceFirstWithdrawal < 10) {
            eligible = true;
            message = '';
          } else {
            if (totalReferrals < 3) {
              eligible = false;
              message = 'You need to refer 2 more members to make another withdrawal.';
            } else {
              eligible = true;
              message = '';
            }
          }
        }
        setIsEligibleForWithdrawal(eligible);
        setEligibilityMessage(message);
        // --- End New Eligibility Logic ---

        // Fetch wallet balance
        try {
          const walletRes = await wallet.getBalance();
          setWalletBalance(walletRes.data.balance);
          console.log('[Earnings] Wallet balance:', walletRes.data.balance);
        } catch (err) {
          console.log('[Earnings] Error fetching wallet balance:', err);
        }
        
        // Fetch earnings summary
        try {
          const summaryRes = await earnings.getSummary();
          setEarningsSummary(summaryRes.data);
          console.log('[Earnings] Earnings summary:', summaryRes.data);
        } catch (err) {
          console.log('[Earnings] Error fetching earnings summary:', err);
          setEarningsSummary({
            totalEarnings: 0,
            pendingEarnings: 0,
            withdrawnEarnings: 0,
            availableForWithdrawal: walletBalance || 0
          });
        }
        
        // Fetch earnings history
        try {
          const historyRes = await earnings.getHistory();
          setEarningsHistory(historyRes.data || []);
          console.log('[Earnings] Earnings history:', historyRes.data);
        } catch (err) {
          console.log('[Earnings] Error fetching earnings history:', err);
          setEarningsHistory([]);
        }
      } catch (err) {
        setIsEligibleForWithdrawal(false);
        setEligibilityMessage('Failed to load eligibility. Please try again.');
        setError('Failed to load earnings data. Please try again.');
        console.log('[Earnings] General error fetching data:', err);
      } finally {
        setLoading(false);
        console.log('[Earnings] Data fetching complete.');
      }
    };

    fetchAllData();
  }, []);

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < minWithdrawal) {
      setError(`Minimum withdrawal amount is $${minWithdrawal}`);
      return;
    }

    if (amount > earningsSummary.availableForWithdrawal) {
      setError('Withdrawal amount exceeds available balance');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!paymentDetails.trim()) {
      setError('Please provide payment details');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await earnings.requestWithdrawal({ 
        amount, 
        paymentMethod, 
        paymentDetails 
      });
      
      setSuccess('Withdrawal request submitted successfully!');
      setWithdrawalAmount('');
      setPaymentDetails('');
      setShowWithdrawalForm(false);
      
      // Refresh data
      const summaryRes = await earnings.getSummary();
      setEarningsSummary(summaryRes.data);
      
      const withdrawalRes = await earnings.getWithdrawalHistory();
      setWithdrawalHistory(withdrawalRes.data || []);
      
      const walletRes = await wallet.getBalance();
      setWalletBalance(walletRes.data.balance);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request. Please try again.');
      console.log('Withdrawal request error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading earnings data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Your Earnings</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Available for Withdrawal */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full mr-4">
                <FiArrowDown size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Available for Withdrawal</h2>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">${earningsSummary.availableForWithdrawal.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Amount you can withdraw now</p>
          </motion.div>
          
          {/* Pending Earnings */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-full mr-4">
                <FiClock size={20} className="text-yellow-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Pending Withdrawls</h2>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">${earningsSummary.pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Earnings waiting to be processed</p>
          </motion.div>
          
          {/* Withdrawn */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-4">
                <FiArrowUp size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Withdrawn</h2>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">${earningsSummary.withdrawnEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Total amount withdrawn to date</p>
          </motion.div>
        </div>
        
        {/* Withdraw Button & Info Message */} 
        <div className="flex flex-col items-end mb-8">
          <button
            onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
            disabled={!isEligibleForWithdrawal}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            ${!isEligibleForWithdrawal ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiArrowDown className="mr-2 -ml-1 h-5 w-5" />
            {showWithdrawalForm ? 'Cancel' : 'Request Withdrawal'}
          </button>
          {/* Show info message only in two cases */}
          {eligibilityMessage && (
            <div className="flex items-center mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
              <FiInfo className="mr-1.5 flex-shrink-0"/>
              <span>{eligibilityMessage}</span>
            </div>
          )}
        </div>
        
        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Request Withdrawal</h2>
            <form onSubmit={handleWithdrawalRequest}>
                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Withdraw
                </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                <input
                  type="number"
                      name="amount"
                      id="amount"
                      min={minWithdrawal}
                      max={earningsSummary.availableForWithdrawal}
                      className="focus:ring-blue-500 p-3 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                  value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                  required
                />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                  Available: ${earningsSummary.availableForWithdrawal.toFixed(2)}
                </p>
              </div>
              
                <WithdrawalMethods onSelectMethod={setPaymentMethod} />

                <div className="mb-6 mt-6">
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Details
                </label>
                <textarea
                    id="details"
                    name="details"
                    rows={3}
                    className="shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder={`Enter your ${paymentMethod === 'jazzcash' ? 'Jazz Cash (Account Number & Name)' : paymentMethod === 'bank' ? 'Bank (Account Number, Name, Bank Name)' : 'payment details'}`}
                  value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalForm(false)}
                    className="mr-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                <button
                  type="submit"
                    className="btn-primary py-2 px-6 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}
        
        {/* Withdrawal History */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Withdrawal History</h2>
          
          {withdrawalHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6 text-center">
              <FiCalendar className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">No withdrawal history yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <ul className="divide-y divide-gray-200">
                {withdrawalHistory.map(withdrawal => (
                  <li key={withdrawal._id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${withdrawal.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          via {withdrawal.paymentMethod.charAt(0).toUpperCase() + withdrawal.paymentMethod.slice(1)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 ml-3">
                          {formatDate(withdrawal.createdAt)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Earnings; 