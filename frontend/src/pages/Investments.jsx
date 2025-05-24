import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { investments, siteSettings } from '../services/api';
import Loading from '../components/Loading';
import { FiTrendingUp, FiDollarSign, FiPlusCircle, FiActivity, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency, formatPKR } from '../utils/currency';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeInOut' }
  }),
};

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'withdrawn':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Investments() {
  const [investmentsList, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencyRate, setCurrencyRate] = useState(280); // Default rate

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investmentsRes, currencyRes] = await Promise.all([
          investments.getUserInvestments(),
          siteSettings.getCurrencyRate()
        ]);
        setInvestments(investmentsRes.data || []);
        setCurrencyRate(currencyRes.data?.value || 280);
      } catch (err) {
        setError('Failed to load your investments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Your Investments</h1>
          <Link 
            to="/investment-products" 
            className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
            Browse Products
          </Link>
        </div>

        {error && (
           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
        )}

        {investmentsList.length === 0 && !error ? (
          <div className="text-center bg-white p-10 rounded-lg shadow border border-gray-200">
            <FiTrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Investments Yet</h3>
            <p className="text-sm text-gray-500 mb-6">Ready to grow your wealth? Browse available investment products and start investing today.</p>
            <Link 
              to="/investment-products" 
              className="inline-flex items-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
              View Investment Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentsList.map((inv, index) => (
              <motion.div 
                key={inv._id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                     <h3 className="font-semibold text-lg text-gray-800 mr-2">{inv.investmentProduct?.name || 'Product Name Missing'}</h3>
                     <span 
                      className={`px-3 py-1 text-xs font-medium rounded-full capitalize flex-shrink-0 ${getStatusStyles(inv.status)}`}
                     >
                      {inv.status}
                     </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{inv.investmentProduct?.description || 'No description available.'}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <FiDollarSign className="mr-2 h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>Amount Invested:</span>
                      <div className="ml-auto text-right">
                        <div className="font-medium">{formatCurrency(inv.amountInvested || 0)}</div>
                        <div className="text-xs text-gray-500">{formatPKR((inv.amountInvested || 0) * currencyRate)}</div>
                      </div>
                    </div>
                     <div className="flex items-center text-gray-700">
                      <FiTrendingUp className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Expected Return Rate:</span>
                      <span className="font-medium ml-auto">{inv.investmentProduct?.returnRate || 0}%</span>
                    </div>
                     <div className="flex items-center text-gray-700">
                      {inv.status === 'active' ? 
                        <FiActivity className="mr-2 h-4 w-4 text-yellow-500 flex-shrink-0" /> : 
                        <FiCheckCircle className="mr-2 h-4 w-4 text-purple-500 flex-shrink-0" />} 
                      <span>Current Value:</span>
                      <div className="ml-auto text-right">
                        <div className="font-medium">{formatCurrency(inv.currentValue || 0)}</div>
                        <div className="text-xs text-gray-500">{formatPKR((inv.currentValue || 0) * currencyRate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Invested on: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
  );
} 