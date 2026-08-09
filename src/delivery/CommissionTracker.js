// Commission Tracker for Delivery Platforms
// Track and report commissions from Zomato and Swiggy

import { getDeliveryOrderStorage } from './DeliveryPlatformAdapter.js';
import { getDeliveryPlatformFactory, PlatformType } from './DeliveryPlatformFactory.js';

export class CommissionTracker {
  constructor() {
    this.storage = getDeliveryOrderStorage();
    this.factory = getDeliveryPlatformFactory();
    this.settlementHistory = [];
    this.loadSettlementHistory();
  }

  /**
   * Load settlement history from localStorage
   */
  loadSettlementHistory() {
    try {
      const stored = localStorage.getItem('cafeos_settlement_history');
      if (stored) {
        this.settlementHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[CommissionTracker] Failed to load settlement history:', error);
    }
  }

  /**
   * Save settlement history to localStorage
   */
  saveSettlementHistory() {
    try {
      // Keep only last 1000 settlements
      if (this.settlementHistory.length > 1000) {
        this.settlementHistory.shift();
      }
      localStorage.setItem('cafeos_settlement_history', JSON.stringify(this.settlementHistory));
    } catch (error) {
      console.error('[CommissionTracker] Failed to save settlement history:', error);
    }
  }

  /**
   * Log settlement
   */
  logSettlement(platform, settlementData) {
    const logEntry = {
      platform,
      settlementId: settlementData.settlementId,
      amount: settlementData.amount,
      commission: settlementData.commission,
      netAmount: settlementData.netAmount,
      settlementDate: settlementData.settlementDate,
      orderIds: settlementData.orderIds,
      timestamp: new Date().toISOString()
    };
    
    this.settlementHistory.push(logEntry);
    this.saveSettlementHistory();
  }

  /**
   * Calculate commission for order
   */
  calculateCommission(orderAmount, platformType) {
    const config = this.factory.platformConfig.getConfig(platformType);
    const commissionRate = config?.commissionRate || 0.20; // Default 20%
    
    return {
      orderAmount,
      commissionRate,
      commissionAmount: orderAmount * commissionRate,
      netAmount: orderAmount - (orderAmount * commissionRate)
    };
  }

  /**
   * Get commission statistics for a date range
   */
  getCommissionStatistics(startDate, endDate) {
    const orders = this.storage.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    const stats = {
      totalOrders: filteredOrders.length,
      totalRevenue: 0,
      totalCommission: 0,
      netRevenue: 0,
      byPlatform: {},
      byStatus: {},
      averageCommissionRate: 0,
      averageOrderValue: 0
    };

    filteredOrders.forEach(order => {
      const amount = order.totalAmount || 0;
      const commission = order.commission || 0;
      const netAmount = order.netAmount || (amount - commission);

      stats.totalRevenue += amount;
      stats.totalCommission += commission;
      stats.netRevenue += netAmount;

      // By platform
      if (!stats.byPlatform[order.platform]) {
        stats.byPlatform[order.platform] = {
          orders: 0,
          revenue: 0,
          commission: 0,
          netRevenue: 0
        };
      }
      stats.byPlatform[order.platform].orders++;
      stats.byPlatform[order.platform].revenue += amount;
      stats.byPlatform[order.platform].commission += commission;
      stats.byPlatform[order.platform].netRevenue += netAmount;

      // By status
      if (!stats.byStatus[order.status]) {
        stats.byStatus[order.status] = 0;
      }
      stats.byStatus[order.status]++;
    });

    // Calculate averages
    if (stats.totalOrders > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
      stats.averageCommissionRate = (stats.totalCommission / stats.totalRevenue) * 100;
    }

    return stats;
  }

  /**
   * Get commission statistics for today
   */
  getTodayCommission() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getCommissionStatistics(startOfDay, endOfDay);
  }

  /**
   * Get commission statistics for this week
   */
  getThisWeekCommission() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return this.getCommissionStatistics(startOfWeek, endOfWeek);
  }

  /**
   * Get commission statistics for this month
   */
  getThisMonthCommission() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    return this.getCommissionStatistics(startOfMonth, endOfMonth);
  }

  /**
   * Get commission by platform
   */
  getCommissionByPlatform(platformType, startDate, endDate) {
    const stats = this.getCommissionStatistics(startDate, endDate);
    return stats.byPlatform[platformType] || {
      orders: 0,
      revenue: 0,
      commission: 0,
      netRevenue: 0
    };
  }

  /**
   * Get commission trends
   */
  getCommissionTrends(days = 30) {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayStats = this.getCommissionStatistics(startOfDay, endOfDay);
      
      trends.push({
        date: startOfDay.toISOString().split('T')[0],
        revenue: dayStats.totalRevenue,
        commission: dayStats.totalCommission,
        netRevenue: dayStats.netRevenue,
        orders: dayStats.totalOrders
      });
    }
    
    return trends;
  }

  /**
   * Get settlement report
   */
  getSettlementReport(platformType, startDate, endDate) {
    const stats = this.getCommissionStatistics(startDate, endDate);
    const platformStats = stats.byPlatform[platformType];
    
    if (!platformStats) {
      return {
        platform: platformType,
        period: { startDate, endDate },
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0,
        averageCommissionRate: 0
      };
    }

    const config = this.factory.platformConfig.getConfig(platformType);
    const commissionRate = config?.commissionRate || 0.20;

    return {
      platform: platformType,
      period: { startDate, endDate },
      totalOrders: platformStats.orders,
      totalRevenue: platformStats.revenue,
      totalCommission: platformStats.commission,
      netRevenue: platformStats.netRevenue,
      averageCommissionRate: commissionRate * 100,
      commissionBreakdown: {
        rate: commissionRate * 100,
        totalCommission: platformStats.commission,
        effectiveRate: (platformStats.commission / platformStats.revenue) * 100
      }
    };
  }

  /**
   * Record manual settlement
   */
  recordSettlement(platformType, settlementData) {
    const settlement = {
      settlementId: settlementData.settlementId || `settlement_${Date.now()}`,
      platform: platformType,
      amount: settlementData.amount,
      commission: settlementData.commission,
      netAmount: settlementData.netAmount,
      settlementDate: settlementData.settlementDate || new Date().toISOString(),
      orderIds: settlementData.orderIds || [],
      notes: settlementData.notes || ''
    };

    this.logSettlement(platformType, settlement);
    
    return settlement;
  }

  /**
   * Get settlement history
   */
  getSettlementHistory(limit = 50) {
    return this.settlementHistory.slice(-limit);
  }

  /**
   * Get pending settlements
   */
  getPendingSettlements() {
    const orders = this.storage.getByStatus('COMPLETED');
    const settledOrderIds = new Set();
    
    this.settlementHistory.forEach(settlement => {
      settlement.orderIds.forEach(orderId => settledOrderIds.add(orderId));
    });

    const pendingOrders = orders.filter(order => !settledOrderIds.has(order.id));
    
    return {
      orders: pendingOrders,
      totalRevenue: pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      totalCommission: pendingOrders.reduce((sum, order) => sum + (order.commission || 0), 0),
      netRevenue: pendingOrders.reduce((sum, order) => sum + (order.netAmount || 0), 0)
    };
  }

  /**
   * Generate commission report
   */
  generateCommissionReport(startDate, endDate) {
    const stats = this.getCommissionStatistics(startDate, endDate);
    const pendingSettlements = this.getPendingSettlements();

    return {
      reportPeriod: { startDate, endDate },
      summary: {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        totalCommission: stats.totalCommission,
        netRevenue: stats.netRevenue,
        averageCommissionRate: stats.averageCommissionRate,
        averageOrderValue: stats.averageOrderValue
      },
      byPlatform: stats.byPlatform,
      byStatus: stats.byStatus,
      pendingSettlements,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export commission report to CSV
   */
  exportCommissionReportToCSV(startDate, endDate) {
    const report = this.generateCommissionReport(startDate, endDate);
    
    const csv = [
      'Commission Report',
      `Period: ${startDate} to ${endDate}`,
      '',
      'Summary',
      `Total Orders,${report.summary.totalOrders}`,
      `Total Revenue,${report.summary.totalRevenue.toFixed(2)}`,
      `Total Commission,${report.summary.totalCommission.toFixed(2)}`,
      `Net Revenue,${report.summary.netRevenue.toFixed(2)}`,
      `Average Commission Rate,${report.summary.averageCommissionRate.toFixed(2)}%`,
      `Average Order Value,${report.summary.averageOrderValue.toFixed(2)}`,
      '',
      'By Platform',
      'Platform,Orders,Revenue,Commission,Net Revenue'
    ];

    Object.entries(report.byPlatform).forEach(([platform, data]) => {
      csv.push(`${platform},${data.orders},${data.revenue.toFixed(2)},${data.commission.toFixed(2)},${data.netRevenue.toFixed(2)}`);
    });

    csv.push('');
    csv.push('Pending Settlements');
    csv.push(`Total Orders,${report.pendingSettlements.orders.length}`);
    csv.push(`Total Revenue,${report.pendingSettlements.totalRevenue.toFixed(2)}`);
    csv.push(`Total Commission,${report.pendingSettlements.totalCommission.toFixed(2)}`);
    csv.push(`Net Revenue,${report.pendingSettlements.netRevenue.toFixed(2)}`);

    return csv.join('\n');
  }

  /**
   * Get commission comparison between platforms
   */
  getPlatformComparison(startDate, endDate) {
    const stats = this.getCommissionStatistics(startDate, endDate);
    const comparison = [];

    Object.entries(stats.byPlatform).forEach(([platform, data]) => {
      const commissionRate = (data.commission / data.revenue) * 100;
      
      comparison.push({
        platform,
        orders: data.orders,
        revenue: data.revenue,
        commission: data.commission,
        netRevenue: data.netRevenue,
        commissionRate: commissionRate,
        averageOrderValue: data.revenue / data.orders
      });
    });

    // Sort by revenue descending
    comparison.sort((a, b) => b.revenue - a.revenue);

    return comparison;
  }

  /**
   * Clear settlement history
   */
  clearSettlementHistory() {
    this.settlementHistory = [];
    this.saveSettlementHistory();
  }

  /**
   * Destroy the commission tracker
   */
  destroy() {
    console.log('[CommissionTracker] Destroyed');
  }
}

// Singleton instance
let commissionTrackerInstance = null;

/**
 * Get the singleton commission tracker instance
 */
export function getCommissionTracker() {
  if (!commissionTrackerInstance) {
    commissionTrackerInstance = new CommissionTracker();
  }
  return commissionTrackerInstance;
}

export default CommissionTracker;
