/**
 * Feature Configuration System
 * Central registry of all modules/features with enable/disable capabilities
 */

export const FEATURE_CATEGORIES = {
  OPERATIONS: 'operations',
  SALES: 'sales',
  KITCHEN: 'kitchen',
  INVENTORY: 'inventory',
  STAFF: 'staff',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
  INTEGRATIONS: 'integrations'
};

export const FEATURE_CONFIG = {
  dashboard: { id: 'dashboard', name: 'Dashboard', icon: '📊', category: FEATURE_CATEGORIES.OPERATIONS, enabled: true, required: true, settings: { showRevenue: true, showOrders: true, showStaff: true, showAlerts: true } },
  orders: { id: 'orders', name: 'Orders', icon: '📋', category: FEATURE_CATEGORIES.SALES, enabled: true, required: true, settings: { enableModifiers: true, enableSplitOrders: true, enableOrderNotes: true } },
  tables: { id: 'tables', name: 'Tables', icon: '🪑', category: FEATURE_CATEGORIES.OPERATIONS, enabled: true, required: false, settings: { enableFloorPlan: true, enableTableMerging: true } },
  delivery: { id: 'delivery', name: 'Delivery', icon: '🚚', category: FEATURE_CATEGORIES.OPERATIONS, enabled: true, required: false, settings: { enableRouteTracking: true, enableDriverManagement: true } },
  shiftOperations: { id: 'shiftOperations', name: 'Shift Ops', icon: '⏰', category: FEATURE_CATEGORIES.OPERATIONS, enabled: true, required: false, settings: { enableShiftHandover: true, enableCashCount: true } },
  operationsDashboard: { id: 'operationsDashboard', name: 'Ops Dashboard', icon: '🎛️', category: FEATURE_CATEGORIES.OPERATIONS, enabled: true, required: false, settings: { enableRealTimeMonitoring: true } },
  kitchen: { id: 'kitchen', name: 'Kitchen (KDS)', icon: '👨‍🍳', category: FEATURE_CATEGORIES.KITCHEN, enabled: true, required: false, settings: { enableStationRouting: true, enablePrepTimers: true } },
  production: { id: 'production', name: 'Production', icon: '🏭', category: FEATURE_CATEGORIES.KITCHEN, enabled: true, required: false, settings: { enableBatchTracking: true, enableQualityControl: true } },
  inventory: { id: 'inventory', name: 'Inventory', icon: '📦', category: FEATURE_CATEGORIES.INVENTORY, enabled: true, required: false, settings: { enableLowStockAlerts: true, enableStockAdjustments: true } },
  purchasing: { id: 'purchasing', name: 'Purchasing', icon: '🛒', category: FEATURE_CATEGORIES.INVENTORY, enabled: true, required: false, settings: { enablePurchaseOrders: true, enableSupplierManagement: true } },
  staff: { id: 'staff', name: 'Staff', icon: '👥', category: FEATURE_CATEGORIES.STAFF, enabled: true, required: false, settings: { enableScheduling: true, enableTimeTracking: true } },
  crm: { id: 'crm', name: 'CRM', icon: '👤', category: FEATURE_CATEGORIES.SALES, enabled: true, required: false, settings: { enableCustomerProfiles: true, enableLoyaltyProgram: true } },
  analytics: { id: 'analytics', name: 'Analytics', icon: '📈', category: FEATURE_CATEGORIES.ANALYTICS, enabled: true, required: false, settings: { enableRevenueReports: true, enablePerformanceReports: true } },
  expenses: { id: 'expenses', name: 'Expenses', icon: '💰', category: FEATURE_CATEGORIES.ANALYTICS, enabled: true, required: false, settings: { enableExpenseCategories: true, enableBudgetTracking: true } },
  menu: { id: 'menu', name: 'Menu', icon: '🍽️', category: FEATURE_CATEGORIES.SYSTEM, enabled: true, required: true, settings: { enableModifiers: true, enableCategories: true } },
  documents: { id: 'documents', name: 'Documents', icon: '📄', category: FEATURE_CATEGORIES.SYSTEM, enabled: true, required: false, settings: { enableCloudStorage: true, enableDocumentSharing: true } },
  backup: { id: 'backup', name: 'Backup', icon: '💾', category: FEATURE_CATEGORIES.SYSTEM, enabled: true, required: true, settings: { enableAutoBackup: true, enableCloudBackup: false } },
  qrOrdering: { id: 'qrOrdering', name: 'QR Ordering', icon: '📱', category: FEATURE_CATEGORIES.INTEGRATIONS, enabled: true, required: false, settings: { enableGuestMenu: true, enableOrderTracking: true } },
  routeTracking: { id: 'routeTracking', name: 'Route Tracking', icon: '🗺️', category: FEATURE_CATEGORIES.INTEGRATIONS, enabled: true, required: false, settings: { enableLiveTracking: true, enableRouteOptimization: true } }
};

export const isFeatureEnabled = (featureId) => {
  try {
    const customConfig = JSON.parse(localStorage.getItem('cafeos_feature_config') || '{}');
    if (customConfig[featureId]?.enabled !== undefined) return customConfig[featureId].enabled;
  } catch (_e) {
    // Ignore parse errors
  }
  return FEATURE_CONFIG[featureId]?.enabled ?? true;
};

export const setFeatureEnabled = (featureId, enabled) => {
  try {
    const customConfig = JSON.parse(localStorage.getItem('cafeos_feature_config') || '{}');
    customConfig[featureId] = { ...customConfig[featureId], enabled };
    localStorage.setItem('cafeos_feature_config', JSON.stringify(customConfig));
    return true;
  } catch { return false; }
};

export const getCompleteFeatureConfig = () => {
  try {
    const customConfig = JSON.parse(localStorage.getItem('cafeos_feature_config') || '{}');
    const complete = {};
    Object.entries(FEATURE_CONFIG).forEach(([key, feature]) => {
      complete[key] = { ...feature, ...customConfig[key] };
    });
    return complete;
  } catch { return FEATURE_CONFIG; }
};

export const initializeFeatureConfig = (customConfig = {}) => {
  try {
    localStorage.setItem('cafeos_feature_config', JSON.stringify(customConfig));
    return true;
  } catch { return false; }
};

export const setFeatureSetting = (featureId, settingKey, value) => {
  try {
    const customConfig = JSON.parse(localStorage.getItem('cafeos_feature_config') || '{}');
    if (!customConfig[featureId]) customConfig[featureId] = {};
    if (!customConfig[featureId].settings) customConfig[featureId].settings = {};
    customConfig[featureId].settings[settingKey] = value;
    localStorage.setItem('cafeos_feature_config', JSON.stringify(customConfig));
    return true;
  } catch { return false; }
};

export const getFeatureSetting = (featureId, settingKey, defaultValue = null) => {
  try {
    const customConfig = JSON.parse(localStorage.getItem('cafeos_feature_config') || '{}');
    return customConfig[featureId]?.settings?.[settingKey] ?? FEATURE_CONFIG[featureId]?.settings?.[settingKey] ?? defaultValue;
  } catch { return defaultValue; }
};
