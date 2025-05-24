import axios from 'axios';

const API_URL = 'https://api.cashczar.site/api';
// const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/signup', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateCurrentUser: (userData) => api.put('/auth/me', userData),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Tasks endpoints
export const tasks = {
  getAll: () => api.get('/tasks'),
  getAvailableTasks: () => api.get('/tasks'),
  getMySubmissions: () => api.get('/tasks/my-submissions'),
  getSubmissions: (status) => api.get(`/tasks/submissions${status ? `?status=${status}` : ''}`),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  submitTask: (taskId, payload) => api.post('/tasks/submit', { 
    taskId, 
    submissionDetails: payload.submissionDetails || '',
    proofUrl: payload.proofUrl || null 
  }),
  approveCompletion: (id, completionId) => api.post(`/tasks/${id}/completions/${completionId}/approve`),
  rejectCompletion: (id, completionId) => api.post(`/tasks/${id}/completions/${completionId}/reject`),
};

// Investments endpoints
export const investments = {
  getAll: () => api.get('/investments'),
  getUserInvestments: () => api.get('/investments/my-investments'),
  getAllAdminInvestments: () => api.get('/investments/admin/investments'),
  create: (investmentData) => api.post('/investments', investmentData),
  update: (id, investmentData) => api.put(`/investments/${id}`, investmentData),
  delete: (id) => api.delete(`/investments/${id}`),
  invest: (id, amount) => api.post(`/investments/${id}/invest`, { amount }),
};

// Users endpoints
export const users = {
  getAll: () => api.get('/users'),
  getAllWithDetails: () => api.get('/auth/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Upload endpoint
export const uploads = {
  uploadFile: (formData) => api.post('/upload/proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data' // Important for file uploads
    }
  })
};

// Wallet endpoints
export const wallet = {
  getBalance: () => api.get('/wallet/balance'),
  requestRecharge: (data) => api.post('/wallet/recharge', data),
  getRechargeHistory: () => api.get('/wallet/recharge-history'),
  getHistory: (params) => api.get('/wallet/history', { params }),
  reviewRecharge: (requestId, data) => api.post(`/wallet/admin/review-recharge/${requestId}`, data),
  getAllRechargeRequests: () => api.get('/wallet/admin/recharge-requests'),
  adminReviewRecharge: (requestId, status) => api.post(`/wallet/admin/review-recharge/${requestId}`, { status }),
};

// Earnings endpoints
export const earnings = {
  getSummary: () => api.get('/earnings/summary'),
  getHistory: () => api.get('/earnings/history'),
  getByType: (params) => api.get('/earnings/by-type', { params }),
  requestWithdrawal: (data) => api.post('/earnings/withdraw', data),
  getWithdrawalHistory: () => api.get('/earnings/withdrawals'),
  adminReviewWithdrawal: (withdrawalId, status) => api.post(`/earnings/admin/review-withdrawal/${withdrawalId}`, { status })
};

// Team endpoints
export const team = {
  getTeamMembers: () => api.get('/team/members'),
  getReferralStats: () => api.get('/team/stats'),
  getReferralLink: () => api.get('/team/referral-link'),
  generateReferralLink: () => api.post('/team/generate-link'),
};

// Settings endpoints
export const settings = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  bulkUpdate: (settings) => api.put('/settings/bulk-update', { settings }),
  create: (settingData) => api.post('/settings', settingData),
  delete: (key) => api.delete(`/settings/${key}`),
  initialize: () => api.post('/settings/initialize')
};

// Admin Analytics endpoints
export const adminAnalytics = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getUserGrowth: (params) => api.get('/admin/analytics/user-growth', { params }),
  getInvestmentSummary: (params) => api.get('/admin/analytics/investment-summary', { params }),
};

// Add new admin withdrawal functions
export const adminWithdrawals = {
  getRequests: (status = 'pending') => api.get('/admin/withdrawals', { params: { status } }),
  approveRequest: (id) => api.put(`/admin/withdrawals/${id}/approve`),
  rejectRequest: (id) => api.put(`/admin/withdrawals/${id}/reject`),
};

export const siteSettings = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  getCurrencyRate: () => api.get('/settings/currency_conversion_rate')
};

export default api; 