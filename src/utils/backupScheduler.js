// Automated Backup Scheduler for CafeOS
// Handles scheduled backups with configurable intervals and retention policies

import { createBackupAuditLog } from "../domain/auditLogModel.js";
import { getCurrentUserId } from "./authService.js";
import { 
  uploadToCloudStorage, 
  getActiveCloudProvider,
  CLOUD_PROVIDERS 
} from "./cloudStorage.js";

const BACKUP_STORAGE_KEY = 'cafeos_backup_schedule';
const BACKUP_HISTORY_KEY = 'cafeos_backup_history';

const BACKUP_INTERVALS = {
  hourly: 3600000,      // 1 hour
  daily: 86400000,      // 24 hours
  weekly: 604800000,    // 7 days
  monthly: 2592000000   // 30 days
};

const DEFAULT_RETENTION_DAYS = 30;

/**
 * Get backup schedule settings
 */
export function getBackupSchedule() {
  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load backup schedule:', e);
  }
  
  return {
    enabled: false,
    interval: 'daily',
    retentionDays: DEFAULT_RETENTION_DAYS,
    lastBackup: null,
    nextBackup: null
  };
}

/**
 * Save backup schedule settings
 */
export function saveBackupSchedule(schedule) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(schedule));
    return true;
  } catch (e) {
    console.error('Failed to save backup schedule:', e);
    return false;
  }
}

/**
 * Get backup history
 */
export function getBackupHistory() {
  try {
    const stored = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load backup history:', e);
  }
  
  return [];
}

/**
 * Save backup history
 */
export function saveBackupHistory(history) {
  try {
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Failed to save backup history:', e);
    return false;
  }
}

/**
 * Add backup to history
 */
export function addBackupToHistory(backup) {
  const history = getBackupHistory();
  history.unshift({
    ...backup,
    timestamp: new Date().toISOString()
  });
  
  // Apply retention policy
  const schedule = getBackupSchedule();
  const retentionMs = (schedule.retentionDays || DEFAULT_RETENTION_DAYS) * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  
  const filtered = history.filter(b => new Date(b.timestamp).getTime() > cutoff);
  
  saveBackupHistory(filtered);
  return filtered;
}

/**
 * Calculate next backup time
 */
export function calculateNextBackup(interval) {
  const intervalMs = BACKUP_INTERVALS[interval] || BACKUP_INTERVALS.daily;
  return new Date(Date.now() + intervalMs).toISOString();
}

/**
 * Check if backup is due
 */
export function isBackupDue() {
  const schedule = getBackupSchedule();
  if (!schedule.enabled || !schedule.nextBackup) {
    return false;
  }
  
  return new Date(schedule.nextBackup) <= new Date();
}

/**
 * Perform automated backup
 */
export async function performAutomatedBackup(dataTools, businessDetails) {
  try {
    if (!dataTools || typeof dataTools.exportLocalData !== "function") {
      throw new Error("Export function not available");
    }

    const rawData = dataTools.exportLocalData();
    const backup = {
      app: "CafeOS",
      backupVersion: "1.0.0",
      schemaVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      businessName: businessDetails?.name || "CafeOS",
      branchId: businessDetails?.branchId || null,
      dataMode: dataTools?.dataMode || "local",
      type: "automated",
      data: typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    };

    // Store backup in localStorage (in production, this would go to cloud storage)
    const backupKey = `cafeos_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    // Upload to cloud storage if configured
    const activeProvider = getActiveCloudProvider();
    if (activeProvider) {
      try {
        const cloudKey = `CafeOS/backups/${backupKey}.json`;
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const file = new File([blob], `${backupKey}.json`, { type: 'application/json' });
        await uploadToCloudStorage(file, cloudKey);
        console.log('[BackupScheduler] Backup uploaded to cloud:', activeProvider);
      } catch (cloudError) {
        console.error('[BackupScheduler] Cloud upload failed:', cloudError);
        // Continue with local backup even if cloud upload fails
      }
    }

    // Add to history
    addBackupToHistory({
      id: backupKey,
      size: JSON.stringify(backup).length,
      type: 'automated',
      cloudProvider: activeProvider || null,
      status: 'success'
    });

    // Update schedule
    const schedule = getBackupSchedule();
    schedule.lastBackup = new Date().toISOString();
    schedule.nextBackup = calculateNextBackup(schedule.interval);
    saveBackupSchedule(schedule);

    // Audit log
    const auditLog = createBackupAuditLog({
      userId: getCurrentUserId(),
      details: {
        type: 'automated',
        timestamp: new Date().toISOString(),
        businessName: businessDetails?.name,
        size: JSON.stringify(backup).length
      }
    });
    console.log('[BackupScheduler] Automated backup completed:', auditLog);

    return { success: true, backup };
  } catch (err) {
    console.error('[BackupScheduler] Automated backup failed:', err);
    
    // Log failed backup
    addBackupToHistory({
      id: null,
      size: 0,
      type: 'automated',
      status: 'failed',
      error: err.message
    });

    return { success: false, error: err.message };
  }
}

/**
 * Enable automated backups
 */
export function enableAutomatedBackups(interval = 'daily', retentionDays = DEFAULT_RETENTION_DAYS) {
  const schedule = {
    enabled: true,
    interval,
    retentionDays,
    lastBackup: null,
    nextBackup: calculateNextBackup(interval)
  };
  
  return saveBackupSchedule(schedule);
}

/**
 * Disable automated backups
 */
export function disableAutomatedBackups() {
  const schedule = getBackupSchedule();
  schedule.enabled = false;
  schedule.nextBackup = null;
  
  return saveBackupSchedule(schedule);
}

/**
 * Clean up old backups based on retention policy
 */
export function cleanupOldBackups() {
  const schedule = getBackupSchedule();
  const retentionMs = (schedule.retentionDays || DEFAULT_RETENTION_DAYS) * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  
  let cleanedCount = 0;
  
  // Clean up backup files in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cafeos_backup_')) {
      try {
        const backup = JSON.parse(localStorage.getItem(key));
        if (new Date(backup.createdAt).getTime() < cutoff) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (_e) {
        // Invalid backup, remove it
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  }
  
  // Clean up history
  const history = getBackupHistory();
  const filtered = history.filter(b => new Date(b.timestamp).getTime() > cutoff);
  saveBackupHistory(filtered);
  
  return cleanedCount;
}

/**
 * Get backup statistics
 */
export function getBackupStats() {
  const history = getBackupHistory();
  const schedule = getBackupSchedule();
  
  const successful = history.filter(b => b.status === 'success').length;
  const failed = history.filter(b => b.status === 'failed').length;
  const totalSize = history.reduce((sum, b) => sum + (b.size || 0), 0);
  
  return {
    enabled: schedule.enabled,
    interval: schedule.interval,
    retentionDays: schedule.retentionDays,
    lastBackup: schedule.lastBackup,
    nextBackup: schedule.nextBackup,
    totalBackups: history.length,
    successfulBackups: successful,
    failedBackups: failed,
    totalSize,
    averageSize: history.length > 0 ? totalSize / history.length : 0
  };
}
