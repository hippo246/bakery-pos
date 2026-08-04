// Promotion Engine
// Centralized promotion engine with scheduling and targeting

import { now } from '../domain/dates.js';

const PROMOTIONS_KEY = 'cafeos_promotions';

/**
 * Promotion Types
 */
export const PROMOTION_TYPES = {
  HAPPY_HOUR: 'HAPPY_HOUR',
  LUNCH_COMBO: 'LUNCH_COMBO',
  WEEKEND_OFFER: 'WEEKEND_OFFER',
  BIRTHDAY_OFFER: 'BIRTHDAY_OFFER',
  FIRST_VISIT: 'FIRST_VISIT',
  STUDENT_DISCOUNT: 'STUDENT_DISCOUNT',
  CORPORATE_DISCOUNT: 'CORPORATE_DISCOUNT',
  FESTIVAL_OFFER: 'FESTIVAL_OFFER',
  LOYALTY_REWARD: 'LOYALTY_REWARD',
  REFERRAL_REWARD: 'REFERRAL_REWARD',
  SEASONAL_OFFER: 'SEASONAL_OFFER',
  FLASH_SALE: 'FLASH_SALE',
  BUNDLE_OFFER: 'BUNDLE_OFFER'
};

/**
 * Promotion Status
 */
export const PROMOTION_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

/**
 * Promotion Engine class
 * Centralized promotion engine with scheduling and targeting
 */
export class PromotionEngine {
  constructor() {
    this.promotions = new Map();
    this.promotionCache = new Map();
    this.usageTracking = new Map();
    this.loadPromotions();
    this.startScheduler();
  }

  /**
   * Load promotions from localStorage
   */
  loadPromotions() {
    try {
      const stored = localStorage.getItem(PROMOTIONS_KEY);
      if (stored) {
        const promotions = JSON.parse(stored);
        promotions.forEach(promotion => {
          this.promotions.set(promotion.id, promotion);
        });
      }
    } catch (error) {
      console.error('[PromotionEngine] Failed to load promotions:', error);
    }
  }

  /**
   * Save promotions to localStorage
   */
  savePromotions() {
    try {
      const promotions = Array.from(this.promotions.values());
      localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(promotions));
      this.promotionCache.clear();
    } catch (error) {
      console.error('[PromotionEngine] Failed to save promotions:', error);
    }
  }

  /**
   * Start scheduler for auto activation/deactivation
   */
  startScheduler() {
    // Check every minute for scheduled promotions
    setInterval(() => {
      this.checkScheduledPromotions();
    }, 60000);
  }

  /**
   * Check and update scheduled promotions
   */
  checkScheduledPromotions() {
    const currentTime = now();

    for (const promotion of this.promotions.values()) {
      if (promotion.status === PROMOTION_STATUS.SCHEDULED) {
        if (promotion.schedule?.startTime && currentTime >= promotion.schedule.startTime) {
          this.updatePromotionStatus(promotion.id, PROMOTION_STATUS.ACTIVE);
        }
      }

      if (promotion.status === PROMOTION_STATUS.ACTIVE) {
        if (promotion.schedule?.endTime && currentTime >= promotion.schedule.endTime) {
          this.updatePromotionStatus(promotion.id, PROMOTION_STATUS.EXPIRED);
        }
      }
    }
  }

  /**
   * Add a promotion
   * @param {Object} promotionData - Promotion data
   * @returns {Object} Created promotion
   */
  addPromotion(promotionData) {
    const promotion = {
      id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: promotionData.type || PROMOTION_TYPES.HAPPY_HOUR,
      name: promotionData.name || 'Untitled Promotion',
      description: promotionData.description || '',
      status: promotionData.status || PROMOTION_STATUS.DRAFT,
      priority: promotionData.priority || 100,
      
      // Targeting
      branches: promotionData.branches || [],
      items: promotionData.items || [],
      categories: promotionData.categories || [],
      customerGroups: promotionData.customerGroups || [],
      customers: promotionData.customers || [],
      
      // Offer details
      discountType: promotionData.discountType || 'PERCENTAGE',
      discountValue: promotionData.discountValue || null,
      fixedAmount: promotionData.fixedAmount || null,
      freeItemId: promotionData.freeItemId || null,
      bonusPoints: promotionData.bonusPoints || null,
      
      // Conditions
      minSpend: promotionData.minSpend || null,
      maxSpend: promotionData.maxSpend || null,
      minQuantity: promotionData.minQuantity || null,
      maxQuantity: promotionData.maxQuantity || null,
      firstOrderOnly: promotionData.firstOrderOnly || false,
      newCustomersOnly: promotionData.newCustomersOnly || false,
      
      // Limits
      maxUsage: promotionData.maxUsage || null,
      maxUsagePerCustomer: promotionData.maxUsagePerCustomer || null,
      dailyLimit: promotionData.dailyLimit || null,
      
      // Schedule
      schedule: promotionData.schedule || null,
      
      // Metadata
      imageUrl: promotionData.imageUrl || null,
      terms: promotionData.terms || '',
      metadata: promotionData.metadata || {},
      
      // Audit
      createdAt: now(),
      createdBy: promotionData.createdBy || null,
      updatedAt: now(),
      updatedBy: promotionData.createdBy || null
    };

    this.promotions.set(promotion.id, promotion);
    this.savePromotions();

    return promotion;
  }

  /**
   * Get applicable promotions
   * @param {Object} context - Promotion context
   * @returns {Array} Applicable promotions sorted by priority
   */
  getApplicablePromotions(context) {
    const {
      menuItemId,
      categoryId,
      branchId,
      customerId,
      customerGroup,
      isNewCustomer,
      isFirstOrder,
      orderTotal,
      quantity,
      timestamp
    } = context;

    const currentTime = timestamp || now();
    const currentDay = new Date(currentTime).getDay();
    const currentHour = new Date(currentTime).getHours();

    const applicablePromotions = [];

    for (const promotion of this.promotions.values()) {
      if (promotion.status !== PROMOTION_STATUS.ACTIVE) continue;

      // Check branch targeting
      if (promotion.branches.length > 0 && !promotion.branches.includes(branchId)) continue;

      // Check item/category targeting
      if (promotion.items.length > 0 && !promotion.items.includes(menuItemId)) continue;
      if (promotion.categories.length > 0 && !promotion.categories.includes(categoryId)) continue;

      // Check customer targeting
      if (promotion.customers.length > 0 && !promotion.customers.includes(customerId)) continue;
      if (promotion.customerGroups.length > 0 && !promotion.customerGroups.includes(customerGroup)) continue;

      // Check customer conditions
      if (promotion.newCustomersOnly && !isNewCustomer) continue;
      if (promotion.firstOrderOnly && !isFirstOrder) continue;

      // Check spend conditions
      if (promotion.minSpend && orderTotal < promotion.minSpend) continue;
      if (promotion.maxSpend && orderTotal > promotion.maxSpend) continue;

      // Check quantity conditions
      if (promotion.minQuantity && quantity < promotion.minQuantity) continue;
      if (promotion.maxQuantity && quantity > promotion.maxQuantity) continue;

      // Check schedule
      if (promotion.schedule) {
        if (!this.isScheduleActive(promotion.schedule, currentTime, currentDay, currentHour)) {
          continue;
        }
      }

      // Check usage limits
      if (!this.checkUsageLimit(promotion, customerId)) {
        continue;
      }

      applicablePromotions.push(promotion);
    }

    return applicablePromotions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if schedule is active
   * @param {Object} schedule - Schedule configuration
   * @param {number} currentTime - Current timestamp
   * @param {number} currentDay - Current day of week
   * @param {number} currentHour - Current hour
   * @returns {boolean} Whether schedule is active
   */
  isScheduleActive(schedule, currentTime, currentDay, currentHour) {
    if (schedule.startDate && currentTime < schedule.startDate) return false;
    if (schedule.endDate && currentTime > schedule.endDate) return false;
    if (schedule.days && schedule.days.length > 0) {
      if (!schedule.days.includes(currentDay)) return false;
    }
    if (schedule.startTime !== undefined && schedule.endTime !== undefined) {
      if (currentHour < schedule.startTime || currentHour >= schedule.endTime) return false;
    }
    return true;
  }

  /**
   * Check usage limit
   * @param {Object} promotion - Promotion
   * @param {string} customerId - Customer ID
   * @returns {boolean} Whether usage limit is not exceeded
   */
  checkUsageLimit(promotion, customerId) {
    const usageKey = `${promotion.id}_${customerId || 'global'}`;
    const usage = this.usageTracking.get(usageKey) || { count: 0 };

    if (promotion.maxUsage && usage.count >= promotion.maxUsage) {
      return false;
    }

    if (customerId && promotion.maxUsagePerCustomer && usage.count >= promotion.maxUsagePerCustomer) {
      return false;
    }

    // Check daily limit
    if (promotion.dailyLimit) {
      const today = new Date().toDateString();
      if (usage.date !== today) {
        usage.dailyCount = 0;
        usage.date = today;
      }
      if (usage.dailyCount >= promotion.dailyLimit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply promotion to order
   * @param {string} promotionId - Promotion ID
   * @param {number} baseAmount - Base amount
   * @param {Object} context - Promotion context
   * @returns {Object} Application result
   */
  applyPromotion(promotionId, baseAmount, context) {
    const promotion = this.promotions.get(promotionId);
    if (!promotion) {
      return {
        success: false,
        reason: 'Promotion not found'
      };
    }

    if (promotion.status !== PROMOTION_STATUS.ACTIVE) {
      return {
        success: false,
        reason: 'Promotion is not active'
      };
    }

    let discountAmount = 0;
    let bonusPoints = 0;
    let freeItemId = null;

    switch (promotion.discountType) {
      case 'PERCENTAGE':
        if (promotion.discountValue !== null) {
          discountAmount = baseAmount * (promotion.discountValue / 100);
        }
        break;

      case 'FIXED_AMOUNT':
        if (promotion.fixedAmount !== null) {
          discountAmount = promotion.fixedAmount;
        }
        break;

      case 'FREE_ITEM':
        freeItemId = promotion.freeItemId;
        break;

      case 'BONUS_POINTS':
        bonusPoints = promotion.bonusPoints || 0;
        break;

      default:
        break;
    }

    // Track usage
    this.trackUsage(promotion.id, context.customerId);

    return {
      success: true,
      promotionId: promotion.id,
      promotionName: promotion.name,
      discountAmount,
      bonusPoints,
      freeItemId,
      finalAmount: Math.max(0, baseAmount - discountAmount)
    };
  }

  /**
   * Track promotion usage
   * @param {string} promotionId - Promotion ID
   * @param {string} customerId - Customer ID
   */
  trackUsage(promotionId, customerId) {
    const usageKey = `${promotionId}_${customerId || 'global'}`;
    const usage = this.usageTracking.get(usageKey) || { count: 0, dailyCount: 0 };
    usage.count++;
    usage.dailyCount++;
    usage.date = new Date().toDateString();
    usage.lastUsed = now();
    this.usageTracking.set(usageKey, usage);
  }

  /**
   * Update promotion status
   * @param {string} promotionId - Promotion ID
   * @param {string} status - New status
   * @returns {Object|null} Updated promotion or null
   */
  updatePromotionStatus(promotionId, status) {
    const promotion = this.promotions.get(promotionId);
    if (!promotion) return null;

    promotion.status = status;
    promotion.updatedAt = now();
    this.savePromotions();

    return promotion;
  }

  /**
   * Get all promotions
   * @returns {Array} Array of promotions
   */
  getAllPromotions() {
    return Array.from(this.promotions.values());
  }

  /**
   * Get promotion by ID
   * @param {string} promotionId - Promotion ID
   * @returns {Object|null} Promotion or null
   */
  getPromotion(promotionId) {
    return this.promotions.get(promotionId) || null;
  }

  /**
   * Get promotions by type
   * @param {string} type - Promotion type
   * @returns {Array} Array of promotions
   */
  getPromotionsByType(type) {
    return this.getAllPromotions().filter(p => p.type === type);
  }

  /**
   * Get promotions by status
   * @param {string} status - Promotion status
   * @returns {Array} Array of promotions
   */
  getPromotionsByStatus(status) {
    return this.getAllPromotions().filter(p => p.status === status);
  }

  /**
   * Get active promotions
   * @returns {Array} Array of active promotions
   */
  getActivePromotions() {
    return this.getPromotionsByStatus(PROMOTION_STATUS.ACTIVE);
  }

  /**
   * Update promotion
   * @param {string} promotionId - Promotion ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated promotion or null
   */
  updatePromotion(promotionId, updates) {
    const promotion = this.promotions.get(promotionId);
    if (!promotion) return null;

    const updated = {
      ...promotion,
      ...updates,
      updatedAt: now(),
      updatedBy: updates.updatedBy || null
    };

    this.promotions.set(promotionId, updated);
    this.savePromotions();

    return updated;
  }

  /**
   * Delete promotion
   * @param {string} promotionId - Promotion ID
   * @returns {boolean} Whether deletion was successful
   */
  deletePromotion(promotionId) {
    const deleted = this.promotions.delete(promotionId);
    if (deleted) {
      this.savePromotions();
    }
    return deleted;
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStatistics() {
    const stats = {};

    for (const [key, usage] of this.usageTracking) {
      const [promotionId, customerId] = key.split('_');
      if (!stats[promotionId]) {
        stats[promotionId] = { total: 0, byCustomer: {}, dailyCount: 0 };
      }
      stats[promotionId].total += usage.count;
      stats[promotionId].dailyCount += usage.dailyCount || 0;
      if (customerId !== 'global') {
        stats[promotionId].byCustomer[customerId] = usage.count;
      }
    }

    return stats;
  }

  /**
   * Get promotion statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const promotions = this.getAllPromotions();

    return {
      totalPromotions: promotions.length,
      byType: promotions.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      byStatus: promotions.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      active: promotions.filter(p => p.status === PROMOTION_STATUS.ACTIVE).length,
      scheduled: promotions.filter(p => p.status === PROMOTION_STATUS.SCHEDULED).length,
      expired: promotions.filter(p => p.status === PROMOTION_STATUS.EXPIRED).length
    };
  }

  /**
   * Clear promotion cache
   */
  clearCache() {
    this.promotionCache.clear();
  }

  /**
   * Export promotions
   * @returns {Object} Exported promotions
   */
  exportPromotions() {
    return {
      promotions: Array.from(this.promotions.values()),
      usageTracking: Object.fromEntries(this.usageTracking),
      exportedAt: now()
    };
  }

  /**
   * Import promotions
   * @param {Object} data - Imported promotions data
   * @returns {Object} Import result
   */
  importPromotions(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.promotions)) {
        data.promotions.forEach(promotion => {
          this.promotions.set(promotion.id, promotion);
        });
      }

      if (data.usageTracking && typeof data.usageTracking === 'object') {
        Object.entries(data.usageTracking).forEach(([key, value]) => {
          this.usageTracking.set(key, value);
        });
      }

      this.savePromotions();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let promotionEngineInstance = null;

/**
 * Get the promotion engine singleton
 * @returns {PromotionEngine} Promotion engine instance
 */
export function getPromotionEngine() {
  if (!promotionEngineInstance) {
    promotionEngineInstance = new PromotionEngine();
  }
  return promotionEngineInstance;
}

/**
 * Reset the promotion engine (useful for testing)
 */
export function resetPromotionEngine() {
  promotionEngineInstance = null;
}

/**
 * Convenience function to get applicable promotions
 * @param {Object} context - Promotion context
 * @returns {Array} Applicable promotions
 */
export function getApplicablePromotions(context = {}) {
  const engine = getPromotionEngine();
  return engine.getApplicablePromotions(context);
}
