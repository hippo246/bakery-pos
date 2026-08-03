// System Score Calculator
// Calculates overall platform health score across categories

import { SystemScore, SystemScoreCategory } from './DiagnosticsTypes.js';
import healthEngine from '../health/HealthEngine.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import incidentManager from './IncidentManager.js';

/**
 * System Score Calculator - Calculates platform health scores
 */
class SystemScoreCalculator {
  constructor() {
    this.isInitialized = false;
    this.scoreCache = null;
    this.cacheTTL = 60 * 1000; // 1 minute
    this.lastCalculation = 0;
  }

  /**
   * Initialize the System Score Calculator
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[SystemScoreCalculator] Already initialized');
      return;
    }

    console.log('[SystemScoreCalculator] Initializing...');
    this.isInitialized = true;
    console.log('[SystemScoreCalculator] Initialized successfully');
  }

  /**
   * Calculate system score
   */
  async calculate() {
    const now = Date.now();
    
    // Return cached score if still valid
    if (this.scoreCache && (now - this.lastCalculation) < this.cacheTTL) {
      return this.scoreCache;
    }

    console.log('[SystemScoreCalculator] Calculating system score...');

    // Calculate scores for each category
    const categories = {
      [SystemScoreCategory.CLOUD]: await this.calculateCloudScore(),
      [SystemScoreCategory.DATABASE]: await this.calculateDatabaseScore(),
      [SystemScoreCategory.STORAGE]: await this.calculateStorageScore(),
      [SystemScoreCategory.SECURITY]: await this.calculateSecurityScore(),
      [SystemScoreCategory.BACKUPS]: await this.calculateBackupScore(),
      [SystemScoreCategory.SYNCHRONIZATION]: await this.calculateSyncScore(),
      [SystemScoreCategory.PERFORMANCE]: await this.calculatePerformanceScore(),
      [SystemScoreCategory.RELIABILITY]: await this.calculateReliabilityScore()
    };

    // Calculate overall score (weighted average)
    const weights = {
      [SystemScoreCategory.CLOUD]: 0.15,
      [SystemScoreCategory.DATABASE]: 0.15,
      [SystemScoreCategory.STORAGE]: 0.10,
      [SystemScoreCategory.SECURITY]: 0.15,
      [SystemScoreCategory.BACKUPS]: 0.15,
      [SystemScoreCategory.SYNCHRONIZATION]: 0.10,
      [SystemScoreCategory.PERFORMANCE]: 0.10,
      [SystemScoreCategory.RELIABILITY]: 0.10
    };

    let overall = 0;
    const deductions = [];

    for (const [category, score] of Object.entries(categories)) {
      const weight = weights[category] || 0.1;
      overall += score * weight;

      // Add deductions for low scores
      if (score < 70) {
        deductions.push({
          category,
          reason: `${category} score is below acceptable threshold`,
          amount: (100 - score) * weight
        });
      }
    }

    overall = Math.round(overall);

    const systemScore = new SystemScore({
      overall,
      categories,
      deductions,
      calculatedAt: new Date().toISOString()
    });

    this.scoreCache = systemScore;
    this.lastCalculation = now;
    
    console.log(`[SystemScoreCalculator] System score calculated: ${overall}/100`);
    return systemScore;
  }

  /**
   * Calculate cloud score
   */
  async calculateCloudScore() {
    try {
      const health = await healthEngine.checkComponent('storage-engine');
      let score = health.healthScore || 50;

      // Deduct for critical issues
      if (health.status === 'critical') score -= 30;
      if (health.status === 'warning') score -= 15;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate cloud score:', error);
      return 50;
    }
  }

  /**
   * Calculate database score
   */
  async calculateDatabaseScore() {
    try {
      const health = await healthEngine.checkComponent('database');
      let score = health.healthScore || 50;

      // Deduct for high latency
      if (health.latency > 1000) score -= 20;
      if (health.latency > 500) score -= 10;

      // Deduct for critical status
      if (health.status === 'critical') score -= 30;
      if (health.status === 'warning') score -= 15;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate database score:', error);
      return 50;
    }
  }

  /**
   * Calculate storage score
   */
  async calculateStorageScore() {
    try {
      const health = await healthEngine.checkComponent('storage-engine');
      let score = health.healthScore || 50;

      // Check storage usage (simulated - in production would check actual usage)
      const usage = health.metadata?.storageUsage || 0;
      if (usage > 0.9) score -= 30; // Over 90% usage
      if (usage > 0.8) score -= 15; // Over 80% usage

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate storage score:', error);
      return 50;
    }
  }

  /**
   * Calculate security score
   */
  async calculateSecurityScore() {
    try {
      const secretVaultHealth = await healthEngine.checkComponent('secret-vault');
      const credentialHealth = await healthEngine.checkComponent('credential-manager');
      const authHealth = await healthEngine.checkComponent('authentication');

      const scores = [
        secretVaultHealth.healthScore || 50,
        credentialHealth.healthScore || 50,
        authHealth.healthScore || 50
      ];

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      // Deduct for any critical security component
      if (secretVaultHealth.status === 'critical') return 30;
      if (credentialHealth.status === 'critical') return 30;
      if (authHealth.status === 'critical') return 30;

      return Math.max(0, Math.min(100, avgScore));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate security score:', error);
      return 50;
    }
  }

  /**
   * Calculate backup score
   */
  async calculateBackupScore() {
    try {
      const health = await healthEngine.checkComponent('backup-engine');
      let score = health.healthScore || 50;

      // Check if backup is overdue
      const lastBackup = health.metadata?.lastBackup;
      if (lastBackup) {
        const backupAge = Date.now() - new Date(lastBackup).getTime();
        const daysSinceBackup = backupAge / (24 * 60 * 60 * 1000);
        
        if (daysSinceBackup > 7) score -= 30; // Over 7 days
        if (daysSinceBackup > 3) score -= 15; // Over 3 days
        if (daysSinceBackup > 1) score -= 5; // Over 1 day
      } else {
        score -= 50; // No backup ever
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate backup score:', error);
      return 50;
    }
  }

  /**
   * Calculate sync score
   */
  async calculateSyncScore() {
    try {
      const health = await healthEngine.checkComponent('sync-engine');
      let score = health.healthScore || 50;

      // Deduct for queue size
      const queueSize = health.metadata?.pendingJobs || 0;
      if (queueSize > 100) score -= 30;
      if (queueSize > 50) score -= 15;
      if (queueSize > 20) score -= 5;

      // Deduct for failed jobs
      const failedJobs = health.metadata?.failedJobs || 0;
      if (failedJobs > 10) score -= 30;
      if (failedJobs > 5) score -= 15;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate sync score:', error);
      return 50;
    }
  }

  /**
   * Calculate performance score
   */
  async calculatePerformanceScore() {
    try {
      const summary = performanceAnalyzer.getPerformanceSummary();
      
      if (summary.totalMetrics === 0) return 50;

      let score = 100;

      // Deduct for performance alerts
      summary.alerts.forEach(alert => {
        if (alert.severity === 'critical') score -= 20;
        if (alert.severity === 'warning') score -= 10;
      });

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate performance score:', error);
      return 50;
    }
  }

  /**
   * Calculate reliability score
   */
  async calculateReliabilityScore() {
    try {
      const incidentStats = incidentManager.getIncidentStatistics();
      
      let score = 100;

      // Deduct for active critical incidents
      const criticalActive = incidentStats.bySeverity.critical || 0;
      const emergencyActive = incidentStats.bySeverity.emergency || 0;
      
      score -= (criticalActive * 15);
      score -= (emergencyActive * 25);

      // Deduct for high incident rate
      const recentIncidents = incidentStats.total;
      if (recentIncidents > 20) score -= 20;
      if (recentIncidents > 10) score -= 10;

      // Bonus for good recovery time
      if (incidentStats.averageResolutionTime < 3600000) { // Less than 1 hour
        score += 5;
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[SystemScoreCalculator] Failed to calculate reliability score:', error);
      return 50;
    }
  }

  /**
   * Get score explanation
   */
  getScoreExplanation(systemScore) {
    const { overall, deductions } = systemScore;

    let explanation = '';
    if (overall >= 90) {
      explanation = 'Excellent - All systems operating optimally';
    } else if (overall >= 75) {
      explanation = 'Good - Minor issues detected but overall healthy';
    } else if (overall >= 60) {
      explanation = 'Fair - Some systems require attention';
    } else if (overall >= 40) {
      explanation = 'Poor - Multiple systems experiencing issues';
    } else {
      explanation = 'Critical - System requires immediate attention';
    }

    return {
      overall,
      explanation,
      deductions: deductions.slice(0, 5), // Top 5 deductions
      categoryScores: systemScore.categories
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.scoreCache = null;
    this.lastCalculation = 0;
  }
}

// Singleton instance
const systemScoreCalculator = new SystemScoreCalculator();

export default systemScoreCalculator;
export { SystemScoreCalculator };
