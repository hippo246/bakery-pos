// Health Check Initialization
// Registers all health check providers with the Health Registry

import healthRegistry from './HealthRegistry.js';
import { HealthCheckConfig, HealthCheckIntervals, ComponentCategory } from './HealthTypes.js';

// Import all health check providers
import { StorageEngineHealthCheck } from './providers/StorageEngineHealthCheck.js';
import { SecretVaultHealthCheck } from './providers/SecretVaultHealthCheck.js';
import { CredentialManagerHealthCheck } from './providers/CredentialManagerHealthCheck.js';
import { DatabaseHealthCheck } from './providers/DatabaseHealthCheck.js';
import { AuthenticationHealthCheck } from './providers/AuthenticationHealthCheck.js';
import { BackupEngineHealthCheck } from './providers/BackupEngineHealthCheck.js';
import { RestoreEngineHealthCheck } from './providers/RestoreEngineHealthCheck.js';
import { SyncEngineHealthCheck } from './providers/SyncEngineHealthCheck.js';
import { ImportExportHealthCheck } from './providers/ImportExportHealthCheck.js';
import { PaymentsHealthCheck } from './providers/PaymentsHealthCheck.js';
import { NotificationsHealthCheck } from './providers/NotificationsHealthCheck.js';
import { PrintersHealthCheck } from './providers/PrintersHealthCheck.js';

/**
 * Initialize and register all health check providers
 */
export function initializeHealthChecks() {
  console.log('[HealthChecks] Initializing health check providers...');

  // Storage Engine - Check every 1 minute
  healthRegistry.register(
    'storage-engine',
    'Storage Engine',
    ComponentCategory.STORAGE,
    new StorageEngineHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  // Secret Vault - Check every 1 minute
  healthRegistry.register(
    'secret-vault',
    'Secret Vault',
    ComponentCategory.SECURITY,
    new SecretVaultHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  // Credential Manager - Check every 1 minute
  healthRegistry.register(
    'credential-manager',
    'Credential Manager',
    ComponentCategory.SECURITY,
    new CredentialManagerHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  // Database - Check every 30 seconds (critical)
  healthRegistry.register(
    'database',
    'Database',
    ComponentCategory.DATABASE,
    new DatabaseHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.FAST,
      timeout: 5000,
      alertThreshold: 'warning'
    })
  );

  // Authentication - Check every 30 seconds (critical)
  healthRegistry.register(
    'authentication',
    'Authentication',
    ComponentCategory.AUTHENTICATION,
    new AuthenticationHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.FAST,
      timeout: 5000,
      alertThreshold: 'warning'
    })
  );

  // Backup Engine - Check every 5 minutes
  healthRegistry.register(
    'backup-engine',
    'Backup Engine',
    ComponentCategory.BACKUP,
    new BackupEngineHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.SLOW,
      timeout: 15000,
      alertThreshold: 'warning'
    })
  );

  // Restore Engine - Check every 5 minutes
  healthRegistry.register(
    'restore-engine',
    'Restore Engine',
    ComponentCategory.RESTORE,
    new RestoreEngineHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.SLOW,
      timeout: 15000,
      alertThreshold: 'warning'
    })
  );

  // Sync Engine - Check every 1 minute
  healthRegistry.register(
    'sync-engine',
    'Sync Engine',
    ComponentCategory.SYNC,
    new SyncEngineHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  // Import/Export - Check every 5 minutes
  healthRegistry.register(
    'import-export',
    'Import/Export',
    ComponentCategory.IMPORT_EXPORT,
    new ImportExportHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.SLOW,
      timeout: 15000,
      alertThreshold: 'warning'
    })
  );

  // Payments - Check every 30 seconds (critical)
  healthRegistry.register(
    'payments',
    'Payments',
    ComponentCategory.PAYMENTS,
    new PaymentsHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.FAST,
      timeout: 5000,
      alertThreshold: 'warning'
    })
  );

  // Notifications - Check every 1 minute
  healthRegistry.register(
    'notifications',
    'Notifications',
    ComponentCategory.NOTIFICATIONS,
    new NotificationsHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  // Printers - Check every 1 minute
  healthRegistry.register(
    'printers',
    'Printers',
    ComponentCategory.PRINTING,
    new PrintersHealthCheck(),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  console.log(`[HealthChecks] Initialized ${healthRegistry.getComponentCount()} health check providers`);
}

/**
 * Register cloud provider health check dynamically
 * @param {string} providerId - Provider identifier
 */
export async function registerCloudProviderHealthCheck(providerId) {
  const { CloudProviderHealthCheck } = await import('./providers/CloudProviderHealthCheck.js');
  
  healthRegistry.register(
    `cloud-provider-${providerId}`,
    `Cloud Provider (${providerId})`,
    ComponentCategory.CLOUD,
    new CloudProviderHealthCheck(providerId),
    new HealthCheckConfig({
      interval: HealthCheckIntervals.NORMAL,
      timeout: 10000,
      alertThreshold: 'warning'
    })
  );

  console.log(`[HealthChecks] Registered cloud provider health check: ${providerId}`);
}

/**
 * Unregister cloud provider health check
 * @param {string} providerId - Provider identifier
 */
export function unregisterCloudProviderHealthCheck(providerId) {
  healthRegistry.unregister(`cloud-provider-${providerId}`);
  console.log(`[HealthChecks] Unregistered cloud provider health check: ${providerId}`);
}
