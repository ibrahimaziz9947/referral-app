const User = require('../models/user');
const UserInvestment = require('../models/userInvestment');
const Earning = require('../models/earning');
const Withdrawal = require('../models/withdrawal');
const moment = require('moment'); // Using moment for easier date calculations

// GET /api/admin/analytics/overview
exports.getOverviewStats = async (req, res) => {
    try {
        const now = moment();
        const yesterday = moment().subtract(1, 'days');
        const sevenDaysAgo = moment().subtract(7, 'days');

        // Aggregate Promises
        const promises = [
            User.countDocuments(), // Total Users
            User.countDocuments({ createdAt: { $gte: yesterday.toDate() } }), // New Users (24h)
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo.toDate() } }), // New Users (7d)
            UserInvestment.countDocuments({ status: 'active' }), // Total Active Investments
            UserInvestment.aggregate([ // Total Value Invested
                { $match: { status: 'active' } }, // Only active investments count towards current value usually
                { $group: { _id: null, total: { $sum: "$amountInvested" } } }
            ]),
            User.aggregate([ // Total Platform Wallet Balance
                { $group: { _id: null, total: { $sum: "$wallet" } } }
            ]),
            Earning.aggregate([ // Total Commissions Paid
                { $match: { source: 'referral', status: 'credited' } }, 
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Withdrawal.aggregate([ // Total Pending Withdrawals
                { $match: { status: 'pending' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ];

        // Execute all aggregation queries in parallel
        const [ 
            totalUsers, 
            newUsers24h, 
            newUsers7d,
            totalActiveInvestments,
            totalValueInvestedResult,
            totalWalletBalanceResult,
            totalCommissionsPaidResult,
            totalPendingWithdrawalsResult
        ] = await Promise.all(promises);

        // Extract results safely
        const totalValueInvested = totalValueInvestedResult[0]?.total || 0;
        const totalWalletBalance = totalWalletBalanceResult[0]?.total || 0;
        const totalCommissionsPaid = totalCommissionsPaidResult[0]?.total || 0;
        const totalPendingWithdrawals = totalPendingWithdrawalsResult[0]?.total || 0;

        res.json({
            totalUsers,
            newUsers24h,
            newUsers7d,
            totalActiveInvestments,
            totalValueInvested,
            totalWalletBalance,
            totalCommissionsPaid,
            totalPendingWithdrawals
        });

    } catch (error) {
        console.error("Error fetching admin overview stats:", error);
        res.status(500).json({ message: "Failed to fetch overview stats", error: error.message });
    }
};

// GET /api/admin/analytics/user-growth
exports.getUserGrowth = async (req, res) => {
    try {
        const period = req.query.period || '30d'; // Default to last 30 days
        let days = 30;
        if (period === '7d') days = 7;
        if (period === '90d') days = 90;
        
        const endDate = moment().endOf('day'); // Today
        const startDate = moment().subtract(days - 1, 'days').startOf('day'); // Start date (inclusive)

        // Aggregation pipeline
        const growthData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: { 
                        $dateFromParts: { 
                            'year': "$_id.year", 'month': "$_id.month", 'day': "$_id.day" 
                        }
                    },
                    count: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by date ascending
            }
        ]);

        // --- Fill in missing dates with 0 count --- 
        const dateMap = growthData.reduce((map, item) => {
            map[moment(item.date).format('YYYY-MM-DD')] = item.count;
            return map;
        }, {});

        const fullDateRangeData = [];
        for (let m = moment(startDate); m.isSameOrBefore(endDate, 'day'); m.add(1, 'days')) {
            const dateStr = m.format('YYYY-MM-DD');
            fullDateRangeData.push({
                date: dateStr, // Use string format for chart labels
                count: dateMap[dateStr] || 0
            });
        }
        // --- End Fill missing dates --- 

        res.json(fullDateRangeData);

    } catch (error) {
        console.error("Error fetching user growth data:", error);
        res.status(500).json({ message: "Failed to fetch user growth data", error: error.message });
    }
};

// GET /api/admin/analytics/investment-summary
exports.getInvestmentSummary = async (req, res) => {
    try {
        const summary = await UserInvestment.aggregate([
            {
                $match: { status: 'active' } // Optional: Only consider active investments
            },
            {
                $group: {
                    _id: "$investmentProduct", // Group by product ID
                    totalInvestedAmount: { $sum: "$amountInvested" },
                    currentTotalValue: { $sum: "$currentValue" }, // Optional: sum current value
                    investmentCount: { $sum: 1 } // Count investments per product
                }
            },
            {
                $lookup: { // Join with InvestmentProduct to get names
                    from: "investmentproducts", // Collection name for InvestmentProduct
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo" // Deconstruct the productInfo array
            },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    productName: "$productInfo.name",
                    totalInvestedAmount: 1,
                    currentTotalValue: 1,
                    investmentCount: 1
                }
            },
            {
                $sort: { investmentCount: -1 } // Sort by most popular products
            }
        ]);

        res.json(summary);

    } catch (error) {
        console.error("Error fetching investment summary:", error);
        res.status(500).json({ message: "Failed to fetch investment summary", error: error.message });
    }
}; 