const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'referral', 'payment', 'investment', 'notification'],
    default: 'general'
  },
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'color'],
    default: 'string'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create default settings if none exist
siteSettingSchema.statics.initializeSettings = async function() {
  const defaultSettings = [
    {
      key: 'site_name',
      value: 'Referral Application',
      category: 'general',
      label: 'Site Name',
      description: 'The name of the website displayed in various places',
      type: 'string',
      isPublic: true
    },
    {
      key: 'site_description',
      value: 'A platform for referrals and investments',
      category: 'general',
      label: 'Site Description',
      description: 'Short description of the website',
      type: 'string',
      isPublic: true
    },
    {
      key: 'primary_color',
      value: '#3b82f6',
      category: 'general',
      label: 'Primary Color',
      description: 'Main color theme of the website',
      type: 'color',
      isPublic: true
    },
    {
      key: 'secondary_color',
      value: '#10b981',
      category: 'general',
      label: 'Secondary Color',
      description: 'Secondary color theme of the website',
      type: 'color',
      isPublic: true
    },
    {
      key: 'maintenance_mode',
      value: false,
      category: 'general',
      label: 'Maintenance Mode',
      description: 'Enable maintenance mode to show maintenance page to users',
      type: 'boolean',
      isPublic: true
    },
    {
      key: 'referral_bonus',
      value: 10,
      category: 'referral',
      label: 'Referral Bonus (%)',
      description: 'Percentage bonus for referring new users',
      type: 'number',
      isPublic: true
    },
    {
      key: 'minimum_withdrawal',
      value: 20,
      category: 'payment',
      label: 'Minimum Withdrawal Amount',
      description: 'Minimum amount that can be withdrawn',
      type: 'number',
      isPublic: true
    },
    {
      key: 'payment_methods',
      value: JSON.stringify(['EasyPaisa', 'JazzCash', 'Bank Transfer']),
      category: 'payment',
      label: 'Payment Methods',
      description: 'Available payment methods for withdrawals',
      type: 'json',
      isPublic: true
    },
    {
      key: 'min_investment',
      value: 100,
      category: 'investment',
      label: 'Minimum Investment Amount',
      description: 'Minimum amount that can be invested',
      type: 'number',
      isPublic: true
    },
    {
      key: 'currency_conversion_rate',
      value: 280,
      category: 'payment',
      label: 'Currency Conversion Rate (PKR)',
      description: 'Conversion rate from USD to PKR',
      type: 'number',
      isPublic: true
    }
  ];

  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany(defaultSettings);
    console.log('Default site settings initialized');
  }
};

const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);

module.exports = SiteSetting; 