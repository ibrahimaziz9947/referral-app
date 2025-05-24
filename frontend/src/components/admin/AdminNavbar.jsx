import React from 'react';
import { motion } from 'framer-motion';
import { RiLogoutBoxLine } from "react-icons/ri";

const navVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3 }
  }
};

const logoutVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { delay: 0.3, duration: 0.3 }
  },
  hover: { 
    scale: 1.05, 
    transition: { duration: 0.2 }
  }
};

const AdminNavbar = ({ onMobileMenuClick, onLogout }) => {
  
  const handleLogout = () => {
    // Clear any stored data (adjust this as needed)
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to the home page
    window.location.href = '/';
  };

  return (
    <motion.nav 
      className="bg-zinc-800 text-white flex justify-between items-center px-8 py-5"
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <div className="flex items-center">
        {onMobileMenuClick && (
          <button onClick={onMobileMenuClick} className="md:hidden mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      <div className="hidden md:flex items-center">
        <motion.button
          onClick={onLogout || handleLogout}
          variants={logoutVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          className="flex cursor-pointer items-center font-medium space-x-2 px-4 py-2 rounded-sm"
        >
          <span className="font-montserrat font-semibold">Logout</span>
          <RiLogoutBoxLine className="text-lg" />
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default AdminNavbar;
