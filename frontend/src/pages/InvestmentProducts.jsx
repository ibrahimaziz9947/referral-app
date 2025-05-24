import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign,FiTrendingUp, FiArrowUp, FiBarChart2, FiX, FiClock, FiInfo, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { investments, wallet, siteSettings } from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import Loading from '../components/Loading';
import { formatCurrency, formatPKR } from '../utils/currency';

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeInOut' }
  }),
};

// Modal animation variants
const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};
const modalContentVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } },
};

const InvestmentProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(280); // Default rate
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const [productsResponse, walletResponse, currencyRes] = await Promise.all([
          investments.getAll(),
          wallet.getBalance(),
          siteSettings.getCurrencyRate()
        ]);
        
        setProducts(productsResponse.data || []);
        setWalletBalance(walletResponse.data?.balance || 0);
        setCurrencyRate(currencyRes.data?.value || 280);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load investment products or wallet balance. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openInvestModal = (product) => {
    setError(null);
    setSuccess(null);
    setSelectedProduct(product);
    setInvestmentAmount(product.minimumAmount.toString());
    setShowInvestModal(true);
  };

  const closeInvestModal = () => {
    setShowInvestModal(false);
    setSelectedProduct(null);
  };

  const calculateReturn = () => {
    if (!selectedProduct || !investmentAmount || isNaN(parseFloat(investmentAmount))) {
      return 0;
    }
    
    const amount = parseFloat(investmentAmount);
    return (amount * (selectedProduct.returnRate / 100)).toFixed(2);
  };

  const handleInvest = async () => {
    if (!selectedProduct || !investmentAmount) return;
    
    const amount = parseFloat(investmentAmount);
    let hasError = false;
    setError(null);
    setSuccess(null);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive investment amount.');
      hasError = true;
    }
    
    if (amount < selectedProduct.minimumAmount) {
      setError(`Minimum investment amount is $${selectedProduct.minimumAmount}.`);
      hasError = true;
    }
    
    if (amount > walletBalance) {
      setError('Insufficient balance in your wallet.');
      hasError = true;
    }

    if (hasError) return;
    
    try {
      setInvestmentLoading(true);
      await investments.invest(selectedProduct._id, amount);
      
      setWalletBalance(prev => prev - amount);
      const walletResponse = await wallet.getBalance();
      setWalletBalance(walletResponse.data.balance);
      
      setSuccess(`Successfully invested $${amount.toFixed(2)} in ${selectedProduct.name}! Your balance has been updated.`);
      closeInvestModal();
      
    } catch (err) {
      console.error('Investment error:', err);
      setError(err.response?.data?.message || 'Failed to process investment. Please try again.');
      try {
        const walletResponse = await wallet.getBalance();
        setWalletBalance(walletResponse.data.balance);
      } catch (balanceError) {
         console.error('Failed to re-fetch balance after investment error:', balanceError);
      }
    } finally {
      setInvestmentLoading(false);
    }
  };

  const renderInvestModal = () => {
    return (
      <AnimatePresence>
        {showInvestModal && selectedProduct && (
          <motion.div 
            className="fixed inset-0 bg-black/80 bg-opacity-60 flex items-center justify-center z-50 p-4"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeInvestModal}
          >
            <motion.div 
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-6 md:p-8 w-full max-w-lg mx-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Invest in {selectedProduct.name}</h3>
                <button 
                  onClick={closeInvestModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full"
                  aria-label="Close modal"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {error && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                   <strong className="font-bold">Oops! </strong>
                   <span className="block sm:inline">{error}</span>
                 </div>
              )}

              <div className="mb-6 space-y-3">
                <p className="text-gray-600 text-sm md:text-base">{selectedProduct.description}</p>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-gray-500 flex items-center"><FiArrowUp className="mr-1.5 text-green-500"/>Return Rate:</span>
                  <span className="font-semibold text-green-600 text-base">{selectedProduct.returnRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-gray-500 flex items-center"><FiClock className="mr-1.5 text-purple-500"/>Lock Period:</span>
                  <span className="font-semibold text-gray-700 text-base">{selectedProduct.returnPeriod} {selectedProduct.returnPeriodUnit}(s)</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-gray-500 flex items-center"><FiDollarSign className="mr-1.5 text-blue-500"/>Minimum Investment:</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-700 text-base">{formatCurrency(selectedProduct.minimumAmount)}</div>
                    <div className="text-xs text-gray-500">{formatPKR(selectedProduct.minimumAmount * currencyRate)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-gray-500 flex items-center"><FiDollarSign className="mr-1.5 text-indigo-500"/>Your Balance:</span>
                  <div className="text-right">
                    <div className="font-semibold text-indigo-600 text-base">{formatCurrency(walletBalance)}</div>
                    <div className="text-xs text-gray-500">{formatPKR(walletBalance * currencyRate)}</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700 mb-1">Investment Amount ($)</label>
                <input
                  type="number"
                  id="investmentAmount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  min={selectedProduct.minimumAmount}
                  max={walletBalance}
                  step="0.01"
                />
                {investmentAmount && !isNaN(parseFloat(investmentAmount)) && (
                  <div className="mt-1 text-sm text-gray-500 text-right">
                    {formatPKR(parseFloat(investmentAmount) * currencyRate)}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeInvestModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvest}
                  disabled={investmentLoading || !investmentAmount || parseFloat(investmentAmount) < selectedProduct.minimumAmount || parseFloat(investmentAmount) > walletBalance}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {investmentLoading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" />
                      Confirm Investment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 10rem)'}}>
           <Loading message="Loading investment products..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {success && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiCheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{success}</p>
             <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}

        {error && !showInvestModal && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiInfo className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{error}</p>
             <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}
        
        {products.length === 0 && !loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center bg-white p-10 rounded-lg shadow border border-gray-200 mt-8"
          >
            <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Investment Products Available</h3>
            <p className="text-gray-500 text-sm">Please check back later for new investment opportunities.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col transition-all duration-200 hover:shadow-lg"
              >
                <div className="p-6 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 truncate mr-2" title={product.name}>{product.name}</h2>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-5 h-10 line-clamp-2">{product.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                      <p className="text-xs text-green-700 font-medium mb-1">Return Rate</p>
                      <div className="flex items-center justify-center text-green-600">
                        <FiArrowUp className="mr-1 h-4 w-4" />
                        <p className="text-lg font-semibold">{product.returnRate}%</p>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
                      <p className="text-xs text-purple-700 font-medium mb-1">Lock Period</p>
                      <div className="flex items-center justify-center text-purple-700">
                         <FiClock className="mr-1 h-4 w-4" />
                        <p className="text-lg font-semibold">{product.returnPeriod} {product.returnPeriodUnit}(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs text-gray-500">Minimum Invest</p>
                      <div className="text-right flex items-center gap-2">
                        <div className="font-semibold text-gray-700">{formatCurrency(product.minimumAmount)}</div>
                        <div className="text-xs text-gray-500">({formatPKR(product.minimumAmount * currencyRate)})</div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openInvestModal(product)}
                      className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center transition duration-200 shadow-sm ${product.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={product.status !== 'active'}
                      title={product.status !== 'active' ? 'This product is currently inactive' : 'Invest in this product'}
                    >
                      <FiDollarSign className="mr-1 h-4 w-4" />
                      Invest Now
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {renderInvestModal()}
    </DashboardLayout>
  );
};

export default InvestmentProducts; 