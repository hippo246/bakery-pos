// System Health Monitor
// Monitors health of all CafeOS systems

import { SystemHealthStatus, MonitoredSystem } from './OperationsTypes.js';

export class SystemHealthMonitor {
  constructor() {
    this.systemHealth = new Map();
    this.healthCheckCallbacks = new Map();
    this.initializeSystemHealth();
  }

  /**
   * Initialize system health
   */
  initializeSystemHealth() {
    Object.values(MonitoredSystem).forEach(system => {
      this.systemHealth.set(system, {
        system,
        status: SystemHealthStatus.UNKNOWN,
        reason: 'Not yet checked',
        lastChecked: null,
        lastHealthy: null,
        consecutiveFailures: 0
      });
    });
  }

  /**
   * Check system health
   * @param {string} system - System to check
   * @returns {object} Health status
   */
  checkSystemHealth(system) {
    const health = this.systemHealth.get(system);
    
    if (!health) {
      return {
        system,
        status: SystemHealthStatus.UNKNOWN,
        reason: 'Unknown system'
      };
    }

    // Execute health check callback if available
    const callback = this.healthCheckCallbacks.get(system);
    let checkResult = { status: SystemHealthStatus.HEALTHY, reason: 'Check passed' };

    if (callback) {
      try {
        checkResult = callback();
      } catch (error) {
        checkResult = {
          status: SystemHealthStatus.CRITICAL,
          reason: `Health check failed: ${error.message}`
        };
      }
    }

    // Update health
    health.status = checkResult.status;
    health.reason = checkResult.reason;
    health.lastChecked = new Date().toISOString();

    if (checkResult.status === SystemHealthStatus.HEALTHY) {
      health.lastHealthy = new Date().toISOString();
      health.consecutiveFailures = 0;
    } else {
      health.consecutiveFailures++;
    }

    this.systemHealth.set(system, health);

    return health;
  }

  /**
   * Check all systems
   * @returns {object} Overall health
   */
  checkAllSystems() {
    const results = {};
    let overallStatus = SystemHealthStatus.HEALTHY;

    Object.values(MonitoredSystem).forEach(system => {
      const health = this.checkSystemHealth(system);
      results[system] = health;

      if (health.status === SystemHealthStatus.CRITICAL || health.status === SystemHealthStatus.OFFLINE) {
        overallStatus = SystemHealthStatus.CRITICAL;
      } else if (health.status === SystemHealthStatus.WARNING && overallStatus !== SystemHealthStatus.CRITICAL) {
        overallStatus = SystemHealthStatus.WARNING;
      }
    });

    return {
      overallStatus,
      systems: results,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Get system health
   * @param {string} system - System
   * @returns {object} Health status
   */
  getSystemHealth(system) {
    return this.systemHealth.get(system) || null;
  }

  /**
   * Get all system health
   * @returns {object} All health statuses
   */
  getAllSystemHealth() {
    return Object.fromEntries(this.systemHealth);
  }

  /**
   * Register health check callback
   * @param {string} system - System
   * @param {function} callback - Health check callback
   */
  registerHealthCheck(system, callback) {
    this.healthCheckCallbacks.set(system, callback);
  }

  /**
   * Get health statistics
   * @returns {object} Statistics
   */
  getHealthStatistics() {
    const allHealth = Array.from(this.systemHealth.values());
    const total = allHealth.length;

    const byStatus = {};
    allHealth.forEach(health => {
      byStatus[health.status] = (byStatus[health.status] || 0) + 1;
    });

    const healthy = byStatus[SystemHealthStatus.HEALTHY] || 0;
    const warning = byStatus[SystemHealthStatus.WARNING] || 0;
    const critical = byStatus[SystemHealthStatus.CRITICAL] || 0;
    const offline = byStatus[SystemHealthStatus.OFFLINE] || 0;

    return {
      total,
      healthy,
      warning,
      critical,
      offline,
      healthPercentage: total > 0 ? Math.round((healthy / total) * 100) : 0
    };
  }

  /**
   * Set system status manually
   * @param {string} system - System
   * @param {string} status - Status
   * @param {string} reason - Reason
   */
  setSystemStatus(system, status, reason = '') {
    const health = this.systemHealth.get(system);
    
    if (health) {
      health.status = status;
      health.reason = reason;
      health.lastChecked = new Date().toISOString();
      
      if (status === SystemHealthStatus.HEALTHY) {
        health.lastHealthy = new Date().toISOString();
        health.consecutiveFailures = 0;
      } else {
        health.consecutiveFailures++;
      }

      this.systemHealth.set(system, health);
    }
  }

  /**
   * Reset system health
   * @param {string} system - System
   */
  resetSystemHealth(system) {
    const health = this.systemHealth.get(system);
    
    if (health) {
      health.status = SystemHealthStatus.UNKNOWN;
      health.reason = 'Reset';
      health.consecutiveFailures = 0;
      this.systemHealth.set(system, health);
    }
  }

  /**
   * Destroy the system health monitor
   */
  destroy() {
    this.systemHealth.clear();
    this.healthCheckCallbacks.clear();
    console.log('[SystemHealthMonitor] Destroyed');
  }
}

// Singleton instance
let systemHealthMonitorInstance = null;

/**
 * Get the singleton system health monitor instance
 * @returns {SystemHealthMonitor} System health monitor instance
 */
export function getSystemHealthMonitor() {
  if (!systemHealthMonitorInstance) {
    systemHealthMonitorInstance = new SystemHealthMonitor();
  }
  return systemHealthMonitorInstance;
}

export default SystemHealthMonitor;
