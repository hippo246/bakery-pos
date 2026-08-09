/**
 * ThemeRegistry
 * 
 * Central registry for all available POS themes.
 * Themes can be registered dynamically at runtime.
 * 
 * This allows for:
 * - Plugin system for custom themes
 * - Hot-reloading of themes
 * - Theme discovery and enumeration
 */

import { modernTheme } from './themes/modern';
import { modernLightTheme } from './themes/modern-light';
import { classicTheme } from './themes/classic';
import { classicDarkTheme } from './themes/classic-dark';
import { fastFoodTheme } from './themes/fastfood';
import { fastFoodComprehensiveTheme } from './themes/fastfood-comprehensive';
import { fastFoodSimpleTheme } from './themes/fastfood-simple';
import { cafeTheme } from './themes/cafe';
import { fineDiningTheme } from './themes/finedining';
import { barTheme } from './themes/bar';
import { bakeryTheme } from './themes/bakery';
import { accessibilityTheme } from './themes/accessibility';

class ThemeRegistry {
  constructor() {
    this.themes = new Map();
    this.listeners = new Set();
    
    // Register built-in themes
    this.register(modernTheme);
    this.register(modernLightTheme);
    this.register(classicTheme);
    this.register(classicDarkTheme);
    this.register(fastFoodTheme);
    this.register(fastFoodComprehensiveTheme);
    this.register(fastFoodSimpleTheme);
    this.register(cafeTheme);
    this.register(fineDiningTheme);
    this.register(barTheme);
    this.register(bakeryTheme);
    this.register(accessibilityTheme);
  }

  /**
   * Register a new theme
   * @param {Object} theme - Theme configuration object
   */
  register(theme) {
    if (!theme.id) {
      throw new Error('Theme must have an id');
    }
    if (!theme.name) {
      throw new Error('Theme must have a name');
    }
    
    this.themes.set(theme.id, theme);
    this.notifyListeners();
  }

  /**
   * Unregister a theme
   * @param {string} themeId - Theme ID to unregister
   */
  unregister(themeId) {
    this.themes.delete(themeId);
    this.notifyListeners();
  }

  /**
   * Get a theme by ID
   * @param {string} themeId - Theme ID
   * @returns {Object|undefined} Theme configuration
   */
  get(themeId) {
    return this.themes.get(themeId);
  }

  /**
   * Get all registered themes
   * @returns {Array} Array of theme configurations
   */
  getAll() {
    return Array.from(this.themes.values());
  }

  /**
   * Get themes by category
   * @param {string} category - Theme category
   * @returns {Array} Array of theme configurations
   */
  getByCategory(category) {
    return this.getAll().filter(theme => theme.category === category);
  }

  /**
   * Check if a theme exists
   * @param {string} themeId - Theme ID
   * @returns {boolean} True if theme exists
   */
  has(themeId) {
    return this.themes.has(themeId);
  }

  /**
   * Subscribe to registry changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getAll()));
  }

  /**
   * Get default theme ID
   * @returns {string} Default theme ID
   */
  getDefaultThemeId() {
    return 'modern';
  }

  /**
   * Validate theme configuration
   * @param {Object} theme - Theme to validate
   * @returns {boolean} True if valid
   */
  validate(theme) {
    const required = ['id', 'name', 'colors', 'typography', 'spacing', 'layout'];
    return required.every(field => field in theme);
  }
}

// Singleton instance
const registry = new ThemeRegistry();

export { ThemeRegistry };
export default registry;
