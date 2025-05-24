import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { tasks, investments, wallet, earnings } from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout'; 
import { FiDollarSign, FiCheckSquare, FiTrendingUp, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Colors for the pie chart
const COLORS = { 
  investment: '#8884d8', 
  referral: '#82ca9d', 
  task: '#ffc658', 
  other: '#ff8042' 
};

// Helper to format chart data
const formatEarningsDataForChart = (data) => {
  return Object.entries(data)
    .map(([key, value]) => ({ 
      name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize source
      value: value 
    }))
    .filter(entry => entry.value > 0); // Only include sources with earnings
};

export default function UserDashboard() {
  const [tasksList, setTasks] = useState([]);
  const [investmentsList, setInvestments] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [earningsByType, setEarningsByType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAnalyticsLoading(true);
      try {
        // Fetch core data
        const [tasksRes, investmentsRes, walletRes] = await Promise.all([
          tasks.getAvailableTasks(),
          investments.getUserInvestments(),
          wallet.getBalance()
        ]);

        setTasks(tasksRes.data || []);
        setInvestments(investmentsRes.data || []);
        setWalletBalance(walletRes.data.balance || 0);
        setLoading(false); // Core data loaded
        
        // Fetch analytics data (can load slightly after)
        try {
          const earningsByTypeRes = await earnings.getByType({ period: 'all_time' }); // Fetch all-time earnings breakdown
          setEarningsByType(earningsByTypeRes.data || {});
        } catch (analyticsError) {
          console.error('Error fetching analytics data:', analyticsError);
          setEarningsByType({}); // Set empty on error
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setTasks([]);
        setInvestments([]);
        setWalletBalance(0);
        setEarningsByType({});
        setLoading(false);
      } finally {
        setAnalyticsLoading(false); // Analytics data loaded (or failed)
      }
    };

    fetchData();
  }, []);

  if (loading) {
    // Show loading state for core data
    return <Loading />;
  }

  const totalInvested = investmentsList.reduce((sum, investment) => sum + (investment.amountInvested || 0), 0);
  const earningsChartData = earningsByType ? formatEarningsDataForChart(earningsByType) : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Stat Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
              <FiDollarSign className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-4xl font-bold">${walletBalance.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-1">Available funds</p>
          </div>

          {/* Active Investments Card */}
          <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Active Investments</h3>
              <FiTrendingUp className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-4xl font-bold">{investmentsList.length}</p>
            <p className="text-sm opacity-80 mt-1">Total active plans</p>
          </div>

          {/* Total Invested Card */}
          <div className="bg-gradient-to-r from-indigo-400 to-cyan-500 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Total Invested</h3>
              <FiDollarSign className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-4xl font-bold">${totalInvested.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-1">Across all active plans</p>
          </div>
          
          {/* Available Tasks Card */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Tasks</h3>
              <FiCheckSquare className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-4xl font-bold">{tasksList.length}</p>
            <p className="text-sm opacity-80 mt-1">Opportunities to earn</p>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Earnings Breakdown Chart */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
               <FiBarChart2 className="mr-2 text-blue-500" /> Earnings Breakdown (All Time)
             </h3>
             {analyticsLoading ? (
               <div className="flex justify-center items-center h-60">
                 <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
             ) : earningsChartData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={earningsChartData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     outerRadius={80}
                     fill="#8884d8"
                     dataKey="value"
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                   >
                     {earningsChartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || COLORS.other} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="text-center py-12 text-gray-500">
                 No earnings data yet.
               </div>
             )}
           </div>

           {/* Placeholder for Investment Performance */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 flex items-center justify-center">
             <div className="text-center text-gray-400">
               <FiTrendingUp size={40} className="mx-auto mb-2" />
               <p>(Investment Performance Chart Coming Soon)</p>
             </div>
           </div>

           {/* Placeholder for Referral Growth */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 flex items-center justify-center">
             <div className="text-center text-gray-400">
               <FiUsers size={40} className="mx-auto mb-2" />
               <p>(Referral Growth Chart Coming Soon)</p>
             </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 