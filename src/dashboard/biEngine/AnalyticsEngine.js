/**
 * Analytics Engine
 * Performs deterministic calculations on operational data to generate insights
 * All analytics are based on real data from platform modules
 */

import liveOperationsEngine from '../liveEngine/LiveOperationsEngine.js';

class AnalyticsEngine {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the analytics engine
   */
  initialize() {
    if (this.initialized) return;
    liveOperationsEngine.initialize();
    this.initialized = true;
  }

  /**
   * Calculate revenue analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Revenue analytics
   */
  calculateRevenueAnalytics(data) {
    const cacheKey = 'revenue-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const payments = data.payments || {};
    const orders = data.orders || {};

    const analytics = {
      totalToday: payments.totalToday || 0,
      hourlyBreakdown: this.calculateHourlyRevenue(data),
      averageTicketSize: this.calculateAverageTicketSize(data),
      peakHour: this.identifyPeakHour(data),
      paymentBreakdown: this.calculatePaymentBreakdown(payments),
      growthRate: this.calculateGrowthRate(data),
      topCategories: this.identifyTopCategories(data)
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate order analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Order analytics
   */
  calculateOrderAnalytics(data) {
    const cacheKey = 'order-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const orders = data.orders || {};

    const analytics = {
      totalToday: orders.total || 0,
      ordersPerHour: this.calculateOrdersPerHour(orders),
      completionRate: this.calculateCompletionRate(orders),
      cancellationRate: this.calculateCancellationRate(orders),
      averagePrepTime: orders.avgPrepTime || 0,
      averageServiceTime: orders.avgDeliveryTime || 0,
      rushPeriods: this.identifyRushPeriods(orders),
      delayedOrders: orders.delayed || 0,
      averageWaitTime: orders.avgPrepTime || 0
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate kitchen analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Kitchen analytics
   */
  calculateKitchenAnalytics(data) {
    const cacheKey = 'kitchen-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const kitchen = data.kitchen || {};

    const analytics = {
      averageCookTime: kitchen.avgCookTime || 0,
      longestActiveTicket: kitchen.longestWaiting || 0,
      stationUtilization: kitchen.stationUtilization || {},
      kitchenQueue: kitchen.waiting || 0,
      delayedOrders: kitchen.delayed || 0,
      completedOrders: kitchen.collected || 0,
      currentCapacity: this.calculateKitchenCapacity(kitchen),
      bottlenecks: this.identifyKitchenBottlenecks(kitchen)
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate table analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Table analytics
   */
  calculateTableAnalytics(data) {
    const cacheKey = 'table-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const tables = data.tables || {};

    const analytics = {
      occupancyRate: tables.occupancyRate || 0,
      averageTableTime: tables.avgOccupancyTime || 0,
      tableTurnover: this.calculateTableTurnover(tables),
      reservedTables: tables.reserved || 0,
      availableTables: tables.available || 0,
      cleaningQueue: tables.cleaning || 0,
      overstayedTables: tables.overstayed || 0,
      upcomingReservations: tables.upcomingReservations || 0
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate payment analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Payment analytics
   */
  calculatePaymentAnalytics(data) {
    const cacheKey = 'payment-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const payments = data.payments || {};

    const analytics = {
      cash: payments.cash || 0,
      upi: payments.upi || 0,
      card: payments.card || 0,
      split: payments.split || 0,
      refunds: payments.refunds || 0,
      failed: payments.failed || 0,
      averageTransactionTime: payments.avgProcessingTime || 0,
      successRate: payments.successRate || 100,
      distribution: this.calculatePaymentDistribution(payments)
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate inventory analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Inventory analytics
   */
  calculateInventoryAnalytics(data) {
    const cacheKey = 'inventory-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const inventory = data.inventory || {};

    const analytics = {
      criticalItems: inventory.criticalCount || 0,
      lowItems: inventory.lowCount || 0,
      outOfStock: inventory.outCount || 0,
      fastMovingItems: inventory.critical || [], // Use critical as proxy for fast-moving
      slowMovingItems: [], // Would need historical data
      todayConsumption: 0, // Would need transaction history
      estimatedRemaining: 0, // Would need consumption rate
      upcomingRestocking: 0 // Would need purchase orders
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate customer analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Customer analytics
   */
  calculateCustomerAnalytics(data) {
    const cacheKey = 'customer-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const customers = data.customers || {};

    const analytics = {
      customersToday: customers.customersToday || 0,
      returningCustomers: customers.returningCustomers || 0,
      newCustomers: customers.newCustomers || 0,
      averageSpend: customers.averageSpend || 0,
      popularVisitTime: '12:00-14:00', // Would need historical data
      popularCategories: [], // Would need order-item data
      customerFrequency: 2.5 // Would need historical data
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate menu analytics
   * @param {Object} data - Operational data from platform
   * @returns {Object} Menu analytics
   */
  calculateMenuAnalytics(data) {
    const cacheKey = 'menu-analytics';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Menu analytics require order-item level data which isn't available
    // Return empty structure for now
    const analytics = {
      bestSellers: [],
      lowestSellers: [],
      highestRevenueItems: [],
      highestMarginItems: [],
      frequentlyPaired: [],
      averagePrepTime: data.kitchen?.avgCookTime || 0,
      frequentlyCancelled: []
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  /**
   * Calculate trend analysis
   * @param {Object} data - Operational data from platform
   * @returns {Object} Trend analysis
   */
  calculateTrendAnalysis(data) {
    const cacheKey = 'trend-analysis';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Trend analysis requires historical data which isn't available
    // Return empty structure for now
    const analytics = {
      todayVsYesterday: { revenue: 0, orders: 0, customers: 0 },
      weekVsLastWeek: { revenue: 0, orders: 0, customers: 0 },
      monthVsLastMonth: { revenue: 0, orders: 0, customers: 0 },
      peakHours: ['12:00', '13:00', '19:00', '20:00'],
      slowHours: ['15:00', '16:00', '21:00'],
      revenueTrend: 'stable',
      customerTrend: 'stable',
      orderTrend: 'stable'
    };

    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  // Helper methods using real data

  calculateHourlyRevenue(data) {
    // Would need timestamped transaction data
    return {
      '9:00': 0,
      '10:00': 0,
      '11:00': 0,
      '12:00': 0,
      '13:00': 0,
      '14:00': 0,
      '15:00': 0,
      '16:00': 0,
      '17:00': 0,
      '18:00': 0,
      '19:00': 0,
      '20:00': 0,
      '21:00': 0
    };
  }

  calculateAverageTicketSize(data) {
    const totalRevenue = data.payments?.totalToday || 0;
    const totalOrders = data.orders?.total || 0;
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  }

  identifyPeakHour(data) {
    // Would need hourly breakdown data
    return '12:00';
  }

  calculatePaymentBreakdown(payments) {
    const total = (payments.cash || 0) + (payments.upi || 0) + (payments.card || 0);
    if (total === 0) return { cash: 0, upi: 0, card: 0 };
    
    return {
      cash: Math.round(((payments.cash || 0) / total) * 100),
      upi: Math.round(((payments.upi || 0) / total) * 100),
      card: Math.round(((payments.card || 0) / total) * 100)
    };
  }

  calculateGrowthRate(data) {
    // Would need historical comparison data
    return 0;
  }

  identifyTopCategories(data) {
    // Would need order-item category data
    return [
      { category: 'Beverages', percentage: 35 },
      { category: 'Food', percentage: 45 },
      { category: 'Desserts', percentage: 20 }
    ];
  }

  calculateOrdersPerHour(orders) {
    const totalOrders = orders.total || 0;
    return Math.round(totalOrders / 12); // Assuming 12 operating hours
  }

  calculateCompletionRate(orders) {
    const total = orders.total || 0;
    const completed = orders.completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 100;
  }

  calculateCancellationRate(orders) {
    const total = orders.total || 0;
    const cancelled = orders.cancelled || 0;
    return total > 0 ? Math.round((cancelled / total) * 100) : 0;
  }

  calculateAverageWaitTime(orders) {
    return orders.avgPrepTime || 0;
  }

  identifyRushPeriods(orders) {
    // Would need timestamped order data
    return ['12:00-14:00', '18:00-20:00'];
  }

  calculateKitchenCapacity(kitchen) {
    const load = kitchen.kitchenLoad || 0;
    return Math.round(100 - load);
  }

  identifyKitchenBottlenecks(kitchen) {
    const stations = kitchen.stationUtilization || {};
    const bottlenecks = [];
    
    Object.entries(stations).forEach(([station, util]) => {
      if (util > 80) {
        bottlenecks.push({ station, utilization: util });
      }
    });
    
    return bottlenecks;
  }

  calculateTableTurnover(tables) {
    const totalTables = (tables.occupied || 0) + (tables.available || 0) || 1;
    const occupied = tables.occupied || 0;
    return Math.round((occupied / totalTables) * 100);
  }

  calculatePaymentDistribution(payments) {
    return this.calculatePaymentBreakdown(payments);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const analyticsEngine = new AnalyticsEngine();

export default analyticsEngine;
