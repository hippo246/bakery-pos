// Backup Type Implementations
// Specialized backup implementations for different backup types

import { BackupEngine } from './BackupEngine.js';
import { BackupType, BackupStatus } from './BackupTypes.js';
import storageEngine from '../cloud/StorageEngine.js';

/**
 * Full Backup Implementation
 * Backs up all data from all selected modules
 */
export class FullBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.FULL
    });
  }

  async extractData(modules) {
    // Full backup extracts all data from all modules
    return await super.extractData(modules);
  }
}

/**
 * Incremental Backup Implementation
 * Backs up only data that has changed since the last backup
 */
export class IncrementalBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.INCREMENTAL
    });
    this.lastBackupTimestamp = config.lastBackupTimestamp || null;
    this.changesOnly = true;
  }

  async extractData(modules) {
    const data = {
      modules: {},
      metadata: {
        extractedAt: new Date().toISOString(),
        modules: modules,
        backupType: BackupType.INCREMENTAL,
        sinceTimestamp: this.lastBackupTimestamp
      },
      size: 0,
      changes: []
    };

    const totalModules = modules.length;
    let completedModules = 0;

    for (const module of modules) {
      this.progress.details.currentModule = module;
      this.progress.details.moduleProgress = `${completedModules}/${totalModules}`;

      try {
        const moduleData = await this.extractModuleData(module);
        
        // Filter for changes only if we have a timestamp
        if (this.lastBackupTimestamp && moduleData.data) {
          const changes = this.filterChanges(moduleData.data, this.lastBackupTimestamp);
          if (changes.length > 0) {
            data.modules[module] = { data: changes, hasChanges: true };
            data.changes.push({ module, count: changes.length });
          } else {
            data.modules[module] = { data: [], hasChanges: false };
          }
        } else {
          // No timestamp or first backup, include all data
          data.modules[module] = moduleData;
        }

        data.size += this.estimateSize(data.modules[module]);
      } catch (error) {
        console.error(`Failed to extract module ${module}:`, error);
        data.modules[module] = { error: error.message };
      }

      completedModules++;
      this.progress.percentage = 10 + (completedModules / totalModules) * 30;
    }

    return data;
  }

  filterChanges(data, sinceTimestamp) {
    if (!Array.isArray(data)) return data;

    const since = new Date(sinceTimestamp);
    return data.filter(item => {
      const itemDate = item.updatedAt || item.createdAt || item.timestamp;
      if (!itemDate) return true; // Include if no date
      return new Date(itemDate) >= since;
    });
  }
}

/**
 * Differential Backup Implementation
 * Backs up all changes since the last FULL backup
 */
export class DifferentialBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.DIFFERENTIAL
    });
    this.lastFullBackupTimestamp = config.lastFullBackupTimestamp || null;
  }

  async extractData(modules) {
    const data = {
      modules: {},
      metadata: {
        extractedAt: new Date().toISOString(),
        modules: modules,
        backupType: BackupType.DIFFERENTIAL,
        sinceTimestamp: this.lastFullBackupTimestamp
      },
      size: 0
    };

    const totalModules = modules.length;
    let completedModules = 0;

    for (const module of modules) {
      this.progress.details.currentModule = module;
      this.progress.details.moduleProgress = `${completedModules}/${totalModules}`;

      try {
        const moduleData = await this.extractModuleData(module);
        
        if (this.lastFullBackupTimestamp && moduleData.data) {
          const changes = this.filterChanges(moduleData.data, this.lastFullBackupTimestamp);
          data.modules[module] = { data: changes, isDifferential: true };
        } else {
          data.modules[module] = moduleData;
        }

        data.size += this.estimateSize(data.modules[module]);
      } catch (error) {
        console.error(`Failed to extract module ${module}:`, error);
        data.modules[module] = { error: error.message };
      }

      completedModules++;
      this.progress.percentage = 10 + (completedModules / totalModules) * 30;
    }

    return data;
  }

  filterChanges(data, sinceTimestamp) {
    if (!Array.isArray(data)) return data;

    const since = new Date(sinceTimestamp);
    return data.filter(item => {
      const itemDate = item.updatedAt || item.createdAt || item.timestamp;
      if (!itemDate) return true;
      return new Date(itemDate) >= since;
    });
  }
}

/**
 * Manual Backup Implementation
 * User-initiated backup with custom options
 */
export class ManualBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.MANUAL
    });
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.manual = true;
    manifest.userInitiated = true;
    return manifest;
  }
}

/**
 * Scheduled Backup Implementation
 * Automatically triggered backup
 */
export class ScheduledBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.SCHEDULED
    });
    this.scheduleId = config.scheduleId || null;
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.scheduled = true;
    manifest.scheduleId = this.scheduleId;
    return manifest;
  }
}

/**
 * Emergency Backup Implementation
 * High-priority backup for critical situations
 */
export class EmergencyBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.EMERGENCY,
      priority: 'urgent'
    });
  }

  async initialize() {
    // Emergency backups skip some validations for speed
    this.backupId = this.generateBackupId();
    this.createdAt = new Date().toISOString();
    this.progress.currentStep = 'emergency_initializing';
    this.progress.percentage = 5;
    this.progress.message = 'Emergency backup initializing...';

    const providerInfo = storageEngine.getActiveProviderInfo();
    if (!providerInfo) {
      throw new Error('No storage provider available');
    }
    this.storageProvider = storageEngine;
    this.providerId = providerInfo.providerId;

    this.setStatus(BackupStatus.PENDING);
    return { success: true, backupId: this.backupId };
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.emergency = true;
    manifest.priority = 'urgent';
    return manifest;
  }
}

/**
 * Pre-Update Backup Implementation
 * Automatic backup before system updates
 */
export class PreUpdateBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.PRE_UPDATE
    });
    this.updateVersion = config.updateVersion || null;
    this.updateType = config.updateType || 'unknown';
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.preUpdate = true;
    manifest.updateVersion = this.updateVersion;
    manifest.updateType = this.updateType;
    return manifest;
  }
}

/**
 * Pre-Restore Backup Implementation
 * Automatic backup before restore operations
 */
export class PreRestoreBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.PRE_RESTORE
    });
    this.restoreSource = config.restoreSource || null;
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.preRestore = true;
    manifest.restoreSource = this.restoreSource;
    return manifest;
  }
}

/**
 * Snapshot Backup Implementation
 * Point-in-time snapshot
 */
export class SnapshotBackup extends BackupEngine {
  constructor(config = {}) {
    super({
      ...config,
      type: BackupType.SNAPSHOT
    });
    this.snapshotName = config.snapshotName || null;
  }

  generateManifest() {
    const manifest = super.generateManifest();
    manifest.snapshot = true;
    manifest.snapshotName = this.snapshotName;
    return manifest;
  }
}

/**
 * Backup Type Factory
 * Creates the appropriate backup type based on configuration
 */
export function createBackup(config = {}) {
  switch (config.type) {
    case BackupType.FULL:
      return new FullBackup(config);
    case BackupType.INCREMENTAL:
      return new IncrementalBackup(config);
    case BackupType.DIFFERENTIAL:
      return new DifferentialBackup(config);
    case BackupType.MANUAL:
      return new ManualBackup(config);
    case BackupType.SCHEDULED:
      return new ScheduledBackup(config);
    case BackupType.EMERGENCY:
      return new EmergencyBackup(config);
    case BackupType.PRE_UPDATE:
      return new PreUpdateBackup(config);
    case BackupType.PRE_RESTORE:
      return new PreRestoreBackup(config);
    case BackupType.SNAPSHOT:
      return new SnapshotBackup(config);
    default:
      return new FullBackup(config);
  }
}
