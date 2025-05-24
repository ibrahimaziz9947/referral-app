import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiDollarSign, FiTrendingUp, FiCheckSquare, FiGift, FiLogOut, FiSettings, FiBarChart2, FiUserCheck, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PiHandWithdrawDuotone } from "react-icons/pi";
import logo from '../assets/logo.png';


// Animation variants for sidebar links
const linkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  }),
};

// Pass mobileClose prop if needed to close the sidebar from within (e.g., on link click)
// Pass isMobileOverlay to control fixed positioning
const UserSidebar = ({ mobileClose, isMobileOverlay = false }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (mobileClose) mobileClose(); // Close mobile sidebar on logout
  };

  const handleLinkClick = () => {
    if (mobileClose) mobileClose(); // Close mobile sidebar on link click
  };

  // Updated link styles for light theme
  const linkClasses = "flex items-center px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200 font-medium relative overflow-hidden z-0";
  // Pseudo-element for hover effect
  const hoverEffectClasses = "before:absolute before:inset-y-0 before:left-0 before:w-full before:bg-blue-100 before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10";
  // Text/icon hover state
  const textHoverClasses = "hover:text-blue-700";
  // Combine base, hover effect, and text hover
  const linkClassesCombined = `${linkClasses} ${hoverEffectClasses} ${textHoverClasses} hover:before:scale-x-100`;
  
  // Active link: Different text color/weight, no background change
  const activeLinkClasses = "text-blue-700 font-semibold";

  const adminLinks = user?.isAdmin ? [
    { to: "/admin/dashboard", icon: FiBarChart2, label: "Admin Overview" },
    { to: "/admin/users", icon: FiUserCheck, label: "Manage Users" },
    { to: "/admin/tasks", icon: FiCheckSquare, label: "Manage Tasks" },
    { to: "/admin/investments", icon: FiTrendingUp, label: "Manage Investments" },
    { to: "/admin/settings", icon: FiSettings, label: "Site Settings" },
  ] : [];

  const userLinks = [
    { to: "/dashboard", icon: FiHome, label: "Home", end: true },
    { to: "/user/investments", icon: FiTrendingUp, label: "Investments" },
    { to: "/user/tasks", icon: FiCheckSquare, label: "Tasks" },
    { to: "/user/wallet", icon: FiDollarSign, label: "Wallet" },
    { to: "/user/team", icon: FiGift, label: "Teams" },
    { to: "/user/withdrawl", icon: PiHandWithdrawDuotone, label: "Withdraw" },
    { to: "/user/profile", icon: FiUser, label: "My Profile" },
  ];

  return (
    // Conditionally apply 'fixed' class based on isMobileOverlay prop
    <div className={`flex flex-col h-full w-64 bg-white text-gray-800 shadow-lg border-r border-gray-200 ${!isMobileOverlay ? 'fixed' : ''}`}>
      {/* Logo or Brand */}
      <div className="flex items-center justify-center h-40 border-b border-gray-200">
        <img src={logo} alt="Logo" className="w-40 h-40" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {userLinks.map((link, index) => (
          <motion.div
            key={link.to}
            custom={index}
            variants={linkVariants}
            initial="hidden"
            animate="visible"
          >
            <NavLink
              to={link.to}
              // Combine base classes, hover setup, and active state logic
              className={({ isActive }) => `${linkClassesCombined} ${isActive ? activeLinkClasses : ''}`}
              end={link.end}
              onClick={handleLinkClick}
            >
              {/* Ensure icon and label are above the pseudo-element */}
              <span className="relative z-10 flex items-center">
                  <link.icon className="mr-3 h-5 w-5 flex-shrink-0" /> {link.label}
              </span>
            </NavLink>
          </motion.div>
        ))}

        {user?.isAdmin && adminLinks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Area</p>
            {adminLinks.map((link, index) => (
              <motion.div
                key={link.to}
                custom={userLinks.length + index}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `${linkClassesCombined} ${isActive ? activeLinkClasses : ''}`}
                  onClick={handleLinkClick}
                >
                  <span className="relative z-10 flex items-center">
                     <link.icon className="mr-3 h-5 w-5 flex-shrink-0" /> {link.label}
                  </span>
                </NavLink>
              </motion.div>
            ))}
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-200">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: (userLinks.length + adminLinks.length) * 0.05 + 0.1 } }}
          onClick={handleLogout}
          // Simple hover for logout button
          className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors duration-200 font-medium"
        >
          <FiLogOut className="mr-3 h-5 w-5" /> Logout
        </motion.button>
      </div>
    </div>
  );
};

export default UserSidebar;
