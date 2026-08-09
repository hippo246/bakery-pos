// Order Router
// Handles order routing, assignment, and transfer between terminals

import { getTerminalManager } from './TerminalManager.js';
import { getRealtimeSyncClient } from '../realtime/RealtimeSyncClient.js';

export class OrderRouter {
  constructor(options = {}) {
    this.options = {
      ...options
    };
    
    this.terminalManager = getTerminalManager();
    this.syncClient = getRealtimeSyncClient();
    this.orderAssignments = new Map(); // orderId -> { terminalId, assignedAt, assignedBy }
    this.eventHandlers = new Map();
    
    this.loadOrderAssignments();
  }

  /**
   * Load order assignments from localStorage
   */
  loadOrderAssignments() {
    try {
      const stored = localStorage.getItem('cafeos_order_assignments');
      if (stored) {
        this.orderAssignments = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[OrderRouter] Failed to load order assignments:', error);
    }
  }

  /**
   * Save order assignments to localStorage
   */
  saveOrderAssignments() {
    try {
      localStorage.setItem('cafeos_order_assignments', JSON.stringify(Array.from(this.orderAssignments)));
    } catch (error) {
      console.error('[OrderRouter] Failed to save order assignments:', error);
    }
  }

  /**
   * Assign order to terminal
   */
  assignOrder(orderId, terminalId, assignedBy = null) {
    const terminal = this.terminalManager.getTerminal(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    const assignment = {
      orderId,
      terminalId,
      terminalName: terminal.name,
      assignedAt: Date.now(),
      assignedBy: assignedBy || terminalId
    };
    
    this.orderAssignments.set(orderId, assignment);
    this.saveOrderAssignments();
    
    console.log(`[OrderRouter] Order ${orderId} assigned to terminal ${terminalId}`);
    
    this.emit('orderAssigned', { orderId, assignment });
    
    return assignment;
  }

  /**
   * Get order assignment
   */
  getOrderAssignment(orderId) {
    return this.orderAssignments.get(orderId);
  }

  /**
   * Get terminal for order
   */
  getOrderTerminal(orderId) {
    const assignment = this.orderAssignments.get(orderId);
    return assignment ? this.terminalManager.getTerminal(assignment.terminalId) : null;
  }

  /**
   * Transfer order to another terminal
   */
  transferOrder(orderId, fromTerminalId, toTerminalId, transferredBy = null) {
    const fromTerminal = this.terminalManager.getTerminal(fromTerminalId);
    const toTerminal = this.terminalManager.getTerminal(toTerminalId);
    
    if (!fromTerminal || !toTerminal) {
      throw new Error('Invalid terminal IDs');
    }
    
    const currentAssignment = this.orderAssignments.get(orderId);
    
    if (currentAssignment && currentAssignment.terminalId !== fromTerminalId) {
      throw new Error('Order not assigned to source terminal');
    }
    
    // Update assignment
    const newAssignment = {
      orderId,
      terminalId: toTerminalId,
      terminalName: toTerminal.name,
      assignedAt: Date.now(),
      assignedBy: transferredBy || fromTerminalId,
      transferredFrom: fromTerminalId,
      transferredAt: Date.now()
    };
    
    this.orderAssignments.set(orderId, newAssignment);
    this.saveOrderAssignments();
    
    console.log(`[OrderRouter] Order ${orderId} transferred from ${fromTerminalId} to ${toTerminalId}`);
    
    // Broadcast transfer
    this.syncClient.send({
      type: 'order_transferred',
      data: {
        orderId,
        fromTerminalId,
        toTerminalId,
        transferredBy
      },
      timestamp: Date.now()
    });
    
    this.emit('orderTransferred', { orderId, fromTerminalId, toTerminalId, assignment: newAssignment });
    
    return newAssignment;
  }

  /**
   * Auto-assign order based on terminal configuration
   */
  autoAssignOrder(order, terminalId = null) {
    // If terminalId provided, assign to that terminal
    if (terminalId) {
      return this.assignOrder(order.id, terminalId);
    }
    
    // Otherwise, assign based on order type and terminal configuration
    const currentTerminal = this.terminalManager.getCurrentTerminal();
    
    if (currentTerminal) {
      // Check if current terminal can handle this order type
      const canHandle = this.canTerminalHandleOrder(currentTerminal, order);
      
      if (canHandle) {
        return this.assignOrder(order.id, currentTerminal.id);
      }
      
      // Find a terminal that can handle this order type
      const suitableTerminal = this.findSuitableTerminal(order);
      
      if (suitableTerminal) {
        return this.assignOrder(order.id, suitableTerminal.id);
      }
    }
    
    // Fallback to current terminal
    if (currentTerminal) {
      return this.assignOrder(order.id, currentTerminal.id);
    }
    
    throw new Error('No suitable terminal found for order');
  }

  /**
   * Check if terminal can handle order
   */
  canTerminalHandleOrder(terminal, order) {
    // Check if terminal is active
    if (!terminal.isActive) {
      return false;
    }
    
    // Check order type compatibility
    if (terminal.defaultOrderType && order.orderType !== terminal.defaultOrderType) {
      // Terminal has preferred order type, but order doesn't match
      // This is a soft check - we can still assign if needed
    }
    
    // Check if terminal has required features
    if (order.metadata?.isDeliveryOrder && !terminal.enabledFeatures?.deliveryPlatform) {
      return false;
    }
    
    return true;
  }

  /**
   * Find suitable terminal for order
   */
  findSuitableTerminal(order) {
    const terminals = this.terminalManager.getActiveTerminals();
    
    for (const terminal of terminals) {
      if (this.canTerminalHandleOrder(terminal, order)) {
        return terminal;
      }
    }
    
    return null;
  }

  /**
   * Route order to kitchen display
   */
  routeToKitchen(order) {
    // Find KDS terminals
    const kdsTerminals = this.terminalManager.getTerminalsByType('kds');
    
    if (kdsTerminals.length === 0) {
      console.warn('[OrderRouter] No KDS terminals found');
      return;
    }
    
    // Broadcast order to all KDS terminals
    this.syncClient.send({
      type: 'order_to_kitchen',
      data: order,
      timestamp: Date.now()
    });
    
    console.log(`[OrderRouter] Order ${order.id} routed to kitchen display`);
    
    this.emit('orderRoutedToKitchen', { orderId: order.id, kdsTerminals });
  }

  /**
   * Get orders for terminal
   */
  getOrdersForTerminal(terminalId, allOrders) {
    const terminalOrders = [];
    
    allOrders.forEach(order => {
      const assignment = this.orderAssignments.get(order.id);
      
      if (assignment && assignment.terminalId === terminalId) {
        terminalOrders.push({
          ...order,
          assignment
        });
      }
    });
    
    return terminalOrders;
  }

  /**
   * Get unassigned orders
   */
  getUnassignedOrders(allOrders) {
    return allOrders.filter(order => !this.orderAssignments.has(order.id));
  }

  /**
   * Get order statistics by terminal
   */
  getOrderStatistics(allOrders) {
    const stats = new Map();
    
    allOrders.forEach(order => {
      const assignment = this.orderAssignments.get(order.id);
      
      if (assignment) {
        const terminalId = assignment.terminalId;
        
        if (!stats.has(terminalId)) {
          stats.set(terminalId, {
            terminalId,
            totalOrders: 0,
            byStatus: {},
            byType: {}
          });
        }
        
        const terminalStats = stats.get(terminalId);
        terminalStats.totalOrders++;
        
        // By status
        const status = order.status || 'unknown';
        terminalStats.byStatus[status] = (terminalStats.byStatus[status] || 0) + 1;
        
        // By type
        const type = order.orderType || 'unknown';
        terminalStats.byType[type] = (terminalStats.byType[type] || 0) + 1;
      }
    });
    
    return Array.from(stats.values());
  }

  /**
   * Release order assignment
   */
  releaseOrder(orderId) {
    const assignment = this.orderAssignments.get(orderId);
    
    if (assignment) {
      this.orderAssignments.delete(orderId);
      this.saveOrderAssignments();
      
      console.log(`[OrderRouter] Released order ${orderId}`);
      
      this.emit('orderReleased', { orderId, assignment });
      
      return assignment;
    }
    
    return null;
  }

  /**
   * Bulk assign orders to terminal
   */
  bulkAssignOrders(orderIds, terminalId, assignedBy = null) {
    const results = [];
    
    orderIds.forEach(orderId => {
      try {
        const assignment = this.assignOrder(orderId, terminalId, assignedBy);
        results.push({ orderId, success: true, assignment });
      } catch (error) {
        results.push({ orderId, success: false, error: error.message });
      }
    });
    
    this.emit('bulkOrderAssigned', { results });
    
    return results;
  }

  /**
   * Handle order transfer from sync
   */
  handleOrderTransfer(data) {
    const { orderId, fromTerminalId, toTerminalId, transferredBy } = data;
    
    const newAssignment = {
      orderId,
      terminalId: toTerminalId,
      assignedAt: Date.now(),
      assignedBy: transferredBy,
      transferredFrom: fromTerminalId,
      transferredAt: Date.now()
    };
    
    this.orderAssignments.set(orderId, newAssignment);
    this.saveOrderAssignments();
    
    this.emit('orderTransferred', { orderId, fromTerminalId, toTerminalId, assignment: newAssignment });
  }

  /**
   * Clear all assignments
   */
  clearAllAssignments() {
    this.orderAssignments.clear();
    this.saveOrderAssignments();
    
    this.emit('assignmentsCleared', {});
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[OrderRouter] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the order router
   */
  destroy() {
    this.orderAssignments.clear();
    this.eventHandlers.clear();
    console.log('[OrderRouter] Destroyed');
  }
}

// Singleton instance
let orderRouterInstance = null;

/**
 * Get the singleton order router instance
 */
export function getOrderRouter(options = {}) {
  if (!orderRouterInstance) {
    orderRouterInstance = new OrderRouter(options);
  }
  return orderRouterInstance;
}

export default OrderRouter;
