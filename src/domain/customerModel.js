// Customer domain model with schema validation and helper functions

import { generateId, createCustomerId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * Standard Customer schema
 * @typedef {Object} Customer
 * @property {string} id - Unique customer identifier
 * @property {string} name - Customer name
 * @property {string} phone - Customer phone number
 * @property {string} email - Customer email
 * @property {number} visits - Number of visits
 * @property {number} spend - Total amount spent
 * @property {"bronze"|"silver"|"gold"|"platinum"} tier - Customer tier
 * @property {string[]} tags - Customer tags
 * @property {string|null} fav - Favorite item
 * @property {number|null} lastVisit - Last visit timestamp
 * @property {string} notes - Customer notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

// Valid customer tiers
export const CUSTOMER_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

// Tier thresholds (minimum spend to reach tier)
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5000,
  gold: 15000,
  platinum: 50000
};

// Valid customer statuses
export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked'];

// Valid preferred channels
export const PREFERRED_CHANNELS = ['whatsapp', 'sms', 'email', 'none'];

const DEV = process.env.NODE_ENV !== 'production';

function devWarn(msg, value) {
  if (DEV) console.warn(`[customerModel] ${msg}`, value ?? '');
}

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function safeTimestamp(val) {
  if (!val) return null;
  try {
    const ts = toTimestamp(val);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

/**
 * Normalize a phone string to digits only (keeps leading +)
 * @param {string} raw
 * @returns {string}
 */
export function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const digits = raw.replace(/[^\d+]/g, '');
  return digits;
}

/**
 * Normalize an email: trim + lowercase
 * @param {string} raw
 * @returns {string}
 */
export function normalizeEmail(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

/**
 * Basic email validity check (no regex extremism)
 * @param {string} email
 * @returns {boolean}
 */
export function isValidCustomerEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim();
  return e.includes('@') && e.includes('.') && e.length > 4;
}

/**
 * Basic phone validity: at least 7 digits
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidCustomerPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return phone.replace(/\D/g, '').length >= 7;
}

/**
 * Normalize a loyalty transaction to safe shape
 */
function normalizeLoyaltyTransaction(tx) {
  if (!tx || typeof tx !== 'object') return null;
  return {
    id: tx.id || generateId(),
    type: typeof tx.type === 'string' ? tx.type : 'earn',
    points: safeNum(tx.points),
    reason: typeof tx.reason === 'string' ? tx.reason : '',
    createdAt: safeTimestamp(tx.createdAt) || now()
  };
}


/**
 * Create a new customer from input data
 * @param {object} input - Customer input data
 * @returns {Customer} New customer object
 */
export function createCustomer(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const spend = safeNum(safeInput.spend, 0);
  const visits = safeNum(safeInput.visits, 0);
  const loyaltyPoints = safeNum(safeInput.loyaltyPoints, 0);

  const tier = CUSTOMER_TIERS.includes(safeInput.tier) ? safeInput.tier : calculateTier(spend);
  if (safeInput.tier && !CUSTOMER_TIERS.includes(safeInput.tier)) devWarn('invalid tier', safeInput.tier);

  const rawTags = Array.isArray(safeInput.tags) ? safeInput.tags : [];
  const tags = rawTags.filter(t => t && typeof t === 'string');

  const status = CUSTOMER_STATUSES.includes(safeInput.status) ? safeInput.status : 'active';

  return {
    id: safeInput.id || createCustomerId(),
    name: (typeof safeInput.name === 'string' && safeInput.name.trim()) ? safeInput.name.trim() : 'Guest',
    phone: normalizePhone(safeInput.phone || ''),
    email: normalizeEmail(safeInput.email || ''),
    visits,
    spend,
    loyaltyPoints,
    tier,
    tags,
    fav: safeInput.fav || safeInput.favoriteItem || null,
    lastVisit: safeTimestamp(safeInput.lastVisit),
    notes: typeof safeInput.notes === 'string' ? safeInput.notes : '',
    status,
    preferredChannel: PREFERRED_CHANNELS.includes(safeInput.preferredChannel) ? safeInput.preferredChannel : 'none',
    consentMarketing: Boolean(safeInput.consentMarketing ?? false),
    consentSms: Boolean(safeInput.consentSms ?? false),
    birthday: safeInput.birthday || null,
    allergy: typeof safeInput.allergy === 'string' ? safeInput.allergy : '',
    pinnedNote: typeof safeInput.pinnedNote === 'string' ? safeInput.pinnedNote : '',
    loyaltyTransactions: Array.isArray(safeInput.loyaltyTransactions)
      ? safeInput.loyaltyTransactions.map(normalizeLoyaltyTransaction).filter(Boolean)
      : [],
    createdAt: safeTimestamp(safeInput.createdAt) || now(),
    updatedAt: safeTimestamp(safeInput.updatedAt) || now()
  };
}

/**
 * Normalize a customer to ensure it matches the schema
 * @param {object} customer - Customer object to normalize
 * @returns {Customer} Normalized customer
 */
export function normalizeCustomer(customer) {
  if (!customer || typeof customer !== 'object') return null;

  const spend = safeNum(customer.spend ?? customer.totalSpend, 0);
  const visits = safeNum(customer.visits, 0);
  const loyaltyPoints = safeNum(customer.loyaltyPoints, 0);

  const rawTier = customer.tier;
  const tier = CUSTOMER_TIERS.includes(rawTier) ? rawTier : calculateTier(spend);
  if (rawTier && !CUSTOMER_TIERS.includes(rawTier)) devWarn('invalid tier in normalizeCustomer', rawTier);

  const rawStatus = customer.status;
  const status = CUSTOMER_STATUSES.includes(rawStatus) ? rawStatus : 'active';

  const rawTags = Array.isArray(customer.tags) ? customer.tags : [];
  const tags = rawTags.filter(t => t && typeof t === 'string');

  return {
    id: customer.id || createCustomerId(),
    name: (() => {
      const raw = (typeof customer.name === 'string' && customer.name.trim())
        ? customer.name.trim()
        : (typeof customer.customer === 'string' && customer.customer.trim())
          ? customer.customer.trim()
          : '';
      return raw || 'Guest';
    })(),
    phone: normalizePhone(customer.phone || customer.phoneNumber || ''),
    email: normalizeEmail(customer.email || ''),
    visits,
    spend,
    loyaltyPoints,
    tier,
    tags,
    fav: customer.fav || customer.favoriteItem || null,
    lastVisit: safeTimestamp(customer.lastVisit),
    notes: typeof (customer.notes) === 'string' ? customer.notes : '',
    status,
    preferredChannel: PREFERRED_CHANNELS.includes(customer.preferredChannel) ? customer.preferredChannel : 'none',
    consentMarketing: Boolean(customer.consentMarketing ?? false),
    consentSms: Boolean(customer.consentSms ?? false),
    birthday: customer.birthday || null,
    allergy: typeof customer.allergy === 'string' ? customer.allergy : '',
    pinnedNote: typeof customer.pinnedNote === 'string' ? customer.pinnedNote : '',
    loyaltyTransactions: Array.isArray(customer.loyaltyTransactions)
      ? customer.loyaltyTransactions.map(normalizeLoyaltyTransaction).filter(Boolean)
      : [],
    createdAt: safeTimestamp(customer.createdAt) || now(),
    updatedAt: safeTimestamp(customer.updatedAt) || now()
  };
}

/**
 * Calculate customer tier based on spend
 * @param {number} spend - Total amount spent
 * @returns {string} Customer tier
 */
export function calculateTier(spend) {
  const s = safeNum(spend, 0);
  if (s >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (s >= TIER_THRESHOLDS.gold) return 'gold';
  if (s >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Update customer after order completion
 * @param {Customer} customer - Customer object
 * @param {object} order - Completed order
 * @returns {Customer} Updated customer object
 */
export function updateCustomerAfterOrder(customer, order) {
  if (!customer || typeof customer !== 'object') return customer;
  if (!order || typeof order !== 'object') return { ...customer };

  const orderTotal = safeNum(order.total ?? order.amount, 0);
  const newSpend = safeNum(customer.spend) + orderTotal;
  const newVisits = safeNum(customer.visits) + 1;
  const newTier = calculateTier(newSpend);
  const newLastVisit = safeTimestamp(order.completedAt) || now();

  // Update loyalty points (1 point per unit spent, floor)
  const pointsEarned = Math.floor(orderTotal);
  const newLoyaltyPoints = safeNum(customer.loyaltyPoints) + pointsEarned;

  // Update fav item: prefer the most recent order's first item over historical value
  let newFav = customer.fav || null;
  if (Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items.find(i => i && i.name);
    if (firstItem) newFav = firstItem.name;
  }

  return {
    ...customer,
    spend: newSpend,
    visits: newVisits,
    tier: newTier,
    loyaltyPoints: newLoyaltyPoints,
    fav: newFav,
    lastVisit: newLastVisit,
    updatedAt: now()
  };
}

/**
 * Find or create customer by phone
 * @param {string} phone - Customer phone number
 * @param {Customer[]} customers - Array of existing customers
 * @param {string} name - Customer name (for new customer creation)
 * @returns {Customer|null} Found customer or null
 */
export function findCustomerByPhone(phone, customers, name = 'Guest') {
  if (!phone || !Array.isArray(customers)) return null;
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return customers.find(c => c && normalizePhone(c.phone || '') === normalized) || null;
}

/**
 * Create customer from order if not exists
 * @param {object} order - Order object
 * @param {Customer[]} customers - Array of existing customers
 * @returns {Customer} New or existing customer
 */
export function getOrCreateCustomerFromOrder(order, customers = []) {
  if (!order || typeof order !== 'object') return createCustomer();

  const phone = normalizePhone(order.customerPhone || '');

  if (!phone) {
    // Guest order — create a transient guest customer
    return createCustomer({ name: order.customerName || 'Guest' });
  }

  // Try phone match first, then customerId
  const byPhone = findCustomerByPhone(phone, customers);
  if (byPhone) return byPhone;

  if (order.customerId) {
    const byId = Array.isArray(customers) ? customers.find(c => c && c.id === order.customerId) : null;
    if (byId) return byId;
  }

  return createCustomer({
    id: order.customerId || undefined,
    name: order.customerName || 'Guest',
    phone
  });
}

/**
 * Check if customer is VIP (gold or platinum tier)
 * @param {Customer} customer - Customer object
 * @returns {boolean} True if VIP
 */
export function isVipCustomer(customer) {
  if (!customer || typeof customer !== 'object') return false;
  return customer.tier === 'gold' || customer.tier === 'platinum';
}

/**
 * Get customer display name
 * @param {Customer} customer - Customer object
 * @returns {string} Display name
 */
export function getCustomerDisplayName(customer) {
  if (!customer || typeof customer !== 'object') return 'Guest';
  return (typeof customer.name === 'string' && customer.name.trim()) ? customer.name.trim() : 'Guest';
}

/**
 * Get customer display phone (masked for privacy)
 * @param {Customer} customer - Customer object
 * @returns {string} Masked phone number or em-dash fallback
 */
export function getCustomerDisplayPhone(customer) {
  if (!customer || typeof customer !== 'object') return '—';
  const phone = customer.phone || '';
  if (!phone) return '—';
  // Strip leading country code (+91 or similar) before finding last 4 meaningful digits
  const digits = phone.replace(/^\+\d{1,3}/, '').replace(/\D/g, '');
  if (digits.length < 4) return phone || '—';
  const last4 = digits.slice(-4);
  return `•••• ${last4}`;
}

/**
 * Get customer's last visit timestamp safely
 * @param {Customer} customer
 * @returns {number|null}
 */
export function getCustomerLastVisitTime(customer) {
  if (!customer || typeof customer !== 'object') return null;
  const ts = safeTimestamp(customer.lastVisit);
  return ts ?? null;
}

/**
 * Get customer's total spend safely, never NaN
 * @param {Customer} customer
 * @returns {number}
 */
export function getCustomerSpend(customer) {
  if (!customer || typeof customer !== 'object') return 0;
  return safeNum(customer.spend ?? customer.totalSpend, 0);
}
