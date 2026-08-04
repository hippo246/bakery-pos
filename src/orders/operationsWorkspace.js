// Operations Workspace
// Optional manager workspace with configurable widgets: Terminal Status, Cashiers, Kitchen, Tables, Orders, Payments, Incidents, Approvals, Notifications

import { now } from '../domain/dates.js';
import { getTerminalManager } from './terminalManager.js';
import { getOperationalMonitor } from './operationalMonitor.js';
import { getQueueManager } from './queueManager.js';
import { getIncidentDashboard } from './incidentDashboard.js';
import { getEnterpriseNotifications } from './enterpriseNotifications.js';

const WORKSPACE_KEY = 'cafeos_operations_workspace';

/**
 * Widget Types
 */
export const WIDGET_TYPES = {
  TERMINAL_STATUS: 'TERMINAL_STATUS',
  CASHIERS: 'CASHIERS',
  KITCHEN: 'KITCHEN',
  TABLES: 'TABLES',
  ORDERS: 'ORDERS',
  PAYMENTS: 'PAYMENTS',
  INCIDENTS: 'INCIDENTS',
  APPROVALS: 'APPROVALS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  SHIFTS: 'SHIFTS',
  QUEUES: 'QUEUES',
  REVENUE: 'REVENUE',
  PERFORMANCE: 'PERFORMANCE',
  CUSTOM: 'CUSTOM'
};

/**
 * Widget Size
 */
export const WIDGET_SIZE = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  FULL: 'FULL'
};

/**
 * Operations Workspace class
 * Optional manager workspace with configurable widgets
 */
export class OperationsWorkspace {
  constructor() {
    this.workspaces = new Map();
    this.loadWorkspaces();
  }

  /**
   * Load workspaces from localStorage
   */
  loadWorkspaces() {
    try {
      const stored = localStorage.getItem(WORKSPACE_KEY);
      if (stored) {
        const workspaces = JSON.parse(stored);
        workspaces.forEach(workspace => {
          this.workspaces.set(workspace.id, workspace);
        });
      }
    } catch (error) {
      console.error('[OperationsWorkspace] Failed to load workspaces:', error);
    }
  }

  /**
   * Save workspaces to localStorage
   */
  saveWorkspaces() {
    try {
      const workspaces = Array.from(this.workspaces.values());
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspaces));
    } catch (error) {
      console.error('[OperationsWorkspace] Failed to save workspaces:', error);
    }
  }

  /**
   * Create a workspace
   * @param {Object} workspaceData - Workspace data
   * @returns {Object} Created workspace
   */
  createWorkspace(workspaceData) {
    const workspace = {
      id: workspaceData.id || `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: workspaceData.name || 'Untitled Workspace',
      description: workspaceData.description || '',
      
      // Scope
      branchId: workspaceData.branchId || null,
      userId: workspaceData.userId || null,
      
      // Layout
      layout: workspaceData.layout || 'GRID',
      columns: workspaceData.columns || 3,
      
      // Widgets
      widgets: workspaceData.widgets || [],
      
      // Settings
      autoRefresh: workspaceData.autoRefresh !== false,
      refreshInterval: workspaceData.refreshInterval || 30000,
      
      // Metadata
      metadata: workspaceData.metadata || {},
      createdAt: now(),
      createdBy: workspaceData.createdBy || null,
      isDefault: workspaceData.isDefault || false
    };

    this.workspaces.set(workspace.id, workspace);
    this.saveWorkspaces();

    return workspace;
  }

  /**
   * Get workspace by ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Object|null} Workspace or null
   */
  getWorkspace(workspaceId) {
    return this.workspaces.get(workspaceId) || null;
  }

  /**
   * Get all workspaces
   * @returns {Array} Array of workspaces
   */
  getAllWorkspaces() {
    return Array.from(this.workspaces.values());
  }

  /**
   * Get workspaces by user
   * @param {string} userId - User ID
   * @returns {Array} Array of workspaces
   */
  getWorkspacesByUser(userId) {
    return this.getAllWorkspaces().filter(w => w.userId === userId);
  }

  /**
   * Get workspaces by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of workspaces
   */
  getWorkspacesByBranch(branchId) {
    return this.getAllWorkspaces().filter(w => w.branchId === branchId);
  }

  /**
   * Get default workspace
   * @param {string} userId - User ID
   * @returns {Object|null} Default workspace or null
   */
  getDefaultWorkspace(userId) {
    return this.getAllWorkspaces().find(w => w.userId === userId && w.isDefault) || null;
  }

  /**
   * Add widget to workspace
   * @param {string} workspaceId - Workspace ID
   * @param {Object} widgetData - Widget data
   * @returns {Object} Result
   */
  addWidget(workspaceId, widgetData) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { success: false, reason: 'Workspace not found' };
    }

    const widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: widgetData.type || WIDGET_TYPES.CUSTOM,
      title: widgetData.title || 'Untitled Widget',
      size: widgetData.size || WIDGET_SIZE.MEDIUM,
      position: widgetData.position || { x: 0, y: 0 },
      
      // Configuration
      config: widgetData.config || {},
      
      // Refresh
      autoRefresh: widgetData.autoRefresh !== false,
      refreshInterval: widgetData.refreshInterval || 30000,
      
      // Visibility
      visible: widgetData.visible !== false,
      collapsible: widgetData.collapsible !== false,
      collapsed: widgetData.collapsed || false,
      
      // Metadata
      metadata: widgetData.metadata || {},
      createdAt: now()
    };

    workspace.widgets.push(widget);
    this.workspaces.set(workspaceId, workspace);
    this.saveWorkspaces();

    return { success: true, widget };
  }

  /**
   * Update widget
   * @param {string} workspaceId - Workspace ID
   * @param {string} widgetId - Widget ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Result
   */
  updateWidget(workspaceId, widgetId, updates) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { success: false, reason: 'Workspace not found' };
    }

    const widget = workspace.widgets.find(w => w.id === widgetId);
    if (!widget) {
      return { success: false, reason: 'Widget not found' };
    }

    Object.assign(widget, updates);
    this.workspaces.set(workspaceId, workspace);
    this.saveWorkspaces();

    return { success: true, widget };
  }

  /**
   * Remove widget from workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} widgetId - Widget ID
   * @returns {Object} Result
   */
  removeWidget(workspaceId, widgetId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { success: false, reason: 'Workspace not found' };
    }

    const index = workspace.widgets.findIndex(w => w.id === widgetId);
    if (index === -1) {
      return { success: false, reason: 'Widget not found' };
    }

    workspace.widgets.splice(index, 1);
    this.workspaces.set(workspaceId, workspace);
    this.saveWorkspaces();

    return { success: true };
  }

  /**
   * Reorder widgets
   * @param {string} workspaceId - Workspace ID
   * @param {Array} widgetIds - New order of widget IDs
   * @returns {Object} Result
   */
  reorderWidgets(workspaceId, widgetIds) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { success: false, reason: 'Workspace not found' };
    }

    const widgetMap = new Map(workspace.widgets.map(w => [w.id, w]));
    const reorderedWidgets = [];

    widgetIds.forEach(id => {
      if (widgetMap.has(id)) {
        reorderedWidgets.push(widgetMap.get(id));
        widgetMap.delete(id);
      }
    });

    // Add any remaining widgets
    widgetMap.forEach(widget => {
      reorderedWidgets.push(widget);
    });

    workspace.widgets = reorderedWidgets;
    this.workspaces.set(workspaceId, workspace);
    this.saveWorkspaces();

    return { success: true, workspace };
  }

  /**
   * Update workspace
   * @param {string} workspaceId - Workspace ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated workspace or null
   */
  updateWorkspace(workspaceId, updates) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return null;

    const updated = {
      ...workspace,
      ...updates,
      updatedAt: now()
    };

    this.workspaces.set(workspaceId, updated);
    this.saveWorkspaces();

    return updated;
  }

  /**
   * Delete workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteWorkspace(workspaceId) {
    const deleted = this.workspaces.delete(workspaceId);
    if (deleted) {
      this.saveWorkspaces();
    }
    return deleted;
  }

  /**
   * Set as default workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Object} Result
   */
  setAsDefault(workspaceId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return { success: false, reason: 'Workspace not found' };
    }

    // Unset other default workspaces for this user
    for (const [id, ws] of this.workspaces) {
      if (ws.userId === workspace.userId && ws.isDefault) {
        ws.isDefault = false;
        this.workspaces.set(id, ws);
      }
    }

    workspace.isDefault = true;
    this.workspaces.set(workspaceId, workspace);
    this.saveWorkspaces();

    return { success: true, workspace };
  }

  /**
   * Get widget data
   * @param {string} widgetType - Widget type
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getWidgetData(widgetType, config = {}) {
    switch (widgetType) {
      case WIDGET_TYPES.TERMINAL_STATUS:
        return this.getTerminalStatusData(config);
      case WIDGET_TYPES.CASHIERS:
        return this.getCashiersData(config);
      case WIDGET_TYPES.KITCHEN:
        return this.getKitchenData(config);
      case WIDGET_TYPES.TABLES:
        return this.getTablesData(config);
      case WIDGET_TYPES.ORDERS:
        return this.getOrdersData(config);
      case WIDGET_TYPES.PAYMENTS:
        return this.getPaymentsData(config);
      case WIDGET_TYPES.INCIDENTS:
        return this.getIncidentsData(config);
      case WIDGET_TYPES.APPROVALS:
        return this.getApprovalsData(config);
      case WIDGET_TYPES.NOTIFICATIONS:
        return this.getNotificationsData(config);
      case WIDGET_TYPES.SHIFTS:
        return this.getShiftsData(config);
      case WIDGET_TYPES.QUEUES:
        return this.getQueuesData(config);
      case WIDGET_TYPES.REVENUE:
        return this.getRevenueData(config);
      case WIDGET_TYPES.PERFORMANCE:
        return this.getPerformanceData(config);
      default:
        return { data: null, error: 'Unknown widget type' };
    }
  }

  /**
   * Get terminal status data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getTerminalStatusData(config) {
    const terminalManager = getTerminalManager();
    const terminals = terminalManager.getAllTerminals();

    if (config.branchId) {
      terminals.filter(t => t.branchId === config.branchId);
    }

    return {
      total: terminals.length,
      online: terminals.filter(t => t.status === 'ONLINE').length,
      offline: terminals.filter(t => t.status === 'OFFLINE').length,
      busy: terminals.filter(t => t.status === 'BUSY').length,
      healthy: terminals.filter(t => t.healthStatus === 'HEALTHY').length,
      warning: terminals.filter(t => t.healthStatus === 'WARNING').length,
      critical: terminals.filter(t => t.healthStatus === 'CRITICAL').length,
      terminals: terminals.slice(0, config.limit || 10)
    };
  }

  /**
   * Get cashiers data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getCashiersData(config) {
    const terminalManager = getTerminalManager();
    const sessions = terminalManager.getActiveSessions();

    return {
      active: sessions.length,
      busyCashiers: sessions.filter(s => s.cashDrawerOpen).length,
      sessions: sessions.slice(0, config.limit || 10)
    };
  }

  /**
   * Get kitchen data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getKitchenData(config) {
    const queueManager = getQueueManager();
    const kitchenQueue = queueManager.getQueue('KITCHEN', config.branchId);

    if (!kitchenQueue) {
      return { total: 0, pending: 0, inProgress: 0, ready: 0, items: [] };
    }

    return {
      total: kitchenQueue.items.length,
      pending: kitchenQueue.items.filter(i => i.status === 'PENDING').length,
      inProgress: kitchenQueue.items.filter(i => i.status === 'IN_PROGRESS').length,
      ready: kitchenQueue.items.filter(i => i.status === 'READY').length,
      items: kitchenQueue.items.slice(0, config.limit || 10)
    };
  }

  /**
   * Get tables data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getTablesData(config) {
    // Placeholder - would integrate with actual table management
    return {
      total: 0,
      occupied: 0,
      available: 0,
      tables: []
    };
  }

  /**
   * Get orders data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getOrdersData(config) {
    // Placeholder - would integrate with actual order management
    return {
      total: 0,
      active: 0,
      completed: 0,
      orders: []
    };
  }

  /**
   * Get payments data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getPaymentsData(config) {
    // Placeholder - would integrate with actual payment management
    return {
      total: 0,
      completed: 0,
      pending: 0,
      totalAmount: 0
    };
  }

  /**
   * Get incidents data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getIncidentsData(config) {
    const incidentDashboard = getIncidentDashboard();
    const incidents = incidentDashboard.getActiveIncidents();

    if (config.branchId) {
      incidents.filter(i => i.branchId === config.branchId);
    }

    return {
      total: incidents.length,
      open: incidents.filter(i => i.status === 'OPEN').length,
      inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
      critical: incidents.filter(i => i.priority === 'CRITICAL' || i.priority === 'EMERGENCY').length,
      incidents: incidents.slice(0, config.limit || 10)
    };
  }

  /**
   * Get approvals data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getApprovalsData(config) {
    // Placeholder - would integrate with actual approval management
    return {
      total: 0,
      pending: 0,
      approvals: []
    };
  }

  /**
   * Get notifications data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getNotificationsData(config) {
    const notifications = getEnterpriseNotifications();
    const unread = notifications.getUnreadNotifications(config.userId);

    return {
      unread: unread.length,
      total: notifications.getAllNotifications().length,
      notifications: unread.slice(0, config.limit || 10)
    };
  }

  /**
   * Get shifts data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getShiftsData(config) {
    // Placeholder - would integrate with actual shift management
    return {
      active: 0,
      total: 0,
      shifts: []
    };
  }

  /**
   * Get queues data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getQueuesData(config) {
    const queueManager = getQueueManager();
    const stats = queueManager.getAllQueueStatistics(config.branchId);

    return stats;
  }

  /**
   * Get revenue data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getRevenueData(config) {
    // Placeholder - would integrate with actual revenue tracking
    return {
      today: 0,
      week: 0,
      month: 0
    };
  }

  /**
   * Get performance data
   * @param {Object} config - Widget configuration
   * @returns {Object} Widget data
   */
  getPerformanceData(config) {
    const operationalMonitor = getOperationalMonitor();
    const status = operationalMonitor.getLiveOperationalStatus();

    return {
      activeTerminals: status.activeTerminals,
      activeSessions: status.activeSessions,
      totalOrders: 0,
      avgOrderTime: 0
    };
  }

  /**
   * Create default workspace
   * @param {string} userId - User ID
   * @param {string} branchId - Branch ID
   * @returns {Object} Created workspace
   */
  createDefaultWorkspace(userId, branchId = null) {
    const workspace = this.createWorkspace({
      name: 'Default Operations Workspace',
      description: 'Default manager workspace',
      userId,
      branchId,
      layout: 'GRID',
      columns: 3,
      isDefault: true
    });

    // Add default widgets
    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.TERMINAL_STATUS,
      title: 'Terminal Status',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 0, y: 0 }
    });

    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.CASHIERS,
      title: 'Active Cashiers',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 1, y: 0 }
    });

    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.KITCHEN,
      title: 'Kitchen Queue',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 2, y: 0 }
    });

    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.INCIDENTS,
      title: 'Active Incidents',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 0, y: 1 }
    });

    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.NOTIFICATIONS,
      title: 'Notifications',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 1, y: 1 }
    });

    this.addWidget(workspace.id, {
      type: WIDGET_TYPES.QUEUES,
      title: 'Queue Status',
      size: WIDGET_SIZE.MEDIUM,
      position: { x: 2, y: 1 }
    });

    return this.getWorkspace(workspace.id);
  }

  /**
   * Get workspace with widget data
   * @param {string} workspaceId - Workspace ID
   * @returns {Object|null} Workspace with widget data or null
   */
  getWorkspaceWithData(workspaceId) {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace) return null;

    const widgetsWithData = workspace.widgets.map(widget => ({
      ...widget,
      data: this.getWidgetData(widget.type, widget.config)
    }));

    return {
      ...workspace,
      widgets: widgetsWithData
    };
  }

  /**
   * Export workspaces
   * @param {Object} options - Export options
   * @returns {Object} Exported workspaces
   */
  exportWorkspaces(options = {}) {
    const { userId, branchId } = options;
    
    let workspaces = this.getAllWorkspaces();
    
    if (userId) {
      workspaces = workspaces.filter(w => w.userId === userId);
    }
    if (branchId) {
      workspaces = workspaces.filter(w => w.branchId === branchId);
    }

    return {
      workspaces,
      exportedAt: now(),
      totalWorkspaces: workspaces.length
    };
  }

  /**
   * Import workspaces
   * @param {Object} data - Imported workspaces data
   * @returns {Object} Import result
   */
  importWorkspaces(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.workspaces)) {
        data.workspaces.forEach(workspace => {
          this.workspaces.set(workspace.id, workspace);
        });
      }

      this.saveWorkspaces();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let operationsWorkspaceInstance = null;

/**
 * Get the operations workspace singleton
 * @returns {OperationsWorkspace} Operations workspace instance
 */
export function getOperationsWorkspace() {
  if (!operationsWorkspaceInstance) {
    operationsWorkspaceInstance = new OperationsWorkspace();
  }
  return operationsWorkspaceInstance;
}

/**
 * Reset the operations workspace (useful for testing)
 */
export function resetOperationsWorkspace() {
  operationsWorkspaceInstance = null;
}

/**
 * Convenience function to create a workspace
 * @param {Object} workspaceData - Workspace data
 * @returns {Object} Created workspace
 */
export function createWorkspace(workspaceData = {}) {
  const workspace = getOperationsWorkspace();
  return workspace.createWorkspace(workspaceData);
}

/**
 * Convenience function to get workspace with data
 * @param {string} workspaceId - Workspace ID
 * @returns {Object|null} Workspace with widget data or null
 */
export function getWorkspaceWithData(workspaceId) {
  const workspace = getOperationsWorkspace();
  return workspace.getWorkspaceWithData(workspaceId);
}
