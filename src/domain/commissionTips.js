// Commission and Tip Management System

export const CommissionType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  TIERED: 'tiered'
};

export const TipDistributionType = {
  EQUAL: 'equal',
  ROLE_BASED: 'role_based',
  HOURS_BASED: 'hours_based',
  CUSTOM: 'custom'
};

class CommissionTipManager {
  constructor() {
    this.commissionRules = [];
    this.tipPools = [];
    this.commissionPayments = [];
    this.tipDistributions = [];
    this.loadFromStorage();
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedCommissionRules = localStorage.getItem('commission_rules');
        const storedTipPools = localStorage.getItem('tip_pools');
        const storedCommissionPayments = localStorage.getItem('commission_payments');
        const storedTipDistributions = localStorage.getItem('tip_distributions');
        
        if (storedCommissionRules) {
          this.commissionRules = JSON.parse(storedCommissionRules);
        }
        if (storedTipPools) {
          this.tipPools = JSON.parse(storedTipPools);
        }
        if (storedCommissionPayments) {
          this.commissionPayments = JSON.parse(storedCommissionPayments);
        }
        if (storedTipDistributions) {
          this.tipDistributions = JSON.parse(storedTipDistributions);
        }
      }
    } catch (error) {
      console.error('Error loading commission/tip data:', error);
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('commission_rules', JSON.stringify(this.commissionRules));
        localStorage.setItem('tip_pools', JSON.stringify(this.tipPools));
        localStorage.setItem('commission_payments', JSON.stringify(this.commissionPayments));
        localStorage.setItem('tip_distributions', JSON.stringify(this.tipDistributions));
      }
    } catch (error) {
      console.error('Error saving commission/tip data:', error);
    }
  }

  // Create commission rule
  createCommissionRule(ruleData) {
    const rule = {
      id: this.generateId(),
      ...ruleData,
      type: ruleData.type || CommissionType.PERCENTAGE,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.commissionRules.push(rule);
    this.saveToStorage();
    
    return rule;
  }

  // Update commission rule
  updateCommissionRule(ruleId, updates) {
    const index = this.commissionRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error('Commission rule not found');
    }

    this.commissionRules[index] = {
      ...this.commissionRules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.commissionRules[index];
  }

  // Delete commission rule
  deleteCommissionRule(ruleId) {
    const index = this.commissionRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error('Commission rule not found');
    }

    this.commissionRules[index].isActive = false;
    this.saveToStorage();
    return true;
  }

  // Get commission rules for employee
  getCommissionRulesForEmployee(employeeId, role) {
    return this.commissionRules.filter(r => 
      r.isActive && 
      (r.employeeId === employeeId || r.role === role || r.isDefault)
    );
  }

  // Calculate commission for employee
  calculateCommission(employeeId, role, salesAmount, orderCount = 0) {
    const rules = this.getCommissionRulesForEmployee(employeeId, role);
    
    if (rules.length === 0) {
      return 0;
    }

    let totalCommission = 0;

    rules.forEach(rule => {
      switch (rule.type) {
        case CommissionType.PERCENTAGE:
          totalCommission += salesAmount * (rule.rate / 100);
          break;
          
        case CommissionType.FIXED:
          totalCommission += rule.amount || 0;
          break;
          
        case CommissionType.TIERED:
          if (rule.tiers) {
            rule.tiers.forEach(tier => {
              if (salesAmount >= tier.minSales && salesAmount <= tier.maxSales) {
                totalCommission += salesAmount * (tier.rate / 100);
              }
            });
          }
          break;
      }
    });

    return totalCommission;
  }

  // Create tip pool
  createTipPool(poolData) {
    const pool = {
      id: this.generateId(),
      ...poolData,
      distributionType: poolData.distributionType || TipDistributionType.EQUAL,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    this.tipPools.push(pool);
    this.saveToStorage();
    
    return pool;
  }

  // Add tip to pool
  addTipToPool poolId, tipData) {
    const pool = this.tipPools.find(p => p.id === poolId);
    if (!pool) {
      throw new Error('Tip pool not found');
    }

    const tip = {
      id: this.generateId(),
      ...tipData,
      poolId,
      addedAt: new Date().toISOString()
    };

    if (!pool.tips) {
      pool.tips = [];
    }
    pool.tips.push(tip);
    pool.totalAmount = (pool.totalAmount || 0) + (tip.amount || 0);

    this.saveToStorage();
    return tip;
  }

  // Distribute tip pool
  distributeTipPool(poolId, distributionData) {
    const pool = this.tipPools.find(p => p.id === poolId);
    if (!pool) {
      throw new Error('Tip pool not found');
    }

    const distributions = [];
    const totalAmount = pool.totalAmount || 0;
    const recipients = distributionData.recipients || [];

    switch (pool.distributionType) {
      case TipDistributionType.EQUAL:
        const equalShare = totalAmount / recipients.length;
        recipients.forEach(recipient => {
          distributions.push({
            id: this.generateId(),
            poolId,
            employeeId: recipient.employeeId,
            amount: equalShare,
            distributedAt: new Date().toISOString()
          });
        });
        break;

      case TipDistributionType.ROLE_BASED:
        const roleShares = distributionData.roleShares || {};
        recipients.forEach(recipient => {
          const share = roleShares[recipient.role] || 0;
          distributions.push({
            id: this.generateId(),
            poolId,
            employeeId: recipient.employeeId,
            amount: totalAmount * (share / 100),
            distributedAt: new Date().toISOString()
          });
        });
        break;

      case TipDistributionType.HOURS_BASED:
        const totalHours = recipients.reduce((sum, r) => sum + (r.hours || 0), 0);
        recipients.forEach(recipient => {
          const share = recipient.hours / totalHours;
          distributions.push({
            id: this.generateId(),
            poolId,
            employeeId: recipient.employeeId,
            amount: totalAmount * share,
            distributedAt: new Date().toISOString()
          });
        });
        break;

      case TipDistributionType.CUSTOM:
        distributionData.customShares.forEach(customShare => {
          distributions.push({
            id: this.generateId(),
            poolId,
            employeeId: customShare.employeeId,
            amount: customShare.amount,
            distributedAt: new Date().toISOString()
          });
        });
        break;
    }

    this.tipDistributions.push(...distributions);
    pool.status = 'distributed';
    pool.distributedAt = new Date().toISOString();
    this.saveToStorage();

    return distributions;
  }

  // Record commission payment
  recordCommissionPayment(paymentData) {
    const payment = {
      id: this.generateId(),
      ...paymentData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    this.commissionPayments.push(payment);
    this.saveToStorage();
    
    return payment;
  }

  // Get commission payments for employee
  getCommissionPayments(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.commissionPayments.filter(p => {
      const paymentDate = new Date(p.periodEnd || p.createdAt);
      return p.employeeId === employeeId && 
             paymentDate >= start && 
             paymentDate <= end;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get tip distributions for employee
  getTipDistributions(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.tipDistributions.filter(d => {
      const distributionDate = new Date(d.distributedAt);
      return d.employeeId === employeeId && 
             distributionDate >= start && 
             distributionDate <= end;
    }).sort((a, b) => new Date(b.distributedAt) - new Date(a.distributedAt));
  }

  // Get total earnings for employee (commission + tips)
  getTotalEarnings(employeeId, startDate, endDate) {
    const commissionPayments = this.getCommissionPayments(employeeId, startDate, endDate);
    const tipDistributions = this.getTipDistributions(employeeId, startDate, endDate);

    const totalCommission = commissionPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalTips = tipDistributions.reduce((sum, d) => sum + (d.amount || 0), 0);

    return {
      employeeId,
      period: { startDate, endDate },
      totalCommission,
      totalTips,
      totalEarnings: totalCommission + totalTips,
      commissionPayments,
      tipDistributions
    };
  }

  // Get tip pools
  getTipPools(filters = {}) {
    let filtered = [...this.tipPools];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(p => {
        const poolDate = new Date(p.createdAt);
        return poolDate >= new Date(filters.startDate) && poolDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Close tip pool
  closeTipPool(poolId, closedBy) {
    const pool = this.tipPools.find(p => p.id === poolId);
    if (!pool) {
      throw new Error('Tip pool not found');
    }

    pool.status = 'closed';
    pool.closedBy = closedBy;
    pool.closedAt = new Date().toISOString();

    this.saveToStorage();
    return pool;
  }

  // Get commission statistics
  getCommissionStatistics(startDate, endDate) {
    const payments = this.commissionPayments.filter(p => {
      const paymentDate = new Date(p.periodEnd || p.createdAt);
      return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
    });

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalPending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const byEmployee = {};
    payments.forEach(p => {
      if (!byEmployee[p.employeeId]) {
        byEmployee[p.employeeId] = { total: 0, paid: 0, pending: 0 };
      }
      byEmployee[p.employeeId].total += p.amount || 0;
      if (p.status === 'paid') {
        byEmployee[p.employeeId].paid += p.amount || 0;
      } else {
        byEmployee[p.employeeId].pending += p.amount || 0;
      }
    });

    return {
      totalPayments: payments.length,
      totalPaid,
      totalPending,
      byEmployee
    };
  }

  // Get tip statistics
  getTipStatistics(startDate, endDate) {
    const distributions = this.tipDistributions.filter(d => {
      const distributionDate = new Date(d.distributedAt);
      return distributionDate >= new Date(startDate) && distributionDate <= new Date(endDate);
    });

    const totalDistributed = distributions.reduce((sum, d) => sum + (d.amount || 0), 0);

    const byEmployee = {};
    distributions.forEach(d => {
      if (!byEmployee[d.employeeId]) {
        byEmployee[d.employeeId] = 0;
      }
      byEmployee[d.employeeId] += d.amount || 0;
    });

    return {
      totalDistributions: distributions.length,
      totalDistributed,
      byEmployee
    };
  }

  // Generate unique ID
  generateId() {
    return `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export commission payments as CSV
  exportCommissionToCSV(startDate, endDate) {
    const payments = this.commissionPayments.filter(p => {
      const paymentDate = new Date(p.periodEnd || p.createdAt);
      return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
    });

    const headers = ['ID', 'Employee ID', 'Period Start', 'Period End', 'Amount', 'Status', 'Created At'];
    const rows = payments.map(p => [
      p.id,
      p.employeeId,
      p.periodStart || 'N/A',
      p.periodEnd || 'N/A',
      p.amount || 0,
      p.status,
      p.createdAt
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Export tip distributions as CSV
  exportTipsToCSV(startDate, endDate) {
    const distributions = this.tipDistributions.filter(d => {
      const distributionDate = new Date(d.distributedAt);
      return distributionDate >= new Date(startDate) && distributionDate <= new Date(endDate);
    });

    const headers = ['ID', 'Pool ID', 'Employee ID', 'Amount', 'Distributed At'];
    const rows = distributions.map(d => [
      d.id,
      d.poolId,
      d.employeeId,
      d.amount || 0,
      d.distributedAt
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let commissionTipManager = null;

export const getCommissionTipManager = () => {
  if (!commissionTipManager) {
    commissionTipManager = new CommissionTipManager();
  }
  return commissionTipManager;
};
