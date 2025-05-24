import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const WithdrawalMethods = ({ onSelectMethod }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const { getSetting } = useSettings();
  
  // Get payment settings with fallbacks
  const minWithdrawal = getSetting('minimum_withdrawal', 5);
  const paymentMethodsString = getSetting('payment_methods', '["Bank Transfer", "JazzCash"]');
  
  // Parse JSON if it's a string
  let paymentMethods = [];
  try {
    paymentMethods = typeof paymentMethodsString === 'string' 
      ? JSON.parse(paymentMethodsString) 
      : paymentMethodsString;
      
    // Ensure it's an array
    if (!Array.isArray(paymentMethods)) {
      paymentMethods = [String(paymentMethodsString)];
    }
  } catch (error) {
    console.error('Error parsing payment methods:', error);
    paymentMethods = ['Bank Transfer', 'JazzCash']; // Fallback
  }
  
  const handleSelect = (method) => {
    setSelectedMethod(method);
    if (onSelectMethod) {
      // Convert to lowercase, handle potential 'Bank Transfer' specifically if needed
      let backendValue = method.toLowerCase();
      if (backendValue === 'bank transfer') {
          backendValue = 'bank'; // Assuming backend expects 'bank'
      } else if (backendValue === 'jazzcash') {
        backendValue = 'jazzcash'; // Assuming backend expects 'jazzcash'
      }
      onSelectMethod(backendValue);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Withdrawal Methods</h3>
        <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          Min: ${minWithdrawal}
        </div>
      </div>
      
      <div className="space-y-3">
        {paymentMethods.map((method, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMethod === method
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleSelect(method)}
          >
            <div className="flex items-center">
              <div className="mr-3">
                <input
                  type="radio"
                  name="payment-method"
                  checked={selectedMethod === method}
                  onChange={() => handleSelect(method)}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <h4 className="font-medium">{method}</h4>
                <p className="text-xs text-gray-500">
                  Withdrawal processing time: 24-48 hours
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Note: The minimum withdrawal amount is ${minWithdrawal}. Requests below this amount will not be processed.
        </p>
      </div>
    </div>
  );
};

export default WithdrawalMethods; 