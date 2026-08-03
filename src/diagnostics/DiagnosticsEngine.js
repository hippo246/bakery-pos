// Diagnostics Engine
// Core orchestrator for diagnostics, incident management, and operational intelligence

import { DiagnosticsConfig } from './DiagnosticsTypes.js';
import incidentManager from './IncidentManager.js';
import rootCauseAnalyzer from './RootCauseAnalyzer.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import trendAnalyzer from './TrendAnalyzer.js';
import predictionEngine from './PredictionEngine.js';
import systemScoreCalculator from './SystemScoreCalculator.js';
import recommendationEngine from './RecommendationEngine.js';
import diagnosticsReportGenerator from './DiagnosticsReportGenerator.js';
import historyTracker from './HistoryTracker.js';
import recoveryTracker from './RecoveryTracker.js';
import diagnosticsSearch from './DiagnosticsSearch.js';
import smartNotifications from './SmartNotifications.js';

/**
 * Diagnostics Engine - Central orchestrator for all diagnostics capabilities
 */
class DiagnosticsEngine {
  constructor() {
    this.config = new DiagnosticsConfig();
    this.isInitialized = false;
    this.performanceData = new Map(); // metric -> array of PerformanceDataPoint
  }

  /**
   * Initialize the Diagnostics Engine
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[DiagnosticsEngine] Already initialized');
      return;
    }

    console.log('[DiagnosticsEngine] Initializing...');
    
    // Load configuration
    await this.loadConfiguration();
    
    // Initialize sub-systems
    await incidentManager.initialize();
    await performanceAnalyzer.initialize();
    await trendAnalyzer.initialize();
    await predictionEngine.initialize();
    await systemScoreCalculator.initialize();
    await recommendationEngine.initialize();
    await historyTracker.initialize();
    await recoveryTracker.initialize();
    await diagnosticsSearch.initialize();
    await smartNotifications.initialize(this.config);
    
    this.isInitialized = true;
    console.log('[DiagnosticsEngine] Initialized successfully');
  }

  /**
   * Load configuration from localStorage
   */
  async loadConfiguration() {
    try {
      const saved = localStorage.getItem('cafeos_diagnostics_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = new DiagnosticsConfig(parsed);
      }
    } catch (error) {
      console.error('[DiagnosticsEngine] Failed to load configuration:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  async saveConfiguration() {
    try {
      localStorage.setItem('cafeos_diagnostics_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('[DiagnosticsEngine] Failed to save configuration:', error);
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates) {
    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();
    
    // Re-initialize affected subsystems
    if (updates.predictionSensitivity !== undefined) {
      await predictionEngine.initialize();
    }
    if (updates.recommendationBehavior !== undefined) {
      await recommendationEngine.initialize();
    }
  }

  /**
   * Record performance metric
   */
  async recordPerformanceMetric(metric, value, metadata = {}) {
    if (!this.config.enablePerformanceTracking) return;

    const dataPoint = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Store in memory
    if (!this.performanceData.has(metric)) {
      this.performanceData.set(metric, []);
    }
    this.performanceData.get(metric).push(dataPoint);

    // Pass to performance analyzer
    await performanceAnalyzer.recordMetric(metric, value, metadata);

    // Check for predictions
    if (this.config.enablePredictions) {
      await predictionEngine.checkForPredictions(metric, value, metadata);
    }
  }

  /**
   * Get performance data for a metric
   */
  getPerformanceData(metric, period = '1h') {
    const data = this.performanceData.get(metric) || [];
    const now = Date.now();
    const periodMs = this.parsePeriod(period);
    
    return data.filter(dp => {
      const timestamp = new Date(dp.timestamp).getTime();
      return now - timestamp <= periodMs;
    });
  }

  /**
   * Parse period string to milliseconds
   */
  parsePeriod(period) {
    const units = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
      'w': 604800000
    };
    
    const match = period.match(/^(\d+)([smhdw])$/);
    if (!match) return 3600000; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * units[unit];
  }

  /**
   * Create incident
   */
  async createIncident(incidentData) {
    const incident = await incidentManager.createIncident(incidentData);
    
    // Perform root cause analysis if enabled
    if (this.config.enableRootCauseAnalysis) {
      const rootCause = await rootCauseAnalyzer.analyze(incident.component, incidentData.issue);
      incident.rootCause = rootCause;
      await incidentManager.updateIncident(incident.id, { rootCause });
    }
    
    // Generate recommendations
    const recommendations = await recommendationEngine.generateForIncident(incident);
    await recommendationEngine.addRecommendations(recommendations);
    
    // Send notification
    await smartNotifications.notifyIncident(incident);
    
    // Track in history
    await historyTracker.recordIncident(incident);
    
    return incident;
  }

  /**
   * Acknowledge incident
   */
  async acknowledgeIncident(incidentId, owner) {
    const incident = await incidentManager.acknowledgeIncident(incidentId, owner);
    
    // Track recovery time
    await recoveryTracker.trackAcknowledgment(incidentId, owner);
    
    return incident;
  }

  /**
   * Resolve incident
   */
  async resolveIncident(incidentId, resolutionNotes, owner) {
    const incident = await incidentManager.resolveIncident(incidentId, resolutionNotes, owner);
    
    // Track recovery
    await recoveryTracker.trackResolution(incidentId, owner);
    
    // Send notification
    await smartNotifications.notifyResolution(incident);
    
    return incident;
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents() {
    return await incidentManager.getActiveIncidents();
  }

  /**
   * Get all incidents
   */
  async getAllIncidents(filters = {}) {
    return await incidentManager.getAllIncidents(filters);
  }

  /**
   * Get trends for a metric
   */
  async getTrends(metric, period = 'daily') {
    if (!this.config.enableTrendAnalysis) return null;
    
    return await trendAnalyzer.analyzeTrend(metric, period);
  }

  /**
   * Get current predictions
   */
  async getPredictions() {
    if (!this.config.enablePredictions) return [];
    
    return await predictionEngine.getActivePredictions();
  }

  /**
   * Get system score
   */
  async getSystemScore() {
    return await systemScoreCalculator.calculate();
  }

  /**
   * Get recommendations
   */
  async getRecommendations(filters = {}) {
    return await recommendationEngine.getRecommendations(filters);
  }

  /**
   * Acknowledge recommendation
   */
  async acknowledgeRecommendation(recommendationId) {
    return await recommendationEngine.acknowledge(recommendationId);
  }

  /**
   * Implement recommendation
   */
  async implementRecommendation(recommendationId) {
    return await recommendationEngine.implement(recommendationId);
  }

  /**
   * Generate diagnostics report
   */
  async generateReport() {
    return await diagnosticsReportGenerator.generate();
  }

  /**
   * Search diagnostics data
   */
  async search(query, filters = {}) {
    return await diagnosticsSearch.search(query, filters);
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStatistics() {
    return await recoveryTracker.getStatistics();
  }

  /**
   * Get history data
   */
  async getHistory(type, filters = {}) {
    return await historyTracker.getHistory(type, filters);
  }

  /**
   * Get dashboard data
   */
  async getDashboardData() {
    return {
      incidents: {
        active: await this.getActiveIncidents(),
        total: (await this.getAllIncidents()).length,
        critical: (await this.getAllIncidents({ severity: 'critical' })).length
      },
      performance: {
        score: await this.getSystemScore(),
        trends: await this.getTrends('overall', 'daily')
      },
      predictions: await this.getPredictions(),
      recommendations: await this.getRecommendations({ acknowledged: false }),
      recovery: await this.getRecoveryStatistics()
    };
  }

  /**
   * Cleanup old data based on retention policy
   */
  async cleanupOldData() {
    await incidentManager.cleanupOldIncidents(this.config.incidentRetentionDays);
    await historyTracker.cleanupOldData(this.config.diagnosticsRetentionDays);
    
    // Cleanup performance data older than retention period
    const cutoff = Date.now() - (this.config.diagnosticsRetentionDays * 24 * 60 * 60 * 1000);
    for (const [metric, data] of this.performanceData.entries()) {
      this.performanceData.set(
        metric,
        data.filter(dp => new Date(dp.timestamp).getTime() > cutoff)
      );
    }
  }

  /**
   * Shutdown the Diagnostics Engine
   */
  async shutdown() {
    console.log('[DiagnosticsEngine] Shutting down...');
    this.isInitialized = false;
    console.log('[DiagnosticsEngine] Shutdown complete');
  }
}

// Singleton instance
const diagnosticsEngine = new DiagnosticsEngine();

export default diagnosticsEngine;
export { DiagnosticsEngine };
