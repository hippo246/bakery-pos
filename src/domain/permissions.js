// Role-Based Access Control (RBAC) System

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  INVENTORY: 'inventory',
  REPORTS: 'reports',
  STAFF_ADMIN: 'staff_admin'
};

export const Permission = {
  // POS Operations
  POS_VIEW: 'pos.view',
  POS_CREATE_ORDER: 'pos.create_order',
  POS_EDIT_ORDER: 'pos.edit_order',
  POS_DELETE_ORDER: 'pos.delete_order',
  POS_APPLY_DISCOUNT: 'pos.apply_discount',
  POS_REFUND: 'pos.refund',
  POS_VOID: 'pos.void',
  
  // Menu Management
  MENU_VIEW: 'menu.view',
  MENU_CREATE_ITEM: 'menu.create_item',
  MENU_EDIT_ITEM: 'menu.edit_item',
  MENU_DELETE_ITEM: 'menu.delete_item',
  MENU_MANAGE_CATEGORIES: 'menu.manage_categories',
  MENU_MANAGE_MODIFIERS: 'menu.manage_modifiers',
  
  // Inventory Management
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADD_STOCK: 'inventory.add_stock',
  INVENTORY_REMOVE_STOCK: 'inventory.remove_stock',
  INVENTORY_MANAGE_SUPPLIERS: 'inventory.manage_suppliers',
  INVENTORY_PURCHASE_ORDERS: 'inventory.purchase_orders',
  INVENTORY_STOCK_TRANSFER: 'inventory.stock_transfer',
  INVENTORY_WASTE_MANAGEMENT: 'inventory.waste_management',
  
  // Staff Management
  STAFF_VIEW: 'staff.view',
  STAFF_ADD: 'staff.add',
  STAFF_EDIT: 'staff.edit',
  STAFF_DELETE: 'staff.delete',
  STAFF_ASSIGN_ROLES: 'staff.assign_roles',
  STAFF_VIEW_SCHEDULE: 'staff.view_schedule',
  STAFF_MANAGE_SCHEDULE: 'staff.manage_schedule',
  STAFF_VIEW_ATTENDANCE: 'staff.view_attendance',
  STAFF_MANAGE_ATTENDANCE: 'staff.manage_attendance',
  STAFF_MANAGE_COMMISSION: 'staff.manage_commission',
  
  // Customer Management
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_ADD: 'customer.add',
  CUSTOMER_EDIT: 'customer.edit',
  CUSTOMER_DELETE: 'customer.delete',
  CUSTOMER_VIEW_HISTORY: 'customer.view_history',
  
  // Table Management
  TABLE_VIEW: 'table.view',
  TABLE_ADD: 'table.add',
  TABLE_EDIT: 'table.edit',
  TABLE_DELETE: 'table.delete',
  TABLE_ASSIGN: 'table.assign',
  
  // Kitchen Operations
  KITCHEN_VIEW: 'kitchen.view',
  KITCHEN_UPDATE_STATUS: 'kitchen.update_status',
  KITCHEN_VIEW_ORDERS: 'kitchen.view_orders',
  
  // Reports & Analytics
  REPORTS_VIEW: 'reports.view',
  REPORTS_SALES: 'reports.sales',
  REPORTS_INVENTORY: 'reports.inventory',
  REPORTS_STAFF: 'reports.staff',
  REPORTS_FINANCIAL: 'reports.financial',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings & Configuration
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT_GENERAL: 'settings.edit_general',
  SETTINGS_EDIT_PAYMENT: 'settings.edit_payment',
  SETTINGS_EDIT_RECEIPTS: 'settings.edit_receipts',
  SETTINGS_EDIT_WORKFLOW: 'settings.edit_workflow',
  SETTINGS_MANAGE_USERS: 'settings.manage_users',
  SETTINGS_MANAGE_ROLES: 'settings.manage_roles',
  SETTINGS_BACKUP: 'settings.backup',
  SETTINGS_RESTORE: 'settings.restore',
  
  // Delivery Platform Integration
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_MANAGE_ORDERS: 'delivery.manage_orders',
  DELIVERY_MANAGE_RIDERS: 'delivery.manage_riders',
  DELIVERY_CONFIGURE_PLATFORMS: 'delivery.configure_platforms',
  
  // System Administration
  SYSTEM_AUDIT_LOGS: 'system.audit_logs',
  SYSTEM_DATA_EXPORT: 'system.data_export',
  SYSTEM_DATA_DELETE: 'system.data_delete',
  SYSTEM_ENCRYPTION: 'system.encryption'
};

// Role-Permission Mapping
export const RolePermissions = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  [UserRole.ADMIN]: [
    // All except system-level encryption
    ...Object.values(Permission).filter(p => p !== Permission.SYSTEM_ENCRYPTION)
  ],
  
  [UserRole.MANAGER]: [
    // POS
    Permission.POS_VIEW,
    Permission.POS_CREATE_ORDER,
    Permission.POS_EDIT_ORDER,
    Permission.POS_APPLY_DISCOUNT,
    Permission.POS_REFUND,
    Permission.POS_VOID,
    
    // Menu
    Permission.MENU_VIEW,
    Permission.MENU_CREATE_ITEM,
    Permission.MENU_EDIT_ITEM,
    Permission.MENU_MANAGE_CATEGORIES,
    Permission.MENU_MANAGE_MODIFIERS,
    
    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_ADD_STOCK,
    Permission.INVENTORY_REMOVE_STOCK,
    Permission.INVENTORY_MANAGE_SUPPLIERS,
    Permission.INVENTORY_PURCHASE_ORDERS,
    Permission.INVENTORY_STOCK_TRANSFER,
    Permission.INVENTORY_WASTE_MANAGEMENT,
    
    // Staff
    Permission.STAFF_VIEW,
    Permission.STAFF_ADD,
    Permission.STAFF_EDIT,
    Permission.STAFF_VIEW_SCHEDULE,
    Permission.STAFF_MANAGE_SCHEDULE,
    Permission.STAFF_VIEW_ATTENDANCE,
    Permission.STAFF_MANAGE_ATTENDANCE,
    Permission.STAFF_MANAGE_COMMISSION,
    
    // Customer
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_ADD,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_VIEW_HISTORY,
    
    // Table
    Permission.TABLE_VIEW,
    Permission.TABLE_ADD,
    Permission.TABLE_EDIT,
    Permission.TABLE_ASSIGN,
    
    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_SALES,
    Permission.REPORTS_INVENTORY,
    Permission.REPORTS_STAFF,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_EXPORT,
    
    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT_GENERAL,
    Permission.SETTINGS_EDIT_PAYMENT,
    Permission.SETTINGS_EDIT_RECEIPTS,
    Permission.SETTINGS_EDIT_WORKFLOW,
    Permission.SETTINGS_BACKUP,
    
    // Delivery
    Permission.DELIVERY_VIEW,
    Permission.DELIVERY_MANAGE_ORDERS,
    Permission.DELIVERY_MANAGE_RIDERS,
    Permission.DELIVERY_CONFIGURE_PLATFORMS
  ],
  
  [UserRole.CASHIER]: [
    Permission.POS_VIEW,
    Permission.POS_CREATE_ORDER,
    Permission.POS_EDIT_ORDER,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_ADD,
    Permission.CUSTOMER_EDIT,
    Permission.TABLE_VIEW,
    Permission.TABLE_ASSIGN,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_SALES
  ],
  
  [UserRole.WAITER]: [
    Permission.POS_VIEW,
    Permission.POS_CREATE_ORDER,
    Permission.POS_EDIT_ORDER,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_ADD,
    Permission.CUSTOMER_EDIT,
    Permission.TABLE_VIEW,
    Permission.TABLE_ASSIGN,
    Permission.STAFF_VIEW_ATTENDANCE
  ],
  
  [UserRole.KITCHEN]: [
    Permission.KITCHEN_VIEW,
    Permission.KITCHEN_UPDATE_STATUS,
    Permission.KITCHEN_VIEW_ORDERS,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_REMOVE_STOCK,
    Permission.INVENTORY_WASTE_MANAGEMENT
  ],
  
  [UserRole.INVENTORY]: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_ADD_STOCK,
    Permission.INVENTORY_REMOVE_STOCK,
    Permission.INVENTORY_MANAGE_SUPPLIERS,
    Permission.INVENTORY_PURCHASE_ORDERS,
    Permission.INVENTORY_STOCK_TRANSFER,
    Permission.INVENTORY_WASTE_MANAGEMENT,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_INVENTORY
  ],
  
  [UserRole.REPORTS]: [
    Permission.REPORTS_VIEW,
    Permission.REPORTS_SALES,
    Permission.REPORTS_INVENTORY,
    Permission.REPORTS_STAFF,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_EXPORT
  ],
  
  [UserRole.STAFF_ADMIN]: [
    Permission.STAFF_VIEW,
    Permission.STAFF_ADD,
    Permission.STAFF_EDIT,
    Permission.STAFF_DELETE,
    Permission.STAFF_ASSIGN_ROLES,
    Permission.STAFF_VIEW_SCHEDULE,
    Permission.STAFF_MANAGE_SCHEDULE,
    Permission.STAFF_VIEW_ATTENDANCE,
    Permission.STAFF_MANAGE_ATTENDANCE,
    Permission.STAFF_MANAGE_COMMISSION,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_STAFF
  ]
};

// Permission checking utility
export const hasPermission = (userRole, permission) => {
  const rolePermissions = RolePermissions[userRole] || [];
  return rolePermissions.includes(permission);
};

// Multiple permission check
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(perm => hasPermission(userRole, perm));
};

// All permissions check
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(perm => hasPermission(userRole, perm));
};
