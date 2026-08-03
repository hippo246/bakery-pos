// Permissions System for CafeOS
// Enterprise-grade access control

const STORAGE_KEY = 'cafeos_permissions';
const ROLES_KEY = 'cafeos_roles';
const ACTIVITY_LOG_KEY = 'cafeos_permission_activity';

// ── Modules ─────────────────────────────────────────────────────────────
export const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'cashdesk', name: 'Cash Desk', icon: '💰' },
  { id: 'orders', name: 'Order Control', icon: '📋' },
  { id: 'kitchen', name: 'Kitchen Flow', icon: '👨‍🍳' },
  { id: 'menu', name: 'Menu Studio', icon: '🍽️' },
  { id: 'guests', name: 'Guest Book', icon: '👥' },
  { id: 'floor', name: 'Floor', icon: '🪑' },
  { id: 'reservations', name: 'Reservations', icon: '📅' },
  { id: 'inventory', name: 'Inventory', icon: '📦' },
  { id: 'purchasing', name: 'Purchasing', icon: '🛒' },
  { id: 'production', name: 'Production', icon: '🏭' },
  { id: 'delivery', name: 'Delivery', icon: '🚚' },
  { id: 'tracking', name: 'Route & Tracking', icon: '📍' },
  { id: 'performance', name: 'Performance Desk', icon: '📈' },
  { id: 'staff', name: 'Staff', icon: '👔' },
  { id: 'activity', name: 'Activity Feed', icon: '📝' },
  { id: 'settings', name: 'Settings', icon: '⚙️' },
  { id: 'displays', name: 'Displays', icon: '📺' },
  { id: 'notifications', name: 'Notifications', icon: '🔔' }
];

// ── Permission Types ─────────────────────────────────────────────────────
export const PERMISSION_TYPES = [
  { id: 'view', name: 'View', description: 'Can view the module' },
  { id: 'create', name: 'Create', description: 'Can create new items' },
  { id: 'edit', name: 'Edit', description: 'Can edit existing items' },
  { id: 'delete', name: 'Delete', description: 'Can delete items' },
  { id: 'approve', name: 'Approve', description: 'Can approve items' },
  { id: 'export', name: 'Export', description: 'Can export data' },
  { id: 'print', name: 'Print', description: 'Can print documents' },
  { id: 'manage', name: 'Manage', description: 'Full management access' },
  { id: 'assign', name: 'Assign', description: 'Can assign to others' },
  { id: 'cancel', name: 'Cancel', description: 'Can cancel orders/items' },
  { id: 'refund', name: 'Refund', description: 'Can process refunds' },
  { id: 'void', name: 'Void', description: 'Can void transactions' },
  { id: 'override', name: 'Override', description: 'Can override restrictions' }
];

// ── Default Roles ───────────────────────────────────────────────────────
export const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Owner',
    icon: '👑',
    color: '#FFD700',
    description: 'Full access to everything',
    permissions: generateAllPermissions(),
    isSystem: true
  },
  {
    id: 'manager',
    name: 'Manager',
    icon: '🎯',
    color: '#4CAF50',
    description: 'Can manage most operations',
    permissions: generateManagerPermissions(),
    isSystem: true
  },
  {
    id: 'cashier',
    name: 'Cashier',
    icon: '💳',
    color: '#2196F3',
    description: 'Handle orders and payments',
    permissions: generateCashierPermissions(),
    isSystem: true
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '👨‍🍳',
    color: '#FF9800',
    description: 'Kitchen operations only',
    permissions: generateKitchenPermissions(),
    isSystem: true
  },
  {
    id: 'waiter',
    name: 'Waiter',
    icon: '🍽️',
    color: '#9C27B0',
    description: 'Service and floor management',
    permissions: generateWaiterPermissions(),
    isSystem: true
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: '📦',
    color: '#607D8B',
    description: 'Stock and purchasing',
    permissions: generateInventoryPermissions(),
    isSystem: true
  },
  {
    id: 'accountant',
    name: 'Accountant',
    icon: '📊',
    color: '#00BCD4',
    description: 'Financial reports and exports',
    permissions: generateAccountantPermissions(),
    isSystem: true
  }
];

// ── Permission Generators ───────────────────────────────────────────────
function generateAllPermissions() {
  const perms = {};
  MODULES.forEach(module => {
    perms[module.id] = PERMISSION_TYPES.map(p => p.id);
  });
  return perms;
}

function generateManagerPermissions() {
  const perms = {};
  MODULES.forEach(module => {
    perms[module.id] = PERMISSION_TYPES.map(p => p.id);
  });
  // Managers can't delete settings or override owner
  perms.settings = perms.settings.filter(p => p !== 'delete');
  perms.staff = perms.staff.filter(p => p !== 'delete');
  return perms;
}

function generateCashierPermissions() {
  return {
    dashboard: ['view'],
    cashdesk: ['view', 'create', 'edit', 'cancel'],
    orders: ['view', 'create', 'edit', 'cancel'],
    kitchen: ['view'],
    menu: ['view'],
    guests: ['view', 'create', 'edit'],
    floor: ['view', 'edit'],
    reservations: ['view', 'create', 'edit'],
    inventory: ['view'],
    purchasing: [],
    production: [],
    delivery: ['view'],
    tracking: ['view'],
    performance: ['view'],
    staff: [],
    activity: ['view'],
    settings: ['view'],
    displays: ['view'],
    notifications: ['view']
  };
}

function generateKitchenPermissions() {
  return {
    dashboard: ['view'],
    cashdesk: [],
    orders: ['view'],
    kitchen: ['view', 'create', 'edit', 'cancel'],
    menu: ['view', 'edit'],
    guests: [],
    floor: ['view'],
    reservations: ['view'],
    inventory: ['view', 'edit'],
    purchasing: ['view', 'create'],
    production: ['view', 'create', 'edit'],
    delivery: [],
    tracking: [],
    performance: ['view'],
    staff: [],
    activity: ['view'],
    settings: [],
    displays: ['view'],
    notifications: ['view']
  };
}

function generateWaiterPermissions() {
  return {
    dashboard: ['view'],
    cashdesk: ['view', 'create'],
    orders: ['view', 'create', 'edit', 'cancel'],
    kitchen: ['view'],
    menu: ['view'],
    guests: ['view', 'create', 'edit'],
    floor: ['view', 'create', 'edit'],
    reservations: ['view', 'create', 'edit', 'cancel'],
    inventory: ['view'],
    purchasing: [],
    production: [],
    delivery: ['view'],
    tracking: ['view'],
    performance: ['view'],
    staff: [],
    activity: ['view'],
    settings: [],
    displays: ['view'],
    notifications: ['view']
  };
}

function generateInventoryPermissions() {
  return {
    dashboard: ['view'],
    cashdesk: [],
    orders: [],
    kitchen: ['view'],
    menu: ['view', 'edit'],
    guests: [],
    floor: [],
    reservations: [],
    inventory: ['view', 'create', 'edit', 'delete', 'export'],
    purchasing: ['view', 'create', 'edit', 'delete', 'approve'],
    production: ['view'],
    delivery: [],
    tracking: [],
    performance: ['view', 'export'],
    staff: [],
    activity: ['view'],
    settings: ['view'],
    displays: ['view'],
    notifications: ['view']
  };
}

function generateAccountantPermissions() {
  return {
    dashboard: ['view'],
    cashdesk: ['view'],
    orders: ['view'],
    kitchen: ['view'],
    menu: ['view'],
    guests: ['view'],
    floor: ['view'],
    reservations: ['view'],
    inventory: ['view'],
    purchasing: ['view'],
    production: ['view'],
    delivery: ['view'],
    tracking: ['view'],
    performance: ['view', 'export', 'print'],
    staff: ['view'],
    activity: ['view'],
    settings: ['view'],
    displays: ['view'],
    notifications: ['view']
  };
}

// ── Storage Functions ───────────────────────────────────────────────────
export function getRoles() {
  try {
    const stored = localStorage.getItem(ROLES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default roles
    localStorage.setItem(ROLES_KEY, JSON.stringify(DEFAULT_ROLES));
    return DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles) {
  try {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  } catch (err) {
    console.error('[Permissions] Failed to save roles:', err);
  }
}

export function getRoleById(roleId) {
  const roles = getRoles();
  return roles.find(r => r.id === roleId);
}

export function createRole(role) {
  const roles = getRoles();
  const newRole = {
    id: `custom_${Date.now()}`,
    isSystem: false,
    ...role
  };
  roles.push(newRole);
  saveRoles(roles);
  logActivity('role_created', { roleId: newRole.id, roleName: newRole.name });
  return newRole;
}

export function updateRole(roleId, updates) {
  const roles = getRoles();
  const index = roles.findIndex(r => r.id === roleId);
  if (index !== -1 && !roles[index].isSystem) {
    roles[index] = { ...roles[index], ...updates };
    saveRoles(roles);
    logActivity('role_updated', { roleId, updates });
    return roles[index];
  }
  return null;
}

export function deleteRole(roleId) {
  const roles = getRoles();
  const role = roles.find(r => r.id === roleId);
  if (role && !role.isSystem) {
    const filtered = roles.filter(r => r.id !== roleId);
    saveRoles(filtered);
    logActivity('role_deleted', { roleId, roleName: role.name });
    return true;
  }
  return false;
}

export function cloneRole(roleId) {
  const role = getRoleById(roleId);
  if (role) {
    const newRole = {
      ...role,
      id: `clone_${Date.now()}`,
      name: `${role.name} (Copy)`,
      isSystem: false
    };
    saveRoles([...getRoles(), newRole]);
    logActivity('role_cloned', { originalId: roleId, newId: newRole.id });
    return newRole;
  }
  return null;
}

// ── User Permissions ───────────────────────────────────────────────────
export function getUserPermissions(userId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const userPerms = JSON.parse(stored);
      return userPerms[userId] || {};
    }
    return {};
  } catch {
    return {};
  }
}

export function setUserPermissions(userId, permissions) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || '{}';
    const userPerms = JSON.parse(stored);
    userPerms[userId] = permissions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPerms));
    logActivity('user_permissions_updated', { userId });
  } catch (err) {
    console.error('[Permissions] Failed to save user permissions:', err);
  }
}

export function assignRoleToUser(userId, roleId) {
  const role = getRoleById(roleId);
  if (role) {
    setUserPermissions(userId, {
      roleId,
      customPermissions: {},
      inheritedPermissions: role.permissions
    });
    logActivity('role_assigned', { userId, roleId });
    return true;
  }
  return false;
}

// ── Permission Checking ─────────────────────────────────────────────────
export function hasPermission(userId, moduleId, permissionType) {
  const userPerms = getUserPermissions(userId);
  
  // If no permissions set, deny
  if (!userPerms || Object.keys(userPerms).length === 0) {
    return false;
  }
  
  // Check custom permissions first
  if (userPerms.customPermissions && userPerms.customPermissions[moduleId]) {
    return userPerms.customPermissions[moduleId].includes(permissionType);
  }
  
  // Check inherited permissions from role
  if (userPerms.inheritedPermissions && userPerms.inheritedPermissions[moduleId]) {
    return userPerms.inheritedPermissions[moduleId].includes(permissionType);
  }
  
  return false;
}

export function canViewModule(userId, moduleId) {
  return hasPermission(userId, moduleId, 'view');
}

export function canCreate(userId, moduleId) {
  return hasPermission(userId, moduleId, 'create');
}

export function canEdit(userId, moduleId) {
  return hasPermission(userId, moduleId, 'edit');
}

export function canDelete(userId, moduleId) {
  return hasPermission(userId, moduleId, 'delete');
}

export function canCancel(userId, moduleId) {
  return hasPermission(userId, moduleId, 'cancel');
}

export function canRefund(userId, moduleId) {
  return hasPermission(userId, moduleId, 'refund');
}

export function canVoid(userId, moduleId) {
  return hasPermission(userId, moduleId, 'void');
}

export function canOverride(userId) {
  const userPerms = getUserPermissions(userId);
  if (!userPerms.roleId) return false;
  const role = getRoleById(userPerms.roleId);
  return role && role.permissions.settings && role.permissions.settings.includes('override');
}

// ── Activity Logging ───────────────────────────────────────────────────
export function logActivity(action, details = {}) {
  try {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    log.unshift({
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId: details.userId || 'system'
    });
    // Keep only last 1000 activities
    if (log.length > 1000) {
      log.pop();
    }
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
  } catch (err) {
    console.error('[Permissions] Failed to log activity:', err);
  }
}

export function getActivityLog(limit = 100) {
  try {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    return log.slice(0, limit);
  } catch {
    return [];
  }
}

export function getActivityLogByUser(userId, limit = 50) {
  const log = getActivityLog();
  return log.filter(entry => entry.userId === userId).slice(0, limit);
}

// ── Emergency Mode ─────────────────────────────────────────────────────
export function setEmergencyMode(enabled) {
  try {
    localStorage.setItem('cafeos_emergency_mode', JSON.stringify(enabled));
    logActivity('emergency_mode_toggled', { enabled });
  } catch (err) {
    console.error('[Permissions] Failed to set emergency mode:', err);
  }
}

export function isEmergencyMode() {
  try {
    return JSON.parse(localStorage.getItem('cafeos_emergency_mode') || 'false');
  } catch {
    return false;
  }
}

// ── PIN Validation ───────────────────────────────────────────────────────
const MANAGER_PINS_KEY = 'cafeos_manager_pins';

export function getManagerPins() {
  try {
    const stored = localStorage.getItem(MANAGER_PINS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setManagerPin(userId, pin) {
  try {
    const pins = getManagerPins();
    pins[userId] = pin;
    localStorage.setItem(MANAGER_PINS_KEY, JSON.stringify(pins));
    logActivity('manager_pin_set', { userId });
  } catch (err) {
    console.error('[Permissions] Failed to set manager PIN:', err);
  }
}

export function validateManagerPin(userId, pin) {
  const pins = getManagerPins();
  return pins[userId] === pin;
}

export function requestOverride(userId, permission, reason) {
  return new Promise((resolve, reject) => {
    // This would typically trigger the PermissionDialog
    // For now, we'll store the request in a global event
    const event = new CustomEvent('permissionOverrideRequest', {
      detail: { userId, permission, reason, resolve, reject }
    });
    window.dispatchEvent(event);
  });
}

// ── Station Restrictions ───────────────────────────────────────────────────
const STATION_RESTRICTIONS_KEY = 'cafeos_station_restrictions';

export const STATIONS = [
  { id: 'cashdesk', name: 'Cash Desk', icon: '💰', allowedModules: ['dashboard', 'cashdesk', 'orders', 'guests', 'floor', 'reservations', 'notifications'] },
  { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', allowedModules: ['dashboard', 'kitchen', 'menu', 'inventory', 'production', 'notifications'] },
  { id: 'bar', name: 'Bar', icon: '🍺', allowedModules: ['dashboard', 'orders', 'kitchen', 'menu', 'notifications'] },
  { id: 'floor', name: 'Floor Service', icon: '🪑', allowedModules: ['dashboard', 'orders', 'guests', 'floor', 'reservations', 'notifications'] },
  { id: 'manager', name: 'Manager Station', icon: '🎯', allowedModules: ['dashboard', 'cashdesk', 'orders', 'kitchen', 'menu', 'guests', 'floor', 'reservations', 'inventory', 'purchasing', 'production', 'delivery', 'tracking', 'performance', 'staff', 'activity', 'settings', 'displays', 'notifications'] },
  { id: 'owner', name: 'Owner Station', icon: '👑', allowedModules: ['dashboard', 'cashdesk', 'orders', 'kitchen', 'menu', 'guests', 'floor', 'reservations', 'inventory', 'purchasing', 'production', 'delivery', 'tracking', 'performance', 'staff', 'activity', 'settings', 'displays', 'notifications'] }
];

export function getStationRestrictions() {
  try {
    const stored = localStorage.getItem(STATION_RESTRICTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setStationRestriction(userId, stationId) {
  try {
    const restrictions = getStationRestrictions();
    restrictions[userId] = stationId;
    localStorage.setItem(STATION_RESTRICTIONS_KEY, JSON.stringify(restrictions));
    logActivity('station_restriction_set', { userId, stationId });
  } catch (err) {
    console.error('[Permissions] Failed to set station restriction:', err);
  }
}

export function removeStationRestriction(userId) {
  try {
    const restrictions = getStationRestrictions();
    delete restrictions[userId];
    localStorage.setItem(STATION_RESTRICTIONS_KEY, JSON.stringify(restrictions));
    logActivity('station_restriction_removed', { userId });
  } catch (err) {
    console.error('[Permissions] Failed to remove station restriction:', err);
  }
}

export function getUserStation(userId) {
  const restrictions = getStationRestrictions();
  return restrictions[userId] || null;
}

export function canAccessModuleAtStation(userId, moduleId) {
  const stationId = getUserStation(userId);
  if (!stationId) return true; // No restriction
  
  const station = STATIONS.find(s => s.id === stationId);
  if (!station) return true;
  
  return station.allowedModules.includes(moduleId);
}

// ── Device Restrictions ───────────────────────────────────────────────────
const DEVICE_RESTRICTIONS_KEY = 'cafeos_device_restrictions';

export const DEVICE_TYPES = [
  { id: 'kitchen_tablet', name: 'Kitchen Tablet', icon: '📱', allowedModules: ['dashboard', 'kitchen', 'menu', 'inventory', 'production'] },
  { id: 'cash_terminal', name: 'Cash Terminal', icon: '💻', allowedModules: ['dashboard', 'cashdesk', 'orders', 'guests', 'floor', 'reservations'] },
  { id: 'manager_tablet', name: 'Manager Tablet', icon: '📲', allowedModules: ['dashboard', 'cashdesk', 'orders', 'kitchen', 'menu', 'guests', 'floor', 'reservations', 'inventory', 'purchasing', 'production', 'delivery', 'tracking', 'performance', 'staff', 'activity', 'settings', 'displays', 'notifications'] },
  { id: 'owner_laptop', name: 'Owner Laptop', icon: '💻', allowedModules: ['dashboard', 'cashdesk', 'orders', 'kitchen', 'menu', 'guests', 'floor', 'reservations', 'inventory', 'purchasing', 'production', 'delivery', 'tracking', 'performance', 'staff', 'activity', 'settings', 'displays', 'notifications'] },
  { id: 'display_monitor', name: 'Display Monitor', icon: '📺', allowedModules: ['dashboard', 'kitchen', 'displays'] }
];

export function getDeviceRestrictions() {
  try {
    const stored = localStorage.getItem(DEVICE_RESTRICTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setDeviceRestriction(deviceId, deviceType) {
  try {
    const restrictions = getDeviceRestrictions();
    restrictions[deviceId] = deviceType;
    localStorage.setItem(DEVICE_RESTRICTIONS_KEY, JSON.stringify(restrictions));
    logActivity('device_restriction_set', { deviceId, deviceType });
  } catch (err) {
    console.error('[Permissions] Failed to set device restriction:', err);
  }
}

export function getCurrentDeviceType() {
  // In production, this would detect the actual device
  // For now, return null (no restriction)
  return null;
}

export function canAccessModuleOnDevice(moduleId) {
  const deviceType = getCurrentDeviceType();
  if (!deviceType) return true; // No restriction
  
  const device = DEVICE_TYPES.find(d => d.id === deviceType);
  if (!device) return true;
  
  return device.allowedModules.includes(moduleId);
}

export default {
  MODULES,
  PERMISSION_TYPES,
  DEFAULT_ROLES,
  STATIONS,
  DEVICE_TYPES,
  getRoles,
  saveRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
  getUserPermissions,
  setUserPermissions,
  assignRoleToUser,
  hasPermission,
  canViewModule,
  canCreate,
  canEdit,
  canDelete,
  canCancel,
  canRefund,
  canVoid,
  canOverride,
  logActivity,
  getActivityLog,
  getActivityLogByUser,
  setEmergencyMode,
  isEmergencyMode,
  getManagerPins,
  setManagerPin,
  validateManagerPin,
  requestOverride,
  getStationRestrictions,
  setStationRestriction,
  removeStationRestriction,
  getUserStation,
  canAccessModuleAtStation,
  getDeviceRestrictions,
  setDeviceRestriction,
  getCurrentDeviceType,
  canAccessModuleOnDevice
};
