// Action Library
// Send Notification, Update Dashboard, Create Document, Generate Report, Reserve Inventory, Assign Waiter, Move Table, Start Workflow, Open Incident, Create Audit, Export Data, Email, SMS (future), Webhook, Plugin

import { now } from '../domain/dates.js';

/**
 * Action Types
 */
export const ACTION_TYPES = {
  NOTIFICATION: 'NOTIFICATION',
  DASHBOARD: 'DASHBOARD',
  DOCUMENT: 'DOCUMENT',
  REPORT: 'REPORT',
  INVENTORY: 'INVENTORY',
  STAFF: 'STAFF',
  TABLE: 'TABLE',
  WORKFLOW: 'WORKFLOW',
  INCIDENT: 'INCIDENT',
  AUDIT: 'AUDIT',
  EXPORT: 'EXPORT',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WEBHOOK: 'WEBHOOK',
  PLUGIN: 'PLUGIN',
  CUSTOM: 'CUSTOM'
};

/**
 * Action Subtypes by Type
 */
export const ACTION_SUBTYPES = {
  NOTIFICATION: [
    'SEND_NOTIFICATION',
    'SEND_BROADCAST',
    'SEND_ALERT',
    'SEND_REMINDER'
  ],
  DASHBOARD: [
    'UPDATE_DASHBOARD',
    'UPDATE_WIDGET',
    'ADD_WIDGET',
    'REMOVE_WIDGET'
  ],
  DOCUMENT: [
    'CREATE_DOCUMENT',
    'UPDATE_DOCUMENT',
    'DELETE_DOCUMENT',
    'GENERATE_PDF',
    'GENERATE_RECEIPT',
    'GENERATE_INVOICE'
  ],
  REPORT: [
    'GENERATE_REPORT',
    'SCHEDULE_REPORT',
    'DELIVER_REPORT',
    'EXPORT_REPORT'
  ],
  INVENTORY: [
    'RESERVE_INVENTORY',
    'RELEASE_INVENTORY',
    'ADJUST_INVENTORY',
    'RESTOCK_INVENTORY',
    'CHECK_INVENTORY'
  ],
  STAFF: [
    'ASSIGN_WAITER',
    'ASSIGN_STAFF',
    'UNASSIGN_STAFF',
    'NOTIFY_STAFF',
    'UPDATE_STAFF_STATUS'
  ],
  TABLE: [
    'MOVE_TABLE',
    'ASSIGN_TABLE',
    'RELEASE_TABLE',
    'MERGE_TABLE',
    'SPLIT_TABLE',
    'UPDATE_TABLE_STATUS'
  ],
  WORKFLOW: [
    'START_WORKFLOW',
    'RESUME_WORKFLOW',
    'PAUSE_WORKFLOW',
    'CANCEL_WORKFLOW',
    'COMPLETE_WORKFLOW',
    'APPROVE_WORKFLOW',
    'REJECT_WORKFLOW'
  ],
  INCIDENT: [
    'OPEN_INCIDENT',
    'ASSIGN_INCIDENT',
    'UPDATE_INCIDENT',
    'RESOLVE_INCIDENT',
    'ESCALATE_INCIDENT',
    'CLOSE_INCIDENT'
  ],
  AUDIT: [
    'CREATE_AUDIT',
    'LOG_EVENT',
    'LOG_ACTION',
    'LOG_ERROR'
  ],
  EXPORT: [
    'EXPORT_DATA',
    'EXPORT_CSV',
    'EXPORT_JSON',
    'EXPORT_PDF',
    'EXPORT_EXCEL'
  ],
  EMAIL: [
    'SEND_EMAIL',
    'SEND_EMAIL_TEMPLATE',
    'QUEUE_EMAIL'
  ],
  SMS: [
    'SEND_SMS',
    'SEND_SMS_TEMPLATE',
    'QUEUE_SMS'
  ],
  WEBHOOK: [
    'CALL_WEBHOOK',
    'CALL_API',
    'SYNC_DATA'
  ],
  PLUGIN: [
    'EXECUTE_PLUGIN',
    'CALL_PLUGIN_ACTION',
    'TRIGGER_PLUGIN_EVENT'
  ],
  CUSTOM: [
    'CUSTOM_ACTION'
  ]
};

/**
 * Action Library class
 * Registry of all available actions
 */
export class ActionLibrary {
  constructor() {
    this.actions = new Map();
    this.actionHandlers = new Map();
    this.registerDefaultActions();
  }

  /**
   * Register default actions
   */
  registerDefaultActions() {
    // Notification actions
    ACTION_SUBTYPES.NOTIFICATION.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.NOTIFICATION,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'NOTIFICATION',
        parameters: ['recipient', 'message', 'priority'],
        async: false
      });
    });

    // Dashboard actions
    ACTION_SUBTYPES.DASHBOARD.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.DASHBOARD,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'DASHBOARD',
        parameters: ['widgetId', 'data'],
        async: false
      });
    });

    // Document actions
    ACTION_SUBTYPES.DOCUMENT.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.DOCUMENT,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'DOCUMENTS',
        parameters: ['documentId', 'type', 'data'],
        async: true
      });
    });

    // Report actions
    ACTION_SUBTYPES.REPORT.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.REPORT,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'REPORTS',
        parameters: ['reportId', 'type', 'parameters'],
        async: true
      });
    });

    // Inventory actions
    ACTION_SUBTYPES.INVENTORY.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.INVENTORY,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'INVENTORY',
        parameters: ['itemId', 'quantity', 'branchId'],
        async: false
      });
    });

    // Staff actions
    ACTION_SUBTYPES.STAFF.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.STAFF,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'STAFF',
        parameters: ['staffId', 'assignment', 'branchId'],
        async: false
      });
    });

    // Table actions
    ACTION_SUBTYPES.TABLE.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.TABLE,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'TABLES',
        parameters: ['tableId', 'orderId', 'targetTableId'],
        async: false
      });
    });

    // Workflow actions
    ACTION_SUBTYPES.WORKFLOW.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.WORKFLOW,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'WORKFLOW',
        parameters: ['workflowId', 'stepId', 'status'],
        async: false
      });
    });

    // Incident actions
    ACTION_SUBTYPES.INCIDENT.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.INCIDENT,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'INCIDENTS',
        parameters: ['incidentId', 'assigneeId', 'status'],
        async: false
      });
    });

    // Audit actions
    ACTION_SUBTYPES.AUDIT.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.AUDIT,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'AUDIT',
        parameters: ['eventType', 'data', 'actor'],
        async: false
      });
    });

    // Export actions
    ACTION_SUBTYPES.EXPORT.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.EXPORT,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'EXPORT',
        parameters: ['data', 'format', 'destination'],
        async: true
      });
    });

    // Email actions
    ACTION_SUBTYPES.EMAIL.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.EMAIL,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'COMMUNICATION',
        parameters: ['recipient', 'subject', 'body', 'templateId'],
        async: true
      });
    });

    // SMS actions (future)
    ACTION_SUBTYPES.SMS.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.SMS,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'COMMUNICATION',
        parameters: ['recipient', 'message', 'templateId'],
        async: true,
        future: true
      });
    });

    // Webhook actions
    ACTION_SUBTYPES.WEBHOOK.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.WEBHOOK,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'INTEGRATION',
        parameters: ['url', 'method', 'headers', 'body'],
        async: true
      });
    });

    // Plugin actions
    ACTION_SUBTYPES.PLUGIN.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.PLUGIN,
        subtype,
        name: this.formatActionName(subtype),
        description: `${subtype.replace(/_/g, ' ').toLowerCase()}`,
        category: 'PLUGINS',
        parameters: ['pluginId', 'action', 'parameters'],
        async: true
      });
    });

    // Custom action
    ACTION_SUBTYPES.CUSTOM.forEach(subtype => {
      this.registerAction({
        type: ACTION_TYPES.CUSTOM,
        subtype,
        name: this.formatActionName(subtype),
        description: 'Custom action',
        category: 'CUSTOM',
        parameters: ['actionId', 'parameters'],
        async: false
      });
    });
  }

  /**
   * Format action name
   * @param {string} subtype - Action subtype
   * @returns {string} Formatted name
   */
  formatActionName(subtype) {
    return subtype
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Register an action
   * @param {Object} actionData - Action data
   * @returns {Object} Registered action
   */
  registerAction(actionData) {
    const action = {
      id: `${actionData.type}_${actionData.subtype}`,
      type: actionData.type,
      subtype: actionData.subtype,
      name: actionData.name || this.formatActionName(actionData.subtype),
      description: actionData.description || '',
      category: actionData.category || 'CUSTOM',
      parameters: actionData.parameters || [],
      async: actionData.async || false,
      future: actionData.future || false,
      metadata: actionData.metadata || {},
      isCustom: actionData.isCustom || false,
      registeredAt: now(),
      registeredBy: actionData.registeredBy || null
    };

    this.actions.set(action.id, action);
    return action;
  }

  /**
   * Register an action handler
   * @param {string} actionId - Action ID
   * @param {Function} handler - Handler function
   * @returns {boolean} Whether registration was successful
   */
  registerActionHandler(actionId, handler) {
    const action = this.actions.get(actionId);
    if (!action) return false;

    this.actionHandlers.set(actionId, handler);
    return true;
  }

  /**
   * Unregister an action
   * @param {string} actionId - Action ID
   * @returns {boolean} Whether unregistration was successful
   */
  unregisterAction(actionId) {
    const action = this.actions.get(actionId);
    if (!action || !action.isCustom) {
      return false; // Cannot unregister default actions
    }

    this.actionHandlers.delete(actionId);
    return this.actions.delete(actionId);
  }

  /**
   * Get action by ID
   * @param {string} actionId - Action ID
   * @returns {Object|null} Action or null
   */
  getAction(actionId) {
    return this.actions.get(actionId) || null;
  }

  /**
   * Get all actions
   * @returns {Array} Array of actions
   */
  getAllActions() {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by type
   * @param {string} type - Action type
   * @returns {Array} Array of actions
   */
  getActionsByType(type) {
    return this.getAllActions().filter(a => a.type === type);
  }

  /**
   * Get actions by category
   * @param {string} category - Action category
   * @returns {Array} Array of actions
   */
  getActionsByCategory(category) {
    return this.getAllActions().filter(a => a.category === category);
  }

  /**
   * Get custom actions
   * @returns {Array} Array of custom actions
   */
  getCustomActions() {
    return this.getAllActions().filter(a => a.isCustom);
  }

  /**
   * Get default actions
   * @returns {Array} Array of default actions
   */
  getDefaultActions() {
    return this.getAllActions().filter(a => !a.isCustom);
  }

  /**
   * Get available actions (not future)
   * @returns {Array} Array of available actions
   */
  getAvailableActions() {
    return this.getAllActions().filter(a => !a.future);
  }

  /**
   * Search actions
   * @param {string} query - Search query
   * @returns {Array} Array of matching actions
   */
  searchActions(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllActions().filter(a => 
      a.name.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.type.toLowerCase().includes(lowerQuery) ||
      a.subtype.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Execute an action
   * @param {string} actionId - Action ID
   * @param {Object} parameters - Action parameters
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeAction(actionId, parameters = {}, context = {}) {
    const action = this.actions.get(actionId);
    if (!action) {
      return { success: false, reason: 'Action not found' };
    }

    const handler = this.actionHandlers.get(actionId);
    if (!handler) {
      // Return placeholder result if no handler registered
      return { 
        success: true, 
        action, 
        parameters, 
        context,
        message: 'Action executed (no handler registered)' 
      };
    }

    try {
      const result = await handler(parameters, context);
      return { success: true, action, result };
    } catch (error) {
      return { success: false, action, error: error.message };
    }
  }

  /**
   * Validate action data
   * @param {Object} actionData - Action data to validate
   * @returns {Object} Validation result
   */
  validateActionData(actionData) {
    const action = this.actions.get(`${actionData.type}_${actionData.subtype}`);
    
    if (!action) {
      return { valid: false, reason: 'Action not found' };
    }

    if (action.future) {
      return { valid: false, reason: 'Action is not yet available' };
    }

    // Check required parameters
    const missingParams = action.parameters.filter(param => 
      !(param in actionData.parameters)
    );

    if (missingParams.length > 0) {
      return { 
        valid: false, 
        reason: `Missing required parameters: ${missingParams.join(', ')}` 
      };
    }

    return { valid: true, action };
  }

  /**
   * Chain multiple actions
   * @param {Array} actions - Array of actions to execute
   * @param {Object} context - Execution context
   * @returns {Promise<Array>} Array of execution results
   */
  async chainActions(actions, context = {}) {
    const results = [];

    for (const actionConfig of actions) {
      const result = await this.executeAction(
        `${actionConfig.type}_${actionConfig.subtype}`,
        actionConfig.parameters,
        context
      );
      results.push(result);

      // Stop chain if action fails
      if (!result.success && actionConfig.stopOnFailure !== false) {
        break;
      }
    }

    return results;
  }

  /**
   * Get action statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const actions = this.getAllActions();

    return {
      total: actions.length,
      custom: actions.filter(a => a.isCustom).length,
      default: actions.filter(a => !a.isCustom).length,
      future: actions.filter(a => a.future).length,
      available: actions.filter(a => !a.future).length,
      async: actions.filter(a => a.async).length,
      byType: actions.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
      byCategory: actions.reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1;
        return acc;
      }, {}),
      withHandlers: this.actionHandlers.size
    };
  }
}

// Singleton instance
let actionLibraryInstance = null;

/**
 * Get the action library singleton
 * @returns {ActionLibrary} Action library instance
 */
export function getActionLibrary() {
  if (!actionLibraryInstance) {
    actionLibraryInstance = new ActionLibrary();
  }
  return actionLibraryInstance;
}

/**
 * Reset the action library (useful for testing)
 */
export function resetActionLibrary() {
  actionLibraryInstance = null;
}

/**
 * Convenience function to get action
 * @param {string} type - Action type
 * @param {string} subtype - Action subtype
 * @returns {Object|null} Action or null
 */
export function getAction(type, subtype) {
  const library = getActionLibrary();
  return library.getAction(`${type}_${subtype}`);
}

/**
 * Convenience function to register custom action
 * @param {Object} actionData - Action data
 * @returns {Object} Registered action
 */
export function registerCustomAction(actionData) {
  const library = getActionLibrary();
  return library.registerAction({ ...actionData, isCustom: true });
}

/**
 * Convenience function to register action handler
 * @param {string} actionId - Action ID
 * @param {Function} handler - Handler function
 * @returns {boolean} Whether registration was successful
 */
export function registerActionHandler(actionId, handler) {
  const library = getActionLibrary();
  return library.registerActionHandler(actionId, handler);
}

/**
 * Convenience function to execute action
 * @param {string} actionId - Action ID
 * @param {Object} parameters - Action parameters
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Execution result
 */
export function executeAction(actionId, parameters = {}, context = {}) {
  const library = getActionLibrary();
  return library.executeAction(actionId, parameters, context);
}
