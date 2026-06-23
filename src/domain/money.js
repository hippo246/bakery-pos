// Money/currency utilities

/**
 * Format amount as Indian Rupees
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "₹1,234.56"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format amount without currency symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "1,234.56"
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate subtotal from items
 * @param {Array} items - Array of items with qty and price
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const qty = item.qty || 0;
    const price = item.price || 0;
    return sum + (qty * price);
  }, 0);
}

/**
 * Calculate tax amount
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.18 for 18%)
 * @returns {number} Tax amount
 */
export function calculateTax(subtotal, taxRate = 0.18) {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Calculate total with discount and tax
 * @param {number} subtotal - Subtotal amount
 * @param {number} discountAmount - Discount amount
 * @param {number} taxRate - Tax rate as decimal
 * @returns {object} Object with subtotal, discountAmount, taxAmount, total
 */
export function calculateOrderTotals(subtotal, discountAmount = 0, taxRate = 0.18) {
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = calculateTax(taxableAmount, taxRate);
  const total = taxableAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total
  };
}

/**
 * Round to 2 decimal places for currency
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export function roundCurrency(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Validate amount is non-negative
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid
 */
export function isValidAmount(amount) {
  return typeof amount === 'number' && !isNaN(amount) && amount >= 0;
}
