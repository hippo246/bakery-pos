// Business Health Calculator
// Calculates overall business health from various operational metrics

import { BusinessHealthStatus, BUSINESS_HEALTH_WEIGHTS, HEALTH_THRESHOLDS } from './DashboardTypes.js';

export class BusinessHealthCalculator {
  constructor() {
    this.weights = BUSINESS_HEALTH_WEIGHTS;
    this.thresholds = HEALTH_THRESHOLDS;
  }

  /**
   * Calculate overall business health
   * @param {object} metrics - Operational metrics
   * @returns {object} Health result
   */
  calculateHealth(metrics) {
    const componentScores = {
      orders: this.calculateOrdersHealth(metrics.orders || {}),
      kitchen: this.calculateKitchenHealth(metrics.kitchen || {}),
      waiters: this.calculateWaitersHealth(metrics.waiters || {}),
      inventory: this.calculateInventoryHealth(metrics.inventory || {}),
      reservations: this.calculateReservationsHealth(metrics.reservations || {}),
      payments: this.calculatePaymentsHealth(metrics.payments || {}),
      cloud: this.calculateCloudHealth(metrics.cloud || {})
    };

    const overallScore = this.calculateOverallScore(componentScores);
    const status = this.determineStatus(overallScore);
    const issues = this.identifyIssues(componentScores);

    return {
      status,
      score: overallScore,
      components: componentScores,
      issues
    };
  }

  /**
   * Calculate orders health
   * @param {object} ordersData - Orders data
   * @returns {object} Orders health
   */
  calculateOrdersHealth(ordersData) {
    const { total = 0, completed = 0, delayed = 0, cancelled = 0, averagePrepTime = 0 } = ordersData;

    if (total === 0) {
      return { score: 1.0, status: BusinessHealthStatus.HEALTHY, reason: 'No orders yet' };
    }

    const completionRate = completed / total;
    const delayRate = delayed / total;
    const cancellationRate = cancelled / total;

    let score = completionRate;
    score -= delayRate * 0.5;
    score -= cancellationRate * 0.8;

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'orders');
    const reason = this.getOrdersReason(completionRate, delayRate, cancellationRate);

    return { score, status, reason };
  }

  /**
   * Calculate kitchen health
   * @param {object} kitchenData - Kitchen data
   * @returns {object} Kitchen health
   */
  calculateKitchenHealth(kitchenData) {
    const { waiting = 0, cooking = 0, ready = 0, delayed = 0, capacity = 10, longestWaiting = 0 } = kitchenData;

    const totalTickets = waiting + cooking + ready;
    const utilization = total / capacity;
    const delayRate = total > 0 ? delayed / total : 0;

    let score = 1.0;
    score -= Math.max(0, (utilization - 0.8) * 2); // Penalize high utilization
    score -= delayRate * 0.5;
    score -= longestWaiting > 15 ? 0.3 : 0; // Penalize long wait times

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'kitchen');
    const reason = this.getKitchenReason(utilization, delayRate, longestWaiting);

    return { score, status, reason };
  }

  /**
   * Calculate waiters health
   * @param {object} waitersData - Waiters data
   * @returns {object} Waiters health
   */
  calculateWaitersHealth(waitersData) {
    const { awaitingPickup = 0, beingServed = 0, billRequests = 0, online = 1, averageServiceTime = 0 } = waitersData;

    const totalActive = awaitingPickup + beingServed + billRequests;
    const capacity = online * 5; // Assume 5 tables per waiter
    const utilization = capacity > 0 ? totalActive / capacity : 0;

    let score = 1.0;
    score -= Math.max(0, (utilization - 0.8) * 2);
    score -= averageServiceTime > 10 ? 0.2 : 0;

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'waiters');
    const reason = this.getWaitersReason(utilization, averageServiceTime);

    return { score, status, reason };
  }

  /**
   * Calculate inventory health
   * @param {object} inventoryData - Inventory data
   * @returns {object} Inventory health
   */
  calculateInventoryHealth(inventoryData) {
    const { lowStock = 0, outOfStock = 0, expiringToday = 0, totalItems = 100 } = inventoryData;

    const lowStockRate = totalItems > 0 ? lowStock / totalItems : 0;
    const outOfStockRate = totalItems > 0 ? outOfStock / totalItems : 0;
    const expiringRate = totalItems > 0 ? expiringToday / totalItems : 0;

    let score = 1.0;
    score -= lowStockRate * 0.3;
    score -= outOfStockRate * 0.8;
    score -= expiringRate * 0.5;

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'inventory');
    const reason = this.getInventoryReason(lowStock, outOfStock, expiringToday);

    return { score, status, reason };
  }

  /**
   * Calculate reservations health
   * @param {object} reservationsData - Reservations data
   * @returns {object} Reservations health
   */
  calculateReservationsHealth(reservationsData) {
    const { total = 0, checkedIn = 0, noShow = 0, overbooked = 0 } = reservationsData;

    if (total === 0) {
      return { score: 1.0, status: BusinessHealthStatus.HEALTHY, reason: 'No reservations today' };
    }

    const checkInRate = checkedIn / total;
    const noShowRate = noShow / total;
    const overbookRate = overbooked / total;

    let score = checkInRate;
    score -= noShowRate * 0.3;
    score -= overbookRate * 0.8;

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'reservations');
    const reason = this.getReservationsReason(checkInRate, noShowRate, overbooked);

    return { score, status, reason };
  }

  /**
   * Calculate payments health
   * @param {object} paymentsData - Payments data
   * @returns {object} Payments health
   */
  calculatePaymentsHealth(paymentsData) {
    const { total = 0, completed = 0, failed = 0, pending = 0, refunds = 0 } = paymentsData;

    if (total === 0) {
      return { score: 1.0, status: BusinessHealthStatus.HEALTHY, reason: 'No payments today' };
    }

    const completionRate = completed / total;
    const failureRate = total > 0 ? failed / total : 0;
    const pendingRate = total > 0 ? pending / total : 0;
    const refundRate = total > 0 ? refunds / total : 0;

    let score = completionRate;
    score -= failureRate * 0.8;
    score -= pendingRate * 0.3;
    score -= refundRate * 0.5;

    score = Math.max(0, Math.min(1, score));

    const status = this.determineComponentStatus(score, 'payments');
    const reason = this.getPaymentsReason(completionRate, failureRate, pendingRate);

    return { score, status, reason };
  }

  /**
   * Calculate cloud health
   * @param {object} cloudData - Cloud data
   * @returns {object} Cloud health
   */
  calculateCloudHealth(cloudData) {
    const { connected = true, database = true, storage = true, sync = true } = cloudData;

    let score = 1.0;
    if (!connected) score -= 0.5;
    if (!database) score -= 0.3;
    if (!storage) score -= 0.2;
    if (!sync) score -= 0.2;

    score = Math.max(0, Math.min(1, score));

    const status = score >= 0.9 ? BusinessHealthStatus.HEALTHY : BusinessHealthStatus.CRITICAL;
    const reason = this.getCloudReason(connected, database, storage, sync);

    return { score, status, reason };
  }

  /**
   * Calculate overall score from component scores
   * @param {object} componentScores - Component scores
   * @returns {number} Overall score
   */
  calculateOverallScore(componentScores) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [component, score] of Object.entries(componentScores)) {
      const weight = this.weights[component] || 0;
      weightedSum += score.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine status from score
   * @param {number} score - Health score
   * @returns {string} Health status
   */
  determineStatus(score) {
    if (score >= 0.8) return BusinessHealthStatus.HEALTHY;
    if (score >= 0.6) return BusinessHealthStatus.WARNING;
    return BusinessHealthStatus.CRITICAL;
  }

  /**
   * Determine component status from score
   * @param {number} score - Component score
   * @param {string} component - Component name
   * @returns {string} Component status
   */
  determineComponentStatus(score, component) {
    const thresholds = this.thresholds[component] || { healthy: 0.8, warning: 0.6 };
    
    if (score >= thresholds.healthy) return BusinessHealthStatus.HEALTHY;
    if (score >= thresholds.warning) return BusinessHealthStatus.WARNING;
    return BusinessHealthStatus.CRITICAL;
  }

  /**
   * Identify issues from component scores
   * @param {object} componentScores - Component scores
   * @returns {Array} Issues
   */
  identifyIssues(componentScores) {
    const issues = [];

    for (const [component, health] of Object.entries(componentScores)) {
      if (health.status === BusinessHealthStatus.CRITICAL) {
        issues.push({
          component,
          severity: 'critical',
          reason: health.reason
        });
      } else if (health.status === BusinessHealthStatus.WARNING) {
        issues.push({
          component,
          severity: 'warning',
          reason: health.reason
        });
      }
    }

    return issues;
  }

  /**
   * Get orders reason
   */
  getOrdersReason(completionRate, delayRate, cancellationRate) {
    if (cancellationRate > 0.1) return 'High cancellation rate';
    if (delayRate > 0.2) return 'Many delayed orders';
    if (completionRate < 0.8) return 'Low completion rate';
    return 'Orders processing normally';
  }

  /**
   * Get kitchen reason
   */
  getKitchenReason(utilization, delayRate, longestWaiting) {
    if (longestWaiting > 15) return 'Long wait times';
    if (delayRate > 0.2) return 'Many delayed tickets';
    if (utilization > 0.9) return 'Kitchen at capacity';
    return 'Kitchen operating normally';
  }

  /**
   * Get waiters reason
   */
  getWaitersReason(utilization, averageServiceTime) {
    if (averageServiceTime > 10) return 'Slow service times';
    if (utilization > 0.9) return 'Waiters at capacity';
    return 'Waiters operating normally';
  }

  /**
   * Get inventory reason
   */
  getInventoryReason(lowStock, outOfStock, expiringToday) {
    if (outOfStock > 0) return 'Items out of stock';
    if (expiringToday > 0) return 'Items expiring today';
    if (lowStock > 0) return 'Low stock items';
    return 'Inventory healthy';
  }

  /**
   * Get reservations reason
   */
  getReservationsReason(checkInRate, noShowRate, overbookRate) {
    if (overbookRate > 0) return 'Overbooked reservations';
    if (noShowRate > 0.2) return 'High no-show rate';
    if (checkInRate < 0.8) return 'Low check-in rate';
    return 'Reservations on track';
  }

  /**
   * Get payments reason
   */
  getPaymentsReason(completionRate, failureRate, pendingRate) {
    if (failureRate > 0.1) return 'Payment failures';
    if (pendingRate > 0.2) return 'Pending payments';
    if (completionRate < 0.9) return 'Low completion rate';
    return 'Payments processing normally';
  }

  /**
   * Get cloud reason
   */
  getCloudReason(connected, database, storage, sync) {
    if (!connected) return 'Cloud disconnected';
    if (!database) return 'Database offline';
    if (!storage) return 'Storage unavailable';
    if (!sync) return 'Sync issues';
    return 'Cloud systems healthy';
  }
}

// Singleton instance
let businessHealthCalculatorInstance = null;

/**
 * Get the singleton business health calculator instance
 * @returns {BusinessHealthCalculator} Business health calculator instance
 */
export function getBusinessHealthCalculator() {
  if (!businessHealthCalculatorInstance) {
    businessHealthCalculatorInstance = new BusinessHealthCalculator();
  }
  return businessHealthCalculatorInstance;
}

export default BusinessHealthCalculator;
