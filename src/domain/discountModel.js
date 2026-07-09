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

// Legacy alias support: treat "flat" as "fixed"
const FLAT_ALIAS = 'flat';

/** @internal Normalise a raw type string, mapping legacy aliases */
function _safeType(raw) {
  if (raw === FLAT_ALIAS) return 'fixed';
  if (DISCOUNT_TYPES.includes(raw)) return raw;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[discountModel] Unknown discount type "${raw}", defaulting to "percentage"`);
  }
  return 'percentage';
}

/** @internal Parse a numeric money/usage value; returns null when input is null/undefined, 0 on bad parse */
function _safeNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback === null ? null : fallback;
  const n = Number(val);
  if (Number.isNaN(n)) return fallback === null ? null : fallback;
  return n;
}

/** @internal Clamp a number to >= floor */
function _clamp(val, floor = 0) {
  return Math.max(floor, val);
}

/** @internal Safely parse and validate an expiry date; returns ISO string or null */
function _safeExpiry(raw) {
  if (!raw) return null;
  try {
    const ts = new Date(raw);
    if (Number.isNaN(ts.getTime())) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[discountModel] Invalid expiryDate "${raw}", ignoring`);
      }
      return null;
    }
    return ts.toISOString();
  } catch {
    return null;
  }
}

/** @internal Safely resolve a timestamp; returns now() on failure */
function _safeTimestamp(raw) {
  if (!raw) return now();
  try {
    const ts = toTimestamp(raw);
    return Number.isNaN(ts) ? now() : ts;
  } catch {
    return now();
  }
}

/** @internal Resolve active flag from multiple legacy shapes */
function _safeActive(obj) {
  if (obj.active !== undefined) return Boolean(obj.active);
  if (obj.status !== undefined) return obj.status === 'active' || obj.status === true;
  return true;
}

/** @internal Default tiers */
const DEFAULT_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

/**
 * Create a new discount
 * @param {object} input - Discount input data
 * @returns {Discount} New discount object
 */
export function createDiscount(input = {}) {
  // Guard: treat null/undefined input as empty object
  const i = (input && typeof input === 'object') ? input : {};

  const rawValue = _safeNumber(i.value, 0);
  const rawMinOrder = _safeNumber(i.minOrder, 0);
  const rawMaxDiscount = (i.maxDiscount === null || i.maxDiscount === undefined)
    ? null : _safeNumber(i.maxDiscount, null);
  const rawMaxUsage = (i.maxUsage === null || i.maxUsage === undefined)
    ? null : _safeNumber(i.maxUsage, null);
  const rawUsage = _safeNumber(i.currentUsage !== undefined ? i.currentUsage : i.usageCount, 0);

  if (process.env.NODE_ENV !== 'production') {
    if (rawValue <= 0) console.warn('[discountModel] createDiscount: value should be > 0');
    if (rawMaxDiscount !== null && rawMaxDiscount < 0) console.warn('[discountModel] createDiscount: maxDiscount should be >= 0');
    if (rawMaxUsage !== null && rawMaxUsage < 0) console.warn('[discountModel] createDiscount: maxUsage should be >= 0');
  }

  return {
    id: i.id || createDiscountId(),
    code: typeof i.code === 'string' ? i.code.trim().toUpperCase() : '',
    name: typeof i.name === 'string' ? i.name.trim() : '',
    type: _safeType(i.type),
    value: _clamp(rawValue, 0),
    minOrder: _clamp(rawMinOrder, 0),
    maxDiscount: rawMaxDiscount !== null ? _clamp(rawMaxDiscount, 0) : null,
    maxUsage: rawMaxUsage !== null ? _clamp(rawMaxUsage, 0) : null,
    currentUsage: _clamp(rawUsage, 0),
    applicableTiers: Array.isArray(i.applicableTiers) ? i.applicableTiers : [...DEFAULT_TIERS],
    active: _safeActive(i),
    expiryDate: _safeExpiry(i.expiryDate),
    notes: typeof i.notes === 'string' ? i.notes.trim() : (typeof i.description === 'string' ? i.description.trim() : ''),
    createdAt: _safeTimestamp(i.createdAt),
    updatedAt: _safeTimestamp(i.updatedAt)
  };
}

/**
 * Normalize a discount to ensure it matches the schema
 * @param {object} discount - Discount object to normalize
 * @returns {Discount} Normalized discount
 */
export function normalizeDiscount(discount) {
  if (!discount || typeof discount !== 'object') return null;

  // Resolve value from multiple legacy keys
  const rawValue = _safeNumber(
    discount.value !== undefined ? discount.value :
    discount.percentage !== undefined ? discount.percentage :
    discount.amount !== undefined ? discount.amount : 0,
    0
  );

  // Resolve minOrder from legacy keys
  const rawMinOrder = _safeNumber(
    discount.minOrder !== undefined ? discount.minOrder :
    discount.minimumOrder !== undefined ? discount.minimumOrder : 0,
    0
  );

  // Resolve maxDiscount (nullable)
  const rawMaxDiscount = (discount.maxDiscount !== null && discount.maxDiscount !== undefined)
    ? _safeNumber(discount.maxDiscount, null) : null;

  // Resolve maxUsage (nullable)
  const rawMaxUsage = (discount.maxUsage !== null && discount.maxUsage !== undefined)
    ? _safeNumber(discount.maxUsage, null) : null;

  // Resolve currentUsage — support legacy "usageCount"
  const rawUsage = _safeNumber(
    discount.currentUsage !== undefined ? discount.currentUsage :
    discount.usageCount !== undefined ? discount.usageCount : 0,
    0
  );

  // Resolve applicableTiers — support legacy "tiers" and "tierRequired"
  let tiers;
  if (Array.isArray(discount.applicableTiers)) {
    tiers = discount.applicableTiers;
  } else if (Array.isArray(discount.tiers)) {
    tiers = discount.tiers;
  } else if (typeof discount.tierRequired === 'string') {
    tiers = [discount.tierRequired];
  } else {
    tiers = [...DEFAULT_TIERS];
  }

  return {
    id: discount.id || createDiscountId(),
    code: typeof discount.code === 'string' ? discount.code.trim().toUpperCase() : '',
    name: typeof discount.name === 'string' ? discount.name.trim() :
          typeof discount.discountName === 'string' ? discount.discountName.trim() : '',
    type: _safeType(discount.type),
    value: _clamp(rawValue, 0),
    minOrder: _clamp(rawMinOrder, 0),
    maxDiscount: rawMaxDiscount !== null ? _clamp(rawMaxDiscount, 0) : null,
    maxUsage: rawMaxUsage !== null ? _clamp(rawMaxUsage, 0) : null,
    currentUsage: _clamp(rawUsage, 0),
    applicableTiers: tiers,
    active: _safeActive(discount),
    expiryDate: _safeExpiry(discount.expiryDate),
    notes: typeof discount.notes === 'string' ? discount.notes.trim() :
           typeof discount.description === 'string' ? discount.description.trim() : '',
    createdAt: _safeTimestamp(discount.createdAt),
    updatedAt: _safeTimestamp(discount.updatedAt)
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
  if (!discount || typeof discount !== 'object') {
    return { valid: false, message: 'Discount not found' };
  }

  // Check if discount is active
  if (!discount.active) {
    return { valid: false, message: 'Discount is not active' };
  }

  // Check expiry date — guard against bad toTimestamp results
  if (discount.expiryDate) {
    try {
      const expiryTime = toTimestamp(discount.expiryDate);
      if (!Number.isNaN(expiryTime) && now() > expiryTime) {
        return { valid: false, message: 'Discount has expired' };
      }
    } catch {
      // Malformed expiry: treat as non-expiring rather than crashing
    }
  }

  // Check minimum order amount — safe parse from multiple order shapes
  const orderTotal = _safeNumber(
    order && (order.subtotal !== undefined ? order.subtotal :
              order.total !== undefined ? order.total :
              order.amount !== undefined ? order.amount : 0),
    0
  );
  const minOrder = _safeNumber(discount.minOrder, 0);
  if (orderTotal < minOrder) {
    return { valid: false, message: `Minimum order ₹${minOrder} required` };
  }

  // Check max usage
  if (isDiscountUsageMaxed(discount)) {
    return { valid: false, message: 'Discount usage limit reached' };
  }

  // Check customer tier requirement — safe: skip check if tier data missing
  if (customer && discount.applicableTiers && Array.isArray(discount.applicableTiers) &&
      discount.applicableTiers.length > 0 && customer.tier) {
    if (!discount.applicableTiers.includes(customer.tier)) {
      return { valid: false, message: `Discount not available for ${customer.tier} tier` };
    }
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

  const orderTotal = _safeNumber(
    order.subtotal !== undefined ? order.subtotal :
    order.total !== undefined ? order.total :
    order.amount !== undefined ? order.amount : 0,
    0
  );
  if (orderTotal <= 0) return 0;

  const discountValue = _safeNumber(discount.value, 0);
  const discountType = _safeType(discount.type); // handles 'flat' → 'fixed'

  if (discountType === 'percentage') {
    // Cap percentage at 100 to prevent negative totals via the formula alone
    const pct = Math.min(_clamp(discountValue, 0), 100);
    let discountAmount = (orderTotal * pct) / 100;

    // Apply maxDiscount cap
    const cap = _safeNumber(discount.maxDiscount, null);
    if (cap !== null && cap >= 0 && discountAmount > cap) {
      discountAmount = cap;
    }

    return _clamp(Math.min(discountAmount, orderTotal), 0);

  } else if (discountType === 'fixed') {
    // Fixed/flat cannot exceed the order total
    return _clamp(Math.min(_clamp(discountValue, 0), orderTotal), 0);
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
  if (!order) return order;
  if (!discount) return { ...order };

  const result = { ...order };

  const orderTotal = _safeNumber(
    order.subtotal !== undefined ? order.subtotal :
    order.total !== undefined ? order.total :
    order.amount !== undefined ? order.amount : 0,
    0
  );
  const discountAmount = calculateDiscountAmount({ ...order, subtotal: orderTotal }, discount);

  result.discountCode = typeof discount.code === 'string' ? discount.code.trim().toUpperCase() : '';
  result.discountAmount = _clamp(discountAmount, 0);
  result.total = _clamp(orderTotal - result.discountAmount, 0);
  result.updatedAt = now();

  return result;
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
    currentUsage: _clamp(_safeNumber(discount.currentUsage, 0) + 1, 0),
    updatedAt: now()
  };
}

/**
 * Decrement discount usage (e.g. on order cancellation)
 * @param {Discount} discount
 * @returns {Discount} Updated discount
 */
export function decrementDiscountUsage(discount) {
  if (!discount) return discount;

  return {
    ...discount,
    currentUsage: _clamp(_safeNumber(discount.currentUsage, 0) - 1, 0),
    updatedAt: now()
  };
}

/**
 * Check if discount has hit its usage cap
 * @param {Discount} discount
 * @returns {boolean}
 */
export function isDiscountUsageMaxed(discount) {
  if (!discount) return false;
  const maxUsage = _safeNumber(discount.maxUsage, null);
  if (maxUsage === null) return false;
  const current = _safeNumber(discount.currentUsage, 0);
  return current >= maxUsage;
}

/**
 * Get remaining usages for a discount (null = unlimited)
 * @param {Discount} discount
 * @returns {number|null}
 */
export function getRemainingUsage(discount) {
  if (!discount) return null;
  const maxUsage = _safeNumber(discount.maxUsage, null);
  if (maxUsage === null) return null;
  const current = _safeNumber(discount.currentUsage, 0);
  return _clamp(maxUsage - current, 0);
}

/**
 * Check if discount is expired
 * @param {Discount} discount - Discount object
 * @returns {boolean} True if expired
 */
export function isDiscountExpired(discount) {
  if (!discount || !discount.expiryDate) return false;
  try {
    const ts = toTimestamp(discount.expiryDate);
    if (Number.isNaN(ts)) return false;
    return now() > ts;
  } catch {
    return false;
  }
}

/**
 * Find discount by code
 * @param {Discount[]} discounts - Array of discounts
 * @param {string} code - Discount code
 * @returns {Discount|null} Found discount or null
 */
export function findDiscountByCode(discounts, code) {
  if (!Array.isArray(discounts)) return null;
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (!normalized) return null;
  return discounts.find(d => d.code === normalized && d.active) || null;
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
