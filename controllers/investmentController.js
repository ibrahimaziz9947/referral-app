const InvestmentProduct = require('../models/investmentProduct');
const UserInvestment = require('../models/userInvestment');
const User = require('../models/user');

// Admin: Create a new investment product
exports.createInvestmentProduct = async (req, res) => {
    try {
        const { name, description, minimumAmount, returnRate, returnPeriod, returnPeriodUnit } = req.body;
        
        const product = new InvestmentProduct({
            name,
            description,
            minimumAmount,
            returnRate,
            returnPeriod,
            returnPeriodUnit,
            createdBy: req.user._id
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin: Get all investment products
exports.getAllInvestmentProducts = async (req, res) => {
    try {
        const products = await InvestmentProduct.find().populate('createdBy', 'name email');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Update an investment product
exports.updateInvestmentProduct = async (req, res) => {
    try {
        const { name, description, minimumAmount, returnRate, returnPeriod, returnPeriodUnit, status } = req.body;
        const product = await InvestmentProduct.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Investment product not found' });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (minimumAmount) product.minimumAmount = minimumAmount;
        if (returnRate) product.returnRate = returnRate;
        if (returnPeriod) product.returnPeriod = returnPeriod;
        if (returnPeriodUnit) product.returnPeriodUnit = returnPeriodUnit;
        if (status) product.status = status;

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin: Delete an investment product
exports.deleteInvestmentProduct = async (req, res) => {
    try {
        const product = await InvestmentProduct.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Investment product not found' });
        }
        await product.remove();
        res.json({ message: 'Investment product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User: Invest in a product
exports.investInProduct = async (req, res) => {
    try {
        const { productId, amount } = req.body;
        
        const product = await InvestmentProduct.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Investment product not found' });
        }

        if (product.status !== 'active') {
            return res.status(400).json({ message: 'Investment product is not active' });
        }

        if (amount < product.minimumAmount) {
            return res.status(400).json({ message: `Minimum investment amount is ${product.minimumAmount}` });
        }

        const user = await User.findById(req.user._id);
        if (user.wallet < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Create investment record
        const investment = new UserInvestment({
            user: req.user._id,
            investmentProduct: productId,
            amountInvested: amount,
            currentValue: amount
        });

        // Update user's wallet
        user.wallet -= amount;
        await user.save();
        await investment.save();

        res.status(201).json(investment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// User: Get their investments
exports.getUserInvestments = async (req, res) => {
    try {
        const investments = await UserInvestment.find({ user: req.user._id })
            .populate('investmentProduct')
            .sort({ createdAt: -1 });
        res.json(investments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all user investments
exports.getAllUserInvestments = async (req, res) => {
    try {
        const investments = await UserInvestment.find()
            .populate('user', 'name email')
            .populate('investmentProduct')
            .sort({ createdAt: -1 });
        res.json(investments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User: Withdraw investment
exports.withdrawInvestment = async (req, res) => {
    try {
        const investment = await UserInvestment.findById(req.params.id)
            .populate('investmentProduct')
            .populate('user');

        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        if (investment.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to withdraw this investment' });
        }

        if (investment.status === 'withdrawn') {
            return res.status(400).json({ message: 'Investment has already been withdrawn' });
        }

        // Update user's wallet
        const user = await User.findById(req.user._id);
        user.wallet += investment.currentValue;
        await user.save();

        // Update investment status
        investment.status = 'withdrawn';
        await investment.save();

        res.json({ message: 'Investment withdrawn successfully', amount: investment.currentValue });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// System: Process investment returns (to be called by a scheduled job)
exports.processInvestmentReturns = async () => {
    try {
        const activeInvestments = await UserInvestment.find({ status: 'active' })
            .populate('investmentProduct')
            .populate('user');

        for (const investment of activeInvestments) {
            const product = investment.investmentProduct;
            const now = new Date();
            const lastReturn = new Date(investment.lastReturnDate);
            
            // Calculate time difference based on return period unit
            let timeDiff;
            switch (product.returnPeriodUnit) {
                case 'day':
                    timeDiff = (now - lastReturn) / (1000 * 60 * 60 * 24);
                    break;
                case 'week':
                    timeDiff = (now - lastReturn) / (1000 * 60 * 60 * 24 * 7);
                    break;
                case 'month':
                    timeDiff = (now - lastReturn) / (1000 * 60 * 60 * 24 * 30);
                    break;
            }

            // If enough time has passed, process the return
            if (timeDiff >= product.returnPeriod) {
                const returnAmount = (investment.currentValue * product.returnRate) / 100;
                investment.currentValue += returnAmount;
                investment.lastReturnDate = now;
                await investment.save();

                // Update user's wallet with the return
                const user = await User.findById(investment.user._id);
                user.wallet += returnAmount;
                await user.save();
            }
        }
    } catch (error) {
        console.error('Error processing investment returns:', error);
    }
}; 