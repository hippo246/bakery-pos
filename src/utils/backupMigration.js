// Backup Migration for CafeOS
// Handles migration between different backup versions

const MIGRATIONS = {
  '1.0.0': {
    to: '1.1.0',
    migrate: (backup) => {
      // Add new fields for version 1.1.0
      const migrated = { ...backup };
      migrated.backupVersion = '1.1.0';
      migrated.schemaVersion = '1.1.0';
      
      // Ensure all collections exist
      const requiredCollections = ['orders', 'customers', 'kdsCards', 'menuItems', 'tables', 'staff', 'deliveryOrders', 'inventory', 'expenses', 'qrCodes', 'productionBatches', 'drivers', 'routes', 'guestSessions', 'waiterCalls', 'suppliers', 'purchaseOrders', 'documents'];
      
      if (!migrated.data) migrated.data = {};
      
      requiredCollections.forEach(key => {
        if (!migrated.data[key]) {
          migrated.data[key] = [];
        }
      });

      // Add metadata if missing
      if (!migrated.businessName) migrated.businessName = 'Unknown';
      if (!migrated.branchId) migrated.branchId = null;
      
      return migrated;
    }
  }
};

/**
 * Migrate backup to latest version
 * @param {object} backup - Backup object
 * @returns {object} Migrated backup
 */
export function migrateBackup(backup) {
  if (!backup || !backup.backupVersion) {
    // Very old backup, try to normalize
    return normalizeLegacyBackup(backup);
  }

  let currentBackup = { ...backup };
  const targetVersion = '1.1.0';

  while (currentBackup.backupVersion !== targetVersion) {
    const migration = MIGRATIONS[currentBackup.backupVersion];
    
    if (!migration) {
      console.warn(`[BackupMigration] No migration path from ${currentBackup.backupVersion} to ${targetVersion}`);
      break;
    }

    try {
      currentBackup = migration.migrate(currentBackup);
      console.log(`[BackupMigration] Migrated from ${backup.backupVersion} to ${currentBackup.backupVersion}`);
    } catch (err) {
      console.error(`[BackupMigration] Migration failed:`, err);
      break;
    }
  }

  return currentBackup;
}

/**
 * Normalize legacy backup format
 */
function normalizeLegacyBackup(backup) {
  const normalized = {
    app: backup.app || 'BrewCRM',
    backupVersion: '1.0.0',
    schemaVersion: '1.0.0',
    createdAt: backup.exportedAt || backup.createdAt || new Date().toISOString(),
    businessName: 'Unknown',
    branchId: null,
    dataMode: backup.dataMode || 'local',
    modules: [],
    recordCounts: {},
    checksum: null,
    data: backup.collections || backup.data || {}
  };

  // Calculate record counts
  Object.keys(normalized.data).forEach(key => {
    if (Array.isArray(normalized.data[key])) {
      normalized.recordCounts[key] = normalized.data[key].length;
      normalized.modules.push(key);
    }
  });

  // Simple checksum
  normalized.checksum = JSON.stringify(normalized.data).length;

  return normalized;
}

/**
 * Check if backup needs migration
 * @param {object} backup - Backup object
 * @returns {boolean} True if migration needed
 */
export function needsMigration(backup) {
  if (!backup || !backup.backupVersion) return true;
  return backup.backupVersion !== '1.1.0';
}

/**
 * Get migration path
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {array} Array of version steps
 */
export function getMigrationPath(fromVersion, toVersion = '1.1.0') {
  const path = [];
  let current = fromVersion;

  while (current !== toVersion) {
    const migration = MIGRATIONS[current];
    if (!migration) break;
    
    path.push({
      from: current,
      to: migration.to
    });
    
    current = migration.to;
  }

  return path;
}

export default {
  migrateBackup,
  needsMigration,
  getMigrationPath,
  normalizeLegacyBackup
};
