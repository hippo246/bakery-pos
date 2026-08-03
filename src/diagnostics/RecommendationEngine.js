// Recommendation Engine
// Generates actionable recommendations based on system state

import { Recommendation, RecommendationPriority } from './DiagnosticsTypes.js';
import incidentManager from './IncidentManager.js';
import predictionEngine from './PredictionEngine.js';
import systemScoreCalculator from './SystemScoreCalculator.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Recommendation Engine - Generates actionable recommendations
 */
class RecommendationEngine {
  constructor() {
    this.isInitialized = false;
    this.recommendations = new Map(); // id -> Recommendation
    this.behavior = 'suggest'; // 'suggest', 'auto', 'disabled'
  }

  /**
   * Initialize the Recommendation Engine
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[RecommendationEngine] Already initialized');
      return;
    }

    console.log('[RecommendationEngine] Initializing...');
    await this.loadRecommendations();
    this.isInitialized = true;
    console.log('[RecommendationEngine] Initialized successfully');
  }

  /**
   * Load recommendations from localStorage
   */
  async loadRecommendations() {
    try {
      const saved = localStorage.getItem('cafeos_recommendations');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(rec => {
          this.recommendations.set(rec.id, rec);
        });
        console.log(`[RecommendationEngine] Loaded ${this.recommendations.size} recommendations`);
      }
    } catch (error) {
      console.error('[RecommendationEngine] Failed to load recommendations:', error);
    }
  }

  /**
   * Save recommendations to localStorage
   */
  async saveRecommendations() {
    try {
      const recommendationsArray = Array.from(this.recommendations.values());
      localStorage.setItem('cafeos_recommendations', JSON.stringify(recommendationsArray));
    } catch (error) {
      console.error('[RecommendationEngine] Failed to save recommendations:', error);
    }
  }

  /**
   * Generate recommendations for an incident
   */
  async generateForIncident(incident) {
    const recommendations = [];

    // Generate recommendations based on incident severity and component
    if (incident.severity === 'critical' || incident.severity === 'emergency') {
      recommendations.push(new Recommendation({
        priority: RecommendationPriority.URGENT,
        title: `Immediate action required for ${incident.component}`,
        description: `Critical incident detected: ${incident.rootCause?.likelyCause || incident.metadata?.issue || 'Unknown issue'}`,
        component: incident.component,
        actionType: 'manual',
        steps: incident.rootCause?.recommendedActions || [
          'Acknowledge the incident',
          'Investigate the root cause',
          'Implement fix',
          'Monitor for recurrence'
        ],
        estimatedImpact: 'High',
        estimatedEffort: '1-4 hours'
      }));
    }

    if (incident.component === 'storage-engine' && incident.rootCause?.category === 'credentials') {
      recommendations.push(new Recommendation({
        priority: RecommendationPriority.HIGH,
        title: 'Rotate cloud storage credentials',
        description: 'Cloud storage credentials have expired or are invalid',
        component: 'storage-engine',
        actionType: 'manual',
        steps: [
          'Navigate to Cloud Platform settings',
          'Update cloud provider credentials',
          'Test connection',
          'Verify permissions'
        ],
        estimatedImpact: 'Critical',
        estimatedEffort: '15-30 minutes'
      }));
    }

    if (incident.component === 'backup-engine' && incident.rootCause?.category === 'configuration') {
      recommendations.push(new Recommendation({
        priority: RecommendationPriority.HIGH,
        title: 'Configure backup destination',
        description: 'Backup destination is not configured or unavailable',
        component: 'backup-engine',
        actionType: 'manual',
        steps: [
          'Navigate to Backup settings',
          'Configure cloud storage destination',
          'Test backup operation',
          'Verify backup retention policy'
        ],
        estimatedImpact: 'High',
        estimatedEffort: '30-60 minutes'
      }));
    }

    // Add recommendations
    for (const rec of recommendations) {
      await this.addRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * Generate recommendations from predictions
   */
  async generateFromPredictions(predictions) {
    const recommendations = [];

    for (const prediction of predictions) {
      const rec = new Recommendation({
        priority: prediction.severity === 'critical' ? RecommendationPriority.HIGH : RecommendationPriority.MEDIUM,
        title: `Address predicted issue: ${prediction.predictedIssue}`,
        description: `Prediction: ${prediction.predictedIssue} (confidence: ${prediction.confidence}%)`,
        component: prediction.component,
        actionType: 'manual',
        steps: prediction.recommendedActions,
        estimatedImpact: prediction.severity === 'critical' ? 'High' : 'Medium',
        estimatedEffort: '30-60 minutes'
      });

      recommendations.push(rec);
    }

    for (const rec of recommendations) {
      await this.addRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * Generate recommendations from system score
   */
  async generateFromSystemScore(systemScore) {
    const recommendations = [];

    // Generate recommendations based on low category scores
    for (const [category, score] of Object.entries(systemScore.categories)) {
      if (score < 60) {
        const rec = new Recommendation({
          priority: score < 40 ? RecommendationPriority.HIGH : RecommendationPriority.MEDIUM,
          title: `Improve ${category} score`,
          description: `${category} score is ${score}/100, below acceptable threshold`,
          component: category,
          actionType: 'manual',
          steps: this.getCategoryImprovementSteps(category),
          estimatedImpact: score < 40 ? 'High' : 'Medium',
          estimatedEffort: '1-4 hours'
        });

        recommendations.push(rec);
      }
    }

    for (const rec of recommendations) {
      await this.addRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * Get improvement steps for a category
   */
  getCategoryImprovementSteps(category) {
    const stepsMap = {
      'cloud': [
        'Check cloud provider connectivity',
        'Verify cloud credentials',
        'Review cloud provider configuration',
        'Test cloud operations'
      ],
      'database': [
        'Check database connectivity',
        'Review database performance',
        'Optimize slow queries',
        'Check database resources'
      ],
      'storage': [
        'Review storage usage',
        'Clean up unnecessary data',
        'Increase storage quota if needed',
        'Implement data retention policy'
      ],
      'security': [
        'Review security configurations',
        'Rotate expired credentials',
        'Update authentication tokens',
        'Review access permissions'
      ],
      'backups': [
        'Run backup immediately',
        'Verify backup configuration',
        'Check backup destination',
        'Review backup schedule'
      ],
      'synchronization': [
        'Review sync queue',
        'Check sync configuration',
        'Investigate sync failures',
        'Reduce sync backlog'
      ],
      'performance': [
        'Review performance metrics',
        'Identify bottlenecks',
        'Optimize slow operations',
        'Consider scaling resources'
      ],
      'reliability': [
        'Review incident history',
        'Address recurring issues',
        'Implement preventive measures',
        'Improve monitoring'
      ]
    };

    return stepsMap[category] || ['Investigate component', 'Review logs', 'Check configuration'];
  }

  /**
   * Add a recommendation
   */
  async addRecommendation(recommendation) {
    // Check for similar existing recommendations
    const existing = Array.from(this.recommendations.values()).find(r => 
      r.title === recommendation.title && 
      r.component === recommendation.component &&
      !r.implemented &&
      (Date.now() - new Date(r.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    );

    if (existing) {
      return existing;
    }

    this.recommendations.set(recommendation.id, recommendation);
    await this.saveRecommendations();
    
    console.log(`[RecommendationEngine] Added recommendation ${recommendation.id}`);
    return recommendation;
  }

  /**
   * Add multiple recommendations
   */
  async addRecommendations(recommendations) {
    for (const rec of recommendations) {
      await this.addRecommendation(rec);
    }
  }

  /**
   * Get recommendations
   */
  getRecommendations(filters = {}) {
    let recommendations = Array.from(this.recommendations.values());

    // Apply filters
    if (filters.priority) {
      recommendations = recommendations.filter(r => r.priority === filters.priority);
    }
    if (filters.component) {
      recommendations = recommendations.filter(r => r.component === filters.component);
    }
    if (filters.acknowledged !== undefined) {
      recommendations = recommendations.filter(r => r.acknowledged === filters.acknowledged);
    }
    if (filters.implemented !== undefined) {
      recommendations = recommendations.filter(r => r.implemented === filters.implemented);
    }

    // Sort by priority (urgent first)
    const priorityOrder = {
      [RecommendationPriority.URGENT]: 0,
      [RecommendationPriority.HIGH]: 1,
      [RecommendationPriority.MEDIUM]: 2,
      [RecommendationPriority.LOW]: 3,
      [RecommendationPriority.INFORMATIONAL]: 4
    };

    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return recommendations;
  }

  /**
   * Acknowledge a recommendation
   */
  async acknowledge(recommendationId) {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    recommendation.acknowledged = true;
    this.recommendations.set(recommendationId, recommendation);
    await this.saveRecommendations();
    
    return recommendation;
  }

  /**
   * Implement a recommendation
   */
  async implement(recommendationId) {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    recommendation.implemented = true;
    recommendation.acknowledged = true;
    this.recommendations.set(recommendationId, recommendation);
    await this.saveRecommendations();
    
    return recommendation;
  }

  /**
   * Delete a recommendation
   */
  async deleteRecommendation(recommendationId) {
    this.recommendations.delete(recommendationId);
    await this.saveRecommendations();
  }

  /**
   * Get recommendation statistics
   */
  getRecommendationStatistics() {
    const all = Array.from(this.recommendations.values());
    
    const byPriority = {
      [RecommendationPriority.URGENT]: 0,
      [RecommendationPriority.HIGH]: 0,
      [RecommendationPriority.MEDIUM]: 0,
      [RecommendationPriority.LOW]: 0,
      [RecommendationPriority.INFORMATIONAL]: 0
    };

    const byStatus = {
      acknowledged: 0,
      implemented: 0,
      pending: 0
    };

    all.forEach(rec => {
      byPriority[rec.priority]++;
      if (rec.acknowledged) byStatus.acknowledged++;
      if (rec.implemented) byStatus.implemented++;
      if (!rec.acknowledged && !rec.implemented) byStatus.pending++;
    });

    return {
      total: all.length,
      byPriority,
      byStatus
    };
  }

  /**
   * Generate system-wide recommendations
   */
  async generateSystemRecommendations() {
    const recommendations = [];

    // Get system score
    const systemScore = await systemScoreCalculator.calculate();
    const scoreRecs = await this.generateFromSystemScore(systemScore);
    recommendations.push(...scoreRecs);

    // Get predictions
    const predictions = await predictionEngine.getActivePredictions();
    const predRecs = await this.generateFromPredictions(predictions);
    recommendations.push(...predRecs);

    // Get active incidents
    const activeIncidents = await incidentManager.getActiveIncidents();
    for (const incident of activeIncidents) {
      const incidentRecs = await this.generateForIncident(incident);
      recommendations.push(...incidentRecs);
    }

    return recommendations;
  }

  /**
   * Set recommendation behavior
   */
  setBehavior(behavior) {
    this.behavior = behavior;
  }

  /**
   * Cleanup old recommendations
   */
  async cleanupOldRecommendations(retentionDays = 30) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, rec] of this.recommendations.entries()) {
      const createdTime = new Date(rec.createdAt).getTime();
      
      // Only remove implemented recommendations older than retention period
      if (rec.implemented && createdTime < cutoff) {
        this.recommendations.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveRecommendations();
      console.log(`[RecommendationEngine] Cleaned up ${removedCount} old recommendations`);
    }

    return removedCount;
  }
}

// Singleton instance
const recommendationEngine = new RecommendationEngine();

export default recommendationEngine;
export { RecommendationEngine };
