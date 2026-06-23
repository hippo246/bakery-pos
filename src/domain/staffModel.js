// Staff domain model with schema validation and helper functions

import { generateId, createStaffId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * Standard Staff schema
 * @typedef {Object} Staff
 * @property {string} id - Unique staff identifier
 * @property {string} name - Staff name
 * @property {string} phone - Staff phone number
 * @property {string} email - Staff email
 * @property {"barista"|"kitchen"|"server"|"manager"|"cleaner"} role - Staff role
 * @property {"active"|"inactive"|"on_leave"} status - Staff status
 * @property {number} rating - Staff rating (1-5)
 * @property {number} ordersHandled - Total orders handled
 * @property {number} ordersCompleted - Total orders completed
 * @property {number} avgPrepTime - Average preparation time in minutes
 * @property {number} efficiency - Efficiency score (0-100)
 * @property {string} notes - Staff notes
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

// Valid staff roles
export const STAFF_ROLES = ['barista', 'kitchen', 'server', 'manager', 'cleaner'];

// Valid staff statuses
export const STAFF_STATUSES = ['active', 'inactive', 'on_leave'];

/**
 * Create a new staff member
 * @param {object} input - Staff input data
 * @returns {Staff} New staff object
 */
export function createStaff(input = {}) {
  return {
    id: input.id || createStaffId(),
    name: input.name || 'Unknown',
    phone: input.phone || '',
    email: input.email || '',
    role: STAFF_ROLES.includes(input.role) ? input.role : 'barista',
    status: STAFF_STATUSES.includes(input.status) ? input.status : 'active',
    rating: typeof input.rating === 'number' ? input.rating : 5,
    ordersHandled: typeof input.ordersHandled === 'number' ? input.ordersHandled : 0,
    ordersCompleted: typeof input.ordersCompleted === 'number' ? input.ordersCompleted : 0,
    avgPrepTime: typeof input.avgPrepTime === 'number' ? input.avgPrepTime : 0,
    efficiency: typeof input.efficiency === 'number' ? input.efficiency : 100,
    notes: input.notes || '',
    createdAt: input.createdAt ? toTimestamp(input.createdAt) : now(),
    updatedAt: input.updatedAt ? toTimestamp(input.updatedAt) : now()
  };
}

/**
 * Normalize a staff member to ensure it matches the schema
 * @param {object} staff - Staff object to normalize
 * @returns {Staff} Normalized staff
 */
export function normalizeStaff(staff) {
  if (!staff) return null;

  return {
    id: staff.id || createStaffId(),
    name: staff.name || 'Unknown',
    phone: staff.phone || staff.phoneNumber || '',
    email: staff.email || '',
    role: STAFF_ROLES.includes(staff.role) ? staff.role : 'barista',
    status: STAFF_STATUSES.includes(staff.status) ? staff.status : 'active',
    rating: typeof staff.rating === 'number' ? staff.rating : 5,
    ordersHandled: typeof staff.ordersHandled === 'number' ? staff.ordersHandled : 0,
    ordersCompleted: typeof staff.ordersCompleted === 'number' ? staff.ordersCompleted : 0,
    avgPrepTime: typeof staff.avgPrepTime === 'number' ? staff.avgPrepTime : 0,
    efficiency: typeof staff.efficiency === 'number' ? staff.efficiency : 100,
    notes: staff.notes || '',
    createdAt: staff.createdAt ? toTimestamp(staff.createdAt) : now(),
    updatedAt: staff.updatedAt ? toTimestamp(staff.updatedAt) : now()
  };
}

/**
 * Update staff after order completion
 * @param {Staff} staff - Staff object
 * @param {object} order - Completed order
 * @returns {Staff} Updated staff object
 */
export function updateStaffAfterOrder(staff, order) {
  if (!staff || !order) return staff;

  const newOrdersHandled = staff.ordersHandled + 1;
  const newOrdersCompleted = staff.ordersCompleted + 1;
  
  // Calculate new average prep time
  const orderPrepTime = order.completedAt && order.createdAt ? 
    (order.completedAt - order.createdAt) / 60000 : 0;
  const newAvgPrepTime = staff.ordersCompleted > 0 ?
    ((staff.avgPrepTime * staff.ordersCompleted) + orderPrepTime) / newOrdersCompleted : orderPrepTime;

  // Calculate efficiency (completed / handled)
  const newEfficiency = newOrdersHandled > 0 ? 
    Math.round((newOrdersCompleted / newOrdersHandled) * 100) : 100;

  return {
    ...staff,
    ordersHandled: newOrdersHandled,
    ordersCompleted: newOrdersCompleted,
    avgPrepTime: Math.round(newAvgPrepTime * 10) / 10,
    efficiency: newEfficiency,
    updatedAt: now()
  };
}

/**
 * Check if staff is active
 * @param {Staff} staff - Staff object
 * @returns {boolean} True if active
 */
export function isStaffActive(staff) {
  return staff.status === 'active';
}

/**
 * Check if staff is on leave
 * @param {Staff} staff - Staff object
 * @returns {boolean} True if on leave
 */
export function isStaffOnLeave(staff) {
  return staff.status === 'on_leave';
}

/**
 * Get staff by role
 * @param {Staff[]} staff - Array of staff
 * @param {string} role - Role to filter by
 * @returns {Staff[]} Filtered staff
 */
export function getStaffByRole(staff, role) {
  if (!Array.isArray(staff)) return [];
  return staff.filter(s => s.role === role);
}

/**
 * Get active staff
 * @param {Staff[]} staff - Array of staff
 * @returns {Staff[]} Active staff
 */
export function getActiveStaff(staff) {
  if (!Array.isArray(staff)) return [];
  return staff.filter(s => isStaffActive(s));
}

/**
 * Find staff by ID
 * @param {Staff[]} staff - Array of staff
 * @param {string} id - Staff ID
 * @returns {Staff|null} Found staff or null
 */
export function findStaffById(staff, id) {
  if (!Array.isArray(staff)) return null;
  return staff.find(s => s.id === id) || null;
}

/**
 * Calculate staff performance metrics
 * @param {Staff} staff - Staff object
 * @returns {object} Performance metrics
 */
export function calculateStaffPerformance(staff) {
  if (!staff) return null;

  const completionRate = staff.ordersHandled > 0 ?
    Math.round((staff.ordersCompleted / staff.ordersHandled) * 100) : 100;

  return {
    completionRate,
    avgPrepTime: staff.avgPrepTime,
    efficiency: staff.efficiency,
    rating: staff.rating,
    totalOrders: staff.ordersHandled
  };
}

/**
 * Get top performing staff by efficiency
 * @param {Staff[]} staff - Array of staff
 * @param {number} limit - Maximum number to return
 * @returns {Staff[]} Top performing staff
 */
export function getTopPerformers(staff, limit = 5) {
  if (!Array.isArray(staff)) return [];
  return [...staff]
    .filter(s => isStaffActive(s))
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, limit);
}
