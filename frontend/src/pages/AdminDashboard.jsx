// DashboardTemplate.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNavbar from '../components/admin/AdminNavbar';
import AdminSidebar from '../components/admin/AdminSidebar';

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
  visible: { opacity: 0.5, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const AdminDashboard = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main area: Navbar, Content, Footer */}
      <div className="flex flex-col flex-1">
        <AdminNavbar onMobileMenuClick={toggleSidebar} />
        <main className="flex-1 p-8 bg-palette-light text-black">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex md:hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black"
              variants={backdropVariants}
              onClick={toggleSidebar}
            />
            {/* Sliding Sidebar */}
            <motion.div
              className="relative flex-1 flex flex-col max-w-xs w-full"
              variants={sidebarVariants}
            >
              <AdminSidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
