// Table domain model with lifecycle helpers

import { generateId, createTableId } from './ids.js';
import { now, toTimestamp } from './dates.js';

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

/**
 * Create a new table
 * @param {object} input - Table input data
 * @returns {Table} New table object
 */
export function createTable(input = {}) {
  return {
    id: input.id || createTableId(),
    number: input.number || '1',
    capacity: input.capacity || 4,
    status: input.status || 'available',
    currentOrderId: input.currentOrderId || null,
    customerId: input.customerId || null,
    occupiedSince: input.occupiedSince || null,
    notes: input.notes || ''
  };
}

/**
 * Normalize a table to ensure it matches the schema
 * @param {object} table - Table object to normalize
 * @returns {Table} Normalized table
 */
export function normalizeTable(table) {
  if (!table) return null;

  return {
    id: table.id || createTableId(),
    number: table.number || table.tableNumber || '1',
    capacity: typeof table.capacity === 'number' ? table.capacity : 4,
    status: TABLE_STATUSES.includes(table.status) ? table.status : 'available',
    currentOrderId: table.currentOrderId || table.orderId || null,
    customerId: table.customerId || null,
    occupiedSince: toTimestamp(table.occupiedSince || table.occupiedAt || null),
    notes: table.notes || ''
  };
}

/**
 * Assign order to table
 * @param {Table} table - Table object
 * @param {string} orderId - Order ID
 * @returns {Table} Updated table
 */
export function assignOrderToTable(table, orderId) {
  if (!table || !orderId) return table;

  return {
    ...table,
    status: 'occupied',
    currentOrderId: orderId,
    occupiedSince: now()
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
  if (!table) return table;

  return {
    ...table,
    status: 'cleaning',
    currentOrderId: null,
    occupiedSince: null
  };
}

/**
 * Mark table as available
 * @param {Table} table - Table object
 * @returns {Table} Updated table
 */
export function markTableAvailable(table) {
  if (!table) return table;

  return {
    ...table,
    status: 'available',
    currentOrderId: null,
    customerId: null,
    occupiedSince: null
  };
}

/**
 * Mark table as reserved
 * @param {Table} table - Table object
 * @param {string} customerId - Customer ID
 * @returns {Table} Updated table
 */
export function markTableReserved(table, customerId) {
  if (!table || !customerId) return table;

  return {
    ...table,
    status: 'reserved',
    customerId
  };
}

/**
 * Get table occupancy duration in minutes
 * @param {Table} table - Table object
 * @returns {number} Duration in minutes, or 0 if not occupied
 */
export function getOccupancyDuration(table) {
  if (!table || !table.occupiedSince || table.status !== 'occupied') return 0;
  return Math.floor((now() - table.occupiedSince) / 60000);
}

/**
 * Check if table is available
 * @param {Table} table - Table object
 * @returns {boolean} True if available
 */
export function isTableAvailable(table) {
  return table.status === 'available';
}

/**
 * Check if table is occupied
 * @param {Table} table - Table object
 * @returns {boolean} True if occupied
 */
export function isTableOccupied(table) {
  return table.status === 'occupied';
}

/**
 * Check if table needs cleaning
 * @param {Table} table - Table object
 * @returns {boolean} True if cleaning
 */
export function isTableCleaning(table) {
  return table.status === 'cleaning';
}

/**
 * Check if table is reserved
 * @param {Table} table - Table object
 * @returns {boolean} True if reserved
 */
export function isTableReserved(table) {
  return table.status === 'reserved';
}

/**
 * Get available tables
 * @param {Table[]} tables - Array of tables
 * @returns {Table[]} Available tables
 */
export function getAvailableTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables.filter(table => isTableAvailable(table));
}

/**
 * Get occupied tables
 * @param {Table[]} tables - Array of tables
 * @returns {Table[]} Occupied tables
 */
export function getOccupiedTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables.filter(table => isTableOccupied(table));
}

/**
 * Find table by number
 * @param {Table[]} tables - Array of tables
 * @param {string} number - Table number
 * @returns {Table|null} Found table or null
 */
export function findTableByNumber(tables, number) {
  if (!Array.isArray(tables)) return null;
  return tables.find(table => table.number === number) || null;
}

/**
 * Find table by order ID
 * @param {Table[]} tables - Array of tables
 * @param {string} orderId - Order ID
 * @returns {Table|null} Found table or null
 */
export function findTableByOrderId(tables, orderId) {
  if (!Array.isArray(tables)) return null;
  return tables.find(table => table.currentOrderId === orderId) || null;
}
