import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiKey } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetData, setResetData] = useState({
    email: '',
    username: '',
    passkey: '',
    new_password: '',
    new_password2: ''
  });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (showResetForm) {
      setResetData(prev => ({ ...prev, [name]: value }));
      setResetError('');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Use the AuthContext login to set up user and token
    const result = await login(formData.email, formData.password);
    if (result.success) {
      // Redirect admins to admin dashboard, regular users to user dashboard
      if (result.isAdmin) {
        navigate('/admin/dashboard');
      } else {
      navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResetError('');
    setResetSuccess('');

    if (resetData.new_password !== resetData.new_password2) {
      setResetError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await auth.resetPassword({
        email: resetData.email,
        passkey: resetData.passkey,
        newPassword: resetData.new_password
      });
      
      setResetSuccess('Password reset successful! You can now login with your new password.');
      setShowResetForm(false);
      setResetData({
        email: '',
        username: '',
        passkey: '',
        new_password: '',
        new_password2: ''
      });
    } catch (err) {
      setResetError(err.error || 'Password reset failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputVariants = {
    focus: { scale: 1.02, boxShadow: '0 0 8px rgba(66, 153, 225, 0.5)' },
    tap: { scale: 0.98 }
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: '#2563eb' },
    tap: { scale: 0.95 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white text-center"
          >
            {showResetForm ? 'Reset Password' : 'Welcome Back'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-blue-100 text-center"
          >
            {showResetForm ? 'Enter your credentials to reset your password' : 'Sign in to your account'}
          </motion.p>
        </div>
        
        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-8 py-6 space-y-4"
          onSubmit={showResetForm ? handleResetPassword : handleLogin}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-500 p-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {resetError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-500 p-3 rounded-lg text-sm"
            >
              {resetError}
            </motion.div>
          )}

          {resetSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 text-green-500 p-3 rounded-lg text-sm"
            >
              {resetSuccess}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <motion.div 
              className="relative rounded-lg border border-gray-300 overflow-hidden"
              variants={inputVariants}
              whileFocus="focus"
              whileTap="tap"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiMail />
              </div>
              <input
                type="email"
                name={showResetForm ? 'email' : 'email'}
                value={showResetForm ? resetData.email : formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Email address"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

          {!showResetForm ? (
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <motion.div 
                className="relative rounded-lg border border-gray-300 overflow-hidden"
                variants={inputVariants}
                whileFocus="focus"
                whileTap="tap"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                  placeholder="Your password"
                  required
                  disabled={isLoading}
                />
              </motion.div>
            </motion.div>
          ) : (
            <>
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Passkey</label>
                <motion.div 
                  className="relative rounded-lg border border-gray-300 overflow-hidden"
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiKey />
                  </div>
                  <input
                    type="text"
                    name="passkey"
                    value={resetData.passkey}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                    placeholder="Your passkey"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <motion.div 
                  className="relative rounded-lg border border-gray-300 overflow-hidden"
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiLock />
                  </div>
                  <input
                    type="password"
                    name="new_password"
                    value={resetData.new_password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                    placeholder="New password"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <motion.div 
                  className="relative rounded-lg border border-gray-300 overflow-hidden"
                  variants={inputVariants}
                  whileFocus="focus"
                  whileTap="tap"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiLock />
                  </div>
                  <input
                    type="password"
                    name="new_password2"
                    value={resetData.new_password2}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>
            </>
          )}

          <motion.div 
            variants={itemVariants}
            className="pt-4"
          >
            <motion.button
              variants={buttonVariants}
              whileHover={!isLoading && "hover"}
              whileTap={!isLoading && "tap"}
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {showResetForm ? 'Resetting password...' : 'Signing in...'}
                </span>
              ) : (showResetForm ? 'Reset Password' : 'Sign In')}
            </motion.button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between mt-4"
          >
            <button
              type="button"
              onClick={() => setShowResetForm(!showResetForm)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {showResetForm ? 'Back to login' : 'Forgot password?'}
            </button>
            {!showResetForm && (
              <a href="/signup" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Create account
              </a>
            )}
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default Login;