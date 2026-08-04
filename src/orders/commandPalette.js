// Command Palette
// CTRL+K allows operators to quickly create order, open held bill, search customer, move table, start workflow, issue refund, open reports, navigate anywhere

import { now } from '../domain/dates.js';
import { getEnterpriseSearch } from './enterpriseSearch.js';

const COMMANDS_KEY = 'cafeos_command_palette_commands';
const COMMAND_HISTORY_KEY = 'cafeos_command_palette_history';

/**
 * Command Categories
 */
export const COMMAND_CATEGORIES = {
  ORDER: 'ORDER',
  CUSTOMER: 'CUSTOMER',
  TABLE: 'TABLE',
  PAYMENT: 'PAYMENT',
  WORKFLOW: 'WORKFLOW',
  REPORT: 'REPORT',
  NAVIGATION: 'NAVIGATION',
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM'
};

/**
 * Command Palette class
 * CTRL+K allows operators to quickly create order, open held bill, search customer, move table, start workflow, issue refund, open reports, navigate anywhere
 */
export class CommandPalette {
  constructor() {
    this.commands = new Map();
    this.history = [];
    this.loadCommands();
    this.loadHistory();
    this.registerDefaultCommands();
  }

  /**
   * Load commands from localStorage
   */
  loadCommands() {
    try {
      const stored = localStorage.getItem(COMMANDS_KEY);
      if (stored) {
        const commands = JSON.parse(stored);
        commands.forEach(command => {
          this.commands.set(command.id, command);
        });
      }
    } catch (error) {
      console.error('[CommandPalette] Failed to load commands:', error);
    }
  }

  /**
   * Save commands to localStorage
   */
  saveCommands() {
    try {
      const commands = Array.from(this.commands.values());
      localStorage.setItem(COMMANDS_KEY, JSON.stringify(commands));
    } catch (error) {
      console.error('[CommandPalette] Failed to save commands:', error);
    }
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(COMMAND_HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[CommandPalette] Failed to load history:', error);
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('[CommandPalette] Failed to save history:', error);
    }
  }

  /**
   * Register default commands
   */
  registerDefaultCommands() {
    const defaultCommands = [
      {
        id: 'cmd_create_order',
        title: 'Create Order',
        description: 'Create a new order',
        category: COMMAND_CATEGORIES.ORDER,
        keywords: ['create', 'order', 'new'],
        action: 'CREATE_ORDER',
        icon: 'plus',
        permissions: ['ORDER_CREATE']
      },
      {
        id: 'cmd_open_held_bill',
        title: 'Open Held Bill',
        description: 'Open a held bill',
        category: COMMAND_CATEGORIES.ORDER,
        keywords: ['held', 'bill', 'open', 'resume'],
        action: 'OPEN_HELD_BILL',
        icon: 'file',
        permissions: ['ORDER_VIEW']
      },
      {
        id: 'cmd_search_customer',
        title: 'Search Customer',
        description: 'Search for a customer',
        category: COMMAND_CATEGORIES.CUSTOMER,
        keywords: ['search', 'customer', 'find'],
        action: 'SEARCH_CUSTOMER',
        icon: 'search',
        permissions: ['CUSTOMER_VIEW']
      },
      {
        id: 'cmd_move_table',
        title: 'Move Table',
        description: 'Move order to another table',
        category: COMMAND_CATEGORIES.TABLE,
        keywords: ['move', 'table', 'transfer'],
        action: 'MOVE_TABLE',
        icon: 'arrow-right',
        permissions: ['TABLE_MOVE']
      },
      {
        id: 'cmd_start_workflow',
        title: 'Start Workflow',
        description: 'Start a workflow',
        category: COMMAND_CATEGORIES.WORKFLOW,
        keywords: ['start', 'workflow', 'process'],
        action: 'START_WORKFLOW',
        icon: 'play',
        permissions: ['WORKFLOW_EXECUTE']
      },
      {
        id: 'cmd_issue_refund',
        title: 'Issue Refund',
        description: 'Issue a refund',
        category: COMMAND_CATEGORIES.PAYMENT,
        keywords: ['refund', 'return', 'money'],
        action: 'ISSUE_REFUND',
        icon: 'undo',
        permissions: ['PAYMENT_REFUND']
      },
      {
        id: 'cmd_open_reports',
        title: 'Open Reports',
        description: 'Open reports dashboard',
        category: COMMAND_CATEGORIES.REPORT,
        keywords: ['report', 'analytics', 'stats'],
        action: 'OPEN_REPORTS',
        icon: 'chart',
        permissions: ['REPORT_VIEW']
      },
      {
        id: 'cmd_navigate_dashboard',
        title: 'Go to Dashboard',
        description: 'Navigate to dashboard',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['dashboard', 'home', 'main'],
        action: 'NAVIGATE_DASHBOARD',
        icon: 'home',
        permissions: []
      },
      {
        id: 'cmd_navigate_kitchen',
        title: 'Go to Kitchen Display',
        description: 'Navigate to kitchen display',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['kitchen', 'kds', 'cooking'],
        action: 'NAVIGATE_KITCHEN',
        icon: 'chef-hat',
        permissions: ['KITCHEN_VIEW']
      },
      {
        id: 'cmd_navigate_tables',
        title: 'Go to Tables',
        description: 'Navigate to tables view',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['tables', 'floor', 'seating'],
        action: 'NAVIGATE_TABLES',
        icon: 'grid',
        permissions: ['TABLE_VIEW']
      },
      {
        id: 'cmd_navigate_terminal',
        title: 'Go to Terminal Manager',
        description: 'Navigate to terminal manager',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['terminal', 'pos', 'device'],
        action: 'NAVIGATE_TERMINAL',
        icon: 'monitor',
        permissions: ['TERMINAL_VIEW']
      },
      {
        id: 'cmd_navigate_incidents',
        title: 'Go to Incidents',
        description: 'Navigate to incident dashboard',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['incident', 'issue', 'problem'],
        action: 'NAVIGATE_INCIDENTS',
        icon: 'alert-triangle',
        permissions: ['INCIDENT_VIEW']
      },
      {
        id: 'cmd_navigate_shifts',
        title: 'Go to Shifts',
        description: 'Navigate to shift operations',
        category: COMMAND_CATEGORIES.NAVIGATION,
        keywords: ['shift', 'staff', 'schedule'],
        action: 'NAVIGATE_SHIFTS',
        icon: 'clock',
        permissions: ['SHIFT_VIEW']
      },
      {
        id: 'cmd_open_settings',
        title: 'Open Settings',
        description: 'Open settings',
        category: COMMAND_CATEGORIES.SYSTEM,
        keywords: ['settings', 'config', 'preferences'],
        action: 'OPEN_SETTINGS',
        icon: 'settings',
        permissions: ['SETTINGS_VIEW']
      },
      {
        id: 'cmd_logout',
        title: 'Logout',
        description: 'Logout from the system',
        category: COMMAND_CATEGORIES.SYSTEM,
        keywords: ['logout', 'sign out', 'exit'],
        action: 'LOGOUT',
        icon: 'log-out',
        permissions: []
      }
    ];

    defaultCommands.forEach(cmd => {
      if (!this.commands.has(cmd.id)) {
        this.commands.set(cmd.id, cmd);
      }
    });

    this.saveCommands();
  }

  /**
   * Register a custom command
   * @param {Object} commandData - Command data
   * @returns {Object} Registered command
   */
  registerCommand(commandData) {
    const command = {
      id: commandData.id || `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: commandData.title || 'Untitled Command',
      description: commandData.description || '',
      category: commandData.category || COMMAND_CATEGORIES.CUSTOM,
      keywords: commandData.keywords || [],
      action: commandData.action || commandData.id,
      icon: commandData.icon || 'command',
      permissions: commandData.permissions || [],
      handler: commandData.handler || null,
      metadata: commandData.metadata || {},
      createdAt: now(),
      createdBy: commandData.createdBy || null
    };

    this.commands.set(command.id, command);
    this.saveCommands();

    return command;
  }

  /**
   * Unregister a command
   * @param {string} commandId - Command ID
   * @returns {boolean} Whether unregistration was successful
   */
  unregisterCommand(commandId) {
    const deleted = this.commands.delete(commandId);
    if (deleted) {
      this.saveCommands();
    }
    return deleted;
  }

  /**
   * Get command by ID
   * @param {string} commandId - Command ID
   * @returns {Object|null} Command or null
   */
  getCommand(commandId) {
    return this.commands.get(commandId) || null;
  }

  /**
   * Get all commands
   * @returns {Array} Array of commands
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   * @param {string} category - Command category
   * @returns {Array} Array of commands
   */
  getCommandsByCategory(category) {
    return this.getAllCommands().filter(c => c.category === category);
  }

  /**
   * Search commands
   * @param {string} query - Search query
   * @param {Object} filters - Filters
   * @returns {Array} Array of matching commands
   */
  searchCommands(query, filters = {}) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    let results = this.getAllCommands();

    // Apply text search
    if (query) {
      results = results.filter(command => {
        const searchText = `${command.title} ${command.description} ${command.keywords.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(c => c.category === filters.category);
    }

    // Sort by relevance
    if (query) {
      results.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, searchTerms);
        const bScore = this.calculateRelevanceScore(b, searchTerms);
        return bScore - aScore;
      });
    }

    // Apply limit
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Calculate relevance score for command
   * @param {Object} command - Command object
   * @param {Array} searchTerms - Search terms
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(command, searchTerms) {
    const searchText = `${command.title} ${command.description} ${command.keywords.join(' ')}`.toLowerCase();
    let score = 0;

    searchTerms.forEach(term => {
      if (command.title.toLowerCase().startsWith(term)) score += 10;
      if (command.title.toLowerCase().includes(term)) score += 5;
      if (command.keywords.some(k => k.toLowerCase().startsWith(term))) score += 3;
      if (command.keywords.some(k => k.toLowerCase().includes(term))) score += 2;
      if (command.description.toLowerCase().includes(term)) score += 1;
    });

    return score;
  }

  /**
   * Execute command
   * @param {string} commandId - Command ID
   * @param {Object} context - Execution context
   * @param {Array} userPermissions - User permissions
   * @returns {Object} Execution result
   */
  executeCommand(commandId, context = {}, userPermissions = []) {
    const command = this.commands.get(commandId);
    if (!command) {
      return { success: false, reason: 'Command not found' };
    }

    // Check permissions
    if (command.permissions.length > 0) {
      const hasPermission = command.permissions.some(perm => userPermissions.includes(perm));
      if (!hasPermission) {
        return { success: false, reason: 'Permission denied' };
      }
    }

    // Add to history
    this.addToHistory(commandId, context);

    // Execute handler if provided
    if (command.handler && typeof command.handler === 'function') {
      try {
        const result = command.handler(context);
        return { success: true, result, command };
      } catch (error) {
        return { success: false, reason: error.message, command };
      }
    }

    // Return command action for external handling
    return { success: true, action: command.action, command, context };
  }

  /**
   * Add command to history
   * @param {string} commandId - Command ID
   * @param {Object} context - Execution context
   */
  addToHistory(commandId, context) {
    const historyItem = {
      commandId,
      context,
      executedAt: now()
    };

    this.history.unshift(historyItem);

    // Keep only last 100 items
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    this.saveHistory();
  }

  /**
   * Get command history
   * @param {number} limit - Number of items to return
   * @returns {Array} Array of history items
   */
  getHistory(limit = 20) {
    return this.history.slice(0, limit);
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Get frequently used commands
   * @param {number} limit - Number of commands to return
   * @returns {Array} Array of commands
   */
  getFrequentlyUsedCommands(limit = 10) {
    const frequency = new Map();

    this.history.forEach(item => {
      const count = frequency.get(item.commandId) || 0;
      frequency.set(item.commandId, count + 1);
    });

    const sortedCommands = Array.from(this.commands.values())
      .filter(cmd => frequency.has(cmd.id))
      .sort((a, b) => frequency.get(b.id) - frequency.get(a.id))
      .slice(0, limit);

    return sortedCommands;
  }

  /**
   * Update command
   * @param {string} commandId - Command ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated command or null
   */
  updateCommand(commandId, updates) {
    const command = this.commands.get(commandId);
    if (!command) return null;

    const updated = {
      ...command,
      ...updates,
      updatedAt: now()
    };

    this.commands.set(commandId, updated);
    this.saveCommands();

    return updated;
  }

  /**
   * Get commands for user
   * @param {Array} userPermissions - User permissions
   * @returns {Array} Array of commands
   */
  getCommandsForUser(userPermissions = []) {
    return this.getAllCommands().filter(command => {
      if (command.permissions.length === 0) return true;
      return command.permissions.some(perm => userPermissions.includes(perm));
    });
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const commands = this.getAllCommands();

    return {
      totalCommands: commands.length,
      byCategory: commands.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {}),
      historySize: this.history.length,
      uniqueCommandsExecuted: new Set(this.history.map(h => h.commandId)).size
    };
  }

  /**
   * Export commands
   * @returns {Object} Exported commands
   */
  exportCommands() {
    return {
      commands: Array.from(this.commands.values()),
      history: this.history,
      exportedAt: now()
    };
  }

  /**
   * Import commands
   * @param {Object} data - Imported commands data
   * @returns {Object} Import result
   */
  importCommands(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.commands)) {
        data.commands.forEach(command => {
          this.commands.set(command.id, command);
        });
      }

      if (Array.isArray(data.history)) {
        this.history = data.history;
      }

      this.saveCommands();
      this.saveHistory();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let commandPaletteInstance = null;

/**
 * Get the command palette singleton
 * @returns {CommandPalette} Command palette instance
 */
export function getCommandPalette() {
  if (!commandPaletteInstance) {
    commandPaletteInstance = new CommandPalette();
  }
  return commandPaletteInstance;
}

/**
 * Reset the command palette (useful for testing)
 */
export function resetCommandPalette() {
  commandPaletteInstance = null;
}

/**
 * Convenience function to search commands
 * @param {string} query - Search query
 * @param {Object} filters - Filters
 * @returns {Array} Array of matching commands
 */
export function searchCommands(query, filters = {}) {
  const palette = getCommandPalette();
  return palette.searchCommands(query, filters);
}

/**
 * Convenience function to execute command
 * @param {string} commandId - Command ID
 * @param {Object} context - Execution context
 * @param {Array} userPermissions - User permissions
 * @returns {Object} Execution result
 */
export function executeCommand(commandId, context = {}, userPermissions = []) {
  const palette = getCommandPalette();
  return palette.executeCommand(commandId, context, userPermissions);
}
