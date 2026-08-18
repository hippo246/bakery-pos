// Order domain model with schema validation and helper functions

import { generateId, createOrderId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { calculateSubtotal, calculateOrderTotals } from './money.js';

/**
 * Standard Order schema
 * @typedef {Object} Order
 * @property {string} id - Unique order identifier
 * @property {"WALK_IN"|"SWIGGY"|"ZOMATO"|"DIRECT_DELIVERY"} source - Order source
 * @property {string|null} customerId - Customer ID if linked
 * @property {string} customerName - Customer name
 * @property {string} customerPhone - Customer phone number
 * @property {string|null} tableId - Table ID if dine-in
 * @property {string|null} staffId - Staff ID if assigned
 * @property {OrderItem[]} items - Order items
 * @property {number} subtotal - Subtotal before discount/tax
 * @property {string|null} discountCode - Discount code applied
 * @property {number} discountAmount - Discount amount
 * @property {number} taxAmount - Tax amount
 * @property {number} total - Final total including tax
 * @property {"NEW"|"ACCEPTED"|"PREPARING"|"READY"|"OUT_FOR_DELIVERY"|"COMPLETED"|"CANCELLED"} status - Order status
 * @property {"UNPAID"|"PAID"|"PARTIAL"|"COD"|"REFUNDED"} paymentStatus - Payment status
 * @property {"CASH"|"UPI"|"CARD"|"SPLIT"|"ONLINE"|"COD"|null} paymentMethod - Payment method
 * @property {string} notes - Order notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 * @property {number|null} completedAt - Completion timestamp
 * @property {string|null} tenantId - Tenant ID for multi-tenancy
 * @property {string|null} businessId - Business ID
 * @property {string|null} branchId - Branch ID for multi-branch isolation
 * @property {string|null} createdBy - User ID who created the order (ABAC resource attribute)
 * @property {string|null} updatedBy - User ID who last updated the order (ABAC resource attribute)
 * @property {string|null} sensitivity - Resource sensitivity level (ABAC: public, internal, confidential, restricted)
 * @property {string|null} classification - Resource classification (ABAC: standard, sensitive, critical)
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id - Item ID
 * @property {string} menuItemId - Menu item ID
 * @property {string} name - Item name
 * @property {number} qty - Quantity
 * @property {number} price - Unit price
 * @property {string[]} modifiers - Item modifiers
 * @property {"Bar"|"Kitchen"|"Packaging"|"Dessert"} station - Preparation station
 * @property {string} notes - Item notes
 */

// Extended order lifecycle states
export const ORDER_LIFECYCLE_STATES = {
  DRAFT: 'DRAFT',
  HELD: 'HELD',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  VOIDED: 'VOIDED',
  ARCHIVED: 'ARCHIVED'
};

// Valid lifecycle states
export const LIFECYCLE_STATUSES = Object.values(ORDER_LIFECYCLE_STATES);

// Order status flow (legacy - for backward compatibility)
export const ORDER_STATUS_FLOW = {
  NEW: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
  OUT_FOR_DELIVERY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null
};

// Lifecycle state transitions - defines valid state changes
export const LIFECYCLE_TRANSITIONS = {
  DRAFT: ['HELD', 'PENDING', 'CANCELLED'],
  HELD: ['DRAFT', 'PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVING', 'COMPLETED'],
  SERVING: ['COMPLETED'],
  COMPLETED: ['REFUNDED', 'ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  REFUNDED: ['ARCHIVED'],
  VOIDED: ['ARCHIVED'],
  ARCHIVED: [] // Terminal state
};

// Valid order sources
export const ORDER_SOURCES = ['WALK_IN', 'SWIGGY', 'ZOMATO', 'DIRECT_DELIVERY', 'QR_ORDERING'];

// Valid order statuses (legacy - for backward compatibility)
export const ORDER_STATUSES = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

// Valid payment statuses
export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'PARTIAL', 'COD', 'REFUNDED'];

// Valid payment methods
export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'SPLIT', 'ONLINE', 'COD'];

// Valid stations
export const STATIONS = ['Bar', 'Kitchen', 'Packaging', 'Dessert'];

function devWarn(msg, value) {
  console.warn(`[orderModel] ${msg}`, value ?? '');
}

/**
 * Clamp a value to a safe number, returning fallback if NaN/non-finite
 */
function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Keyword → station map; checked in insertion order, first match wins.
// Extend this when menu grows — O(n) over keywords, not over items.
const _STATION_KEYWORDS = [
  ['Packaging', ['parcel', 'packing', 'packaging', 'takeaway', 'takeout', 'carry', 'box']],
  ['Dessert',   ['cake', 'pie', 'muffin', 'cookie', 'brownie', 'ice cream', 'gelato', 'dessert', 'waffle', 'doughnut', 'donut', 'tart', 'pudding', 'pastry', 'macaron']],
  ['Kitchen',   ['sandwich', 'burger', 'pizza', 'pasta', 'salad', 'soup', 'toast', 'egg', 'pancake', 'wrap', 'roll', 'rice', 'noodle', 'fry', 'grill', 'panini', 'quiche', 'omelette', 'shakshuka', 'idli', 'dosa', 'upma', 'poha', 'paratha']],
  ['Bar',       ['coffee', 'cappuccino', 'latte', 'espresso', 'americano', 'mocha', 'macchiato', 'flat white', 'cold brew', 'chai', 'tea', 'juice', 'smoothie', 'shake', 'lassi', 'water', 'soda', 'lemonade', 'drink', 'beer', 'wine', 'frappe', 'matcha', 'kombucha']],
];

/**
 * Determine station based on item name (safe if name missing).
 * Packaging is checked first — a "Packaging box" should always route there.
 */
function determineStation(itemName) {
  if (!itemName || typeof itemName !== 'string') return 'Bar';
  const name = itemName.toLowerCase();
  for (const [station, keywords] of _STATION_KEYWORDS) {
    if (keywords.some(kw => name.includes(kw))) return station;
  }
  return 'Bar';
}

/**
 * Normalize a single order item safely
 */
function normalizeOrderItem(item) {
  if (!item || typeof item !== 'object') {
    devWarn('skipping malformed item', item);
    return null;
  }
  const name = item.name || item.itemName || 'Unknown Item';
  const qty = Math.max(1, Math.round(safeNum(item.qty ?? item.quantity, 1)));
  const price = safeNum(item.price ?? item.unitPrice, 0);
  const station = STATIONS.includes(item.station) ? item.station : determineStation(name);
  return {
    id: item.id || generateId(),
    menuItemId: item.menuItemId || generateId(),
    name: typeof name === 'string' && name.trim() ? name.trim() : 'Unknown Item',
    qty,
    price,
    modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
    station,
    notes: typeof item.notes === 'string' ? item.notes : ''
  };
}

/**
 * Create a new order from input data
 * @param {object} input - Order input data
 * @returns {Order} New order object
 */
export function createOrder(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const source = ORDER_SOURCES.includes(safeInput.source) ? safeInput.source : 'WALK_IN';
  if (safeInput.source && !ORDER_SOURCES.includes(safeInput.source)) devWarn('invalid source', safeInput.source);

  const status = ORDER_STATUSES.includes(safeInput.status) ? safeInput.status : 'NEW';
  if (safeInput.status && !ORDER_STATUSES.includes(safeInput.status)) devWarn('invalid status', safeInput.status);

  const paymentStatus = PAYMENT_STATUSES.includes(safeInput.paymentStatus) ? safeInput.paymentStatus : 'UNPAID';
  const paymentMethod = PAYMENT_METHODS.includes(safeInput.paymentMethod) ? safeInput.paymentMethod : null;

  const rawItems = Array.isArray(safeInput.items) ? safeInput.items : [];
  const items = rawItems.map(normalizeOrderItem).filter(Boolean);

  const subtotal = safeNum(calculateSubtotal(items));
  const discountAmountRaw = safeNum(safeInput.discountAmount, 0);
  const taxRate = safeNum(safeInput.taxRate, 0.18);
  const { discountAmount, taxAmount, total: rawTotal } = calculateOrderTotals(subtotal, discountAmountRaw, taxRate);
  const total = Math.max(0, safeNum(rawTotal));

  return {
    id: safeInput.id || createOrderId(),
    source,
    customerId: safeInput.customerId || null,
    customerName: safeInput.customerName || 'Guest',
    customerPhone: safeInput.customerPhone || '',
    tableId: safeInput.tableId || null,
    staffId: safeInput.staffId || null,
    items,
    subtotal: safeNum(subtotal),
    discountCode: safeInput.discountCode || null,
    discountAmount: safeNum(discountAmount),
    taxAmount: safeNum(taxAmount),
    total,
    status,
    paymentStatus,
    paymentMethod,
    paymentBreakdown: Array.isArray(safeInput.paymentBreakdown) ? safeInput.paymentBreakdown : [],
    notes: typeof safeInput.notes === 'string' ? safeInput.notes : '',
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now(),
    completedAt: safeInput.completedAt || null
  };
}

/**
 * Normalize an order to ensure it matches the schema
 * @param {object} order - Order object to normalize
 * @returns {Order} Normalized order
 */
export function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return null;

  // Support legacy item formats: itemDetails array or plain items
  const rawItems = Array.isArray(order.items) ? order.items
    : Array.isArray(order.itemDetails) ? order.itemDetails
    : [];
  const items = rawItems.map(normalizeOrderItem).filter(Boolean);

  const subtotal = safeNum(
    typeof order.subtotal === 'number' ? order.subtotal : calculateSubtotal(items)
  );
  const discountAmount = safeNum(order.discountAmount, 0);
  const taxAmount = safeNum(order.taxAmount, 0);
  const total = Math.max(0, safeNum(
    order.total ?? order.amount ?? (subtotal - discountAmount + taxAmount)
  ));

  const rawStatus = order.status;
  const status = ORDER_STATUSES.includes(rawStatus) ? rawStatus : 'NEW';
  if (rawStatus && !ORDER_STATUSES.includes(rawStatus)) devWarn('invalid status in normalizeOrder', rawStatus);

  const rawSource = order.source;
  const source = ORDER_SOURCES.includes(rawSource) ? rawSource : 'WALK_IN';
  if (rawSource && !ORDER_SOURCES.includes(rawSource)) devWarn('invalid source in normalizeOrder', rawSource);

  const rawPayStatus = order.paymentStatus ?? order.payStatus;
  const paymentStatus = PAYMENT_STATUSES.includes(rawPayStatus) ? rawPayStatus : 'UNPAID';
  const paymentMethod = PAYMENT_METHODS.includes(order.paymentMethod) ? order.paymentMethod : null;

  const createdAt = toTimestamp(order.createdAt ?? order.time ?? now());
  const updatedAt = toTimestamp(order.updatedAt ?? now());
  const completedAt = order.completedAt ?? (status === 'COMPLETED' ? now() : null);

  return {
    id: order.id || createOrderId(),
    source,
    customerId: order.customerId || null,
    customerName: order.customerName || order.customer || 'Guest',
    customerPhone: order.customerPhone || order.phone || '',
    tableId: order.tableId || order.table || null,
    staffId: order.staffId || order.staff || null,
    items,
    subtotal,
    discountCode: order.discountCode || null,
    discountAmount,
    taxAmount,
    total,
    status,
    paymentStatus,
    paymentMethod,
    paymentBreakdown: Array.isArray(order.paymentBreakdown) ? order.paymentBreakdown : [],
    notes: typeof (order.notes ?? order.note) === 'string' ? (order.notes ?? order.note) : '',
    createdAt: safeNum(createdAt, now()),
    updatedAt: safeNum(updatedAt, now()),
    completedAt
  };
}

/**
 * Calculate order totals (subtotal, discount, tax, total) from a live order object.
 * Respects the order's own taxRate if present.
 * @param {Order} order - Order object
 * @returns {{ subtotal, discountAmount, taxableAmount, taxAmount, cgst, sgst, total }}
 */
export function calculateOrderTotalsFromOrder(order) {
  const subtotal = calculateSubtotal(order?.items ?? []);
  const taxRate = safeNum(order?.taxRate, 0.18);
  return calculateOrderTotals(subtotal, order?.discountAmount ?? 0, taxRate);
}

/**
 * Group order items by their preparation station.
 * Useful for splitting a single order into per-station KDS tickets.
 * @param {Order} order - Order object
 * @returns {Record<string, OrderItem[]>} Map of station → items
 */
export function groupOrderItemsByStation(order) {
  if (!order || !Array.isArray(order.items)) return {};
  return order.items.reduce((acc, item) => {
    if (!item) return acc;
    const station = item.station || 'Bar';
    (acc[station] ??= []).push(item);
    return acc;
  }, {});
}

/**
 * Get display items string for order
 * @param {Order} order - Order object
 * @returns {string} Display string like "Cappuccino × 2, Croissant × 1"
 */
export function getOrderDisplayItems(order) {
  if (!order || typeof order !== 'object') return 'No items';
  // Support legacy string format
  if (typeof order.items === 'string') return order.items || 'No items';
  if (!Array.isArray(order.items) || order.items.length === 0) return 'No items';
  return order.items
    .filter(item => item && item.name && (item.qty ?? 1) > 0)
    .map(item => `${item.name} × ${Math.max(1, item.qty || 1)}`)
    .join(', ') || 'No items';
}

/**
 * Get customer name from order
 * @param {Order} order - Order object
 * @returns {string} Customer name
 */
export function getOrderCustomerName(order) {
  if (!order || typeof order !== 'object') return 'Guest';
  return order.customerName || order.customer || 'Guest';
}

/**
 * Get order amount (total), never NaN
 * @param {Order} order - Order object
 * @returns {number} Order total
 */
export function getOrderAmount(order) {
  if (!order || typeof order !== 'object') return 0;
  return safeNum(order.total ?? order.amount ?? order.subtotal, 0);
}

/**
 * Validate lifecycle state transition
 * @param {string} currentState - Current lifecycle state
 * @param {string} nextState - Desired next state
 * @returns {boolean} Whether transition is valid
 */
export function isValidLifecycleTransition(currentState, nextState) {
  if (!currentState || !nextState) return false;
  if (!LIFECYCLE_STATUSES.includes(currentState) || !LIFECYCLE_STATUSES.includes(nextState)) {
    return false;
  }
  const validTransitions = LIFECYCLE_TRANSITIONS[currentState] || [];
  return validTransitions.includes(nextState);
}

/**
 * Transition order lifecycle state
 * @param {Order} order - Order object
 * @param {string} nextState - Next lifecycle state
 * @param {string} reason - Reason for transition (optional)
 * @returns {Order} Updated order with new state
 * @throws {Error} If transition is invalid
 */
export function transitionOrderState(order, nextState, reason = null) {
  if (!order || typeof order !== 'object') {
    throw new Error('transitionOrderState: invalid order');
  }

  const currentState = order.lifecycleState || order.status || 'DRAFT';
  
  if (!isValidLifecycleTransition(currentState, nextState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${nextState}. ` +
      `Valid transitions from ${currentState}: ${LIFECYCLE_TRANSITIONS[currentState]?.join(', ') || 'none'}`
    );
  }

  const updatedOrder = {
    ...order,
    lifecycleState: nextState,
    status: nextState, // Update legacy status for compatibility
    updatedAt: now(),
    stateTransition: {
      from: currentState,
      to: nextState,
      at: now(),
      reason: reason || null,
      by: order.staffId || null
    }
  };

  // Set completion timestamp if transitioning to COMPLETED
  if (nextState === 'COMPLETED' && !order.completedAt) {
    updatedOrder.completedAt = now();
  }

  return updatedOrder;
}

/**
 * Update order status (legacy - for backward compatibility)
 * @param {Order} order - Order object
 * @param {string} nextStatus - New status
 * @returns {Order} Updated order object
 */
export function updateOrderStatus(order, nextStatus) {
  if (!order || typeof order !== 'object') throw new Error('updateOrderStatus: invalid order');
  if (!ORDER_STATUSES.includes(nextStatus)) throw new Error(`Invalid status: ${nextStatus}`);
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    devWarn(`Cannot transition from terminal status ${order.status} to ${nextStatus}`);
    return { ...order }; // return copy, no mutation
  }

  const updated = { ...order, status: nextStatus, updatedAt: now() };
  if (nextStatus === 'COMPLETED') updated.completedAt = updated.completedAt || now();
  if (nextStatus === 'CANCELLED') updated.cancelledAt = now();
  return updated;
}

/**
 * Check if order status can be advanced
 * @param {Order} order - Order object
 * @returns {boolean} True if status can be advanced
 */
export function canAdvanceOrderStatus(order) {
  if (!order || typeof order !== 'object') return false;
  const nextStatus = ORDER_STATUS_FLOW[order.status];
  return nextStatus != null;
}

/**
 * Get next status for order
 * @param {Order} order - Order object
 * @returns {string|null} Next status or null if terminal
 */
export function getNextOrderStatus(order) {
  if (!order || typeof order !== 'object') return null;
  return ORDER_STATUS_FLOW[order.status] ?? null;
}

/**
 * Check if a status string is terminal (no further transitions)
 * @param {string} status
 * @returns {boolean}
 */
export function isTerminalOrderStatus(status) {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Check if lifecycle state is terminal
 * @param {string} state - Lifecycle state
 * @returns {boolean}
 */
export function isTerminalLifecycleState(state) {
  return state === 'ARCHIVED' || state === 'COMPLETED' || state === 'CANCELLED' || state === 'REFUNDED' || state === 'VOIDED';
}

/**
 * Get possible next states for current lifecycle state
 * @param {string} currentState - Current lifecycle state
 * @returns {string[]} Array of possible next states
 */
export function getNextLifecycleStates(currentState) {
  return LIFECYCLE_TRANSITIONS[currentState] || [];
}

/**
 * Check if order can be edited
 * @param {Order} order - Order object
 * @returns {boolean} Whether order can be edited
 */
export function canEditOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const state = order.lifecycleState || order.status;
  return ['DRAFT', 'HELD', 'PENDING'].includes(state);
}

/**
 * Check if order can be cancelled
 * @param {Order} order - Order object
 * @returns {boolean} Whether order can be cancelled
 */
export function canCancelOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const state = order.lifecycleState || order.status;
  return ['DRAFT', 'HELD', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(state);
}

/**
 * Check if order can be refunded
 * @param {Order} order - Order object
 * @returns {boolean} Whether order can be refunded
 */
export function canRefundOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const state = order.lifecycleState || order.status;
  return state === 'COMPLETED' && order.paymentStatus === 'PAID';
}

/**
 * Check if order can be voided
 * @param {Order} order - Order object
 * @returns {boolean} Whether order can be voided
 */
export function canVoidOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const state = order.lifecycleState || order.status;
  return ['DRAFT', 'HELD', 'PENDING', 'CONFIRMED'].includes(state);
}

/**
 * Hold an order (transition to HELD state)
 * @param {Order} order - Order object
 * @param {string} reason - Reason for holding
 * @returns {Order} Updated order
 */
export function holdOrder(order, reason = null) {
  return transitionOrderState(order, 'HELD', reason || 'Order held by staff');
}

/**
 * Resume a held order
 * @param {Order} order - Order object
 * @returns {Order} Updated order
 */
export function resumeOrder(order) {
  return transitionOrderState(order, 'PENDING', 'Order resumed');
}

/**
 * Cancel an order
 * @param {Order} order - Order object
 * @param {string} reason - Reason for cancellation
 * @returns {Order} Updated order
 */
export function cancelOrder(order, reason = null) {
  const updated = transitionOrderState(order, 'CANCELLED', reason || 'Order cancelled');
  updated.cancelledAt = now();
  return updated;
}

/**
 * Void an order
 * @param {Order} order - Order object
 * @param {string} reason - Reason for voiding
 * @returns {Order} Updated order
 */
export function voidOrder(order, reason = null) {
  const updated = transitionOrderState(order, 'VOIDED', reason || 'Order voided');
  updated.voidedAt = now();
  return updated;
}

/**
 * Refund an order
 * @param {Order} order - Order object
 * @param {string} reason - Reason for refund
 * @returns {Order} Updated order
 */
export function refundOrder(order, reason = null) {
  const updated = transitionOrderState(order, 'REFUNDED', reason || 'Order refunded');
  updated.refundedAt = now();
  updated.paymentStatus = 'REFUNDED';
  return updated;
}

/**
 * Archive an order
 * @param {Order} order - Order object
 * @returns {Order} Updated order
 */
export function archiveOrder(order) {
  const updated = transitionOrderState(order, 'ARCHIVED', 'Order archived');
  updated.archivedAt = now();
  return updated;
}

/**
 * Check if a status transition is valid
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean}
 */
export function canTransitionOrderStatus(from, to) {
  if (!ORDER_STATUSES.includes(from) || !ORDER_STATUSES.includes(to)) return false;
  if (isTerminalOrderStatus(from)) return false;
  if (to === 'CANCELLED') return true; // Allow cancel from any non-terminal status
  return ORDER_STATUS_FLOW[from] === to;
}

/**
 * Check if order is cancelled
 * @param {Order} order - Order object
 * @returns {boolean} True if cancelled
 */
export function isOrderCancelled(order) {
  return order?.status === 'CANCELLED';
}

/**
 * Automatically transition order status based on KDS completion
 * This enables "self-healing" order status progression
 * @param {Order} order - Order object
 * @param {Object} kdsState - KDS state { tickets: [], completedOrderIds: [] }
 * @returns {Order|null} Updated order if transition occurred, null otherwise
 */
export function autoTransitionOrderStatus(order, kdsState = {}) {
  if (!order || typeof order !== 'object') return null;
  
  const currentStatus = order.status;
  const tickets = Array.isArray(kdsState.tickets) ? kdsState.tickets : [];
  const completedOrderIds = Array.isArray(kdsState.completedOrderIds) ? kdsState.completedOrderIds : [];
  
  // Don't auto-transition from terminal states
  if (['COMPLETED', 'CANCELLED'].includes(currentStatus)) return null;
  
  // NEW -> ACCEPTED: Auto-accept after 30 seconds if not cancelled
  if (currentStatus === 'NEW') {
    const elapsed = (now() - (order.createdAt || now())) / 1000;
    if (elapsed >= 30) {
      return { ...order, status: 'ACCEPTED', updatedAt: now() };
    }
  }
  
  // ACCEPTED -> PREPARING: Auto-start when KDS tickets are created and started
  if (currentStatus === 'ACCEPTED') {
    const orderTickets = tickets.filter(t => t.orderId === order.id);
    const hasStartedTickets = orderTickets.some(t => t.startedAt && !t.completed);
    if (hasStartedTickets) {
      return { ...order, status: 'PREPARING', updatedAt: now() };
    }
  }
  
  // PREPARING -> READY: When all KDS tickets for this order are completed
  if (currentStatus === 'PREPARING') {
    const orderTickets = tickets.filter(t => t.orderId === order.id);
    if (orderTickets.length > 0 && orderTickets.every(t => t.completed)) {
      return { ...order, status: 'READY', updatedAt: now() };
    }
  }
  
  // READY -> COMPLETED: Auto-complete after 5 minutes in READY state
  // or if explicitly marked in completedOrderIds
  if (currentStatus === 'READY') {
    if (completedOrderIds.includes(order.id)) {
      return { ...order, status: 'COMPLETED', completedAt: now(), updatedAt: now() };
    }
    // Auto-complete after 5 minutes to prevent stuck orders
    const readyTime = order.updatedAt || order.createdAt || now();
    const elapsed = (now() - readyTime) / 1000;
    if (elapsed >= 300) { // 5 minutes
      return { ...order, status: 'COMPLETED', completedAt: now(), updatedAt: now() };
    }
  }
  
  return null;
}

/**
 * Batch auto-transition multiple orders
 * @param {Order[]} orders - Array of orders
 * @param {Object} kdsState - KDS state
 * @returns {Order[]} Updated orders (only those that changed)
 */
export function autoTransitionOrders(orders, kdsState = {}) {
  if (!Array.isArray(orders)) return [];
  const safeOrders = orders.filter(o => o && typeof o === 'object');
  
  const updatedOrders = [];
  safeOrders.forEach(order => {
    const updated = autoTransitionOrderStatus(order, kdsState);
    if (updated) {
      updatedOrders.push(updated);
    }
  });
  
  return updatedOrders;
}

/**
 * Check if order is completed
 * @param {Order} order - Order object
 * @returns {boolean} True if completed
 */
export function isOrderCompleted(order) {
  return order?.status === 'COMPLETED';
}

/**
 * Check if order is active (not cancelled or completed)
 * @param {Order} order - Order object
 * @returns {boolean} True if active
 */
export function isOrderActive(order) {
  return !isOrderCancelled(order) && !isOrderCompleted(order);
}

/**
 * Check if order is paid
 * @param {Order} order - Order object
 * @returns {boolean} True if paid
 */
export function isOrderPaid(order) {
  return order?.paymentStatus === 'PAID';
}

