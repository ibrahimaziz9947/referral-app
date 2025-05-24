import React, { useState, useEffect } from 'react';
import { FiUser, FiUsers, FiDollarSign, FiRefreshCw, FiSearch, FiMail, FiPhone } from 'react-icons/fi';
import { users } from '../services/api';
import AdminDashboard from './AdminDashboard';

const AdminUsers = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await users.getAllWithDetails();
      setUsersList(response.data);
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const filteredUsers = usersList.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const handleUserClick = (user) => {
    setSelectedUser(selectedUser?._id === user._id ? null : user);
  };

  const getUserTypeLabel = (user) => {
    if (user.isAdmin) return { text: 'Admin', className: 'bg-purple-100 text-purple-800' };
    if (user.team?.count > 0) return { text: 'Team Leader', className: 'bg-blue-100 text-blue-800' };
    return { text: 'Member', className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <AdminDashboard>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl font-bold text-gray-800">Users Management</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchUsers}
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
              >
                <FiRefreshCw className="mr-2" /> Refresh
              </button>
              
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
              >
                {viewMode === 'table' ? 'Card View' : 'Table View'}
              </button>
            </div>
          </div>
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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-500">No users found matching your search.</p>
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <React.Fragment key={user._id}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedUser?._id === user._id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <FiUser className="text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username || 'no-username'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center">
                              <FiMail className="mr-1 text-gray-400" /> 
                              <span>{user.email}</span>
                            </div>
                            {user.phoneContact && (
                              <div className="flex items-center">
                                <FiPhone className="mr-1 text-gray-400" /> 
                                <span>{user.phoneContact}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <FiUsers className="mr-1 text-blue-500" /> 
                            <span>{user.team?.count || 0} members</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">${formatCurrency(user.earnings?.total || 0)}</div>
                            <div className="text-xs text-gray-500">
                              Pending: ${formatCurrency(user.earnings?.pending || 0)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${formatCurrency(user.wallet || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserTypeLabel(user).className}`}>
                            {getUserTypeLabel(user).text}
                          </span>
                        </td>
                      </tr>
                      {selectedUser?._id === user._id && user.team?.members.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="mb-2 text-sm font-medium text-gray-700">Team Members</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {user.team.members.map(member => (
                                <div key={member._id} className="bg-white p-2 rounded-md border border-gray-200 flex items-center">
                                  <div className="w-6 h-6 bg-gray-100 rounded-full mr-2 flex items-center justify-center">
                                    <FiUser className="text-gray-500 text-xs" />
                                  </div>
                                  <div className="text-xs">
                                    <div className="font-medium">{member.firstName} {member.lastName}</div>
                                    <div className="text-gray-500">{member.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div key={user._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <FiUser className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-500">@{user.username || 'no-username'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserTypeLabel(user).className}`}>
                      {getUserTypeLabel(user).text}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center">
                        <FiUsers className="mr-1" /> Team
                      </div>
                      <div className="text-lg font-semibold">{user.team?.count || 0}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center">
                        <FiDollarSign className="mr-1" /> Earnings
                      </div>
                      <div className="text-lg font-semibold">${formatCurrency(user.earnings?.total || 0)}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center mb-2">
                      <FiMail className="mr-2 text-gray-400" /> 
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    {user.phoneContact && (
                      <div className="flex items-center mb-2">
                        <FiPhone className="mr-2 text-gray-400" /> 
                        <span className="text-gray-700">{user.phoneContact}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Joined: {formatDate(user.createdAt)}
                      </div>
                      <div className="text-xs font-medium">
                        Wallet: ${formatCurrency(user.wallet || 0)}
                      </div>
                    </div>
                  </div>
                  
                  {user.team?.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Team Members</h4>
                        <span className="text-xs text-gray-500">{user.team.members.length} members</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {user.team.members.slice(0, 3).map(member => (
                          <div key={member._id} className="bg-gray-100 py-1 px-2 rounded-full text-xs">
                            {member.firstName} {member.lastName}
                          </div>
                        ))}
                        {user.team.members.length > 3 && (
                          <div className="bg-gray-100 py-1 px-2 rounded-full text-xs">
                            +{user.team.members.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
};

export default AdminUsers; 