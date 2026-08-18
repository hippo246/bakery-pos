// QR Ordering constants and seed data

import { createQRCode } from '../domain/qrModel.js';
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

/**
 * Initial seed QR codes for new installations
 * PRODUCTION SAFETY: This is demo data, forbidden in production
 */
export const INIT_QR_CODES = () => {
  if (!isDatasetAllowed('INIT_QR_CODES')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: 'QR-001',
    code: 'QR-TABLE-1',
    type: 'TABLE',
    label: 'Table 1',
    tableId: 'TABLE-001',
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      orderType: 'DINE_IN'
    }
  },
  {
    id: 'QR-002',
    code: 'QR-TABLE-2',
    type: 'TABLE',
    label: 'Table 2',
    tableId: 'TABLE-002',
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      orderType: 'DINE_IN'
    }
  },
  {
    id: 'QR-003',
    code: 'QR-TABLE-3',
    type: 'TABLE',
    label: 'Table 3',
    tableId: 'TABLE-003',
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      orderType: 'DINE_IN'
    }
  },
  {
    id: 'QR-004',
    code: 'QR-TABLE-4',
    type: 'TABLE',
    label: 'Table 4',
    tableId: 'TABLE-004',
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      orderType: 'DINE_IN'
    }
  },
  {
    id: 'QR-005',
    code: 'QR-COUNTER',
    type: 'COUNTER',
    label: 'Counter Order',
    tableId: null,
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: false,
      billRequestEnabled: false,
      orderType: 'DIRECT'
    }
  },
  {
    id: 'QR-006',
    code: 'QR-TAKEAWAY',
    type: 'TAKEAWAY',
    label: 'Takeaway',
    tableId: null,
    active: true,
    scanCount: 0,
    settings: {
      orderingEnabled: true,
      waiterCallEnabled: false,
      billRequestEnabled: false,
      orderType: 'DIRECT_TAKEAWAY'
    }
  }
];
}

/**
 * QR type display configuration
 */
export const QR_TYPE_CONFIG = {
  TABLE: { label: 'Table', icon: '🪑', color: '#27ae60', description: 'Dine-in table ordering' },
  COUNTER: { label: 'Counter', icon: '🏪', color: '#3498db', description: 'Counter pickup ordering' },
  TAKEAWAY: { label: 'Takeaway', icon: '🥡', color: '#e67e22', description: 'Takeaway ordering' },
  GENERAL_MENU: { label: 'Menu', icon: '📋', color: '#9b59b6', description: 'General menu viewing' },
  BRANCH: { label: 'Branch', icon: '🏢', color: '#1abc9c', description: 'Branch-specific menu' }
};

/**
 * Session status display configuration
 */
export const SESSION_STATUS_CONFIG = {
  BROWSING: { label: 'Browsing', color: '#3498db', bgColor: '#d5f5e3' },
  CART_ACTIVE: { label: 'Cart Active', color: '#f39c12', bgColor: '#fdebd0' },
  ORDER_SUBMITTED: { label: 'Order Submitted', color: '#9b59b6', bgColor: '#ebdef0' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', color: '#e67e22', bgColor: '#fadbd8' },
  ORDERING: { label: 'Ordering', color: '#27ae60', bgColor: '#d5f5e3' },
  BILL_REQUESTED: { label: 'Bill Requested', color: '#c0392b', bgColor: '#fadbd8' },
  COMPLETED: { label: 'Completed', color: '#7f8c8d', bgColor: '#eaeded' },
  EXPIRED: { label: 'Expired', color: '#95a5a6', bgColor: '#eaeded' },
  BLOCKED: { label: 'Blocked', color: '#c0392b', bgColor: '#fadbd8' }
};

/**
 * Waiter call type display configuration
 */
export const WAITER_CALL_TYPE_CONFIG = {
  NEED_ASSISTANCE: { label: 'Need Assistance', icon: '🙋', priority: 'medium' },
  READY_TO_ORDER: { label: 'Ready to Order', icon: '✋', priority: 'high' },
  WATER: { label: 'Water', icon: '💧', priority: 'low' },
  CUTLERY: { label: 'Cutlery', icon: '🍴', priority: 'low' },
  REQUEST_BILL: { label: 'Request Bill', icon: '🧾', priority: 'high' },
  OTHER: { label: 'Other', icon: '💬', priority: 'medium' }
};

/**
 * Waiter call status display configuration
 */
export const WAITER_CALL_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: '#e74c3c', bgColor: '#fadbd8' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: '#f39c12', bgColor: '#fdebd0' },
  RESOLVED: { label: 'Resolved', color: '#27ae60', bgColor: '#d5f5e3' },
  DISMISSED: { label: 'Dismissed', color: '#95a5a6', bgColor: '#eaeded' }
};

/**
 * QR settings defaults
 */
export const QR_SETTINGS_DEFAULTS = {
  orderingEnabled: true,
  waiterCallEnabled: true,
  billRequestEnabled: true,
  orderType: 'DINE_IN',
  sessionTimeout: 30, // minutes
  allowGuestName: false,
  allowGuestPhone: false,
  allowNotes: true,
  allowAllergyNotes: true,
  allowModifications: true,
  showUnavailableItems: false,
  allowRepeatOrders: true,
  orderRateLimit: 5, // orders per hour
  qrExpiry: null // null = never expires
};

/**
 * Print layout templates
 */
export const PRINT_LAYOUTS = {
  TABLE_CARD: { label: 'Table Card', size: 'A6', description: 'Individual table QR card' },
  TABLE_STAND: { label: 'Table Stand', size: 'A6', description: 'Small tabletop stand' },
  MULTI_PAGE: { label: 'Multiple per Page', size: 'A4', description: 'Multiple QR codes on one page' },
  COUNTER_SIGN: { label: 'Counter Sign', size: 'A4', description: 'Counter ordering sign' },
  MENU_POSTER: { label: 'Menu Poster', size: 'A3', description: 'General menu poster' }
};

/**
 * Print copy templates
 */
export const PRINT_COPY_TEMPLATES = {
  TABLE: 'Scan to view the menu and order from your table',
  COUNTER: 'Scan to place a counter order',
  TAKEAWAY: 'Scan to order takeaway',
  GENERAL: 'Scan to view our menu',
  SHORT: 'Order from your table',
  NO_APP: 'No app required'
};

/**
 * Get normalized seed QR codes
 */
export function getSeedQRCodes() {
  try {
    return INIT_QR_CODES().map(qr => createQRCode(qr));
  } catch (error) {
    console.warn('[qrConstants] Demo data not available:', error.message);
    return [];
  }
}

/**
 * Generate guest URL from QR code
 */
export function generateGuestUrl(qrCode, baseUrl = window.location.origin) {
  if (!qrCode) return null;
  return `${baseUrl}/guest/${qrCode.code}`;
}

/**
 * Format session duration
 */
export function formatSessionDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format waiter call wait time with urgency
 */
export function formatWaiterCallWaitTime(minutes) {
  if (minutes < 5) return `${minutes}m`;
  if (minutes < 10) return `${minutes}m`;
  if (minutes < 15) return `${minutes}m`;
  return `${minutes}m+`;
}

/**
 * Check if waiter call is urgent
 */
export function isWaiterCallUrgent(call, waitMinutes) {
  if (!call) return false;
  const typePriority = WAITER_CALL_TYPE_CONFIG[call.type]?.priority || 'medium';
  const isHighPriority = typePriority === 'high';
  const isLongWait = waitMinutes >= 10;
  return isHighPriority || isLongWait;
}
