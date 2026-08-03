/**
 * Data Integration Layer
 * Connects Dashboard to real CafeOS modules
 * Dashboard is a READ-ONLY consumer of platform data
 */

class DataIntegrationLayer {
  constructor() {
    this.moduleData = new Map(); // module -> data
    this.initialized = false;
  }

  /**
   * Initialize the data integration layer
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Get orders data from Orders module
   * @param {Array} orders - Real orders from Orders module
   * @returns {Object} Processed orders data for dashboard
   */
  getOrdersData(orders) {
    if (!orders || !Array.isArray(orders)) {
      return this.getEmptyOrdersData();
    }

    const now = new Date();
    const today = now.toDateString();
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      return orderDate === today;
    });

    const statusCounts = {
      NEW: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      DELAYED: 0
    };

    let totalPrepTime = 0;
    let prepTimeCount = 0;
    let totalDeliveryTime = 0;
    let deliveryTimeCount = 0;

    todayOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      // Calculate prep time for completed orders
      if (order.status === 'COMPLETED' && order.createdAt && order.completedAt) {
        const prepTime = (new Date(order.completedAt) - new Date(order.createdAt)) / 60000; // minutes
        totalPrepTime += prepTime;
        prepTimeCount++;
      }

      // Calculate delivery time
      if (order.status === 'COMPLETED' && order.servedAt) {
        const deliveryTime = (new Date(order.servedAt) - new Date(order.completedAt)) / 60000; // minutes
        totalDeliveryTime += deliveryTime;
        deliveryTimeCount++;
      }

      // Check for delayed orders (older than 15 minutes and not completed)
      if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
        const elapsed = (now - new Date(order.createdAt)) / 60000;
        if (elapsed > 15) {
          statusCounts.DELAYED++;
        }
      }
    });

    const avgPrepTime = prepTimeCount > 0 ? Math.round(totalPrepTime / prepTimeCount) : 0;
    const avgDeliveryTime = deliveryTimeCount > 0 ? Math.round(totalDeliveryTime / deliveryTimeCount) : 0;

    return {
      total: todayOrders.length,
      completed: statusCounts.COMPLETED,
      cancelled: statusCounts.CANCELLED,
      delayed: statusCounts.DELAYED,
      new: statusCounts.NEW,
      accepted: statusCounts.ACCEPTED,
      preparing: statusCounts.PREPARING,
      ready: statusCounts.READY,
      avgPrepTime,
      avgDeliveryTime,
      statusBreakdown: statusCounts,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get kitchen data from Kitchen module
   * @param {Array} kdsCards - Real KDS cards from Kitchen module
   * @returns {Object} Processed kitchen data for dashboard
   */
  getKitchenData(kdsCards) {
    if (!kdsCards || !Array.isArray(kdsCards)) {
      return this.getEmptyKitchenData();
    }

    const now = new Date();
    const activeCards = kdsCards.filter(card => card.status !== 'COMPLETED' && card.status !== 'CANCELLED');
    
    const stationUtilization = {
      Bar: { active: 0, total: 0 },
      Kitchen: { active: 0, total: 0 },
      Packaging: { active: 0, total: 0 },
      Dessert: { active: 0, total: 0 }
    };

    let totalCookTime = 0;
    let cookTimeCount = 0;
    let longestWaiting = 0;
    let delayedCount = 0;

    activeCards.forEach(card => {
      // Station utilization
      if (card.station && stationUtilization[card.station]) {
        stationUtilization[card.station].total++;
        if (card.status === 'STARTED' || card.status === 'IN_PROGRESS') {
          stationUtilization[card.station].active++;
        }
      }

      // Calculate cook time
      if (card.startedAt && card.status === 'COMPLETED') {
        const cookTime = (new Date(card.completedAt) - new Date(card.startedAt)) / 60000;
        totalCookTime += cookTime;
        cookTimeCount++;
      }

      // Longest waiting
      const elapsed = (now - new Date(card.createdAt)) / 60000;
      if (elapsed > longestWaiting) {
        longestWaiting = Math.round(elapsed);
      }

      // Delayed cards (older than 12 minutes and not completed)
      if (elapsed > 12 && card.status !== 'COMPLETED') {
        delayedCount++;
      }
    });

    const avgCookTime = cookTimeCount > 0 ? Math.round(totalCookTime / cookTimeCount) : 0;
    
    // Calculate utilization percentages
    const utilization = {};
    Object.entries(stationUtilization).forEach(([station, data]) => {
      utilization[station] = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;
    });

    // Calculate overall kitchen load
    const totalStations = Object.keys(stationUtilization).length;
    const avgUtilization = totalStations > 0 
      ? Math.round(Object.values(utilization).reduce((a, b) => a + b, 0) / totalStations) 
      : 0;

    return {
      waiting: activeCards.filter(c => c.status === 'NEW' || c.status === 'ACCEPTED').length,
      cooking: activeCards.filter(c => c.status === 'STARTED' || c.status === 'IN_PROGRESS').length,
      ready: activeCards.filter(c => c.status === 'READY').length,
      collected: kdsCards.filter(c => c.status === 'COMPLETED').length,
      delayed: delayedCount,
      avgCookTime,
      longestWaiting,
      stationUtilization: utilization,
      kitchenLoad: avgUtilization,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get tables data from Tables module
   * @param {Array} tables - Real tables from Tables module
   * @returns {Object} Processed tables data for dashboard
   */
  getTablesData(tables) {
    if (!tables || !Array.isArray(tables)) {
      return this.getEmptyTablesData();
    }

    const now = new Date();
    const totalTables = tables.length;
    
    const occupied = tables.filter(t => t.status === 'OCCUPIED');
    const reserved = tables.filter(t => t.status === 'RESERVED');
    const cleaning = tables.filter(t => t.status === 'CLEANING');
    const available = tables.filter(t => t.status === 'AVAILABLE');

    let totalOccupancyTime = 0;
    let occupancyCount = 0;
    let overstayedCount = 0;

    occupied.forEach(table => {
      if (table.occupiedAt) {
        const occupiedTime = (now - new Date(table.occupiedAt)) / 60000; // minutes
        totalOccupancyTime += occupiedTime;
        occupancyCount++;

        // Check for overstayed (occupied longer than 90 minutes)
        if (occupiedTime > 90) {
          overstayedCount++;
        }
      }
    });

    const avgOccupancyTime = occupancyCount > 0 ? Math.round(totalOccupancyTime / occupancyCount) : 0;
    const occupancyRate = totalTables > 0 ? Math.round((occupied.length / totalTables) * 100) : 0;

    return {
      total: totalTables,
      occupied: occupied.length,
      reserved: reserved.length,
      cleaning: cleaning.length,
      available: available.length,
      occupancyRate,
      avgOccupancyTime,
      overstayed: overstayedCount,
      upcomingReservations: reserved.length,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get payments data from Payments module
   * @param {Array} orders - Orders with payment info
   * @returns {Object} Processed payments data for dashboard
   */
  getPaymentsData(orders) {
    if (!orders || !Array.isArray(orders)) {
      return this.getEmptyPaymentsData();
    }

    const now = new Date();
    const today = now.toDateString();
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      return orderDate === today && order.status === 'COMPLETED';
    });

    let cash = 0;
    let upi = 0;
    let card = 0;
    let split = 0;
    let refunds = 0;
    let failed = 0;
    let totalRevenue = 0;
    let totalProcessingTime = 0;
    let processingCount = 0;

    todayOrders.forEach(order => {
      const paymentMethod = order.paymentMethod || 'CASH';
      const amount = order.total || 0;

      if (paymentMethod === 'CASH') cash += amount;
      else if (paymentMethod === 'UPI') upi += amount;
      else if (paymentMethod === 'CARD') card += amount;
      else if (paymentMethod === 'SPLIT') split += amount;

      if (order.isRefund) refunds += amount;
      if (order.paymentFailed) failed++;

      totalRevenue += amount;

      // Calculate processing time
      if (order.paymentStartedAt && order.paymentCompletedAt) {
        const processingTime = (new Date(order.paymentCompletedAt) - new Date(order.paymentStartedAt)) / 1000; // seconds
        totalProcessingTime += processingTime;
        processingCount++;
      }
    });

    const avgProcessingTime = processingCount > 0 ? Math.round(totalProcessingTime / processingCount) : 0;
    const successRate = todayOrders.length > 0 ? Math.round(((todayOrders.length - failed) / todayOrders.length) * 100) : 100;

    return {
      totalToday: totalRevenue,
      cash,
      upi,
      card,
      split,
      refunds,
      failed,
      total: todayOrders.length,
      avgProcessingTime,
      successRate,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get inventory data from Inventory module
   * @param {Array} inventory - Real inventory from Inventory module
   * @returns {Object} Processed inventory data for dashboard
   */
  getInventoryData(inventory) {
    if (!inventory || !Array.isArray(inventory)) {
      return this.getEmptyInventoryData();
    }

    const critical = inventory.filter(item => item.quantity <= 5);
    const low = inventory.filter(item => item.quantity > 5 && item.quantity <= 15);
    const out = inventory.filter(item => item.quantity === 0);
    const expiring = inventory.filter(item => item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    return {
      critical: critical.map(item => item.name),
      low: low.map(item => item.name),
      out: out.map(item => item.name),
      expiring: expiring.map(item => item.name),
      criticalCount: critical.length,
      lowCount: low.length,
      outCount: out.length,
      expiringCount: expiring.length,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get reservations data from Reservations module
   * @param {Array} reservations - Real reservations from Reservations module
   * @returns {Object} Processed reservations data for dashboard
   */
  getReservationsData(reservations) {
    if (!reservations || !Array.isArray(reservations)) {
      return this.getEmptyReservationsData();
    }

    const now = new Date();
    const today = now.toDateString();
    
    const todayReservations = reservations.filter(res => {
      const resDate = new Date(res.date).toDateString();
      return resDate === today;
    });

    const checkedIn = todayReservations.filter(r => r.status === 'CHECKED_IN');
    const late = todayReservations.filter(r => r.status === 'LATE');
    const noShow = todayReservations.filter(r => r.status === 'NO_SHOW');
    const completed = todayReservations.filter(r => r.status === 'COMPLETED');
    const pending = todayReservations.filter(r => r.status === 'PENDING');

    return {
      total: todayReservations.length,
      checkedIn: checkedIn.length,
      late: late.length,
      noShow: noShow.length,
      completed: completed.length,
      pending: pending.length,
      upcoming: pending.length,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get customer data from CRM module
   * @param {Array} customers - Real customers from CRM module
   * @param {Array} orders - Orders for customer analysis
   * @returns {Object} Processed customer data for dashboard
   */
  getCustomerData(customers, orders) {
    if (!customers || !Array.isArray(customers)) {
      return this.getEmptyCustomerData();
    }

    const now = new Date();
    const today = now.toDateString();
    
    const todayOrders = orders ? orders.filter(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      return orderDate === today;
    }) : [];

    // Count returning customers (customers with more than 1 order)
    const customerOrderCounts = {};
    todayOrders.forEach(order => {
      if (order.customerId) {
        customerOrderCounts[order.customerId] = (customerOrderCounts[order.customerId] || 0) + 1;
      }
    });

    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = todayOrders.length - returningCustomers;

    let totalSpend = 0;
    todayOrders.forEach(order => {
      totalSpend += order.total || 0;
    });

    const avgSpend = todayOrders.length > 0 ? Math.round(totalSpend / todayOrders.length) : 0;

    return {
      customersToday: todayOrders.length,
      returningCustomers,
      newCustomers,
      averageSpend: avgSpend,
      totalCustomers: customers.length,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get health data from Health Engine
   * @param {Object} healthData - Real health data from Health Engine
   * @returns {Object} Processed health data for dashboard
   */
  getHealthData(healthData) {
    if (!healthData) {
      return this.getEmptyHealthData();
    }

    return {
      components: healthData.components || {},
      overallStatus: healthData.overallStatus || 'unknown',
      lastUpdated: Date.now()
    };
  }

  /**
   * Get staff data from Staff module
   * @param {Array} staff - Real staff from Staff module
   * @param {Array} shifts - Real shifts from Shift module
   * @returns {Object} Processed staff data for dashboard
   */
  getStaffData(staff, shifts) {
    if (!staff || !Array.isArray(staff)) {
      return this.getEmptyStaffData();
    }

    const now = new Date();
    const today = now.toDateString();

    const activeShift = shifts ? shifts.find(shift => {
      const shiftDate = new Date(shift.date).toDateString();
      return shiftDate === today && shift.status === 'ACTIVE';
    }) : null;

    const activeStaff = activeShift ? activeShift.staffIds || [] : [];
    const clockedIn = staff.filter(s => s.status === 'CLOCKED_IN').length;

    return {
      active: activeStaff.length,
      clockedIn,
      total: staff.length,
      onBreak: staff.filter(s => s.status === 'ON_BREAK').length,
      offline: staff.filter(s => s.status === 'OFFLINE').length,
      lastUpdated: Date.now()
    };
  }

  // Empty data helpers
  getEmptyOrdersData() {
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      delayed: 0,
      new: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      avgPrepTime: 0,
      avgDeliveryTime: 0,
      statusBreakdown: {},
      lastUpdated: Date.now()
    };
  }

  getEmptyKitchenData() {
    return {
      waiting: 0,
      cooking: 0,
      ready: 0,
      collected: 0,
      delayed: 0,
      avgCookTime: 0,
      longestWaiting: 0,
      stationUtilization: {},
      kitchenLoad: 0,
      lastUpdated: Date.now()
    };
  }

  getEmptyTablesData() {
    return {
      total: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      available: 0,
      occupancyRate: 0,
      avgOccupancyTime: 0,
      overstayed: 0,
      upcomingReservations: 0,
      lastUpdated: Date.now()
    };
  }

  getEmptyPaymentsData() {
    return {
      totalToday: 0,
      cash: 0,
      upi: 0,
      card: 0,
      split: 0,
      refunds: 0,
      failed: 0,
      total: 0,
      avgProcessingTime: 0,
      successRate: 100,
      lastUpdated: Date.now()
    };
  }

  getEmptyInventoryData() {
    return {
      critical: [],
      low: [],
      out: [],
      expiring: [],
      criticalCount: 0,
      lowCount: 0,
      outCount: 0,
      expiringCount: 0,
      lastUpdated: Date.now()
    };
  }

  getEmptyReservationsData() {
    return {
      total: 0,
      checkedIn: 0,
      late: 0,
      noShow: 0,
      completed: 0,
      pending: 0,
      upcoming: 0,
      lastUpdated: Date.now()
    };
  }

  getEmptyCustomerData() {
    return {
      customersToday: 0,
      returningCustomers: 0,
      newCustomers: 0,
      averageSpend: 0,
      totalCustomers: 0,
      lastUpdated: Date.now()
    };
  }

  getEmptyHealthData() {
    return {
      components: {},
      overallStatus: 'unknown',
      lastUpdated: Date.now()
    };
  }

  getEmptyStaffData() {
    return {
      active: 0,
      clockedIn: 0,
      total: 0,
      onBreak: 0,
      offline: 0,
      lastUpdated: Date.now()
    };
  }
}

// Singleton instance
const dataIntegrationLayer = new DataIntegrationLayer();

export default dataIntegrationLayer;
