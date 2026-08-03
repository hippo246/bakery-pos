/**
 * Recommendation Engine
 * Generates actionable business recommendations based on business rules and analytics
 * All recommendations are explainable and based on real operational data
 */

import businessRulesEngine from './BusinessRulesEngine.js';

class RecommendationEngine {
  constructor() {
    this.recommendations = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the recommendation engine
   */
  initialize() {
    if (this.initialized) return;
    
    businessRulesEngine.initialize();
    this.initialized = true;
  }

  /**
   * Generate recommendations from operational data
   * @param {Object} data - Operational data
   * @param {Object} config - BI configuration
   * @returns {Array<Object>} Generated recommendations
   */
  generateRecommendations(data, config) {
    if (!config.recommendations?.enabled) {
      return [];
    }

    // Execute all business rules
    const triggeredRules = businessRulesEngine.executeAllRules(data);

    // Convert rules to recommendations
    const recommendations = triggeredRules.map(rule => ({
      id: this.generateRecommendationId(rule),
      type: this.getRecommendationType(rule.category),
      priority: rule.priority,
      title: rule.title,
      message: rule.message,
      reason: rule.reason,
      affectedArea: rule.affectedArea,
      businessImpact: rule.businessImpact,
      suggestedAction: rule.suggestedAction,
      data: rule.data,
      dataSources: this.identifyDataSources(rule.category),
      confidence: this.calculateConfidence(rule, data),
      timestamp: rule.timestamp,
      acknowledged: false
    }));

    // Limit recommendations based on sensitivity
    const maxRecs = config.recommendations?.maxRecommendations || 10;
    return recommendations.slice(0, maxRecs);
  }

  /**
   * Generate unique recommendation ID
   */
  generateRecommendationId(rule) {
    return `${rule.ruleId}-${Date.now()}`;
  }

  /**
   * Get recommendation type from category
   */
  getRecommendationType(category) {
    const types = {
      kitchen: 'operational',
      inventory: 'inventory',
      tables: 'operational',
      payments: 'financial',
      orders: 'operational',
      staff: 'staff'
    };
    return types[category] || 'general';
  }

  /**
   * Identify data sources for a category
   */
  identifyDataSources(category) {
    const sources = {
      kitchen: ['Live Kitchen', 'Orders'],
      inventory: ['Live Inventory', 'Purchase Orders'],
      tables: ['Live Tables', 'Reservations'],
      payments: ['Live Payments', 'Orders'],
      orders: ['Live Orders', 'Kitchen'],
      staff: ['Live Staff Status', 'Shift Operations']
    };
    return sources[category] || ['Operational Data'];
  }

  /**
   * Calculate confidence level for a recommendation
   */
  calculateConfidence(rule, data) {
    // Confidence based on data quality and rule specificity
    let confidence = 85; // Base confidence

    // Increase confidence if data is recent
    if (rule.timestamp && (Date.now() - rule.timestamp) < 60000) {
      confidence += 10;
    }

    // Increase confidence if data is specific
    if (rule.data && Object.keys(rule.data).length > 0) {
      confidence += 5;
    }

    return Math.min(100, confidence);
  }

  /**
   * Acknowledge a recommendation
   * @param {string} recommendationId - Recommendation ID
   */
  acknowledgeRecommendation(recommendationId) {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.acknowledged = true;
      this.recommendations.set(recommendationId, rec);
    }
  }

  /**
   * Dismiss a recommendation
   * @param {string} recommendationId - Recommendation ID
   */
  dismissRecommendation(recommendationId) {
    this.recommendations.delete(recommendationId);
  }

  /**
   * Get all active recommendations
   * @returns {Array<Object>}
   */
  getActiveRecommendations() {
    return Array.from(this.recommendations.values()).filter(rec => !rec.acknowledged);
  }

  /**
   * Get all recommendations
   * @returns {Array<Object>}
   */
  getAllRecommendations() {
    return Array.from(this.recommendations.values());
  }

  /**
   * Store recommendations
   * @param {Array<Object>} recommendations - Recommendations to store
   */
  storeRecommendations(recommendations) {
    recommendations.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });
  }

  /**
   * Clear all recommendations
   */
  clearRecommendations() {
    this.recommendations.clear();
  }

  /**
   * Get recommendation statistics
   * @returns {Object}
   */
  getStats() {
    const all = this.getAllRecommendations();
    const active = this.getActiveRecommendations();
    const byPriority = {
      critical: active.filter(r => r.priority === 'critical').length,
      high: active.filter(r => r.priority === 'high').length,
      medium: active.filter(r => r.priority === 'medium').length,
      low: active.filter(r => r.priority === 'low').length
    };
    const byType = {
      operational: active.filter(r => r.type === 'operational').length,
      inventory: active.filter(r => r.type === 'inventory').length,
      financial: active.filter(r => r.type === 'financial').length,
      staff: active.filter(r => r.type === 'staff').length,
      general: active.filter(r => r.type === 'general').length
    };

    return {
      total: all.length,
      active: active.length,
      acknowledged: all.length - active.length,
      byPriority,
      byType
    };
  }
}

// Singleton instance
const recommendationEngine = new RecommendationEngine();

export default recommendationEngine;
