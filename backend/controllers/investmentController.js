const InvestmentProduct = require('../models/investmentProduct');
const UserInvestment = require('../models/userInvestment');
const User = require('../models/user');
const SiteSetting = require('../models/siteSetting');
const Earning = require('../models/earning');
const mongoose = require('mongoose');

// Helper function to get commission percentage based on level
const getCommissionRate = async (level) => {
    // Get base referral bonus from settings
    const baseBonusSetting = await SiteSetting.findOne({ key: 'referral_bonus' });
    const baseBonus = baseBonusSetting ? Number(baseBonusSetting.value) : 10; // Default 10%
    
    // Get bonus increment from settings (optional, defaults to 5%)
    const incrementSetting = await SiteSetting.findOne({ key: 'referral_level_bonus_increment' });
    const increment = incrementSetting ? Number(incrementSetting.value) : 5; // Default 5%

    let multiplier = 0;
    switch (level) {
        case 'silver': multiplier = 1; break;
        case 'gold': multiplier = 2; break;
        case 'diamond': multiplier = 3; break;
        case 'platinum': multiplier = 4; break;
        default: multiplier = 0; // Bronze
    }
    
    return baseBonus + (increment * multiplier);
};

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
        await InvestmentProduct.deleteOne({ _id: req.params.id });
        res.json({ message: 'Investment product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User: Invest in a product
exports.investInProduct = async (req, res) => {
    try {
        const productId = req.params.id || req.body.productId;
        const { amount } = req.body;
        const investorId = req.user._id;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        if (!amount) {
            return res.status(400).json({ message: 'Investment amount is required' });
        }
        
        // Ensure amount is a valid number
        const investmentAmount = Number(amount);
        if (isNaN(investmentAmount) || investmentAmount <= 0) {
            return res.status(400).json({ message: 'Investment amount must be a positive number' });
        }
        
        const product = await InvestmentProduct.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Investment product not found' });
        }

        if (product.status !== 'active') {
            return res.status(400).json({ message: 'Investment product is not active' });
        }

        if (investmentAmount < product.minimumAmount) {
            return res.status(400).json({ message: `Minimum investment amount is ${product.minimumAmount}` });
        }

        const investor = await User.findById(investorId);
        if (!investor) {
            return res.status(404).json({ message: 'Investor not found' }); // Should not happen if authenticated
        }
        if (investor.wallet < investmentAmount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Deduct investment amount from investor's wallet first
        investor.wallet -= investmentAmount;
        await investor.save();

        // Create and save the investment record
        const investment = new UserInvestment({
            user: investorId,
            investmentProduct: productId,
            amountInvested: investmentAmount,
            currentValue: investmentAmount
        });
        await investment.save();

        // --- Referral Commission Logic (AFTER investment is saved) --- 
        let commissionAmount = 0; // Initialize commission amount
        let referrer = null;

        if (investor.referredBy) {
            referrer = await User.findById(investor.referredBy);
            if (referrer) {
                try {
                    const commissionRate = await getCommissionRate(referrer.referralLevel);
                    commissionAmount = investmentAmount * (commissionRate / 100);

                    if (commissionAmount > 0) {
                        referrer.wallet += commissionAmount;
                        await referrer.save();
                        
                        // Create Earning record now that investment._id exists
                        const commissionEarning = new Earning({
                            user: referrer._id,
                            amount: commissionAmount,
                            source: 'referral',
                            description: `Commission from ${investor.email || 'user'} investment of $${investmentAmount.toFixed(2)}`,
                            status: 'credited',
                            reference: investment._id, // Reference the investment ID
                            referenceModel: 'UserInvestment'
                        });
                        await commissionEarning.save();
                        
                        console.log(`Awarded $${commissionAmount.toFixed(2)} commission to referrer ${referrer.email} (Level: ${referrer.referralLevel})`);
                    }
                } catch (commissionError) {
                    console.error('Error processing referral commission:', commissionError);
                    // Log error but continue
                    commissionAmount = 0; // Reset commission if error occurs
                }
            }
        }
        // --- End Referral Commission Logic --- 

        res.status(201).json({ 
            investment, 
            commissionAwarded: commissionAmount 
        });

    } catch (error) {
        console.error('Error during investInProduct:', error);
        res.status(400).json({ message: error.message || 'Investment failed' });
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
    const startTime = Date.now();
    const stats = {
        processed: 0,
        errors: 0,
        skipped: 0,
        totalAmount: 0
    };

    console.log(`[${new Date().toISOString()}] Starting investment return processing...`);

    try {
        // Find all active investments with populated data
        const activeInvestments = await UserInvestment.find({ status: 'active' })
            .populate('investmentProduct')
            .populate('user', 'email wallet');

        console.log(`Found ${activeInvestments.length} active investments to process.`);

        for (const investment of activeInvestments) {
            try {
                // Validate required data
                if (!investment.investmentProduct) {
                    console.warn(`[SKIP] Investment ${investment._id}: Missing investment product data`);
                    stats.skipped++;
                    continue;
                }

                if (!investment.user) {
                    console.warn(`[SKIP] Investment ${investment._id}: Missing user data`);
                    stats.skipped++;
                    continue;
                }

                const product = investment.investmentProduct;
                const user = investment.user;
                const now = new Date();
                const lastReturn = new Date(investment.lastReturnDate);
                
                // Log initial timing information
                console.log(`[TIMING] Investment ${investment._id}:
                    Product: ${product.name}
                    Return Rate: ${product.returnRate}%
                    Period: ${product.returnPeriod} ${product.returnPeriodUnit}s
                    Last Return: ${lastReturn.toISOString()}
                    Current Time: ${now.toISOString()}
                `);

                // Calculate time difference based on return period unit
                let timeDiff;
                try {
                    const diffInMilliseconds = now.getTime() - lastReturn.getTime();
                    
                    switch (product.returnPeriodUnit) {
                        case 'day':
                            // Convert milliseconds to days
                            timeDiff = diffInMilliseconds / (1000 * 60 * 60 * 24);
                            break;
                        case 'week':
                            // Convert milliseconds to weeks
                            timeDiff = diffInMilliseconds / (1000 * 60 * 60 * 24 * 7);
                            break;
                        case 'month':
                            // Calculate months more precisely
                            const monthsDiff = (now.getFullYear() - lastReturn.getFullYear()) * 12 + 
                                             (now.getMonth() - lastReturn.getMonth());
                            const daysInMonth = (now.getDate() - lastReturn.getDate()) / 30.44;
                            timeDiff = monthsDiff + daysInMonth;
                            break;
                        default:
                            throw new Error(`Invalid return period unit: ${product.returnPeriodUnit}`);
                    }

                    // Log detailed time calculation with more information
                    console.log(`[TIMING] Investment ${investment._id} calculation:
                        Raw Time Difference (ms): ${diffInMilliseconds}
                        Time Difference: ${timeDiff.toFixed(4)} ${product.returnPeriodUnit}s
                        Required Period: ${product.returnPeriod} ${product.returnPeriodUnit}s
                        Should Process: ${timeDiff >= product.returnPeriod ? 'YES' : 'NO'}
                        Hours Passed: ${(diffInMilliseconds / (1000 * 60 * 60)).toFixed(2)}
                        Minutes Passed: ${(diffInMilliseconds / (1000 * 60)).toFixed(2)}
                    `);

                } catch (timeError) {
                    console.error(`[ERROR] Investment ${investment._id}: Time calculation error - ${timeError.message}`);
                    stats.errors++;
                    continue;
                }

                // Check if enough time has passed
                if (timeDiff < product.returnPeriod) {
                    console.log(`[SKIP] Investment ${investment._id}: Not enough time passed (${timeDiff.toFixed(4)} ${product.returnPeriodUnit}s)`);
                    stats.skipped++;
                    continue;
                }

                // Calculate return amount
                const returnAmount = (investment.amountInvested * product.returnRate) / 100;
                
                if (returnAmount <= 0) {
                    console.warn(`[SKIP] Investment ${investment._id}: Invalid return amount calculated (${returnAmount})`);
                    stats.skipped++;
                    continue;
                }

                // Start a session for transaction
                const session = await mongoose.startSession();
                try {
                    await session.withTransaction(async () => {
                        // Update user's wallet
                        user.wallet += returnAmount;
                        await user.save({ session });

                        // Update investment's last return date
                        investment.lastReturnDate = now;
                        await investment.save({ session });
                        
                        // Create earning record
                        const returnEarning = new Earning({
                            user: user._id,
                            amount: returnAmount,
                            source: 'investment',
                            description: `Return from investment in ${product.name}`,
                            status: 'credited',
                            reference: investment._id,
                            referenceModel: 'UserInvestment'
                        });
                        await returnEarning.save({ session });

                        stats.processed++;
                        stats.totalAmount += returnAmount;
                        console.log(`[SUCCESS] Processed return of $${returnAmount.toFixed(2)} for investment ${investment._id} (User: ${user.email})`);
                    });
                } catch (transactionError) {
                    console.error(`[ERROR] Transaction failed for investment ${investment._id}: ${transactionError.message}`);
                    stats.errors++;
                } finally {
                    await session.endSession();
                }

            } catch (investmentError) {
                console.error(`[ERROR] Failed to process investment ${investment._id}: ${investmentError.message}`);
                stats.errors++;
            }
        }

        // Log final statistics
        const duration = (Date.now() - startTime) / 1000;
        console.log(`
[SUMMARY] Investment processing completed:
- Duration: ${duration.toFixed(2)}s
- Total investments found: ${activeInvestments.length}
- Successfully processed: ${stats.processed}
- Errors encountered: ${stats.errors}
- Skipped: ${stats.skipped}
- Total amount distributed: $${stats.totalAmount.toFixed(2)}
        `);

    } catch (error) {
        console.error(`[CRITICAL] General error during investment processing: ${error.message}`);
        console.error(error.stack);
        throw error; // Re-throw to be caught by the cron job handler
    }
}; 