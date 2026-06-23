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

/**
 * Create a new customer from input data
 * @param {object} input - Customer input data
 * @returns {Customer} New customer object
 */
export function createCustomer(input = {}) {
  return {
    id: input.id || createCustomerId(),
    name: input.name || 'Unknown',
    phone: input.phone || '',
    email: input.email || '',
    visits: input.visits || 0,
    spend: input.spend || 0,
    tier: input.tier || calculateTier(input.spend || 0),
    tags: Array.isArray(input.tags) ? input.tags : [],
    fav: input.fav || input.favoriteItem || null,
    lastVisit: input.lastVisit ? toTimestamp(input.lastVisit) : null,
    notes: input.notes || '',
    createdAt: input.createdAt ? toTimestamp(input.createdAt) : now(),
    updatedAt: input.updatedAt ? toTimestamp(input.updatedAt) : now()
  };
}

/**
 * Normalize a customer to ensure it matches the schema
 * @param {object} customer - Customer object to normalize
 * @returns {Customer} Normalized customer
 */
export function normalizeCustomer(customer) {
  if (!customer) return null;

  const spend = typeof customer.spend === 'number' ? customer.spend : 
                typeof customer.totalSpend === 'number' ? customer.totalSpend : 0;

  return {
    id: customer.id || createCustomerId(),
    name: customer.name || customer.customer || 'Unknown',
    phone: customer.phone || customer.phoneNumber || '',
    email: customer.email || '',
    visits: typeof customer.visits === 'number' ? customer.visits : 0,
    spend,
    tier: CUSTOMER_TIERS.includes(customer.tier) ? customer.tier : calculateTier(spend),
    tags: Array.isArray(customer.tags) ? customer.tags : [],
    fav: customer.fav || customer.favoriteItem || null,
    lastVisit: customer.lastVisit ? toTimestamp(customer.lastVisit) : null,
    notes: customer.notes || '',
    createdAt: customer.createdAt ? toTimestamp(customer.createdAt) : now(),
    updatedAt: customer.updatedAt ? toTimestamp(customer.updatedAt) : now()
  };
}

/**
 * Calculate customer tier based on spend
 * @param {number} spend - Total amount spent
 * @returns {string} Customer tier
 */
export function calculateTier(spend) {
  if (spend >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (spend >= TIER_THRESHOLDS.gold) return 'gold';
  if (spend >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Update customer after order completion
 * @param {Customer} customer - Customer object
 * @param {object} order - Completed order
 * @returns {Customer} Updated customer object
 */
export function updateCustomerAfterOrder(customer, order) {
  if (!customer || !order) return customer;

  const newSpend = customer.spend + (order.total || 0);
  const newVisits = customer.visits + 1;

  return {
    ...customer,
    spend: newSpend,
    visits: newVisits,
    tier: calculateTier(newSpend),
    lastVisit: toTimestamp(order.completedAt || now()),
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
  if (!phone || !customers) return null;
  return customers.find(c => c.phone === phone) || null;
}

/**
 * Create customer from order if not exists
 * @param {object} order - Order object
 * @param {Customer[]} customers - Array of existing customers
 * @returns {Customer} New or existing customer
 */
export function getOrCreateCustomerFromOrder(order, customers = []) {
  if (!order.customerPhone) {
    return createCustomer({ name: order.customerName || 'Guest' });
  }

  const existing = findCustomerByPhone(order.customerPhone, customers);
  if (existing) {
    return existing;
  }

  return createCustomer({
    name: order.customerName || 'Guest',
    phone: order.customerPhone
  });
}

/**
 * Check if customer is VIP (gold or platinum tier)
 * @param {Customer} customer - Customer object
 * @returns {boolean} True if VIP
 */
export function isVipCustomer(customer) {
  return customer.tier === 'gold' || customer.tier === 'platinum';
}

/**
 * Get customer display name
 * @param {Customer} customer - Customer object
 * @returns {string} Display name
 */
export function getCustomerDisplayName(customer) {
  return customer.name || 'Unknown';
}

/**
 * Get customer display phone (masked for privacy)
 * @param {Customer} customer - Customer object
 * @returns {string} Masked phone number
 */
export function getCustomerDisplayPhone(customer) {
  if (!customer.phone || customer.phone.length < 4) return customer.phone;
  const last4 = customer.phone.slice(-4);
  return `•••• ${last4}`;
}
