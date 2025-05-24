import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.3 }
  }),
};

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15, ease: 'easeIn' } }
};

const UserNavbar = ({ onMobileMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <motion.nav 
      className="bg-white text-gray-800 shadow-sm sticky top-0 z-30 border-b border-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div custom={0} variants={navItemVariants} initial="hidden" animate="visible" className="md:hidden">
            <button
              onClick={onMobileMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-label="Open menu"
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </motion.div>

          <motion.div custom={1} variants={navItemVariants} initial="hidden" animate="visible" className="hidden md:block">
             <Link to="/dashboard" className="text-xl font-bold text-gray-700 hover:text-blue-600 transition-colors">Welcome</Link>
          </motion.div>

          <div className="flex items-center space-x-4">
            {/* Wallet Balance Display */}
            {user && typeof user.walletBalance !== 'undefined' && (
              <motion.div
                custom={2} // Adjust animation delay index if needed
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                className="bg-green-50 text-green-800 px-5 py-2 rounded-md text-sm font-medium shadow-sm"
              >
                My Balance: {Number(user.walletBalance).toFixed(2)}
              </motion.div>
            )}


          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default UserNavbar;
