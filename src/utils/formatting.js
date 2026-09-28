// Centralized formatting utilities

export const formatCurrency = (amount, currency = '₹') => {
  if (typeof amount !== 'number' || isNaN(amount)) return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
};

export const formatNumber = (number, decimals = 2) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return number.toFixed(decimals);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('en-IN', defaultOptions);
};

export const formatTime = (date) => {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return formatDate(date, options);
};

export const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};
