// Delivery Fee Management System

export const FeeType = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
  DISTANCE_BASED: 'distance_based',
  TIERED: 'tiered'
};

export const FeeApplicability = {
  ALL_ORDERS: 'all_orders',
  MINIMUM_ORDER: 'minimum_order',
  LOCATION_BASED: 'location_based',
  TIME_BASED: 'time_based'
};

class DeliveryFeeManager {
  constructor() {
    this.feeRules = [];
    this.feeHistory = [];
    this.loadFromStorage();
  }

  // Load fee rules from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedRules = localStorage.getItem('delivery_fee_rules');
        const storedHistory = localStorage.getItem('delivery_fee_history');
        
        if (storedRules) {
          this.feeRules = JSON.parse(storedRules);
        }
        if (storedHistory) {
          this.feeHistory = JSON.parse(storedHistory);
        }
      }
    } catch (error) {
      console.error('Error loading delivery fee data:', error);
    }
  }

  // Save fee rules to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('delivery_fee_rules', JSON.stringify(this.feeRules));
        localStorage.setItem('delivery_fee_history', JSON.stringify(this.feeHistory));
      }
    } catch (error) {
      console.error('Error saving delivery fee data:', error);
    }
  }

  // Create fee rule
  createFeeRule(ruleData) {
    const rule = {
      id: this.generateId(),
      ...ruleData,
      type: ruleData.type || FeeType.FIXED,
      applicability: ruleData.applicability || FeeApplicability.ALL_ORDERS,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.feeRules.push(rule);
    this.saveToStorage();
    
    return rule;
  }

  // Update fee rule
  updateFeeRule(ruleId, updates) {
    const index = this.feeRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error('Fee rule not found');
    }

    const oldRule = { ...this.feeRules[index] };
    this.feeRules[index] = {
      ...this.feeRules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Record fee change
    this.recordFeeChange(oldRule, this.feeRules[index]);

    this.saveToStorage();
    return this.feeRules[index];
  }

  // Delete fee rule
  deleteFeeRule(ruleId) {
    const index = this.feeRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error('Fee rule not found');
    }

    this.feeRules[index].isActive = false;
    this.feeRules[index].deletedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // Calculate delivery fee for order
  calculateDeliveryFee(orderData) {
    const applicableRules = this.feeRules.filter(r => 
      r.isActive && this.isRuleApplicable(r, orderData)
    );

    if (applicableRules.length === 0) {
      return 0;
    }

    let totalFee = 0;

    applicableRules.forEach(rule => {
      switch (rule.type) {
        case FeeType.FIXED:
          totalFee += rule.amount || 0;
          break;

        case FeeType.PERCENTAGE:
          totalFee += orderData.orderAmount * (rule.rate / 100);
          break;

        case FeeType.DISTANCE_BASED:
          if (orderData.distance) {
            totalFee += this.calculateDistanceBasedFee(rule, orderData.distance);
          }
          break;

        case FeeType.TIERED:
          totalFee += this.calculateTieredFee(rule, orderData.orderAmount);
          break;
      }
    });

    // Apply maximum fee cap if set
    const maxFee = applicableRules.reduce((max, r) => Math.max(max, r.maxFee || Infinity), 0);
    if (maxFee < Infinity) {
      totalFee = Math.min(totalFee, maxFee);
    }

    return totalFee;
  }

  // Check if rule is applicable to order
  isRuleApplicable(rule, orderData) {
    switch (rule.applicability) {
      case FeeApplicability.ALL_ORDERS:
        return true;

      case FeeApplicability.MINIMUM_ORDER:
        return orderData.orderAmount >= (rule.minimumOrderAmount || 0);

      case FeeApplicability.LOCATION_BASED:
        return rule.locationIds?.includes(orderData.locationId) || 
               rule.postalCodes?.includes(orderData.postalCode);

      case FeeApplicability.TIME_BASED:
        const orderTime = new Date(orderData.orderTime);
        const startTime = new Date(rule.startTime);
        const endTime = new Date(rule.endTime);
        return orderTime >= startTime && orderTime <= endTime;

      default:
        return true;
    }
  }

  // Calculate distance-based fee
  calculateDistanceBasedFee(rule, distance) {
    if (rule.distanceTiers) {
      for (const tier of rule.distanceTiers) {
        if (distance >= tier.minDistance && distance <= tier.maxDistance) {
          return tier.fee;
        }
      }
    }
    return rule.baseFee || 0;
  }

  // Calculate tiered fee based on order amount
  calculateTieredFee(rule, orderAmount) {
    if (rule.amountTiers) {
      for (const tier of rule.amountTiers) {
        if (orderAmount >= tier.minAmount && orderAmount <= tier.maxAmount) {
          return tier.fee;
        }
      }
    }
    return rule.baseFee || 0;
  }

  // Get active fee rules
  getActiveFeeRules() {
    return this.feeRules.filter(r => r.isActive);
  }

  // Get fee rule by ID
  getFeeRule(ruleId) {
    return this.feeRules.find(r => r.id === ruleId);
  }

  // Get fee rules by platform
  getFeeRulesByPlatform(platform) {
    return this.feeRules.filter(r => r.platform === platform && r.isActive);
  }

  // Record fee change for tracking
  recordFeeChange(oldRule, newRule) {
    const change = {
      id: this.generateId(),
      ruleId: oldRule.id,
      ruleName: oldRule.name,
      oldFee: oldRule.amount || oldRule.rate,
      newFee: newRule.amount || newRule.rate,
      changeAmount: (newRule.amount || newRule.rate) - (oldRule.amount || oldRule.rate),
      timestamp: new Date().toISOString(),
      changedBy: 'system'
    };

    this.feeHistory.push(change);
    
    // Keep only last 1000 fee changes
    if (this.feeHistory.length > 1000) {
      this.feeHistory = this.feeHistory.slice(-1000);
    }
  }

  // Get fee history for a rule
  getFeeHistory(ruleId) {
    return this.feeHistory.filter(h => h.ruleId === ruleId);
  }

  // Get fee statistics
  getStatistics(startDate, endDate) {
    const rules = this.getActiveFeeRules();
    
    const byType = {};
    rules.forEach(rule => {
      byType[rule.type] = (byType[rule.type] || 0) + 1;
    });

    const byPlatform = {};
    rules.forEach(rule => {
      byPlatform[rule.platform] = (byPlatform[rule.platform] || 0) + 1;
    });

    return {
      totalRules: rules.length,
      byType,
      byPlatform,
      averageFee: rules.reduce((sum, r) => sum + (r.amount || r.rate || 0), 0) / rules.length
    };
  }

  // Generate unique ID
  generateId() {
    return `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export fee rules as CSV
  exportToCSV() {
    const headers = ['ID', 'Name', 'Type', 'Platform', 'Amount/Rate', 'Applicability', 'Status'];
    const rows = this.feeRules.map(r => [
      r.id,
      r.name,
      r.type,
      r.platform || 'N/A',
      r.amount || r.rate || 0,
      r.applicability,
      r.isActive ? 'Active' : 'Inactive'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let deliveryFeeManager = null;

export const getDeliveryFeeManager = () => {
  if (!deliveryFeeManager) {
    deliveryFeeManager = new DeliveryFeeManager();
  }
  return deliveryFeeManager;
};
