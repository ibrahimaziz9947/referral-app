import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { wallet, uploads, siteSettings } from '../services/api';
import { FiDollarSign, FiArrowUp, FiArrowDown, FiClock, FiUpload, FiEye, FiX, FiFilter, FiInfo, FiUsers, FiCheckCircle, FiLoader, FiAlertCircle, FiCopy, FiClipboard, FiFileText, FiExternalLink } from 'react-icons/fi'; // Added more icons
import DashboardLayout from '../layouts/DashboardLayout';
import Loading from '../components/Loading'; // Import Loading component
import { formatCurrency, formatPKR } from '../utils/currency';

// Backend base URL for static files (ensure this is correct)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cashczar.site';

// --- Hardcoded Jazz Cash Accounts ---
const jazzCashAccounts = [
  { method: "Jazz Cash", accountNumber: "03010672003", accountName: "Asma Ejaz" },
  { method: "Jazz Cash", accountNumber: "03291423144", accountName: "Musarrat Bibi" },
  { method: "Jazz Cash", accountNumber: "03291758489", accountName: "Nasreen Khaton" },
];
// -------------------------------------

// Animation Variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  }),
};

const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } },
};

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [currencyRate, setCurrencyRate] = useState(280); // Default rate
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rechargeError, setRechargeError] = useState(null); // Separate error for recharge form
  const [success, setSuccess] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(''); // For image preview
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const [filterType, setFilterType] = useState('');
  const [copiedValue, setCopiedValue] = useState(null); // State to track copied value

  const navigate = useNavigate();

  // Select one random deposit method on component load
  const randomDepositMethod = useMemo(() => {
    if (jazzCashAccounts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * jazzCashAccounts.length);
    return jazzCashAccounts[randomIndex];
  }, []); // Empty dependency array means it runs once on mount

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [balanceResponse, currencyResponse] = await Promise.all([
          wallet.getBalance(),
          siteSettings.getCurrencyRate()
        ]);
        setBalance(balanceResponse.data?.balance || 0);
        setCurrencyRate(currencyResponse.data?.value || 280);
      } catch (err) {
        setError('Failed to load wallet data.');
        console.error('Error fetching wallet data:', err);
      } finally {
        // Loading state will be fully turned off after history is loaded too
      }
    };
    fetchWalletData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (filterType) {
          params.type = filterType;
        }
        const response = await wallet.getHistory(params);
        setHistory(response.data?.history || []);
        setCurrentPage(response.data?.currentPage || 1);
        setTotalPages(response.data?.totalPages || 1);
        setTotalItems(response.data?.totalItems || 0);
      } catch (err) {
        setError(prev => prev || 'Failed to load transaction history.'); // Keep balance error if it exists
        console.error('Error fetching wallet history:', err);
        setHistory([]); 
      } finally {
        setHistoryLoading(false);
        setLoading(false); // Now set main loading to false
      }
    };
    fetchHistory();
  }, [currentPage, filterType]);

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1); 
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setRechargeError('File size must be less than 5MB.');
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
         setRechargeError('Invalid file type. Only PNG, JPG, JPEG allowed.');
         return;
      }
      setRechargeError(''); // Clear error
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRechargeRequest = async (e) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    let errorMsg = '';
    
    if (isNaN(amount) || amount <= 0) {
      errorMsg = 'Please enter a valid positive amount.';
    }
    if (!proofFile) {
       errorMsg = 'Please upload proof of payment image.';
    }

    if (errorMsg) {
        setRechargeError(errorMsg);
        return;
    }

    setSubmitting(true);
    setUploading(true);
    setRechargeError(null);
    setSuccess(null);
    
    try {
      // Upload proof
      const formData = new FormData();
      formData.append('proofImage', proofFile);
      const uploadResponse = await uploads.uploadFile(formData);
      const proofUrl = uploadResponse.data.fileUrl;
      setUploading(false);

      if (!proofUrl) throw new Error('Image upload failed to return URL.');
      
      // Request recharge
      await wallet.requestRecharge({ 
        amount, 
        proof: proofUrl 
      });
      
      setSuccess('Recharge request submitted successfully! It will be reviewed by admin.');
      setRechargeAmount('');
      setProofFile(null);
      setImagePreview('');
      
      // Re-fetch history to show pending request (optional, could just show success)
      // Consider just showing the success message and letting admin review handle status update
       setCurrentPage(1); // Go back to first page of history
       setFilterType(''); // Reset filter to show all, including pending
       // Let the useEffect fetch history again due to filter/page change

    } catch (err) {
      setRechargeError(err.response?.data?.message || 'Failed to submit recharge request.');
      console.error('Recharge request error:', err);
      setUploading(false); // Ensure uploading is false on error too
    } finally {
      setSubmitting(false);
    }
  };

  const getFullProofUrl = (proofUrl) => {
    if (!proofUrl) return '';
    if (proofUrl.startsWith('http://') || proofUrl.startsWith('https://')) {
      return proofUrl;
    }
    return `${API_BASE_URL}${proofUrl}`; // Use environment variable
  };

  const openProofModal = (proofUrl) => {
    setSelectedProof(proofUrl);
  };

  const closeProofModal = () => {
     setSelectedProof(null);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedValue(field); // Track which field was copied
      setTimeout(() => setCopiedValue(null), 1500); // Reset after 1.5s
    }, (err) => {
      console.error('Failed to copy: ', err);
      // Optionally show a temporary error message to the user
    });
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
  
  const formatTypeLabel = (type) => {
    if (typeof type !== 'string' || !type) {
      return 'Unknown'; 
    }
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const getTransactionIcon = (type, amount) => {
    const isCredit = amount >= 0;
    const iconClass = `w-4 h-4 flex-shrink-0 ${isCredit ? 'text-green-500' : 'text-red-500'}`;
    switch (type) {
      case 'deposit': return { icon: <FiArrowDown className={iconClass} />, bg: 'bg-green-50' }; // Deposit adds money (down arrow visually? or up? let's use down for incoming)
      case 'withdrawal': return { icon: <FiArrowUp className={iconClass} />, bg: 'bg-red-50' }; // Withdrawal removes money
      case 'investment_made': return { icon: <FiDollarSign className={iconClass} />, bg: 'bg-blue-50' };
      case 'investment_return': return { icon: <FiExternalLink className={iconClass} />, bg: 'bg-purple-50' }; // Use trending up for return
      case 'referral_commission': return { icon: <FiUsers className={iconClass} />, bg: 'bg-pink-50' };
      case 'task_reward': return { icon: <FiCheckCircle className={iconClass} />, bg: 'bg-teal-50' };
      default: return { icon: <FiInfo className={iconClass} />, bg: 'bg-gray-50' };
    }
  };

  // Add this function to format amounts with both currencies
  const formatAmountWithPKR = (amount) => {
    const pkrAmount = amount * currencyRate;
    return (
      <div className="flex flex-col">
        <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
        <span className="text-sm text-gray-500">{formatPKR(pkrAmount)}</span>
      </div>
    );
  };

  // Main loading state covers initial balance, settings, and history fetch
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center" style={{minHeight: 'calc(100vh - 10rem)'}}>
          <Loading message="Loading wallet data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Proof Modal */} 
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeProofModal}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-lg overflow-hidden max-w-3xl max-h-[90vh] w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Payment Proof</h3>
                <button
                  onClick={closeProofModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full"
                  aria-label="Close modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-4 flex-grow flex justify-center items-center overflow-auto bg-gray-100">
                {selectedProof.toLowerCase().endsWith('.pdf') ? (
                  <div className="text-center p-6 bg-white rounded-md shadow">
                    <FiFileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                    <p className="mb-4 text-gray-700">This is a PDF document.</p>
                    <a
                      href={getFullProofUrl(selectedProof)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                       <FiExternalLink className="mr-2" size={16}/> Open PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={getFullProofUrl(selectedProof)}
                    alt="Payment Proof"
                    className="max-w-full max-h-full object-contain rounded shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ""; // Clear src
                      e.target.alt = "Failed to load image";
                      e.target.outerHTML = `<div class="text-center p-6 bg-red-50 rounded-md text-red-700"><FiAlertCircle class="mx-auto h-12 w-12 mb-3"/><p>Failed to load proof image.</p></div>`;
                    }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <h1 className="text-3xl font-bold text-gray-800 mb-8">Wallet</h1>
        
         {/* Global Error */}
         {error && (
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

         {/* Global Success */}
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
        
         {/* Balance & Recharge Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
           {/* Balance Card */}
           <motion.div 
             variants={cardVariants}
             initial="hidden"
             animate="visible"
             className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
           >
             <div className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Balance</h2>
                   {loading ? (
                     <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                   ) : (
                     <div className="flex flex-col">
                       <span className="text-3xl font-bold text-gray-900">{formatCurrency(balance)}</span>
                       <span className="text-lg text-gray-500">{formatPKR(balance * currencyRate)}</span>
                     </div>
                   )}
                 </div>
                 <div className="bg-blue-50 p-4 rounded-full">
                   <FiDollarSign className="h-8 w-8 text-blue-500" />
                 </div>
               </div>
             </div>
           </motion.div>

           {/* Recharge Form Card */}
           <motion.div 
             variants={cardVariants}
             initial="hidden"
             animate="visible"
             transition={{ delay: 0.1 }}
             className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-6 lg:col-span-2"
            >
             <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b pb-3">Request Wallet Recharge</h2>
             
             {/* Deposit Methods Display - Updated to show single random method */}
             {randomDepositMethod ? (
                 <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                     <h3 className="text-sm font-semibold text-blue-800 mb-3">Deposit Instructions:</h3>
                     <p className="text-xs text-blue-700 mb-4">Please deposit your desired amount to the following account. After depositing, upload the proof of payment below.</p>
                     <div className="space-y-3">
                         {/* Display only the randomly selected method */}
                         <div className="text-xs border border-blue-200 bg-white p-3 rounded">
                             <p className="font-medium text-blue-900 mb-1">{randomDepositMethod.method}</p>
                             {randomDepositMethod.accountName && <p className="text-gray-600">Name: {randomDepositMethod.accountName}</p>}
                             {randomDepositMethod.accountNumber && 
                                <div className="flex items-center justify-between mt-0.5">
                                   <p className="text-gray-600">Number: <span className="font-mono">{randomDepositMethod.accountNumber}</span></p>
                                   <button 
                                     onClick={() => copyToClipboard(randomDepositMethod.accountNumber, `account-number`)} // Simplified key for single item
                                     className="text-blue-500 hover:text-blue-700 transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                                     title="Copy account number"
                                     aria-label="Copy account number"
                                   >
                                     {copiedValue === `account-number` ? <FiCheckCircle size={14} className="text-green-500" /> : <FiCopy size={14} />}
                                   </button>
                                 </div>
                              }
                         </div>
                     </div>
                 </div>
             ) : (
                 // Optional: Show a message if no accounts are defined (even hardcoded list is empty)
                 <p className="text-sm text-gray-500 mb-4">Deposit details are currently unavailable.</p>
             )}
             
             {/* Recharge Error Display */}
             {rechargeError && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg relative mb-4 text-sm flex items-center"
               >
                 <FiAlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                 <span>{rechargeError}</span>
                 <button onClick={() => setRechargeError(null)} className="ml-auto pl-2"><FiX size={16}/></button>
               </motion.div>
             )}

             <form onSubmit={handleRechargeRequest} className="space-y-4">
               <div>
                 <label htmlFor="rechargeAmount" className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                 <input
                   id="rechargeAmount"
                   type="number"
                   min="1"
                   step="0.01"
                   value={rechargeAmount}
                   onChange={e => setRechargeAmount(e.target.value)}
                   placeholder="Enter deposit amount"
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof Image</label>
                 <div className="flex items-center space-x-3">
                   <label className="flex-grow flex items-center justify-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-600">
                     <FiUpload className="mr-2 text-gray-500" />
                     <span>{proofFile ? proofFile.name : 'Choose Payment Proof'}</span>
                     <input type="file" onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                   </label>
                   {imagePreview && (
                     <div className="flex-shrink-0 relative group">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-10 w-10 rounded-md border border-gray-200 object-cover shadow-sm cursor-pointer"
                          onClick={() => openProofModal(imagePreview)} // Open modal on click
                         />
                         <button
                            type="button"
                            onClick={(e) => { 
                                e.stopPropagation(); // Prevent modal open
                                setProofFile(null); 
                                setImagePreview(''); 
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                           <FiX size={12} />
                         </button>
                     </div>
                   )}
                 </div>
                 <p className="text-xs text-gray-500 mt-1">Upload screenshot (PNG, JPG, JPEG, Max 5MB)</p>
               </div>
               
               {/* Submit Button */}
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
                 type="submit"
                 disabled={submitting || uploading || !proofFile}
                 className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                 {submitting ? (
                    <><FiLoader className="animate-spin mr-2" /> Submitting...</>
                 ) : uploading ? (
                    <><FiLoader className="animate-spin mr-2" /> Uploading...</>
                 ) : (
                    'Submit Recharge Request'
                 )}
               </motion.button>
             </form>
           </motion.div>
         </div>

         {/* Transaction History Section */}
         <motion.div 
             variants={cardVariants}
             initial="hidden"
             animate="visible"
             transition={{ delay: 0.2 }}
             className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
         >
           {/* History Header & Filters */}
           <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
             <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
             <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-500" />
                <select
                  value={filterType}
                  onChange={handleFilterChange}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition duration-150 ease-in-out"
                  aria-label="Filter transaction type"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="investment_made">Investments Made</option>
                  <option value="investment_return">Investment Returns</option>
                  <option value="referral_commission">Referral Commissions</option>
                  <option value="task_reward">Task Rewards</option>
                </select>
              </div>
           </div>
           
           {/* History Table/List */}
           <div className="overflow-x-auto">
             {historyLoading ? (
               <div className="text-center p-10">
                 <Loading message="Loading history..." mini />
               </div>
             ) : history.length === 0 ? (
               <div className="text-center p-10">
                 <FiInfo className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                 <p className="text-gray-500 text-sm">No transactions found{filterType ? ' for this filter' : ''}.</p>
               </div>
             ) : (
               <div className="divide-y divide-gray-200">
                 {history.map((transaction, index) => (
                   <motion.div
                     key={transaction._id}
                     custom={index}
                     variants={listItemVariants}
                     initial="hidden"
                     animate="visible"
                     className="p-4 hover:bg-gray-50"
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-4">
                         <div className={`p-2 rounded-full ${getTransactionIcon(transaction.type, transaction.amount).bg}`}>
                           {getTransactionIcon(transaction.type, transaction.amount).icon}
                         </div>
                         <div>
                           <p className="font-medium text-gray-900">{formatTypeLabel(transaction.type)}</p>
                           <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         {formatAmountWithPKR(transaction.amount)}
                         <p className="text-sm text-gray-500">{transaction.status}</p>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             )}
           </div>

           {/* Pagination Controls */}
           {totalPages > 1 && (
             <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
               <span className="text-xs text-gray-600">
                 Page {currentPage} of {totalPages} (Total: {totalItems} items)
               </span>
               <div className="inline-flex rounded-md shadow-sm -space-x-px">
                 <button
                   onClick={() => handlePageChange(currentPage - 1)}
                   disabled={currentPage === 1}
                   className="relative inline-flex items-center px-3 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                 >
                   Previous
                 </button>
                 {/* Simple Page indicator (can be enhanced with page numbers) */}
                 <span className="relative inline-flex items-center px-3 py-1.5 border-y border-gray-300 bg-white text-xs font-medium text-gray-700">
                    {currentPage} / {totalPages}
                 </span>
                 <button
                   onClick={() => handlePageChange(currentPage + 1)}
                   disabled={currentPage === totalPages}
                   className="relative inline-flex items-center px-3 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                 >
                   Next
                 </button>
               </div>
             </div>
           )}
         </motion.div>
       </div>
     </DashboardLayout>
   );
 };
 
 export default Wallet; 