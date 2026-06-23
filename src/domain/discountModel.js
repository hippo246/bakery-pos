// Discount domain model with validation logic

import { generateId, createDiscountId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * Standard Discount schema
 * @typedef {Object} Discount
 * @property {string} id - Unique discount identifier
 * @property {string} code - Discount code
 * @property {string} name - Discount name
 * @property {"percentage"|"fixed"} type - Discount type
 * @property {number} value - Discount value (percentage or fixed amount)
 * @property {number} minOrder - Minimum order amount to apply
 * @property {number} maxDiscount - Maximum discount amount cap
 * @property {number} maxUsage - Maximum usage limit
 * @property {number} currentUsage - Current usage count
 * @property {string[]} applicableTiers - Customer tiers that can use this discount
 * @property {boolean} active - Whether discount is active
 * @property {string|null} expiryDate - Expiry date (ISO string)
 * @property {string} notes - Discount notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

// Valid discount types
export const DISCOUNT_TYPES = ['percentage', 'fixed'];

/**
 * Create a new discount
 * @param {object} input - Discount input data
 * @returns {Discount} New discount object
 */
export function createDiscount(input = {}) {
  return {
    id: input.id || createDiscountId(),
    code: input.code || '',
    name: input.name || '',
    type: DISCOUNT_TYPES.includes(input.type) ? input.type : 'percentage',
    value: typeof input.value === 'number' ? input.value : 0,
    minOrder: typeof input.minOrder === 'number' ? input.minOrder : 0,
    maxDiscount: typeof input.maxDiscount === 'number' ? input.maxDiscount : null,
    maxUsage: typeof input.maxUsage === 'number' ? input.maxUsage : null,
    currentUsage: typeof input.currentUsage === 'number' ? input.currentUsage : 0,
    applicableTiers: Array.isArray(input.applicableTiers) ? input.applicableTiers : ['bronze', 'silver', 'gold', 'platinum'],
    active: input.active !== undefined ? input.active : true,
    expiryDate: input.expiryDate || null,
    notes: input.notes || '',
    createdAt: input.createdAt ? toTimestamp(input.createdAt) : now(),
    updatedAt: input.updatedAt ? toTimestamp(input.updatedAt) : now()
  };
}

/**
 * Normalize a discount to ensure it matches the schema
 * @param {object} discount - Discount object to normalize
 * @returns {Discount} Normalized discount
 */
export function normalizeDiscount(discount) {
  if (!discount) return null;

  return {
    id: discount.id || createDiscountId(),
    code: discount.code || '',
    name: discount.name || discount.discountName || '',
    type: DISCOUNT_TYPES.includes(discount.type) ? discount.type : 'percentage',
    value: typeof discount.value === 'number' ? discount.value : 
           typeof discount.percentage === 'number' ? discount.percentage : 0,
    minOrder: typeof discount.minOrder === 'number' ? discount.minOrder : 
              typeof discount.minimumOrder === 'number' ? discount.minimumOrder : 0,
    maxDiscount: typeof discount.maxDiscount === 'number' ? discount.maxDiscount : null,
    maxUsage: typeof discount.maxUsage === 'number' ? discount.maxUsage : null,
    currentUsage: typeof discount.currentUsage === 'number' ? discount.currentUsage : 0,
    applicableTiers: Array.isArray(discount.applicableTiers) ? discount.applicableTiers : 
                    Array.isArray(discount.tiers) ? discount.tiers : ['bronze', 'silver', 'gold', 'platinum'],
    active: discount.active !== undefined ? discount.active : true,
    expiryDate: discount.expiryDate || null,
    notes: discount.notes || '',
    createdAt: discount.createdAt ? toTimestamp(discount.createdAt) : now(),
    updatedAt: discount.updatedAt ? toTimestamp(discount.updatedAt) : now()
  };
}

/**
 * Validate discount for order and customer
 * @param {object} order - Order object
 * @param {object} customer - Customer object
 * @param {Discount} discount - Discount object
 * @returns {object} Validation result with valid flag and message
 */
export function validateDiscount(order, customer, discount) {
  if (!discount) {
    return { valid: false, message: 'Discount not found' };
  }

  // Check if discount is active
  if (!discount.active) {
    return { valid: false, message: 'Discount is not active' };
  }

  // Check expiry date
  if (discount.expiryDate) {
    const expiryTime = toTimestamp(discount.expiryDate);
    if (now() > expiryTime) {
      return { valid: false, message: 'Discount has expired' };
    }
  }

  // Check minimum order amount
  const orderTotal = order.total || order.amount || 0;
  if (orderTotal < discount.minOrder) {
    return { valid: false, message: `Minimum order ₹${discount.minOrder} required` };
  }

  // Check max usage
  if (discount.maxUsage && discount.currentUsage >= discount.maxUsage) {
    return { valid: false, message: 'Discount usage limit reached' };
  }

  // Check customer tier requirement
  if (customer && discount.applicableTiers && !discount.applicableTiers.includes(customer.tier)) {
    return { valid: false, message: `Discount not available for ${customer.tier} tier` };
  }

  return { valid: true, message: '' };
}

/**
 * Calculate discount amount for order
 * @param {object} order - Order object
 * @param {Discount} discount - Discount object
 * @returns {number} Discount amount
 */
export function calculateDiscountAmount(order, discount) {
  if (!discount || !order) return 0;

  const orderTotal = order.total || order.amount || 0;

  if (discount.type === 'percentage') {
    let discountAmount = (orderTotal * discount.value) / 100;
    
    // Apply max discount cap if set
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount;
    }
    
    return discountAmount;
  } else if (discount.type === 'fixed') {
    return Math.min(discount.value, orderTotal);
  }

  return 0;
}

/**
 * Apply discount to order
 * @param {object} order - Order object
 * @param {Discount} discount - Discount object
 * @returns {object} Updated order with discount applied
 */
export function applyDiscountToOrder(order, discount) {
  if (!order || !discount) return order;

  const discountAmount = calculateDiscountAmount(order, discount);
  const orderTotal = order.total || order.amount || 0;
  const newTotal = Math.max(0, orderTotal - discountAmount);

  return {
    ...order,
    discountCode: discount.code,
    discountAmount,
    total: newTotal,
    updatedAt: now()
  };
}

/**
 * Increment discount usage
 * @param {Discount} discount - Discount object
 * @returns {Discount} Updated discount
 */
export function incrementDiscountUsage(discount) {
  if (!discount) return discount;

  return {
    ...discount,
    currentUsage: discount.currentUsage + 1,
    updatedAt: now()
  };
}

/**
 * Check if discount is expired
 * @param {Discount} discount - Discount object
 * @returns {boolean} True if expired
 */
export function isDiscountExpired(discount) {
  if (!discount || !discount.expiryDate) return false;
  return now() > toTimestamp(discount.expiryDate);
}

/**
 * Find discount by code
 * @param {Discount[]} discounts - Array of discounts
 * @param {string} code - Discount code
 * @returns {Discount|null} Found discount or null
 */
export function findDiscountByCode(discounts, code) {
  if (!Array.isArray(discounts)) return null;
  return discounts.find(d => d.code === code && d.active) || null;
}

/**
 * Get active discounts
 * @param {Discount[]} discounts - Array of discounts
 * @returns {Discount[]} Active discounts
 */
export function getActiveDiscounts(discounts) {
  if (!Array.isArray(discounts)) return [];
  return discounts.filter(d => d.active && !isDiscountExpired(d));
}
