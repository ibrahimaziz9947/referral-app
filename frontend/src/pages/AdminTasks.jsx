import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiList, FiCheckCircle, FiXCircle, FiClock, FiImage, FiSave, FiFilter } from 'react-icons/fi';
import { tasks, uploads } from '../services/api';
import AdminDashboard from './AdminDashboard';

const AdminTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const fileInputRef = useRef(null);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    status: 'active'
  });
  const [taskImage, setTaskImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter submissions based on selected status
    if (submissionStatusFilter === 'all') {
      setFilteredSubmissions(allSubmissions);
    } else {
      setFilteredSubmissions(
        allSubmissions.filter(submission => submission.status === submissionStatusFilter)
      );
    }
  }, [submissionStatusFilter, allSubmissions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, submissionsRes] = await Promise.all([
        tasks.getAll(),
        tasks.getSubmissions()
      ]);
      setAllTasks(tasksRes.data || []);
      
      // Store all submissions
      const submissions = submissionsRes.data || [];
      setAllSubmissions(submissions);
      
      // Set pending submissions separately for the notification badge
      setPendingSubmissions(submissions.filter(s => s.status === 'pending'));
      
      // Initialize filtered submissions based on default filter (pending)
      setFilteredSubmissions(submissions.filter(s => s.status === 'pending'));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reward: '',
      status: 'active'
    });
    setTaskImage(null);
    setImagePreview('');
    setCurrentTask(null);
  };

  const openCreateTaskModal = () => {
    resetForm();
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setCurrentTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      reward: task.reward,
      status: task.status
    });
    setImagePreview(task.image);
    setIsTaskModalOpen(true);
  };

  const openSubmissionModal = (submission) => {
    setCurrentSubmission(submission);
    setIsSubmissionModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    resetForm();
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setCurrentSubmission(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'reward' ? parseFloat(value) || '' : value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTaskImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.title.trim() || !formData.description.trim() || !formData.reward) {
        throw new Error('Please fill all required fields');
      }

      if (!currentTask && !taskImage && !imagePreview) {
        throw new Error('Task image is required');
      }

      // Upload image if there's a new one
      let imageUrl = currentTask?.image || '';
      if (taskImage) {
        const formData = new FormData();
        formData.append('proofImage', taskImage);
        
        const uploadResponse = await uploads.uploadFile(formData);
        imageUrl = uploadResponse.data.fileUrl;
      }

      const taskData = {
        ...formData,
        image: imageUrl
      };

      if (currentTask) {
        // Update existing task
        await tasks.update(currentTask._id, taskData);
        setSuccess('Task updated successfully!');
      } else {
        // Create new task
        await tasks.create(taskData);
        setSuccess('Task created successfully!');
      }

      // Refresh the tasks list
      await fetchData();
      setTimeout(() => {
        closeTaskModal();
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message || 'Failed to save task. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    try {
      await tasks.delete(taskId);
      setSuccess('Task deleted successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async (status) => {
    if (!currentSubmission) return;

    try {
      if (status === 'approved') {
        await tasks.approveCompletion(currentSubmission.task._id, currentSubmission._id);
      } else {
        await tasks.rejectCompletion(currentSubmission.task._id, currentSubmission._id);
      }

      setSuccess(`Submission ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      await fetchData();
      
      setTimeout(() => {
        closeSubmissionModal();
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error reviewing submission:', err);
      setError('Failed to review submission. Please try again.');
    }
  };

  const renderTaskModal = () => {
    if (!isTaskModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {currentTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button 
                onClick={closeTaskModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span className="block">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                <span className="block">{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateTask}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="title">
                  Title*
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="reward">
                  Reward ($)*
                </label>
                <input
                  id="reward"
                  name="reward"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reward}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Task Image*
                </label>
                {imagePreview ? (
                  <div className="relative mb-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 w-full object-contain rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTaskImage(null);
                        setImagePreview(currentTask?.image || '');
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">Click to upload an image</p>
                    <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" /> Save Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmissionModal = () => {
    if (!isSubmissionModalOpen || !currentSubmission) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Review Submission</h3>
              <button 
                onClick={closeSubmissionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span className="block">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                <span className="block">{success}</span>
              </div>
            )}

            <div className="mb-6">
              <div className="mb-4">
                <h4 className="font-medium text-lg">{currentSubmission.task?.title || 'Task'}</h4>
                <p className="text-sm text-gray-600">{currentSubmission.task?.description}</p>
                <p className="text-green-600 font-medium mt-1">Reward: ${currentSubmission.task?.reward}</p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium">Submitted by:</h4>
                <p className="text-sm">{currentSubmission.user?.name || currentSubmission.user?.email || 'Unknown user'}</p>
                <p className="text-xs text-gray-500">
                  Submitted on: {new Date(currentSubmission.createdAt).toLocaleString()}
                </p>
              </div>

              {currentSubmission.submissionDetails && (
                <div className="mb-4">
                  <h4 className="font-medium">Submission Details:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{currentSubmission.submissionDetails}</p>
                </div>
              )}

              {currentSubmission.proofUrl && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Proof Image:</h4>
                  <img 
                    src={`https://api.cashczar.site${currentSubmission.proofUrl}`}
                    alt="Proof" 
                    className="max-h-64 w-full object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => handleReviewSubmission('rejected')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
              >
                <FiXCircle className="mr-2" /> Reject
              </button>
              
              <button
                onClick={() => handleReviewSubmission('approved')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
              >
                <FiCheckCircle className="mr-2" /> Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminDashboard>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'tasks'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              Manage Tasks
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'submissions'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors relative`}
            >
              Submissions
              {pendingSubmissions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">All Tasks</h2>
              <button
                onClick={openCreateTaskModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
              >
                <FiPlus className="mr-2" /> Add New Task
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading tasks...</p>
              </div>
            ) : allTasks.length === 0 ? (
              <div className="text-center py-8">
                <FiList className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500">No tasks found. Create your first task!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 line-clamp-2">{task.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${task.reward}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {task.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Submissions</h2>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-700">
                  <FiFilter className="inline-block mr-1" /> Filter:
                </span>
                <select
                  value={submissionStatusFilter}
                  onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Submissions</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FiCheck className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500">
                  {submissionStatusFilter === 'pending' 
                    ? 'No pending submissions. All caught up!' 
                    : `No ${submissionStatusFilter} submissions found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div 
                    key={submission._id} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between ${
                      submission.status === 'approved' ? 'border-green-200 bg-green-50' :
                      submission.status === 'rejected' ? 'border-red-200 bg-red-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-lg text-gray-800">{submission.task?.title || 'Task details unavailable'}</h3>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          submission.status === 'approved' ? 'bg-green-200 text-green-800' :
                          submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Submitted by:</span> {submission.user?.name || submission.user?.email || 'Unknown user'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted on: {new Date(submission.createdAt).toLocaleString()}
                      </p>
                      {submission.reviewedAt && (
                        <p className="text-xs text-gray-500">
                          Reviewed on: {new Date(submission.reviewedAt).toLocaleString()}
                          {submission.reviewedBy && ` by ${submission.reviewedBy.email}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                      {submission.proofUrl && (
                        <a 
                          href={`https://api.cashczar.site${submission.proofUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center mr-4"
                        >
                          <FiImage className="mr-1" /> View Proof
                        </a>
                      )}
                      {submission.status === 'pending' && (
                        <button
                          onClick={() => openSubmissionModal(submission)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {renderTaskModal()}
      {renderSubmissionModal()}
    </AdminDashboard>
  );
};

export default AdminTasks; 