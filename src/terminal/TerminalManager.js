// Terminal Manager
// Manages POS terminal configuration, identification, and settings

import { getEncryptionEngine } from '../security/EncryptionEngine.js';

export class TerminalManager {
  constructor(options = {}) {
    this.options = {
      ...options
    };
    
    this.encryptionEngine = getEncryptionEngine();
    this.currentTerminal = null;
    this.allTerminals = new Map();
    this.eventHandlers = new Map();
    
    this.loadTerminalState();
  }

  /**
   * Load terminal state from localStorage
   */
  loadTerminalState() {
    try {
      const stored = localStorage.getItem('cafeos_terminal_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.currentTerminal = state.currentTerminal || null;
        this.allTerminals = new Map(state.allTerminals || []);
      }
    } catch (error) {
      console.error('[TerminalManager] Failed to load terminal state:', error);
    }
  }

  /**
   * Save terminal state to localStorage
   */
  saveTerminalState() {
    try {
      const state = {
        currentTerminal: this.currentTerminal,
        allTerminals: Array.from(this.allTerminals)
      };
      
      localStorage.setItem('cafeos_terminal_state', JSON.stringify(state));
    } catch (error) {
      console.error('[TerminalManager] Failed to save terminal state:', error);
    }
  }

  /**
   * Register a new terminal
   */
  registerTerminal(config) {
    const terminal = {
      id: config.id || this.generateTerminalId(),
      name: config.name || 'Unnamed Terminal',
      location: config.location || 'main',
      type: config.type || 'pos', // 'pos', 'kds', 'admin'
      printers: config.printers || [],
      defaultOrderType: config.defaultOrderType || 'dine_in',
      enabledFeatures: config.enabledFeatures || {
        kitchenDisplay: true,
        deliveryPlatform: true,
        tableManagement: true,
        printerManagement: true
      },
      assignedStaff: config.assignedStaff || [],
      createdAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
      settings: config.settings || {}
    };
    
    this.allTerminals.set(terminal.id, terminal);
    this.saveTerminalState();
    
    console.log(`[TerminalManager] Registered terminal: ${terminal.id} (${terminal.name})`);
    
    this.emit('terminalRegistered', { terminal });
    
    return terminal;
  }

  /**
   * Set current terminal for this POS instance
   */
  setCurrentTerminal(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    this.currentTerminal = terminal;
    this.saveTerminalState();
    
    console.log(`[TerminalManager] Set current terminal: ${terminalId}`);
    
    this.emit('currentTerminalChanged', { terminal });
    
    return terminal;
  }

  /**
   * Get current terminal
   */
  getCurrentTerminal() {
    return this.currentTerminal;
  }

  /**
   * Get terminal by ID
   */
  getTerminal(terminalId) {
    return this.allTerminals.get(terminalId);
  }

  /**
   * Get all terminals
   */
  getAllTerminals() {
    return Array.from(this.allTerminals.values());
  }

  /**
   * Get active terminals
   */
  getActiveTerminals() {
    return this.getAllTerminals().filter(t => t.isActive);
  }

  /**
   * Get terminals by location
   */
  getTerminalsByLocation(location) {
    return this.getAllTerminals().filter(t => t.location === location);
  }

  /**
   * Get terminals by type
   */
  getTerminalsByType(type) {
    return this.getAllTerminals().filter(t => t.type === type);
  }

  /**
   * Update terminal configuration
   */
  updateTerminal(terminalId, updates) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    Object.assign(terminal, updates);
    terminal.lastSeen = Date.now();
    
    this.allTerminals.set(terminalId, terminal);
    this.saveTerminalState();
    
    this.emit('terminalUpdated', { terminalId, updates });
    
    return terminal;
  }

  /**
   * Assign staff to terminal
   */
  assignStaff(terminalId, staffId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    if (!terminal.assignedStaff.includes(staffId)) {
      terminal.assignedStaff.push(staffId);
      this.saveTerminalState();
      
      this.emit('staffAssigned', { terminalId, staffId });
    }
    
    return terminal;
  }

  /**
   * Remove staff from terminal
   */
  removeStaff(terminalId, staffId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.assignedStaff = terminal.assignedStaff.filter(id => id !== staffId);
    this.saveTerminalState();
    
    this.emit('staffRemoved', { terminalId, staffId });
    
    return terminal;
  }

  /**
   * Assign printer to terminal
   */
  assignPrinter(terminalId, printerId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    if (!terminal.printers.includes(printerId)) {
      terminal.printers.push(printerId);
      this.saveTerminalState();
      
      this.emit('printerAssigned', { terminalId, printerId });
    }
    
    return terminal;
  }

  /**
   * Remove printer from terminal
   */
  removePrinter(terminalId, printerId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.printers = terminal.printers.filter(id => id !== printerId);
    this.saveTerminalState();
    
    this.emit('printerRemoved', { terminalId, printerId });
    
    return terminal;
  }

  /**
   * Enable feature for terminal
   */
  enableFeature(terminalId, feature) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.enabledFeatures[feature] = true;
    this.saveTerminalState();
    
    this.emit('featureEnabled', { terminalId, feature });
    
    return terminal;
  }

  /**
   * Disable feature for terminal
   */
  disableFeature(terminalId, feature) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.enabledFeatures[feature] = false;
    this.saveTerminalState();
    
    this.emit('featureDisabled', { terminalId, feature });
    
    return terminal;
  }

  /**
   * Deactivate terminal
   */
  deactivateTerminal(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.isActive = false;
    this.saveTerminalState();
    
    this.emit('terminalDeactivated', { terminalId });
    
    return terminal;
  }

  /**
   * Activate terminal
   */
  activateTerminal(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    terminal.isActive = true;
    terminal.lastSeen = Date.now();
    this.saveTerminalState();
    
    this.emit('terminalActivated', { terminalId });
    
    return terminal;
  }

  /**
   * Update last seen timestamp
   */
  updateLastSeen(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (terminal) {
      terminal.lastSeen = Date.now();
      this.saveTerminalState();
    }
  }

  /**
   * Check if terminal is online (seen in last 30 seconds)
   */
  isTerminalOnline(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal || !terminal.isActive) {
      return false;
    }
    
    const offlineThreshold = 30000; // 30 seconds
    return (Date.now() - terminal.lastSeen) < offlineThreshold;
  }

  /**
   * Get terminal statistics
   */
  getStatistics() {
    const terminals = this.getAllTerminals();
    const activeTerminals = this.getActiveTerminals();
    
    return {
      total: terminals.length,
      active: activeTerminals.length,
      inactive: terminals.length - activeTerminals.length,
      byType: {
        pos: terminals.filter(t => t.type === 'pos').length,
        kds: terminals.filter(t => t.type === 'kds').length,
        admin: terminals.filter(t => t.type === 'admin').length
      },
      byLocation: this.groupByLocation(terminals),
      onlineCount: activeTerminals.filter(t => this.isTerminalOnline(t.id)).length
    };
  }

  /**
   * Group terminals by location
   */
  groupByLocation(terminals) {
    const grouped = {};
    
    terminals.forEach(terminal => {
      if (!grouped[terminal.location]) {
        grouped[terminal.location] = 0;
      }
      grouped[terminal.location]++;
    });
    
    return grouped;
  }

  /**
   * Generate unique terminal ID
   */
  generateTerminalId() {
    return `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delete terminal
   */
  deleteTerminal(terminalId) {
    const terminal = this.allTerminals.get(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    this.allTerminals.delete(terminalId);
    this.saveTerminalState();
    
    // If this was current terminal, clear it
    if (this.currentTerminal?.id === terminalId) {
      this.currentTerminal = null;
      this.saveTerminalState();
    }
    
    this.emit('terminalDeleted', { terminalId });
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
          console.error(`[TerminalManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the terminal manager
   */
  destroy() {
    this.eventHandlers.clear();
    console.log('[TerminalManager] Destroyed');
  }
}

// Singleton instance
let terminalManagerInstance = null;

/**
 * Get the singleton terminal manager instance
 */
export function getTerminalManager(options = {}) {
  if (!terminalManagerInstance) {
    terminalManagerInstance = new TerminalManager(options);
  }
  return terminalManagerInstance;
}

export default TerminalManager;
