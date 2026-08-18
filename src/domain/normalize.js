// Normalization utilities for converting legacy data to new schema

import { generateId, createOrderId, createCustomerId } from './ids.js';
import { toTimestamp, now } from './dates.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _warn(msg) {
  console.warn('[normalize]', msg);
}

function safeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return typeof val === 'string' ? val : String(val);
}

function safeNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

function safeNonNegativeNumber(val, fallback = 0) {
  return Math.max(0, safeNumber(val, fallback));
}

function safeTimestamp(val) {
  if (!val) return now();
  try {
    const t = toTimestamp(val);
    return (typeof t === 'number' && !Number.isNaN(t)) ? t : now();
  } catch { return now(); }
}

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  return [val];
}

/**
 * Normalise legacy item strings or arrays to the canonical item shape.
 * Handles: "Cappuccino × 2", "Croissant", array items, itemDetails.
 */
function normalizeLegacyItems(legacyOrder) {
  if (typeof legacyOrder.items === 'string') {
    return legacyOrder.items
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map((itemStr, idx) => {
        const match = itemStr.match(/^(.+?)\s*[×x*]\s*(\d+)$/i);
        return {
          id: generateId(),
          menuItemId: `menu-${idx}`,
          name: match ? match[1].trim() : itemStr,
          qty: Math.max(1, parseInt(match ? match[2] : '1', 10) || 1),
          price: 0,
          modifiers: [],
          station: 'Bar',
          notes: ''
        };
      });
  }

  if (Array.isArray(legacyOrder.items)) {
    return legacyOrder.items.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        _warn(`normalizeOrder: skipping malformed item at index ${idx}`);
        return null;
      }
      return {
        id: safeString(item.id) || generateId(),
        menuItemId: safeString(item.menuItemId) || `menu-${idx}`,
        name: safeString(item.name || item.itemName, 'Unknown'),
        qty: Math.max(1, safeNonNegativeNumber(item.qty ?? item.quantity, 1)),
        price: safeNonNegativeNumber(item.price),
        modifiers: safeArray(item.modifiers),
        station: safeString(item.station, 'Bar'),
        notes: safeString(item.notes)
      };
    }).filter(Boolean);
  }

  if (Array.isArray(legacyOrder.itemDetails)) {
    return legacyOrder.itemDetails.map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      return {
        id: generateId(),
        menuItemId: safeString(item.id) || `menu-${idx}`,
        name: safeString(item.name, 'Unknown'),
        qty: Math.max(1, safeNonNegativeNumber(item.qty, 1)),
        price: safeNonNegativeNumber(item.price),
        modifiers: [],
        station: 'Bar',
        notes: ''
      };
    }).filter(Boolean);
  }

  return [];
}

/**
 * Normalize legacy order data to new Order schema
 * @param {object} legacyOrder - Legacy order object
 * @returns {object} Normalized order object
 */
export function normalizeOrder(legacyOrder) {
  if (!legacyOrder || typeof legacyOrder !== 'object') return null;

  let items;
  try {
    items = normalizeLegacyItems(legacyOrder);
  } catch (e) {
    _warn(`normalizeOrder: failed to parse items — ${  e.message}`);
    items = [];
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const subtotal = safeNonNegativeNumber(
    legacyOrder.subtotal ?? legacyOrder.originalAmount ?? itemsSubtotal
  );
  const discountAmount = safeNonNegativeNumber(legacyOrder.discountAmount);
  const total = safeNonNegativeNumber(
    legacyOrder.total ?? legacyOrder.amount ?? (subtotal - discountAmount + taxAmount)
  );
  const taxAmount = safeNonNegativeNumber(legacyOrder.taxAmount);

  const completedAt = legacyOrder.completedAt
    ? safeTimestamp(legacyOrder.completedAt)
    : (legacyOrder.status === 'COMPLETED' ? now() : null);

  return {
    id: safeString(legacyOrder.id) || createOrderId(),
    source: safeString(legacyOrder.source, 'WALK_IN'),
    customerId: legacyOrder.customerId || null,
    customerName: safeString(legacyOrder.customerName || legacyOrder.customer, 'Guest'),
    customerPhone: safeString(legacyOrder.customerPhone || legacyOrder.phone),
    tableId: legacyOrder.tableId || legacyOrder.table || null,
    staffId: legacyOrder.staffId || legacyOrder.staff || null,
    items,
    subtotal,
    discountCode: legacyOrder.discountCode || legacyOrder.discount?.code || null,
    discountAmount,
    taxAmount,
    total,
    status: safeString(legacyOrder.status, 'NEW'),
    paymentStatus: safeString(legacyOrder.paymentStatus || legacyOrder.payStatus, 'UNPAID'),
    paymentMethod: legacyOrder.paymentMethod || null,
    notes: safeString(legacyOrder.notes || legacyOrder.note),
    createdAt: safeTimestamp(legacyOrder.createdAt || legacyOrder.time),
    updatedAt: safeTimestamp(legacyOrder.updatedAt),
    completedAt
  };
}

/**
 * Normalize legacy customer data to new Customer schema
 * @param {object} legacyCustomer - Legacy customer object
 * @returns {object} Normalized customer object
 */
export function normalizeCustomer(legacyCustomer) {
  if (!legacyCustomer || typeof legacyCustomer !== 'object') return null;

  const tags = safeArray(legacyCustomer.tags).filter(t => t !== null && t !== undefined);

  return {
    id: safeString(legacyCustomer.id) || createCustomerId(),
    name: safeString(legacyCustomer.name || legacyCustomer.customer, 'Unknown'),
    phone: safeString(legacyCustomer.phone || legacyCustomer.phoneNumber),
    email: safeString(legacyCustomer.email).trim().toLowerCase(),
    visits: safeNonNegativeNumber(legacyCustomer.visits),
    spend: safeNonNegativeNumber(legacyCustomer.spend ?? legacyCustomer.totalSpend),
    loyaltyPoints: safeNonNegativeNumber(legacyCustomer.loyaltyPoints),
    tier: safeString(legacyCustomer.tier, 'bronze'),
    tags,
    fav: legacyCustomer.fav || legacyCustomer.favoriteItem || null,
    lastVisit: legacyCustomer.lastVisit ? safeTimestamp(legacyCustomer.lastVisit) : null,
    notes: safeString(legacyCustomer.notes),
    createdAt: safeTimestamp(legacyCustomer.createdAt),
    updatedAt: safeTimestamp(legacyCustomer.updatedAt)
  };
}

/**
 * Normalize legacy KDS card data to new KDS schema
 * @param {object} legacyKds - Legacy KDS card object
 * @returns {object} Normalized KDS card object
 */
export function normalizeKdsCard(legacyKds) {
  if (!legacyKds || typeof legacyKds !== 'object') return null;

  const items = safeArray(legacyKds.items)
    .map((item, idx) => {
      if (!item || typeof item !== 'object') {
        _warn(`normalizeKdsCard: skipping malformed item at index ${idx}`);
        return null;
      }
      return {
        name: safeString(item.name, 'Unknown'),
        qty: Math.max(1, safeNonNegativeNumber(item.qty, 1)),
        mod: safeString(item.mod || item.modifier),
        checked: item.checked === true
      };
    })
    .filter(Boolean);

  // Normalise urgency: treat 'normal' and missing as 'ok'
  const rawUrgency = safeString(legacyKds.urgency);
  const urgency = (rawUrgency === 'normal' || !rawUrgency) ? 'ok' : rawUrgency;

  return {
    id: safeString(legacyKds.id) || generateId(),
    // orderId must come from an explicit field — do NOT fall back to the card's
    // own id, which would silently create a self-referential broken link.
    orderId: legacyKds.orderId || null,
    source: safeString(legacyKds.source, 'WALK_IN'),
    station: safeString(legacyKds.station, 'Bar'),
    items,
    note: safeString(legacyKds.note || legacyKds.notes),
    startedAt: safeTimestamp(legacyKds.startedAt || legacyKds.createdAt),
    urgency,
    held: legacyKds.held === true,
    holdReason: safeString(legacyKds.holdReason),
    completed: legacyKds.completed === true
  };
}

/**
 * Normalize array of orders
 * @param {Array} legacyOrders - Array of legacy order objects
 * @returns {Array} Array of normalized order objects
 */
export function normalizeOrders(legacyOrders) {
  if (!Array.isArray(legacyOrders)) {
    if (legacyOrders != null) _warn(`normalizeOrders: expected array, got ${  typeof legacyOrders}`);
    return [];
  }
  return legacyOrders.map((o, i) => {
    try { return normalizeOrder(o); }
    catch (e) { _warn(`normalizeOrders: skipped record at index ${i} — ${e.message}`); return null; }
  }).filter(Boolean);
}

/**
 * Normalize array of customers
 * @param {Array} legacyCustomers - Array of legacy customer objects
 * @returns {Array} Array of normalized customer objects
 */
export function normalizeCustomers(legacyCustomers) {
  if (!Array.isArray(legacyCustomers)) {
    if (legacyCustomers != null) _warn(`normalizeCustomers: expected array, got ${  typeof legacyCustomers}`);
    return [];
  }
  return legacyCustomers.map((c, i) => {
    try { return normalizeCustomer(c); }
    catch (e) { _warn(`normalizeCustomers: skipped record at index ${i} — ${e.message}`); return null; }
  }).filter(Boolean);
}

/**
 * Normalize array of KDS cards
 * @param {Array} legacyKdsCards - Array of legacy KDS card objects
 * @returns {Array} Array of normalized KDS card objects
 */
export function normalizeKdsCards(legacyKdsCards) {
  if (!Array.isArray(legacyKdsCards)) {
    if (legacyKdsCards != null) _warn(`normalizeKdsCards: expected array, got ${  typeof legacyKdsCards}`);
    return [];
  }
  return legacyKdsCards.map((k, i) => {
    try { return normalizeKdsCard(k); }
    catch (e) { _warn(`normalizeKdsCards: skipped record at index ${i} — ${e.message}`); return null; }
  }).filter(Boolean);
}
