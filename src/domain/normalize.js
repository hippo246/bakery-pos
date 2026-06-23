// Normalization utilities for converting legacy data to new schema

import { generateId, createOrderId, createCustomerId } from './ids.js';
import { toTimestamp, now } from './dates.js';

/**
 * Normalize legacy order data to new Order schema
 * @param {object} legacyOrder - Legacy order object
 * @returns {object} Normalized order object
 */
export function normalizeOrder(legacyOrder) {
  if (!legacyOrder) return null;

  // Handle items - could be string or array
  let items = [];
  if (typeof legacyOrder.items === 'string') {
    // Parse string format like "Cappuccino × 2, Croissant × 1"
    const itemStrings = legacyOrder.items.split(',').map(s => s.trim());
    items = itemStrings.map((itemStr, idx) => {
      const match = itemStr.match(/(.+?)\s*×\s*(\d+)/);
      if (match) {
        return {
          id: generateId(),
          menuItemId: `menu-${idx}`,
          name: match[1].trim(),
          qty: parseInt(match[2], 10) || 1,
          price: 0, // Will need to be calculated from menu
          modifiers: [],
          station: 'Bar', // Default, should be determined from menu
          notes: ''
        };
      }
      return {
        id: generateId(),
        menuItemId: `menu-${idx}`,
        name: itemStr,
        qty: 1,
        price: 0,
        modifiers: [],
        station: 'Bar',
        notes: ''
      };
    });
  } else if (Array.isArray(legacyOrder.items)) {
    items = legacyOrder.items.map((item, idx) => ({
      id: item.id || generateId(),
      menuItemId: item.menuItemId || `menu-${idx}`,
      name: item.name || item.name || 'Unknown',
      qty: item.qty || item.quantity || 1,
      price: item.price || 0,
      modifiers: item.modifiers || [],
      station: item.station || 'Bar',
      notes: item.notes || ''
    }));
  } else if (legacyOrder.itemDetails && Array.isArray(legacyOrder.itemDetails)) {
    items = legacyOrder.itemDetails.map((item, idx) => ({
      id: item.id || generateId(),
      menuItemId: item.id || `menu-${idx}`,
      name: item.name || 'Unknown',
      qty: item.qty || 1,
      price: item.price || 0,
      modifiers: [],
      station: 'Bar',
      notes: ''
    }));
  }

  // Calculate totals if not present
  const subtotal = legacyOrder.subtotal || legacyOrder.originalAmount || 
    items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const discountAmount = legacyOrder.discountAmount || 0;
  const total = legacyOrder.total || legacyOrder.amount || subtotal - discountAmount;

  return {
    id: legacyOrder.id || createOrderId(),
    source: legacyOrder.source || 'WALK_IN',
    customerId: legacyOrder.customerId || null,
    customerName: legacyOrder.customerName || legacyOrder.customer || 'Guest',
    customerPhone: legacyOrder.customerPhone || legacyOrder.phone || '',
    tableId: legacyOrder.tableId || legacyOrder.table || null,
    staffId: legacyOrder.staffId || legacyOrder.staff || null,
    items,
    subtotal,
    discountCode: legacyOrder.discountCode || legacyOrder.discount?.code || null,
    discountAmount,
    taxAmount: legacyOrder.taxAmount || 0,
    total,
    status: legacyOrder.status || 'NEW',
    paymentStatus: legacyOrder.paymentStatus || legacyOrder.payStatus || 'UNPAID',
    paymentMethod: legacyOrder.paymentMethod || null,
    notes: legacyOrder.notes || legacyOrder.note || '',
    createdAt: toTimestamp(legacyOrder.createdAt || legacyOrder.time || now()),
    updatedAt: toTimestamp(legacyOrder.updatedAt || now()),
    completedAt: legacyOrder.completedAt || (legacyOrder.status === 'COMPLETED' ? now() : null)
  };
}

/**
 * Normalize legacy customer data to new Customer schema
 * @param {object} legacyCustomer - Legacy customer object
 * @returns {object} Normalized customer object
 */
export function normalizeCustomer(legacyCustomer) {
  if (!legacyCustomer) return null;

  return {
    id: legacyCustomer.id || createCustomerId(),
    name: legacyCustomer.name || legacyCustomer.customer || 'Unknown',
    phone: legacyCustomer.phone || legacyCustomer.phoneNumber || '',
    email: legacyCustomer.email || '',
    visits: legacyCustomer.visits || 0,
    spend: legacyCustomer.spend || legacyCustomer.totalSpend || 0,
    tier: legacyCustomer.tier || 'bronze',
    tags: legacyCustomer.tags || [],
    fav: legacyCustomer.fav || legacyCustomer.favoriteItem || null,
    lastVisit: legacyCustomer.lastVisit ? toTimestamp(legacyCustomer.lastVisit) : null,
    notes: legacyCustomer.notes || '',
    createdAt: legacyCustomer.createdAt ? toTimestamp(legacyCustomer.createdAt) : now(),
    updatedAt: legacyCustomer.updatedAt ? toTimestamp(legacyCustomer.updatedAt) : now()
  };
}

/**
 * Normalize legacy KDS card data to new KDS schema
 * @param {object} legacyKds - Legacy KDS card object
 * @returns {object} Normalized KDS card object
 */
export function normalizeKdsCard(legacyKds) {
  if (!legacyKds) return null;

  // Handle items - ensure they have checked property
  let items = [];
  if (Array.isArray(legacyKds.items)) {
    items = legacyKds.items.map(item => ({
      name: item.name || 'Unknown',
      qty: item.qty || 1,
      mod: item.mod || item.modifier || '',
      checked: item.checked !== undefined ? item.checked : false
    }));
  }

  return {
    id: legacyKds.id || generateId(),
    orderId: legacyKds.orderId || legacyKds.id,
    source: legacyKds.source || 'WALK_IN',
    station: legacyKds.station || 'Bar',
    items,
    note: legacyKds.note || legacyKds.notes || '',
    startedAt: toTimestamp(legacyKds.startedAt || legacyKds.createdAt || now()),
    urgency: legacyKds.urgency === 'normal' ? 'ok' : legacyKds.urgency || 'ok',
    held: legacyKds.held || false,
    holdReason: legacyKds.holdReason || ''
  };
}

/**
 * Normalize array of orders
 * @param {Array} legacyOrders - Array of legacy order objects
 * @returns {Array} Array of normalized order objects
 */
export function normalizeOrders(legacyOrders) {
  if (!Array.isArray(legacyOrders)) return [];
  return legacyOrders.map(normalizeOrder).filter(Boolean);
}

/**
 * Normalize array of customers
 * @param {Array} legacyCustomers - Array of legacy customer objects
 * @returns {Array} Array of normalized customer objects
 */
export function normalizeCustomers(legacyCustomers) {
  if (!Array.isArray(legacyCustomers)) return [];
  return legacyCustomers.map(normalizeCustomer).filter(Boolean);
}

/**
 * Normalize array of KDS cards
 * @param {Array} legacyKdsCards - Array of legacy KDS card objects
 * @returns {Array} Array of normalized KDS card objects
 */
export function normalizeKdsCards(legacyKdsCards) {
  if (!Array.isArray(legacyKdsCards)) return [];
  return legacyKdsCards.map(normalizeKdsCard).filter(Boolean);
}
