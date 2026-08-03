// Operations Intelligence Engine for CafeOS
// Deterministic, data-driven insight generation

import {
  createInsight,
  createAction,
  createDailyBrief,
  INSIGHT_TYPES,
  INSIGHT_CATEGORIES,
  INSIGHT_PRIORITY,
  ACTION_TYPES
} from "../domain/intelligenceModel.js";
import { formatCurrency } from "../domain/money.js";

/**
 * Intelligence Engine
 * Analyzes operational data and generates actionable insights
 */

/**
 * Generate all insights from operational data
 */
export function generateInsights(data) {
  const insights = [];
  
  const {
    orders = [],
    inventory = [],
    menuItems = [],
    kdsCards = [],
    tables = [],
    staff = [],
    reservations = [],
    shifts = [],
    purchases = [],
    _documents = []
  } = data;
  
  // Revenue insights
  insights.push(...generateRevenueInsights(orders, shifts));
  
  // Inventory insights
  insights.push(...generateInventoryInsights(inventory, menuItems));
  
  // Kitchen insights
  insights.push(...generateKitchenInsights(kdsCards, orders));
  
  // Floor insights
  insights.push(...generateFloorInsights(tables, orders));
  
  // Menu insights
  insights.push(...generateMenuInsights(orders, menuItems));
  
  // Staff insights
  insights.push(...generateStaffInsights(shifts, staff));
  
  // Reservation insights
  insights.push(...generateReservationInsights(reservations));
  
  // Delivery insights
  insights.push(...generateDeliveryInsights(orders));
  
  // Purchasing insights
  insights.push(...generatePurchasingInsights(purchases));
  
  // Operational insights
  insights.push(...generateOperationalInsights(shifts, inventory));
  
  return insights;
}

/**
 * Generate revenue insights
 */
function generateRevenueInsights(orders, _shifts) {
  const insights = [];
  
  if (!orders || orders.length === 0) {
    return insights;
  }
  
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === yesterday.toDateString();
  });
  
  const twoDaysAgo = new Date(yesterday);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
  
  const twoDaysAgoOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === twoDaysAgo.toDateString();
  });
  
  // Revenue trend
  if (yesterdayOrders.length > 0 && twoDaysAgoOrders.length > 0) {
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const twoDaysAgoRevenue = twoDaysAgoOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const change = ((yesterdayRevenue - twoDaysAgoRevenue) / twoDaysAgoRevenue) * 100;
    
    if (change > 10) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.REVENUE_TREND,
        category: INSIGHT_CATEGORIES.REVENUE,
        priority: INSIGHT_PRIORITY.HIGH,
        title: 'Revenue Increased',
        description: `Revenue yesterday increased by ${change.toFixed(1)}% compared to the day before.`,
        value: formatCurrency(yesterdayRevenue),
        comparison: `+${change.toFixed(1)}%`,
        trend: 'up',
        metadata: {
          yesterdayRevenue,
          previousRevenue: twoDaysAgoRevenue,
          changePercent: change
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'View Revenue Report',
            target: 'analytics'
          })
        ]
      }));
    } else if (change < -10) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.REVENUE_DECLINE,
        category: INSIGHT_CATEGORIES.REVENUE,
        priority: INSIGHT_PRIORITY.HIGH,
        title: 'Revenue Declined',
        description: `Revenue yesterday decreased by ${Math.abs(change).toFixed(1)}% compared to the day before.`,
        value: formatCurrency(yesterdayRevenue),
        comparison: `${change.toFixed(1)}%`,
        trend: 'down',
        metadata: {
          yesterdayRevenue,
          previousRevenue: twoDaysAgoRevenue,
          changePercent: change
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'View Revenue Report',
            target: 'analytics'
          })
        ]
      }));
    }
  }
  
  // Peak periods
  const hourlyRevenue = {};
  orders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + (o.total || 0);
  });
  
  const peakHour = Object.entries(hourlyRevenue).sort((a, b) => b[1] - a[1])[0];
  if (peakHour) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.PEAK_PERIOD,
      category: INSIGHT_CATEGORIES.REVENUE,
      priority: INSIGHT_PRIORITY.MEDIUM,
      title: 'Peak Revenue Hour',
      description: `The busiest revenue hour is ${peakHour[0]}:00.`,
      value: formatCurrency(peakHour[1]),
      metadata: {
        hour: parseInt(peakHour[0]),
        revenue: peakHour[1]
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Hourly Report',
          target: 'analytics'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate inventory insights
 */
function generateInventoryInsights(inventory, _menuItems) {
  const insights = [];
  
  if (!inventory || inventory.length === 0) {
    return insights;
  }
  
  // Low stock items
  const lowStockItems = inventory.filter(item => {
    const threshold = item.minStock || 10;
    return item.quantity <= threshold;
  });
  
  if (lowStockItems.length > 0) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.LOW_STOCK,
      category: INSIGHT_CATEGORIES.INVENTORY,
      priority: INSIGHT_PRIORITY.HIGH,
      title: 'Low Stock Items',
      description: `${lowStockItems.length} items are running low on stock.`,
      value: lowStockItems.length.toString(),
      metadata: {
        items: lowStockItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity }))
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Inventory',
          target: 'inventory'
        }),
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'Create Purchase Order',
          target: 'purchasing'
        })
      ]
    }));
  }
  
  // Expiring soon
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    return expiry <= threeDaysFromNow && expiry >= now;
  });
  
  if (expiringItems.length > 0) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.EXPIRY_SOON,
      category: INSIGHT_CATEGORIES.INVENTORY,
      priority: INSIGHT_PRIORITY.CRITICAL,
      title: 'Items Expiring Soon',
      description: `${expiringItems.length} items will expire within the next 3 days.`,
      value: expiringItems.length.toString(),
      metadata: {
        items: expiringItems.map(i => ({ id: i.id, name: i.name, expiryDate: i.expiryDate }))
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Inventory',
          target: 'inventory'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate kitchen insights
 */
function generateKitchenInsights(kdsCards, _orders) {
  const insights = [];
  
  if (!kdsCards || kdsCards.length === 0) {
    return insights;
  }
  
  // Average prep time
  const completedCards = kdsCards.filter(c => c.completed && c.startedAt);
  if (completedCards.length > 0) {
    const totalDuration = completedCards.reduce((sum, c) => {
      const duration = (c.completedAt || Date.now()) - (c.startedAt || c.createdAt);
      return sum + duration;
    }, 0);
    
    const avgDuration = totalDuration / completedCards.length;
    const avgMinutes = Math.floor(avgDuration / 60000);
    
    if (avgMinutes > 15) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.PREP_TIME_INCREASE,
        category: INSIGHT_CATEGORIES.KITCHEN,
        priority: INSIGHT_PRIORITY.HIGH,
        title: 'Preparation Time Elevated',
        description: `Average preparation time is ${avgMinutes} minutes, which is above target.`,
        value: `${avgMinutes}m`,
        metadata: {
          avgDuration,
          avgMinutes,
          targetMinutes: 15
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'Go to Kitchen',
            target: 'kitchen'
          })
        ]
      }));
    }
  }
  
  // Cancellation rate
  const cancelledCards = kdsCards.filter(c => c.cancelled);
  if (cancelledCards.length > 0 && kdsCards.length > 0) {
    const cancellationRate = (cancelledCards.length / kdsCards.length) * 100;
    
    if (cancellationRate > 10) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.CANCELLATION_SPIKE,
        category: INSIGHT_CATEGORIES.KITCHEN,
        priority: INSIGHT_PRIORITY.HIGH,
        title: 'High Cancellation Rate',
        description: `${cancellationRate.toFixed(1)}% of kitchen tickets have been cancelled.`,
        value: `${cancellationRate.toFixed(1)}%`,
        metadata: {
          cancelled: cancelledCards.length,
          total: kdsCards.length,
          rate: cancellationRate
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'Go to Kitchen',
            target: 'kitchen'
          })
        ]
      }));
    }
  }
  
  return insights;
}

/**
 * Generate floor insights
 */
function generateFloorInsights(tables, orders) {
  const insights = [];
  
  if (!tables || tables.length === 0) {
    return insights;
  }
  
  // High demand tables
  const tableUsage = {};
  orders.forEach(o => {
    if (o.tableId) {
      tableUsage[o.tableId] = (tableUsage[o.tableId] || 0) + 1;
    }
  });
  
  const avgUsage = Object.values(tableUsage).reduce((a, b) => a + b, 0) / (Object.keys(tableUsage).length || 1);
  
  const highDemandTables = Object.entries(tableUsage)
    .filter(([_, count]) => count > avgUsage * 1.5)
    .map(([tableId, _]) => tableId);
  
  if (highDemandTables.length > 0) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.HIGH_DEMAND_TABLE,
      category: INSIGHT_CATEGORIES.FLOOR,
      priority: INSIGHT_PRIORITY.MEDIUM,
      title: 'High Demand Tables',
      description: `${highDemandTables.length} tables have above-average demand.`,
      value: highDemandTables.length.toString(),
      metadata: {
        tableIds: highDemandTables,
        avgUsage
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Floor',
          target: 'tables'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate menu insights
 */
function generateMenuInsights(orders, menuItems) {
  const insights = [];
  
  if (!orders || orders.length === 0 || !menuItems || menuItems.length === 0) {
    return insights;
  }
  
  // Item sales count
  const itemSales = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      itemSales[item.id] = (itemSales[item.id] || 0) + (item.quantity || 1);
    });
  });
  
  const totalSales = Object.values(itemSales).reduce((a, b) => a + b, 0);
  
  // Best sellers
  const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
  const topSellers = sortedItems.slice(0, 3);
  
  if (topSellers.length > 0) {
    const topItem = menuItems.find(m => m.id === topSellers[0][0]);
    if (topItem) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.BEST_SELLER,
        category: INSIGHT_CATEGORIES.MENU,
        priority: INSIGHT_PRIORITY.MEDIUM,
        title: 'Best Selling Item',
        description: `${topItem.name} is the most popular item with ${topSellers[0][1]} orders.`,
        value: topItem.name,
        metadata: {
          itemId: topItem.id,
          sales: topSellers[0][1],
          percentage: ((topSellers[0][1] / totalSales) * 100).toFixed(1)
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'View Menu',
            target: 'menu'
          })
        ]
      }));
    }
  }
  
  // Worst sellers
  const bottomSellers = sortedItems.slice(-3);
  if (bottomSellers.length > 0) {
    const bottomItem = menuItems.find(m => m.id === bottomSellers[0][0]);
    if (bottomItem && bottomSellers[0][1] < totalSales * 0.05) {
      insights.push(createInsight({
        type: INSIGHT_TYPES.WORST_SELLER,
        category: INSIGHT_CATEGORIES.MENU,
        priority: INSIGHT_PRIORITY.LOW,
        title: 'Underperforming Item',
        description: `${bottomItem.name} has low sales volume.`,
        value: bottomItem.name,
        metadata: {
          itemId: bottomItem.id,
          sales: bottomSellers[0][1],
          percentage: ((bottomSellers[0][1] / totalSales) * 100).toFixed(1)
        },
        actions: [
          createAction({
            type: ACTION_TYPES.NAVIGATE,
            label: 'Review Menu',
            target: 'menu'
          })
        ]
      }));
    }
  }
  
  return insights;
}

/**
 * Generate staff insights
 */
function generateStaffInsights(shifts, _staff) {
  const insights = [];
  
  if (!shifts || shifts.length === 0) {
    return insights;
  }
  
  // Manager overrides
  const shiftsWithOverrides = shifts.filter(s => s.managerOverrides && s.managerOverrides > 0);
  if (shiftsWithOverrides.length > 0) {
    const totalOverrides = shiftsWithOverrides.reduce((sum, s) => sum + (s.managerOverrides || 0), 0);
    
    insights.push(createInsight({
      type: INSIGHT_TYPES.MANAGER_OVERRIDE,
      category: INSIGHT_CATEGORIES.STAFF,
      priority: INSIGHT_PRIORITY.MEDIUM,
      title: 'Manager Overrides Used',
      description: `${totalOverrides} manager overrides were used across ${shiftsWithOverrides.length} shifts.`,
      value: totalOverrides.toString(),
      metadata: {
        totalOverrides,
        shiftCount: shiftsWithOverrides.length
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Shift History',
          target: 'shifts'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate reservation insights
 */
function generateReservationInsights(reservations) {
  const insights = [];
  
  if (!reservations || reservations.length === 0) {
    return insights;
  }
  
  // Unassigned reservations
  const now = new Date();
  const today = now.toDateString();
  
  const todayReservations = reservations.filter(r => {
    const resDate = new Date(r.date);
    return resDate.toDateString() === today;
  });
  
  const unassigned = todayReservations.filter(r => !r.tableId);
  
  if (unassigned.length > 0) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.UNASSIGNED,
      category: INSIGHT_CATEGORIES.RESERVATION,
      priority: INSIGHT_PRIORITY.HIGH,
      title: 'Unassigned Reservations',
      description: `${unassigned.length} reservations today don't have assigned tables.`,
      value: unassigned.length.toString(),
      metadata: {
        reservationIds: unassigned.map(r => r.id),
        date: today
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'Assign Tables',
          target: 'tables'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate delivery insights
 */
function generateDeliveryInsights(orders) {
  const insights = [];
  
  if (!orders || orders.length === 0) {
    return insights;
  }
  
  const deliveryOrders = orders.filter(o => 
    o.source === 'SWIGGY' || o.source === 'ZOMATO' || o.orderType === 'DIRECT_DELIVERY'
  );
  
  if (deliveryOrders.length === 0) {
    return insights;
  }
  
  // Platform performance
  const platformOrders = {};
  deliveryOrders.forEach(o => {
    platformOrders[o.source] = (platformOrders[o.source] || 0) + 1;
  });
  
  const topPlatform = Object.entries(platformOrders).sort((a, b) => b[1] - a[1])[0];
  if (topPlatform) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.PLATFORM_PERFORMANCE,
      category: INSIGHT_CATEGORIES.DELIVERY,
      priority: INSIGHT_PRIORITY.MEDIUM,
      title: 'Most Active Platform',
      description: `${topPlatform[0]} is the most active delivery platform with ${topPlatform[1]} orders.`,
      value: topPlatform[0],
      metadata: {
        platform: topPlatform[0],
        orders: topPlatform[1],
        allPlatforms: platformOrders
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Delivery',
          target: 'delivery'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate purchasing insights
 */
function generatePurchasingInsights(purchases) {
  const insights = [];
  
  if (!purchases || purchases.length === 0) {
    return insights;
  }
  
  // Supplier delays
  const delayedPurchases = purchases.filter(p => p.status === 'DELAYED');
  if (delayedPurchases.length > 0) {
    insights.push(createInsight({
      type: INSIGHT_TYPES.SUPPLIER_DELAY,
      category: INSIGHT_CATEGORIES.PURCHASING,
      priority: INSIGHT_PRIORITY.HIGH,
      title: 'Delayed Purchases',
      description: `${delayedPurchases.length} purchase orders are delayed.`,
      value: delayedPurchases.length.toString(),
      metadata: {
        purchaseIds: delayedPurchases.map(p => p.id)
      },
      actions: [
        createAction({
          type: ACTION_TYPES.NAVIGATE,
          label: 'View Purchasing',
          target: 'purchasing'
        })
      ]
    }));
  }
  
  return insights;
}

/**
 * Generate operational insights
 */
function generateOperationalInsights(shifts, _inventory) {
  const insights = [];
  
  // Cash reconciliation pending
  if (shifts && shifts.length > 0) {
    const activeShifts = shifts.filter(s => s.status === 'OPEN');
    if (activeShifts.length > 0) {
      const pendingReconciliation = activeShifts.filter(s => !s.cashReconciled);
      if (pendingReconciliation.length > 0) {
        insights.push(createInsight({
          type: INSIGHT_TYPES.CASH_RECONCILIATION_PENDING,
          category: INSIGHT_CATEGORIES.OPERATIONAL,
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'Cash Reconciliation Pending',
          description: `${pendingReconciliation.length} active shifts require cash reconciliation.`,
          value: pendingReconciliation.length.toString(),
          metadata: {
            shiftIds: pendingReconciliation.map(s => s.id)
          },
          actions: [
            createAction({
              type: ACTION_TYPES.NAVIGATE,
              label: 'Go to Shifts',
              target: 'shifts'
            })
          ]
        }));
      }
    }
  }
  
  return insights;
}

/**
 * Generate daily brief
 */
export function generateDailyBrief(data) {
  const insights = generateInsights(data);
  
  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good Morning.';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon.';
  if (hour >= 17) greeting = 'Good Evening.';
  
  // Get top priorities
  const priorities = insights
    .filter(i => i.priority === INSIGHT_PRIORITY.CRITICAL || i.priority === INSIGHT_PRIORITY.HIGH)
    .slice(0, 5);
  
  // Get highlights
  const highlights = insights.slice(0, 3);
  
  return createDailyBrief({
    date: now.toISOString().split('T')[0],
    greeting,
    highlights,
    priorities,
    metrics: {
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.priority === INSIGHT_PRIORITY.CRITICAL).length,
      highCount: insights.filter(i => i.priority === INSIGHT_PRIORITY.HIGH).length
    }
  });
}

/**
 * Search insights
 */
export function searchInsights(insights, query) {
  if (!query || query.trim() === '') return insights;
  
  const lowerQuery = query.toLowerCase();
  
  return insights.filter(insight => {
    return (
      insight.title?.toLowerCase().includes(lowerQuery) ||
      insight.description?.toLowerCase().includes(lowerQuery) ||
      insight.category?.toLowerCase().includes(lowerQuery) ||
      insight.type?.toLowerCase().includes(lowerQuery)
    );
  });
}

export default {
  generateInsights,
  generateDailyBrief,
  searchInsights
};
