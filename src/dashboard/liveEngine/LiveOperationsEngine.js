/**
 * Live Operations Engine
 * Central engine for managing live operational data and updates
 * READ-ONLY consumer of platform data - no business logic
 */

import eventBus from './EventBus.js';
import dataIntegrationLayer from './DataIntegrationLayer.js';
import { 
  OrderEvents, 
  KitchenEvents, 
  WaiterEvents, 
  TableEvents, 
  PaymentEvents,
  InventoryEvents,
  ReservationEvents,
  StaffEvents,
  HealthEvents,
  AlertEvents,
  ActivityEvents
} from './EventTypes.js';

class LiveOperationsEngine {
  constructor() {
    this.dataStore = new Map(); // dataType -> data
    this.subscribers = new Map(); // dataType -> Set of callbacks
    this.refreshIntervals = new Map(); // dataType -> intervalId
    this.initialized = false;
    this.platformData = null; // Reference to platform data
  }

  /**
   * Initialize the live operations engine
   */
  initialize() {
    if (this.initialized) return;

    eventBus.initialize();
    dataIntegrationLayer.initialize();

    // Subscribe to event bus and update data store
    this.setupEventListeners();

    this.initialized = true;
  }

  /**
   * Set platform data reference
   * @param {Object} platformData - Real platform data from CafeOS modules
   */
  setPlatformData(platformData) {
    this.platformData = platformData;
    this.refreshAllData();
  }

  /**
   * Refresh all data from platform
   */
  refreshAllData() {
    if (!this.platformData) return;

    const { orders, kdsCards, tables, inventory, reservations, customers, healthData, staff, shifts } = this.platformData;

    // Update all data stores using real platform data
    this.updateData('orders', dataIntegrationLayer.getOrdersData(orders));
    this.updateData('kitchen', dataIntegrationLayer.getKitchenData(kdsCards));
    this.updateData('tables', dataIntegrationLayer.getTablesData(tables));
    this.updateData('payments', dataIntegrationLayer.getPaymentsData(orders));
    this.updateData('inventory', dataIntegrationLayer.getInventoryData(inventory));
    this.updateData('reservations', dataIntegrationLayer.getReservationsData(reservations));
    this.updateData('customers', dataIntegrationLayer.getCustomerData(customers, orders));
    this.updateData('health', dataIntegrationLayer.getHealthData(healthData));
    this.updateData('staff', dataIntegrationLayer.getStaffData(staff, shifts));
  }

  /**
   * Setup event listeners to update data store
   */
  setupEventListeners() {
    // Order events
    eventBus.subscribeToCategory('orders', (event) => {
      this.updateData('orders', event.data);
    });

    // Kitchen events
    eventBus.subscribeToCategory('kitchen', (event) => {
      this.updateData('kitchen', event.data);
    });

    // Waiter events
    eventBus.subscribeToCategory('waiters', (event) => {
      this.updateData('waiters', event.data);
    });

    // Table events
    eventBus.subscribeToCategory('tables', (event) => {
      this.updateData('tables', event.data);
    });

    // Payment events
    eventBus.subscribeToCategory('payments', (event) => {
      this.updateData('payments', event.data);
    });

    // Inventory events
    eventBus.subscribeToCategory('inventory', (event) => {
      this.updateData('inventory', event.data);
    });

    // Reservation events
    eventBus.subscribeToCategory('reservations', (event) => {
      this.updateData('reservations', event.data);
    });

    // CRM events
    eventBus.subscribeToCategory('crm', (event) => {
      this.updateData('customers', event.data);
    });

    // Staff events
    eventBus.subscribeToCategory('staff', (event) => {
      this.updateData('staff', event.data);
    });

    // Health events
    eventBus.subscribeToCategory('health', (event) => {
      this.updateData('health', event.data);
    });

    // Alert events
    eventBus.subscribeToCategory('alerts', (event) => {
      this.updateData('alerts', event.data);
    });
  }

  /**
   * Update data in store and notify subscribers
   * @param {string} dataType - Data type
   * @param {Object} data - Data to update
   */
  updateData(dataType, data) {
    this.dataStore.set(dataType, {
      ...this.dataStore.get(dataType),
      ...data,
      lastUpdated: Date.now()
    });

    this.notifySubscribers(dataType);
  }

  /**
   * Get data for a specific type
   * @param {string} dataType - Data type
   * @returns {Object|null}
   */
  getData(dataType) {
    return this.dataStore.get(dataType) || null;
  }

  /**
   * Subscribe to data updates
   * @param {string} dataType - Data type to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(dataType, callback) {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Set());
    }

    this.subscribers.get(dataType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(dataType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(dataType);
        }
      }
    };
  }

  /**
   * Notify subscribers of data updates
   * @param {string} dataType - Data type
   */
  notifySubscribers(dataType) {
    const callbacks = this.subscribers.get(dataType);
    if (callbacks) {
      const data = this.getData(dataType);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in data callback for ${dataType}:`, error);
        }
      });
    }
  }

  /**
   * Start auto-refresh for a data type
   * @param {string} dataType - Data type
   * @param {Function} fetchFn - Fetch function
   * @param {number} interval - Refresh interval in ms
   */
  startAutoRefresh(dataType, fetchFn, interval) {
    // Clear existing interval if any
    this.stopAutoRefresh(dataType);

    const intervalId = setInterval(async () => {
      try {
        const data = await fetchFn();
        this.updateData(dataType, data);
      } catch (error) {
        console.error(`Auto-refresh failed for ${dataType}:`, error);
      }
    }, interval);

    this.refreshIntervals.set(dataType, intervalId);
  }

  /**
   * Stop auto-refresh for a data type
   * @param {string} dataType - Data type
   */
  stopAutoRefresh(dataType) {
    const intervalId = this.refreshIntervals.get(dataType);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(dataType);
    }
  }

  /**
   * Stop all auto-refresh intervals
   */
  stopAllAutoRefresh() {
    this.refreshIntervals.forEach((intervalId, dataType) => {
      clearInterval(intervalId);
    });
    this.refreshIntervals.clear();
  }

  /**
   * Emit an order event
   * @param {string} eventType - Order event type
   * @param {Object} data - Order data
   */
  emitOrderEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'orders' });
  }

  /**
   * Emit a kitchen event
   * @param {string} eventType - Kitchen event type
   * @param {Object} data - Kitchen data
   */
  emitKitchenEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'kitchen' });
  }

  /**
   * Emit a waiter event
   * @param {string} eventType - Waiter event type
   * @param {Object} data - Waiter data
   */
  emitWaiterEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'waiters' });
  }

  /**
   * Emit a table event
   * @param {string} eventType - Table event type
   * @param {Object} data - Table data
   */
  emitTableEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'tables' });
  }

  /**
   * Emit a payment event
   * @param {string} eventType - Payment event type
   * @param {Object} data - Payment data
   */
  emitPaymentEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'payments' });
  }

  /**
   * Emit an inventory event
   * @param {string} eventType - Inventory event type
   * @param {Object} data - Inventory data
   */
  emitInventoryEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'inventory' });
  }

  /**
   * Emit a reservation event
   * @param {string} eventType - Reservation event type
   * @param {Object} data - Reservation data
   */
  emitReservationEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'reservations' });
  }

  /**
   * Emit a staff event
   * @param {string} eventType - Staff event type
   * @param {Object} data - Staff data
   */
  emitStaffEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'staff' });
  }

  /**
   * Emit a health event
   * @param {string} eventType - Health event type
   * @param {Object} data - Health data
   */
  emitHealthEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'health' });
  }

  /**
   * Emit an alert event
   * @param {string} eventType - Alert event type
   * @param {Object} data - Alert data
   */
  emitAlertEvent(eventType, data) {
    eventBus.publish(eventType, data, { category: 'alerts' });
  }

  /**
   * Get all data
   * @returns {Object}
   */
  getAllData() {
    const allData = {};
    this.dataStore.forEach((value, key) => {
      allData[key] = value;
    });
    return allData;
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.stopAllAutoRefresh();
    this.dataStore.clear();
    this.subscribers.clear();
  }
}

// Singleton instance
const liveOperationsEngine = new LiveOperationsEngine();

export default liveOperationsEngine;
