// Storage Recovery for CafeOS
// Handles localStorage corruption detection and recovery

const STORAGE_PREFIX = 'brewcrm_local_';
const CORRUPTION_KEY = 'cafeos_storage_corruption_detected';
const BACKUP_KEY = 'cafeos_storage_backup';

/**
 * Check for localStorage corruption
 * @returns {object} { corrupted:.boolean, issues:array, recoverable:boolean }
 */
export function checkStorageCorruption() {
  const issues = [];
  let corrupted = false;

  try {
    // Test localStorage availability
    const testKey = '__cafeos_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (err) {
    issues.push({
      type: 'unavailable',
      message: 'localStorage is not available',
      error: err.message
    });
    return { corrupted: true, issues, recoverable: false };
  }

  // Check for quota exceeded
  try {
    const testKey = '__cafeos_quota_test__';
    const testData = 'x'.repeat(1024 * 1024); // 1MB
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      issues.push({
        type: 'quota',
        message: 'localStorage quota exceeded',
        error: err.message
      });
      corrupted = true;
    }
  }

  // Check for corrupted data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (!key.startsWith(STORAGE_PREFIX) && !key.includes('cafeos')) return;

    try {
      const value = localStorage.getItem(key);
      if (value) {
        JSON.parse(value);
      }
    } catch (err) {
      issues.push({
        type: 'corrupted_data',
        key,
        message: `Corrupted data in ${key}`,
        error: err.message
      });
      corrupted = true;
    }
  });

  // Check for previously detected corruption
  const previousCorruption = localStorage.getItem(CORRUPTION_KEY);
  if (previousCorruption) {
    try {
      const corruptionData = JSON.parse(previousCorruption);
      if (corruptionData.detected) {
        issues.push({
          type: 'previous',
          message: 'Previous corruption detected but not recovered',
          timestamp: corruptionData.timestamp
        });
        corrupted = true;
      }
    } catch (_e) {
      // Ignore parse errors
    }
  }

  return {
    corrupted,
    issues,
    recoverable: issues.some(i => i.type === 'corrupted_data')
  };
}

/**
 * Create emergency backup of localStorage
 * @returns {boolean} Success
 */
export function createEmergencyBackup() {
  try {
    const backup = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) || key.includes('cafeos')) {
        backup[key] = localStorage.getItem(key);
      }
    });

    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backup
    }));

    return true;
  } catch (_err) {
    console.error('[StorageRecovery] Failed to create emergency backup');
    return false;
  }
}

/**
 * Restore from emergency backup
 * @returns {boolean} Success
 */
export function restoreEmergencyBackup() {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) return false;

    const backup = JSON.parse(backupStr);
    if (!backup.data) return false;

    // Clear existing data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) || key.includes('cafeos')) {
        localStorage.removeItem(key);
      }
    });

    // Restore from backup
    Object.keys(backup.data).forEach(key => {
      localStorage.setItem(key, backup.data[key]);
    });

    // Clear corruption flag
    localStorage.removeItem(CORRUPTION_KEY);

    return true;
  } catch (err) {
    console.error('[StorageRecovery] Failed to restore from backup:', err);
    return false;
  }
}

/**
 * Mark corruption as detected
 */
export function markCorruptionDetected() {
  try {
    localStorage.setItem(CORRUPTION_KEY, JSON.stringify({
      detected: true,
      timestamp: new Date().toISOString()
    }));
  } catch (err) {
    console.error('[StorageRecovery] Failed to mark corruption:', err);
  }
}

/**
 * Clear corruption flag
 */
export function clearCorruptionFlag() {
  try {
    localStorage.removeItem(CORRUPTION_KEY);
  } catch (err) {
    console.error('[StorageRecovery] Failed to clear corruption flag:', err);
  }
}

/**
 * Attempt to recover corrupted storage
 * @returns {object} { success:boolean, recovered:array, failed:array }
 */
export function attemptRecovery() {
  const result = {
    success: false,
    recovered: [],
    failed: []
  };

  try {
    const check = checkStorageCorruption();
    
    if (!check.corrupted) {
      result.success = true;
      return result;
    }

    // Create emergency backup before attempting recovery
    createEmergencyBackup();

    // Try to recover corrupted data
    check.issues.forEach(issue => {
      if (issue.type === 'corrupted_data' && issue.key) {
        try {
          // Try to salvage partial data
          const value = localStorage.getItem(issue.key);
          if (value) {
            // Try to extract valid JSON from corrupted string
            const validJson = extractValidJSON(value);
            if (validJson) {
              localStorage.setItem(issue.key, validJson);
              result.recovered.push(issue.key);
            } else {
              // Remove completely corrupted data
              localStorage.removeItem(issue.key);
              result.failed.push(issue.key);
            }
          }
        } catch (_err) {
          result.failed.push(issue.key);
        }
      }
    });

    // If quota exceeded, try to clear old data
    if (check.issues.some(i => i.type === 'quota')) {
      try {
        // Clear non-essential data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('audit') || key.includes('log')) {
            localStorage.removeItem(key);
            result.recovered.push(key);
          }
        });
      } catch (err) {
        console.error('[StorageRecovery] Failed to clear quota:', err);
      }
    }

    result.success = result.recovered.length > 0 || result.failed.length === 0;
    
    if (result.success) {
      clearCorruptionFlag();
    }

    return result;
  } catch (err) {
    console.error('[StorageRecovery] Recovery failed:', err);
    return result;
  }
}

/**
 * Extract valid JSON from corrupted string
 */
function extractValidJSON(str) {
  try {
    // Try direct parse first
    JSON.parse(str);
    return str;
  } catch (_e) {
    // Parse failed, try extraction
  }

  // Try to find JSON boundaries
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      const jsonStr = str.substring(firstBrace, lastBrace + 1);
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (_e) {
      // Extraction failed
    }
  }

  return null;
}

/**
 * Get storage usage information
 * @returns {object} Storage usage stats
 */
export function getStorageUsage() {
  try {
    let totalSize = 0;
    const itemCounts = {};
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const size = (value || '').length * 2; // UTF-16 uses 2 bytes per char
      totalSize += size;

      // Categorize
      if (key.startsWith(STORAGE_PREFIX)) {
        const category = key.replace(STORAGE_PREFIX, '');
        itemCounts[category] = (itemCounts[category] || 0) + 1;
      }
    });

    // Estimate quota (typically 5MB for localStorage)
    const estimatedQuota = 5 * 1024 * 1024;
    const usagePercent = (totalSize / estimatedQuota) * 100;

    return {
      totalSize,
      estimatedQuota,
      usagePercent,
      itemCounts,
      itemCount: keys.length
    };
  } catch (err) {
    console.error('[StorageRecovery] Failed to get storage usage:', err);
    return {
      totalSize: 0,
      estimatedQuota: 5 * 1024 * 1024,
      usagePercent: 0,
      itemCounts: {},
      itemCount: 0
    };
  }
}

/**
 * Clear old audit logs to free space
 * @param {number} daysToKeep - Days of logs to keep
 * @returns {number} Number of logs cleared
 */
export function clearOldAuditLogs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  let cleared = 0;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('audit') || key.includes('log')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (Array.isArray(data)) {
              const filtered = data.filter(item => {
                const itemDate = new Date(item.timestamp || item.createdAt);
                return itemDate > cutoffDate;
              });
              
              if (filtered.length < data.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
                cleared += data.length - filtered.length;
              }
            }
          }
        } catch (_e) {
          // Ignore individual key errors
        }
      }
    });
  } catch (err) {
    console.error('[StorageRecovery] Failed to clear old logs:', err);
  }

  return cleared;
}

export default {
  checkStorageCorruption,
  createEmergencyBackup,
  restoreEmergencyBackup,
  markCorruptionDetected,
  clearCorruptionFlag,
  attemptRecovery,
  getStorageUsage,
  clearOldAuditLogs
};
