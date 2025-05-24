import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const SiteHeader = () => {
  const { getSetting } = useSettings();
  const { user } = useAuth();
  
  const siteName = getSetting('site_name', 'Referral Application');
  const primaryColor = getSetting('primary_color', '#3b82f6');
  
  return (
    <header 
      className="bg-white shadow-md py-4 px-6" 
      style={{ borderBottom: `3px solid ${primaryColor}` }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold" style={{ color: primaryColor }}>
          {siteName}
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link 
                to={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                className="text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                to="/user/profile" 
                className="text-gray-700 hover:text-gray-900"
              >
                Profile
              </Link>
              {/* More nav items can be added here */}
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader; 