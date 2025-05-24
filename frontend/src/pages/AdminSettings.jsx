import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import { settings } from '../services/api';
import AdminDashboard from './AdminDashboard';
import { useSettings } from '../context/SettingsContext';

const AdminSettings = () => {
  const [allSettings, setAllSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedSettings, setEditedSettings] = useState({});
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedSettings, setExpandedSettings] = useState({});
  const [showNewSettingForm, setShowNewSettingForm] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'general',
    label: '',
    description: '',
    type: 'string',
    isPublic: false
  });
  
  // Get refreshSettings function from context
  const { refreshSettings } = useSettings();
  
  // Order of categories for display
  const categoryOrder = ['general', 'referral', 'payment', 'investment', 'notification'];
  
  // Category labels for display
  const categoryLabels = {
    general: 'General Settings',
    referral: 'Referral Program',
    payment: 'Payment Settings',
    investment: 'Investment Settings',
    notification: 'Notification Settings'
  };

  useEffect(() => {
    fetchSettings();
  }, [initialized]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await settings.getAll();
      setAllSettings(response.data);
      
      // Set first category with settings as active
      if (!allSettings[activeCategory] && Object.keys(response.data).length > 0) {
        setActiveCategory(Object.keys(response.data)[0]);
      }
    } catch (err) {
      setError('Failed to load settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const initializeSettings = async () => {
    try {
      setLoading(true);
      setError('');
      await settings.initialize();
      setSuccess('Settings initialized successfully');
      fetchSettings();
      refreshSettings(); // Refresh global settings context
    } catch (err) {
      setError('Failed to initialize settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setEditedSettings({
      ...editedSettings,
      [key]: value
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Convert edited settings to array format for bulk update
      const settingsToUpdate = Object.keys(editedSettings).map(key => ({
        key,
        value: editedSettings[key]
      }));
      
      if (settingsToUpdate.length === 0) {
        setSuccess('No changes to save');
        setSaving(false);
        return;
      }
      
      await settings.bulkUpdate(settingsToUpdate);
      setSuccess('Settings saved successfully');
      setEditedSettings({});
      fetchSettings();
      refreshSettings(); // Refresh global settings context
    } catch (err) {
      setError('Failed to save settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleExpand = (key) => {
    setExpandedSettings({
      ...expandedSettings,
      [key]: !expandedSettings[key]
    });
  };
  
  const handleNewSettingChange = (field, value) => {
    setNewSetting({
      ...newSetting,
      [field]: value
    });
  };
  
  const handleCreateSetting = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!newSetting.key || !newSetting.label) {
        setError('Key and Label are required');
        setSaving(false);
        return;
      }
      
      // Format value based on type
      let formattedValue = newSetting.value;
      if (newSetting.type === 'number') {
        formattedValue = Number(newSetting.value);
      } else if (newSetting.type === 'boolean') {
        formattedValue = newSetting.value === 'true';
      } else if (newSetting.type === 'json') {
        try {
          if (typeof newSetting.value === 'string' && !newSetting.value.startsWith('[') && !newSetting.value.startsWith('{')) {
            formattedValue = newSetting.value;
          } else {
            formattedValue = JSON.stringify(JSON.parse(newSetting.value));
          }
        } catch (err) {
          setError('Invalid JSON format');
          setSaving(false);
          return;
        }
      }
      
      await settings.create({
        ...newSetting,
        value: formattedValue
      });
      
      setSuccess('Setting created successfully');
      setShowNewSettingForm(false);
      setNewSetting({
        key: '',
        value: '',
        category: 'general',
        label: '',
        description: '',
        type: 'string',
        isPublic: false
      });
      fetchSettings();
      refreshSettings(); // Refresh global settings context
    } catch (err) {
      setError('Failed to create setting: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteSetting = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await settings.delete(key);
      setSuccess('Setting deleted successfully');
      fetchSettings();
      refreshSettings(); // Refresh global settings context
    } catch (err) {
      setError('Failed to delete setting: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to create default settings if they don't exist
  const createDefaultSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if currency_conversion_rate exists
      const response = await settings.getAll();
      console.log('Settings response:', response); // Debug log
      
      // Convert response data to array if it's an object
      const settingsArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
      console.log('Settings array:', settingsArray); // Debug log
      
      // Check if the setting exists in any format
      const settingsExist = settingsArray.some(setting => {
        if (typeof setting === 'object') {
          return setting.key === 'currency_conversion_rate';
        }
        return false;
      });
      
      if (!settingsExist) {
        console.log('Creating default currency conversion rate setting...'); // Debug log
        const defaultSetting = {
          key: 'currency_conversion_rate',
          value: 280,
          category: 'payment',
          label: 'Currency Conversion Rate (PKR)',
          description: 'Conversion rate from USD to PKR',
          type: 'number',
          isPublic: true
        };
        console.log('Default setting data:', defaultSetting); // Debug log
        
        const createResponse = await settings.create(defaultSetting);
        console.log('Create response:', createResponse); // Debug log
        
        setSuccess('Default settings created successfully');
        fetchSettings();
        refreshSettings();
      } else {
        console.log('Currency conversion rate setting already exists'); // Debug log
      }
    } catch (err) {
      console.error('Error in createDefaultSettings:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to create default settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Render different input types based on setting type
  const renderSettingInput = (setting) => {
    const value = editedSettings[setting.key] !== undefined ? editedSettings[setting.key] : setting.value;
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`setting-${setting.key}`}
              checked={value === true || value === 'true'}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={`setting-${setting.key}`} className="ml-2 text-sm text-gray-700">
              {value === true || value === 'true' ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-10 h-10 rounded border-0"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
        
      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        );
        
      default: // string
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <AdminDashboard>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Site Settings</h1>
          
          <div className="flex space-x-3 mt-3 md:mt-0">
            <button
              onClick={fetchSettings}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
              Refresh
            </button>
            
            <button
              onClick={initializeSettings}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
              disabled={loading}
            >
              <FiRefreshCw className="mr-2" /> 
              Initialize Default Settings
            </button>
            
            <button
              onClick={handleSaveSettings}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
              disabled={saving || Object.keys(editedSettings).length === 0}
            >
              <FiSave className="mr-2" /> 
              Save Changes
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {loading && !Object.keys(allSettings).length ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Categories Navigation */}
            <div className="md:col-span-1">
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-700">Categories</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {categoryOrder.filter(cat => allSettings[cat]).map((category) => (
                    <li key={category}>
                      <button
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          activeCategory === category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {categoryLabels[category] || category}
                        <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {allSettings[category]?.length || 0}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => setShowNewSettingForm(!showNewSettingForm)}
                    className="flex items-center justify-center w-full text-blue-600 hover:text-blue-800 py-2"
                  >
                    <FiPlus className="mr-2" /> 
                    {showNewSettingForm ? 'Cancel' : 'Add New Setting'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Settings Panel */}
            <div className="md:col-span-3">
              {/* New Setting Form */}
              {showNewSettingForm && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
                  <div className="p-4 bg-blue-50 border-b">
                    <h3 className="font-medium text-blue-700">Create New Setting</h3>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleCreateSetting}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Key <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newSetting.key}
                            onChange={(e) => handleNewSettingChange('key', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Unique identifier (no spaces, use underscores)
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newSetting.label}
                            onChange={(e) => handleNewSettingChange('label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Display name for the setting
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newSetting.description}
                          onChange={(e) => handleNewSettingChange('description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={newSetting.category}
                            onChange={(e) => handleNewSettingChange('category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {categoryOrder.map((cat) => (
                              <option key={cat} value={cat}>
                                {categoryLabels[cat] || cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={newSetting.type}
                            onChange={(e) => handleNewSettingChange('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="color">Color</option>
                            <option value="json">JSON</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Public
                          </label>
                          <div className="flex items-center h-10">
                            <input
                              type="checkbox"
                              id="setting-public"
                              checked={newSetting.isPublic}
                              onChange={(e) => handleNewSettingChange('isPublic', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="setting-public" className="ml-2 text-sm text-gray-700">
                              Visible to non-admin users
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        {newSetting.type === 'boolean' ? (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="new-setting-value"
                              checked={newSetting.value === true || newSetting.value === 'true'}
                              onChange={(e) => handleNewSettingChange('value', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="new-setting-value" className="ml-2 text-sm text-gray-700">
                              {newSetting.value === true || newSetting.value === 'true' ? 'Enabled' : 'Disabled'}
                            </label>
                          </div>
                        ) : newSetting.type === 'json' ? (
                          <textarea
                            value={newSetting.value}
                            onChange={(e) => handleNewSettingChange('value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            rows="4"
                          />
                        ) : newSetting.type === 'color' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={newSetting.value || '#000000'}
                              onChange={(e) => handleNewSettingChange('value', e.target.value)}
                              className="w-10 h-10 rounded border-0"
                            />
                            <input
                              type="text"
                              value={newSetting.value || ''}
                              onChange={(e) => handleNewSettingChange('value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <input
                            type={newSetting.type === 'number' ? 'number' : 'text'}
                            value={newSetting.value || ''}
                            onChange={(e) => handleNewSettingChange('value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
                          disabled={saving}
                        >
                          {saving ? 'Creating...' : 'Create Setting'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              {allSettings[activeCategory]?.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-700">{categoryLabels[activeCategory] || activeCategory}</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {allSettings[activeCategory]?.map((setting) => (
                      <div key={setting.key} className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">{setting.label}</h4>
                            <p className="text-xs text-gray-500">{setting.key}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggleExpand(setting.key)}
                              className={`text-gray-500 hover:text-gray-700 p-1 rounded ${expandedSettings[setting.key] ? 'bg-gray-100' : ''}`}
                              title={expandedSettings[setting.key] ? 'Collapse' : 'Expand'}
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSetting(setting.key)}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {setting.description && (
                          <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                        )}
                        
                        {expandedSettings[setting.key] ? (
                          <div className="mt-2">
                            {renderSettingInput(setting)}
                            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                              <span className={`px-2 py-1 rounded-full ${setting.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {setting.isPublic ? 'Public' : 'Admin Only'}
                              </span>
                              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {setting.type.charAt(0).toUpperCase() + setting.type.slice(1)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm bg-gray-50 p-2 rounded">
                            {setting.type === 'boolean' ? (
                              <span className={`px-2 py-1 rounded-full ${setting.value === true || setting.value === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {setting.value === true || setting.value === 'true' ? 'Enabled' : 'Disabled'}
                              </span>
                            ) : setting.type === 'color' ? (
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded mr-2"
                                  style={{ backgroundColor: setting.value }}
                                />
                                {setting.value}
                              </div>
                            ) : (
                              <span>{typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <p className="text-gray-500">
                    {Object.keys(allSettings).length === 0
                      ? 'No settings found. Click "Initialize Default Settings" to create default settings.'
                      : `No settings in the "${categoryLabels[activeCategory] || activeCategory}" category.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminDashboard>
  );
};

export default AdminSettings; 