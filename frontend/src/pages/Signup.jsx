import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiLock, FiKey, FiMail, FiUserCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const refParam = queryParams.get('ref');
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password2: '',
    email: '',
    parent_user_id: refParam || '',
    passkey: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [passkey, setPasskey] = useState('');
  const [isReferralFieldVisible, setIsReferralFieldVisible] = useState(!!refParam);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    // Prepare data for backend
    const payload = {
      firstName: formData.first_name,
      lastName: formData.last_name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      passkey: formData.passkey,
      phoneContact: formData.phone_number,
    };
    if (formData.parent_user_id) {
      payload.referralCode = formData.parent_user_id;
    }

    try {
      const response = await auth.register(payload);

      // Show passkey and success message
      setPasskey(payload.passkey);
      setSuccess('Account created successfully! Your passkey is: ' + payload.passkey);

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.error ||
        'Signup failed. Please try again.'
      );
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
            Create Account
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-blue-100 text-center"
          >
            Join our community today
          </motion.p>
        </div>
        
        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-8 py-6 space-y-4"
          onSubmit={handleSubmit}
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

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 text-green-500 p-3 rounded-lg text-sm"
            >
              {success}
              {passkey && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                  <p className="font-bold">IMPORTANT: Save your passkey!</p>
                  <p className="font-mono text-sm mt-1">{passkey}</p>
                  <p className="text-xs mt-1">You'll need this to reset your password.</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <motion.div 
              className="relative rounded-lg border border-gray-300 overflow-hidden"
              variants={inputVariants}
              whileFocus="focus"
              whileTap="tap"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiUser />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Your unique username"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <motion.div 
                className="relative rounded-lg border border-gray-300 overflow-hidden"
                variants={inputVariants}
                whileFocus="focus"
                whileTap="tap"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiUserCheck />
                </div>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                  placeholder="First name"
                  required
                  disabled={isLoading}
                />
              </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <motion.div 
                className="relative rounded-lg border border-gray-300 overflow-hidden"
                variants={inputVariants}
                whileFocus="focus"
                whileTap="tap"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiUserCheck />
                </div>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                  placeholder="Last name"
                  required
                  disabled={isLoading}
                />
              </motion.div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Your email address"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <motion.div 
              className="relative rounded-lg border border-gray-300 overflow-hidden"
              variants={inputVariants}
              whileFocus="focus"
              whileTap="tap"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiPhone />
              </div>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Your phone number"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

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
                value={formData.passkey}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Your passkey"
                required
                disabled={isLoading}
              />
            </motion.div>
            <p className="text-xs text-gray-500">This passkey will be used to reset your password if needed.</p>
          </motion.div>

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
                placeholder="Choose a secure password"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
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
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none"
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="space-y-2" 
            style={{ display: isReferralFieldVisible ? 'block' : 'none' }}
          >
            <label className="block text-sm font-medium text-gray-700">Referral Code</label>
            <motion.div 
              className="relative rounded-lg border border-gray-300 overflow-hidden bg-gray-100"
              variants={inputVariants}
              whileFocus="focus"
              whileTap="tap"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiUser />
              </div>
              <input
                type="text"
                name="parent_user_id"
                value={formData.parent_user_id}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border-0 outline-none bg-transparent"
                placeholder="Referral code applied"
                disabled={true}
              />
            </motion.div>
            <p className="text-xs text-gray-500">This code was applied from the referral link.</p>
          </motion.div>

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
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </motion.button>
          </motion.div>

          <motion.p 
            variants={itemVariants} 
            className="text-center text-sm text-gray-500 mt-4"
          >
            Already have an account? <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">Log in</a>
          </motion.p>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default Signup;



    // mongosh "mongodb://admin:yourpassword@blizon.tech:27017/referral-app?authSource=admin"