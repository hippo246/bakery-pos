/**
 * Module Event Publisher
 * Publishes events from CafeOS modules to the Dashboard Event Bus
 * Modules publish events, Dashboard subscribes - Dashboard never initiates
 */

import eventBus from './EventBus.js';

class ModuleEventPublisher {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the event publisher
   */
  initialize() {
    if (this.initialized) return;
    eventBus.initialize();
    this.initialized = true;
  }

  /**
   * Publish order event
   * @param {string} eventType - Order event type
   * @param {Object} data - Order data
   */
  publishOrderEvent(eventType, data) {
    eventBus.publish({
      category: 'orders',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish kitchen event
   * @param {string} eventType - Kitchen event type
   * @param {Object} data - Kitchen data
   */
  publishKitchenEvent(eventType, data) {
    eventBus.publish({
      category: 'kitchen',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish waiter event
   * @param {string} eventType - Waiter event type
   * @param {Object} data - Waiter data
   */
  publishWaiterEvent(eventType, data) {
    eventBus.publish({
      category: 'waiters',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish table event
   * @param {string} eventType - Table event type
   * @param {Object} data - Table data
   */
  publishTableEvent(eventType, data) {
    eventBus.publish({
      category: 'tables',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish payment event
   * @param {string} eventType - Payment event type
   * @param {Object} data - Payment data
   */
  publishPaymentEvent(eventType, data) {
    eventBus.publish({
      category: 'payments',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish inventory event
   * @param {string} eventType - Inventory event type
   * @param {Object} data - Inventory data
   */
  publishInventoryEvent(eventType, data) {
    eventBus.publish({
      category: 'inventory',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish reservation event
   * @param {string} eventType - Reservation event type
   * @param {Object} data - Reservation data
   */
  publishReservationEvent(eventType, data) {
    eventBus.publish({
      category: 'reservations',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish CRM event
   * @param {string} eventType - CRM event type
   * @param {Object} data - CRM data
   */
  publishCrmEvent(eventType, data) {
    eventBus.publish({
      category: 'crm',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish staff event
   * @param {string} eventType - Staff event type
   * @param {Object} data - Staff data
   */
  publishStaffEvent(eventType, data) {
    eventBus.publish({
      category: 'staff',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish health event
   * @param {string} eventType - Health event type
   * @param {Object} data - Health data
   */
  publishHealthEvent(eventType, data) {
    eventBus.publish({
      category: 'health',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish alert event
   * @param {string} eventType - Alert event type
   * @param {Object} data - Alert data
   */
  publishAlertEvent(eventType, data) {
    eventBus.publish({
      category: 'alerts',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Publish activity event
   * @param {string} eventType - Activity event type
   * @param {Object} data - Activity data
   */
  publishActivityEvent(eventType, data) {
    eventBus.publish({
      category: 'activity',
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }
}

// Singleton instance
const moduleEventPublisher = new ModuleEventPublisher();

export default moduleEventPublisher;
