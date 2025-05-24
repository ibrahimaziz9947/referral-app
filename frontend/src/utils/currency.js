import { settings } from '../services/api';

let cachedRate = null;

export const getCurrencyRate = async () => {
  try {
    if (cachedRate) return cachedRate;
    
    const response = await settings.getByKey('currency_conversion_rate');
    cachedRate = parseFloat(response.data.value);
    return cachedRate;
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    return 280; // Default fallback rate
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

export const convertToPKR = async (usdAmount) => {
  const rate = await getCurrencyRate();
  return usdAmount * rate;
};

export const formatPKR = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}; 