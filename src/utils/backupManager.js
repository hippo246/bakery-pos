/**
 * Backup Manager
 * Provides data persistence strategy and backup mechanism for localStorage data
 */

const BACKUP_PREFIX = 'cafeos_backup_';
const BACKUP_VERSION = '1.0';
const MAX_BACKUPS = 5;

/**
 * Create a backup of all CafeOS data
 */
export function createBackup() {
  try {
    const backup = {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Backup all CafeOS localStorage keys
    const keysToBackup = [
      'cafeos_orders',
      'cafeos_customers',
      'cafeos_staff',
      'cafeos_tables',
      'cafeos_menu',
      'cafeos_inventory',
      'cafeos_settings',
      'cafeos_kds_tickets',
      'cafeos_delivery_orders',
      'cafeos_drivers',
      'cafeos_suppliers',
      'cafeos_purchase_orders',
      'cafeos_production_batches',
      'cafeos_documents',
      'cafeos_expenses',
      'cafeos_qr_codes'
    ];

    keysToBackup.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backup.data[key] = JSON.parse(data);
        } catch (e) {
          console.error(`[BackupManager] Failed to parse ${key}:`, e);
          backup.data[key] = null;
        }
      }
    });

    // Generate backup ID
    const backupId = `${BACKUP_PREFIX}${Date.now()}`;
    
    // Save backup
    localStorage.setItem(backupId, JSON.stringify(backup));

    // Clean old backups
    cleanupOldBackups();

    return {
      success: true,
      backupId,
      timestamp: backup.timestamp,
      size: JSON.stringify(backup).length
    };
  } catch (error) {
    console.error('[BackupManager] Failed to create backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Restore data from a backup
 */
export function restoreBackup(backupId) {
  try {
    const backupData = localStorage.getItem(backupId);
    if (!backupData) {
      return {
        success: false,
        error: 'Backup not found'
      };
    }

    const backup = JSON.parse(backupData);

    // Validate backup structure
    if (!backup.version || !backup.timestamp || !backup.data) {
      return {
        success: false,
        error: 'Invalid backup format'
      };
    }

    // Restore each key
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      backupTimestamp: backup.timestamp,
      version: backup.version
    };
  } catch (error) {
    console.error('[BackupManager] Failed to restore backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all available backups
 */
export function listBackups() {
  try {
    const backups = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          backups.push({
            id: key,
            timestamp: data.timestamp,
            version: data.version,
            size: JSON.stringify(data).length
          });
        } catch (e) {
          console.error(`[BackupManager] Failed to parse backup ${key}:`, e);
        }
      }
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return backups;
  } catch (error) {
    console.error('[BackupManager] Failed to list backups:', error);
    return [];
  }
}

/**
 * Delete a specific backup
 */
export function deleteBackup(backupId) {
  try {
    localStorage.removeItem(backupId);
    return { success: true };
  } catch (error) {
    console.error('[BackupManager] Failed to delete backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean old backups (keep only MAX_BACKUPS most recent)
 */
export function cleanupOldBackups() {
  try {
    const backups = listBackups();
    
    if (backups.length > MAX_BACKUPS) {
      const backupsToDelete = backups.slice(MAX_BACKUPS);
      backupsToDelete.forEach(backup => {
        deleteBackup(backup.id);
      });
      
      return {
        success: true,
        deleted: backupsToDelete.length
      };
    }

    return {
      success: true,
      deleted: 0
    };
  } catch (error) {
    console.error('[BackupManager] Failed to cleanup old backups:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Export backup as JSON file
 */
export function exportBackup(backupId = null) {
  try {
    let backupData;
    
    if (backupId) {
      backupData = localStorage.getItem(backupId);
      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }
    } else {
      // Create a new backup and export it
      const result = createBackup();
      if (!result.success) {
        return result;
      }
      backupData = localStorage.getItem(result.backupId);
    }

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafeos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true
    };
  } catch (error) {
    console.error('[BackupManager] Failed to export backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import backup from JSON file
 */
export function importBackup(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupData = e.target.result;
        const backup = JSON.parse(backupData);
        
        // Validate backup structure
        if (!backup.version || !backup.timestamp || !backup.data) {
          resolve({
            success: false,
            error: 'Invalid backup format'
          });
          return;
        }

        // Generate backup ID
        const backupId = `${BACKUP_PREFIX}${Date.now()}`;
        localStorage.setItem(backupId, backupData);

        // Restore the data
        const restoreResult = restoreBackup(backupId);
        
        resolve(restoreResult);
      } catch (error) {
        console.error('[BackupManager] Failed to import backup:', error);
        resolve({
          success: false,
          error: error.message
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file'
      });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Auto-backup on data changes
 */
export function setupAutoBackup(interval = 300000) { // Default: 5 minutes
  let backupInterval;

  const startAutoBackup = () => {
    backupInterval = setInterval(() => {
      createBackup();
    }, interval);
  };

  const stopAutoBackup = () => {
    if (backupInterval) {
      clearInterval(backupInterval);
    }
  };

  return {
    start: startAutoBackup,
    stop: stopAutoBackup
  };
}

/**
 * Get backup statistics
 */
export function getBackupStats() {
  try {
    const backups = listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    return {
      count: backups.length,
      totalSize,
      oldest: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newest: backups.length > 0 ? backups[0].timestamp : null
    };
  } catch (error) {
    console.error('[BackupManager] Failed to get backup stats:', error);
    return {
      count: 0,
      totalSize: 0,
      oldest: null,
      newest: null
    };
  }
}
