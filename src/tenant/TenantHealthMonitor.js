// Tenant Health Monitor
// Monitors health status for tenants

import { getTenantRegistry } from './TenantRegistry.js';
import { getTenantAuditLogger } from './TenantAuditLogger.js';
import { TenantHealthStatus } from './TenantTypes.js';

export class TenantHealthMonitor {
  constructor() {
    this.tenantRegistry = getTenantRegistry();
    this.auditLogger = getTenantAuditLogger();
    this.healthCache = new Map();
    this.cacheTTL = 300000; // 5 minutes cache
  }

  /**
   * Get tenant health status
   * @param {string} tenantId - Tenant ID
   * @returns {object} Health status
   */
  getTenantHealth(tenantId) {
    const cacheKey = tenantId;
    
    // Check cache
    if (this.healthCache.has(cacheKey)) {
      const cached = this.healthCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.health;
      }
    }

    const tenant = this.tenantRegistry.getTenant(tenantId);
    
    if (!tenant) {
      return {
        status: TenantHealthStatus.UNKNOWN,
        reason: 'Tenant not found'
      };
    }

    // Perform health checks
    const health = {
      status: TenantHealthStatus.HEALTHY,
      tenantId,
      databaseHealth: this.checkDatabaseHealth(tenant),
      storageHealth: this.checkStorageHealth(tenant),
      cloudHealth: this.checkCloudHealth(tenant),
      backupHealth: this.checkBackupHealth(tenant),
      syncHealth: this.checkSyncHealth(tenant),
      securityScore: this.checkSecurityScore(tenant),
      lastActivity: tenant.metadata.lastActivity || new Date().toISOString(),
      checkedAt: new Date().toISOString()
    };

    // Determine overall status
    const healthChecks = [
      health.databaseHealth,
      health.storageHealth,
      health.cloudHealth,
      health.backupHealth,
      health.syncHealth
    ];

    const degradedCount = healthChecks.filter(h => h === 'degraded').length;
    const unhealthyCount = healthChecks.filter(h => h === 'unhealthy').length;

    if (unhealthyCount > 0) {
      health.status = TenantHealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      health.status = TenantHealthStatus.DEGRADED;
    }

    // Cache result
    this.healthCache.set(cacheKey, {
      timestamp: Date.now(),
      health
    });

    return health;
  }

  /**
   * Check database health
   * @param {object} tenant - Tenant
   * @returns {string} Health status
   */
  checkDatabaseHealth(_tenant) {
    // Placeholder for database health check
    // In production would check actual database connectivity and performance
    return 'healthy';
  }

  /**
   * Check storage health
   * @param {object} tenant - Tenant
   * @returns {string} Health status
   */
  checkStorageHealth(_tenant) {
    // Placeholder for storage health check
    // In production would check storage connectivity and quota
    return 'healthy';
  }

  /**
   * Check cloud health
   * @param {object} tenant - Tenant
   * @returns {string} Health status
   */
  checkCloudHealth(_tenant) {
    // Placeholder for cloud health check
    // In production would check cloud provider connectivity
    return 'healthy';
  }

  /**
   * Check backup health
   * @param {object} tenant - Tenant
   * @returns {string} Health status
   */
  checkBackupHealth(_tenant) {
    // Placeholder for backup health check
    // In production would check backup schedule and recent backups
    return 'healthy';
  }

  /**
   * Check sync health
   * @param {object} tenant - Tenant
   * @returns {string} Health status
   */
  checkSyncHealth(tenant) {
    // Placeholder for sync health check
    // In production would check synchronization status
    if (!tenant.config.sync) {
      return 'healthy'; // Not enabled, considered healthy
    }
    return 'healthy';
  }

  /**
   * Check security score
   * @param {object} tenant - Tenant
   * @returns {number} Security score (0-100)
   */
  checkSecurityScore(_tenant) {
    // Placeholder for security score calculation
    // In production would check security engine
    return 85;
  }

  /**
   * Get health for all tenants
   * @returns {Array} Health statuses
   */
  getAllTenantsHealth() {
    const tenants = this.tenantRegistry.getAllTenants();
    return tenants.map(tenant => this.getTenantHealth(tenant.tenantId));
  }

  /**
   * Get health statistics
   * @returns {object} Health statistics
   */
  getHealthStatistics() {
    const allHealth = this.getAllTenantsHealth();
    const total = allHealth.length;

    const byStatus = {};
    allHealth.forEach(health => {
      byStatus[health.status] = (byStatus[health.status] || 0) + 1;
    });

    const healthy = byStatus[TenantHealthStatus.HEALTHY] || 0;
    const degraded = byStatus[TenantHealthStatus.DEGRADED] || 0;
    const unhealthy = byStatus[TenantHealthStatus.UNHEALTHY] || 0;
    const unknown = byStatus[TenantHealthStatus.UNKNOWN] || 0;

    return {
      total,
      healthy,
      degraded,
      unhealthy,
      unknown,
      healthPercentage: total > 0 ? Math.round((healthy / total) * 100) : 0
    };
  }

  /**
   * Run health check for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {object} Health check result
   */
  runHealthCheck(tenantId) {
    const health = this.getTenantHealth(tenantId);
    
    if (health.status === TenantHealthStatus.UNHEALTHY) {
      this.auditLogger.logHealthCheckFailed({
        tenantId,
        checkType: 'overall',
        reason: 'Overall health status is unhealthy'
      });
    }

    return health;
  }

  /**
   * Clear health cache
   */
  clearCache() {
    this.healthCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStatistics() {
    return {
      size: this.healthCache.size,
      ttl: this.cacheTTL
    };
  }

  /**
   * Destroy the tenant health monitor
   */
  destroy() {
    this.clearCache();
    console.log('[TenantHealthMonitor] Destroyed');
  }
}

// Singleton instance
let tenantHealthMonitorInstance = null;

/**
 * Get the singleton tenant health monitor instance
 * @returns {TenantHealthMonitor} Tenant health monitor instance
 */
export function getTenantHealthMonitor() {
  if (!tenantHealthMonitorInstance) {
    tenantHealthMonitorInstance = new TenantHealthMonitor();
  }
  return tenantHealthMonitorInstance;
}

export default TenantHealthMonitor;
