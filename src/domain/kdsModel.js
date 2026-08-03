// KDS (Kitchen Display System) domain model with schema validation and helper functions

import { createKdsTicketId } from './ids.js';
import { now, toTimestamp, getMinutesElapsed } from './dates.js';

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
 * @property {string} tableId - Table ID for dine-in orders
 * @property {number} guestCount - Number of guests at table
 * @property {number} tableSeatedAt - Timestamp when table was seated
 * @property {string} assignedWaiter - ID of assigned waiter
 * @property {string} assignedWaiterName - Name of assigned waiter
 * @property {string} dietaryFlags - Dietary flags (vegan, gluten-free, etc.)
 * @property {string[]} allergenWarnings - Allergen warnings for cross-contamination
 * @property {boolean} isVip - Whether this is a VIP order
 * @property {string} wasteReason - Reason for waste logging
 * @property {number} wasteCost - Cost of wasted items
 * @property {string} equipmentId - Assigned equipment ID
 * @property {string} equipmentName - Assigned equipment name
 * @property {number} temperatureLog - Temperature reading for HACCP
 * @property {number} dangerZoneTime - Time spent in danger zone (minutes)
 * @property {string[]} haccpChecklist - HACCP compliance checklist items
 * @property {string[]} kitchenMessages - Kitchen chat messages
 * @property {boolean} audioMuted - Whether audio alerts are muted
 * @property {string} customAlertSound - Custom alert sound file path
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

// ── Internal safe helpers ────────────────────────────────────────────────────

function toSafeString(val, max = 0) {
  if (typeof val !== 'string') return '';
  const s = val.trim();
  return max > 0 ? s.slice(0, max) : s;
}

function toSafeTimestamp(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : now();
}

function toPositiveQty(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function isValidStation(station) {
  return typeof station === 'string' && KDS_STATIONS.includes(station);
}

function isValidUrgency(urgency) {
  return URGENCY_LEVELS.includes(urgency);
}

function devWarn(...args) {
  console.warn('[kdsModel]', ...args);
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate urgency based on elapsed time
 * @param {number} startedAt - Start timestamp
 * @returns {string} Urgency level
 */
export function calculateUrgencyFromTime(startedAt) {
  const n = Number(startedAt);
  if (!Number.isFinite(n) || n <= 0) return 'ok';
  let elapsed;
  try {
    elapsed = getMinutesElapsed(n);
  } catch {
    return 'ok';
  }
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'ok';
  if (elapsed >= URGENCY_THRESHOLDS.urgent) return 'urgent';
  if (elapsed >= URGENCY_THRESHOLDS.soon) return 'soon';
  return 'ok';
}

/**
 * Create a new KDS ticket from order
 * @param {object} order - Order object
 * @param {string} station - Target station
 * @returns {KdsTicket} New KDS ticket
 */
export function createKdsTicketFromOrder(order, station) {
  if (!order || typeof order !== 'object') {
    devWarn('createKdsTicketFromOrder: missing/malformed order', order);
    return null;
  }
  if (!isValidStation(station) || station === 'All') {
    devWarn('createKdsTicketFromOrder: invalid station', station);
    return null;
  }
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const stationItems = rawItems
    .filter(item => item && typeof item === 'object' && item.station === station)
    .map(item => {
      const qty = toPositiveQty(item.qty);
      const mod = Array.isArray(item.modifiers)
        ? toSafeString(item.modifiers.join(', '))
        : toSafeString(item.mod || item.modifier || '');
      return {
        name: toSafeString(item.name) || 'Item',
        qty,
        mod,
        checked: false,
        ...(item.notes !== undefined ? { notes: toSafeString(item.notes) } : {})
      };
    });

  if (stationItems.length === 0) return null;

  const startedAt = toSafeTimestamp(toTimestamp(order.createdAt || now()));

  return {
    id: createKdsTicketId(),
    orderId: order.id || '',
    source: toSafeString(order.source) || 'WALK_IN',
    station,
    items: stationItems,
    note: toSafeString(order.notes || order.note),
    startedAt,
    urgency: calculateUrgencyFromTime(startedAt),
    held: false,
    holdReason: '',
    completed: false,
    completedAt: null,
    tableId: toSafeString(order.tableId) || null,
    guestCount: Number.isFinite(Number(order.guestCount)) ? Number(order.guestCount) : null,
    tableSeatedAt: toSafeTimestamp(order.tableSeatedAt || order.createdAt),
    assignedWaiter: toSafeString(order.assignedWaiter) || null,
    assignedWaiterName: toSafeString(order.assignedWaiterName) || null,
    dietaryFlags: Array.isArray(order.dietaryFlags) ? order.dietaryFlags.join(', ') : toSafeString(order.dietaryFlags) || null,
    allergenWarnings: Array.isArray(order.allergenWarnings) ? order.allergenWarnings : [],
    isVip: Boolean(order.isVip),
    wasteReason: null,
    wasteCost: null,
    equipmentId: toSafeString(order.equipmentId) || null,
    equipmentName: toSafeString(order.equipmentName) || null,
    temperatureLog: Number.isFinite(Number(order.temperatureLog)) ? Number(order.temperatureLog) : null,
    dangerZoneTime: Number.isFinite(Number(order.dangerZoneTime)) ? Number(order.dangerZoneTime) : null,
    haccpChecklist: Array.isArray(order.haccpChecklist) ? order.haccpChecklist : [],
    kitchenMessages: Array.isArray(order.kitchenMessages) ? order.kitchenMessages : [],
    audioMuted: Boolean(order.audioMuted),
    customAlertSound: toSafeString(order.customAlertSound) || null
  };
}

/**
 * Create multiple KDS tickets from order (split by station)
 * @param {object} order - Order object
 * @returns {KdsTicket[]} Array of KDS tickets
 */
export function createKdsTicketsFromOrder(order) {
  if (!order || typeof order !== 'object') {
    devWarn('createKdsTicketsFromOrder: missing/malformed order', order);
    return [];
  }
  if (!Array.isArray(order.items)) return [];

  const seenStations = new Set();
  const tickets = [];

  order.items.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const station = item.station;
    if (!isValidStation(station) || station === 'All') return;
    if (seenStations.has(station)) return;
    seenStations.add(station);
    const ticket = createKdsTicketFromOrder(order, station);
    if (ticket) tickets.push(ticket);
  });

  return tickets;
}

/**
 * Normalize a KDS ticket to ensure it matches the schema
 * @param {object} ticket - KDS ticket object to normalize
 * @returns {KdsTicket} Normalized KDS ticket
 */
export function normalizeKdsTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('normalizeKdsTicket: malformed ticket', ticket);
    return null;
  }

  const startedAt = toSafeTimestamp(toTimestamp(ticket.startedAt || ticket.createdAt || now()));
  const validStation = isValidStation(ticket.station) && ticket.station !== 'All'
    ? ticket.station
    : 'Bar';

  const items = Array.isArray(ticket.items)
    ? ticket.items
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          name: toSafeString(item.name) || 'Item',
          qty: toPositiveQty(item.qty),
          mod: toSafeString(item.mod || item.modifier || ''),
          checked: typeof item.checked === 'boolean' ? item.checked : false,
          ...(item.notes !== undefined ? { notes: toSafeString(item.notes) } : {})
        }))
    : [];

  const completedAt = ticket.completedAt != null
    ? (Number.isFinite(Number(ticket.completedAt)) ? Number(ticket.completedAt) : null)
    : null;

  return {
    id: ticket.id || createKdsTicketId(),
    orderId: ticket.orderId || ticket.id || '',
    source: toSafeString(ticket.source) || 'WALK_IN',
    station: validStation,
    items,
    note: toSafeString(ticket.note || ticket.notes || ''),
    startedAt,
    urgency: isValidUrgency(ticket.urgency)
      ? ticket.urgency
      : calculateUrgencyFromTime(startedAt),
    held: Boolean(ticket.held),
    holdReason: toSafeString(ticket.holdReason, 200),
    completed: Boolean(ticket.completed),
    completedAt,
    tableId: toSafeString(ticket.tableId) || null,
    guestCount: Number.isFinite(Number(ticket.guestCount)) ? Number(ticket.guestCount) : null,
    tableSeatedAt: toSafeTimestamp(ticket.tableSeatedAt || ticket.startedAt || startedAt),
    assignedWaiter: toSafeString(ticket.assignedWaiter) || null,
    assignedWaiterName: toSafeString(ticket.assignedWaiterName) || null,
    dietaryFlags: Array.isArray(ticket.dietaryFlags) ? ticket.dietaryFlags.join(', ') : toSafeString(ticket.dietaryFlags) || null,
    allergenWarnings: Array.isArray(ticket.allergenWarnings) ? ticket.allergenWarnings : [],
    isVip: Boolean(ticket.isVip),
    wasteReason: toSafeString(ticket.wasteReason) || null,
    wasteCost: Number.isFinite(Number(ticket.wasteCost)) ? Number(ticket.wasteCost) : null,
    equipmentId: toSafeString(ticket.equipmentId) || null,
    equipmentName: toSafeString(ticket.equipmentName) || null,
    temperatureLog: Number.isFinite(Number(ticket.temperatureLog)) ? Number(ticket.temperatureLog) : null,
    dangerZoneTime: Number.isFinite(Number(ticket.dangerZoneTime)) ? Number(ticket.dangerZoneTime) : null,
    haccpChecklist: Array.isArray(ticket.haccpChecklist) ? ticket.haccpChecklist : [],
    kitchenMessages: Array.isArray(ticket.kitchenMessages) ? ticket.kitchenMessages : [],
    audioMuted: Boolean(ticket.audioMuted),
    customAlertSound: toSafeString(ticket.customAlertSound) || null
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
  if (!ticket || typeof ticket !== 'object') return ticket;
  if (ticket.completed) return ticket;
  if (ticket.held) return ticket;
  if (ticket.manualUrgency) return ticket;
  const newUrgency = calculateUrgencyFromTime(ticket.startedAt);
  if (newUrgency === ticket.urgency) return ticket;
  return { ...ticket, urgency: newUrgency };
}

/**
 * Put KDS ticket on hold
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {string} reason - Hold reason
 * @returns {KdsTicket} Updated KDS ticket
 */
export function holdKdsTicket(ticket, reason = '') {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('holdKdsTicket: missing ticket');
    return ticket;
  }
  if (ticket.completed) return ticket;
  return {
    ...ticket,
    held: true,
    holdReason: toSafeString(reason, 200),
    updatedAt: now()
  };
}

/**
 * Release KDS ticket from hold
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function releaseKdsTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('releaseKdsTicket: missing ticket');
    return ticket;
  }
  return {
    ...ticket,
    held: false,
    holdReason: '',
    updatedAt: now()
  };
}

/**
 * Mark KDS ticket as started
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function startKdsTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('startKdsTicket: missing ticket');
    return ticket;
  }
  if (ticket.completed) return ticket;
  if (ticket.startedAt && Number.isFinite(Number(ticket.startedAt))) return ticket;
  return {
    ...ticket,
    startedAt: toSafeTimestamp(toTimestamp(now())),
    updatedAt: now()
  };
}

/**
 * Mark KDS ticket as completed
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function completeKdsTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('completeKdsTicket: missing ticket');
    return ticket;
  }
  if (ticket.completed) return ticket;
  const completedAt = toSafeTimestamp(toTimestamp(now()));
  return {
    ...ticket,
    completed: true,
    completedAt,
    updatedAt: completedAt,
    items: Array.isArray(ticket.items)
      ? ticket.items.map(item => ({ ...item, checked: true }))
      : []
  };
}

/**
 * Move KDS ticket to a different station
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {string} newStation - New station
 * @returns {KdsTicket} Updated KDS ticket
 */
export function moveKdsTicketToStation(ticket, newStation) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('moveKdsTicketToStation: missing ticket');
    return ticket;
  }
  if (!isValidStation(newStation) || newStation === 'All') {
    devWarn('moveKdsTicketToStation: invalid station', newStation);
    throw new Error(`Invalid station: ${newStation}`);
  }
  if (ticket.completed) return ticket;
  if (ticket.station === newStation) return ticket;
  return {
    ...ticket,
    station: newStation,
    updatedAt: now()
  };
}

/**
 * Bump KDS ticket (remove from display, mark as completed)
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {KdsTicket} Updated KDS ticket
 */
export function bumpKdsTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('bumpKdsTicket: missing ticket');
    return ticket;
  }
  if (ticket.completed) return ticket;
  const ts = now();
  return completeKdsTicket({
    ...ticket,
    bumpCount: (Number.isFinite(ticket.bumpCount) ? ticket.bumpCount : 0) + 1,
    bumpedAt: ts
  });
}

/**
 * Mark KDS item as checked/unchecked
 * @param {KdsTicket} ticket - KDS ticket object
 * @param {number} itemIndex - Item index
 * @param {boolean} checked - Checked status
 * @returns {KdsTicket} Updated KDS ticket
 */
export function toggleKdsItemCheck(ticket, itemIndex, checked) {
  if (!ticket || typeof ticket !== 'object') {
    devWarn('toggleKdsItemCheck: missing ticket');
    return ticket;
  }
  if (ticket.completed) return ticket;
  if (!Array.isArray(ticket.items)) {
    devWarn('toggleKdsItemCheck: ticket.items is not an array');
    return ticket;
  }
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= ticket.items.length) {
    devWarn('toggleKdsItemCheck: invalid item index', itemIndex);
    return ticket;
  }
  const updatedItems = ticket.items.map((item, i) =>
    i === itemIndex ? { ...item, checked: typeof checked === 'boolean' ? checked : !item.checked } : item
  );
  return { ...ticket, items: updatedItems, updatedAt: now() };
}

/**
 * Check if all items in KDS ticket are completed
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {boolean} True if all items checked
 */
export function areAllItemsChecked(ticket) {
  if (!ticket || !Array.isArray(ticket.items) || ticket.items.length === 0) return true;
  return ticket.items.every(item => item.checked);
}

/**
 * Get count of checked items
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {number} Count of checked items
 */
export function getCheckedItemCount(ticket) {
  if (!ticket || !Array.isArray(ticket.items)) return 0;
  return ticket.items.filter(item => item.checked).length;
}

/**
 * Calculate KDS ticket progress percentage
 * @param {KdsTicket} ticket - KDS ticket object
 * @returns {number} Progress percentage (0-100)
 */
export function getKdsProgress(ticket) {
  if (!ticket || !Array.isArray(ticket.items) || ticket.items.length === 0) return 100;
  const checkedCount = getCheckedItemCount(ticket);
  return Math.round((checkedCount / ticket.items.length) * 100);
}

/**
 * Get elapsed minutes since ticket was started.
 * Returns 0 for completed or invalid tickets.
 * Convenience wrapper so callers don't need to import from dates.js.
 * @param {KdsTicket} ticket
 * @returns {number} Whole minutes elapsed
 */
export function getKdsElapsedMinutes(ticket) {
  if (!ticket || ticket.completed) return 0;
  const n = Number(ticket.startedAt);
  if (!Number.isFinite(n) || n <= 0) return 0;
  try {
    const elapsed = getMinutesElapsed(n);
    return Number.isFinite(elapsed) && elapsed >= 0 ? Math.floor(elapsed) : 0;
  } catch {
    return 0;
  }
}

/**
 * Check if all KDS tickets for an order are completed
 * @param {string} orderId - Order ID
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {boolean} True if all tickets for order are completed
 */
export function areAllOrderTicketsCompleted(orderId, tickets) {
  if (!orderId || !Array.isArray(tickets)) return false;
  const orderTickets = tickets.filter(
    t => t && typeof t === 'object' && t.orderId === orderId
  );
  if (orderTickets.length === 0) return false;
  return orderTickets.every(t => t.completed);
}

/**
 * Cancel all KDS tickets for an order
 * @param {string} orderId - Order ID
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Updated tickets (cancelled tickets removed)
 */
export function cancelOrderTickets(orderId, tickets) {
  if (!orderId || !Array.isArray(tickets)) return Array.isArray(tickets) ? tickets : [];
  return tickets.filter(t => !t || typeof t !== 'object' || t.orderId !== orderId);
}

/**
 * Get tickets filtered by station.
 * By default excludes completed tickets; pass includeCompleted=true for recall/history views.
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @param {string} station - Station filter ('All' for all stations)
 * @param {boolean} [includeCompleted=false]
 * @returns {KdsTicket[]} Filtered tickets
 */
export function getTicketsByStation(tickets, station, includeCompleted = false) {
  if (!Array.isArray(tickets)) return [];
  const safeTickets = tickets.filter(t => t && typeof t === 'object');
  const byStation = (station === 'All' || !station)
    ? safeTickets
    : safeTickets.filter(t => t.station === station);
  return includeCompleted ? byStation : byStation.filter(t => !t.completed);
}

/**
 * Get active tickets (not completed, not held)
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Active tickets
 */
export function getActiveTickets(tickets) {
  if (!Array.isArray(tickets)) return [];
  return tickets.filter(t => t && typeof t === 'object' && !t.completed && !t.held);
}

/**
 * Get held tickets
 * @param {KdsTicket[]} tickets - All KDS tickets
 * @returns {KdsTicket[]} Held tickets
 */
export function getHeldTickets(tickets) {
  if (!Array.isArray(tickets)) return [];
  return tickets.filter(t => t && typeof t === 'object' && t.held && !t.completed);
}
