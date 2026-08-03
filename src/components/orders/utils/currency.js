/**
 * Currency Utilities
 * Pure functions for currency formatting and rounding - NO React code
 */

/**
 * Round to 2 decimal places (standard currency rounding)
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export const roundCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

/**
 * Format as Indian currency string (₹)
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

/**
 * Format as currency with decimal places
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency string
 */
export const formatCurrencyDecimals = (value, decimals = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} Parsed number
 */
export const parseCurrency = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Safe number conversion for monetary calculations
 * @param {*} value - Value to convert
 * @returns {number} Safe number (0 if invalid)
 */
export const safeMoney = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
