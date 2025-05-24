const express = require('express');
const router = express.Router();
const { 
  getAllSettings, 
  getSettingByKey, 
  updateSetting, 
  updateMultipleSettings,
  createSetting,
  deleteSetting,
  initializeSettings
} = require('../controllers/siteSettingController');
const { protect, admin } = require('../middleware/authMiddleware');
const SiteSetting = require('../models/siteSetting');

// Initialize default settings (admin only)
router.post('/initialize', protect, admin, async (req, res) => {
  try {
    await SiteSetting.initializeSettings();
    res.json({ message: 'Default settings initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all settings (public or admin-only based on user role)
router.get('/', protect, getAllSettings);

// Get setting by key
router.get('/:key', protect, getSettingByKey);

// Admin-only routes
router.post('/', protect, admin, createSetting);
router.put('/bulk-update', protect, admin, updateMultipleSettings);
router.put('/:key', protect, admin, updateSetting);
router.delete('/:key', protect, admin, deleteSetting);

module.exports = router; 