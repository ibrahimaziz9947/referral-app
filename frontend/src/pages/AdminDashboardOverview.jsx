import React, { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiCreditCard, FiTrendingUp, FiCalendar, FiRefreshCw, FiBarChart, FiClock, FiAlertCircle } from 'react-icons/fi';
import { BsWallet2, BsGraphUp } from 'react-icons/bs';
import { adminAnalytics } from '../services/api';
import AdminDashboard from './AdminDashboard';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment';

// Component for Stat Cards
const StatCard = ({ icon, title, value, color, subvalue, loading }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
    <div className="p-5">
      <div className="flex justify-between items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-100`}>
          {React.cloneElement(icon, { className: `text-xl text-${color}-600` })}
        </div>
        {loading ? (
          <div className="animate-pulse h-14 w-24 bg-gray-200 rounded">
             {/* Placeholder for loading state */}
          </div>
        ) : (
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subvalue && <p className="text-xs text-gray-500 mt-1">{subvalue}</p>}
          </div>
        )}
      </div>
    </div>
  </div>
);

const AdminDashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [investmentSummaryLoading, setInvestmentSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewStats, setOverviewStats] = useState(null);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [investmentSummaryData, setInvestmentSummaryData] = useState([]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true); // Combined loading state
    setOverviewLoading(true);
    setGrowthLoading(true);
    setInvestmentSummaryLoading(true);
    setError('');
    
    try {
      // Fetch all data in parallel where possible
      const overviewPromise = adminAnalytics.getOverview().then(res => {
          setOverviewStats(res.data);
          setOverviewLoading(false);
      }).catch(err => {
          console.error('Error fetching overview stats:', err);
          setError(prev => prev + ' Failed to load overview stats.');
          setOverviewLoading(false);
      });
      
      const growthPromise = adminAnalytics.getUserGrowth({ period: '30d' }).then(res => {
          // Format date for better display
          const formattedData = res.data.map(item => ({
              ...item,
              // Display date as MM/DD
              dateLabel: moment(item.date).format('MM/DD') 
          }));
          setUserGrowthData(formattedData);
          setGrowthLoading(false);
      }).catch(err => {
          console.error('Error fetching user growth data:', err);
          setError(prev => prev + ' Failed to load user growth data.');
          setGrowthLoading(false);
      });

      // Fetch Investment Summary Data
      const investmentSummaryPromise = adminAnalytics.getInvestmentSummary().then(res => {
          setInvestmentSummaryData(res.data || []);
          setInvestmentSummaryLoading(false);
      }).catch(err => {
          console.error('Error fetching investment summary:', err);
          setError(prev => prev + ' Failed to load investment summary.');
          setInvestmentSummaryLoading(false);
      });

      await Promise.all([overviewPromise, growthPromise, investmentSummaryPromise]);
      
    } catch (err) {
      // Catch errors not caught in individual promises (e.g., network issues)
      console.error('General error fetching dashboard data:', err);
      if (!error) setError('Failed to load some dashboard data.');
    } finally {
      setLoading(false); // Combined loading finished
    }
  };

  // Helper to safely format currency
  const formatCurrency = (amount) => {
    const number = Number(amount);
    return isNaN(number) ? '$0.00' : `$${number.toFixed(2)}`;
  };

  return (
    <AdminDashboard>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard Overview</h1>
          <button
            onClick={fetchDashboardData}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200 mt-3 md:mt-0 disabled:opacity-50"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards Row 1 (pass overviewLoading) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<FiUsers />} 
            title="Total Users" 
            value={overviewStats?.totalUsers ?? '-'}
            subvalue={
              overviewStats
                ? `${overviewStats.newUsers7d ?? 0} new last 7d / ${overviewStats.newUsers24h ?? 0} new last 24h` 
                : ''
            }
            color="blue"
            loading={overviewLoading}
          />
          <StatCard 
            icon={<BsWallet2 />} 
            title="Total Platform Balance" 
            value={formatCurrency(overviewStats?.totalWalletBalance)}
            color="green"
            loading={overviewLoading}
          />
           <StatCard 
            icon={<FiDollarSign />} 
            title="Total Commissions Paid" 
            value={formatCurrency(overviewStats?.totalCommissionsPaid)}
            color="purple"
            loading={overviewLoading}
          />
          <StatCard 
            icon={<FiClock />} 
            title="Pending Withdrawals" 
            value={formatCurrency(overviewStats?.totalPendingWithdrawals)}
            color="orange"
            loading={overviewLoading}
          />
        </div>
        
        {/* Stats Cards Row 2 (pass overviewLoading) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <StatCard 
            icon={<BsGraphUp />} 
            title="Active Investments (#)" 
            value={overviewStats?.totalActiveInvestments ?? '-'}
            color="indigo"
            loading={overviewLoading}
          />
          <StatCard 
            icon={<FiTrendingUp />} 
            title="Total Invested Value" 
            value={formatCurrency(overviewStats?.totalValueInvested)}
            color="teal"
            loading={overviewLoading}
          />
           {/* Placeholder Stat Cards (pass overviewLoading) */}
           <StatCard 
            icon={<FiAlertCircle />} 
            title="Open Support Tickets" 
            value={0} // Replace with actual data later
            color="red"
            loading={overviewLoading}
          />
           <StatCard 
            icon={<FiCalendar />} 
            title="Active Promotions" 
            value={0} // Replace with actual data later
            color="pink"
            loading={overviewLoading}
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 min-h-[20rem]">
             <h3 className="text-lg font-medium text-gray-800 mb-4">New Users (Last 30 Days)</h3>
             {growthLoading ? (
                 <div className="flex justify-center items-center h-64">
                     <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
             ) : userGrowthData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userGrowthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateLabel" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" name="New Users" fill="#8884d8" />
                    </BarChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="flex justify-center items-center h-64 text-gray-500">
                    No user growth data available.
                 </div>
             )}
          </div>

          {/* Investment Summary Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 min-h-[20rem]">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Investments by Product (#)</h3>
            {investmentSummaryLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : investmentSummaryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={investmentSummaryData} 
                  layout="vertical" // Use vertical layout for better label readability
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis 
                    dataKey="productName" 
                    type="category" 
                    width={100} // Adjust width for labels
                    fontSize={10}
                  />
                  <Tooltip formatter={(value) => `${value} Investments`} />
                  <Bar dataKey="investmentCount" name="# Investments" fill="#82ca9d" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No investment data available.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </AdminDashboard>
  );
};

export default AdminDashboardOverview; 