// QR Ordering domain model with schema validation and helper functions

import { generateId } from './ids.js';
import { now, toTimestamp } from './dates.js';

/**
 * QR Code schema
 * @typedef {Object} QRCode
 * @property {string} id - Unique QR identifier
 * @property {string} code - The actual QR code string/token
 * @property {"TABLE"|"COUNTER"|"TAKEAWAY"|"GENERAL_MENU"|"BRANCH"} type - QR type
 * @property {string} label - Display label (e.g., "Table 8")
 * @property {string|null} tableId - Linked table ID for table QRs
 * @property {string|null} branchId - Linked branch ID for multi-location
 * @property {boolean} active - Whether the QR is currently active
 * @property {string|null} guestUrl - Short URL for guests
 * @property {number} scanCount - Total scan count
 * @property {number|null} lastScannedAt - Last scan timestamp
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 * @property {Object} settings - QR-specific settings
 * @property {boolean} settings.orderingEnabled - Whether guests can order
 * @property {boolean} settings.waiterCallEnabled - Whether guests can call waiters
 * @property {boolean} settings.billRequestEnabled - Whether guests can request bill
 * @property {string|null} settings.orderType - Default order type (DINE_IN, TAKEAWAY, etc.)
 */

/**
 * Guest Session schema
 * @typedef {Object} GuestSession
 * @property {string} id - Unique session identifier
 * @property {string} qrCodeId - Associated QR code ID
 * @property {string|null} tableId - Associated table ID
 * @property {"BROWSING"|"CART_ACTIVE"|"ORDER_SUBMITTED"|"AWAITING_CONFIRMATION"|"ORDERING"|"BILL_REQUESTED"|"COMPLETED"|"EXPIRED"|"BLOCKED"} status - Session status
 * @property {number} startedAt - Session start timestamp
 * @property {number} lastActivityAt - Last activity timestamp
 * @property {number|null} expiresAt - Session expiry timestamp
 * @property {number} guestCount - Number of guests (if provided)
 * @property {Array} cart - Cart items
 * @property {string|null} orderId - Linked order ID
 * @property {Array} waiterCalls - Waiter call history
 * @property {boolean} billRequested - Whether bill was requested
 * @property {number|null} billRequestedAt - Bill request timestamp
 * @property {Object} metadata - Additional session metadata
 * @property {boolean} blocked - Whether session is blocked
 * @property {string|null} blockedReason - Reason for blocking
 */

/**
 * Waiter Call schema
 * @typedef {Object} WaiterCall
 * @property {string} id - Unique call identifier
 * @property {string} sessionId - Associated guest session ID
 * @property {string|null} tableId - Associated table ID
 * @property {"NEED_ASSISTANCE"|"READY_TO_ORDER"|"WATER"|"CUTLERY"|"REQUEST_BILL"|"OTHER"} type - Call type
 * @property {string|null} note - Additional note
 * @property {"PENDING"|"ACKNOWLEDGED"|"RESOLVED"|"DISMISSED"} status - Call status
 * @property {number} createdAt - Creation timestamp
 * @property {number|null} acknowledgedAt - Acknowledgment timestamp
 * @property {number|null} resolvedAt - Resolution timestamp
 * @property {string|null} acknowledgedBy - Staff ID who acknowledged
 * @property {string|null} resolvedBy - Staff ID who resolved
 */

// Valid QR types
export const QR_TYPES = ['TABLE', 'COUNTER', 'TAKEAWAY', 'GENERAL_MENU', 'BRANCH'];

// Valid session statuses
export const SESSION_STATUSES = ['BROWSING', 'CART_ACTIVE', 'ORDER_SUBMITTED', 'AWAITING_CONFIRMATION', 'ORDERING', 'BILL_REQUESTED', 'COMPLETED', 'EXPIRED', 'BLOCKED'];

// Valid waiter call types
export const WAITER_CALL_TYPES = ['NEED_ASSISTANCE', 'READY_TO_ORDER', 'WATER', 'CUTLERY', 'REQUEST_BILL', 'OTHER'];

// Valid waiter call statuses
export const WAITER_CALL_STATUSES = ['PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'];

function devWarn(msg, value) {
  console.warn(`[qrModel] ${msg}`, value ?? '');
}

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function safeStr(v) {
  return (v === null || v === undefined) ? "" : String(v);
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * Generate a unique QR code string
 */
function generateQRCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `QR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a new QR code from input data
 */
export function createQRCode(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const type = QR_TYPES.includes(safeInput.type) ? safeInput.type : 'TABLE';
  if (safeInput.type && !QR_TYPES.includes(safeInput.type)) devWarn('invalid QR type', safeInput.type);

  const settings = {
    orderingEnabled: Boolean(safeInput.settings?.orderingEnabled !== false),
    waiterCallEnabled: Boolean(safeInput.settings?.waiterCallEnabled !== false),
    billRequestEnabled: Boolean(safeInput.settings?.billRequestEnabled !== false),
    orderType: safeInput.settings?.orderType || 'DINE_IN'
  };

  return {
    id: safeInput.id || generateId(),
    code: safeInput.code || generateQRCode(),
    type,
    label: safeStr(safeInput.label).trim() || 'Untitled QR',
    tableId: safeInput.tableId || null,
    branchId: safeInput.branchId || null,
    active: safeInput.active !== false,
    guestUrl: safeInput.guestUrl || null,
    scanCount: safeNum(safeInput.scanCount, 0),
    lastScannedAt: safeInput.lastScannedAt ? toTimestamp(safeInput.lastScannedAt) : null,
    createdAt: safeInput.createdAt || now(),
    updatedAt: safeInput.updatedAt || now(),
    settings
  };
}

/**
 * Normalize a QR code to ensure it matches the schema
 */
export function normalizeQRCode(qr) {
  if (!qr || typeof qr !== 'object') return null;

  const type = QR_TYPES.includes(qr.type) ? qr.type : 'TABLE';
  const settings = {
    orderingEnabled: Boolean(qr.settings?.orderingEnabled !== false),
    waiterCallEnabled: Boolean(qr.settings?.waiterCallEnabled !== false),
    billRequestEnabled: Boolean(qr.settings?.billRequestEnabled !== false),
    orderType: qr.settings?.orderType || 'DINE_IN'
  };

  return {
    id: qr.id || generateId(),
    code: qr.code || generateQRCode(),
    type,
    label: safeStr(qr.label).trim() || 'Untitled QR',
    tableId: qr.tableId || null,
    branchId: qr.branchId || null,
    active: Boolean(qr.active),
    guestUrl: qr.guestUrl || null,
    scanCount: safeNum(qr.scanCount, 0),
    lastScannedAt: qr.lastScannedAt ? toTimestamp(qr.lastScannedAt) : null,
    createdAt: qr.createdAt ? toTimestamp(qr.createdAt) : now(),
    updatedAt: qr.updatedAt ? toTimestamp(qr.updatedAt) : now(),
    settings
  };
}

/**
 * Validate QR code data
 */
export function validateQRCode(qr) {
  if (!qr || typeof qr !== 'object') {
    return { valid: false, message: 'QR code must be an object' };
  }

  if (!qr.label || typeof qr.label !== 'string' || qr.label.trim().length === 0) {
    return { valid: false, message: 'Label is required' };
  }

  if (!QR_TYPES.includes(qr.type)) {
    return { valid: false, message: 'Invalid QR type' };
  }

  if (qr.type === 'TABLE' && !qr.tableId) {
    return { valid: false, message: 'Table ID is required for table QR codes' };
  }

  return { valid: true, message: null };
}

/**
 * Create a new guest session
 */
export function createGuestSession(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const status = SESSION_STATUSES.includes(safeInput.status) ? safeInput.status : 'BROWSING';
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes default

  return {
    id: safeInput.id || generateId(),
    qrCodeId: safeInput.qrCodeId || null,
    tableId: safeInput.tableId || null,
    status,
    startedAt: safeInput.startedAt || now(),
    lastActivityAt: safeInput.lastActivityAt || now(),
    expiresAt: safeInput.expiresAt || (now() + sessionTimeout),
    guestCount: safeNum(safeInput.guestCount, 0),
    cart: safeArr(safeInput.cart),
    orderId: safeInput.orderId || null,
    waiterCalls: safeArr(safeInput.waiterCalls),
    billRequested: Boolean(safeInput.billRequested),
    billRequestedAt: safeInput.billRequestedAt ? toTimestamp(safeInput.billRequestedAt) : null,
    metadata: safeInput.metadata || {},
    blocked: Boolean(safeInput.blocked),
    blockedReason: safeInput.blockedReason || null
  };
}

/**
 * Normalize a guest session
 */
export function normalizeGuestSession(session) {
  if (!session || typeof session !== 'object') return null;

  const status = SESSION_STATUSES.includes(session.status) ? session.status : 'BROWSING';

  return {
    id: session.id || generateId(),
    qrCodeId: session.qrCodeId || null,
    tableId: session.tableId || null,
    status,
    startedAt: session.startedAt ? toTimestamp(session.startedAt) : now(),
    lastActivityAt: session.lastActivityAt ? toTimestamp(session.lastActivityAt) : now(),
    expiresAt: session.expiresAt ? toTimestamp(session.expiresAt) : (now() + 30 * 60 * 1000),
    guestCount: safeNum(session.guestCount, 0),
    cart: safeArr(session.cart),
    orderId: session.orderId || null,
    waiterCalls: safeArr(session.waiterCalls),
    billRequested: Boolean(session.billRequested),
    billRequestedAt: session.billRequestedAt ? toTimestamp(session.billRequestedAt) : null,
    metadata: session.metadata || {},
    blocked: Boolean(session.blocked),
    blockedReason: session.blockedReason || null
  };
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(session) {
  if (!session) return true;
  return session.expiresAt < now();
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(session) {
  if (!session) return null;
  return {
    ...session,
    lastActivityAt: now(),
    updatedAt: now()
  };
}

/**
 * Create a waiter call
 */
export function createWaiterCall(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const type = WAITER_CALL_TYPES.includes(safeInput.type) ? safeInput.type : 'NEED_ASSISTANCE';
  const status = WAITER_CALL_STATUSES.includes(safeInput.status) ? safeInput.status : 'PENDING';

  return {
    id: safeInput.id || generateId(),
    sessionId: safeInput.sessionId || null,
    tableId: safeInput.tableId || null,
    type,
    note: safeStr(safeInput.note),
    status,
    createdAt: safeInput.createdAt || now(),
    acknowledgedAt: safeInput.acknowledgedAt ? toTimestamp(safeInput.acknowledgedAt) : null,
    resolvedAt: safeInput.resolvedAt ? toTimestamp(safeInput.resolvedAt) : null,
    acknowledgedBy: safeInput.acknowledgedBy || null,
    resolvedBy: safeInput.resolvedBy || null
  };
}

/**
 * Normalize a waiter call
 */
export function normalizeWaiterCall(call) {
  if (!call || typeof call !== 'object') return null;

  const type = WAITER_CALL_TYPES.includes(call.type) ? call.type : 'NEED_ASSISTANCE';
  const status = WAITER_CALL_STATUSES.includes(call.status) ? call.status : 'PENDING';

  return {
    id: call.id || generateId(),
    sessionId: call.sessionId || null,
    tableId: call.tableId || null,
    type,
    note: safeStr(call.note),
    status,
    createdAt: call.createdAt ? toTimestamp(call.createdAt) : now(),
    acknowledgedAt: call.acknowledgedAt ? toTimestamp(call.acknowledgedAt) : null,
    resolvedAt: call.resolvedAt ? toTimestamp(call.resolvedAt) : null,
    acknowledgedBy: call.acknowledgedBy || null,
    resolvedBy: call.resolvedBy || null
  };
}

/**
 * Acknowledge a waiter call
 */
export function acknowledgeWaiterCall(call, staffId) {
  if (!call) return null;
  return {
    ...call,
    status: 'ACKNOWLEDGED',
    acknowledgedAt: now(),
    acknowledgedBy: staffId
  };
}

/**
 * Resolve a waiter call
 */
export function resolveWaiterCall(call, staffId) {
  if (!call) return null;
  return {
    ...call,
    status: 'RESOLVED',
    resolvedAt: now(),
    resolvedBy: staffId
  };
}

/**
 * Calculate session duration in minutes
 */
export function getSessionDuration(session) {
  if (!session || !session.startedAt) return 0;
  return Math.floor((now() - session.startedAt) / 60000);
}

/**
 * Calculate waiter call waiting time in minutes
 */
export function getWaiterCallWaitTime(call) {
  if (!call || !call.createdAt) return 0;
  return Math.floor((now() - call.createdAt) / 60000);
}
