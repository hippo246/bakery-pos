/**
 * Order Validation Utilities
 * Pure functions for order validation - NO React code
 */

import { validateCartItems } from "../utils/itemHelpers";

/**
 * Order type constants
 */
export const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DIRECT_DELIVERY", "SWIGGY", "ZOMATO"];

/**
 * Payment method constants
 */
export const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "SPLIT", "ONLINE", "COD"];

/**
 * Validate order type
 * @param {string} orderType - Order type to validate
 * @returns {boolean} Whether valid
 */
export const isValidOrderType = (orderType) => {
  return ORDER_TYPES.includes(orderType);
};

/**
 * Validate payment method
 * @param {string} paymentMethod - Payment method to validate
 * @returns {boolean} Whether valid
 */
export const isValidPaymentMethod = (paymentMethod) => {
  return PAYMENT_METHODS.includes(paymentMethod);
};

/**
 * Validate order for submission
 * @param {Object} params - Validation parameters
 * @returns {string|null} Error message or null if valid
 */
export const validateOrderForSubmit = ({
  items,
  orderType,
  selectedTable,
  customerPhone,
  customerAddress,
  platformOrderId,
  paymentMethod,
  cashTendered,
  changeDue
}) => {
  // Validate cart items
  const cartError = validateCartItems(items);
  if (cartError) return cartError;

  // Validate order type
  if (!isValidOrderType(orderType)) {
    return "Please select a valid order type";
  }

  // Validate table for dine-in
  if (orderType === "DINE_IN" && !selectedTable) {
    return "Please select a table for dine-in";
  }

  // Validate delivery details
  if (orderType === "DIRECT_DELIVERY") {
    if (!customerPhone || !customerPhone.trim()) {
      return "Customer phone is required for delivery";
    }
    if (!customerAddress || !customerAddress.trim()) {
      return "Delivery address is required";
    }
  }

  // Validate platform order ID for aggregators
  if (orderType === "SWIGGY" || orderType === "ZOMATO") {
    if (!platformOrderId || !platformOrderId.trim()) {
      const platform = orderType === "SWIGGY" ? "Swiggy" : "Zomato";
      return `Platform order ID is required for ${platform} orders`;
    }
  }

  // Validate cash payment
  if (paymentMethod === "CASH" && cashTendered !== "" && changeDue !== null && changeDue < 0) {
    return "Cash tendered is less than the total due";
  }

  return null;
};

/**
 * Validate split count
 * @param {number} splitCount - Split count to validate
 * @returns {boolean} Whether valid
 */
export const isValidSplitCount = (splitCount) => {
  const num = Number(splitCount);
  return Number.isFinite(num) && num >= 2;
};

/**
 * Validate discount input
 * @param {string} discountInput - Discount input
 * @param {string} discountMode - Discount mode
 * @param {number} maxAmount - Maximum discount amount
 * @returns {boolean} Whether valid
 */
export const isValidDiscount = (discountInput, discountMode, maxAmount) => {
  const value = Number(discountInput);
  if (!Number.isFinite(value) || value <= 0) return false;
  
  if (discountMode === "percent") {
    return value <= 100;
  }
  
  return value <= maxAmount;
};

/**
 * Validate packaging charge
 * @param {string} packagingCharge - Packaging charge input
 * @returns {boolean} Whether valid
 */
export const isValidPackagingCharge = (packagingCharge) => {
  const value = Number(packagingCharge);
  return Number.isFinite(value) && value >= 0;
};

/**
 * Validate cash tendered
 * @param {string} cashTendered - Cash tendered input
 * @returns {boolean} Whether valid
 */
export const isValidCashTendered = (cashTendered) => {
  const value = Number(cashTendered);
  return Number.isFinite(value) && value > 0;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Validate pre-order date/time
 * @param {string} date - Date string
 * @param {string} time - Time string
 * @returns {boolean} Whether valid
 */
export const isValidScheduledDateTime = (date, time) => {
  if (!date || !time) return false;
  
  try {
    const scheduled = new Date(`${date}T${time}`);
    const now = new Date();
    
    // Must be in the future
    return scheduled > now;
  } catch {
    return false;
  }
};
