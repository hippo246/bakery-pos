// Terminal Health
// Monitor CPU, memory, printer, cash drawer, barcode scanner, customer display, network, cloud sync, offline queue

import { now } from '../domain/dates.js';
import { getTerminalManager } from './terminalManager.js';

const HEALTH_DATA_KEY = 'cafeos_terminal_health';

/**
 * Health Status
 */
export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Peripheral Status
 */
export const PERIPHERAL_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Terminal Health class
 * Monitor CPU, memory, printer, cash drawer, barcode scanner, customer display, network, cloud sync, offline queue
 */
export class TerminalHealth {
  constructor() {
    this.healthData = new Map();
    this.loadHealthData();
    this.startMonitoring();
  }

  /**
   * Load health data from localStorage
   */
  loadHealthData() {
    try {
      const stored = localStorage.getItem(HEALTH_DATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.healthData) {
          data.healthData.forEach(health => {
            this.healthData.set(health.terminalId, health);
          });
        }
      }
    } catch (error) {
      console.error('[TerminalHealth] Failed to load health data:', error);
    }
  }

  /**
   * Save health data to localStorage
   */
  saveHealthData() {
    try {
      const healthData = Array.from(this.healthData.values());
      localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify({ healthData }));
    } catch (error) {
      console.error('[TerminalHealth] Failed to save health data:', error);
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    // Collect health data every 60 seconds
    setInterval(() => {
      this.collectHealthData();
    }, 60000);

    // Initial collection
    this.collectHealthData();
  }

  /**
   * Collect health data for all terminals
   */
  collectHealthData() {
    const terminalManager = getTerminalManager();
    const terminals = terminalManager.getAllTerminals();

    terminals.forEach(terminal => {
      const health = this.collectTerminalHealth(terminal);
      this.healthData.set(terminal.id, health);
    });

    this.saveHealthData();
  }

  /**
   * Collect health data for a single terminal
   * @param {Object} terminal - Terminal object
   * @returns {Object} Health data
   */
  collectTerminalHealth(terminal) {
    const existingHealth = this.healthData.get(terminal.id) || {};

    return {
      terminalId: terminal.id,
      terminalName: terminal.name,
      
      // Overall status
      overallStatus: this.calculateOverallStatus(terminal),
      
      // System resources
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      diskUsage: this.getDiskUsage(),
      
      // Peripherals
      printer: this.getPeripheralStatus('printer', existingHealth.printer),
      cashDrawer: this.getPeripheralStatus('cashDrawer', existingHealth.cashDrawer),
      barcodeScanner: this.getPeripheralStatus('barcodeScanner', existingHealth.barcodeScanner),
      customerDisplay: this.getPeripheralStatus('customerDisplay', existingHealth.customerDisplay),
      
      // Network
      networkStatus: this.getNetworkStatus(),
      networkLatency: this.getNetworkLatency(),
      cloudSyncStatus: this.getCloudSyncStatus(),
      lastSyncTime: this.getLastSyncTime(terminal),
      
      // Offline queue
      offlineQueueSize: this.getOfflineQueueSize(),
      offlineQueueOldest: this.getOfflineQueueOldest(),
      
      // Timestamps
      lastChecked: now(),
      lastUpdated: now()
    };
  }

  /**
   * Calculate overall health status
   * @param {Object} terminal - Terminal object
   * @returns {string} Overall status
   */
  calculateOverallStatus(terminal) {
    const existingHealth = this.healthData.get(terminal.id);
    if (!existingHealth) return HEALTH_STATUS.UNKNOWN;

    // Check critical indicators
    if (existingHealth.networkStatus === 'OFFLINE') return HEALTH_STATUS.CRITICAL;
    if (existingHealth.cpuUsage > 90) return HEALTH_STATUS.CRITICAL;
    if (existingHealth.memoryUsage > 90) return HEALTH_STATUS.CRITICAL;

    // Check warning indicators
    if (existingHealth.printer?.status === PERIPHERAL_STATUS.ERROR) return HEALTH_STATUS.WARNING;
    if (existingHealth.cashDrawer?.status === PERIPHERAL_STATUS.ERROR) return HEALTH_STATUS.WARNING;
    if (existingHealth.cpuUsage > 70) return HEALTH_STATUS.WARNING;
    if (existingHealth.memoryUsage > 70) return HEALTH_STATUS.WARNING;
    if (existingHealth.offlineQueueSize > 10) return HEALTH_STATUS.WARNING;

    return HEALTH_STATUS.HEALTHY;
  }

  /**
   * Get CPU usage (placeholder - in real implementation would use system APIs)
   * @returns {number} CPU usage percentage
   */
  getCpuUsage() {
    // Placeholder - in real implementation would use system APIs
    return Math.floor(Math.random() * 30) + 10;
  }

  /**
   * Get memory usage (placeholder - in real implementation would use system APIs)
   * @returns {number} Memory usage percentage
   */
  getMemoryUsage() {
    // Placeholder - in real implementation would use system APIs
    return Math.floor(Math.random() * 40) + 20;
  }

  /**
   * Get disk usage (placeholder - in real implementation would use system APIs)
   * @returns {number} Disk usage percentage
   */
  getDiskUsage() {
    // Placeholder - in real implementation would use system APIs
    return Math.floor(Math.random() * 50) + 30;
  }

  /**
   * Get peripheral status
   * @param {string} peripheralType - Peripheral type
   * @param {Object} existingStatus - Existing status
   * @returns {Object} Peripheral status
   */
  getPeripheralStatus(peripheralType, existingStatus = {}) {
    // Placeholder - in real implementation would check actual peripheral status
    return {
      status: PERIPHERAL_STATUS.ONLINE,
      lastChecked: now(),
      lastError: existingStatus.lastError || null,
      errorCount: existingStatus.errorCount || 0
    };
  }

  /**
   * Get network status
   * @returns {string} Network status
   */
  getNetworkStatus() {
    // Placeholder - in real implementation would check actual network status
    return 'ONLINE';
  }

  /**
   * Get network latency
   * @returns {number} Latency in milliseconds
   */
  getNetworkLatency() {
    // Placeholder - in real implementation would measure actual latency
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Get cloud sync status
   * @returns {string} Sync status
   */
  getCloudSyncStatus() {
    // Placeholder - in real implementation would check actual sync status
    return 'SYNCED';
  }

  /**
   * Get last sync time
   * @param {Object} terminal - Terminal object
   * @returns {number|null} Last sync timestamp
   */
  getLastSyncTime(terminal) {
    return terminal.lastSync || null;
  }

  /**
   * Get offline queue size
   * @returns {number} Queue size
   */
  getOfflineQueueSize() {
    // Placeholder - in real implementation would check actual offline queue
    return 0;
  }

  /**
   * Get offline queue oldest item
   * @returns {number|null} Oldest item timestamp
   */
  getOfflineQueueOldest() {
    // Placeholder - in real implementation would check actual offline queue
    return null;
  }

  /**
   * Get health data for terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object|null} Health data or null
   */
  getTerminalHealth(terminalId) {
    return this.healthData.get(terminalId) || null;
  }

  /**
   * Get all health data
   * @returns {Array} Array of health data
   */
  getAllHealthData() {
    return Array.from(this.healthData.values());
  }

  /**
   * Get health data by status
   * @param {string} status - Health status
   * @returns {Array} Array of health data
   */
  getHealthDataByStatus(status) {
    return this.getAllHealthData().filter(h => h.overallStatus === status);
  }

  /**
   * Get unhealthy terminals
   * @returns {Array} Array of unhealthy terminals
   */
  getUnhealthyTerminals() {
    return this.getAllHealthData().filter(h => 
      h.overallStatus === HEALTH_STATUS.WARNING || h.overallStatus === HEALTH_STATUS.CRITICAL
    );
  }

  /**
   * Get critical terminals
   * @returns {Array} Array of critical terminals
   */
  getCriticalTerminals() {
    return this.getHealthDataByStatus(HEALTH_STATUS.CRITICAL);
  }

  /**
   * Update peripheral status
   * @param {string} terminalId - Terminal ID
   * @param {string} peripheralType - Peripheral type
   * @param {string} status - New status
   * @param {string} error - Error message if any
   * @returns {Object} Result
   */
  updatePeripheralStatus(terminalId, peripheralType, status, error = null) {
    const health = this.healthData.get(terminalId);
    if (!health) {
      return { success: false, reason: 'Terminal health data not found' };
    }

    if (!health[peripheralType]) {
      health[peripheralType] = {};
    }

    health[peripheralType].status = status;
    health[peripheralType].lastChecked = now();
    
    if (error) {
      health[peripheralType].lastError = error;
      health[peripheralType].errorCount = (health[peripheralType].errorCount || 0) + 1;
    }

    // Recalculate overall status
    health.overallStatus = this.calculateOverallStatus({ id: terminalId });
    health.lastUpdated = now();

    this.healthData.set(terminalId, health);
    this.saveHealthData();

    return { success: true, health };
  }

  /**
   * Report peripheral error
   * @param {string} terminalId - Terminal ID
   * @param {string} peripheralType - Peripheral type
   * @param {string} error - Error message
   * @returns {Object} Result
   */
  reportPeripheralError(terminalId, peripheralType, error) {
    return this.updatePeripheralStatus(terminalId, peripheralType, PERIPHERAL_STATUS.ERROR, error);
  }

  /**
   * Update network status
   * @param {string} terminalId - Terminal ID
   * @param {string} status - Network status
   * @param {number} latency - Network latency
   * @returns {Object} Result
   */
  updateNetworkStatus(terminalId, status, latency = null) {
    const health = this.healthData.get(terminalId);
    if (!health) {
      return { success: false, reason: 'Terminal health data not found' };
    }

    health.networkStatus = status;
    if (latency !== null) {
      health.networkLatency = latency;
    }
    health.lastUpdated = now();

    // Recalculate overall status
    health.overallStatus = this.calculateOverallStatus({ id: terminalId });

    this.healthData.set(terminalId, health);
    this.saveHealthData();

    return { success: true, health };
  }

  /**
   * Update cloud sync status
   * @param {string} terminalId - Terminal ID
   * @param {string} status - Sync status
   * @returns {Object} Result
   */
  updateCloudSyncStatus(terminalId, status) {
    const health = this.healthData.get(terminalId);
    if (!health) {
      return { success: false, reason: 'Terminal health data not found' };
    }

    health.cloudSyncStatus = status;
    health.lastUpdated = now();

    this.healthData.set(terminalId, health);
    this.saveHealthData();

    return { success: true, health };
  }

  /**
   * Update offline queue info
   * @param {string} terminalId - Terminal ID
   * @param {number} queueSize - Queue size
   * @param {number} oldestTimestamp - Oldest item timestamp
   * @returns {Object} Result
   */
  updateOfflineQueue(terminalId, queueSize, oldestTimestamp = null) {
    const health = this.healthData.get(terminalId);
    if (!health) {
      return { success: false, reason: 'Terminal health data not found' };
    }

    health.offlineQueueSize = queueSize;
    if (oldestTimestamp !== null) {
      health.offlineQueueOldest = oldestTimestamp;
    }
    health.lastUpdated = now();

    // Recalculate overall status
    health.overallStatus = this.calculateOverallStatus({ id: terminalId });

    this.healthData.set(terminalId, health);
    this.saveHealthData();

    return { success: true, health };
  }

  /**
   * Get health summary
   * @returns {Object} Health summary
   */
  getHealthSummary() {
    const healthData = this.getAllHealthData();

    return {
      totalTerminals: healthData.length,
      healthy: healthData.filter(h => h.overallStatus === HEALTH_STATUS.HEALTHY).length,
      warning: healthData.filter(h => h.overallStatus === HEALTH_STATUS.WARNING).length,
      critical: healthData.filter(h => h.overallStatus === HEALTH_STATUS.CRITICAL).length,
      unknown: healthData.filter(h => h.overallStatus === HEALTH_STATUS.UNKNOWN).length,
      
      // Peripherals
      printerOnline: healthData.filter(h => h.printer?.status === PERIPHERAL_STATUS.ONLINE).length,
      printerError: healthData.filter(h => h.printer?.status === PERIPHERAL_STATUS.ERROR).length,
      cashDrawerOnline: healthData.filter(h => h.cashDrawer?.status === PERIPHERAL_STATUS.ONLINE).length,
      cashDrawerError: healthData.filter(h => h.cashDrawer?.status === PERIPHERAL_STATUS.ERROR).length,
      
      // Network
      networkOnline: healthData.filter(h => h.networkStatus === 'ONLINE').length,
      networkOffline: healthData.filter(h => h.networkStatus === 'OFFLINE').length,
      averageLatency: healthData.reduce((sum, h) => sum + (h.networkLatency || 0), 0) / healthData.length || 0,
      
      // Cloud sync
      cloudSynced: healthData.filter(h => h.cloudSyncStatus === 'SYNCED').length,
      cloudSyncing: healthData.filter(h => h.cloudSyncStatus === 'SYNCING').length,
      cloudOffline: healthData.filter(h => h.cloudSyncStatus === 'OFFLINE').length,
      
      // Offline queue
      totalOfflineItems: healthData.reduce((sum, h) => sum + (h.offlineQueueSize || 0), 0),
      terminalsWithOfflineQueue: healthData.filter(h => h.offlineQueueSize > 0).length
    };
  }

  /**
   * Get health trends
   * @param {string} terminalId - Terminal ID
   * @param {number} hours - Number of hours to analyze
   * @returns {Array} Array of health snapshots
   */
  getHealthTrends(terminalId, hours = 24) {
    // In a real implementation, this would return historical health data
    // For now, return current health as a single point
    const health = this.getTerminalHealth(terminalId);
    return health ? [health] : [];
  }

  /**
   * Export health data
   * @returns {Object} Exported health data
   */
  exportHealthData() {
    return {
      healthData: Array.from(this.healthData.values()),
      exportedAt: now()
    };
  }

  /**
   * Import health data
   * @param {Object} data - Imported health data
   * @returns {Object} Import result
   */
  importHealthData(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.healthData)) {
        data.healthData.forEach(health => {
          this.healthData.set(health.terminalId, health);
        });
      }

      this.saveHealthData();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let terminalHealthInstance = null;

/**
 * Get the terminal health singleton
 * @returns {TerminalHealth} Terminal health instance
 */
export function getTerminalHealth() {
  if (!terminalHealthInstance) {
    terminalHealthInstance = new TerminalHealth();
  }
  return terminalHealthInstance;
}

/**
 * Reset the terminal health (useful for testing)
 */
export function resetTerminalHealth() {
  terminalHealthInstance = null;
}

/**
 * Convenience function to get terminal health
 * @param {string} terminalId - Terminal ID
 * @returns {Object|null} Health data or null
 */
export function getTerminalHealthData(terminalId) {
  const health = getTerminalHealth();
  return health.getTerminalHealth(terminalId);
}

/**
 * Convenience function to report peripheral error
 * @param {string} terminalId - Terminal ID
 * @param {string} peripheralType - Peripheral type
 * @param {string} error - Error message
 * @returns {Object} Result
 */
export function reportPeripheralError(terminalId, peripheralType, error) {
  const health = getTerminalHealth();
  return health.reportPeripheralError(terminalId, peripheralType, error);
}
