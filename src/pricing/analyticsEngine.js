// Analytics Engine
// Track promotion/coupon usage, revenue/profit impact, campaign performance

import { now } from '../domain/dates.js';

const ANALYTICS_KEY = 'cafeos_pricing_analytics';

/**
 * Analytics Engine class
 * Track promotion/coupon usage, revenue/profit impact, campaign performance
 */
export class PricingAnalyticsEngine {
  constructor() {
    this.metrics = new Map();
    this.dailyMetrics = new Map();
    this.loadMetrics();
  }

  /**
   * Load metrics from localStorage
   */
  loadMetrics() {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.metrics) {
          data.metrics.forEach(metric => {
            this.metrics.set(metric.id, metric);
          });
        }
        if (data.dailyMetrics) {
          data.dailyMetrics.forEach(metric => {
            this.dailyMetrics.set(metric.date, metric);
          });
        }
      }
    } catch (error) {
      console.error('[PricingAnalyticsEngine] Failed to load metrics:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  saveMetrics() {
    try {
      const data = {
        metrics: Array.from(this.metrics.values()),
        dailyMetrics: Array.from(this.dailyMetrics.values())
      };
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[PricingAnalyticsEngine] Failed to save metrics:', error);
    }
  }

  /**
   * Track promotion usage
   * @param {Object} usageData - Usage data
   * @returns {Object} Tracked metric
   */
  trackPromotionUsage(usageData) {
    const metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'PROMOTION_USAGE',
      promotionId: usageData.promotionId,
      promotionName: usageData.promotionName,
      orderId: usageData.orderId,
      customerId: usageData.customerId,
      branchId: usageData.branchId,
      
      // Financial impact
      discountAmount: usageData.discountAmount || 0,
      baseAmount: usageData.baseAmount || 0,
      finalAmount: usageData.finalAmount || 0,
      
      // Profit impact
      costAmount: usageData.costAmount || 0,
      originalProfit: usageData.originalProfit || 0,
      discountedProfit: usageData.discountedProfit || 0,
      profitImpact: usageData.profitImpact || 0,
      
      // Timestamp
      timestamp: now(),
      date: this.getDateKey(now())
    };

    this.metrics.set(metric.id, metric);
    this.updateDailyMetrics(metric);
    this.saveMetrics();

    return metric;
  }

  /**
   * Track coupon redemption
   * @param {Object} redemptionData - Redemption data
   * @returns {Object} Tracked metric
   */
  trackCouponRedemption(redemptionData) {
    const metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'COUPON_REDEMPTION',
      couponCode: redemptionData.couponCode,
      couponType: redemptionData.couponType,
      campaignId: redemptionData.campaignId,
      orderId: redemptionData.orderId,
      customerId: redemptionData.customerId,
      branchId: redemptionData.branchId,
      
      // Financial impact
      discountAmount: redemptionData.discountAmount || 0,
      bonusPoints: redemptionData.bonusPoints || 0,
      baseAmount: redemptionData.baseAmount || 0,
      finalAmount: redemptionData.finalAmount || 0,
      
      // Profit impact
      costAmount: redemptionData.costAmount || 0,
      originalProfit: redemptionData.originalProfit || 0,
      discountedProfit: redemptionData.discountedProfit || 0,
      profitImpact: redemptionData.profitImpact || 0,
      
      // Timestamp
      timestamp: now(),
      date: this.getDateKey(now())
    };

    this.metrics.set(metric.id, metric);
    this.updateDailyMetrics(metric);
    this.saveMetrics();

    return metric;
  }

  /**
   * Track discount usage
   * @param {Object} discountData - Discount data
   * @returns {Object} Tracked metric
   */
  trackDiscountUsage(discountData) {
    const metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'DISCOUNT_USAGE',
      discountRuleId: discountData.discountRuleId,
      discountType: discountData.discountType,
      orderId: discountData.orderId,
      customerId: discountData.customerId,
      branchId: discountData.branchId,
      
      // Financial impact
      discountAmount: discountData.discountAmount || 0,
      baseAmount: discountData.baseAmount || 0,
      finalAmount: discountData.finalAmount || 0,
      
      // Profit impact
      costAmount: discountData.costAmount || 0,
      originalProfit: discountData.originalProfit || 0,
      discountedProfit: discountData.discountedProfit || 0,
      profitImpact: discountData.profitImpact || 0,
      
      // Approval
      approvalId: discountData.approvalId || null,
      
      // Timestamp
      timestamp: now(),
      date: this.getDateKey(now())
    };

    this.metrics.set(metric.id, metric);
    this.updateDailyMetrics(metric);
    this.saveMetrics();

    return metric;
  }

  /**
   * Update daily metrics
   * @param {Object} metric - Metric to aggregate
   */
  updateDailyMetrics(metric) {
    const dateKey = metric.date;
    let dailyMetric = this.dailyMetrics.get(dateKey);

    if (!dailyMetric) {
      dailyMetric = {
        date: dateKey,
        timestamp: now(),
        promotionUsage: 0,
        couponRedemptions: 0,
        discountUsage: 0,
        totalDiscountAmount: 0,
        totalBaseAmount: 0,
        totalFinalAmount: 0,
        totalOriginalProfit: 0,
        totalDiscountedProfit: 0,
        totalProfitImpact: 0,
        byBranch: {},
        byPromotion: {},
        byCoupon: {},
        byDiscount: {}
      };
    }

    // Update counts
    if (metric.type === 'PROMOTION_USAGE') {
      dailyMetric.promotionUsage++;
      if (!dailyMetric.byPromotion[metric.promotionId]) {
        dailyMetric.byPromotion[metric.promotionId] = { count: 0, discountAmount: 0, profitImpact: 0 };
      }
      dailyMetric.byPromotion[metric.promotionId].count++;
      dailyMetric.byPromotion[metric.promotionId].discountAmount += metric.discountAmount;
      dailyMetric.byPromotion[metric.promotionId].profitImpact += metric.profitImpact;
    } else if (metric.type === 'COUPON_REDEMPTION') {
      dailyMetric.couponRedemptions++;
      if (!dailyMetric.byCoupon[metric.couponCode]) {
        dailyMetric.byCoupon[metric.couponCode] = { count: 0, discountAmount: 0, profitImpact: 0 };
      }
      dailyMetric.byCoupon[metric.couponCode].count++;
      dailyMetric.byCoupon[metric.couponCode].discountAmount += metric.discountAmount;
      dailyMetric.byCoupon[metric.couponCode].profitImpact += metric.profitImpact;
    } else if (metric.type === 'DISCOUNT_USAGE') {
      dailyMetric.discountUsage++;
      if (!dailyMetric.byDiscount[metric.discountRuleId]) {
        dailyMetric.byDiscount[metric.discountRuleId] = { count: 0, discountAmount: 0, profitImpact: 0 };
      }
      dailyMetric.byDiscount[metric.discountRuleId].count++;
      dailyMetric.byDiscount[metric.discountRuleId].discountAmount += metric.discountAmount;
      dailyMetric.byDiscount[metric.discountRuleId].profitImpact += metric.profitImpact;
    }

    // Update totals
    dailyMetric.totalDiscountAmount += metric.discountAmount;
    dailyMetric.totalBaseAmount += metric.baseAmount;
    dailyMetric.totalFinalAmount += metric.finalAmount;
    dailyMetric.totalOriginalProfit += metric.originalProfit;
    dailyMetric.totalDiscountedProfit += metric.discountedProfit;
    dailyMetric.totalProfitImpact += metric.profitImpact;

    // Update by branch
    if (metric.branchId) {
      if (!dailyMetric.byBranch[metric.branchId]) {
        dailyMetric.byBranch[metric.branchId] = { count: 0, discountAmount: 0, profitImpact: 0 };
      }
      dailyMetric.byBranch[metric.branchId].count++;
      dailyMetric.byBranch[metric.branchId].discountAmount += metric.discountAmount;
      dailyMetric.byBranch[metric.branchId].profitImpact += metric.profitImpact;
    }

    this.dailyMetrics.set(dateKey, dailyMetric);
  }

  /**
   * Get date key from timestamp
   * @param {number} timestamp - Timestamp
   * @returns {string} Date key (YYYY-MM-DD)
   */
  getDateKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Get promotion performance
   * @param {string} promotionId - Promotion ID
   * @param {Object} options - Query options
   * @returns {Object} Promotion performance data
   */
  getPromotionPerformance(promotionId, options = {}) {
    const { startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m => 
      m.type === 'PROMOTION_USAGE' && 
      m.promotionId === promotionId &&
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    if (metrics.length === 0) {
      return {
        promotionId,
        totalUsage: 0,
        totalDiscountAmount: 0,
        totalProfitImpact: 0,
        averageOrderValue: 0,
        averageDiscount: 0,
        byBranch: {},
        byCustomer: {}
      };
    }

    const totalUsage = metrics.length;
    const totalDiscountAmount = metrics.reduce((sum, m) => sum + m.discountAmount, 0);
    const totalProfitImpact = metrics.reduce((sum, m) => sum + m.profitImpact, 0);
    const totalBaseAmount = metrics.reduce((sum, m) => sum + m.baseAmount, 0);

    const byBranch = metrics.reduce((acc, m) => {
      if (!acc[m.branchId]) {
        acc[m.branchId] = { count: 0, discountAmount: 0, profitImpact: 0 };
      }
      acc[m.branchId].count++;
      acc[m.branchId].discountAmount += m.discountAmount;
      acc[m.branchId].profitImpact += m.profitImpact;
      return acc;
    }, {});

    const byCustomer = metrics.reduce((acc, m) => {
      if (m.customerId) {
        if (!acc[m.customerId]) {
          acc[m.customerId] = { count: 0, discountAmount: 0 };
        }
        acc[m.customerId].count++;
        acc[m.customerId].discountAmount += m.discountAmount;
      }
      return acc;
    }, {});

    return {
      promotionId,
      totalUsage,
      totalDiscountAmount,
      totalProfitImpact,
      averageOrderValue: totalBaseAmount / totalUsage,
      averageDiscount: totalDiscountAmount / totalUsage,
      byBranch,
      byCustomer,
      firstUsed: Math.min(...metrics.map(m => m.timestamp)),
      lastUsed: Math.max(...metrics.map(m => m.timestamp))
    };
  }

  /**
   * Get coupon performance
   * @param {string} couponCode - Coupon code
   * @param {Object} options - Query options
   * @returns {Object} Coupon performance data
   */
  getCouponPerformance(couponCode, options = {}) {
    const { startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m => 
      m.type === 'COUPON_REDEMPTION' && 
      m.couponCode === couponCode &&
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    if (metrics.length === 0) {
      return {
        couponCode,
        totalRedemptions: 0,
        totalDiscountAmount: 0,
        totalBonusPoints: 0,
        totalProfitImpact: 0,
        averageDiscount: 0,
        byBranch: {},
        byCustomer: {}
      };
    }

    const totalRedemptions = metrics.length;
    const totalDiscountAmount = metrics.reduce((sum, m) => sum + m.discountAmount, 0);
    const totalBonusPoints = metrics.reduce((sum, m) => sum + m.bonusPoints, 0);
    const totalProfitImpact = metrics.reduce((sum, m) => sum + m.profitImpact, 0);

    const byBranch = metrics.reduce((acc, m) => {
      if (!acc[m.branchId]) {
        acc[m.branchId] = { count: 0, discountAmount: 0, bonusPoints: 0 };
      }
      acc[m.branchId].count++;
      acc[m.branchId].discountAmount += m.discountAmount;
      acc[m.branchId].bonusPoints += m.bonusPoints;
      return acc;
    }, {});

    const byCustomer = metrics.reduce((acc, m) => {
      if (m.customerId) {
        if (!acc[m.customerId]) {
          acc[m.customerId] = { count: 0, discountAmount: 0, bonusPoints: 0 };
        }
        acc[m.customerId].count++;
        acc[m.customerId].discountAmount += m.discountAmount;
        acc[m.customerId].bonusPoints += m.bonusPoints;
      }
      return acc;
    }, {});

    return {
      couponCode,
      totalRedemptions,
      totalDiscountAmount,
      totalBonusPoints,
      totalProfitImpact,
      averageDiscount: totalDiscountAmount / totalRedemptions,
      byBranch,
      byCustomer,
      firstRedeemed: Math.min(...metrics.map(m => m.timestamp)),
      lastRedeemed: Math.max(...metrics.map(m => m.timestamp))
    };
  }

  /**
   * Get campaign performance
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   * @returns {Object} Campaign performance data
   */
  getCampaignPerformance(campaignId, options = {}) {
    const { startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m => 
      m.type === 'COUPON_REDEMPTION' && 
      m.campaignId === campaignId &&
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    if (metrics.length === 0) {
      return {
        campaignId,
        totalRedemptions: 0,
        totalDiscountAmount: 0,
        totalProfitImpact: 0,
        couponsUsed: [],
        byBranch: {}
      };
    }

    const totalRedemptions = metrics.length;
    const totalDiscountAmount = metrics.reduce((sum, m) => sum + m.discountAmount, 0);
    const totalProfitImpact = metrics.reduce((sum, m) => sum + m.profitImpact, 0);

    const couponsUsed = [...new Set(metrics.map(m => m.couponCode))];
    const byBranch = metrics.reduce((acc, m) => {
      if (!acc[m.branchId]) {
        acc[m.branchId] = { count: 0, discountAmount: 0 };
      }
      acc[m.branchId].count++;
      acc[m.branchId].discountAmount += m.discountAmount;
      return acc;
    }, {});

    return {
      campaignId,
      totalRedemptions,
      totalDiscountAmount,
      totalProfitImpact,
      couponsUsed,
      byBranch,
      firstUsed: Math.min(...metrics.map(m => m.timestamp)),
      lastUsed: Math.max(...metrics.map(m => m.timestamp))
    };
  }

  /**
   * Get most profitable offers
   * @param {Object} options - Query options
   * @returns {Array} Array of profitable offers
   */
  getMostProfitableOffers(options = {}) {
    const { limit = 10, startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m =>
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    const byOffer = new Map();

    metrics.forEach(m => {
      const offerId = m.type === 'PROMOTION_USAGE' ? m.promotionId : 
                     m.type === 'COUPON_REDEMPTION' ? m.couponCode : 
                     m.discountRuleId;

      if (!byOffer.has(offerId)) {
        byOffer.set(offerId, {
          offerId,
          type: m.type,
          totalProfitImpact: 0,
          totalDiscountAmount: 0,
          count: 0
        });
      }

      const offer = byOffer.get(offerId);
      offer.totalProfitImpact += m.profitImpact;
      offer.totalDiscountAmount += m.discountAmount;
      offer.count++;
    });

    return Array.from(byOffer.values())
      .sort((a, b) => b.totalProfitImpact - a.totalProfitImpact)
      .slice(0, limit);
  }

  /**
   * Get least effective offers
   * @param {Object} options - Query options
   * @returns {Array} Array of ineffective offers
   */
  getLeastEffectiveOffers(options = {}) {
    const { limit = 10, startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m =>
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    const byOffer = new Map();

    metrics.forEach(m => {
      const offerId = m.type === 'PROMOTION_USAGE' ? m.promotionId : 
                     m.type === 'COUPON_REDEMPTION' ? m.couponCode : 
                     m.discountRuleId;

      if (!byOffer.has(offerId)) {
        byOffer.set(offerId, {
          offerId,
          type: m.type,
          totalProfitImpact: 0,
          totalDiscountAmount: 0,
          count: 0
        });
      }

      const offer = byOffer.get(offerId);
      offer.totalProfitImpact += m.profitImpact;
      offer.totalDiscountAmount += m.discountAmount;
      offer.count++;
    });

    return Array.from(byOffer.values())
      .sort((a, b) => a.totalProfitImpact - b.totalProfitImpact)
      .slice(0, limit);
  }

  /**
   * Get customer redemption stats
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer redemption data
   */
  getCustomerRedemptionStats(customerId) {
    const metrics = Array.from(this.metrics.values()).filter(m => m.customerId === customerId);

    return {
      customerId,
      totalRedemptions: metrics.length,
      totalDiscountReceived: metrics.reduce((sum, m) => sum + m.discountAmount, 0),
      totalBonusPoints: metrics.reduce((sum, m) => sum + (m.bonusPoints || 0), 0),
      promotionsUsed: metrics.filter(m => m.type === 'PROMOTION_USAGE').length,
      couponsRedeemed: metrics.filter(m => m.type === 'COUPON_REDEMPTION').length,
      discountsUsed: metrics.filter(m => m.type === 'DISCOUNT_USAGE').length,
      firstRedemption: metrics.length > 0 ? Math.min(...metrics.map(m => m.timestamp)) : null,
      lastRedemption: metrics.length > 0 ? Math.max(...metrics.map(m => m.timestamp)) : null
    };
  }

  /**
   * Get daily metrics
   * @param {string} date - Date key (YYYY-MM-DD)
   * @returns {Object|null} Daily metrics or null
   */
  getDailyMetrics(date) {
    return this.dailyMetrics.get(date) || null;
  }

  /**
   * Get daily metrics range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Array of daily metrics
   */
  getDailyMetricsRange(startDate, endDate) {
    const metrics = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateKey = this.getDateKey(currentDate.getTime());
      const dailyMetric = this.dailyMetrics.get(dateKey);
      if (dailyMetric) {
        metrics.push(dailyMetric);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Get overall statistics
   * @param {Object} options - Query options
   * @returns {Object} Overall statistics
   */
  getOverallStatistics(options = {}) {
    const { startDate, endDate } = options;
    
    const metrics = Array.from(this.metrics.values()).filter(m =>
      (!startDate || m.timestamp >= startDate) &&
      (!endDate || m.timestamp <= endDate)
    );

    const promotionUsage = metrics.filter(m => m.type === 'PROMOTION_USAGE');
    const couponRedemptions = metrics.filter(m => m.type === 'COUPON_REDEMPTION');
    const discountUsage = metrics.filter(m => m.type === 'DISCOUNT_USAGE');

    return {
      totalMetrics: metrics.length,
      promotionUsage: promotionUsage.length,
      couponRedemptions: couponRedemptions.length,
      discountUsage: discountUsage.length,
      totalDiscountAmount: metrics.reduce((sum, m) => sum + m.discountAmount, 0),
      totalProfitImpact: metrics.reduce((sum, m) => sum + m.profitImpact, 0),
      totalBaseAmount: metrics.reduce((sum, m) => sum + m.baseAmount, 0),
      totalFinalAmount: metrics.reduce((sum, m) => sum + m.finalAmount, 0),
      uniqueCustomers: new Set(metrics.filter(m => m.customerId).map(m => m.customerId)).size,
      uniqueBranches: new Set(metrics.filter(m => m.branchId).map(m => m.branchId)).size,
      dateRange: {
        earliest: metrics.length > 0 ? Math.min(...metrics.map(m => m.timestamp)) : null,
        latest: metrics.length > 0 ? Math.max(...metrics.map(m => m.timestamp)) : null
      }
    };
  }

  /**
   * Clear old metrics
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of metrics cleared
   */
  clearOldMetrics(olderThan = 90 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [id, metric] of this.metrics) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(id);
        cleared++;
      }
    }

    // Clear old daily metrics
    for (const [date, dailyMetric] of this.dailyMetrics) {
      if (dailyMetric.timestamp < cutoff) {
        this.dailyMetrics.delete(date);
      }
    }

    if (cleared > 0) {
      this.saveMetrics();
    }

    return cleared;
  }

  /**
   * Export metrics
   * @param {Object} options - Export options
   * @returns {Object} Exported metrics
   */
  exportMetrics(options = {}) {
    const { startDate, endDate } = options;
    
    let metrics = Array.from(this.metrics.values());
    
    if (startDate) {
      metrics = metrics.filter(m => m.timestamp >= startDate);
    }
    if (endDate) {
      metrics = metrics.filter(m => m.timestamp <= endDate);
    }

    return {
      metrics,
      dailyMetrics: Array.from(this.dailyMetrics.values()),
      exportedAt: now(),
      totalMetrics: metrics.length
    };
  }

  /**
   * Import metrics
   * @param {Object} data - Imported metrics data
   * @returns {Object} Import result
   */
  importMetrics(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.metrics)) {
        data.metrics.forEach(metric => {
          this.metrics.set(metric.id, metric);
        });
      }

      if (Array.isArray(data.dailyMetrics)) {
        data.dailyMetrics.forEach(dailyMetric => {
          this.dailyMetrics.set(dailyMetric.date, dailyMetric);
        });
      }

      this.saveMetrics();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let analyticsEngineInstance = null;

/**
 * Get the pricing analytics engine singleton
 * @returns {PricingAnalyticsEngine} Analytics engine instance
 */
export function getPricingAnalyticsEngine() {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new PricingAnalyticsEngine();
  }
  return analyticsEngineInstance;
}

/**
 * Reset the analytics engine (useful for testing)
 */
export function resetPricingAnalyticsEngine() {
  analyticsEngineInstance = null;
}

/**
 * Convenience function to track promotion usage
 * @param {Object} usageData - Usage data
 * @returns {Object} Tracked metric
 */
export function trackPromotionUsage(usageData = {}) {
  const engine = getPricingAnalyticsEngine();
  return engine.trackPromotionUsage(usageData);
}

/**
 * Convenience function to track coupon redemption
 * @param {Object} redemptionData - Redemption data
 * @returns {Object} Tracked metric
 */
export function trackCouponRedemption(redemptionData = {}) {
  const engine = getPricingAnalyticsEngine();
  return engine.trackCouponRedemption(redemptionData);
}
