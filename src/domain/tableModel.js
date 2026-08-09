// Table domain model with lifecycle helpers

import { generateId, createTableId } from './ids.js';
import { now } from './dates.js';

/**
 * Standard Table schema
 * @typedef {Object} Table
 * @property {string} id - Unique table identifier
 * @property {string} number - Table number
 * @property {number} capacity - Seating capacity
 * @property {"available"|"occupied"|"cleaning"|"reserved"} status - Table status
 * @property {string|null} currentOrderId - Current order ID if occupied
 * @property {string|null} customerId - Customer ID if reserved
 * @property {number} occupiedSince - Timestamp when table was occupied
 * @property {string} notes - Table notes
 */

// Valid table statuses
export const TABLE_STATUSES = ['available', 'occupied', 'cleaning', 'reserved'];

// ── Internal safe helpers ────────────────────────────────────────────────────

function devWarn(...args) {
  console.warn('[tableModel]', ...args);
}

function toSafeString(val) {
  return typeof val === 'string' ? val.trim() : '';
}

// Like toSafeString, but for id/number fields specifically: these commonly arrive as
// numbers (e.g. seed data with `id: 1`), and toSafeString would blank those out entirely,
// forcing a fresh random id to be generated on every normalize call — which breaks id
// stability across anything that writes/reads tables outside this normalizer (e.g. the
// guest ordering page, which never runs tables through normalizeTable at all).
function toSafeIdentifier(val) {
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  return '';
}

function toSafeCapacity(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) {
    devWarn('invalid capacity', val);
    return 4;
  }
  return Math.floor(n);
}

function toSafeStatus(val) {
  if (TABLE_STATUSES.includes(val)) return val;
  devWarn('invalid table status', val);
  return 'available';
}

function toSafeNullableTimestamp(val) {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toSafeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(e => e && typeof e === 'object')
    .map(e => ({
      id: toSafeString(e.id) || generateId(),
      type: toSafeString(e.type) || 'event',
      message: toSafeString(e.message),
      createdAt: toSafeNullableTimestamp(e.createdAt) ?? now(),
      ...(e.details !== undefined ? { details: e.details } : {})
    }))
    .slice(0, 50);
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a new table
 * @param {object} input - Table input data
 * @returns {Table} New table object
 */
export function createTable(input = {}) {
  const safe = (input && typeof input === 'object') ? input : {};
  return {
    id: toSafeIdentifier(safe.id) || createTableId(),
    number: toSafeIdentifier(safe.number ?? safe.tableNumber) || '1',
    capacity: toSafeCapacity(safe.capacity),
    status: toSafeStatus(safe.status),
    currentOrderId: toSafeString(safe.currentOrderId || safe.orderId) || null,
    customerId: toSafeString(safe.customerId) || null,
    occupiedSince: toSafeNullableTimestamp(safe.occupiedSince || safe.occupiedAt),
    notes: toSafeString(safe.notes),
    // optional extended fields – only included when provided
    ...(safe.type !== undefined     ? { type: toSafeString(safe.type) } : {}),
    ...(safe.area !== undefined     ? { area: toSafeString(safe.area) } : {}),
    ...(safe.waiterId !== undefined ? { waiterId: toSafeString(safe.waiterId) } : {}),
    ...(safe.reservedFor !== undefined  ? { reservedFor: toSafeString(safe.reservedFor) } : {}),
    ...(safe.reservedTime !== undefined ? { reservedTime: toSafeNullableTimestamp(safe.reservedTime) } : {}),
    ...(safe.reservation !== undefined  ? { reservation: safe.reservation ?? null } : {}),
    ...(safe.mergedTableIds !== undefined
      ? { mergedTableIds: Array.isArray(safe.mergedTableIds) ? [...new Set(safe.mergedTableIds.filter(Boolean))] : [] }
      : {}),
    ...(safe.cleaningStartedAt !== undefined
      ? { cleaningStartedAt: toSafeNullableTimestamp(safe.cleaningStartedAt) }
      : {}),
    ...(safe.history !== undefined ? { history: toSafeHistory(safe.history) } : {}),
    createdAt: toSafeNullableTimestamp(safe.createdAt) ?? now(),
    updatedAt: toSafeNullableTimestamp(safe.updatedAt) ?? now()
  };
}

/**
 * Normalize a table to ensure it matches the schema
 * @param {object} table - Table object to normalize
 * @returns {Table} Normalized table
 */
export function normalizeTable(table) {
  if (!table || typeof table !== 'object') {
    devWarn('normalizeTable: malformed table', table);
    return null;
  }

  // Support both currentOrder (object) and currentOrderId (string)
  const currentOrderId =
    toSafeString(table.currentOrderId || table.orderId ||
      (table.currentOrder && typeof table.currentOrder === 'object' ? table.currentOrder.id : table.currentOrder)
    ) || null;

  return {
    id: toSafeIdentifier(table.id) || createTableId(),
    number: toSafeIdentifier(table.number ?? table.tableNumber) || '1',
    capacity: toSafeCapacity(table.capacity),
    status: toSafeStatus(table.status),
    currentOrderId,
    customerId: toSafeString(table.customerId) || null,
    occupiedSince: toSafeNullableTimestamp(table.occupiedSince || table.occupiedAt),
    notes: toSafeString(table.notes),
    // optional fields – preserve when present
    ...(table.type !== undefined     ? { type: toSafeString(table.type) } : {}),
    ...(table.area !== undefined     ? { area: toSafeString(table.area) } : {}),
    ...(table.waiterId !== undefined ? { waiterId: toSafeString(table.waiterId) } : {}),
    ...(table.reservedFor !== undefined  ? { reservedFor: toSafeString(table.reservedFor) } : {}),
    ...(table.reservedTime !== undefined ? { reservedTime: toSafeNullableTimestamp(table.reservedTime) } : {}),
    ...(table.reservation !== undefined  ? { reservation: table.reservation ?? null } : {}),
    ...(table.mergedTableIds !== undefined
      ? { mergedTableIds: Array.isArray(table.mergedTableIds) ? [...new Set(table.mergedTableIds.filter(Boolean))] : [] }
      : {}),
    ...(table.cleaningStartedAt !== undefined
      ? { cleaningStartedAt: toSafeNullableTimestamp(table.cleaningStartedAt) }
      : {}),
    ...(table.history !== undefined ? { history: toSafeHistory(table.history) } : {}),
    // floor plan fields – preserve for visual rendering
    ...(table.shape !== undefined ? { shape: toSafeString(table.shape) } : {}),
    ...(table.rotation !== undefined ? { rotation: Number(table.rotation) || 0 } : {}),
    ...(table.layer !== undefined ? { layer: Number(table.layer) || 0 } : {}),
    ...(table.visible !== undefined ? { visible: Boolean(table.visible) } : {}),
    ...(table.position !== undefined && typeof table.position === 'object'
      ? { position: { x: Number(table.position.x) || 0, y: Number(table.position.y) || 0 } }
      : {}),
    ...(table.dimensions !== undefined && typeof table.dimensions === 'object'
      ? { dimensions: { width: Number(table.dimensions.width) || 80, height: Number(table.dimensions.height) || 60 } }
      : {}),
    // waiter assignment object (full object, not just id)
    ...(table.waiter !== undefined && typeof table.waiter === 'object'
      ? { waiter: table.waiter }
      : {}),
    // reservation fields
    ...(table.reservedDate !== undefined ? { reservedDate: toSafeString(table.reservedDate) } : {}),
    ...(table.reservedPhone !== undefined ? { reservedPhone: toSafeString(table.reservedPhone) } : {}),
    ...(table.reservedPartySize !== undefined ? { reservedPartySize: Number(table.reservedPartySize) || null } : {}),
    ...(table.reservedNotes !== undefined ? { reservedNotes: toSafeString(table.reservedNotes) } : {}),
    // group/merge fields
    ...(table.groupId !== undefined ? { groupId: toSafeString(table.groupId) } : {}),
    ...(table.groupMembers !== undefined && Array.isArray(table.groupMembers)
      ? { groupMembers: table.groupMembers }
      : {}),
    ...(table.groupHost !== undefined ? { groupHost: toSafeString(table.groupHost) } : {}),
    ...(table.mergedCapacity !== undefined ? { mergedCapacity: Number(table.mergedCapacity) || null } : {}),
    createdAt: toSafeNullableTimestamp(table.createdAt) ?? now(),
    updatedAt: toSafeNullableTimestamp(table.updatedAt) ?? now()
  };
}

/**
 * Assign order to table
 * @param {Table} table - Table object
 * @param {string} orderId - Order ID
 * @returns {Table} Updated table
 */
export function assignOrderToTable(table, orderId) {
  if (!table || typeof table !== 'object') return table;
  if (!orderId) return table;
  const ts = now();
  return {
    ...table,
    status: 'occupied',
    currentOrderId: toSafeString(orderId) || null,
    occupiedSince: ts,
    updatedAt: ts
  };
}

/**
 * Mark table as occupied
 * @param {Table} table - Table object
 * @param {string} orderId - Order ID
 * @returns {Table} Updated table
 */
export function markTableOccupied(table, orderId) {
  return assignOrderToTable(table, orderId);
}

/**
 * Mark table as cleaning
 * @param {Table} table - Table object
 * @returns {Table} Updated table
 */
export function markTableCleaning(table) {
  if (!table || typeof table !== 'object') return table;
  const ts = now();
   
  const { currentOrder: _drop, ...rest } = table;
  return {
    ...rest,
    status: 'cleaning',
    currentOrderId: null,
    occupiedSince: null,
    cleaningStartedAt: ts,
    updatedAt: ts
  };
}

/**
 * Mark table as available
 * @param {Table} table - Table object
 * @returns {Table} Updated table
 */
export function markTableAvailable(table) {
  if (!table || typeof table !== 'object') return table;
  // Drop optional keys entirely rather than leaving them as undefined
   
  const { currentOrder: _a, reservedFor: _b, reservedTime: _c, reservation: _d, ...rest } = table;
  return {
    ...rest,
    status: 'available',
    currentOrderId: null,
    customerId: null,
    occupiedSince: null,
    cleaningStartedAt: null,
    updatedAt: now()
  };
}

/**
 * Mark table as reserved
 * @param {Table} table - Table object
 * @param {string} customerId - Customer ID
 * @returns {Table} Updated table
 */
export function markTableReserved(table, customerId, reservationInfo = {}) {
  if (!table || typeof table !== 'object') return table;
  if (!customerId) {
    devWarn('markTableReserved: customerId missing');
    return table;
  }
  const safe = (reservationInfo && typeof reservationInfo === 'object') ? reservationInfo : {};
  return {
    ...table,
    status: 'reserved',
    customerId: toSafeString(customerId) || null,
    ...(safe.reservedFor !== undefined  ? { reservedFor: toSafeString(safe.reservedFor) } : {}),
    ...(safe.reservedTime !== undefined ? { reservedTime: toSafeNullableTimestamp(safe.reservedTime) } : {}),
    ...(safe.reservation !== undefined  ? { reservation: safe.reservation ?? null } : {}),
    updatedAt: now()
  };
}

/**
 * Get table occupancy duration in minutes
 * @param {Table} table - Table object
 * @returns {number} Duration in minutes, or 0 if not occupied
 */
export function getOccupancyDuration(table) {
  if (!table || table.status !== 'occupied') return 0;
  const since = toSafeNullableTimestamp(table.occupiedSince);
  if (since === null) return 0;
  const diff = now() - since;
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.floor(diff / 60000);
}

/**
 * Get cleaning duration in minutes
 * @param {Table} table - Table object
 * @returns {number} Duration in minutes, or 0
 */
export function getCleaningDuration(table) {
  if (!table || table.status !== 'cleaning') return 0;
  const since = toSafeNullableTimestamp(table.cleaningStartedAt);
  if (since === null) return 0;
  const diff = now() - since;
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.floor(diff / 60000);
}

/**
 * Append a history event to a table (immutable, newest first, max 50)
 * @param {Table} table
 * @param {{ type: string, message: string, details?: any }} event
 * @returns {Table}
 */
export function appendTableHistoryEvent(table, event) {
  if (!table || typeof table !== 'object') return table;
  const safe = (event && typeof event === 'object') ? event : {};
  const entry = {
    id: generateId(),
    type: toSafeString(safe.type) || 'event',
    message: toSafeString(safe.message),
    createdAt: now(),
    ...(safe.details !== undefined ? { details: safe.details } : {})
  };
  const existing = Array.isArray(table.history) ? table.history : [];
  return {
    ...table,
    history: [entry, ...existing].slice(0, 50),
    updatedAt: now()
  };
}

/**
 * Check if table is available
 * @param {Table} table - Table object
 * @returns {boolean} True if available
 */
export function isTableAvailable(table) {
  return !!table && table.status === 'available';
}

/**
 * Check if table is occupied
 */
export function isTableOccupied(table) {
  return !!table && table.status === 'occupied';
}

/**
 * Check if table needs cleaning
 */
export function isTableCleaning(table) {
  return !!table && table.status === 'cleaning';
}

/**
 * Check if table is reserved
 */
export function isTableReserved(table) {
  return !!table && table.status === 'reserved';
}

/**
 * Check if a table can be reserved (available or reserved with no conflict)
 */
export function canReserveTable(table) {
  if (!table || typeof table !== 'object') return false;
  return table.status === 'available';
}

/**
 * Check if two reservation time windows conflict (within toleranceMinutes)
 * @param {number} existingTime - Existing reservation timestamp
 * @param {number} newTime - Proposed reservation timestamp
 * @param {number} toleranceMinutes - Conflict window (default 60)
 * @returns {boolean}
 */
export function hasReservationConflict(existingTime, newTime, toleranceMinutes = 60) {
  const a = toSafeNullableTimestamp(existingTime);
  const b = toSafeNullableTimestamp(newTime);
  if (a === null || b === null) return false;
  const diffMin = Math.abs(a - b) / 60000;
  return Number.isFinite(diffMin) && diffMin < toleranceMinutes;
}

/**
 * Get available tables
 * @param {Table[]} tables - Array of tables
 * @returns {Table[]} Available tables
 */
export function getAvailableTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables.filter(table => table && typeof table === 'object' && isTableAvailable(table));
}

/**
 * Get occupied tables
 * @param {Table[]} tables - Array of tables
 * @returns {Table[]} Occupied tables
 */
export function getOccupiedTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables.filter(table => table && typeof table === 'object' && isTableOccupied(table));
}

/**
 * Find table by number. Coerces both sides to string so numeric IDs still match.
 * @param {Table[]} tables - Array of tables
 * @param {string|number} number - Table number
 * @returns {Table|null} Found table or null
 */
export function findTableByNumber(tables, number) {
  if (!Array.isArray(tables) || number == null) return null;
  const target = String(number);
  return tables.find(t => t && String(t.number) === target) || null;
}

/**
 * Get turnover time: minutes from when the table was first occupied
 * to when cleaning started. Returns null if either timestamp is missing.
 * Useful for tracking average dine time and table throughput.
 * @param {Table} table
 * @returns {number|null} Minutes, or null if insufficient data
 */
export function getTableTurnoverTime(table) {
  if (!table) return null;
  const occupied = toSafeNullableTimestamp(table.occupiedSince);
  const cleaning = toSafeNullableTimestamp(table.cleaningStartedAt);
  if (occupied === null || cleaning === null) return null;
  const diff = cleaning - occupied;
  if (!Number.isFinite(diff) || diff < 0) return null;
  return Math.floor(diff / 60000);
}

/**
 * Find table by order ID
 * @param {Table[]} tables - Array of tables
 * @param {string} orderId - Order ID
 * @returns {Table|null} Found table or null
 */
export function findTableByOrderId(tables, orderId) {
  if (!Array.isArray(tables) || !orderId) return null;
  return tables.find(t => t && (t.currentOrderId === orderId ||
    (t.currentOrder && typeof t.currentOrder === 'object' && t.currentOrder.id === orderId))
  ) || null;
}
