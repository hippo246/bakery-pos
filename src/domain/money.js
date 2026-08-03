// Money/currency utilities

// ── Internal safe helpers ────────────────────────────────────────────────────

function devWarn(...args) {
  console.warn('[money]', ...args);
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    if (value != null && value !== '') devWarn('invalid money value', value, '→', fallback);
    return fallback;
  }
  return n;
}

function toNonNegativeNumber(value, fallback = 0) {
  const n = toSafeNumber(value, fallback);
  if (n < 0) {
    devWarn('negative money value clamped', value, '→ 0');
    return 0;
  }
  return n;
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Format amount as Indian Rupees
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "₹1,234.56"
 */
export function formatCurrency(amount) {
  const safe = toSafeNumber(amount, 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(safe);
  } catch {
    return `₹${safe.toFixed(2)}`;
  }
}

/**
 * Format amount without currency symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "1,234.56"
 */
export function formatAmount(amount) {
  const safe = toSafeNumber(amount, 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(safe);
  } catch {
    return safe.toFixed(2);
  }
}

/**
 * Calculate subtotal from items
 * @param {Array} items - Array of items with qty and price
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  const total = items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const qty = toNonNegativeNumber(item.qty, 0);
    const price = toNonNegativeNumber(item.price, 0);
    return sum + qty * price;
  }, 0);
  return roundCurrency(Math.max(0, total));
}

/**
 * Calculate tax amount
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.18 for 18%)
 * @returns {number} Tax amount
 */
export function calculateTax(subtotal, taxRate = 0.18) {
  const safeSub = toNonNegativeNumber(subtotal, 0);
  const safeRate = toNonNegativeNumber(taxRate, 0);
  return roundCurrency(safeSub * safeRate);
}

/**
 * Calculate total with discount and tax.
 * Tax is applied on the post-discount (taxable) amount — correct for Indian GST.
 * @param {number} subtotal - Pre-discount subtotal
 * @param {number} discountAmount - Discount to deduct before tax
 * @param {number} taxRate - GST rate as decimal (default 0.18 = 18%)
 * @returns {{ subtotal, discountAmount, taxableAmount, taxAmount, cgst, sgst, total }}
 */
export function calculateOrderTotals(subtotal, discountAmount = 0, taxRate = 0.18) {
  const safeSub = toNonNegativeNumber(subtotal, 0);
  const safeDiscount = Math.min(toNonNegativeNumber(discountAmount, 0), safeSub);
  const taxableAmount = roundCurrency(Math.max(0, safeSub - safeDiscount));
  const taxAmount = calculateTax(taxableAmount, taxRate);
  // Split evenly for CGST + SGST (standard for intra-state GST)
  const halfTax = roundCurrency(taxAmount / 2);
  // Use difference calculation to avoid rounding errors
  const total = roundCurrency(Math.max(0, taxableAmount + taxAmount));

  return {
    subtotal: roundCurrency(safeSub),
    discountAmount: roundCurrency(safeDiscount),
    taxableAmount,
    taxAmount,
    cgst: halfTax,
    sgst: roundCurrency(taxAmount - halfTax),  // Remaining goes to SGST
    total
  };
}

/**
 * Round to 2 decimal places for currency
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export function roundCurrency(amount) {
  const n = toSafeNumber(amount, 0);
  return Math.round(n * 100) / 100;
}

/**
 * Return a safe non-negative rounded money value (alias for display/storage)
 */
export function safeMoney(value) {
  return roundCurrency(toNonNegativeNumber(value, 0));
}

/**
 * Clamp discount so it never exceeds the subtotal
 */
export function clampDiscountAmount(subtotal, discountAmount) {
  const safeSub = toNonNegativeNumber(subtotal, 0);
  const safeDisc = toNonNegativeNumber(discountAmount, 0);
  return roundCurrency(Math.min(safeDisc, safeSub));
}

/**
 * Calculate a single line total (qty × price)
 */
export function calculateLineTotal(item) {
  if (!item || typeof item !== 'object') return 0;
  const qty = toNonNegativeNumber(item.qty, 0);
  const price = toNonNegativeNumber(item.price, 0);
  return roundCurrency(qty * price);
}

/**
 * Format a rate/ratio as a percentage string, e.g. 0.18 → "18%"
 */
export function formatPercent(value) {
  const n = toSafeNumber(value, 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  } catch {
    return `${roundCurrency(n * 100)}%`;
  }
}

/**
 * Validate amount is non-negative finite number
 * @param {number} amount
 * @returns {boolean}
 */
export function isValidAmount(amount) {
  return Number.isFinite(amount) && amount >= 0;
}

/**
 * Split a total into equal parts, distributing any rounding remainder
 * to the first part. Useful for splitting bills.
 * @param {number} total - Total amount to split
 * @param {number} ways - Number of ways to split (≥1)
 * @returns {number[]} Array of split amounts summing exactly to total
 */
export function splitAmount(total, ways) {
  const safeTotal = toNonNegativeNumber(total, 0);
  const safeWays = Math.max(1, Math.floor(Number(ways) || 1));
  const base = roundCurrency(Math.floor((safeTotal / safeWays) * 100) / 100);
  const remainder = roundCurrency(safeTotal - base * safeWays);
  return Array.from({ length: safeWays }, (_, i) =>
    i === 0 ? roundCurrency(base + remainder) : base
  );
}

/**
 * Calculate change to return to customer (cash payments)
 * @param {number} total - Amount due
 * @param {number} tendered - Amount given by customer
 * @returns {number} Change amount (0 if tendered < total)
 */
export function calculateChange(total, tendered) {
  const due = toNonNegativeNumber(total, 0);
  const given = toNonNegativeNumber(tendered, 0);
  return roundCurrency(Math.max(0, given - due));
}
