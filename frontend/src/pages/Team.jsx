import { useState, useEffect } from 'react';
import { team } from '../services/api';
import { FiUsers, FiUserCheck, FiDollarSign, FiLink, FiCopy, FiCheck, FiInfo, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

// Animation Variants (similar to other pages)
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
};

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
  }),
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  }),
};

// Helper component for referral level badge (Updated Styling)
const ReferralBadge = ({ level }) => {
  const levelInfo = {
    bronze: { color: 'text-yellow-800', bg: 'bg-yellow-100', icon: '🥉' },
    silver: { color: 'text-gray-600', bg: 'bg-gray-200', icon: '🥈' },
    gold: { color: 'text-amber-600', bg: 'bg-amber-100', icon: '🥇' },
    diamond: { color: 'text-sky-600', bg: 'bg-sky-100', icon: '💎' },
    platinum: { color: 'text-purple-600', bg: 'bg-purple-100', icon: '🏆' },
  };
  
  const info = levelInfo[level?.toLowerCase()] || levelInfo.bronze;
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${info.bg} ${info.color}`}>
      <span className="mr-1.5">{info.icon}</span>
      {level?.charAt(0).toUpperCase() + level?.slice(1)}
    </div>
  );
};

const Team = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [referralStats, setReferralStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalEarnings: 0,
  });
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [referralLevel, setReferralLevel] = useState('bronze');

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        if (user && user.referralLevel) {
          setReferralLevel(user.referralLevel);
        }
        
        // Fetch team members
        try {
          const membersRes = await team.getTeamMembers();
          setTeamMembers(membersRes.data || []);
        } catch (err) {
          console.warn('Error fetching team members:', err);
          setTeamMembers([]);
        }
        
        // Fetch referral stats
        try {
          const statsRes = await team.getReferralStats();
          setReferralStats(statsRes.data || {
            totalMembers: 0,
            activeMembers: 0,
            totalEarnings: 0,
          });
        } catch (err) {
           console.warn('Error fetching referral stats:', err);
           setReferralStats({
            totalMembers: 0,
            activeMembers: 0,
            totalEarnings: 0,
          });
        }
        
        // Fetch referral link (or code)
        try {
           if (user?.referralCode) {
              const baseUrl = window.location.origin;
              setReferralLink(`${baseUrl}/register?ref=${user.referralCode}`);
           } else {
             console.warn('Referral code not found in user context.');
             setReferralLink('');
           }
        } catch (err) {
          console.warn('Error constructing referral link:', err);
          setReferralLink('');
        }

      } catch (err) {
        setError('Failed to load team data. Please try again.');
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeamData();
    }
  }, [user]);

  const handleCopyLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError('Failed to copy link to clipboard.');
      });
  };

  const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
     try {
       return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
     } catch { return 'Invalid Date' }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 10rem)'}}>
          <Loading message="Loading team data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3 md:mb-0">Your Team & Referrals</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Your Level:</span>
            <ReferralBadge level={referralLevel} />
          </div>
        </div>
        
        {error && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiInfo className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{error}</p>
             <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}

        {success && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-start"
             role="alert"
           >
             <FiCheck className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"/>
             <p className="text-sm">{success}</p>
             <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full"><FiX size={18}/></button>
           </motion.div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { title: 'Total Team', value: referralStats.totalMembers, desc: 'Members referred by you', icon: FiUsers, color: 'indigo' },
            { title: 'Active Members', value: referralStats.activeMembers, desc: 'Active in last 30 days', icon: FiUserCheck, color: 'green' }
          ].map((stat, index) => (
            <motion.div 
              key={stat.title}
              custom={index}
              variants={statCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6 flex flex-col justify-between transition-shadow hover:shadow-lg`}
            >
              <div>
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 flex items-center justify-center bg-${stat.color}-100 rounded-full mr-4`}>
                    <stat.icon size={20} className={`text-${stat.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">{stat.title}</h2>
                  </div>
                </div>
                <div className={`text-3xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-6 mb-8"
         >
           <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
             <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-4 mb-3 sm:mb-0 flex-shrink-0">
               <FiLink size={20} className="text-blue-600" />
             </div>
             <div className="flex-grow">
               <h2 className="text-lg font-semibold text-gray-800">Your Referral Link</h2>
               <p className="text-sm text-gray-500">Share this link to invite friends and earn commissions!</p>
             </div>
           </div>
           
           {referralLink ? (
             <div className="flex flex-col md:flex-row gap-3">
               <div className="flex-grow relative">
                 <input
                   type="text"
                   value={referralLink}
                   readOnly
                   className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                   aria-label="Your referral link"
                 />
                 <button
                   onClick={handleCopyLink}
                   className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md"
                   title="Copy link"
                 >
                   {copied ? <FiCheck size={18} className="text-green-500" /> : <FiCopy size={18} />}
                 </button>
               </div>
             </div>
           ) : (
              <p className="text-sm text-gray-500">Referral link could not be generated. Referral code might be missing.</p>
           )}
          
           {copied && (
             <p className="mt-2 text-xs text-green-600 font-medium">Link copied to clipboard!</p>
           )}
        </motion.div>
        
        <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Team Members ({teamMembers.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
             {teamMembers.length === 0 ? (
               <div className="text-center p-10">
                  <FiUsers className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">You haven't referred anyone yet. Share your link!</p>
               </div>
             ) : (
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-100">
                     {teamMembers.map((member, index) => (
                       <motion.tr 
                          key={member._id}
                          custom={index}
                          variants={listItemVariants}
                          initial="hidden"
                          animate="visible"
                          className="hover:bg-gray-50 transition-colors"
                       >
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name || `${member.firstName || ''} ${member.lastName || ''}`}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(member.createdAt || member.joinedAt)}</td>
                       </motion.tr>
                     ))}
                   </tbody>
                 </table>
             )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Team; 