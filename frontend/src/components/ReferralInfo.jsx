import React from 'react';
import { useSettings } from '../context/SettingsContext';

const ReferralInfo = () => {
  const { getSetting } = useSettings();
  
  // Get referral-related settings with fallbacks
  const referralBonus = getSetting('referral_bonus', 10);
  const secondaryColor = getSetting('secondary_color', '#10b981');
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: secondaryColor }}>
        Referral Program
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
            style={{ backgroundColor: `${secondaryColor}20` }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={secondaryColor}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">Earn {referralBonus}% Commission</h4>
            <p className="text-sm text-gray-600">
              For every person you refer who invests
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Share your referral link with friends</li>
            <li>They sign up and make investments</li>
            <li>You earn {referralBonus}% of their investment amounts</li>
            <li>Commissions are added to your wallet</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReferralInfo; 