import React, { useState, useEffect, useCallback } from 'react';
import { adminWithdrawals } from '../services/api';
import AdminDashboard from '../pages/AdminDashboard';
import Loading from '../components/Loading';
import { FiCheckSquare, FiXSquare, FiFilter, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiInfo, FiUser, FiDollarSign, FiCreditCard, FiEye, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const rowVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 }
  }),
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

const AdminWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); 
  const [processingId, setProcessingId] = useState(null); 

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Clear success message on refresh/filter change
    setSuccess(null);
    try {
      const response = await adminWithdrawals.getRequests(filterStatus);
      setRequests(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch withdrawal requests.');
      setRequests([]); // Clear requests on error
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (actionType, id) => {
    if (processingId) return; // Prevent multiple actions at once

    const confirmationMessage = actionType === 'approve' 
        ? 'Are you sure you want to approve this withdrawal? The funds should be manually transferred.'
        : 'Are you sure you want to reject this withdrawal? The funds will be returned to the user\'s wallet.';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setProcessingId(id);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (actionType === 'approve') {
        response = await adminWithdrawals.approveRequest(id);
        setSuccess(response.data?.message || 'Request approved successfully!');
      } else { // reject
        response = await adminWithdrawals.rejectRequest(id);
        setSuccess(response.data?.message || 'Request rejected successfully!');
      }
      // Refresh the list after action
      fetchRequests(); 
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionType} request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
       return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch { return 'Invalid Date' }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <AdminDashboard>
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Withdrawals</h1>

        {/* Error Message */} 
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm flex items-center"
              role="alert"
            >
              <FiAlertTriangle className="mr-2" />
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */} 
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm flex items-center"
              role="alert"
            >
              <FiCheckCircle className="mr-2" />
              <span className="block sm:inline">{success}</span>
              <button onClick={() => setSuccess(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Refresh */} 
        <div className="mb-4 flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              aria-label="Filter by status"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Requests Table */} 
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            {loading && requests.length === 0 ? (
              <div className="p-10 text-center">
                <Loading message="Loading requests..." />
              </div>
            ) : !loading && requests.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <FiInfo className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                No {filterStatus} withdrawal requests found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {filterStatus === 'pending' && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {requests.map((req, index) => (
                      <motion.tr 
                        key={req._id}
                        variants={rowVariant}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout // Add layout prop for smooth removal animation
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                              <FiUser className="mr-2 text-gray-500 flex-shrink-0"/>
                              <div>
                                  <div>{req.user?.firstName || ''} {req.user?.lastName || ''}</div>
                                  <div className="text-xs text-gray-500">{req.user?.email || 'N/A'}</div>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                          <FiDollarSign className="inline mr-1 h-4 w-4 text-green-600"/>
                          {req.amount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                           <FiCreditCard className="inline mr-1.5 h-4 w-4 text-blue-600"/>
                           {req.paymentMethod}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words">
                           {req.paymentDetails}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(req.status)}</td>
                        
                        {/* Actions only for pending requests */} 
                        {filterStatus === 'pending' && (
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleAction('approve', req._id)}
                              disabled={processingId === req._id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-wait p-1 rounded hover:bg-green-100 transition-colors"
                              title="Approve Withdrawal"
                            >
                              <FiCheckSquare size={18} />
                            </button>
                            <button
                              onClick={() => handleAction('reject', req._id)}
                              disabled={processingId === req._id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-wait p-1 rounded hover:bg-red-100 transition-colors"
                              title="Reject Withdrawal"
                            >
                              <FiXSquare size={18} />
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    </AdminDashboard>
  );
};

export default AdminWithdrawals; 