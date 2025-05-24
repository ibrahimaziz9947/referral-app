// DashboardTemplate.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { FiHelpCircle, FiX, FiMessageSquare } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import UserNavbar from '../components/UserNavbar';
import UserSidebar from '../components/UserSidebar';
import UserFooter from '../components/UserFooter';
import BottomNavbar from '../components/BottomNavbar';

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'tween', duration: 0.3 },
  },
  exit: {
    x: '-100%',
    transition: { type: 'tween', duration: 0.3 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.6, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const mainVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeInOut" }
  },
};

const popupBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const popupContentVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleSupportPopup = () => setShowSupportPopup((prev) => !prev);

  const WHATSAPP_NUMBER = '+923010671961';
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}`;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <div className="hidden md:block w-64 flex-shrink-0">
        <UserSidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <UserNavbar onMobileMenuClick={toggleSidebar} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
          <motion.div
            key={location.pathname}
            variants={mainVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
        <UserFooter />
      </div>
      <div className="block md:hidden">
        <BottomNavbar />
      </div>
      <motion.button
        onClick={toggleSupportPopup}
        className="fixed bottom-20 right-6 z-40 bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
        aria-label="Open Support Chat"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiMessageSquare size={24} />
      </motion.button>
      <AnimatePresence>
        {showSupportPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={popupBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="absolute inset-0 bg-black/60" onClick={toggleSupportPopup}></div>
            
            <motion.div
              className="relative bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm w-full p-6 text-center"
              variants={popupContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button 
                onClick={toggleSupportPopup} 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full"
                aria-label="Close support popup"
              >
                <FiX size={20} />
              </button>
              
              <FiHelpCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Assistance?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Click the button below to chat with our support team directly on WhatsApp.
              </p>
              
              <motion.a
                href={whatsappLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaWhatsapp className="mr-2" size={20}/>
                Chat on WhatsApp
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
          >
            <motion.div
              className="fixed inset-0 bg-black"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={toggleSidebar}
            />
            <motion.div
              className="relative flex-1 flex flex-col max-w-xs w-full shadow-lg bg-white"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <UserSidebar mobileClose={toggleSidebar} isMobileOverlay={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
