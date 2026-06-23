// Order domain model with schema validation and helper functions

import { generateId, createOrderId, createCustomerId, createKdsTicketId } from './ids.js';
import { now, toTimestamp } from './dates.js';
import { calculateSubtotal, calculateOrderTotals, roundCurrency } from './money.js';

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

// Order status flow
export const ORDER_STATUS_FLOW = {
  NEW: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
  OUT_FOR_DELIVERY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null
};

// Valid order sources
export const ORDER_SOURCES = ['WALK_IN', 'SWIGGY', 'ZOMATO', 'DIRECT_DELIVERY'];

// Valid order statuses
export const ORDER_STATUSES = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

// Valid payment statuses
export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'PARTIAL', 'COD', 'REFUNDED'];

// Valid payment methods
export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'SPLIT', 'ONLINE', 'COD'];

// Valid stations
export const STATIONS = ['Bar', 'Kitchen', 'Packaging', 'Dessert'];

/**
 * Create a new order from input data
 * @param {object} input - Order input data
 * @returns {Order} New order object
 */
export function createOrder(input = {}) {
  const items = input.items || [];
  const subtotal = calculateSubtotal(items);
  const { discountAmount, taxAmount, total } = calculateOrderTotals(
    subtotal,
    input.discountAmount || 0,
    input.taxRate || 0.18
  );

  return {
    id: input.id || createOrderId(),
    source: input.source || 'WALK_IN',
    customerId: input.customerId || null,
    customerName: input.customerName || 'Guest',
    customerPhone: input.customerPhone || '',
    tableId: input.tableId || null,
    staffId: input.staffId || null,
    items: items.map(item => ({
      id: item.id || generateId(),
      menuItemId: item.menuItemId || generateId(),
      name: item.name,
      qty: item.qty || 1,
      price: item.price || 0,
      modifiers: item.modifiers || [],
      station: item.station || determineStation(item.name),
      notes: item.notes || ''
    })),
    subtotal,
    discountCode: input.discountCode || null,
    discountAmount,
    taxAmount,
    total,
    status: input.status || 'NEW',
    paymentStatus: input.paymentStatus || 'UNPAID',
    paymentMethod: input.paymentMethod || null,
    notes: input.notes || '',
    createdAt: input.createdAt || now(),
    updatedAt: input.updatedAt || now(),
    completedAt: input.completedAt || null
  };
}

/**
 * Determine station based on item name (simple heuristic)
 * @param {string} itemName - Item name
 * @returns {string} Station name
 */
function determineStation(itemName) {
  const name = itemName.toLowerCase();
  const barItems = ['coffee', 'cappuccino', 'latte', 'espresso', 'americano', 'mocha', 'tea', 'juice', 'smoothie', 'shake'];
  const kitchenItems = ['sandwich', 'burger', 'pizza', 'pasta', 'salad', 'soup', 'toast', 'eggs', 'pancake'];
  const dessertItems = ['cake', 'pie', 'muffin', 'cookie', 'brownie', 'ice cream', 'dessert'];

  if (barItems.some(item => name.includes(item))) return 'Bar';
  if (kitchenItems.some(item => name.includes(item))) return 'Kitchen';
  if (dessertItems.some(item => name.includes(item))) return 'Dessert';
  return 'Bar'; // Default
}

/**
 * Normalize an order to ensure it matches the schema
 * @param {object} order - Order object to normalize
 * @returns {Order} Normalized order
 */
export function normalizeOrder(order) {
  if (!order) return null;

  return {
    id: order.id || createOrderId(),
    source: ORDER_SOURCES.includes(order.source) ? order.source : 'WALK_IN',
    customerId: order.customerId || null,
    customerName: order.customerName || order.customer || 'Guest',
    customerPhone: order.customerPhone || order.phone || '',
    tableId: order.tableId || order.table || null,
    staffId: order.staffId || order.staff || null,
    items: Array.isArray(order.items) ? order.items.map(item => ({
      id: item.id || generateId(),
      menuItemId: item.menuItemId || generateId(),
      name: item.name || 'Unknown',
      qty: item.qty || item.quantity || 1,
      price: item.price || 0,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      station: STATIONS.includes(item.station) ? item.station : determineStation(item.name),
      notes: item.notes || ''
    })) : [],
    subtotal: typeof order.subtotal === 'number' ? order.subtotal : calculateSubtotal(order.items || []),
    discountCode: order.discountCode || null,
    discountAmount: typeof order.discountAmount === 'number' ? order.discountAmount : 0,
    taxAmount: typeof order.taxAmount === 'number' ? order.taxAmount : 0,
    total: typeof order.total === 'number' ? order.total : (typeof order.amount === 'number' ? order.amount : 0),
    status: ORDER_STATUSES.includes(order.status) ? order.status : 'NEW',
    paymentStatus: PAYMENT_STATUSES.includes(order.paymentStatus) ? order.paymentStatus : 
                  PAYMENT_STATUSES.includes(order.payStatus) ? order.payStatus : 'UNPAID',
    paymentMethod: PAYMENT_METHODS.includes(order.paymentMethod) ? order.paymentMethod : null,
    notes: order.notes || order.note || '',
    createdAt: toTimestamp(order.createdAt || order.time || now()),
    updatedAt: toTimestamp(order.updatedAt || now()),
    completedAt: order.completedAt || (order.status === 'COMPLETED' ? now() : null)
  };
}

/**
 * Calculate order totals (subtotal, discount, tax, total)
 * @param {Order} order - Order object
 * @returns {object} Totals object
 */
export function calculateOrderTotalsFromOrder(order) {
  const subtotal = calculateSubtotal(order.items);
  const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, order.discountAmount);
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total
  };
}

/**
 * Get display items string for order
 * @param {Order} order - Order object
 * @returns {string} Display string like "Cappuccino × 2, Croissant × 1"
 */
export function getOrderDisplayItems(order) {
  if (!order.items || !Array.isArray(order.items)) return '';
  return order.items.map(item => `${item.name} × ${item.qty}`).join(', ');
}

/**
 * Get customer name from order
 * @param {Order} order - Order object
 * @returns {string} Customer name
 */
export function getOrderCustomerName(order) {
  return order.customerName || 'Guest';
}

/**
 * Get order amount (total)
 * @param {Order} order - Order object
 * @returns {number} Order total
 */
export function getOrderAmount(order) {
  return order.total || order.amount || 0;
}

/**
 * Update order status
 * @param {Order} order - Order object
 * @param {string} nextStatus - New status
 * @returns {Order} Updated order object
 */
export function updateOrderStatus(order, nextStatus) {
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw new Error(`Invalid status: ${nextStatus}`);
  }

  const updated = {
    ...order,
    status: nextStatus,
    updatedAt: now()
  };

  if (nextStatus === 'COMPLETED') {
    updated.completedAt = now();
  }

  return updated;
}

/**
 * Check if order status can be advanced
 * @param {Order} order - Order object
 * @returns {boolean} True if status can be advanced
 */
export function canAdvanceOrderStatus(order) {
  const nextStatus = ORDER_STATUS_FLOW[order.status];
  return nextStatus !== null;
}

/**
 * Get next status for order
 * @param {Order} order - Order object
 * @returns {string|null} Next status or null if no next status
 */
export function getNextOrderStatus(order) {
  return ORDER_STATUS_FLOW[order.status] || null;
}

/**
 * Check if order is cancelled
 * @param {Order} order - Order object
 * @returns {boolean} True if cancelled
 */
export function isOrderCancelled(order) {
  return order.status === 'CANCELLED';
}

/**
 * Check if order is completed
 * @param {Order} order - Order object
 * @returns {boolean} True if completed
 */
export function isOrderCompleted(order) {
  return order.status === 'COMPLETED';
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
  return order.paymentStatus === 'PAID';
}
