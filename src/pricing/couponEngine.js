// Coupon Engine
// Centralized coupon engine with QR/barcode support

import { now } from '../domain/dates.js';

const COUPONS_KEY = 'cafeos_coupons';

/**
 * Coupon Types
 */
export const COUPON_TYPES = {
  UNIQUE: 'UNIQUE',
  REUSABLE: 'REUSABLE',
  QR_CODE: 'QR_CODE',
  BARCODE: 'BARCODE',
  PROMO_CODE: 'PROMO_CODE'
};

/**
 * Coupon Status
 */
export const COUPON_STATUS = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED',
  PENDING: 'PENDING'
};

/**
 * Coupon Engine class
 * Centralized coupon engine with QR/barcode support
 */
export class CouponEngine {
  constructor() {
    this.coupons = new Map();
    this.couponRedemptions = new Map();
    this.campaigns = new Map();
    this.loadCoupons();
    this.loadCampaigns();
  }

  /**
   * Load coupons from localStorage
   */
  loadCoupons() {
    try {
      const stored = localStorage.getItem(COUPONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.coupons) {
          data.coupons.forEach(coupon => {
            this.coupons.set(coupon.code, coupon);
          });
        }
        if (data.redemptions) {
          data.redemptions.forEach(redemption => {
            this.couponRedemptions.set(redemption.id, redemption);
          });
        }
      }
    } catch (error) {
      console.error('[CouponEngine] Failed to load coupons:', error);
    }
  }

  /**
   * Save coupons to localStorage
   */
  saveCoupons() {
    try {
      const data = {
        coupons: Array.from(this.coupons.values()),
        redemptions: Array.from(this.couponRedemptions.values())
      };
      localStorage.setItem(COUPONS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[CouponEngine] Failed to save coupons:', error);
    }
  }

  /**
   * Load campaigns from localStorage
   */
  loadCampaigns() {
    try {
      const stored = localStorage.getItem('cafeos_coupon_campaigns');
      if (stored) {
        const campaigns = JSON.parse(stored);
        campaigns.forEach(campaign => {
          this.campaigns.set(campaign.id, campaign);
        });
      }
    } catch (error) {
      console.error('[CouponEngine] Failed to load campaigns:', error);
    }
  }

  /**
   * Save campaigns to localStorage
   */
  saveCampaigns() {
    try {
      const campaigns = Array.from(this.campaigns.values());
      localStorage.setItem('cafeos_coupon_campaigns', JSON.stringify(campaigns));
    } catch (error) {
      console.error('[CouponEngine] Failed to save campaigns:', error);
    }
  }

  /**
   * Generate a unique coupon code
   * @param {number} length - Code length
   * @returns {string} Generated code
   */
  generateCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate QR code data URL (placeholder - would use QR library in production)
   * @param {string} code - Coupon code
   * @returns {string} QR code data URL
   */
  generateQRCode(code) {
    // In production, this would use a QR code library like qrcode.js
    // For now, return a placeholder
    return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSI1MCIgeT0iODAiIGZvbnQtc2l6ZT0iMTIiPkNPREU6ICR7Y29kZX08L3RleHQ+PC9zdmc+`;
  }

  /**
   * Generate barcode data URL (placeholder - would use barcode library in production)
   * @param {string} code - Coupon code
   * @returns {string} Barcode data URL
   */
  generateBarcode(code) {
    // In production, this would use a barcode library like JsBarcode
    // For now, return a placeholder
    return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iNTAiIHk9IjMwIiBmb250LXNpemU9IjEyIj5CQVJDT0RFOiAke2NvZGV9PC90ZXh0Pjwvc3ZnPg==`;
  }

  /**
   * Create a coupon
   * @param {Object} couponData - Coupon data
   * @returns {Object} Created coupon
   */
  createCoupon(couponData) {
    const code = couponData.code || this.generateCode();

    if (this.coupons.has(code)) {
      return {
        success: false,
        reason: 'Coupon code already exists'
      };
    }

    const coupon = {
      code,
      type: couponData.type || COUPON_TYPES.UNIQUE,
      status: couponData.status || COUPON_STATUS.ACTIVE,
      
      // Offer details
      discountType: couponData.discountType || 'PERCENTAGE',
      discountValue: couponData.discountValue || null,
      fixedAmount: couponData.fixedAmount || null,
      freeItemId: couponData.freeItemId || null,
      bonusPoints: couponData.bonusPoints || null,
      
      // Targeting
      branches: couponData.branches || [],
      items: couponData.items || [],
      categories: couponData.categories || [],
      customerIds: couponData.customerIds || [],
      customerGroups: couponData.customerGroups || [],
      
      // Conditions
      minSpend: couponData.minSpend || null,
      maxSpend: couponData.maxSpend || null,
      minQuantity: couponData.minQuantity || null,
      maxQuantity: couponData.maxQuantity || null,
      firstOrderOnly: couponData.firstOrderOnly || false,
      
      // Limits
      maxUsage: couponData.maxUsage || null,
      maxUsagePerCustomer: couponData.maxUsagePerCustomer || null,
      
      // Schedule
      validFrom: couponData.validFrom || null,
      validUntil: couponData.validUntil || null,
      
      // Campaign
      campaignId: couponData.campaignId || null,
      
      // Visual
      qrCode: couponData.type === COUPON_TYPES.QR_CODE ? this.generateQRCode(code) : null,
      barcode: couponData.type === COUPON_TYPES.BARCODE ? this.generateBarcode(code) : null,
      imageUrl: couponData.imageUrl || null,
      
      // Metadata
      name: couponData.name || 'Untitled Coupon',
      description: couponData.description || '',
      terms: couponData.terms || '',
      metadata: couponData.metadata || {},
      
      // Audit
      createdAt: now(),
      createdBy: couponData.createdBy || null
    };

    this.coupons.set(code, coupon);
    this.saveCoupons();

    return {
      success: true,
      coupon
    };
  }

  /**
   * Create multiple coupons (bulk)
   * @param {Object} template - Coupon template
   * @param {number} count - Number of coupons to create
   * @returns {Object} Bulk creation result
   */
  createBulkCoupons(template, count) {
    const createdCoupons = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      const result = this.createCoupon({
        ...template,
        code: this.generateCode(),
        type: COUPON_TYPES.UNIQUE
      });

      if (result.success) {
        createdCoupons.push(result.coupon);
      } else {
        errors.push(result.reason);
      }
    }

    return {
      success: createdCoupons.length > 0,
      createdCoupons,
      errors,
      totalCreated: createdCoupons.length
    };
  }

  /**
   * Validate a coupon
   * @param {string} code - Coupon code
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  validateCoupon(code, context) {
    const coupon = this.coupons.get(code);

    if (!coupon) {
      return {
        valid: false,
        reason: 'Coupon not found'
      };
    }

    if (coupon.status !== COUPON_STATUS.ACTIVE) {
      return {
        valid: false,
        reason: `Coupon is ${coupon.status.toLowerCase()}`
      };
    }

    // Check expiry
    const currentTime = now();
    if (coupon.validFrom && currentTime < coupon.validFrom) {
      return {
        valid: false,
        reason: 'Coupon is not yet valid'
      };
    }

    if (coupon.validUntil && currentTime > coupon.validUntil) {
      // Auto-expire
      coupon.status = COUPON_STATUS.EXPIRED;
      this.saveCoupons();
      
      return {
        valid: false,
        reason: 'Coupon has expired'
      };
    }

    // Check branch targeting
    if (coupon.branches.length > 0 && !coupon.branches.includes(context.branchId)) {
      return {
        valid: false,
        reason: 'Coupon not valid for this branch'
      };
    }

    // Check item/category targeting
    if (coupon.items.length > 0 && !coupon.items.includes(context.menuItemId)) {
      return {
        valid: false,
        reason: 'Coupon not valid for this item'
      };
    }

    if (coupon.categories.length > 0 && !coupon.categories.includes(context.categoryId)) {
      return {
        valid: false,
        reason: 'Coupon not valid for this category'
      };
    }

    // Check customer targeting
    if (coupon.customerIds.length > 0 && !coupon.customerIds.includes(context.customerId)) {
      return {
        valid: false,
        reason: 'Coupon not valid for this customer'
      };
    }

    if (coupon.customerGroups.length > 0 && !coupon.customerGroups.includes(context.customerGroup)) {
      return {
        valid: false,
        reason: 'Coupon not valid for this customer group'
      };
    }

    // Check spend conditions
    if (coupon.minSpend && context.orderTotal < coupon.minSpend) {
      return {
        valid: false,
        reason: `Minimum spend of ${coupon.minSpend} required`
      };
    }

    if (coupon.maxSpend && context.orderTotal > coupon.maxSpend) {
      return {
        valid: false,
        reason: `Maximum spend of ${coupon.maxSpend} exceeded`
      };
    }

    // Check quantity conditions
    if (coupon.minQuantity && context.quantity < coupon.minQuantity) {
      return {
        valid: false,
        reason: `Minimum quantity of ${coupon.minQuantity} required`
      };
    }

    if (coupon.maxQuantity && context.quantity > coupon.maxQuantity) {
      return {
        valid: false,
        reason: `Maximum quantity of ${coupon.maxQuantity} exceeded`
      };
    }

    // Check first order condition
    if (coupon.firstOrderOnly && !context.isFirstOrder) {
      return {
        valid: false,
        reason: 'Coupon only valid for first order'
      };
    }

    // Check usage limits
    const usageCheck = this.checkUsageLimit(coupon, context.customerId);
    if (!usageCheck.valid) {
      return {
        valid: false,
        reason: usageCheck.reason
      };
    }

    return {
      valid: true,
      coupon
    };
  }

  /**
   * Check usage limit for coupon
   * @param {Object} coupon - Coupon
   * @param {string} customerId - Customer ID
   * @returns {Object} Usage check result
   */
  checkUsageLimit(coupon, customerId) {
    const redemptions = this.getCouponRedemptions(coupon.code);
    const totalUsage = redemptions.length;

    if (coupon.maxUsage && totalUsage >= coupon.maxUsage) {
      return {
        valid: false,
        reason: 'Coupon usage limit exceeded'
      };
    }

    if (customerId && coupon.maxUsagePerCustomer) {
      const customerUsage = redemptions.filter(r => r.customerId === customerId).length;
      if (customerUsage >= coupon.maxUsagePerCustomer) {
        return {
          valid: false,
          reason: 'Coupon usage limit per customer exceeded'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Redeem a coupon
   * @param {string} code - Coupon code
   * @param {Object} context - Redemption context
   * @returns {Object} Redemption result
   */
  redeemCoupon(code, context) {
    const validation = this.validateCoupon(code, context);

    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason
      };
    }

    const coupon = validation.coupon;

    let discountAmount = 0;
    let bonusPoints = 0;
    let freeItemId = null;

    switch (coupon.discountType) {
      case 'PERCENTAGE':
        if (coupon.discountValue !== null) {
          discountAmount = context.orderTotal * (coupon.discountValue / 100);
        }
        break;

      case 'FIXED_AMOUNT':
        if (coupon.fixedAmount !== null) {
          discountAmount = coupon.fixedAmount;
        }
        break;

      case 'FREE_ITEM':
        freeItemId = coupon.freeItemId;
        break;

      case 'BONUS_POINTS':
        bonusPoints = coupon.bonusPoints || 0;
        break;

      default:
        break;
    }

    // Record redemption
    const redemption = {
      id: `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      couponCode: code,
      customerId: context.customerId,
      orderId: context.orderId,
      branchId: context.branchId,
      discountAmount,
      bonusPoints,
      freeItemId,
      redeemedAt: now(),
      redeemedBy: context.redeemedBy || null
    };

    this.couponRedemptions.set(redemption.id, redemption);
    this.saveCoupons();

    // Update coupon status if single-use
    if (coupon.type === COUPON_TYPES.UNIQUE) {
      coupon.status = COUPON_STATUS.USED;
      coupon.usedAt = now();
      this.saveCoupons();
    }

    return {
      success: true,
      redemption,
      discountAmount,
      bonusPoints,
      freeItemId,
      finalAmount: Math.max(0, context.orderTotal - discountAmount)
    };
  }

  /**
   * Get coupon redemptions
   * @param {string} couponCode - Coupon code
   * @returns {Array} Array of redemptions
   */
  getCouponRedemptions(couponCode) {
    return Array.from(this.couponRedemptions.values())
      .filter(r => r.couponCode === couponCode);
  }

  /**
   * Get all coupons
   * @returns {Array} Array of coupons
   */
  getAllCoupons() {
    return Array.from(this.coupons.values());
  }

  /**
   * Get coupon by code
   * @param {string} code - Coupon code
   * @returns {Object|null} Coupon or null
   */
  getCoupon(code) {
    return this.coupons.get(code) || null;
  }

  /**
   * Get coupons by type
   * @param {string} type - Coupon type
   * @returns {Array} Array of coupons
   */
  getCouponsByType(type) {
    return this.getAllCoupons().filter(c => c.type === type);
  }

  /**
   * Get coupons by status
   * @param {string} status - Coupon status
   * @returns {Array} Array of coupons
   */
  getCouponsByStatus(status) {
    return this.getAllCoupons().filter(c => c.status === status);
  }

  /**
   * Get coupons by campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Array} Array of coupons
   */
  getCouponsByCampaign(campaignId) {
    return this.getAllCoupons().filter(c => c.campaignId === campaignId);
  }

  /**
   * Update coupon
   * @param {string} code - Coupon code
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated coupon or null
   */
  updateCoupon(code, updates) {
    const coupon = this.coupons.get(code);
    if (!coupon) return null;

    const updated = {
      ...coupon,
      ...updates,
      updatedAt: now()
    };

    this.coupons.set(code, updated);
    this.saveCoupons();

    return updated;
  }

  /**
   * Delete coupon
   * @param {string} code - Coupon code
   * @returns {boolean} Whether deletion was successful
   */
  deleteCoupon(code) {
    const deleted = this.coupons.delete(code);
    if (deleted) {
      this.saveCoupons();
    }
    return deleted;
  }

  /**
   * Create a campaign
   * @param {Object} campaignData - Campaign data
   * @returns {Object} Created campaign
   */
  createCampaign(campaignData) {
    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: campaignData.name || 'Untitled Campaign',
      description: campaignData.description || '',
      status: campaignData.status || 'ACTIVE',
      startDate: campaignData.startDate || null,
      endDate: campaignData.endDate || null,
      budget: campaignData.budget || null,
      targetAudience: campaignData.targetAudience || [],
      imageUrl: campaignData.imageUrl || null,
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
   * Get campaign by ID
   * @param {string} campaignId - Campaign ID
   * @returns {Object|null} Campaign or null
   */
  getCampaign(campaignId) {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Get coupon statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const coupons = this.getAllCoupons();
    const redemptions = Array.from(this.couponRedemptions.values());

    return {
      totalCoupons: coupons.length,
      byType: coupons.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {}),
      byStatus: coupons.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      totalRedemptions: redemptions.length,
      totalDiscountValue: redemptions.reduce((sum, r) => sum + (r.discountAmount || 0), 0),
      totalBonusPoints: redemptions.reduce((sum, r) => sum + (r.bonusPoints || 0), 0),
      totalCampaigns: this.campaigns.size
    };
  }

  /**
   * Export coupons
   * @returns {Object} Exported coupons
   */
  exportCoupons() {
    return {
      coupons: Array.from(this.coupons.values()),
      redemptions: Array.from(this.couponRedemptions.values()),
      campaigns: Array.from(this.campaigns.values()),
      exportedAt: now()
    };
  }

  /**
   * Import coupons
   * @param {Object} data - Imported coupons data
   * @returns {Object} Import result
   */
  importCoupons(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.coupons)) {
        data.coupons.forEach(coupon => {
          this.coupons.set(coupon.code, coupon);
        });
      }

      if (Array.isArray(data.redemptions)) {
        data.redemptions.forEach(redemption => {
          this.couponRedemptions.set(redemption.id, redemption);
        });
      }

      if (Array.isArray(data.campaigns)) {
        data.campaigns.forEach(campaign => {
          this.campaigns.set(campaign.id, campaign);
        });
      }

      this.saveCoupons();
      this.saveCampaigns();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let couponEngineInstance = null;

/**
 * Get the coupon engine singleton
 * @returns {CouponEngine} Coupon engine instance
 */
export function getCouponEngine() {
  if (!couponEngineInstance) {
    couponEngineInstance = new CouponEngine();
  }
  return couponEngineInstance;
}

/**
 * Reset the coupon engine (useful for testing)
 */
export function resetCouponEngine() {
  couponEngineInstance = null;
}

/**
 * Convenience function to validate a coupon
 * @param {string} code - Coupon code
 * @param {Object} context - Validation context
 * @returns {Object} Validation result
 */
export function validateCoupon(code, context = {}) {
  const engine = getCouponEngine();
  return engine.validateCoupon(code, context);
}

/**
 * Convenience function to redeem a coupon
 * @param {string} code - Coupon code
 * @param {Object} context - Redemption context
 * @returns {Object} Redemption result
 */
export function redeemCoupon(code, context = {}) {
  const engine = getCouponEngine();
  return engine.redeemCoupon(code, context);
}
