const mongoose = require('mongoose');

const investmentProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true,
        min: 0
    },
    returnRate: {
        type: Number,
        required: true,
        min: 0
    },
    returnPeriod: {
        type: Number,
        required: true,
        min: 1
    },
    returnPeriodUnit: {
        type: String,
        enum: ['day', 'week', 'month'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const InvestmentProduct = mongoose.model('InvestmentProduct', investmentProductSchema);

module.exports = InvestmentProduct; 