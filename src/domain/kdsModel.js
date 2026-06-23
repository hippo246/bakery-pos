// KDS (Kitchen Display System) domain model with schema validation and helper functions

import { generateId, createKdsTicketId } from './ids.js';
import { now, toTimestamp, getMinutesElapsed } from './dates.js';
import { STATIONS } from './orderModel.js';

/**
 * Standard KDS Ticket schema
 * @typedef {Object} KdsTicket
 * @property {string} id - Unique KDS ticket identifier
 * @property {string} orderId - Associated order ID
 * @property {string} source - Order source
 * @property {"Bar"|"Kitchen"|"Packaging"|"Dessert"} station - Preparation station
 * @property {KdsItem[]} items - Ticket items
 * @property {string} note - Ticket notes
 * @property {number} startedAt - Start timestamp
 * @property {"ok"|"soon"|"urgent"} urgency - Urgency level
 * @property {boolean} held - Whether ticket is on hold
 * @property {string} holdReason - Reason for hold
 * @property {boolean} completed - Whether ticket is completed
 * @property {number} completedAt - Completion timestamp
 */

/**
 * @typedef {Object} KdsItem
 * @property {string} name - Item name
 * @property {number} qty - Quantity
 * @property {string} mod - Modifier
 * @property {boolean} checked - Whether item is completed
 */

// Valid urgency levels
export const URGENCY_LEVELS = ['ok', 'soon', 'urgent'];

// Urgency thresholds (in minutes)
export const URGENCY_THRESHOLDS = {
  soon: 10,  // After 10 minutes, urgency becomes "soon"
  urgent: 20 // After 20 minutes, urgency becomes "urgent"
};

// Valid stations
export const KDS_STATIONS = ['All', 'Bar', 'Kitchen', 'Packaging', 'Dessert'];

/**
 * Calculate urgency based on elapsed time
 * @param {number} startedAt - Start timestamp
 * @returns {string} Urgency level
 */
export function calculateUrgencyFromTime(startedAt) {
  const elapsed = getMinutesElapsed(startedAt);
  
  if (elapsed >= URGENCY_THRESHOLDS.urgent) {
    return 'urgent';
  } else if (elapsed >= URGENCY_THRESHOLDS.soon) {
    return 'soon';
  }
  return 'ok';
}

/**
 * Create a new KDS ticket from order
 * @param {object} order - Order object
 * @param {string} station - Target station
 * @returns {KdsTicket} New KDS ticket
 */
export function createKdsTicketFromOrder(order, station) {
  if (!order || !order.items) return null;

  // Filter items by station
  const stationItems = order.items.filter(item => item.station === station);
  if (stationItems.length === 0) return null;

  return {
    id: createKdsTicketId(),
    orderId: order.id,
    source: order.source || 'WALK_IN',
    station,
    items: stationItems.map(item => ({
      name: item.name,
      qty: item.qty,
      mod: item.modifiers ? item.modifiers.join(', ') : '',
      checked: false
    })),
    note: order.notes || '',
    startedAt: toTimestamp(order.createdAt || now()),
    urgency: calculateUrgencyFromTime(toTimestamp(order.createdAt || now())),
    held: false,
    holdReason: '',
    completed: false,
    completedAt: null
  };
}

/**
 * Create multiple KDS tickets from order (split by station)
 * @param {object} order - Order object
 * @returns {KdsTicket[]} Array of KDS tickets
 */
export function createKdsTicketsFromOrder(order) {
  if (!order || !order.items) return [];

  const tickets = [];
  const stations = [...new Set(order.items.map(item => item.station))];

  stations.forEach(station => {
    const ticket = createKdsTicketFromOrder(order, station);
    if (ticket) {
      tickets.push(ticket);
    }
  });

  return tickets;
}

/**
 * Normalize a KDS ticket to ensure it matches the schema
 * @param {object} ticket - KDS ticket object to normalize
 * @returns {KdsTicket} Normalized KDS ticket
 */
export function normalizeKdsTicket(ticket) {
  if (!ticket) return null;

  const startedAt = toTimestamp(ticket.startedAt || ticket.createdAt || now());
  
  return {
    id: ticket.id || createKdsTicketId(),
    orderId: ticket.orderId || ticket.id,
    source: ticket.source || 'WALK_IN',
    station: STATIONS.includes(ticket.station) ? ticket.station : 'Bar',
    items: Array.isArray(ticket.items) ? ticket.items.map(item => ({
      name: item.name || 'Unknown',
      qty: item.qty || 1,
      mod: item.mod || item.modifier || '',
      checked: typeof item.checked === 'boolean' ? item.checked : false
    })) : [],
    note: ticket.note || ticket.notes || '',
    startedAt,
    urgency: URGENCY_LEVELS.includes(ticket.urgency) ? ticket.urgency : 
              calculateUrgencyFromTime(startedAt),
    held: Boolean(ticket.held),
    holdReason: ticket.holdReason || '',
    completed: Boolean(ticket.completed),
    completedAt: ticket.completedAt || null
  };
}

/**
 * Update KDS ticket urgency (manual override)
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {string} newUrgency - New urgency level
 * @returns {KdsTicket} Updated KDS ticket
 */
export function updateKdsUrgency(ticket, newUrgency) {
  if (!URGENCY_LEVELS.includes(newUrgency)) {
    throw new Error(`Invalid urgency: ${newUrgency}`);
  }

  return {
    ...ticket,
    urgency: newUrgency
  };
}

/**
 * Recalculate urgency based on elapsed time
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function recalculateUrgency(ticket) {
  return {
    ...ticket,
    urgency: calculateUrgencyFromTime(ticket.startedAt)
  };
}

/**
 * Put KDS ticket on hold
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {string} reason - Hold reason
 * @returns {KdsTicket} Updated KDS ticket
 */
export function holdKdsTicket(ticket, reason = '') {
  return {
    ...ticket,
    held: true,
    holdReason: reason
  };
}

/**
 * Release KDS ticket from hold
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function releaseKdsTicket(ticket) {
  return {
    ...ticket,
    held: false,
    holdReason: ''
  };
}

/**
 * Mark KDS ticket as started
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function startKdsTicket(ticket) {
  return {
    ...ticket,
    startedAt: toTimestamp(now())
  };
}

/**
 * Mark KDS ticket as completed
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function completeKdsTicket(ticket) {
  return {
    ...ticket,
    completed: true,
    completedAt: toTimestamp(now()),
    items: ticket.items.map(item => ({ ...item, checked: true }))
  };
}

/**
 * Move KDS ticket to a different station
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {string} newStation - New station
 * @returns {KdsTicket} Updated KDS ticket
 */
export function moveKdsTicketToStation(ticket, newStation) {
  if (!STATIONS.includes(newStation)) {
    throw new Error(`Invalid station: ${newStation}`);
  }

  return {
    ...ticket,
    station: newStation
  };
}

/**
 * Bump KDS ticket (remove from display, mark as completed)
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function bumpKdsTicket(ticket) {
  return completeKdsTicket(ticket);
}

/**
 * Mark KDS item as checked/unchecked
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {number} itemIndex - Item index
 * @param {boolean} checked - Checked status
 * @returns {KdsTicket} Updated KDS ticket
 */
export function toggleKdsItemCheck(ticket, itemIndex, checked) {
  if (!ticket.items || !ticket.items[itemIndex]) return ticket;

  const updatedItems = [...ticket.items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    checked
  };

  return {
    ...ticket,
    items: updatedItems
  };
}

/**
 * Check if all items in KDS ticket are completed
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {boolean} True if all items checked
 */
export function areAllItemsChecked(ticket) {
  if (!ticket.items || ticket.items.length === 0) return true;
  return ticket.items.every(item => item.checked);
}

/**
 * Get count of checked items
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {number} Count of checked items
 */
export function getCheckedItemCount(ticket) {
  if (!ticket.items) return 0;
  return ticket.items.filter(item => item.checked).length;
}

/**
 * Calculate KDS ticket progress percentage
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {number} Progress percentage (0-100)
 */
export function getKdsProgress(ticket) {
  if (!ticket.items || ticket.items.length === 0) return 100;
  const checkedCount = getCheckedItemCount(ticket);
  return Math.round((checkedCount / ticket.items.length) * 100);
}

/**
 * Check if all KDS tickets for an order are completed
 * @param {string} orderId - Order ID
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {boolean} True if all tickets for order are completed
 */
export function areAllOrderTicketsCompleted(orderId, tickets) {
  const orderTickets = tickets.filter(t => t.orderId === orderId);
  if (orderTickets.length === 0) return true;
  return orderTickets.every(t => t.completed);
}

/**
 * Cancel all KDS tickets for an order
 * @param {string} orderId - Order ID
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Updated tickets (cancelled tickets removed)
 */
export function cancelOrderTickets(orderId, tickets) {
  return tickets.filter(t => t.orderId !== orderId);
}

/**
 * Get tickets filtered by station
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @param {string} station - Station filter ('All' for all stations)
 * @returns {KdsTicket[]} Filtered tickets
 */
export function getTicketsByStation(tickets, station) {
  if (station === 'All' || !station) {
    return tickets.filter(t => !t.completed);
  }
  return tickets.filter(t => t.station === station && !t.completed);
}

/**
 * Get active tickets (not completed, not held)
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Active tickets
 */
export function getActiveTickets(tickets) {
  return tickets.filter(t => !t.completed && !t.held);
}

/**
 * Get held tickets
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Held tickets
 */
export function getHeldTickets(tickets) {
  return tickets.filter(t => t.held && !t.completed);
}
