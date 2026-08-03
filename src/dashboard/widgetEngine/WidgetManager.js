/**
 * Widget Manager
 * Manages widget instances, lifecycle, and operations
 */

import { WidgetInstance, WidgetState, RefreshIntervals } from './WidgetTypes.js';
import widgetRegistry from './WidgetRegistry.js';

class WidgetManager {
  constructor() {
    this.instances = new Map(); // instanceId -> WidgetInstance
    this.refreshTimers = new Map(); // instanceId -> timerId
    this.initialized = false;
  }

  /**
   * Initialize the widget manager
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Create a new widget instance
   * @param {string} widgetId - Widget definition ID
   * @param {Object} config - Instance configuration
   * @returns {WidgetInstance}
   */
  createInstance(widgetId, config = {}) {
    const widgetDef = widgetRegistry.getWidget(widgetId);
    if (!widgetDef) {
      throw new Error(`Widget definition not found: ${widgetId}`);
    }

    const instanceId = config.id || `${widgetId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const instance = new WidgetInstance({
      id: instanceId,
      widgetId,
      position: config.position || { x: 0, y: 0 },
      size: config.size || widgetDef.defaultSize,
      state: WidgetState.NORMAL,
      settings: config.settings || {},
      refreshInterval: config.refreshInterval || widgetDef.defaultRefreshInterval,
      order: config.order || 0,
      ...config
    });

    this.instances.set(instanceId, instance);
    return instance;
  }

  /**
   * Get a widget instance
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  getInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Get all widget instances
   * @returns {Array<WidgetInstance>}
   */
  getAllInstances() {
    return Array.from(this.instances.values());
  }

  /**
   * Update a widget instance
   * @param {string} instanceId - Widget instance ID
   * @param {Object} updates - Properties to update
   * @returns {WidgetInstance|null}
   */
  updateInstance(instanceId, updates) {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    Object.assign(instance, updates);
    instance.updatedAt = Date.now();
    return instance;
  }

  /**
   * Delete a widget instance
   * @param {string} instanceId - Widget instance ID
   * @returns {boolean}
   */
  deleteInstance(instanceId) {
    // Clear refresh timer if exists
    this.stopAutoRefresh(instanceId);
    
    return this.instances.delete(instanceId);
  }

  /**
   * Move a widget to a new position
   * @param {string} instanceId - Widget instance ID
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {WidgetInstance|null}
   */
  moveWidget(instanceId, x, y) {
    return this.updateInstance(instanceId, {
      position: { x, y }
    });
  }

  /**
   * Resize a widget
   * @param {string} instanceId - Widget instance ID
   * @param {string} size - New size
   * @returns {WidgetInstance|null}
   */
  resizeWidget(instanceId, size) {
    return this.updateInstance(instanceId, { size });
  }

  /**
   * Toggle widget collapse state
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  toggleCollapse(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    return this.updateInstance(instanceId, {
      collapsed: !instance.collapsed,
      state: !instance.collapsed ? WidgetState.COLLAPSED : WidgetState.NORMAL
    });
  }

  /**
   * Toggle widget visibility
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  toggleVisibility(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    return this.updateInstance(instanceId, {
      visible: !instance.visible
    });
  }

  /**
   * Toggle widget pin state
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  togglePin(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    return this.updateInstance(instanceId, {
      pinned: !instance.pinned
    });
  }

  /**
   * Toggle widget lock state
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  toggleLock(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    return this.updateInstance(instanceId, {
      locked: !instance.locked
    });
  }

  /**
   * Update widget settings
   * @param {string} instanceId - Widget instance ID
   * @param {Object} settings - Settings to update
   * @returns {WidgetInstance|null}
   */
  updateSettings(instanceId, settings) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    return this.updateInstance(instanceId, {
      settings: { ...instance.settings, ...settings }
    });
  }

  /**
   * Set widget order
   * @param {string} instanceId - Widget instance ID
   * @param {number} order - Order index
   * @returns {WidgetInstance|null}
   */
  setOrder(instanceId, order) {
    return this.updateInstance(instanceId, { order });
  }

  /**
   * Start auto-refresh for a widget
   * @param {string} instanceId - Widget instance ID
   * @param {Function} onRefresh - Refresh callback
   */
  startAutoRefresh(instanceId, onRefresh) {
    const instance = this.getInstance(instanceId);
    if (!instance || !instance.refreshInterval || instance.refreshInterval === RefreshIntervals.NEVER) {
      return;
    }

    this.stopAutoRefresh(instanceId);

    const timerId = setInterval(() => {
      if (onRefresh) {
        onRefresh(instanceId);
      }
      this.updateInstance(instanceId, {
        lastRefresh: Date.now()
      });
    }, instance.refreshInterval);

    this.refreshTimers.set(instanceId, timerId);
  }

  /**
   * Stop auto-refresh for a widget
   * @param {string} instanceId - Widget instance ID
   */
  stopAutoRefresh(instanceId) {
    const timerId = this.refreshTimers.get(instanceId);
    if (timerId) {
      clearInterval(timerId);
      this.refreshTimers.delete(instanceId);
    }
  }

  /**
   * Stop all auto-refresh timers
   */
  stopAllAutoRefresh() {
    this.refreshTimers.forEach((timerId, instanceId) => {
      clearInterval(timerId);
    });
    this.refreshTimers.clear();
  }

  /**
   * Duplicate a widget instance
   * @param {string} instanceId - Widget instance ID
   * @returns {WidgetInstance|null}
   */
  duplicateInstance(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) return null;

    const widgetDef = widgetRegistry.getWidget(instance.widgetId);
    if (!widgetDef) return null;

    return this.createInstance(instance.widgetId, {
      position: { ...instance.position, x: instance.position.x + 1 },
      size: instance.size,
      settings: { ...instance.settings },
      refreshInterval: instance.refreshInterval
    });
  }

  /**
   * Load instances from configuration
   * @param {Array} configs - Array of instance configurations
   */
  loadInstances(configs) {
    configs.forEach(config => {
      try {
        this.createInstance(config.widgetId, config);
      } catch (error) {
        console.error(`Failed to load widget instance: ${config.id}`, error);
      }
    });
  }

  /**
   * Export instances to configuration
   * @returns {Array}
   */
  exportInstances() {
    return this.getAllInstances().map(instance => ({
      id: instance.id,
      widgetId: instance.widgetId,
      position: instance.position,
      size: instance.size,
      state: instance.state,
      visible: instance.visible,
      collapsed: instance.collapsed,
      pinned: instance.pinned,
      locked: instance.locked,
      settings: instance.settings,
      refreshInterval: instance.refreshInterval,
      order: instance.order
    }));
  }

  /**
   * Clear all instances
   */
  clearAll() {
    this.stopAllAutoRefresh();
    this.instances.clear();
  }
}

// Singleton instance
const widgetManager = new WidgetManager();

export default widgetManager;
