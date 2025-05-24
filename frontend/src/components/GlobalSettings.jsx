import React, { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * This component applies global settings like colors and themes
 * by injecting CSS variables into the document.
 */
const GlobalSettings = () => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (loading) return;

    // Apply CSS variables for colors
    const root = document.documentElement;
    
    // Apply primary and secondary colors
    if (settings.primary_color) {
      root.style.setProperty('--primary-color', settings.primary_color);
    }
    
    if (settings.secondary_color) {
      root.style.setProperty('--secondary-color', settings.secondary_color);
    }
    
    // Apply site name to document title
    if (settings.site_name) {
      document.title = settings.site_name;
    }
    
    // Apply maintenance mode if enabled
    if (settings.maintenance_mode === true) {
      // You could redirect to a maintenance page or show an overlay
      console.log('Site is in maintenance mode');
    }
    
  }, [settings, loading]);

  // This component doesn't render anything visible
  return null;
};

export default GlobalSettings; 