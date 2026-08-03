/**
 * Business Intelligence Engine
 * Central engine for business intelligence, analytics, and recommendations
 * All insights are derived from real operational data using deterministic calculations
 */

class BusinessIntelligenceEngine {
  constructor() {
    this.analyticsCache = new Map();
    this.recommendationsCache = new Map();
    this.trendsCache = new Map();
    this.initialized = false;
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize the Business Intelligence Engine
   */
  initialize() {
    if (this.initialized) return;
    
    // Load configuration from storage if available
    this.loadConfiguration();
    
    this.initialized = true;
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      // Kitchen thresholds
      kitchen: {
        maxQueueSize: 15,
        targetPrepTime: 12, // minutes
        criticalPrepTime: 20, // minutes
        stationUtilizationWarning: 80, // percentage
        stationUtilizationCritical: 95 // percentage
      },
      // Table thresholds
      tables: {
        targetOccupancyTime: 45, // minutes
        overstayedThreshold: 90, // minutes
        lowOccupancyWarning: 30, // percentage
        highOccupancyWarning: 85 // percentage
      },
      // Inventory thresholds
      inventory: {
        criticalLevel: 5, // units
        lowLevel: 15, // units
        reorderLevel: 20, // units
        fastMovingThreshold: 10, // units per day
        slowMovingThreshold: 2 // units per day
      },
      // Payment thresholds
      payments: {
        failureRateWarning: 5, // percentage
        failureRateCritical: 10, // percentage
        avgTransactionTimeTarget: 30 // seconds
      },
      // Order thresholds
      orders: {
        targetPrepTime: 10, // minutes
        targetServiceTime: 5, // minutes
        cancellationRateWarning: 5, // percentage
        cancellationRateCritical: 10 // percentage
      },
      // Revenue targets
      revenue: {
        dailyTarget: 50000,
        hourlyTarget: 5000,
        growthTarget: 10 // percentage
      },
      // Business health weightings
      healthScore: {
        kitchenEfficiency: 0.25,
        orderCompletion: 0.20,
        inventoryHealth: 0.15,
        paymentSuccess: 0.15,
        customerFlow: 0.15,
        systemHealth: 0.10
      },
      // Recommendation sensitivity
      recommendations: {
        enabled: true,
        sensitivity: 'medium', // low, medium, high
        maxRecommendations: 10
      }
    };
  }

  /**
   * Load configuration from storage
   */
  loadConfiguration() {
    try {
      const stored = localStorage.getItem('cafeos_bi_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load BI configuration:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  saveConfiguration() {
    try {
      localStorage.setItem('cafeos_bi_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save BI configuration:', error);
    }
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  updateConfiguration(updates) {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();
    
    // Clear caches when configuration changes
    this.analyticsCache.clear();
    this.recommendationsCache.clear();
    this.trendsCache.clear();
  }

  /**
   * Get configuration
   * @returns {Object}
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Calculate business health score
   * @param {Object} operationalData - Real operational data from platform
   * @returns {Object} Health score with breakdown
   */
  calculateBusinessHealth(operationalData) {
    // Use real health data from Health Engine if available
    if (operationalData.health && operationalData.health.overallStatus) {
      const healthStatus = operationalData.health.overallStatus;
      const score = this.healthStatusToScore(healthStatus);
      
      return {
        overall: score,
        status: healthStatus,
        breakdown: this.calculateComponentBreakdown(operationalData),
        deductions: this.getHealthDeductionsFromEngine(operationalData)
      };
    }

    // Fallback to calculated health if Health Engine data not available
    const scores = {
      kitchenEfficiency: this.calculateKitchenEfficiency(operationalData),
      orderCompletion: this.calculateOrderCompletion(operationalData),
      inventoryHealth: this.calculateInventoryHealth(operationalData),
      paymentSuccess: this.calculatePaymentSuccess(operationalData),
      customerFlow: this.calculateCustomerFlow(operationalData),
      systemHealth: this.calculateSystemHealth(operationalData)
    };

    const weights = this.config.healthScore;
    const overallScore = (
      scores.kitchenEfficiency * weights.kitchenEfficiency +
      scores.orderCompletion * weights.orderCompletion +
      scores.inventoryHealth * weights.inventoryHealth +
      scores.paymentSuccess * weights.paymentSuccess +
      scores.customerFlow * weights.customerFlow +
      scores.systemHealth * weights.systemHealth
    );

    const status = this.getHealthStatus(overallScore);

    return {
      overall: Math.round(overallScore),
      status,
      breakdown: scores,
      deductions: this.getHealthDeductions(scores)
    };
  }

  /**
   * Convert Health Engine status to score
   */
  healthStatusToScore(status) {
    switch (status) {
      case 'healthy': return 95;
      case 'warning': return 70;
      case 'critical': return 40;
      case 'offline': return 20;
      default: return 75;
    }
  }

  /**
   * Calculate component breakdown from real data
   */
  calculateComponentBreakdown(data) {
    return {
      kitchenEfficiency: this.calculateKitchenEfficiency(data),
      orderCompletion: this.calculateOrderCompletion(data),
      inventoryHealth: this.calculateInventoryHealth(data),
      paymentSuccess: this.calculatePaymentSuccess(data),
      customerFlow: this.calculateCustomerFlow(data),
      systemHealth: this.calculateSystemHealth(data)
    };
  }

  /**
   * Get health deductions from Health Engine
   */
  getHealthDeductionsFromEngine(data) {
    if (!data.health || !data.health.components) return [];
    
    const deductions = [];
    Object.entries(data.health.components).forEach(([component, health]) => {
      if (health.status !== 'healthy') {
        deductions.push({
          component,
          score: this.healthStatusToScore(health.status),
          reason: health.reason || `${component} status: ${health.status}`
        });
      }
    });
    
    return deductions;
  }

  /**
   * Calculate kitchen efficiency score
   */
  calculateKitchenEfficiency(data) {
    if (!data.kitchen) return 100;
    
    const { avgCookTime, kitchenLoad, delayedOrders, totalOrders } = data.kitchen;
    const targetTime = this.config.kitchen.targetPrepTime;
    
    let score = 100;
    
    // Deduct for slow cook time
    if (avgCookTime > targetTime) {
      score -= Math.min(30, ((avgCookTime - targetTime) / targetTime) * 30);
    }
    
    // Deduct for high load
    if (kitchenLoad > this.config.kitchen.stationUtilizationWarning) {
      score -= Math.min(20, (kitchenLoad - this.config.kitchen.stationUtilizationWarning) * 2);
    }
    
    // Deduct for delayed orders
    if (totalOrders > 0) {
      const delayRate = (delayedOrders / totalOrders) * 100;
      score -= Math.min(30, delayRate * 3);
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate order completion score
   */
  calculateOrderCompletion(data) {
    if (!data.orders) return 100;
    
    const { completed, total, cancelled, avgPrepTime } = data.orders;
    const targetTime = this.config.orders.targetPrepTime;
    
    let score = 100;
    
    // Completion rate
    if (total > 0) {
      const completionRate = (completed / total) * 100;
      score -= Math.min(20, (100 - completionRate) * 0.5);
    }
    
    // Cancellation rate
    if (total > 0) {
      const cancelRate = (cancelled / total) * 100;
      score -= Math.min(30, cancelRate * 3);
    }
    
    // Preparation time
    if (avgPrepTime > targetTime) {
      score -= Math.min(20, ((avgPrepTime - targetTime) / targetTime) * 20);
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate inventory health score
   */
  calculateInventoryHealth(data) {
    if (!data.inventory) return 100;
    
    const { critical, low, out } = data.inventory;
    
    let score = 100;
    
    // Deduct for critical items
    score -= Math.min(40, critical.length * 10);
    
    // Deduct for low items
    score -= Math.min(20, low.length * 5);
    
    // Deduct for out of stock
    score -= Math.min(40, out.length * 15);
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate payment success score
   */
  calculatePaymentSuccess(data) {
    if (!data.payments) return 100;
    
    const { failed, total, avgProcessingTime } = data.payments;
    const targetTime = this.config.payments.avgTransactionTimeTarget;
    
    let score = 100;
    
    // Failure rate
    if (total > 0) {
      const failureRate = (failed / total) * 100;
      score -= Math.min(40, failureRate * 4);
    }
    
    // Processing time
    if (avgProcessingTime > targetTime) {
      score -= Math.min(20, ((avgProcessingTime - targetTime) / targetTime) * 20);
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate customer flow score
   */
  calculateCustomerFlow(data) {
    if (!data.tables) return 100;
    
    const { occupancyRate, overstayed } = data.tables;
    
    let score = 100;
    
    // Deduct for low occupancy
    if (occupancyRate < this.config.tables.lowOccupancyWarning) {
      score -= Math.min(30, (this.config.tables.lowOccupancyWarning - occupancyRate) * 2);
    }
    
    // Deduct for overstayed tables
    score -= Math.min(20, overstayed * 5);
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate system health score
   */
  calculateSystemHealth(data) {
    if (!data.health) return 100;
    
    const { components } = data.health;
    let score = 100;
    
    Object.values(components).forEach(component => {
      if (component.status === 'critical') score -= 20;
      else if (component.status === 'warning') score -= 10;
      else if (component.status === 'offline') score -= 30;
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get health status from score
   */
  getHealthStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  }

  /**
   * Get health deductions
   */
  getHealthDeductions(scores) {
    const deductions = [];
    
    Object.entries(scores).forEach(([component, score]) => {
      if (score < 80) {
        deductions.push({
          component,
          score,
          reason: this.getDeductionReason(component, score)
        });
      }
    });
    
    return deductions;
  }

  /**
   * Get deduction reason
   */
  getDeductionReason(component, score) {
    const reasons = {
      kitchenEfficiency: 'Kitchen efficiency below target',
      orderCompletion: 'Order completion rate below target',
      inventoryHealth: 'Inventory levels require attention',
      paymentSuccess: 'Payment issues detected',
      customerFlow: 'Customer flow below optimal',
      systemHealth: 'System components require attention'
    };
    return reasons[component] || 'Performance below target';
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.analyticsCache.clear();
    this.recommendationsCache.clear();
    this.trendsCache.clear();
  }
}

// Singleton instance
const businessIntelligenceEngine = new BusinessIntelligenceEngine();

export default businessIntelligenceEngine;
