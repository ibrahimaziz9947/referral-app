const SiteSetting = require('../models/siteSetting');

// Initialize default settings
exports.initializeSettings = async (req, res) => {
  try {
    await SiteSetting.initializeSettings();
    res.status(200).json({ message: 'Settings initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing settings', error: error.message });
  }
};

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const { isAdmin } = req.user;
    
    // If not admin, only return public settings
    const query = isAdmin ? {} : { isPublic: true };
    
    const settings = await SiteSetting.find(query).sort({ category: 1, key: 1 });
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.status(200).json(groupedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Get a specific setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { isAdmin } = req.user;
    
    const setting = await SiteSetting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: `Setting with key ${key} not found` });
    }
    
    // Check if non-admin user is trying to access non-public setting
    if (!isAdmin && !setting.isPublic) {
      return res.status(403).json({ message: 'Not authorized to access this setting' });
    }
    
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching setting', error: error.message });
  }
};

// Update a setting
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, isPublic } = req.body;
    
    const setting = await SiteSetting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: `Setting with key ${key} not found` });
    }
    
    // Update the setting fields
    if (value !== undefined) {
      // Convert value based on the setting type
      switch (setting.type) {
        case 'number':
          setting.value = Number(value);
          break;
        case 'boolean':
          setting.value = Boolean(value === true || value === 'true');
          break;
        case 'json':
          try {
            if (typeof value === 'string') {
              setting.value = value; // Store as string if it's already a string
            } else {
              setting.value = JSON.stringify(value); // Convert to string if it's an object
            }
          } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON value' });
          }
          break;
        default:
          setting.value = value;
      }
    }
    
    if (isPublic !== undefined) {
      setting.isPublic = isPublic;
    }
    
    setting.updatedBy = req.user._id;
    setting.updatedAt = new Date();
    
    await setting.save();
    
    res.status(200).json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Error updating setting', error: error.message });
  }
};

// Update multiple settings at once
exports.updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }
    
    const results = [];
    const errors = [];
    
    // Process each setting
    for (const { key, value, isPublic } of settings) {
      try {
        const setting = await SiteSetting.findOne({ key });
        
        if (!setting) {
          errors.push({ key, message: `Setting with key ${key} not found` });
          continue;
        }
        
        // Update the setting fields
        if (value !== undefined) {
          // Convert value based on the setting type
          switch (setting.type) {
            case 'number':
              setting.value = Number(value);
              break;
            case 'boolean':
              setting.value = Boolean(value === true || value === 'true');
              break;
            case 'json':
              try {
                if (typeof value === 'string') {
                  setting.value = value;
                } else {
                  setting.value = JSON.stringify(value);
                }
              } catch (e) {
                errors.push({ key, message: 'Invalid JSON value' });
                continue;
              }
              break;
            default:
              setting.value = value;
          }
        }
        
        if (isPublic !== undefined) {
          setting.isPublic = isPublic;
        }
        
        setting.updatedBy = req.user._id;
        setting.updatedAt = new Date();
        
        await setting.save();
        results.push({ key, success: true });
      } catch (error) {
        errors.push({ key, message: error.message });
      }
    }
    
    res.status(200).json({
      message: 'Settings updated',
      results,
      errors: errors.length ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Create a new setting (admin only)
exports.createSetting = async (req, res) => {
  try {
    const { key, value, category, label, description, type, isPublic } = req.body;
    
    // Check if setting with this key already exists
    const existingSetting = await SiteSetting.findOne({ key });
    if (existingSetting) {
      return res.status(400).json({ message: `Setting with key ${key} already exists` });
    }
    
    // Create new setting
    const newSetting = new SiteSetting({
      key,
      value,
      category: category || 'general',
      label,
      description,
      type: type || 'string',
      isPublic: isPublic !== undefined ? isPublic : false,
      updatedBy: req.user._id
    });
    
    await newSetting.save();
    
    res.status(201).json({ message: 'Setting created successfully', setting: newSetting });
  } catch (error) {
    res.status(500).json({ message: 'Error creating setting', error: error.message });
  }
};

// Delete a setting (admin only)
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await SiteSetting.deleteOne({ key });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: `Setting with key ${key} not found` });
    }
    
    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting setting', error: error.message });
  }
}; 