// Analytics Calculation Utilities
// Centralized, safe metric calculations for Analytics & Reports
// All calculations handle missing data gracefully and prevent NaN/Infinity

import { getOrderAmount } from '../domain/orderModel.js';
import { isDateInRange, parseDate } from './dateRangeUtils.js';

// Safety helpers
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeStr = (v, fallback = '') => {
  if (v === null || v === undefined) return fallback;
  return String(v).trim() || fallback;
};

const safeArr = (v) => Array.isArray(v) ? v : [];

const safeDate = (v) => parseDate(v);

// Currency formatting
const formatCurrency = (amount) => {
  const n = safeNum(amount);
  return `₹${  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Percentage formatting
const formatPercentage = (value) => {
  const n = safeNum(value);
  return `${n.toFixed(1)  }%`;
};

// Order status definitions
const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  IN_PREPARATION: 'IN_PREPARATION',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  VOIDED: 'VOIDED'
};

// Completed order statuses for revenue calculation
const COMPLETED_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.READY];

// Safe order amount extraction
const safeOrderAmount = (order) => {
  try {
    return safeNum(getOrderAmount(order));
  } catch {
    return 0;
  }
};

// Filter orders by date range
export const filterOrdersByDateRange = (orders, dateRange) => {
  if (!dateRange || !dateRange.start || !dateRange.end) return safeArr(orders);
  
  return safeArr(orders).filter(order => {
    const orderDate = safeDate(order?.createdAt);
    return orderDate && isDateInRange(orderDate, dateRange);
  });
};

// Filter orders by status
const filterOrdersByStatus = (orders, statuses) => {
  const statusSet = new Set(safeArr(statuses));
  return safeArr(orders).filter(order => statusSet.has(order?.status));
};

// Filter orders by channel/source
const filterOrdersByChannel = (orders, channels) => {
  const channelSet = new Set(safeArr(channels));
  return safeArr(orders).filter(order => channelSet.has(order?.source));
};

// Filter orders by payment method
const filterOrdersByPaymentMethod = (orders, methods) => {
  const methodSet = new Set(safeArr(methods));
  return safeArr(orders).filter(order => methodSet.has(order?.paymentMethod));
};

// SALES METRICS

/**
 * Gross Sales: Sales before refunds, discounts, voids
 */
export const calculateGrossSales = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  return completedOrders.reduce((sum, order) => sum + safeOrderAmount(order), 0);
};

/**
 * Net Sales: Gross sales minus refunds and applicable discounts
 */
export const calculateNetSales = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  const grossSales = calculateGrossSales(orders);
  const totalRefunds = completedOrders.reduce((sum, order) => {
    return sum + safeNum(order?.refundAmount);
  }, 0);
  const totalDiscounts = completedOrders.reduce((sum, order) => {
    return sum + safeNum(order?.discountAmount);
  }, 0);
  
  return grossSales - totalRefunds - totalDiscounts;
};

/**
 * Tax Collected: Tax actually recorded on completed sales
 */
export const calculateTaxCollected = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  return completedOrders.reduce((sum, order) => {
    return sum + safeNum(order?.taxAmount);
  }, 0);
};

/**
 * Total Collected: Actual successful payments received
 */
export const calculateTotalCollected = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  return completedOrders.reduce((sum, order) => {
    if (order?.payStatus === 'PAID') {
      return sum + safeOrderAmount(order);
    }
    return sum;
  }, 0);
};

/**
 * Outstanding: Invoice balance still unpaid
 */
export const calculateOutstanding = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  return completedOrders.reduce((sum, order) => {
    if (order?.payStatus !== 'PAID') {
      return sum + safeOrderAmount(order);
    }
    return sum;
  }, 0);
};

/**
 * Average Order Value: Net sales divided by eligible completed orders
 */
export const calculateAverageOrderValue = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  if (completedOrders.length === 0) return 0;
  
  const netSales = calculateNetSales(orders);
  return netSales / completedOrders.length;
};

/**
 * Refunds: Total refund amount
 */
export const calculateRefunds = (orders) => {
  const refundedOrders = filterOrdersByStatus(orders, [ORDER_STATUS.REFUNDED]);
  return refundedOrders.reduce((sum, order) => {
    return sum + safeNum(order?.refundAmount);
  }, 0);
};

/**
 * Discounts: Total discount amount (where historical data exists)
 */
export const calculateDiscounts = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  return completedOrders.reduce((sum, order) => {
    return sum + safeNum(order?.discountAmount);
  }, 0);
};

// ORDER METRICS

/**
 * Total Orders: Count of all orders in range
 */
export const calculateTotalOrders = (orders) => {
  return safeArr(orders).length;
};

/**
 * Completed Orders: Count of completed orders
 */
export const calculateCompletedOrders = (orders) => {
  return filterOrdersByStatus(orders, COMPLETED_STATUSES).length;
};

/**
 * Cancelled Orders: Count of cancelled orders
 */
export const calculateCancelledOrders = (orders) => {
  return filterOrdersByStatus(orders, [ORDER_STATUS.CANCELLED]).length;
};

/**
 * Refunded Orders: Count of refunded orders
 */
export const calculateRefundedOrders = (orders) => {
  return filterOrdersByStatus(orders, [ORDER_STATUS.REFUNDED]).length;
};

/**
 * Voided Orders: Count of voided orders
 */
export const calculateVoidedOrders = (orders) => {
  return filterOrdersByStatus(orders, [ORDER_STATUS.VOIDED]).length;
};

/**
 * Open Orders: Count of open/in-progress orders
 */
export const calculateOpenOrders = (orders) => {
  const openStatuses = [ORDER_STATUS.DRAFT, ORDER_STATUS.OPEN, ORDER_STATUS.CONFIRMED, ORDER_STATUS.IN_PREPARATION];
  return filterOrdersByStatus(orders, openStatuses).length;
};

/**
 * Cancellation Rate: Cancelled orders / total orders
 */
export const calculateCancellationRate = (orders) => {
  const total = calculateTotalOrders(orders);
  if (total === 0) return 0;
  
  const cancelled = calculateCancelledOrders(orders);
  return (cancelled / total) * 100;
};

/**
 * Refund Rate: Refunded orders / total orders
 */
export const calculateRefundRate = (orders) => {
  const total = calculateTotalOrders(orders);
  if (total === 0) return 0;
  
  const refunded = calculateRefundedOrders(orders);
  return (refunded / total) * 100;
};

/**
 * Completion Rate: Completed orders / total orders
 */
export const calculateCompletionRate = (orders) => {
  const total = calculateTotalOrders(orders);
  if (total === 0) return 0;
  
  const completed = calculateCompletedOrders(orders);
  return (completed / total) * 100;
};

/**
 * Items Per Order: Average items per order
 */
export const calculateItemsPerOrder = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  if (completedOrders.length === 0) return 0;
  
  const totalItems = completedOrders.reduce((sum, order) => {
    const items = safeArr(order?.items);
    return sum + items.reduce((itemSum, item) => {
      return itemSum + safeNum(item?.qty, 1);
    }, 0);
  }, 0);
  
  return totalItems / completedOrders.length;
};

// MENU PERFORMANCE METRICS

/**
 * Calculate item performance from orders
 */
export const calculateItemPerformance = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  const itemStats = {};
  
  completedOrders.forEach(order => {
    const items = safeArr(order?.items);
    items.forEach(item => {
      const name = safeStr(item?.name, 'Unknown Item');
      const category = safeStr(item?.category, 'Other');
      const qty = safeNum(item?.qty, 1);
      const price = safeNum(item?.price, 0);
      const cost = safeNum(item?.cost, null);
      
      if (!itemStats[name]) {
        itemStats[name] = {
          name,
          category,
          quantitySold: 0,
          grossSales: 0,
          refunds: 0,
          totalCost: 0,
          costAvailable: cost !== null
        };
      }
      
      itemStats[name].quantitySold += qty;
      itemStats[name].grossSales += (price * qty);
      
      if (cost !== null) {
        itemStats[name].totalCost += (cost * qty);
        itemStats[name].costAvailable = true;
      }
    });
  });
  
  return Object.values(itemStats).map(item => ({
    ...item,
    netSales: item.grossSales, // Simplified - refunds would need separate tracking
    averagePrice: item.quantitySold > 0 ? item.grossSales / item.quantitySold : 0,
    estimatedCost: item.costAvailable ? item.totalCost : null,
    estimatedGrossProfit: item.costAvailable ? item.grossSales - item.totalCost : null,
    estimatedMargin: item.costAvailable && item.grossSales > 0 
      ? ((item.grossSales - item.totalCost) / item.grossSales) * 100 
      : null
  })).sort((a, b) => b.quantitySold - a.quantitySold);
};

/**
 * Calculate category performance
 */
export const calculateCategoryPerformance = (orders) => {
  const itemPerformance = calculateItemPerformance(orders);
  const categoryStats = {};
  
  itemPerformance.forEach(item => {
    const category = item.category;
    
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        quantitySold: 0,
        grossSales: 0,
        totalCost: 0,
        costAvailable: false
      };
    }
    
    categoryStats[category].quantitySold += item.quantitySold;
    categoryStats[category].grossSales += item.grossSales;
    
    if (item.estimatedCost !== null) {
      categoryStats[category].totalCost += item.estimatedCost;
      categoryStats[category].costAvailable = true;
    }
  });
  
  const totalSales = Object.values(categoryStats).reduce((sum, cat) => sum + cat.grossSales, 0);
  
  return Object.values(categoryStats).map(category => ({
    ...category,
    orderShare: totalSales > 0 ? (category.grossSales / totalSales) * 100 : 0,
    averagePrice: category.quantitySold > 0 ? category.grossSales / category.quantitySold : 0,
    estimatedGrossProfit: category.costAvailable ? category.grossSales - category.totalCost : null,
    estimatedMargin: category.costAvailable && category.grossSales > 0
      ? ((category.grossSales - category.totalCost) / category.grossSales) * 100
      : null
  })).sort((a, b) => b.grossSales - a.grossSales);
};

// CHANNEL PERFORMANCE METRICS

/**
 * Calculate channel performance
 */
export const calculateChannelPerformance = (orders) => {
  const channelStats = {};
  
  safeArr(orders).forEach(order => {
    const source = safeStr(order?.source, 'UNKNOWN');
    
    if (!channelStats[source]) {
      channelStats[source] = {
        source,
        orders: 0,
        grossSales: 0,
        refunds: 0,
        completedOrders: 0
      };
    }
    
    channelStats[source].orders += 1;
    channelStats[source].grossSales += safeOrderAmount(order);
    
    if (order?.refundAmount) {
      channelStats[source].refunds += safeNum(order.refundAmount);
    }
    
    if (COMPLETED_STATUSES.includes(order?.status)) {
      channelStats[source].completedOrders += 1;
    }
  });
  
  const totalOrders = safeArr(orders).length;
  const totalSales = Object.values(channelStats).reduce((sum, ch) => sum + ch.grossSales, 0);
  
  const channelNames = {
    'WALK_IN': 'Dine-in',
    'SWIGGY': 'Swiggy',
    'ZOMATO': 'Zomato',
    'DIRECT_DELIVERY': 'Delivery',
    'QR_ORDER': 'QR Ordering',
    'TAKEAWAY': 'Takeaway',
    'UNKNOWN': 'Unknown'
  };
  
  return Object.values(channelStats).map(channel => ({
    ...channel,
    name: channelNames[channel.source] || channel.source,
    orderShare: totalOrders > 0 ? (channel.orders / totalOrders) * 100 : 0,
    revenueShare: totalSales > 0 ? (channel.grossSales / totalSales) * 100 : 0,
    averageOrderValue: channel.orders > 0 ? channel.grossSales / channel.orders : 0,
    netSales: channel.grossSales - channel.refunds
  })).sort((a, b) => b.grossSales - a.grossSales);
};

// PAYMENT METHOD METRICS

/**
 * Calculate payment method breakdown
 */
export const calculatePaymentMethodBreakdown = (orders) => {
  const paymentStats = {};
  
  safeArr(orders).forEach(order => {
    const method = safeStr(order?.paymentMethod, 'UNKNOWN');
    const amount = safeOrderAmount(order);
    
    if (!paymentStats[method]) {
      paymentStats[method] = {
        method,
        transactionCount: 0,
        amountCollected: 0,
        refunds: 0,
        failedPayments: 0
      };
    }
    
    paymentStats[method].transactionCount += 1;
    
    if (order?.payStatus === 'PAID') {
      paymentStats[method].amountCollected += amount;
    }
    
    if (order?.refundAmount) {
      paymentStats[method].refunds += safeNum(order.refundAmount);
    }
    
    if (order?.payStatus === 'FAILED') {
      paymentStats[method].failedPayments += 1;
    }
  });
  
  const totalAmount = Object.values(paymentStats).reduce((sum, pm) => sum + pm.amountCollected, 0);
  
  const paymentNames = {
    'CASH': 'Cash',
    'UPI': 'UPI',
    'CARD': 'Card',
    'ONLINE': 'Online',
    'COD': 'COD',
    'SPLIT': 'Split Payment',
    'UNKNOWN': 'Unknown'
  };
  
  return Object.values(paymentStats).map(payment => ({
    ...payment,
    name: paymentNames[payment.method] || payment.method,
    share: totalAmount > 0 ? (payment.amountCollected / totalAmount) * 100 : 0,
    netCollected: payment.amountCollected - payment.refunds
  })).sort((a, b) => b.amountCollected - a.amountCollected);
};

// CUSTOMER METRICS

/**
 * Calculate customer performance
 */
export const calculateCustomerPerformance = (orders) => {
  const customerStats = {};
  
  safeArr(orders).forEach(order => {
    const customerId = order?.customerId || order?.customer?.id;
    const customerName = safeStr(order?.customer?.name || order?.customerName, 'Guest');
    const customerPhone = safeStr(order?.customer?.phone || order?.customerPhone, '');
    
    if (!customerId && !customerPhone) return; // Skip anonymous orders
    
    const key = customerId || customerPhone;
    
    if (!customerStats[key]) {
      customerStats[key] = {
        id: customerId,
        name: customerName,
        phone: customerPhone,
        orderCount: 0,
        totalSpend: 0,
        lastOrderDate: null,
        firstOrderDate: null
      };
    }
    
    customerStats[key].orderCount += 1;
    customerStats[key].totalSpend += safeOrderAmount(order);
    
    const orderDate = safeDate(order?.createdAt);
    if (orderDate) {
      if (!customerStats[key].lastOrderDate || orderDate > customerStats[key].lastOrderDate) {
        customerStats[key].lastOrderDate = orderDate;
      }
      if (!customerStats[key].firstOrderDate || orderDate < customerStats[key].firstOrderDate) {
        customerStats[key].firstOrderDate = orderDate;
      }
    }
  });
  
  return Object.values(customerStats).map(customer => ({
    ...customer,
    averageOrderValue: customer.orderCount > 0 ? customer.totalSpend / customer.orderCount : 0,
    unpaidBalance: 0 // Would need invoice data
  })).sort((a, b) => b.totalSpend - a.totalSpend);
};

/**
 * Calculate new vs returning customers
 */
export const calculateNewVsReturningCustomers = (orders, dateRange) => {
  const customerFirstSeen = {};
  const customerStats = {};
  
  // First pass: find first seen date for each customer
  safeArr(orders).forEach(order => {
    const customerId = order?.customerId || order?.customer?.id;
    const customerPhone = safeStr(order?.customer?.phone || order?.customerPhone, '');
    
    if (!customerId && !customerPhone) return;
    
    const key = customerId || customerPhone;
    const orderDate = safeDate(order?.createdAt);
    
    if (orderDate) {
      if (!customerFirstSeen[key] || orderDate < customerFirstSeen[key]) {
        customerFirstSeen[key] = orderDate;
      }
    }
  });
  
  // Second pass: categorize customers in the date range
  const rangeOrders = filterOrdersByDateRange(orders, dateRange);
  
  rangeOrders.forEach(order => {
    const customerId = order?.customerId || order?.customer?.id;
    const customerPhone = safeStr(order?.customer?.phone || order?.customerPhone, '');
    
    if (!customerId && !customerPhone) return;
    
    const key = customerId || customerPhone;
    const orderDate = safeDate(order?.createdAt);
    
    if (!customerStats[key]) {
      customerStats[key] = {
        isNew: false,
        orderCount: 0,
        totalSpend: 0
      };
    }
    
    customerStats[key].orderCount += 1;
    customerStats[key].totalSpend += safeOrderAmount(order);
    
    // New customer: first order is in the selected range
    if (customerFirstSeen[key] && orderDate && customerFirstSeen[key] >= dateRange.start) {
      customerStats[key].isNew = true;
    }
  });
  
  const newCustomers = Object.values(customerStats).filter(c => c.isNew);
  const returningCustomers = Object.values(customerStats).filter(c => !c.isNew);
  
  return {
    newCustomerCount: newCustomers.length,
    newCustomerOrders: newCustomers.reduce((sum, c) => sum + c.orderCount, 0),
    newCustomerSales: newCustomers.reduce((sum, c) => sum + c.totalSpend, 0),
    newCustomerAvgOrderValue: newCustomers.length > 0 
      ? newCustomers.reduce((sum, c) => sum + c.totalSpend, 0) / newCustomers.reduce((sum, c) => sum + c.orderCount, 0)
      : 0,
    returningCustomerCount: returningCustomers.length,
    returningCustomerOrders: returningCustomers.reduce((sum, c) => sum + c.orderCount, 0),
    returningCustomerSales: returningCustomers.reduce((sum, c) => sum + c.totalSpend, 0),
    returningCustomerAvgOrderValue: returningCustomers.length > 0
      ? returningCustomers.reduce((sum, c) => sum + c.totalSpend, 0) / returningCustomers.reduce((sum, c) => sum + c.orderCount, 0)
      : 0
  };
};

// STAFF PERFORMANCE METRICS

/**
 * Calculate staff performance
 */
export const calculateStaffPerformance = (orders, staff) => {
  const staffStats = {};
  
  safeArr(orders).forEach(order => {
    const assignedStaffId = order?.assignedStaff;
    if (!assignedStaffId) return;
    
    if (!staffStats[assignedStaffId]) {
      staffStats[assignedStaffId] = {
        staffId: assignedStaffId,
        ordersHandled: 0,
        salesProcessed: 0,
        refundsProcessed: 0,
        voidsProcessed: 0
      };
    }
    
    staffStats[assignedStaffId].ordersHandled += 1;
    staffStats[assignedStaffId].salesProcessed += safeOrderAmount(order);
    
    if (order?.status === ORDER_STATUS.REFUNDED) {
      staffStats[assignedStaffId].refundsProcessed += 1;
    }
    
    if (order?.status === ORDER_STATUS.VOIDED) {
      staffStats[assignedStaffId].voidsProcessed += 1;
    }
  });
  
  // Add staff names from staff data
  const staffMap = {};
  safeArr(staff).forEach(s => {
    staffMap[s.id] = safeStr(s.name, 'Unknown Staff');
  });
  
  return Object.values(staffStats).map(stat => ({
    ...stat,
    staffName: staffMap[stat.staffId] || 'Unknown Staff',
    averageOrderValue: stat.ordersHandled > 0 ? stat.salesProcessed / stat.ordersHandled : 0
  })).sort((a, b) => b.ordersHandled - a.ordersHandled);
};

// PROFITABILITY METRICS

/**
 * Calculate estimated cost of goods sold
 */
export const calculateEstimatedCOGS = (orders) => {
  const completedOrders = filterOrdersByStatus(orders, COMPLETED_STATUSES);
  let totalCost = 0;
  let itemsWithCost = 0;
  let totalItems = 0;
  
  completedOrders.forEach(order => {
    const items = safeArr(order?.items);
    items.forEach(item => {
      totalItems++;
      const cost = safeNum(item?.cost, null);
      const qty = safeNum(item?.qty, 1);
      
      if (cost !== null) {
        totalCost += (cost * qty);
        itemsWithCost++;
      }
    });
  });
  
  const costCoverage = totalItems > 0 ? (itemsWithCost / totalItems) * 100 : 0;
  
  return {
    totalCost,
    costCoverage,
    itemsWithCost,
    totalItems,
    isComplete: costCoverage >= 90
  };
};

/**
 * Calculate estimated gross profit
 */
export const calculateEstimatedGrossProfit = (orders) => {
  const netSales = calculateNetSales(orders);
  const cogsData = calculateEstimatedCOGS(orders);
  
  if (!cogsData.isComplete) {
    return {
      grossProfit: null,
      margin: null,
      costCoverage: cogsData.costCoverage,
      isReliable: false,
      message: `Cost data incomplete (${cogsData.costCoverage.toFixed(1)}% coverage)`
    };
  }
  
  const grossProfit = netSales - cogsData.totalCost;
  const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
  
  return {
    grossProfit,
    margin,
    costCoverage: cogsData.costCoverage,
    isReliable: true,
    message: null
  };
};

// AGGREGATE KPI CALCULATION

/**
 * Calculate all KPIs for a given order set
 */
export const calculateKPIs = (orders, dateRange = null) => {
  const filteredOrders = dateRange ? filterOrdersByDateRange(orders, dateRange) : safeArr(orders);
  
  const grossSales = calculateGrossSales(filteredOrders);
  const netSales = calculateNetSales(filteredOrders);
  const taxCollected = calculateTaxCollected(filteredOrders);
  const totalCollected = calculateTotalCollected(filteredOrders);
  const outstanding = calculateOutstanding(filteredOrders);
  const refunds = calculateRefunds(filteredOrders);
  const discounts = calculateDiscounts(filteredOrders);
  const avgOrderValue = calculateAverageOrderValue(filteredOrders);
  
  const totalOrders = calculateTotalOrders(filteredOrders);
  const completedOrders = calculateCompletedOrders(filteredOrders);
  const cancelledOrders = calculateCancelledOrders(filteredOrders);
  const refundedOrders = calculateRefundedOrders(filteredOrders);
  const voidedOrders = calculateVoidedOrders(filteredOrders);
  const openOrders = calculateOpenOrders(filteredOrders);
  
  const completionRate = calculateCompletionRate(filteredOrders);
  const cancellationRate = calculateCancellationRate(filteredOrders);
  const refundRate = calculateRefundRate(filteredOrders);
  
  const profitability = calculateEstimatedGrossProfit(filteredOrders);
  
  return {
    sales: {
      grossSales,
      netSales,
      taxCollected,
      totalCollected,
      outstanding,
      refunds,
      discounts,
      averageOrderValue: avgOrderValue
    },
    orders: {
      total: totalOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
      refunded: refundedOrders,
      voided: voidedOrders,
      open: openOrders,
      completionRate,
      cancellationRate,
      refundRate
    },
    profitability,
    dateRange
  };
};

// COMPARISON CALCULATIONS

/**
 * Calculate KPI comparison between two periods
 */
export const calculateKPIComparison = (currentKPIs, previousKPIs) => {
  const calculateChange = (current, previous) => {
    if (previous === 0) {
      return current === 0 ? { value: 0, percentage: 0, direction: 'neutral' } : null;
    }
    
    const absoluteChange = current - previous;
    const percentageChange = ((current - previous) / previous) * 100;
    
    return {
      value: absoluteChange,
      percentage: percentageChange,
      direction: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral'
    };
  };
  
  return {
    grossSales: calculateChange(currentKPIs.sales.grossSales, previousKPIs.sales.grossSales),
    netSales: calculateChange(currentKPIs.sales.netSales, previousKPIs.sales.netSales),
    orders: calculateChange(currentKPIs.orders.total, previousKPIs.orders.total),
    averageOrderValue: calculateChange(currentKPIs.sales.averageOrderValue, previousKPIs.sales.averageOrderValue),
    refunds: calculateChange(currentKPIs.sales.refunds, previousKPIs.sales.refunds),
    completionRate: calculateChange(currentKPIs.orders.completionRate, previousKPIs.orders.completionRate),
    cancellationRate: calculateChange(currentKPIs.orders.cancellationRate, previousKPIs.orders.cancellationRate)
  };
};

// TABLE PERFORMANCE METRICS

/**
 * Calculate table performance from orders
 */
export const calculateTablePerformance = (orders, tables) => {
  const tableStats = {};
  
  safeArr(orders).forEach(order => {
    const tableId = order?.tableId;
    if (!tableId) return;
    
    if (!tableStats[tableId]) {
      tableStats[tableId] = {
        tableId,
        orders: 0,
        totalSpend: 0,
        totalGuests: 0,
        averageTurnTime: 0,
        turnTimeSum: 0,
        turnTimeCount: 0
      };
    }
    
    tableStats[tableId].orders += 1;
    tableStats[tableId].totalSpend += safeOrderAmount(order);
    tableStats[tableId].totalGuests += safeNum(order?.guestCount, 1);
    
    // Calculate turn time if available
    const createdAt = safeDate(order?.createdAt);
    const completedAt = safeDate(order?.completedAt);
    if (createdAt && completedAt) {
      const turnMinutes = (completedAt - createdAt) / (1000 * 60);
      if (turnMinutes > 0 && turnMinutes < 300) { // Reasonable range: 5 min to 5 hours
        tableStats[tableId].turnTimeSum += turnMinutes;
        tableStats[tableId].turnTimeCount += 1;
      }
    }
  });
  
  // Add table names from tables data
  const tableMap = {};
  safeArr(tables).forEach(t => {
    tableMap[t.id] = safeStr(t.name, 'Unknown Table');
  });
  
  return Object.values(tableStats).map(stat => ({
    ...stat,
    tableName: tableMap[stat.tableId] || 'Unknown Table',
    averageSpend: stat.orders > 0 ? stat.totalSpend / stat.orders : 0,
    averageGuests: stat.orders > 0 ? stat.totalGuests / stat.orders : 0,
    averageTurnTime: stat.turnTimeCount > 0 ? stat.turnTimeSum / stat.turnTimeCount : null
  })).sort((a, b) => b.orders - a.orders);
};

// DELIVERY PERFORMANCE METRICS

/**
 * Calculate delivery performance
 */
export const calculateDeliveryPerformance = (deliveryOrders, drivers) => {
  const deliveryStats = {};
  
  safeArr(deliveryOrders).forEach(order => {
    const driverId = order?.driverId;
    
    if (!deliveryStats[driverId]) {
      deliveryStats[driverId] = {
        driverId,
        deliveries: 0,
        completedDeliveries: 0,
        totalDeliveryTime: 0,
        deliveryTimeCount: 0,
        totalDistance: 0,
        onTimeDeliveries: 0
      };
    }
    
    deliveryStats[driverId].deliveries += 1;
    
    if (order?.status === 'DELIVERED') {
      deliveryStats[driverId].completedDeliveries += 1;
    }
    
    // Calculate delivery time
    const dispatchedAt = safeDate(order?.dispatchedAt);
    const deliveredAt = safeDate(order?.deliveredAt);
    if (dispatchedAt && deliveredAt) {
      const deliveryMinutes = (deliveredAt - dispatchedAt) / (1000 * 60);
      if (deliveryMinutes > 0 && deliveryMinutes < 180) { // Reasonable range: up to 3 hours
        deliveryStats[driverId].totalDeliveryTime += deliveryMinutes;
        deliveryStats[driverId].deliveryTimeCount += 1;
      }
    }
    
    // Add distance if available
    const distance = safeNum(order?.distance, 0);
    if (distance > 0) {
      deliveryStats[driverId].totalDistance += distance;
    }
    
    // Check if on-time (within 45 minutes)
    if (dispatchedAt && deliveredAt) {
      const deliveryMinutes = (deliveredAt - dispatchedAt) / (1000 * 60);
      if (deliveryMinutes <= 45) {
        deliveryStats[driverId].onTimeDeliveries += 1;
      }
    }
  });
  
  // Add driver names
  const driverMap = {};
  safeArr(drivers).forEach(d => {
    driverMap[d.id] = safeStr(d.name, 'Unknown Driver');
  });
  
  return Object.values(deliveryStats).map(stat => ({
    ...stat,
    driverName: driverMap[stat.driverId] || 'Unknown Driver',
    averageDeliveryTime: stat.deliveryTimeCount > 0 ? stat.totalDeliveryTime / stat.deliveryTimeCount : null,
    averageDistance: stat.deliveries > 0 ? stat.totalDistance / stat.deliveries : 0,
    onTimeRate: stat.deliveries > 0 ? (stat.onTimeDeliveries / stat.deliveries) * 100 : 0,
    completionRate: stat.deliveries > 0 ? (stat.completedDeliveries / stat.deliveries) * 100 : 0
  })).sort((a, b) => b.deliveries - a.deliveries);
};

// INVENTORY PERFORMANCE METRICS

/**
 * Calculate inventory performance
 */
export const calculateInventoryPerformance = (inventory, orders) => {
  const inventoryStats = {};
  
  // Calculate usage from orders
  safeArr(orders).forEach(order => {
    const items = safeArr(order?.items);
    items.forEach(item => {
      const itemId = item?.itemId;
      const qty = safeNum(item?.qty, 1);
      
      if (!itemId) return;
      
      if (!inventoryStats[itemId]) {
        inventoryStats[itemId] = {
          itemId,
          name: safeStr(item?.name, 'Unknown Item'),
          totalUsed: 0,
          lastUsed: null
        };
      }
      
      inventoryStats[itemId].totalUsed += qty;
      
      const orderDate = safeDate(order?.createdAt);
      if (orderDate) {
        if (!inventoryStats[itemId].lastUsed || orderDate > inventoryStats[itemId].lastUsed) {
          inventoryStats[itemId].lastUsed = orderDate;
        }
      }
    });
  });
  
  // Merge with current inventory data
  const inventoryMap = {};
  safeArr(inventory).forEach(inv => {
    inventoryMap[inv.id] = inv;
  });
  
  return Object.values(inventoryStats).map(stat => {
    const currentStock = inventoryMap[stat.itemId];
    return {
      ...stat,
      currentStock: currentStock ? safeNum(currentStock.quantity, 0) : 0,
      unit: currentStock ? safeStr(currentStock.unit, 'units') : 'units',
      isLowStock: currentStock ? safeNum(currentStock.quantity, 0) < safeNum(currentStock.reorderLevel, 10) : false,
      isOutOfStock: currentStock ? safeNum(currentStock.quantity, 0) <= 0 : false
    };
  }).sort((a, b) => b.totalUsed - a.totalUsed);
};

// PURCHASING PERFORMANCE METRICS

/**
 * Calculate purchasing performance
 */
export const calculatePurchasingPerformance = (purchaseOrders, suppliers) => {
  const supplierStats = {};
  
  safeArr(purchaseOrders).forEach(order => {
    const supplierId = order?.supplierId;
    if (!supplierId) return;
    
    if (!supplierStats[supplierId]) {
      supplierStats[supplierId] = {
        supplierId,
        orders: 0,
        totalAmount: 0,
        onTimeOrders: 0,
        lateOrders: 0,
        totalItems: 0
      };
    }
    
    supplierStats[supplierId].orders += 1;
    supplierStats[supplierId].totalAmount += safeNum(order?.totalAmount, 0);
    supplierStats[supplierId].totalItems += safeNum(order?.itemCount, 0);
    
    // Check if on-time
    const expectedDate = safeDate(order?.expectedDeliveryDate);
    const receivedDate = safeDate(order?.receivedDate);
    if (expectedDate && receivedDate) {
      if (receivedDate <= expectedDate) {
        supplierStats[supplierId].onTimeOrders += 1;
      } else {
        supplierStats[supplierId].lateOrders += 1;
      }
    }
  });
  
  // Add supplier names
  const supplierMap = {};
  safeArr(suppliers).forEach(s => {
    supplierMap[s.id] = safeStr(s.name, 'Unknown Supplier');
  });
  
  return Object.values(supplierStats).map(stat => ({
    ...stat,
    supplierName: supplierMap[stat.supplierId] || 'Unknown Supplier',
    averageOrderValue: stat.orders > 0 ? stat.totalAmount / stat.orders : 0,
    onTimeRate: stat.orders > 0 ? (stat.onTimeOrders / stat.orders) * 100 : 0,
    lateRate: stat.orders > 0 ? (stat.lateOrders / stat.orders) * 100 : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);
};

// PRODUCTION PERFORMANCE METRICS

/**
 * Calculate production performance
 */
export const calculateProductionPerformance = (productionBatches) => {
  const batchStats = {
    totalBatches: 0,
    completedBatches: 0,
    failedBatches: 0,
    inProgressBatches: 0,
    totalQuantity: 0,
    totalWaste: 0,
    averageYield: 0,
    yieldSum: 0,
    yieldCount: 0
  };
  
  safeArr(productionBatches).forEach(batch => {
    batchStats.totalBatches += 1;
    
    if (batch?.status === 'COMPLETED') {
      batchStats.completedBatches += 1;
    } else if (batch?.status === 'FAILED') {
      batchStats.failedBatches += 1;
    } else if (batch?.status === 'IN_PROGRESS') {
      batchStats.inProgressBatches += 1;
    }
    
    batchStats.totalQuantity += safeNum(batch?.quantity, 0);
    batchStats.totalWaste += safeNum(batch?.waste, 0);
    
    // Calculate yield
    const quantity = safeNum(batch?.quantity, 0);
    const waste = safeNum(batch?.waste, 0);
    if (quantity > 0) {
      const yieldRate = ((quantity - waste) / quantity) * 100;
      batchStats.yieldSum += yieldRate;
      batchStats.yieldCount += 1;
    }
  });
  
  batchStats.averageYield = batchStats.yieldCount > 0 ? batchStats.yieldSum / batchStats.yieldCount : 0;
  batchStats.completionRate = batchStats.totalBatches > 0 ? (batchStats.completedBatches / batchStats.totalBatches) * 100 : 0;
  batchStats.wasteRate = batchStats.totalQuantity > 0 ? (batchStats.totalWaste / batchStats.totalQuantity) * 100 : 0;
  
  return batchStats;
};

// DOCUMENT REPORT METRICS

/**
 * Calculate document statistics
 */
export const calculateDocumentStats = (documents) => {
  const stats = {
    totalDocuments: 0,
    byType: {},
    byStatus: {},
    recentDocuments: []
  };
  
  safeArr(documents).forEach(doc => {
    stats.totalDocuments += 1;
    
    const type = safeStr(doc?.type, 'UNKNOWN');
    const status = safeStr(doc?.status, 'UNKNOWN');
    
    if (!stats.byType[type]) stats.byType[type] = 0;
    stats.byType[type] += 1;
    
    if (!stats.byStatus[status]) stats.byStatus[status] = 0;
    stats.byStatus[status] += 1;
  });
  
  // Get recent documents (last 10)
  stats.recentDocuments = safeArr(documents)
    .sort((a, b) => {
      const dateA = safeDate(a?.createdAt) || new Date(0);
      const dateB = safeDate(b?.createdAt) || new Date(0);
      return dateB - dateA;
    })
    .slice(0, 10);
  
  return stats;
};

export default {
  // Sales metrics
  calculateGrossSales,
  calculateNetSales,
  calculateTaxCollected,
  calculateTotalCollected,
  calculateOutstanding,
  calculateAverageOrderValue,
  calculateRefunds,
  calculateDiscounts,
  
  // Order metrics
  calculateTotalOrders,
  calculateCompletedOrders,
  calculateCancelledOrders,
  calculateRefundedOrders,
  calculateVoidedOrders,
  calculateOpenOrders,
  calculateCancellationRate,
  calculateRefundRate,
  calculateCompletionRate,
  calculateItemsPerOrder,
  
  // Menu metrics
  calculateItemPerformance,
  calculateCategoryPerformance,
  
  // Channel metrics
  calculateChannelPerformance,
  
  // Payment metrics
  calculatePaymentMethodBreakdown,
  
  // Customer metrics
  calculateCustomerPerformance,
  calculateNewVsReturningCustomers,
  
  // Staff metrics
  calculateStaffPerformance,
  
  // Table metrics
  calculateTablePerformance,
  
  // Delivery metrics
  calculateDeliveryPerformance,
  
  // Inventory metrics
  calculateInventoryPerformance,
  
  // Purchasing metrics
  calculatePurchasingPerformance,
  
  // Production metrics
  calculateProductionPerformance,
  
  // Document metrics
  calculateDocumentStats,
  
  // Profitability metrics
  calculateEstimatedCOGS,
  calculateEstimatedGrossProfit,
  
  // Aggregate
  calculateKPIs,
  calculateKPIComparison,
  
  // Utilities
  filterOrdersByDateRange,
  filterOrdersByStatus,
  filterOrdersByChannel,
  filterOrdersByPaymentMethod,
  formatCurrency,
  formatPercentage
};
