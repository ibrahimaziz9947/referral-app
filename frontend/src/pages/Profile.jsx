import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api';
import Loading from '../components/Loading';

import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiDollarSign, FiSave, FiLoader, FiInfo, FiCheckCircle, FiX, FiBriefcase } from 'react-icons/fi';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, duration: 0.5 }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    username: '', 
    email: '', 
    phoneContact: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await auth.getCurrentUser();
      setProfile(res.data);
      setForm({
          firstName: res.data?.firstName || '',
          lastName: res.data?.lastName || '',
          username: res.data?.username || '',
          email: res.data?.email || '',
          phoneContact: res.data?.phoneContact || '',
      });
    } catch (err) {
      setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await auth.updateCurrentUser(form);
      setProfile(res.data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <>
            <div className="flex justify-center items-center" style={{minHeight: 'calc(100vh - 10rem)'}}>
                 <Loading message="Loading your profile..." />
            </div>
        </>
    );
  }
  
  if (!profile) {
     return (
        <>
            <div className="container mx-auto px-4 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
                    role="alert"
                >
                    <FiInfo className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"/>
                    <p className="text-sm">{error || 'Could not load profile data.'}</p>
                    <button onClick={fetchUserProfile} className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full"><FiX size={18}/></button>
                </motion.div>
            </div>
        </>
     );
  }

  return (
    <>
      <motion.div 
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-800 mb-8">Your Profile</motion.h1>
        
         <AnimatePresence>
           {error && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
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
               exit={{ opacity: 0, y: -10 }}
               className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
               role="alert"
             >
               <FiCheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/>
               <p className="text-sm">{success}</p>
               <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full"><FiX size={18}/></button>
             </motion.div>
           )}
         </AnimatePresence>
        
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
                variants={itemVariants}
                className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center"
            >
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                     <FiUser size={40} className="text-indigo-500" />
                 </div>
                 <h2 className="text-xl font-semibold text-gray-800">{profile.firstName} {profile.lastName}</h2>
                 <p className="text-sm text-gray-500 mb-4">@{profile.username}</p>
                 
                 <div className="w-full border-t border-gray-100 pt-4 mt-4 space-y-3 text-sm text-left">
                    <div className="flex items-center text-gray-600">
                        <FiMail size={16} className="mr-3 text-blue-500 flex-shrink-0"/>
                        <span>{profile.email}</span>
                    </div>
                     <div className="flex items-center text-gray-600">
                        <FiPhone size={16} className="mr-3 text-green-500 flex-shrink-0"/>
                        <span>{profile.phoneContact || 'Not provided'}</span>
                    </div>
                     <div className="flex items-center text-gray-600">
                        <FiCalendar size={16} className="mr-3 text-purple-500 flex-shrink-0"/>
                        <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                     <div className="flex items-center text-gray-600">
                        <FiShield size={16} className="mr-3 text-yellow-500 flex-shrink-0"/>
                        <span>Account: {profile.isAdmin ? 'Administrator' : 'User'}</span>
                    </div>
                     <div className="flex items-center text-gray-600">
                        <FiDollarSign size={16} className="mr-3 text-indigo-500 flex-shrink-0"/>
                        <span>Balance: ${profile.wallet?.toFixed(2) || '0.00'}</span>
                    </div>
                    {profile.referralLevel && (
                       <div className="flex items-center text-gray-600">
                         <FiBriefcase size={16} className="mr-3 text-orange-500 flex-shrink-0"/>
                          <span>Level: {profile.referralLevel.charAt(0).toUpperCase() + profile.referralLevel.slice(1)}</span>
                       </div>
                    )}
                 </div>
             </motion.div>
             
             <motion.div 
                variants={itemVariants}
                className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100"
             >
                <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Update Your Information</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        id="firstName"
                        name="firstName" 
                        value={form.firstName}
                        onChange={handleChange} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                        required 
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        id="lastName"
                        name="lastName" 
                        value={form.lastName}
                        onChange={handleChange} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      id="username"
                      name="username" 
                      value={form.username}
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      id="email"
                      name="email" 
                      type="email"
                      value={form.email}
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed focus:outline-none text-sm" 
                      required 
                      readOnly
                      title="Email address cannot be changed."
                    />
                     <p className="text-xs text-gray-500 mt-1">Email cannot be changed after registration.</p>
                  </div>
                  
                  <div>
                    <label htmlFor="phoneContact" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      id="phoneContact"
                      name="phoneContact" 
                      type="tel"
                      value={form.phoneContact}
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                    />
                  </div>
                  
                  <div className="pt-3">
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit" 
                      className="w-full flex justify-center items-center bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out shadow-sm disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? (
                          <><FiLoader className="animate-spin mr-2 h-5 w-5"/> Saving...</>
                      ) : (
                          <><FiSave className="mr-2 h-5 w-5"/> Save Changes</>
                      )}
                    </motion.button>
                  </div>
                </form>
             </motion.div>
         </div>
       </motion.div>
     </>
   );
} 