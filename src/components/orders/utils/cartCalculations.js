/**
 * Cart Calculation Utilities
 * Pure functions for cart calculations - NO React code
 * 
 * FIX: Updated to use money.js roundCurrency for consistent 2-decimal precision
 */

import { roundCurrency } from '../../../domain/money.js';

/**
 * Calculate cart subtotal from items
 * @param {Array} items - Cart items
 * @returns {number} Subtotal (rounded to 2 decimals)
 */
export const calculateSubtotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return roundCurrency(items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const qty = Number(item.qty);
    const price = Number(item.price);
    if (!Number.isFinite(qty) || qty < 0) return sum;
    if (!Number.isFinite(price) || price < 0) return sum;
    return sum + (qty * price);
  }, 0));
};

/**
 * Calculate tax amount (18% GST - 9% CGST + 9% SGST)
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxRate - Tax rate (default 0.18 for 18%)
 * @returns {number} Tax amount (rounded to 2 decimals)
 */
export const calculateTax = (subtotal, taxRate = 0.18) => {
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  return roundCurrency(safeSubtotal * taxRate);
};

/**
 * Calculate CGST (half of tax)
 * @param {number} taxAmount - Total tax amount
 * @returns {number} CGST amount (rounded to 2 decimals)
 */
export const calculateCgst = (taxAmount) => {
  const safeTax = Number.isFinite(taxAmount) ? taxAmount : 0;
  return roundCurrency(safeTax / 2);
};

/**
 * Calculate SGST (half of tax)
 * @param {number} taxAmount - Total tax amount
 * @returns {number} SGST amount (rounded to 2 decimals)
 */
export const calculateSgst = (taxAmount) => {
  const safeTax = Number.isFinite(taxAmount) ? taxAmount : 0;
  const cgst = roundCurrency(safeTax / 2);
  return roundCurrency(safeTax - cgst);
};

/**
 * Calculate discount amount
 * @param {number} subtotal - Cart subtotal
 * @param {string} discountInput - Discount value from input
 * @param {string} discountMode - "amount" or "percent"
 * @returns {number} Discount amount (rounded to 2 decimals)
 */
export const calculateDiscount = (subtotal, discountInput, discountMode = "amount") => {
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const value = Number(discountInput) || 0;
  
  if (discountMode === "percent") {
    const percent = Math.min(Math.max(value, 0), 100);
    return roundCurrency(safeSubtotal * (percent / 100));
  }
  
  return Math.min(roundCurrency(value), safeSubtotal);
};

/**
 * Calculate packaging charge
 * @param {string} packagingCharge - Packaging charge from input
 * @returns {number} Packaging charge amount
 */
export const calculatePackaging = (packagingCharge) => {
  return Number(packagingCharge) || 0;
};

/**
 * Calculate cart total
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxAmount - Tax amount
 * @param {number} discountAmount - Discount amount
 * @param {number} packagingAmount - Packaging charge
 * @returns {number} Total amount (rounded to 2 decimals)
 */
export const calculateTotal = (subtotal, taxAmount, discountAmount, packagingAmount) => {
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const safeTax = Number.isFinite(taxAmount) ? taxAmount : 0;
  const safeDiscount = Number.isFinite(discountAmount) ? discountAmount : 0;
  const safePackaging = Number.isFinite(packagingAmount) ? packagingAmount : 0;
  
  return roundCurrency(safeSubtotal + safeTax - safeDiscount + safePackaging);
};

/**
 * Calculate change due for cash payments
 * @param {string} cashTendered - Amount tendered
 * @param {number} total - Total amount
 * @returns {number|null} Change due (null if invalid)
 */
export const calculateChangeDue = (cashTendered, total) => {
  const tendered = Number(cashTendered);
  const safeTotal = Number.isFinite(total) ? total : 0;
  
  if (!Number.isFinite(tendered) || tendered <= 0) return null;
  return tendered - safeTotal;
};

/**
 * Calculate per-person amount for split bills
 * @param {number} total - Total amount
 * @param {number} splitCount - Number of splits
 * @returns {number} Amount per person
 */
export const calculateSplitAmount = (total, splitCount) => {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeCount = Number.isFinite(splitCount) && splitCount >= 2 ? splitCount : 2;
  return safeTotal / safeCount;
};

/**
 * Calculate all cart totals in one pass
 * @param {Object} params - Calculation parameters
 * @returns {Object} All calculated values (all rounded to 2 decimals)
 */
export const calculateCartTotals = ({
  items,
  discountInput = "",
  discountMode = "amount",
  packagingCharge = "",
  taxRate = 0.18
}) => {
  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTax(subtotal, taxRate);
  const cgst = calculateCgst(taxAmount);
  const sgst = calculateSgst(taxAmount);
  const discountAmount = calculateDiscount(subtotal, discountInput, discountMode);
  const packagingAmount = calculatePackaging(packagingCharge);
  const total = calculateTotal(subtotal, taxAmount, discountAmount, packagingAmount);
  
  return {
    subtotal,
    taxAmount,
    cgst,
    sgst,
    discountAmount,
    packagingAmount,
    total
  };
};
