// Role-based access control utilities

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen',
  WAITER: 'waiter'
};

export const PERMISSIONS = {
  // Orders
  CREATE_ORDER: 'create_order',
  MODIFY_ORDER: 'modify_order',
  CANCEL_ORDER: 'cancel_order',
  VIEW_ORDER_HISTORY: 'view_order_history',
  
  // Payments
  PROCESS_PAYMENT: 'process_payment',
  ISSUE_REFUND: 'issue_refund',
  MANAGE_CASH_DRAWER: 'manage_cash_drawer',
  
  // Inventory
  VIEW_INVENTORY: 'view_inventory',
  MODIFY_INVENTORY: 'modify_inventory',
  
  // Customers
  VIEW_CUSTOMERS: 'view_customers',
  MODIFY_CUSTOMERS: 'modify_customers',
  
  // Tables
  MANAGE_TABLES: 'manage_tables',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  MODIFY_SETTINGS: 'modify_settings',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.MODIFY_ORDER,
    PERMISSIONS.CANCEL_ORDER,
    PERMISSIONS.VIEW_ORDER_HISTORY,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.ISSUE_REFUND,
    PERMISSIONS.MANAGE_CASH_DRAWER,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MODIFY_INVENTORY,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MODIFY_CUSTOMERS,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MODIFY_SETTINGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.MODIFY_ORDER,
    PERMISSIONS.VIEW_ORDER_HISTORY,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.VIEW_SETTINGS
  ],
  [ROLES.KITCHEN]: [
    PERMISSIONS.VIEW_ORDER_HISTORY,
    PERMISSIONS.VIEW_INVENTORY
  ],
  [ROLES.WAITER]: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.MODIFY_ORDER,
    PERMISSIONS.VIEW_ORDER_HISTORY,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_TABLES
  ]
};

export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(perm => rolePermissions.includes(perm));
};

export const getUserRole = () => {
  const session = JSON.parse(localStorage.getItem('current_session') || '{}');
  return session.role || ROLES.CASHIER;
};

export const checkAccess = (requiredPermission) => {
  const userRole = getUserRole();
  return hasPermission(userRole, requiredPermission);
};
