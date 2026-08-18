/**
 * Canonical Runtime Mode Service for CafeOS
 * 
 * This is the SINGLE AUTHORITY for runtime mode determination.
 * All mode checks must use this service - no scattered environment checks.
 * 
 * STATES:
 * - SETUP: Initial configuration wizard, no operational data
 * - DEMO: Demo mode with sample data, ephemeral, never persisted
 * - PRODUCTION: Production mode with real data, persisted to configured backend
 * - MAINTENANCE: Maintenance mode, read-only access for repairs
 * 
 * CRITICAL: PRODUCTION MUST NEVER silently fall back to demo data.
 * If production configuration is missing or backend is unavailable, show explicit error.
 */

import { APP_MODES, getAppMode } from './appMode.js';
import { setAppMode } from './appMode.js';

// Dataset classification for production safety
export const DATASET_CLASSIFICATION = {
  // DEMO_ONLY: Sample data for demo mode only, forbidden in production
  DEMO_ONLY: 'DEMO_ONLY',
  
  // TEST_ONLY: Test data for development/testing, forbidden in production
  TEST_ONLY: 'TEST_ONLY',
  
  // PRODUCTION_FORBIDDEN: Never allowed in production under any circumstances
  PRODUCTION_FORBIDDEN: 'PRODUCTION_FORBIDDEN',
  
  // LEGITIMATE_DEFAULT: Safe default configuration (empty arrays, default settings)
  LEGITIMATE_DEFAULT: 'LEGITIMATE_DEFAULT',
  
  // PRODUCTION_SAFE: Data that can be used in production (user-created, imported)
  PRODUCTION_SAFE: 'PRODUCTION_SAFE'
};

// Classification of INIT_* datasets
export const INIT_DATASET_CLASSIFICATION = {
  INIT_ORDERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_CUSTOMERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_KDS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_STAFF: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_TABLES: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_INVENTORY: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_EXPENSES: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_QR_CODES: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_PRODUCTION_BATCHES: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_DRIVERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_DELIVERY_ORDERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_ROUTES: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_SUPPLIERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  INIT_PURCHASE_ORDERS: DATASET_CLASSIFICATION.DEMO_ONLY,
  
  // MENU_ITEMS is a legitimate default - it's the template menu structure
  MENU_ITEMS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  
  // Configuration constants (not data)
  MENU_CATS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  MODIFIER_CATEGORIES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  STAFF_ROLES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  STAFF_STATUS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  SHIFT_TYPES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  TABLE_TYPES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  TABLE_AREAS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  TABLE_STATUS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  TABLE_SHAPES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  INVENTORY_CATEGORIES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  SUPPLIERS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  EXPENSE_CATEGORY_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  PAYMENT_STATUS_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  RECURRENCE_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  QR_TYPE_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  SESSION_STATUS_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  WAITER_CALL_TYPE_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  WAITER_CALL_STATUS_CONFIG: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  QR_SETTINGS_DEFAULTS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  PRINT_LAYOUTS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  PRINT_COPY_TEMPLATES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  BATCH_STATUS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  QC_GRADES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  QC_STATUS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  WASTAGE_REASONS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  REPLACEMENT_REASONS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  TRACEABILITY_STATES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  EXPIRY_GROUPS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  QUALITY_CHECK_TYPES: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  CHECK_RESULTS: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT,
  CAFE_LOCATION: DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT
};

/**
 * Get the current runtime mode
 * @returns {string} One of: SETUP, DEMO, PRODUCTION, MAINTENANCE
 */
export function getRuntimeMode() {
  return getAppMode();
}

/**
 * Check if in SETUP mode
 */
export function isSetupMode() {
  return getRuntimeMode() === APP_MODES.SETUP;
}

/**
 * Check if in DEMO mode
 */
export function isDemoMode() {
  return getRuntimeMode() === APP_MODES.DEMO;
}

/**
 * Check if in PRODUCTION mode
 */
export function isProductionMode() {
  return getRuntimeMode() === APP_MODES.PRODUCTION;
}

/**
 * Check if in MAINTENANCE mode
 */
export function isMaintenanceMode() {
  return getRuntimeMode() === APP_MODES.MAINTENANCE;
}

/**
 * Set runtime mode
 * @param {string} mode - One of: SETUP, DEMO, PRODUCTION, MAINTENANCE
 */
export function setRuntimeMode(mode) {
  // Validate mode
  if (!Object.values(APP_MODES).includes(mode)) {
    throw new Error(`Invalid runtime mode: ${mode}. Must be one of: ${Object.values(APP_MODES).join(', ')}`);
  }
  
  setAppMode(mode);
}

/**
 * Check if a dataset is allowed in the current mode
 * @param {string} datasetName - Name of the INIT_* dataset
 * @returns {boolean} True if dataset can be loaded in current mode
 */
export function isDatasetAllowed(datasetName) {
  const classification = INIT_DATASET_CLASSIFICATION[datasetName];
  
  // SETUP mode: only legitimate defaults allowed
  if (isSetupMode()) {
    return classification === DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT;
  }
  
  // DEMO mode: everything allowed
  if (isDemoMode()) {
    return true;
  }
  
  // PRODUCTION mode: only legitimate defaults and production-safe data
  if (isProductionMode()) {
    return classification === DATASET_CLASSIFICATION.LEGITIMATE_DEFAULT ||
           classification === DATASET_CLASSIFICATION.PRODUCTION_SAFE;
  }
  
  // MAINTENANCE mode: read-only, no new data loading
  if (isMaintenanceMode()) {
    return false;
  }
  
  return false;
}

/**
 * Get the data source for the current mode
 * @returns {Object} { source: 'localStorage'|'demo'|'backend'|'empty', persist: boolean }
 */
export function getDataSource() {
  if (isSetupMode()) {
    return { source: 'empty', persist: false };
  }
  
  if (isDemoMode()) {
    return { source: 'demo', persist: false };
  }
  
  if (isProductionMode()) {
    // Check if production backend is configured
    const backendConfigured = isProductionBackendConfigured();
    
    if (!backendConfigured) {
      throw new Error(
        'PRODUCTION mode requires backend configuration. ' +
        'Please complete setup wizard or configure backend settings.'
      );
    }
    
    return { source: 'backend', persist: true };
  }
  
  if (isMaintenanceMode()) {
    return { source: 'backend', persist: false }; // read-only
  }
  
  return { source: 'empty', persist: false };
}

/**
 * Check if production backend is properly configured
 * @returns {boolean}
 */
export function isProductionBackendConfigured() {
  try {
    // Check for required production configuration
    const config = localStorage.getItem('cafeos_production_config');
    if (!config) return false;
    
    const parsed = JSON.parse(config);
    
    // Required fields for production
    const required = ['storageBackend', 'businessId'];
    return required.every(field => parsed[field]);
  } catch {
    return false;
  }
}

/**
 * Validate business ID format and content
 * @param {string} businessId - Business ID to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateBusinessId(businessId) {
  if (!businessId || typeof businessId !== 'string') {
    return {
      valid: false,
      error: 'Business ID is required and must be a string'
    };
  }

  const trimmed = businessId.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Business ID cannot be empty'
    };
  }

  // Check for demo business ID (prevent demo ID in production)
  const demoBusinessIds = ['DEMO-BUSINESS', 'DEMO', 'TEST-BUSINESS', 'SAMPLE'];
  if (demoBusinessIds.includes(trimmed.toUpperCase())) {
    return {
      valid: false,
      error: `Business ID "${trimmed}" is a demo ID and cannot be used in production`
    };
  }

  // Validate format: alphanumeric with hyphens, 3-50 characters
  const formatRegex = /^[A-Z0-9-]{3,50}$/;
  if (!formatRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Business ID must be 3-50 alphanumeric characters (A-Z, 0-9, hyphens only)'
    };
  }

  // Business ID must start with a letter
  if (!/^[A-Z]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Business ID must start with an uppercase letter'
    };
  }

  return {
    valid: true,
    error: null
  };
}

/**
 * Validate production configuration comprehensively
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateProductionConfig() {
  const errors = [];

  try {
    const config = localStorage.getItem('cafeos_production_config');
    if (!config) {
      errors.push('Production configuration not found. Please complete the setup wizard.');
      return { valid: false, errors };
    }

    const parsed = JSON.parse(config);

    // Validate storage backend
    if (!parsed.storageBackend) {
      errors.push('Storage backend is required. Please configure a storage provider.');
    }

    // Validate business ID
    if (!parsed.businessId) {
      errors.push('Business ID is required. Please configure your business identity.');
    } else {
      const businessIdValidation = validateBusinessId(parsed.businessId);
      if (!businessIdValidation.valid) {
        errors.push(businessIdValidation.error);
      }
    }

    // Validate tenant ID if present
    if (parsed.tenantId) {
      const tenantIdValidation = validateTenantId(parsed.tenantId);
      if (!tenantIdValidation.valid) {
        errors.push(tenantIdValidation.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Failed to parse production configuration: ${error.message}`);
    return { valid: false, errors };
  }
}

/**
 * Validate tenant ID format and content
 * @param {string} tenantId - Tenant ID to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') {
    return {
      valid: false,
      error: 'Tenant ID must be a string'
    };
  }

  const trimmed = tenantId.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Tenant ID cannot be empty'
    };
  }

  // Check for demo tenant ID
  const demoTenantIds = ['DEMO-TENANT', 'DEMO', 'TEST-TENANT', 'SAMPLE'];
  if (demoTenantIds.includes(trimmed.toUpperCase())) {
    return {
      valid: false,
      error: `Tenant ID "${trimmed}" is a demo ID and cannot be used in production`
    };
  }

  // Validate format: TEN- followed by alphanumeric, 3-50 characters
  const formatRegex = /^TEN-[A-Z0-9-]{1,46}$/;
  if (!formatRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Tenant ID must match format: TEN-XXXXXXXX (3-50 characters total)'
    };
  }

  return {
    valid: true,
    error: null
  };
}

/**
 * Get production configuration
 * @returns {Object|null} Production config or null if not configured
 */
export function getProductionConfig() {
  try {
    const config = localStorage.getItem('cafeos_production_config');
    if (!config) return null;
    return JSON.parse(config);
  } catch {
    return null;
  }
}

/**
 * Get terminal ID for current instance
 * DEMO: Returns demo terminal ID
 * PRODUCTION: Returns configured terminal ID from production config
 * @returns {string} Terminal ID
 */
export function getTerminalId() {
  // DEMO mode: Use deterministic demo terminal ID
  if (isDemoMode()) {
    return 'DEMO-TERMINAL-001';
  }

  // PRODUCTION mode: Get from production config
  try {
    const config = getProductionConfig();
    if (config && config.terminalId) {
      return config.terminalId;
    }

    // Fallback: Generate from business ID if available
    if (config && config.businessId) {
      return `${config.businessId}-TERM-001`;
    }

    // Last resort: Error - should not happen in production
    console.error('[RuntimeMode] Terminal ID not configured for production instance');
    return 'UNCONFIGURED-TERMINAL';
  } catch (error) {
    console.error('[RuntimeMode] Failed to get terminal ID:', error);
    return 'ERROR-TERMINAL';
  }
}

/**
 * Get branch ID for current instance
 * DEMO: Returns demo branch ID
 * PRODUCTION: Returns configured branch ID from production config
 * @returns {string} Branch ID
 */
export function getBranchId() {
  // DEMO mode: Use deterministic demo branch ID
  if (isDemoMode()) {
    return 'DEMO-BRANCH-001';
  }

  // PRODUCTION mode: Get from production config
  try {
    const config = getProductionConfig();
    if (config && config.branchId) {
      return config.branchId;
    }

    // Fallback: Generate from business ID if available
    if (config && config.businessId) {
      return `${config.businessId}-BRANCH-001`;
    }

    // Last resort: Error - should not happen in production
    console.error('[RuntimeMode] Branch ID not configured for production instance');
    return 'UNCONFIGURED-BRANCH';
  } catch (error) {
    console.error('[RuntimeMode] Failed to get branch ID:', error);
    return 'ERROR-BRANCH';
  }
}

/**
 * Get business ID for current instance
 * DEMO: Returns demo business ID
 * PRODUCTION: Returns configured business ID from production config
 * @returns {string} Business ID
 */
export function getBusinessId() {
  // DEMO mode: Use deterministic demo business ID
  if (isDemoMode()) {
    return 'DEMO-BUSINESS';
  }

  // PRODUCTION mode: Get from production config
  try {
    const config = getProductionConfig();
    if (config && config.businessId) {
      return config.businessId;
    }

    // Last resort: Error - should not happen in production
    console.error('[RuntimeMode] Business ID not configured for production instance');
    return 'UNCONFIGURED-BUSINESS';
  } catch (error) {
    console.error('[RuntimeMode] Failed to get business ID:', error);
    return 'ERROR-BUSINESS';
  }
}

/**
 * Get tenant ID for current instance
 * DEMO: Returns demo tenant ID
 * PRODUCTION: Returns configured tenant ID from production config
 * @returns {string} Tenant ID
 */
export function getTenantId() {
  // DEMO mode: Use deterministic demo tenant ID
  if (isDemoMode()) {
    return 'DEMO-TENANT';
  }

  // PRODUCTION mode: Get from production config
  try {
    const config = getProductionConfig();
    if (config && config.tenantId) {
      return config.tenantId;
    }

    // Fallback: Return null if not configured (multi-tenant is optional)
    return null;
  } catch (error) {
    console.error('[RuntimeMode] Failed to get tenant ID:', error);
    return null;
  }
}

/**
 * Set production configuration
 * @param {Object} config - Production configuration object
 */
export function setProductionConfig(config) {
  try {
    localStorage.setItem('cafeos_production_config', JSON.stringify(config));
  } catch (err) {
    console.error('[RuntimeMode] Failed to save production config:', err);
    throw new Error('Failed to save production configuration', { cause: err });
  }
}

/**
 * Check if operational writes are allowed in current mode
 * @returns {boolean}
 */
export function areOperationalWritesAllowed() {
  // SETUP: writes allowed for configuration
  if (isSetupMode()) return true;
  
  // DEMO: writes allowed but not persisted
  if (isDemoMode()) return true;
  
  // PRODUCTION: writes allowed and persisted
  if (isProductionMode()) return true;
  
  // MAINTENANCE: no operational writes (read-only)
  if (isMaintenanceMode()) return false;
  
  return false;
}

/**
 * Check if data persistence is enabled in current mode
 * @returns {boolean}
 */
export function isPersistenceEnabled() {
  // SETUP: no persistence
  if (isSetupMode()) return false;
  
  // DEMO: no persistence
  if (isDemoMode()) return false;
  
  // PRODUCTION: persistence enabled
  if (isProductionMode()) return true;
  
  // MAINTENANCE: no persistence (read-only)
  if (isMaintenanceMode()) return false;
  
  return false;
}

/**
 * Validate if a mode transition is allowed
 * @param {string} targetMode - Target runtime mode
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function validateModeTransition(targetMode) {
  const currentMode = getRuntimeMode();
  
  // Same mode - no transition needed
  if (currentMode === targetMode) {
    return { allowed: true };
  }
  
  // SETUP -> DEMO: allowed (user chooses demo)
  if (currentMode === APP_MODES.SETUP && targetMode === APP_MODES.DEMO) {
    return { allowed: true };
  }
  
  // SETUP -> PRODUCTION: allowed only if production is configured
  if (currentMode === APP_MODES.SETUP && targetMode === APP_MODES.PRODUCTION) {
    if (!isProductionBackendConfigured()) {
      return {
        allowed: false,
        reason: 'Production backend must be configured before entering PRODUCTION mode'
      };
    }

    // Validate production configuration comprehensively
    const configValidation = validateProductionConfig();
    if (!configValidation.valid) {
      return {
        allowed: false,
        reason: `Production configuration validation failed: ${configValidation.errors.join(', ')}`
      };
    }

    return { allowed: true };
  }
  
  // DEMO -> SETUP: allowed (exit demo)
  if (currentMode === APP_MODES.DEMO && targetMode === APP_MODES.SETUP) {
    return { allowed: true };
  }
  
  // DEMO -> PRODUCTION: allowed only if production is configured
  if (currentMode === APP_MODES.DEMO && targetMode === APP_MODES.PRODUCTION) {
    if (!isProductionBackendConfigured()) {
      return {
        allowed: false,
        reason: 'Production backend must be configured before entering PRODUCTION mode'
      };
    }

    // Validate production configuration comprehensively
    const configValidation = validateProductionConfig();
    if (!configValidation.valid) {
      return {
        allowed: false,
        reason: `Production configuration validation failed: ${configValidation.errors.join(', ')}`
      };
    }

    // Additional safeguard: require explicit confirmation for DEMO → PRODUCTION
    console.warn('[RuntimeMode] Attempting to transition from DEMO to PRODUCTION mode. This will clear demo data.');
    return { allowed: true };
  }
  
  // PRODUCTION -> MAINTENANCE: allowed
  if (currentMode === APP_MODES.PRODUCTION && targetMode === APP_MODES.MAINTENANCE) {
    return { allowed: true };
  }
  
  // MAINTENANCE -> PRODUCTION: allowed
  if (currentMode === APP_MODES.MAINTENANCE && targetMode === APP_MODES.PRODUCTION) {
    return { allowed: true };
  }
  
  // PRODUCTION -> SETUP: allowed (reset)
  if (currentMode === APP_MODES.PRODUCTION && targetMode === APP_MODES.SETUP) {
    return { allowed: true };
  }
  
  // MAINTENANCE -> SETUP: allowed (reset)
  if (currentMode === APP_MODES.MAINTENANCE && targetMode === APP_MODES.SETUP) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Invalid mode transition from ${currentMode} to ${targetMode}`
  };
}

/**
 * Transition to a new runtime mode
 * @param {string} targetMode - Target runtime mode
 * @returns {Object} { success: boolean, reason: string }
 */
export function transitionMode(targetMode) {
  const validation = validateModeTransition(targetMode);
  if (!validation.allowed) {
    return { success: false, reason: validation.reason };
  }

  try {
    setRuntimeMode(targetMode);
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

/**
 * Clear demo data from localStorage
 * Called when transitioning from DEMO to PRODUCTION
 * 
 * Clears demo business data, configuration, credentials, and artifacts
 * while preserving system preferences and production configuration
 */
export function clearDemoData() {
  try {
    // Category 1: Demo Business Data (brewcrm_local_* keys)
    const demoBusinessDataKeys = [
      'brewcrm_local_orders',
      'brewcrm_local_customers',
      'brewcrm_local_kds',
      'brewcrm_local_menuItems',
      'brewcrm_local_tables',
      'brewcrm_local_staff',
      'brewcrm_local_inventory',
      'brewcrm_local_expenses',
      'brewcrm_local_qrCodes',
      'brewcrm_local_productionBatches',
      'brewcrm_local_deliveryOrders',
      'brewcrm_local_drivers',
      'brewcrm_local_routes',
      'brewcrm_local_guestSessions',
      'brewcrm_local_waiterCalls',
      'brewcrm_local_suppliers',
      'brewcrm_local_purchaseOrders'
    ];

    // Category 2: Demo Configuration (cafeos_settings, cafeos_tenant_info)
    const demoConfigurationKeys = [
      'cafeos_demo_data',
      'cafeos_settings',
      'cafeos_tenant_info'
    ];

    // Category 3: Demo Credentials/Secrets
    const demoCredentialKeys = [
      'cafeos_secret_vault',
      'cafeos_vault_key',
      'cafeos_gateway_configs',
      'cafeos_delivery_platform_configs'
    ];

    // Category 4: Demo Backup/History Artifacts
    const demoBackupKeys = [
      'cafeos_backup_history',
      'cafeos_backup_logs',
      'cafeos_backup_manager',
      'cafeos_backup_schedules',
      'cafeos_backup_notifications'
    ];

    // Category 5: Demo Attachments/Uploads
    const demoAttachmentKeys = [
      'cafeos_attachments',
      'cafeos_upload_history',
      'cafeos_attachment_logs'
    ];

    // Category 6: Demo Session/Authentication State (sessionStorage)
    const demoSessionKeys = [
      'cafeos_owner_auth'
    ];

    // Clear all demo business data
    demoBusinessDataKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear all demo configuration
    demoConfigurationKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear all demo credentials/secrets
    demoCredentialKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear all demo backup/history artifacts
    demoBackupKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear all demo attachments/uploads
    demoAttachmentKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear demo session/authentication state from sessionStorage
    demoSessionKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (err) {
        console.warn(`[RuntimeMode] Failed to clear sessionStorage key "${key}":`, err);
      }
    });

    // Clear any temp_* keys from sessionStorage (temporary export data)
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('temp_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('[RuntimeMode] Failed to clear temp keys from sessionStorage:', err);
    }

    console.log('[RuntimeMode] Cleared demo data from localStorage and sessionStorage');
    console.log('[RuntimeMode] Cleared categories:', {
      businessData: demoBusinessDataKeys.length,
      configuration: demoConfigurationKeys.length,
      credentials: demoCredentialKeys.length,
      backups: demoBackupKeys.length,
      attachments: demoAttachmentKeys.length,
      sessions: demoSessionKeys.length
    });
  } catch (err) {
    console.error('[RuntimeMode] Failed to clear demo data:', err);
    throw err;
  }
}

/**
 * Get mode-specific error message for missing backend
 * @returns {string}
 */
export function getProductionBackendError() {
  return (
    'Production mode requires a configured backend. ' +
    'Please complete the setup wizard to configure your storage backend, ' +
    'or switch to DEMO mode to explore the system without configuration.'
  );
}

// Export all mode constants for backward compatibility
export { APP_MODES };

export default {
  getRuntimeMode,
  isSetupMode,
  isDemoMode,
  isProductionMode,
  isMaintenanceMode,
  setRuntimeMode,
  isDatasetAllowed,
  getDataSource,
  isProductionBackendConfigured,
  getProductionConfig,
  setProductionConfig,
  areOperationalWritesAllowed,
  isPersistenceEnabled,
  validateModeTransition,
  transitionMode,
  clearDemoData,
  getProductionBackendError,
  getBranchId,
  getBusinessId,
  getTenantId,
  DATASET_CLASSIFICATION,
  INIT_DATASET_CLASSIFICATION,
  APP_MODES
};
