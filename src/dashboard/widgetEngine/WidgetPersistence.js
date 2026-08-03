/**
 * Widget Persistence
 * Handles saving and loading widget layouts and configurations
 */

import { DashboardLayout } from './WidgetTypes.js';

class WidgetPersistence {
  constructor() {
    this.storageKey = 'cafeos_dashboard_layouts';
    this.userLayoutsKey = 'cafeos_user_layouts';
    this.initialized = false;
  }

  /**
   * Initialize persistence layer
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Get storage key for a user
   * @param {string} userId - User ID
   * @returns {string}
   */
  getUserStorageKey(userId) {
    return `${this.userLayoutsKey}_${userId}`;
  }

  /**
   * Save a dashboard layout
   * @param {DashboardLayout} layout - Layout to save
   * @param {string} userId - User ID (optional, for user-specific layouts)
   * @returns {boolean}
   */
  saveLayout(layout, userId = null) {
    try {
      const storageKey = userId ? this.getUserStorageKey(userId) : this.storageKey;
      const layouts = this.loadAllLayouts(userId);
      
      const existingIndex = layouts.findIndex(l => l.id === layout.id);
      
      if (existingIndex >= 0) {
        layouts[existingIndex] = {
          ...layout,
          updatedAt: Date.now()
        };
      } else {
        layouts.push({
          ...layout,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(layouts));
      return true;
    } catch (error) {
      console.error('Failed to save layout:', error);
      return false;
    }
  }

  /**
   * Load a dashboard layout
   * @param {string} layoutId - Layout ID
   * @param {string} userId - User ID (optional)
   * @returns {DashboardLayout|null}
   */
  loadLayout(layoutId, userId = null) {
    try {
      const storageKey = userId ? this.getUserStorageKey(userId) : this.storageKey;
      const layouts = this.loadAllLayouts(userId);
      
      return layouts.find(l => l.id === layoutId) || null;
    } catch (error) {
      console.error('Failed to load layout:', error);
      return null;
    }
  }

  /**
   * Load all layouts
   * @param {string} userId - User ID (optional)
   * @returns {Array<DashboardLayout>}
   */
  loadAllLayouts(userId = null) {
    try {
      const storageKey = userId ? this.getUserStorageKey(userId) : this.storageKey;
      const data = localStorage.getItem(storageKey);
      
      if (!data) return [];
      
      const layouts = JSON.parse(data);
      return layouts.map(l => new DashboardLayout(l));
    } catch (error) {
      console.error('Failed to load layouts:', error);
      return [];
    }
  }

  /**
   * Delete a layout
   * @param {string} layoutId - Layout ID
   * @param {string} userId - User ID (optional)
   * @returns {boolean}
   */
  deleteLayout(layoutId, userId = null) {
    try {
      const storageKey = userId ? this.getUserStorageKey(userId) : this.storageKey;
      const layouts = this.loadAllLayouts(userId);
      
      const filtered = layouts.filter(l => l.id !== layoutId);
      
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete layout:', error);
      return false;
    }
  }

  /**
   * Duplicate a layout
   * @param {string} layoutId - Layout ID to duplicate
   * @param {string} newId - New layout ID
   * @param {string} newName - New layout name
   * @param {string} userId - User ID (optional)
   * @returns {DashboardLayout|null}
   */
  duplicateLayout(layoutId, newId, newName, userId = null) {
    try {
      const original = this.loadLayout(layoutId, userId);
      if (!original) return null;

      const duplicate = new DashboardLayout({
        id: newId,
        name: newName,
        description: `Copy of ${original.name}`,
        role: original.role,
        widgets: original.widgets.map(w => ({ ...w })),
        isDefault: false,
        isLocked: false
      });

      this.saveLayout(duplicate, userId);
      return duplicate;
    } catch (error) {
      console.error('Failed to duplicate layout:', error);
      return null;
    }
  }

  /**
   * Export a layout
   * @param {string} layoutId - Layout ID
   * @param {string} userId - User ID (optional)
   * @returns {string|null} JSON string
   */
  exportLayout(layoutId, userId = null) {
    try {
      const layout = this.loadLayout(layoutId, userId);
      if (!layout) return null;

      return JSON.stringify(layout, null, 2);
    } catch (error) {
      console.error('Failed to export layout:', error);
      return null;
    }
  }

  /**
   * Import a layout
   * @param {string} json - JSON string
   * @param {string} userId - User ID (optional)
   * @returns {DashboardLayout|null}
   */
  importLayout(json, userId = null) {
    try {
      const data = JSON.parse(json);
      const layout = new DashboardLayout(data);

      // Generate new ID if it conflicts
      const existing = this.loadLayout(layout.id, userId);
      if (existing) {
        layout.id = `${layout.id}_imported_${Date.now()}`;
      }

      this.saveLayout(layout, userId);
      return layout;
    } catch (error) {
      console.error('Failed to import layout:', error);
      return null;
    }
  }

  /**
   * Reset to default layout for a role
   * @param {string} role - User role
   * @param {string} userId - User ID (optional)
   * @returns {DashboardLayout|null}
   */
  resetToDefault(role, userId = null) {
    try {
      // Load default layouts
      const defaultLayouts = this.loadAllLayouts(null);
      const defaultLayout = defaultLayouts.find(l => l.role === role && l.isDefault);

      if (!defaultLayout) return null;

      // Save as user's current layout
      const userLayout = new DashboardLayout({
        id: `${role}_default`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`,
        description: `Default dashboard for ${role}`,
        role,
        widgets: defaultLayout.widgets.map(w => ({ ...w })),
        isDefault: true,
        isLocked: false
      });

      this.saveLayout(userLayout, userId);
      return userLayout;
    } catch (error) {
      console.error('Failed to reset to default:', error);
      return null;
    }
  }

  /**
   * Clear all user layouts
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  clearUserLayouts(userId) {
    try {
      const storageKey = this.getUserStorageKey(userId);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear user layouts:', error);
      return false;
    }
  }

  /**
   * Get user's current layout
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {DashboardLayout|null}
   */
  getUserCurrentLayout(userId, role) {
    try {
      const userLayouts = this.loadAllLayouts(userId);
      
      // Try to find a layout for the user's role
      const roleLayout = userLayouts.find(l => l.role === role);
      if (roleLayout) return roleLayout;

      // Fall back to default layout
      return this.resetToDefault(role, userId);
    } catch (error) {
      console.error('Failed to get user current layout:', error);
      return null;
    }
  }
}

// Singleton instance
const widgetPersistence = new WidgetPersistence();

export default widgetPersistence;
