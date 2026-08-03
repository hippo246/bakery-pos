// Restore Engine
// Core restore logic that handles compatibility checking, verification, preview, and execution

import { RestoreInterface } from './RestoreInterface.js';
import { RestoreType, RestoreStatus, RestoreHealth, CompatibilityStatus, _VerificationStatus, ConflictType, ConflictSeverity } from './RestoreTypes.js';
import { getBackupManager } from '../backup/BackupManager.js';
import _storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';
import { getBackupSecurityManager } from '../backup/BackupSecurityManager.js';
import registry from '../cloud/ProviderRegistry.js';

export class RestoreEngine extends RestoreInterface {
  constructor(config = {}) {
    super(config);
    this.backupManager = getBackupManager();
    this.securityManager = getBackupSecurityManager();
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.storageProvider = null;
    this.backupData = null;
    this.backupManifest = null;
    this.currentSystemState = null;
    this.previewData = null;
  }

  /**
   * Initialize the restore
   */
  async initialize() {
    try {
      this.restoreId = this.generateRestoreId();
      this.startedAt = new Date().toISOString();
      this.updateProgress('initializing', 5, 'Initializing restore...');

      // Get backup metadata
      const backup = this.backupManager.getBackup(this.backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Get storage provider
      this.storageProvider = registry.getActiveProvider();
      if (!this.storageProvider) {
        throw new Error('No storage provider available');
      }

      // Download backup
      this.updateProgress('downloading', 10, 'Downloading backup...');
      const downloadResult = await this.storageProvider.download(backup.storageKey);
      if (!downloadResult.success) {
        throw new Error(`Failed to download backup: ${downloadResult.error}`);
      }

      this.backupData = downloadResult.data;
      this.backupManifest = backup.manifest;

      // Get current system state
      this.currentSystemState = await this.getCurrentSystemState();

      this.setStatus(RestoreStatus.PENDING);

      this.auditLogger.log({
        level: 'info',
        operation: 'restore_init',
        providerId: this.storageProvider.providerId,
        details: {
          restoreId: this.restoreId,
          backupId: this.backupId,
          type: this.type,
          modules: this.modules
        },
        success: true
      });

      this.eventManager.emit('restore.started', {
        restoreId: this.restoreId,
        backupId: this.backupId,
        type: this.type
      });

      return { success: true, restoreId: this.restoreId };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(RestoreStatus.FAILED);
      this.setHealth(RestoreHealth.CRITICAL);
      this.auditLogger.log({
        level: 'error',
        operation: 'restore_init',
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the restore process
   */
  async start() {
    try {
      this.setStatus(RestoreStatus.PREPARING);
      const startTime = Date.now();

      // Step 1: Check compatibility
      this.updateProgress('checking_compatibility', 15, 'Checking compatibility...');
      const compatibilityResult = await this.checkCompatibility();
      this.compatibility = compatibilityResult;

      if (compatibilityResult.status === CompatibilityStatus.INCOMPATIBLE) {
        throw new Error('Backup is incompatible with current system');
      }

      // Step 2: Verify integrity
      this.updateProgress('verifying_integrity', 25, 'Verifying backup integrity...');
      const integrityResult = await this.verifyIntegrity();
      if (!integrityResult.verified) {
        throw new Error(`Backup integrity verification failed: ${integrityResult.reason}`);
      }

      // Step 3: Detect conflicts
      this.updateProgress('detecting_conflicts', 35, 'Detecting conflicts...');
      const conflictResult = await this.detectConflicts();
      this.conflicts = conflictResult.conflicts;

      // Step 4: Preview changes
      this.updateProgress('previewing_changes', 45, 'Previewing changes...');
      const previewResult = await this.previewChanges();
      this.previewData = previewResult;

      // If dry run, stop here
      if (this.dryRun) {
        this.completedAt = new Date().toISOString();
        this.duration = Date.now() - startTime;
        this.setStatus(RestoreStatus.COMPLETED);
        this.setHealth(RestoreHealth.HEALTHY);
        this.updateProgress('completed', 100, 'Dry run completed');
        return { success: true, dryRun: true, preview: previewResult };
      }

      // Step 5: Create safety backup
      if (this.createSafetyBackup) {
        this.updateProgress('creating_safety_backup', 55, 'Creating safety backup...');
        const safetyBackupResult = await this.createSafetyBackup();
        this.safetyBackupId = safetyBackupResult.backupId;
      }

      // Step 6: Execute restore
      this.updateProgress('executing_restore', 65, 'Executing restore...');
      const restoreResult = await this.executeRestore();
      if (!restoreResult.success) {
        throw new Error(`Restore execution failed: ${restoreResult.error}`);
      }

      // Step 7: Verify restore
      if (this.verifyAfterRestore) {
        this.updateProgress('verifying_restore', 85, 'Verifying restore...');
        const verifyResult = await this.verifyRestore();
        this.verification = verifyResult;

        if (!verifyResult.success) {
          this.setHealth(RestoreHealth.WARNING);
          this.addConflict({
            type: ConflictType.DATA_INTEGRITY,
            severity: ConflictSeverity.WARNING,
            message: 'Post-restore verification found issues',
            details: verifyResult.issues
          });
        }
      }

      // Complete
      this.completedAt = new Date().toISOString();
      this.duration = Date.now() - startTime;
      this.setStatus(RestoreStatus.COMPLETED);
      this.setHealth(this.calculateHealth());
      this.rollbackAvailable = !!this.safetyBackupId;

      this.updateProgress('completed', 100, 'Restore completed successfully');

      this.auditLogger.log({
        level: 'info',
        operation: 'restore_complete',
        providerId: this.storageProvider.providerId,
        details: {
          restoreId: this.restoreId,
          duration: this.duration,
          modules: this.modules,
          safetyBackupId: this.safetyBackupId,
          verification: this.verification
        },
        success: true
      });

      this.eventManager.emit('restore.completed', {
        restoreId: this.restoreId,
        duration: this.duration
      });

      return { success: true, restoreId: this.restoreId, metadata: this.getMetadata() };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(RestoreStatus.FAILED);
      this.setHealth(RestoreHealth.CRITICAL);
      this.updateProgress('failed', 0, `Restore failed: ${error.message}`);

      this.auditLogger.log({
        level: 'error',
        operation: 'restore_failed',
        providerId: this.storageProvider.providerId,
        details: {
          restoreId: this.restoreId,
          error: error.message,
          step: this.progress.currentStep
        },
        success: false
      });

      this.eventManager.emit('restore.failed', {
        restoreId: this.restoreId,
        error: error.message,
        step: this.progress.currentStep
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel the restore process
   */
  async cancel() {
    this.setStatus(RestoreStatus.CANCELLED);
    this.updateProgress('cancelled', 0, 'Restore cancelled');

    this.auditLogger.log({
      level: 'warning',
      operation: 'restore_cancelled',
      providerId: this.storageProvider.providerId,
      details: { restoreId: this.restoreId },
      success: true
    });

    this.eventManager.emit('restore.cancelled', { restoreId: this.restoreId });

    return { success: true };
  }

  /**
   * Check compatibility with current system
   */
  async checkCompatibility() {
    const issues = [];
    const warnings = [];

    if (!this.backupManifest) {
      return {
        status: CompatibilityStatus.UNKNOWN,
        issues: ['No manifest available'],
        warnings: []
      };
    }

    // Check CafeOS version
    const currentVersion = this.getCurrentVersion();
    const backupVersion = this.backupManifest.cafeosVersion || '1.0.0';
    if (currentVersion !== backupVersion) {
      warnings.push({
        type: 'version_mismatch',
        message: `Version mismatch: backup is ${backupVersion}, current is ${currentVersion}`,
        severity: ConflictSeverity.WARNING
      });
    }

    // Check schema version
    const currentSchema = this.getCurrentSchemaVersion();
    const backupSchema = this.backupManifest.schemaVersion || '1.0.0';
    if (currentSchema !== backupSchema) {
      issues.push({
        type: 'schema_mismatch',
        message: `Schema mismatch: backup is ${backupSchema}, current is ${currentSchema}`,
        severity: ConflictSeverity.ERROR
      });
    }

    // Check for missing modules
    const backupModules = this.backupManifest.modules || [];
    const currentModules = Object.keys(this.currentSystemState || {});
    const missingModules = backupModules.filter(m => !currentModules.includes(m));
    if (missingModules.length > 0) {
      warnings.push({
        type: 'missing_module',
        message: `Missing modules: ${missingModules.join(', ')}`,
        severity: ConflictSeverity.WARNING,
        modules: missingModules
      });
    }

    // Determine overall compatibility
    let status = CompatibilityStatus.COMPATIBLE;
    if (issues.length > 0) {
      status = CompatibilityStatus.INCOMPATIBLE;
    } else if (warnings.length > 0) {
      status = CompatibilityStatus.COMPATIBLE_WITH_WARNINGS;
    }

    return {
      status,
      issues,
      warnings,
      score: this.calculateCompatibilityScore(issues, warnings)
    };
  }

  /**
   * Verify backup integrity
   */
  async verifyIntegrity() {
    try {
      // Verify checksum
      if (this.backupManifest && this.backupManifest.checksum) {
        const calculatedChecksum = await this.calculateChecksum(this.backupData);
        if (calculatedChecksum !== this.backupManifest.checksum) {
          return {
            verified: false,
            reason: 'Checksum mismatch'
          };
        }
      }

      // Verify manifest structure
      if (!this.backupManifest || !this.verifyManifest(this.backupManifest)) {
        return {
          verified: false,
          reason: 'Invalid manifest'
        };
      }

      // Verify backup data exists
      if (!this.backupData) {
        return {
          verified: false,
          reason: 'No backup data'
        };
      }

      return {
        verified: true,
        checksum: this.backupManifest.checksum,
        manifestValid: true
      };
    } catch (error) {
      return {
        verified: false,
        reason: error.message
      };
    }
  }

  /**
   * Preview restore changes
   */
  async previewChanges() {
    const preview = {
      affectedModules: [],
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsRemoved: 0,
      estimatedDuration: 0,
      storageImpact: 0,
      warnings: []
    };

    try {
      // Parse backup data
      const backupText = await this.backupData.text();
      const backupJson = JSON.parse(backupText);

      // Calculate changes for each module
      for (const module of this.modules || Object.keys(backupJson.modules || {})) {
        const moduleData = backupJson.modules[module];
        const currentData = this.currentSystemState[module] || [];

        const added = moduleData.filter(item => !currentData.find(c => c.id === item.id)).length;
        const updated = moduleData.filter(item => currentData.find(c => c.id === item.id)).length;
        const removed = currentData.filter(item => !moduleData.find(m => m.id === item.id)).length;

        preview.affectedModules.push({
          module,
          added,
          updated,
          removed
        });

        preview.itemsAdded += added;
        preview.itemsUpdated += updated;
        preview.itemsRemoved += removed;
      }

      // Estimate duration (rough estimate: 100ms per item)
      preview.estimatedDuration = (preview.itemsAdded + preview.itemsUpdated + preview.itemsRemoved) * 100;

      // Estimate storage impact
      preview.storageImpact = this.backupData.size || 0;

      return preview;
    } catch (error) {
      console.error('Preview failed:', error);
      preview.warnings.push(`Preview calculation failed: ${error.message}`);
      return preview;
    }
  }

  /**
   * Create safety backup
   */
  async createSafetyBackup() {
    try {
      const result = await this.backupManager.createBackup({
        type: 'PRE_RESTORE',
        modules: Object.keys(this.currentSystemState || {}),
        name: `Safety Backup before restore ${this.restoreId}`,
        description: `Automatic safety backup before restore from ${this.backupId}`,
        tags: ['safety', 'pre-restore'],
        compressionEnabled: true,
        encryptionEnabled: true,
        verificationEnabled: true
      });

      if (result.success) {
        this.auditLogger.log({
          level: 'info',
          operation: 'safety_backup_created',
          details: {
            restoreId: this.restoreId,
            safetyBackupId: result.backupId
          },
          success: true
        });
      }

      return result;
    } catch (error) {
      console.error('Safety backup creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute the restore
   */
  async executeRestore() {
    try {
      this.updateProgress('extracting', 70, 'Extracting backup data...');

      // Decrypt if needed
      let restoreData = this.backupData;
      if (this.backupManifest && this.backupManifest.encryptionStatus === 'encrypted') {
        const { decryptData } = await import('../utils/setupSecurity.js');
        const encryptionKey = this.getEncryptionKey();
        if (!encryptionKey) {
          throw new Error('Encryption key required for encrypted backup');
        }
        const encryptedText = await this.backupData.text();
        const decryptedText = await decryptData(encryptedText, encryptionKey);
        restoreData = new Blob([decryptedText], { type: 'application/json' });
      }

      // Parse backup data
      const backupText = await restoreData.text();
      const backupJson = JSON.parse(backupText);

      this.updateProgress('restoring', 75, 'Restoring data...');

      // Restore each module
      const modulesToRestore = this.modules || Object.keys(backupJson.modules || {});
      const totalModules = modulesToRestore.length;
      let completedModules = 0;

      for (const module of modulesToRestore) {
        this.updateProgress('restoring', 75 + (completedModules / totalModules) * 20, `Restoring ${module}...`);

        const moduleData = backupJson.modules[module];
        if (moduleData) {
          await this.restoreModule(module, moduleData);
        }

        completedModules++;
      }

      this.updateProgress('finalizing', 95, 'Finalizing restore...');

      return { success: true, modulesRestored: modulesToRestore };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore a single module
   */
  async restoreModule(module, data) {
    try {
      const storageKey = `cafeos_${module}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to restore module ${module}:`, error);
      throw error;
    }
  }

  /**
   * Verify restore after completion
   */
  async verifyRestore() {
    const issues = [];

    try {
      // Verify each restored module
      const modulesToVerify = this.modules || Object.keys(this.currentSystemState || {});

      for (const module of modulesToVerify) {
        const storageKey = `cafeos_${module}`;
        const data = localStorage.getItem(storageKey);

        if (!data) {
          issues.push({
            module,
            issue: 'Module data missing after restore',
            severity: ConflictSeverity.ERROR
          });
          continue;
        }

        try {
          JSON.parse(data);
        } catch (_error) {
          issues.push({
            module,
            issue: 'Module data corrupted after restore',
            severity: ConflictSeverity.ERROR
          });
        }
      }

      return {
        success: issues.length === 0,
        issues,
        modulesVerified: modulesToVerify.length
      };
    } catch (_error) {
      return {
        success: false,
        issues: [{ issue: 'Verification failed', severity: ConflictSeverity.ERROR }]
      };
    }
  }

  /**
   * Rollback to safety backup
   */
  async rollback() {
    if (!this.safetyBackupId) {
      return { success: false, error: 'No safety backup available for rollback' };
    }

    try {
      this.setStatus(RestoreStatus.ROLLING_BACK);

      // Get safety backup
      const safetyBackup = this.backupManager.getBackup(this.safetyBackupId);
      if (!safetyBackup) {
        throw new Error('Safety backup not found');
      }

      // Create restore engine for rollback
      const { createRestore } = await import('./RestoreTypesImplementations.js');
      const rollbackEngine = createRestore({
        backupId: this.safetyBackupId,
        type: RestoreType.ROLLBACK,
        modules: this.modules,
        operator: this.operator,
        originalRestoreId: this.restoreId,
        createSafetyBackup: false,
        verifyAfterRestore: true
      });

      await rollbackEngine.initialize();
      const result = await rollbackEngine.start();

      if (result.success) {
        this.rollbackId = rollbackEngine.restoreId;
        this.setStatus(RestoreStatus.ROLLED_BACK);

        this.auditLogger.log({
          level: 'info',
          operation: 'restore_rollback',
          details: {
            restoreId: this.restoreId,
            rollbackId: this.rollbackId,
            safetyBackupId: this.safetyBackupId
          },
          success: true
        });

        this.eventManager.emit('restore.rolled_back', {
          restoreId: this.restoreId,
          rollbackId: this.rollbackId
        });
      }

      return result;
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'restore_rollback',
        details: {
          restoreId: this.restoreId,
          error: error.message
        },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts
   */
  async detectConflicts() {
    const conflicts = [];

    // Check for version conflicts
    if (this.compatibility && this.compatibility.issues) {
      conflicts.push(...this.compatibility.issues);
    }

    // Check for data conflicts
    if (this.previewData && this.previewData.warnings) {
      conflicts.push(...this.previewData.warnings);
    }

    return { conflicts };
  }

  /**
   * Calculate compatibility score
   */
  calculateCompatibilityScore(issues, warnings) {
    const baseScore = 100;
    const issuePenalty = issues.length * 25;
    const warningPenalty = warnings.length * 10;
    return Math.max(0, baseScore - issuePenalty - warningPenalty);
  }

  /**
   * Calculate restore health
   */
  calculateHealth() {
    if (this.status === RestoreStatus.FAILED) {
      return RestoreHealth.CRITICAL;
    }

    if (this.verification && !this.verification.success) {
      return RestoreHealth.WARNING;
    }

    if (this.conflicts.some(c => c.severity === ConflictSeverity.CRITICAL)) {
      return RestoreHealth.CRITICAL;
    }

    if (this.conflicts.some(c => c.severity === ConflictSeverity.ERROR)) {
      return RestoreHealth.WARNING;
    }

    return RestoreHealth.HEALTHY;
  }

  /**
   * Get current system state
   */
  async getCurrentSystemState() {
    const state = {};
    const modules = ['orders', 'menuItems', 'customers', 'inventory', 'staff', 'tables', 'suppliers', 'reservations'];

    for (const module of modules) {
      const storageKey = `cafeos_${module}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          state[module] = JSON.parse(data);
        } catch (_error) {
          state[module] = [];
        }
      } else {
        state[module] = [];
      }
    }

    return state;
  }

  /**
   * Get current CafeOS version
   */
  getCurrentVersion() {
    return '1.0.0';
  }

  /**
   * Get current schema version
   */
  getCurrentSchemaVersion() {
    return '1.0.0';
  }

  /**
   * Calculate checksum
   */
  async calculateChecksum(data) {
    try {
      const dataString = await data.text();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Verify manifest structure
   */
  verifyManifest(manifest) {
    const requiredFields = ['version', 'backupId', 'type', 'createdAt', 'checksum'];
    return requiredFields.every(field => field in manifest);
  }

  /**
   * Get encryption key
   */
  getEncryptionKey() {
    // This should be retrieved from secure storage or user input
    return null;
  }
}
