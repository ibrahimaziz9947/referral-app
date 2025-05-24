const mongoose = require('mongoose');

const userInvestmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    investmentProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvestmentProduct',
        required: true
    },
    amountInvested: {
        type: Number,
        required: true,
        min: 0
    },
    currentValue: {
        type: Number,
        required: true,
        min: 0
    },
    lastReturnDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'withdrawn'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserInvestment = mongoose.model('UserInvestment', userInvestmentSchema);

module.exports = UserInvestment; 