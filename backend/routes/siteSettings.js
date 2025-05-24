const express = require('express');
const router = express.Router();
const SiteSetting = require('../models/siteSetting');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSetting.find({ isPublic: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get setting by key
router.get('/:key', async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update setting (admin only)
router.put('/:key', protect, admin, async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    if (req.body.value !== undefined) {
      setting.value = req.body.value;
    }
    if (req.body.label !== undefined) {
      setting.label = req.body.label;
    }
    if (req.body.description !== undefined) {
      setting.description = req.body.description;
    }
    if (req.body.isPublic !== undefined) {
      setting.isPublic = req.body.isPublic;
    }
    
    setting.updatedBy = req.user._id;
    setting.updatedAt = new Date();
    
    const updatedSetting = await setting.save();
    res.json(updatedSetting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 