import React, { createContext, useState, useEffect, useContext } from 'react';
import { settings } from '../services/api';
import { useAuth } from './AuthContext'; // Import useAuth

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export const SettingsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const [siteSettings, setSiteSettings] = useState({});
  const [loading, setLoading] = useState(true); // Settings loading state
  const [error, setError] = useState(null);

  // Function to fetch settings
  const fetchSettings = async () => {
    // Don't fetch if user is not logged in
    if (!user) {
      setLoading(false);
      setSiteSettings({}); // Clear settings if logged out
      return;
    }
    
    try {
      setLoading(true);
      const response = await settings.getAll();
      
      // Convert from grouped format to flat key-value pairs
      const flatSettings = {};
      Object.values(response.data).forEach(categorySettings => {
        categorySettings.forEach(setting => {
          flatSettings[setting.key] = setting.value;
        });
      });
      
      setSiteSettings(flatSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err); // Log the error for debugging
      setError(err.message || 'Failed to load settings');
      // Don't clear settings on error, keep previous ones if available
    } finally {
      setLoading(false);
    }
  };

  // Fetch settings only when user is loaded and available
  useEffect(() => {
    // Wait for auth loading to finish
    if (!authLoading) {
      fetchSettings();
    }
  }, [user, authLoading]); // Re-fetch when user logs in/out or auth finishes loading

  // Method to refresh settings manually (only if user is logged in)
  const refreshSettings = () => {
    if (user) {
      fetchSettings();
    }
  };

  // Get a specific setting with fallback
  const getSetting = (key, fallback = '') => {
    // Return fallback if settings are loading or user isn't logged in
    if (loading || !user) return fallback;
    return siteSettings[key] !== undefined ? siteSettings[key] : fallback;
  };

  const value = {
    settings: siteSettings,
    loading,
    error,
    refreshSettings,
    getSetting
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext; 