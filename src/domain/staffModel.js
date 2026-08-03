// Staff domain model with schema validation and helper functions

import { createStaffId } from './ids.js';
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

// Valid shift values
export const STAFF_SHIFTS = ['morning', 'evening', 'night', 'full_day'];

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

function _num(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

function _clamp(val, lo, hi = Infinity) {
  return Math.min(Math.max(val, lo), hi);
}

function _ts(raw) {
  if (!raw) return now();
  try { const t = toTimestamp(raw); return Number.isNaN(t) ? now() : t; }
  catch { return now(); }
}

function _warn(msg) {
  console.warn('[staffModel]', msg);
}

const _ROLE_ALIAS = {
  manager: 'manager', Manager: 'manager',
  barista: 'barista', Barista: 'barista',
  kitchen: 'kitchen', chef: 'kitchen', Chef: 'kitchen',
  'kitchen staff': 'kitchen', 'Kitchen Staff': 'kitchen',
  server: 'server', waiter: 'server', Waiter: 'server', cashier: 'server', Cashier: 'server',
  cleaner: 'cleaner', Cleaner: 'cleaner',
};

const _STATUS_ALIAS = {
  active: 'active', Active: 'active',
  inactive: 'inactive', Inactive: 'inactive',
  on_leave: 'on_leave', 'on leave': 'on_leave', 'On Leave': 'on_leave', On_Leave: 'on_leave',
};

// ---------------------------------------------------------------------------
// Exported normalisation helpers
// ---------------------------------------------------------------------------

export function normalizeStaffRole(role) {
  if (!role) { _warn('Missing role, defaulting to "barista"'); return 'barista'; }
  if (_ROLE_ALIAS[role]) return _ROLE_ALIAS[role];
  const lower = String(role).toLowerCase().trim();
  if (_ROLE_ALIAS[lower]) return _ROLE_ALIAS[lower];
  if (STAFF_ROLES.includes(lower)) return lower;
  _warn(`Unknown role "${role}", defaulting to "barista"`);
  return 'barista';
}

export function getStaffRoleLabel(role) {
  const labels = { barista: 'Barista', kitchen: 'Kitchen', server: 'Server', manager: 'Manager', cleaner: 'Cleaner' };
  return labels[role] || (typeof role === 'string' ? role : 'Unknown');
}

export function normalizeStaffStatus(status) {
  if (!status) { _warn('Missing status, defaulting to "active"'); return 'active'; }
  if (_STATUS_ALIAS[status]) return _STATUS_ALIAS[status];
  const lower = String(status).toLowerCase().trim().replace(/\s+/g, '_');
  if (_STATUS_ALIAS[lower]) return _STATUS_ALIAS[lower];
  if (STAFF_STATUSES.includes(lower)) return lower;
  _warn(`Unknown status "${status}", defaulting to "active"`);
  return 'active';
}

export function isActiveStaff(staff) {
  return !!(staff && staff.status === 'active');
}

export function normalizeStaffShifts(raw) {
  if (!raw) return [];
  const items = Array.isArray(raw) ? raw : String(raw).split(',');
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const s = String(item).trim().toLowerCase().replace(/\s+/g, '_');
    if (STAFF_SHIFTS.includes(s) && !seen.has(s)) { seen.add(s); result.push(s); }
    else if (s) _warn(`Unknown shift "${s}", ignoring`);
  }
  return result;
}

export function getStaffInitials(name) {
  if (!name || typeof name !== 'string' || !name.trim()) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getStaffDisplayName(staff) {
  if (!staff) return 'Staff Member';
  return (typeof staff.name === 'string' && staff.name.trim()) || 'Staff Member';
}

export function getStaffHourlyRate(staff) {
  if (!staff) return 0;
  return _clamp(_num(staff.hourlyRate, 0), 0);
}

export function calculateStaffEfficiency(staff) {
  if (!staff) return 100;
  const handled = _clamp(_num(staff.ordersHandled, 0), 0);
  const completed = _clamp(_num(staff.ordersCompleted, 0), 0);
  if (handled === 0) return 100;
  return _clamp(Math.round((completed / handled) * 100), 0, 100);
}

/**
 * Create a new staff member
 * @param {object} input - Staff input data
 * @returns {Staff} New staff object
 */
export function createStaff(input = {}) {
  const i = (input && typeof input === 'object') ? input : {};

  const rawRating = _clamp(_num(i.rating, 5), 0, 5);
  const rawHandled = _clamp(_num(i.ordersHandled, 0), 0);
  const rawCompleted = _clamp(_num(i.ordersCompleted, 0), 0);
  const rawAvgPrepTime = _clamp(_num(i.avgPrepTime, 0), 0);
  const rawEfficiency = _clamp(_num(i.efficiency, 100), 0, 100);
  const rawHourlyRate = _clamp(_num(i.hourlyRate, 0), 0);

  if (rawRating !== _num(i.rating, 5)) _warn(`createStaff: rating out of range, clamped to ${rawRating}`);
  if (rawEfficiency !== _num(i.efficiency, 100)) _warn(`createStaff: efficiency out of range, clamped to ${rawEfficiency}`);

  return {
    id: i.id || createStaffId(),
    name: (typeof i.name === 'string' && i.name.trim()) || 'Unknown',
    phone: typeof i.phone === 'string' ? i.phone.replace(/[^\d+]/g, '') :
           typeof i.phoneNumber === 'string' ? i.phoneNumber.replace(/[^\d+]/g, '') : '',
    email: typeof i.email === 'string' ? i.email.trim().toLowerCase() : '',
    role: normalizeStaffRole(i.role),
    status: normalizeStaffStatus(i.status),
    rating: rawRating,
    ordersHandled: rawHandled,
    ordersCompleted: Math.min(rawCompleted, rawHandled),
    avgPrepTime: rawAvgPrepTime,
    efficiency: rawEfficiency,
    hourlyRate: rawHourlyRate,
    shifts: normalizeStaffShifts(i.shifts),
    avatar: i.avatar || null,
    joinDate: i.joinDate || null,
    notes: typeof i.notes === 'string' ? i.notes : '',
    createdAt: _ts(i.createdAt),
    updatedAt: _ts(i.updatedAt)
  };
}

/**
 * Normalize a staff member to ensure it matches the schema
 * @param {object} staff - Staff object to normalize
 * @returns {Staff} Normalized staff
 */
export function normalizeStaff(staff) {
  if (!staff || typeof staff !== 'object') return null;

  const rawHandled = _clamp(_num(staff.ordersHandled, 0), 0);
  const rawCompleted = _clamp(_num(staff.ordersCompleted, 0), 0);

  return {
    id: staff.id || createStaffId(),
    name: (typeof staff.name === 'string' && staff.name.trim()) || 'Unknown',
    phone: typeof staff.phone === 'string' ? staff.phone.replace(/[^\d+]/g, '') :
           typeof staff.phoneNumber === 'string' ? staff.phoneNumber.replace(/[^\d+]/g, '') : '',
    email: typeof staff.email === 'string' ? staff.email.trim().toLowerCase() : '',
    role: normalizeStaffRole(staff.role),
    status: normalizeStaffStatus(staff.status),
    rating: _clamp(_num(staff.rating, 5), 0, 5),
    ordersHandled: rawHandled,
    ordersCompleted: Math.min(rawCompleted, rawHandled),
    avgPrepTime: _clamp(_num(staff.avgPrepTime, 0), 0),
    efficiency: calculateStaffEfficiency(staff),
    hourlyRate: _clamp(_num(staff.hourlyRate, 0), 0),
    shifts: normalizeStaffShifts(staff.shifts),
    avatar: staff.avatar || null,
    joinDate: staff.joinDate || null,
    notes: typeof staff.notes === 'string' ? staff.notes :
           typeof staff.description === 'string' ? staff.description : '',
    createdAt: _ts(staff.createdAt),
    updatedAt: _ts(staff.updatedAt)
  };
}

/**
 * Update staff after order completion
 * @param {Staff} staff - Staff object
 * @param {object} order - Completed order
 * @returns {Staff} Updated staff object
 */
export function updateStaffAfterOrder(staff, order) {
  if (!staff) return staff;
  if (!order) return { ...staff };

  const prevHandled = _clamp(_num(staff.ordersHandled, 0), 0);
  const prevCompleted = _clamp(_num(staff.ordersCompleted, 0), 0);
  const prevAvgPrepTime = _clamp(_num(staff.avgPrepTime, 0), 0);

  const newOrdersHandled = prevHandled + 1;

  // Count as completed only when both status is COMPLETED and completedAt is set.
  // Guards against cancelled orders that somehow carry a stale completedAt timestamp.
  const isCompleted = !!(order.completedAt) && order.status === 'COMPLETED';
  const newOrdersCompleted = isCompleted ? prevCompleted + 1 : prevCompleted;

  // Safe prep-time calculation (minutes)
  let orderPrepTime = 0;
  if (isCompleted && order.completedAt && order.createdAt) {
    const diff = _num(order.completedAt, 0) - _num(order.createdAt, 0);
    orderPrepTime = _clamp(diff / 60000, 0); // ms → minutes, floor at 0
  }

  // Rolling average: only update when we have a completed order
  let newAvgPrepTime = prevAvgPrepTime;
  if (isCompleted) {
    newAvgPrepTime = prevCompleted > 0
      ? ((prevAvgPrepTime * prevCompleted) + orderPrepTime) / newOrdersCompleted
      : orderPrepTime;
    newAvgPrepTime = _clamp(Math.round(newAvgPrepTime * 10) / 10, 0);
  }

  const newEfficiency = _clamp(
    newOrdersHandled > 0 ? Math.round((newOrdersCompleted / newOrdersHandled) * 100) : 100,
    0, 100
  );

  return {
    ...staff,
    ordersHandled: newOrdersHandled,
    ordersCompleted: newOrdersCompleted,
    avgPrepTime: newAvgPrepTime,
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
  return !!(staff && staff.status === 'active');
}

/**
 * Check if staff is on leave
 * @param {Staff} staff - Staff object
 * @returns {boolean} True if on leave
 */
export function isStaffOnLeave(staff) {
  return !!(staff && staff.status === 'on_leave');
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

  const handled = _clamp(_num(staff.ordersHandled, 0), 0);
  const completed = _clamp(_num(staff.ordersCompleted, 0), 0);
  // Reuse the single source of truth for completion rate
  const completionRate = handled > 0 ? _clamp(Math.round((completed / handled) * 100), 0, 100) : 100;

  return {
    completionRate,
    avgPrepTime: _clamp(_num(staff.avgPrepTime, 0), 0),
    efficiency: calculateStaffEfficiency(staff),
    rating: _clamp(_num(staff.rating, 5), 0, 5),
    totalOrders: handled
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

/**
 * Get active staff scheduled for a specific shift.
 * @param {Staff[]} staff - Array of staff
 * @param {'morning'|'evening'|'night'|'full_day'} shift
 * @returns {Staff[]} Staff active and on that shift
 */
export function getStaffOnShift(staff, shift) {
  if (!Array.isArray(staff) || !STAFF_SHIFTS.includes(shift)) return [];
  return staff.filter(s => isStaffActive(s) && Array.isArray(s.shifts) && s.shifts.includes(shift));
}
