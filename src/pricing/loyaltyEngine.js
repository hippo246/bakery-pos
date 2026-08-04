// Loyalty Engine
// Integrate loyalty points and rewards

import { now } from '../domain/dates.js';

const LOYALTY_KEY = 'cafeos_loyalty';
const LOYALTY_CAMPAIGNS_KEY = 'cafeos_loyalty_campaigns';

/**
 * Loyalty Tier Types
 */
export const LOYALTY_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  DIAMOND: 'DIAMOND'
};

/**
 * Reward Types
 */
export const REWARD_TYPES = {
  POINTS: 'POINTS',
  DISCOUNT: 'DISCOUNT',
  FREE_ITEM: 'FREE_ITEM',
  UPGRADE: 'UPGRADE',
  BONUS_MULTIPLIER: 'BONUS_MULTIPLIER'
};

/**
 * Loyalty Engine class
 * Integrate loyalty points and rewards
 */
export class LoyaltyEngine {
  constructor() {
    this.customerPoints = new Map();
    this.customerTiers = new Map();
    this.campaigns = new Map();
    this.redemptions = new Map();
    this.loadLoyaltyData();
    this.loadCampaigns();
  }

  /**
   * Load loyalty data from localStorage
   */
  loadLoyaltyData() {
    try {
      const stored = localStorage.getItem(LOYALTY_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.points) {
          data.points.forEach(entry => {
            this.customerPoints.set(entry.customerId, entry);
          });
        }
        if (data.tiers) {
          data.tiers.forEach(entry => {
            this.customerTiers.set(entry.customerId, entry);
          });
        }
        if (data.redemptions) {
          data.redemptions.forEach(redemption => {
            this.redemptions.set(redemption.id, redemption);
          });
        }
      }
    } catch (error) {
      console.error('[LoyaltyEngine] Failed to load loyalty data:', error);
    }
  }

  /**
   * Save loyalty data to localStorage
   */
  saveLoyaltyData() {
    try {
      const data = {
        points: Array.from(this.customerPoints.values()),
        tiers: Array.from(this.customerTiers.values()),
        redemptions: Array.from(this.redemptions.values())
      };
      localStorage.setItem(LOYALTY_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[LoyaltyEngine] Failed to save loyalty data:', error);
    }
  }

  /**
   * Load campaigns from localStorage
   */
  loadCampaigns() {
    try {
      const stored = localStorage.getItem(LOYALTY_CAMPAIGNS_KEY);
      if (stored) {
        const campaigns = JSON.parse(stored);
        campaigns.forEach(campaign => {
          this.campaigns.set(campaign.id, campaign);
        });
      } else {
        this.setDefaultCampaigns();
      }
    } catch (error) {
      console.error('[LoyaltyEngine] Failed to load campaigns:', error);
      this.setDefaultCampaigns();
    }
  }

  /**
   * Save campaigns to localStorage
   */
  saveCampaigns() {
    try {
      const campaigns = Array.from(this.campaigns.values());
      localStorage.setItem(LOYALTY_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    } catch (error) {
      console.error('[LoyaltyEngine] Failed to save campaigns:', error);
    }
  }

  /**
   * Set default loyalty campaigns
   */
  setDefaultCampaigns() {
    // Birthday reward campaign
    this.campaigns.set('birthday', {
      id: 'birthday',
      name: 'Birthday Reward',
      description: 'Bonus points on customer birthday',
      type: REWARD_TYPES.POINTS,
      pointsMultiplier: 2,
      enabled: true,
      metadata: {}
    });

    // Referral reward campaign
    this.campaigns.set('referral', {
      id: 'referral',
      name: 'Referral Bonus',
      description: 'Bonus points for referring new customers',
      type: REWARD_TYPES.POINTS,
      points: 500,
      enabled: true,
      metadata: {}
    });

    this.saveCampaigns();
  }

  /**
   * Get customer points
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer points data
   */
  getCustomerPoints(customerId) {
    return this.customerPoints.get(customerId) || {
      customerId,
      points: 0,
      earned: 0,
      redeemed: 0,
      lastEarnedAt: null,
      lastRedeemedAt: null
    };
  }

  /**
   * Get customer tier
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer tier data
   */
  getCustomerTier(customerId) {
    return this.customerTiers.get(customerId) || {
      customerId,
      tier: LOYALTY_TIERS.BRONZE,
      pointsRequired: 0,
      benefits: [],
      upgradedAt: null
    };
  }

  /**
   * Earn points
   * @param {string} customerId - Customer ID
   * @param {number} points - Points to earn
   * @param {Object} context - Earning context
   * @returns {Object} Earn result
   */
  earnPoints(customerId, points, context = {}) {
    const customerPoints = this.getCustomerPoints(customerId);
    const customerTier = this.getCustomerTier(customerId);

    // Apply tier multiplier
    const tierMultiplier = this.getTierMultiplier(customerTier.tier);
    const campaignMultiplier = this.getCampaignMultiplier(customerId, context);
    const totalMultiplier = tierMultiplier * campaignMultiplier;

    const earnedPoints = Math.floor(points * totalMultiplier);

    customerPoints.points += earnedPoints;
    customerPoints.earned += earnedPoints;
    customerPoints.lastEarnedAt = now();

    this.customerPoints.set(customerId, customerPoints);
    this.saveLoyaltyData();

    // Check for tier upgrade
    const tierUpgrade = this.checkTierUpgrade(customerId);

    return {
      success: true,
      customerId,
      basePoints: points,
      earnedPoints,
      tierMultiplier,
      campaignMultiplier,
      totalMultiplier,
      currentPoints: customerPoints.points,
      tierUpgrade
    };
  }

  /**
   * Redeem points
   * @param {string} customerId - Customer ID
   * @param {number} points - Points to redeem
   * @param {Object} context - Redemption context
   * @returns {Object} Redemption result
   */
  redeemPoints(customerId, points, context = {}) {
    const customerPoints = this.getCustomerPoints(customerId);

    if (customerPoints.points < points) {
      return {
        success: false,
        reason: 'Insufficient points',
        availablePoints: customerPoints.points,
        requestedPoints: points
      };
    }

    customerPoints.points -= points;
    customerPoints.redeemed += points;
    customerPoints.lastRedeemedAt = now();

    this.customerPoints.set(customerId, customerPoints);

    // Record redemption
    const redemption = {
      id: `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      points,
      orderId: context.orderId || null,
      rewardType: context.rewardType || REWARD_TYPES.DISCOUNT,
      rewardValue: context.rewardValue || null,
      redeemedAt: now(),
      metadata: context.metadata || {}
    };

    this.redemptions.set(redemption.id, redemption);
    this.saveLoyaltyData();

    return {
      success: true,
      customerId,
      redeemedPoints: points,
      remainingPoints: customerPoints.points,
      redemption
    };
  }

  /**
   * Get tier multiplier
   * @param {string} tier - Loyalty tier
   * @returns {number} Multiplier value
   */
  getTierMultiplier(tier) {
    const multipliers = {
      [LOYALTY_TIERS.BRONZE]: 1.0,
      [LOYALTY_TIERS.SILVER]: 1.25,
      [LOYALTY_TIERS.GOLD]: 1.5,
      [LOYALTY_TIERS.PLATINUM]: 2.0,
      [LOYALTY_TIERS.DIAMOND]: 2.5
    };
    return multipliers[tier] || 1.0;
  }

  /**
   * Get campaign multiplier
   * @param {string} customerId - Customer ID
   * @param {Object} context - Context
   * @returns {number} Multiplier value
   */
  getCampaignMultiplier(customerId, context) {
    let multiplier = 1.0;

    for (const campaign of this.campaigns.values()) {
      if (!campaign.enabled) continue;

      // Check birthday campaign
      if (campaign.id === 'birthday' && this.isCustomerBirthday(customerId, context.timestamp)) {
        multiplier *= campaign.pointsMultiplier || 1.0;
      }

      // Check referral campaign
      if (campaign.id === 'referral' && context.isReferral) {
        multiplier *= campaign.pointsMultiplier || 1.0;
      }
    }

    return multiplier;
  }

  /**
   * Check if it's customer's birthday
   * @param {string} customerId - Customer ID
   * @param {number} timestamp - Current timestamp
   * @returns {boolean} Whether it's birthday
   */
  isCustomerBirthday(customerId, timestamp) {
    // In a real implementation, this would check the customer's birth date
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check for tier upgrade
   * @param {string} customerId - Customer ID
   * @returns {Object|null} Tier upgrade info or null
   */
  checkTierUpgrade(customerId) {
    const customerPoints = this.getCustomerPoints(customerId);
    const currentTier = this.getCustomerTier(customerId);

    const tierThresholds = {
      [LOYALTY_TIERS.BRONZE]: 0,
      [LOYALTY_TIERS.SILVER]: 1000,
      [LOYALTY_TIERS.GOLD]: 5000,
      [LOYALTY_TIERS.PLATINUM]: 10000,
      [LOYALTY_TIERS.DIAMOND]: 25000
    };

    const tierOrder = [
      LOYALTY_TIERS.BRONZE,
      LOYALTY_TIERS.SILVER,
      LOYALTY_TIERS.GOLD,
      LOYALTY_TIERS.PLATINUM,
      LOYALTY_TIERS.DIAMOND
    ];

    const currentIndex = tierOrder.indexOf(currentTier.tier);
    
    for (let i = currentIndex + 1; i < tierOrder.length; i++) {
      const nextTier = tierOrder[i];
      if (customerPoints.points >= tierThresholds[nextTier]) {
        // Upgrade to next tier
        currentTier.tier = nextTier;
        currentTier.pointsRequired = tierThresholds[nextTier];
        currentTier.upgradedAt = now();
        currentTier.benefits = this.getTierBenefits(nextTier);

        this.customerTiers.set(customerId, currentTier);
        this.saveLoyaltyData();

        return {
          upgraded: true,
          previousTier: tierOrder[currentIndex],
          newTier: nextTier,
          benefits: currentTier.benefits
        };
      }
    }

    return null;
  }

  /**
   * Get tier benefits
   * @param {string} tier - Loyalty tier
   * @returns {Array} Array of benefits
   */
  getTierBenefits(tier) {
    const benefits = {
      [LOYALTY_TIERS.BRONZE]: ['Point earning', 'Birthday rewards'],
      [LOYALTY_TIERS.SILVER]: ['1.25x points', 'Birthday rewards', 'Exclusive offers'],
      [LOYALTY_TIERS.GOLD]: ['1.5x points', 'Birthday rewards', 'Exclusive offers', 'Priority seating'],
      [LOYALTY_TIERS.PLATINUM]: ['2x points', 'Birthday rewards', 'Exclusive offers', 'Priority seating', 'Free delivery'],
      [LOYALTY_TIERS.DIAMOND]: ['2.5x points', 'Birthday rewards', 'Exclusive offers', 'Priority seating', 'Free delivery', 'VIP events']
    };
    return benefits[tier] || [];
  }

  /**
   * Calculate points from order
   * @param {number} orderTotal - Order total
   * @param {string} customerId - Customer ID
   * @param {Object} context - Order context
   * @returns {Object} Points calculation result
   */
  calculateOrderPoints(orderTotal, customerId, context = {}) {
    const pointsPerCurrency = 10; // 10 points per currency unit
    const basePoints = Math.floor(orderTotal / pointsPerCurrency);

    const earnResult = this.earnPoints(customerId, basePoints, context);

    return earnResult;
  }

  /**
   * Get points value in currency
   * @param {number} points - Points to convert
   * @returns {number} Currency value
   */
  getPointsValue(points) {
    const pointsPerCurrency = 100; // 100 points = 1 currency unit
    return points / pointsPerCurrency;
  }

  /**
   * Get currency value in points
   * @param {number} currency - Currency to convert
   * @returns {number} Points value
   */
  getCurrencyPoints(currency) {
    const pointsPerCurrency = 100;
    return Math.floor(currency * pointsPerCurrency);
  }

  /**
   * Create loyalty campaign
   * @param {Object} campaignData - Campaign data
   * @returns {Object} Created campaign
   */
  createCampaign(campaignData) {
    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: campaignData.name || 'Untitled Campaign',
      description: campaignData.description || '',
      type: campaignData.type || REWARD_TYPES.POINTS,
      points: campaignData.points || null,
      pointsMultiplier: campaignData.pointsMultiplier || null,
      discountPercentage: campaignData.discountPercentage || null,
      freeItemId: campaignData.freeItemId || null,
      enabled: campaignData.enabled !== false,
      startDate: campaignData.startDate || null,
      endDate: campaignData.endDate || null,
      targetCustomerGroups: campaignData.targetCustomerGroups || [],
      metadata: campaignData.metadata || {},
      createdAt: now(),
      createdBy: campaignData.createdBy || null
    };

    this.campaigns.set(campaign.id, campaign);
    this.saveCampaigns();

    return campaign;
  }

  /**
   * Get all campaigns
   * @returns {Array} Array of campaigns
   */
  getAllCampaigns() {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get enabled campaigns
   * @returns {Array} Array of enabled campaigns
   */
  getEnabledCampaigns() {
    return this.getAllCampaigns().filter(c => c.enabled);
  }

  /**
   * Get campaign by ID
   * @param {string} campaignId - Campaign ID
   * @returns {Object|null} Campaign or null
   */
  getCampaign(campaignId) {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Update campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated campaign or null
   */
  updateCampaign(campaignId, updates) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const updated = {
      ...campaign,
      ...updates,
      updatedAt: now()
    };

    this.campaigns.set(campaignId, updated);
    this.saveCampaigns();

    return updated;
  }

  /**
   * Delete campaign
   * @param {string} campaignId - Campaign ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteCampaign(campaignId) {
    const deleted = this.campaigns.delete(campaignId);
    if (deleted) {
      this.saveCampaigns();
    }
    return deleted;
  }

  /**
   * Get customer redemptions
   * @param {string} customerId - Customer ID
   * @returns {Array} Array of redemptions
   */
  getCustomerRedemptions(customerId) {
    return Array.from(this.redemptions.values())
      .filter(r => r.customerId === customerId);
  }

  /**
   * Get loyalty statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const points = Array.from(this.customerPoints.values());
    const redemptions = Array.from(this.redemptions.values());

    return {
      totalCustomers: this.customerPoints.size,
      totalPointsEarned: points.reduce((sum, p) => sum + p.earned, 0),
      totalPointsRedeemed: points.reduce((sum, p) => sum + p.redeemed, 0),
      totalPointsBalance: points.reduce((sum, p) => sum + p.points, 0),
      byTier: Array.from(this.customerTiers.values()).reduce((acc, t) => {
        acc[t.tier] = (acc[t.tier] || 0) + 1;
        return acc;
      }, {}),
      totalRedemptions: redemptions.length,
      totalCampaigns: this.campaigns.size,
      enabledCampaigns: this.getEnabledCampaigns().length
    };
  }

  /**
   * Export loyalty data
   * @returns {Object} Exported data
   */
  exportLoyaltyData() {
    return {
      points: Array.from(this.customerPoints.values()),
      tiers: Array.from(this.customerTiers.values()),
      redemptions: Array.from(this.redemptions.values()),
      campaigns: Array.from(this.campaigns.values()),
      exportedAt: now()
    };
  }

  /**
   * Import loyalty data
   * @param {Object} data - Imported loyalty data
   * @returns {Object} Import result
   */
  importLoyaltyData(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.points)) {
        data.points.forEach(entry => {
          this.customerPoints.set(entry.customerId, entry);
        });
      }

      if (Array.isArray(data.tiers)) {
        data.tiers.forEach(entry => {
          this.customerTiers.set(entry.customerId, entry);
        });
      }

      if (Array.isArray(data.redemptions)) {
        data.redemptions.forEach(redemption => {
          this.redemptions.set(redemption.id, redemption);
        });
      }

      if (Array.isArray(data.campaigns)) {
        data.campaigns.forEach(campaign => {
          this.campaigns.set(campaign.id, campaign);
        });
      }

      this.saveLoyaltyData();
      this.saveCampaigns();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let loyaltyEngineInstance = null;

/**
 * Get the loyalty engine singleton
 * @returns {LoyaltyEngine} Loyalty engine instance
 */
export function getLoyaltyEngine() {
  if (!loyaltyEngineInstance) {
    loyaltyEngineInstance = new LoyaltyEngine();
  }
  return loyaltyEngineInstance;
}

/**
 * Reset the loyalty engine (useful for testing)
 */
export function resetLoyaltyEngine() {
  loyaltyEngineInstance = null;
}

/**
 * Convenience function to earn points
 * @param {string} customerId - Customer ID
 * @param {number} points - Points to earn
 * @param {Object} context - Earning context
 * @returns {Object} Earn result
 */
export function earnLoyaltyPoints(customerId, points, context = {}) {
  const engine = getLoyaltyEngine();
  return engine.earnPoints(customerId, points, context);
}

/**
 * Convenience function to redeem points
 * @param {string} customerId - Customer ID
 * @param {number} points - Points to redeem
 * @param {Object} context - Redemption context
 * @returns {Object} Redemption result
 */
export function redeemLoyaltyPoints(customerId, points, context = {}) {
  const engine = getLoyaltyEngine();
  return engine.redeemPoints(customerId, points, context);
}
