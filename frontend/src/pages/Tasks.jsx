import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { tasks, uploads, siteSettings } from '../services/api';
import { FiCheckCircle, FiClock, FiXCircle, FiUpload, FiX, FiImage, FiAward, FiList, FiPaperclip, FiLoader, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { formatCurrency, formatPKR } from '../utils/currency';

// Animation variants
const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' }
  }),
};

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

export default function Tasks() {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [submittedTasks, setSubmittedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [currencyRate, setCurrencyRate] = useState(280); // Default rate
  const { user } = useAuth();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [availRes, submittedRes, currencyRes] = await Promise.all([
        tasks.getAvailableTasks(),
        tasks.getMySubmissions(),
        siteSettings.getCurrencyRate()
      ]);
      setAvailableTasks(availRes.data || []);
      setSubmittedTasks(submittedRes.data || []);
      setCurrencyRate(currencyRes.data?.value || 280);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError('Failed to load tasks. Please try again later.');
      setAvailableTasks([]);
      setSubmittedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setComment('');
    setProofImage(null);
    setImagePreview('');
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setSelectedTask(null);
        setComment('');
        setProofImage(null);
        setImagePreview('');
        setModalError('');
        setUploadingImage(false);
    }, 300);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setModalError('File size exceeds 5MB limit.');
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setModalError('Invalid file type. Please upload PNG, JPG, or JPEG.');
        return;
      }
      
      setModalError('');
      setProofImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask || !proofImage) {
        setModalError('Proof image is required.');
        return;
    }
    
    setUploadingImage(true);
    setModalError('');
    
    try {
      let proofUrl = null;
      const formData = new FormData();
      formData.append('proofImage', proofImage);
      
      const uploadResponse = await uploads.uploadFile(formData);
      proofUrl = uploadResponse.data.fileUrl;
      
      if (!proofUrl) throw new Error('Image upload failed to return URL.');

      await tasks.submitTask(selectedTask._id, {
        submissionDetails: comment,
        proofUrl: proofUrl
      });
      
      setSuccess('Task submitted successfully! Your submission is pending review.');
      closeModal();
      await fetchData();
      
    } catch (err) {
      console.error("Error submitting task:", err);
      setModalError(err.response?.data?.message || 'Failed to submit task. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { icon: FiCheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Approved' };
      case 'rejected':
        return { icon: FiXCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Rejected' };
      case 'pending':
      default:
        return { icon: FiClock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' };
    }
  };

  const renderModal = () => {
    return (
      <AnimatePresence>
        {isModalOpen && selectedTask && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div 
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 md:p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">Submit Task Proof</h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full"
                  aria-label="Close modal"
                >
                  <FiX size={22} />
                </button>
              </div>

              <div className="p-5 md:p-6 overflow-y-auto flex-grow">
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <h4 className="font-semibold text-lg text-gray-700">{selectedTask.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                  <div className="flex items-center gap-2">
                  <p className="text-green-600 font-medium mt-2 text-sm flex items-center"><FiAward className="mr-1.5"/>Reward: {formatCurrency(selectedTask.reward || 0)}</p>
                  <p className="text-xs text-gray-500 mt-2">({formatPKR((selectedTask.reward || 0) * currencyRate)})</p>
                  </div>
                </div>
                
                {modalError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg relative mb-4 text-sm flex items-start"
                  >
                    <FiAlertCircle className="h-5 w-5 mr-2 flex-shrink-0"/>
                    <span>{modalError}</span>
                    <button onClick={() => setModalError('')} className="ml-auto pl-2"><FiX size={16}/></button>
                  </motion.div>
                )}
                
                <form id="task-submission-form" onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Proof Image <span className="text-red-500">*</span>
                    </label>
                    {imagePreview ? (
                      <div className="relative mb-2 group">
                        <img 
                          src={imagePreview} 
                          alt="Proof Preview" 
                          className="max-h-48 w-auto rounded-md border border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProofImage(null);
                            setImagePreview('');
                            if(fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                          aria-label="Remove image"
                        >
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <FiImage className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-600">Click to upload screenshot</p>
                        <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, JPEG (Max 5MB)</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Proof image upload"
                    />
                  </div>
                  
                  <div className="mb-5">
                    <label htmlFor="submissionComment" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Comment (Optional)
                    </label>
                    <textarea
                      id="submissionComment"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                      rows="3"
                      placeholder="Add any relevant details about your submission..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                </form>
              </div>

              <div className="p-4 md:p-5 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
                  disabled={uploadingImage}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit" 
                  form="task-submission-form"
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!proofImage || uploadingImage}
                >
                  {uploadingImage ? (
                    <><FiLoader className="animate-spin mr-2 h-4 w-4" /> Submitting...</>
                  ) : (
                    <><FiUpload className="mr-2 h-4 w-4" /> Submit Task</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
        <>
             <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 10rem)'}}> 
                 <Loading message="Loading tasks..." />
             </div>
        </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Tasks Center</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-5 py-2 text-sm font-medium rounded-md ${ activeTab === 'available' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700' } transition-all duration-200 ease-in-out relative`}
            >
              Available Tasks
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-5 py-2 text-sm font-medium rounded-md ${ activeTab === 'submissions' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700' } transition-all duration-200 ease-in-out relative`}
            >
              My Submissions
            </button>
          </div>
        </div>

        {error && (
          <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiInfo className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{error}</p>
             <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}

        {success && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiCheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{success}</p>
             <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {activeTab === 'available' && (
              <div>
                {availableTasks.length === 0 && !loading ? (
                  <div className="text-center bg-white p-10 rounded-lg shadow border border-gray-200">
                    <FiAward className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Available</h3>
                    <p className="text-sm text-gray-500">Check back later for new opportunities to earn!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTasks.map((task, index) => (
                      <motion.div 
                        key={task._id}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }} 
                        className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg"
                       >
                        {task.image && 
                            <img 
                                src={`https://api.cashczar.site${task.image}`} 
                                alt={`${task.title} preview`} 
                                className="w-full h-36 object-cover" 
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        }
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-semibold text-lg text-gray-800 mb-1.5 line-clamp-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-gray-700">
                              <FiAward className="mr-2 h-4 w-4 text-yellow-500" />
                              <span>Reward:</span>
                              <div className="ml-2 text-right flex items-center gap-2">
                                <div className="font-medium">{formatCurrency(task.reward || 0)}</div>
                                <div className="text-xs text-gray-500">({formatPKR((task.reward || 0) * currencyRate)})</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openSubmitModal(task)}
                                className={`px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md flex items-center transition duration-200 shadow-sm ${task.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={task.status !== 'active'}
                                title={task.status !== 'active' ? 'Task is inactive' : 'Submit proof for this task'}
                              >
                                <FiUpload className="mr-1.5 h-4 w-4" /> Submit
                              </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                {submittedTasks.length === 0 && !loading ? (
                  <div className="text-center bg-white p-10 rounded-lg shadow border border-gray-200">
                     <FiList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                     <p className="text-sm text-gray-500">You haven't submitted any tasks. Complete tasks from the 'Available' tab to see them here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submittedTasks.map((submission, index) => {
                       const statusInfo = getStatusInfo(submission.status);
                       return (
                          <motion.div 
                            key={submission._id}
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-gray-800 truncate" title={submission.task?.title}>{submission.task?.title || 'Task details unavailable'}</h3>
                                
                                {submission.submissionDetails && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    <span className="font-medium text-gray-500">Comment:</span> {submission.submissionDetails}
                                  </p>
                                )}
                                
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                  <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                                  {submission.reviewedAt && (
                                    <span className="flex items-center"><FiCheckCircle size={12} className="mr-1"/> Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-start sm:items-end gap-2 pt-2 sm:pt-0">
                                <div className={`inline-flex items-center space-x-1.5 capitalize px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                                  <statusInfo.icon className="h-3.5 w-3.5" />
                                  <span>{statusInfo.label}</span>
                                </div>
                                
                                {submission.proofUrl && (
                                  <a 
                                    href={`https://api.cashczar.site${submission.proofUrl}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center transition-colors"
                                  >
                                    <FiPaperclip className="mr-1 h-3.5 w-3.5" /> View Proof
                                  </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                       );
                     })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {renderModal()}
    </>
  );
} 