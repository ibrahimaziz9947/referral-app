import React, { useState, useEffect } from 'react';
import { FiEye, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { wallet } from '../services/api';
import AdminDashboard from './AdminDashboard';

const AdminWalletRequests = () => {
  const [rechargeRequests, setRechargeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState('');

  useEffect(() => {
    fetchRechargeRequests();
  }, []);

  const fetchRechargeRequests = async () => {
    try {
      setLoading(true);
      const response = await wallet.getAllRechargeRequests();
      setRechargeRequests(response.data);
    } catch (err) {
      setError('Failed to load recharge requests: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRecharge = async (requestId, status, reason = '') => {
    try {
      setLoading(true);
      await wallet.reviewRecharge(requestId, { status, reason });
      setSuccess(`Recharge request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      fetchRechargeRequests();
    } catch (err) {
      setError('Failed to review recharge request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowImageModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminDashboard>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Wallet Recharge Requests</h1>
          <button
            onClick={fetchRechargeRequests}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {loading && !rechargeRequests.length ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rechargeRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-500">No recharge requests found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rechargeRequests.map(request => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.user?.username || request.user?.email || 'User Not Found'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${parseFloat(request.amount).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {request.proof ? (
                          <button
                            onClick={() => openImageModal(`https://api.cashczar.site${request.proof}`)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FiEye className="mr-1" /> View
                          </button>
                        ) : (
                          <span>No proof</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewRecharge(request._id, 'approved')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <FiCheck className="mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) {
                                  handleReviewRecharge(request._id, 'rejected', reason);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <FiX className="mr-1" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowImageModal(false)}>
          <div className="bg-white p-2 rounded-lg max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <img src={modalImage} alt="Payment Proof" className="max-w-full h-auto" />
            <button 
              className="mt-3 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full"
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminDashboard>
  );
};

export default AdminWalletRequests; 