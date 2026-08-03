// Health Engine
// Central orchestrator for all health checks in the system

import healthRegistry from './HealthRegistry.js';
import { HealthCheckResult, ComponentHealthReport, SystemHealthSummary, HealthState, HealthHistoryEntry, HealthAlert } from './HealthTypes.js';
import diagnosticsEngine from '../diagnostics/DiagnosticsEngine.js';
import incidentManager from '../diagnostics/IncidentManager.js';
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

/**
 * Health Engine - Central orchestrator for all health checks
 */
class HealthEngine {
  constructor() {
    this.cache = new Map(); // componentId -> { result, timestamp }
    this.cacheTTL = 30000; // 30 seconds cache TTL
    this.history = []; // Health history entries
    this.alerts = []; // Active alerts
    this.maxHistoryEntries = 1000;
    this.isInitialized = false;
  }

  /**
   * Initialize the health engine
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[HealthEngine] Already initialized');
      return;
    }

    console.log('[HealthEngine] Initializing...');
    
    // Initialize Diagnostics Engine
    try {
      await diagnosticsEngine.initialize();
      console.log('[HealthEngine] Diagnostics Engine initialized');
    } catch (error) {
      console.error('[HealthEngine] Failed to initialize Diagnostics Engine:', error);
    }
    
    this.isInitialized = true;
    console.log('[HealthEngine] Initialized successfully');
  }

  /**
   * Perform health check for a specific component
   * @param {string} componentId - Component identifier
   * @param {boolean} forceRefresh - Force refresh, bypass cache
   * @returns {Promise<HealthCheckResult>}
   */
  async checkComponent(componentId, forceRefresh = false) {
    const provider = healthRegistry.getProvider(componentId);
    if (!provider) {
      return new HealthCheckResult({
        status: HealthState.UNKNOWN,
        reason: 'Component not registered in health registry',
        healthScore: 0
      });
    }

    const config = healthRegistry.getConfig(componentId);
    if (!config?.enabled) {
      return new HealthCheckResult({
        status: HealthState.MAINTENANCE,
        reason: 'Health check disabled',
        healthScore: 50
      });
    }

    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(componentId);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        return cached.result;
      }
    }

    // Perform health check
    const startTime = performance.now();
    let result;
    try {
      result = await Promise.race([
        provider.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), config?.timeout || 10000)
        )
      ]);

      // Add response time
      result.responseTime = performance.now() - startTime;
      result.latency = result.responseTime;

      // Add version if available
      if (!result.version) {
        result.version = provider.getVersion();
      }

      // Cache result
      this.cache.set(componentId, {
        result,
        timestamp: Date.now()
      });

      // Add to history
      this.addToHistory(componentId, result, result.responseTime);

      // Check for alerts
      this.checkForAlerts(componentId, result, config);

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishHealthEvent('health.checked', {
        componentId: componentId,
        status: result.status,
        healthScore: result.healthScore,
        latency: result.latency,
        responseTime: result.responseTime
      });

      // Integrate with Diagnostics Engine for critical issues
      if (result.status === HealthState.CRITICAL || result.status === HealthState.OFFLINE) {
        try {
          // Check if incident already exists for this component
          const existingIncidents = await incidentManager.getActiveIncidents();
          const hasActiveIncident = existingIncidents.some(inc => 
            inc.component === componentId && 
            inc.status !== 'resolved' && 
            inc.status !== 'closed'
          );

          if (!hasActiveIncident) {
            await diagnosticsEngine.createIncident({
              component: componentId,
              severity: result.status === HealthState.OFFLINE ? 'emergency' : 'critical',
              issue: result.reason,
              metadata: {
                healthStatus: result.status,
                healthScore: result.healthScore,
                latency: result.latency
              }
            });
          }

          // Publish event for critical health state
          moduleEventPublisher.publishHealthEvent('health.critical', {
            componentId: componentId,
            status: result.status,
            healthScore: result.healthScore,
            reason: result.reason
          });
        } catch (error) {
          console.error('[HealthEngine] Failed to create incident:', error);
        }
      }

      // Publish event for warning state
      if (result.status === HealthState.WARNING) {
        moduleEventPublisher.publishHealthEvent('health.warning', {
          componentId: componentId,
          healthScore: result.healthScore,
          reason: result.reason
        });
      }

      // Publish event for recovery
      if (result.status === HealthState.HEALTHY) {
        const previousResult = this.cache.get(componentId)?.result;
        if (previousResult && previousResult.status !== HealthState.HEALTHY) {
          moduleEventPublisher.publishHealthEvent('health.recovered', {
            componentId: componentId,
            previousStatus: previousResult.status,
            healthScore: result.healthScore
          });
        }
      }

      // Record performance metric
      if (result.latency) {
        await diagnosticsEngine.recordPerformanceMetric(
          `${componentId}_latency`,
          result.latency,
          { component: componentId }
        );
      }

    } catch (error) {
      result = new HealthCheckResult({
        status: HealthState.CRITICAL,
        reason: `Health check failed: ${error.message}`,
        healthScore: 0,
        responseTime: performance.now() - startTime,
        recommendedAction: 'Check component logs and configuration'
      });

      this.cache.set(componentId, {
        result,
        timestamp: Date.now()
      });

      this.addToHistory(componentId, result, result.responseTime);
    }

    return result;
  }

  /**
   * Perform health check for multiple components
   * @param {string[]} componentIds - Component identifiers
   * @param {boolean} forceRefresh - Force refresh, bypass cache
   * @returns {Promise<Map<string, HealthCheckResult>>}
   */
  async checkComponents(componentIds, forceRefresh = false) {
    const results = new Map();
    const promises = componentIds.map(async (componentId) => {
      const result = await this.checkComponent(componentId, forceRefresh);
      results.set(componentId, result);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Perform health check for all registered components
   * @param {boolean} forceRefresh - Force refresh, bypass cache
   * @returns {Promise<Map<string, HealthCheckResult>>}
   */
  async checkAll(forceRefresh = false) {
    const componentIds = healthRegistry.getAllComponentIds();
    return this.checkComponents(componentIds, forceRefresh);
  }

  /**
   * Get health report for a specific component
   * @param {string} componentId - Component identifier
   * @returns {Promise<ComponentHealthReport>}
   */
  async getComponentReport(componentId) {
    const componentInfo = healthRegistry.getComponentInfo(componentId);
    if (!componentInfo) {
      throw new Error(`Component ${componentId} not registered`);
    }

    const result = await this.checkComponent(componentId);
    const history = this.getComponentHistory(componentId);
    const alerts = this.getComponentAlerts(componentId);

    return new ComponentHealthReport({
      componentId,
      componentName: componentInfo.componentName,
      category: componentInfo.category,
      result,
      config: componentInfo.config,
      history,
      alerts
    });
  }

  /**
   * Get health reports for all components
   * @returns {Promise<ComponentHealthReport[]>}
   */
  async getAllReports() {
    const componentIds = healthRegistry.getAllComponentIds();
    const reports = [];

    for (const componentId of componentIds) {
      try {
        const report = await this.getComponentReport(componentId);
        reports.push(report);
      } catch (error) {
        console.error(`[HealthEngine] Failed to get report for ${componentId}:`, error);
      }
    }

    return reports;
  }

  /**
   * Get system health summary
   * @returns {Promise<SystemHealthSummary>}
   */
  async getSystemSummary() {
    const reports = await this.getAllReports();
    return SystemHealthSummary.fromReports(reports);
  }

  /**
   * Get health reports by category
   * @param {string} category - Component category
   * @returns {Promise<ComponentHealthReport[]>}
   */
  async getReportsByCategory(category) {
    const componentIds = healthRegistry.getComponentsByCategory(category);
    const reports = [];

    for (const componentId of componentIds) {
      try {
        const report = await this.getComponentReport(componentId);
        reports.push(report);
      } catch (error) {
        console.error(`[HealthEngine] Failed to get report for ${componentId}:`, error);
      }
    }

    return reports;
  }

  /**
   * Add entry to health history
   * @param {string} componentId - Component identifier
   * @param {HealthCheckResult} result - Health check result
   * @param {number} duration - Check duration in milliseconds
   */
  addToHistory(componentId, result, duration) {
    const entry = new HealthHistoryEntry({
      componentId,
      status: result.status,
      reason: result.reason,
      duration,
      latency: result.latency
    });

    this.history.push(entry);

    // Trim history if too large
    if (this.history.length > this.maxHistoryEntries) {
      this.history.shift();
    }
  }

  /**
   * Get health history for a component
   * @param {string} componentId - Component identifier
   * @param {number} limit - Maximum number of entries
   * @returns {HealthHistoryEntry[]}
   */
  getComponentHistory(componentId, limit = 50) {
    return this.history
      .filter(entry => entry.componentId === componentId)
      .slice(-limit);
  }

  /**
   * Check for alerts based on health check result
   * @param {string} componentId - Component identifier
   * @param {HealthCheckResult} result - Health check result
   * @param {HealthCheckConfig} config - Health check configuration
   */
  checkForAlerts(componentId, result, config) {
    const alertThreshold = config?.alertThreshold || HealthState.WARNING;
    const severity = result.getSeverity();

    if (severity >= this.getSeverityLevel(alertThreshold)) {
      // Check if we already have an unacknowledged alert for this component
      const existingAlert = this.alerts.find(
        alert => alert.componentId === componentId && !alert.acknowledged
      );

      if (!existingAlert) {
        const alert = new HealthAlert({
          componentId,
          severity: result.status,
          message: `${componentId}: ${result.reason}`,
          timestamp: new Date().toISOString()
        });

        this.alerts.push(alert);
        console.warn(`[HealthEngine] Alert generated for ${componentId}: ${result.reason}`);
      }
    }
  }

  /**
   * Get severity level from health state
   * @param {string} healthState - Health state
   * @returns {number}
   */
  getSeverityLevel(healthState) {
    const severityMap = {
      [HealthState.HEALTHY]: 0,
      [HealthState.WARNING]: 1,
      [HealthState.MAINTENANCE]: 2,
      [HealthState.UNKNOWN]: 3,
      [HealthState.CRITICAL]: 4,
      [HealthState.OFFLINE]: 5
    };
    return severityMap[healthState] || 3;
  }

  /**
   * Get alerts for a component
   * @param {string} componentId - Component identifier
   * @returns {HealthAlert[]}
   */
  getComponentAlerts(componentId) {
    return this.alerts.filter(alert => alert.componentId === componentId);
  }

  /**
   * Get all active alerts
   * @returns {HealthAlert[]}
   */
  getAllAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert identifier (timestamp)
   * @param {string} acknowledgedBy - User who acknowledged
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.find(a => a.timestamp === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      console.log(`[HealthEngine] Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Clear cache for a specific component
   * @param {string} componentId - Component identifier
   */
  clearCache(componentId) {
    this.cache.delete(componentId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Set cache TTL
   * @param {number} ttl - Cache TTL in milliseconds
   */
  setCacheTTL(ttl) {
    this.cacheTTL = ttl;
  }

  /**
   * Get health engine status
   * @returns {Object}
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      registeredComponents: healthRegistry.getComponentCount(),
      cachedResults: this.cache.size,
      historyEntries: this.history.length,
      activeAlerts: this.getAllAlerts().length,
      cacheTTL: this.cacheTTL
    };
  }
}

// Singleton instance
const healthEngine = new HealthEngine();

export default healthEngine;
export { HealthEngine };
