import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { investments } from '../services/api';
import AdminDashboard from './AdminDashboard';

const AdminInvestmentProducts = () => {
  const [products, setProducts] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minimumAmount: 100,
    returnRate: 5,
    returnPeriod: 1,
    returnPeriodUnit: 'month',
    status: 'active'
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchUserInvestments();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await investments.getAll();
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load investment products: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInvestments = async () => {
    try {
      const response = await investments.getAllAdminInvestments();
      setUserInvestments(response.data);
    } catch (err) {
      setError('Failed to load user investments: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'minimumAmount' || name === 'returnRate' || name === 'returnPeriod' 
        ? parseFloat(value) 
        : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editMode && selectedProduct) {
        await investments.update(selectedProduct._id, formData);
        setSuccess('Investment product updated successfully!');
      } else {
        await investments.create(formData);
        setSuccess('Investment product created successfully!');
      }
      
      // Reset form and refresh products
      setFormData({
        name: '',
        description: '',
        minimumAmount: 100,
        returnRate: 5,
        returnPeriod: 1,
        returnPeriodUnit: 'month',
        status: 'active'
      });
      setShowForm(false);
      setEditMode(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setError('Failed to save investment product: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      minimumAmount: product.minimumAmount,
      returnRate: product.returnRate,
      returnPeriod: product.returnPeriod,
      returnPeriodUnit: product.returnPeriodUnit,
      status: product.status
    });
    setSelectedProduct(product);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment product?')) {
      return;
    }
    
    try {
      setLoading(true);
      await investments.delete(id);
      setSuccess('Investment product deleted successfully!');
      fetchProducts();
    } catch (err) {
      setError('Failed to delete investment product: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getInvestorsForProduct = (productId) => {
    return userInvestments.filter(investment => 
      investment.investmentProduct && investment.investmentProduct._id === productId
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minimumAmount: 100,
      returnRate: 5,
      returnPeriod: 1,
      returnPeriodUnit: 'month',
      status: 'active'
    });
    setEditMode(false);
    setSelectedProduct(null);
  };

  return (
    <AdminDashboard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Investment Products</h1>
          <div className="flex gap-4">
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              <FiPlus className="mr-2" /> 
              {showForm ? 'Cancel' : 'Add New Product'}
            </button>
            <button
              onClick={() => { fetchProducts(); fetchUserInvestments(); }}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
            >
              <FiRefreshCw className="mr-2" /> Refresh
            </button>
          </div>
        </div>

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
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 ${
                activeTab === 'products'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Investment Products
            </button>
            <button
              onClick={() => setActiveTab('investors')}
              className={`py-4 px-1 ${
                activeTab === 'investors'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Investors
            </button>
          </nav>
        </div>

        {/* Product Creation/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editMode ? 'Edit Investment Product' : 'Create New Investment Product'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Amount ($)
                  </label>
                  <input
                    type="number"
                    name="minimumAmount"
                    value={formData.minimumAmount}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Rate (%)
                  </label>
                  <input
                    type="number"
                    name="returnRate"
                    value={formData.returnRate}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Period
                    </label>
                    <input
                      type="number"
                      name="returnPeriod"
                      value={formData.returnPeriod}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period Unit
                    </label>
                    <select
                      name="returnPeriodUnit"
                      value={formData.returnPeriodUnit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editMode ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {loading && !products.length ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-500">No investment products found. Create your first product!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <motion.div
                    key={product._id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Min. Investment</p>
                          <p className="font-semibold">${product.minimumAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Return Rate</p>
                          <p className="font-semibold">{product.returnRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Return Period</p>
                          <p className="font-semibold">
                            {product.returnPeriod} {product.returnPeriodUnit}
                            {product.returnPeriod > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Investors</p>
                          <p className="font-semibold">
                            {getInvestorsForProduct(product._id).length}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="mr-1" /> Delete
                        </button>
                        <button
                          onClick={() => { setActiveTab('investors'); setSelectedProduct(product); }}
                          className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                          <FiUsers className="mr-1" /> View Investors
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Investors Tab */}
        {activeTab === 'investors' && (
          <>
            {selectedProduct && (
              <div className="mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <h3 className="text-lg font-semibold">
                    Viewing investors for: {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                  >
                    View all investors
                  </button>
                </div>
              </div>
            )}
            
            {loading && !userInvestments.length ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userInvestments
                        .filter(investment => 
                          !selectedProduct || (investment.investmentProduct && investment.investmentProduct._id === selectedProduct._id)
                        )
                        .map(investment => (
                        <tr key={investment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {investment.user.username || investment.user.email}
                                </div>
                                <div className="text-sm text-gray-500">{investment.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {investment.investmentProduct ? investment.investmentProduct.name : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${investment.amountInvested.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${investment.currentValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              investment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(investment.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {userInvestments.filter(investment => 
                    !selectedProduct || (investment.investmentProduct && investment.investmentProduct._id === selectedProduct._id)
                  ).length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No investors found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminDashboard>
  );
};

export default AdminInvestmentProducts; 