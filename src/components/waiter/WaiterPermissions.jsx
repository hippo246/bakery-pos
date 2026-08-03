import React from 'react';
/**
 * Waiter Permissions
 * Role-based access control for waiters
 * Waiters cannot: change inventory, access reports, access cloud settings, access financial configuration, access security settings
 * Only operational permissions
 */

const WAITER_PERMISSIONS = {
  // Operational permissions (allowed)
  CAN_VIEW_ASSIGNED_TABLES: true,
  CAN_TAKE_ORDERS: true,
  CAN_MODIFY_ORDERS: true,
  CAN_CANCEL_ORDERS: true,
  CAN_VIEW_KITCHEN_STATUS: true,
  CAN_COLLECT_ORDERS: true,
  CAN_SERVE_ORDERS: true,
  CAN_REQUEST_BILLS: true,
  CAN_VIEW_CUSTOMER_REQUESTS: true,
  CAN_VIEW_SHIFT_SUMMARY: true,
  CAN_VIEW_NOTIFICATIONS: true,
  
  // Restricted permissions (denied)
  CAN_CHANGE_INVENTORY: false,
  CAN_ACCESS_REPORTS: false,
  CAN_ACCESS_CLOUD_SETTINGS: false,
  CAN_ACCESS_FINANCIAL_CONFIG: false,
  CAN_ACCESS_SECURITY_SETTINGS: false,
  CAN_MODIFY_MENU: false,
  CAN_MODIFY_PRICES: false,
  CAN_ACCESS_STAFF_MANAGEMENT: false,
  CAN_ACCESS_SYSTEM_SETTINGS: false,
  CAN_VIEW_ALL_ORDERS: false, // Only assigned tables
  CAN_MODIFY_TABLES: false, // Only view assigned tables
  CAN_ACCESS_PAYMENTS_CONFIG: false,
  CAN_ACCESS_TAX_CONFIG: false,
  CAN_ACCESS_DISCOUNT_CONFIG: false
};

/**
 * Check if waiter has permission
 * @param {string} permission - Permission key
 * @returns {boolean} - Whether permission is granted
 */
export function hasWaiterPermission(permission) {
  return WAITER_PERMISSIONS[permission] || false;
}

/**
 * Get all waiter permissions
 * @returns {Object} - All permissions
 */
export function getWaiterPermissions() {
  return { ...WAITER_PERMISSIONS };
}

/**
 * Check if action is allowed for waiter
 * @param {string} action - Action to check
 * @returns {boolean} - Whether action is allowed
 */
export function isWaiterActionAllowed(action) {
  const actionPermissions = {
    'take_order': 'CAN_TAKE_ORDERS',
    'modify_order': 'CAN_MODIFY_ORDERS',
    'cancel_order': 'CAN_CANCEL_ORDERS',
    'collect_order': 'CAN_COLLECT_ORDERS',
    'serve_order': 'CAN_SERVE_ORDERS',
    'request_bill': 'CAN_REQUEST_BILLS',
    'view_kitchen': 'CAN_VIEW_KITCHEN_STATUS',
    'view_reports': 'CAN_ACCESS_REPORTS',
    'change_inventory': 'CAN_CHANGE_INVENTORY',
    'access_cloud': 'CAN_ACCESS_CLOUD_SETTINGS',
    'access_financial': 'CAN_ACCESS_FINANCIAL_CONFIG',
    'access_security': 'CAN_ACCESS_SECURITY_SETTINGS',
    'modify_menu': 'CAN_MODIFY_MENU',
    'modify_prices': 'CAN_MODIFY_PRICES',
    'manage_staff': 'CAN_ACCESS_STAFF_MANAGEMENT',
    'system_settings': 'CAN_ACCESS_SYSTEM_SETTINGS'
  };
  
  const permission = actionPermissions[action];
  return permission ? hasWaiterPermission(permission) : false;
}

/**
 * Permission denied message
 * @param {string} action - Action that was denied
 * @returns {string} - User-friendly message
 */
export function getPermissionDeniedMessage(action) {
  const messages = {
    'view_reports': 'Waiters do not have permission to access reports',
    'change_inventory': 'Waiters do not have permission to modify inventory',
    'access_cloud': 'Waiters do not have permission to access cloud settings',
    'access_financial': 'Waiters do not have permission to access financial configuration',
    'access_security': 'Waiters do not have permission to access security settings',
    'modify_menu': 'Waiters do not have permission to modify menu items',
    'modify_prices': 'Waiters do not have permission to modify prices',
    'manage_staff': 'Waiters do not have permission to manage staff',
    'system_settings': 'Waiters do not have permission to access system settings'
  };
  
  return messages[action] || 'You do not have permission to perform this action';
}

export default WAITER_PERMISSIONS;
