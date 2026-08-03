// Prediction Engine
// Predictive monitoring to warn before failures occur

import { PredictionWarning, PredictionType, IncidentSeverity } from './DiagnosticsTypes.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Prediction Engine - Predicts and warns about potential issues
 */
class PredictionEngine {
  constructor() {
    this.isInitialized = false;
    this.activePredictions = new Map(); // id -> PredictionWarning
    this.predictionRules = this.initializeRules();
    this.sensitivity = 'normal'; // 'low', 'normal', 'high'
  }

  /**
   * Initialize the Prediction Engine
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[PredictionEngine] Already initialized');
      return;
    }

    console.log('[PredictionEngine] Initializing...');
    await this.loadPredictions();
    this.isInitialized = true;
    console.log('[PredictionEngine] Initialized successfully');
  }

  /**
   * Initialize prediction rules
   */
  initializeRules() {
    return [
      {
        type: PredictionType.STORAGE_CAPACITY,
        check: this.checkStorageCapacity.bind(this),
        threshold: 0.9, // 90% capacity
        severity: IncidentSeverity.HIGH
      },
      {
        type: PredictionType.CREDENTIAL_EXPIRATION,
        check: this.checkCredentialExpiration.bind(this),
        threshold: 7 * 24 * 60 * 60 * 1000, // 7 days
        severity: IncidentSeverity.MEDIUM
      },
      {
        type: PredictionType.BACKUP_OVERDUE,
        check: this.checkBackupOverdue.bind(this),
        threshold: 2 * 24 * 60 * 60 * 1000, // 2 days
        severity: IncidentSeverity.HIGH
      },
      {
        type: PredictionType.HIGH_FAILURE_RATE,
        check: this.checkHighFailureRate.bind(this),
        threshold: 0.1, // 10% failure rate
        severity: IncidentSeverity.HIGH
      },
      {
        type: PredictionType.INCREASING_LATENCY,
        check: this.checkIncreasingLatency.bind(this),
        threshold: 0.5, // 50% increase
        severity: IncidentSeverity.MEDIUM
      },
      {
        type: PredictionType.GROWING_QUEUE,
        check: this.checkGrowingQueue.bind(this),
        threshold: 100, // 100 items in queue
        severity: IncidentSeverity.MEDIUM
      },
      {
        type: PredictionType.SLOW_DATABASE,
        check: this.checkSlowDatabase.bind(this),
        threshold: 1000, // 1 second
        severity: IncidentSeverity.HIGH
      },
      {
        type: PredictionType.REPEATED_AUTH_FAILURES,
        check: this.checkRepeatedAuthFailures.bind(this),
        threshold: 5, // 5 failures
        severity: IncidentSeverity.HIGH
      }
    ];
  }

  /**
   * Load predictions from localStorage
   */
  async loadPredictions() {
    try {
      const saved = localStorage.getItem('cafeos_predictions');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(prediction => {
          this.activePredictions.set(prediction.id, prediction);
        });
        console.log(`[PredictionEngine] Loaded ${this.activePredictions.size} predictions`);
      }
    } catch (error) {
      console.error('[PredictionEngine] Failed to load predictions:', error);
    }
  }

  /**
   * Save predictions to localStorage
   */
  async savePredictions() {
    try {
      const predictionsArray = Array.from(this.activePredictions.values());
      localStorage.setItem('cafeos_predictions', JSON.stringify(predictionsArray));
    } catch (error) {
      console.error('[PredictionEngine] Failed to save predictions:', error);
    }
  }

  /**
   * Check for predictions based on a metric value
   */
  async checkForPredictions(metric, value, metadata = {}) {
    const applicableRules = this.predictionRules.filter(rule => {
      // Map metrics to prediction types
      const metricToType = {
        'storage_usage': PredictionType.STORAGE_CAPACITY,
        'credential_expiry': PredictionType.CREDENTIAL_EXPIRATION,
        'backup_age': PredictionType.BACKUP_OVERDUE,
        'failure_rate': PredictionType.HIGH_FAILURE_RATE,
        'latency': PredictionType.INCREASING_LATENCY,
        'queue_size': PredictionType.GROWING_QUEUE,
        'database_latency': PredictionType.SLOW_DATABASE,
        'auth_failures': PredictionType.REPEATED_AUTH_FAILURES
      };

      return metricToType[metric] === rule.type;
    });

    for (const rule of applicableRules) {
      const result = await rule.check(value, metadata, rule.threshold);
      
      if (result.predicted) {
        await this.createPrediction({
          type: rule.type,
          component: metadata.component || 'system',
          severity: rule.severity,
          predictedIssue: result.issue,
          confidence: result.confidence,
          timeToIssue: result.timeToIssue,
          recommendedActions: result.actions,
          metadata
        });
      }
    }
  }

  /**
   * Run all prediction checks
   */
  async runAllChecks() {
    for (const rule of this.predictionRules) {
      try {
        const result = await rule.check();
        
        if (result.predicted) {
          await this.createPrediction({
            type: rule.type,
            component: result.component,
            severity: rule.severity,
            predictedIssue: result.issue,
            confidence: result.confidence,
            timeToIssue: result.timeToIssue,
            recommendedActions: result.actions,
            metadata: result.metadata || {}
          });
        }
      } catch (error) {
        console.error(`[PredictionEngine] Check failed for ${rule.type}:`, error);
      }
    }
  }

  /**
   * Create a prediction warning
   */
  async createPrediction(predictionData) {
    // Check if similar prediction already exists
    const existing = Array.from(this.activePredictions.values()).find(p => 
      p.type === predictionData.type && 
      p.component === predictionData.component &&
      (Date.now() - new Date(p.generatedAt).getTime()) < 3600000 // Within 1 hour
    );

    if (existing) {
      // Update existing prediction
      existing.timeToIssue = predictionData.timeToIssue;
      existing.generatedAt = new Date().toISOString();
      this.activePredictions.set(existing.id, existing);
      await this.savePredictions();
      return existing;
    }

    const prediction = new PredictionWarning(predictionData);
    this.activePredictions.set(prediction.id, prediction);
    await this.savePredictions();
    
    console.log(`[PredictionEngine] Created prediction ${prediction.id} for ${prediction.type}`);
    return prediction;
  }

  /**
   * Get active predictions
   */
  getActivePredictions() {
    const now = Date.now();
    const active = [];

    for (const prediction of this.activePredictions.values()) {
      // Remove predictions older than 24 hours
      const age = now - new Date(prediction.generatedAt).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        active.push(prediction);
      }
    }

    return active.sort((a, b) => a.timeToIssue - b.timeToIssue);
  }

  /**
   * Dismiss a prediction
   */
  async dismissPrediction(predictionId) {
    this.activePredictions.delete(predictionId);
    await this.savePredictions();
  }

  /**
   * Prediction check implementations
   */
  async checkStorageCapacity(value, metadata, threshold) {
    const usage = value || 0;
    if (usage >= threshold) {
      return {
        predicted: true,
        issue: 'Storage capacity nearing limit',
        confidence: 90,
        timeToIssue: 24 * 60 * 60 * 1000, // 1 day
        actions: [
          'Clean up unnecessary data',
          'Increase storage quota',
          'Implement data retention policy',
          'Archive old data'
        ]
      };
    }
    return { predicted: false };
  }

  async checkCredentialExpiration(value, metadata, threshold) {
    const expiryTime = value;
    if (expiryTime && (expiryTime - Date.now()) < threshold) {
      return {
        predicted: true,
        issue: 'Credentials will expire soon',
        confidence: 95,
        timeToIssue: expiryTime - Date.now(),
        actions: [
          'Rotate credentials before expiration',
          'Set up credential rotation automation',
          'Update authentication tokens'
        ]
      };
    }
    return { predicted: false };
  }

  async checkBackupOverdue(value, metadata, threshold) {
    const lastBackup = value;
    if (lastBackup && (Date.now() - lastBackup) > threshold) {
      return {
        predicted: true,
        issue: 'Backup is overdue',
        confidence: 85,
        timeToIssue: 0,
        actions: [
          'Run backup immediately',
          'Check backup configuration',
          'Verify backup destination',
          'Increase backup frequency'
        ]
      };
    }
    return { predicted: false };
  }

  async checkHighFailureRate(value, metadata, threshold) {
    const failureRate = value;
    if (failureRate >= threshold) {
      return {
        predicted: true,
        issue: 'High failure rate detected',
        confidence: 80,
        timeToIssue: 60 * 60 * 1000, // 1 hour
        actions: [
          'Investigate failure causes',
          'Check system logs',
          'Review recent changes',
          'Monitor closely'
        ]
      };
    }
    return { predicted: false };
  }

  async checkIncreasingLatency(value, metadata, threshold) {
    const currentLatency = value;
    const baseline = performanceAnalyzer.getBaseline('latency', '1h');
    
    if (baseline && currentLatency > baseline.average * (1 + threshold)) {
      return {
        predicted: true,
        issue: 'Latency increasing significantly',
        confidence: 75,
        timeToIssue: 30 * 60 * 1000, // 30 minutes
        actions: [
          'Investigate performance degradation',
          'Check resource utilization',
          'Review recent changes',
          'Consider scaling resources'
        ]
      };
    }
    return { predicted: false };
  }

  async checkGrowingQueue(value, metadata, threshold) {
    const queueSize = value;
    if (queueSize >= threshold) {
      return {
        predicted: true,
        issue: 'Queue growing beyond threshold',
        confidence: 85,
        timeToIssue: 15 * 60 * 1000, // 15 minutes
        actions: [
          'Increase processing capacity',
          'Review queue processing logic',
          'Check for bottlenecks',
          'Consider queue partitioning'
        ]
      };
    }
    return { predicted: false };
  }

  async checkSlowDatabase(value, metadata, threshold) {
    const dbLatency = value;
    if (dbLatency >= threshold) {
      return {
        predicted: true,
        issue: 'Database performance degraded',
        confidence: 80,
        timeToIssue: 30 * 60 * 1000, // 30 minutes
        actions: [
          'Check database queries',
          'Review database indexes',
          'Check database resources',
          'Consider database optimization'
        ]
      };
    }
    return { predicted: false };
  }

  async checkRepeatedAuthFailures(value, metadata, threshold) {
    const failureCount = value;
    if (failureCount >= threshold) {
      return {
        predicted: true,
        issue: 'Repeated authentication failures',
        confidence: 90,
        timeToIssue: 0,
        actions: [
          'Check for brute force attacks',
          'Review authentication logs',
          'Consider rate limiting',
          'Notify security team'
        ]
      };
    }
    return { predicted: false };
  }

  /**
   * Set sensitivity level
   */
  setSensitivity(level) {
    this.sensitivity = level;
    
    // Adjust thresholds based on sensitivity
    const multiplier = {
      'low': 1.5,
      'normal': 1.0,
      'high': 0.7
    }[level] || 1.0;

    this.predictionRules.forEach(rule => {
      rule.threshold *= multiplier;
    });
  }

  /**
   * Cleanup old predictions
   */
  async cleanupOldPredictions() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let removedCount = 0;

    for (const [id, prediction] of this.activePredictions.entries()) {
      const generatedTime = new Date(prediction.generatedAt).getTime();
      if (generatedTime < cutoff) {
        this.activePredictions.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.savePredictions();
      console.log(`[PredictionEngine] Cleaned up ${removedCount} old predictions`);
    }

    return removedCount;
  }
}

// Singleton instance
const predictionEngine = new PredictionEngine();

export default predictionEngine;
export { PredictionEngine };
