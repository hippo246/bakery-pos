/**
 * Widget Registry
 * Central registry for all available widgets in the system
 */

import { WidgetDefinition, WidgetCategories, WidgetSizes, RefreshIntervals } from './WidgetTypes.js';

class WidgetRegistry {
  constructor() {
    this.widgets = new Map(); // widgetId -> WidgetDefinition
    this.categories = new Map(); // category -> Set of widgetIds
    this.initialized = false;
  }

  /**
   * Initialize the widget registry with default widgets
   */
  initialize() {
    if (this.initialized) return;
    
    // Register default widgets
    this.registerDefaultWidgets();
    this.initialized = true;
  }

  /**
   * Register a widget definition
   * @param {WidgetDefinition} widget - Widget definition to register
   */
  register(widget) {
    if (!(widget instanceof WidgetDefinition)) {
      throw new Error('Widget must be an instance of WidgetDefinition');
    }

    this.widgets.set(widget.id, widget);

    // Add to category
    if (!this.categories.has(widget.category)) {
      this.categories.set(widget.category, new Set());
    }
    this.categories.get(widget.category).add(widget.id);
  }

  /**
   * Get a widget definition by ID
   * @param {string} widgetId - Widget identifier
   * @returns {WidgetDefinition|null}
   */
  getWidget(widgetId) {
    return this.widgets.get(widgetId) || null;
  }

  /**
   * Get all widget definitions
   * @returns {Array<WidgetDefinition>}
   */
  getAllWidgets() {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by category
   * @param {string} category - Widget category
   * @returns {Array<WidgetDefinition>}
   */
  getWidgetsByCategory(category) {
    const widgetIds = this.categories.get(category);
    if (!widgetIds) return [];
    
    return Array.from(widgetIds)
      .map(id => this.widgets.get(id))
      .filter(Boolean);
  }

  /**
   * Get all categories
   * @returns {Array<string>}
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Search widgets by name, description, or keywords
   * @param {string} query - Search query
   * @returns {Array<WidgetDefinition>}
   */
  searchWidgets(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.getAllWidgets().filter(widget => {
      const nameMatch = widget.name.toLowerCase().includes(lowerQuery);
      const descMatch = widget.description?.toLowerCase().includes(lowerQuery);
      const keywordMatch = widget.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      const categoryMatch = widget.category.toLowerCase().includes(lowerQuery);
      
      return nameMatch || descMatch || keywordMatch || categoryMatch;
    });
  }

  /**
   * Get widgets available for a specific role
   * @param {string} role - User role
   * @returns {Array<WidgetDefinition>}
   */
  getWidgetsForRole(role) {
    return this.getAllWidgets().filter(widget => {
      // If widget has wildcard permission, it's available to all
      if (widget.permissions.includes('*')) return true;
      // If role has wildcard permission, they can access all
      if (role === 'owner' || role === 'administrator') return true;
      // Check if role is in widget permissions
      return widget.permissions.includes(role);
    });
  }

  /**
   * Unregister a widget
   * @param {string} widgetId - Widget identifier
   */
  unregister(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    this.widgets.delete(widgetId);
    
    // Remove from category
    const categoryWidgets = this.categories.get(widget.category);
    if (categoryWidgets) {
      categoryWidgets.delete(widgetId);
      if (categoryWidgets.size === 0) {
        this.categories.delete(widget.category);
      }
    }
  }

  /**
   * Register default widgets
   */
  registerDefaultWidgets() {
    // Revenue widgets
    this.register(new WidgetDefinition({
      id: 'revenue-today',
      name: 'Today\'s Revenue',
      description: 'Total revenue for today',
      category: WidgetCategories.REVENUE,
      icon: '💰',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['sales', 'money', 'income', 'daily']
    }));

    this.register(new WidgetDefinition({
      id: 'revenue-week',
      name: 'Weekly Revenue',
      description: 'Revenue for the current week',
      category: WidgetCategories.REVENUE,
      icon: '📈',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['sales', 'money', 'income', 'weekly']
    }));

    this.register(new WidgetDefinition({
      id: 'revenue-chart',
      name: 'Revenue Chart',
      description: 'Revenue trends over time',
      category: WidgetCategories.REVENUE,
      icon: '📊',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['sales', 'money', 'income', 'chart', 'graph', 'trend']
    }));

    // Operations widgets
    this.register(new WidgetDefinition({
      id: 'orders-active',
      name: 'Active Orders',
      description: 'Currently active orders',
      category: WidgetCategories.OPERATIONS,
      icon: '📋',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['orders', 'active', 'current', 'pending']
    }));

    this.register(new WidgetDefinition({
      id: 'orders-completed',
      name: 'Completed Orders',
      description: 'Orders completed today',
      category: WidgetCategories.OPERATIONS,
      icon: '✅',
      defaultSize: WidgetSizes.SMALL,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['orders', 'completed', 'done', 'finished']
    }));

    // Kitchen widgets
    this.register(new WidgetDefinition({
      id: 'kitchen-queue',
      name: 'Kitchen Queue',
      description: 'Current kitchen orders',
      category: WidgetCategories.KITCHEN,
      icon: '👨‍🍳',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['kitchen', 'orders', 'queue', 'cooking']
    }));

    this.register(new WidgetDefinition({
      id: 'kitchen-priority',
      name: 'Priority Orders',
      description: 'High-priority kitchen orders',
      category: WidgetCategories.KITCHEN,
      icon: '🔥',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['kitchen', 'urgent', 'priority', 'rush']
    }));

    // Inventory widgets
    this.register(new WidgetDefinition({
      id: 'inventory-alerts',
      name: 'Inventory Alerts',
      description: 'Low stock and out-of-stock items',
      category: WidgetCategories.INVENTORY,
      icon: '⚠️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['inventory', 'stock', 'low', 'alerts']
    }));

    this.register(new WidgetDefinition({
      id: 'inventory-value',
      name: 'Inventory Value',
      description: 'Total inventory value',
      category: WidgetCategories.INVENTORY,
      icon: '📦',
      defaultSize: WidgetSizes.SMALL,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['inventory', 'value', 'worth', 'cost']
    }));

    // Staff widgets
    this.register(new WidgetDefinition({
      id: 'staff-on-shift',
      name: 'Staff on Shift',
      description: 'Currently active staff members',
      category: WidgetCategories.STAFF,
      icon: '👥',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['staff', 'employees', 'shift', 'active']
    }));

    // Customer widgets
    this.register(new WidgetDefinition({
      id: 'customers-today',
      name: 'Customers Today',
      description: 'Customers served today',
      category: WidgetCategories.CUSTOMERS,
      icon: '👤',
      defaultSize: WidgetSizes.SMALL,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['customers', 'guests', 'visitors', 'served']
    }));

    // Health widgets
    this.register(new WidgetDefinition({
      id: 'health-status',
      name: 'System Health',
      description: 'Overall system health status',
      category: WidgetCategories.HEALTH,
      icon: '❤️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['health', 'status', 'system', 'monitoring']
    }));

    // Notification widgets
    this.register(new WidgetDefinition({
      id: 'notifications',
      name: 'Notifications',
      description: 'Recent notifications',
      category: WidgetCategories.NOTIFICATIONS,
      icon: '🔔',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['notifications', 'alerts', 'messages']
    }));

    // Reservations widgets
    this.register(new WidgetDefinition({
      id: 'reservations-today',
      name: 'Today\'s Reservations',
      description: 'Reservations for today',
      category: WidgetCategories.RESERVATIONS,
      icon: '📅',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['reservations', 'bookings', 'today']
    }));

    // Live widgets
    this.register(new WidgetDefinition({
      id: 'live-orders',
      name: 'Live Orders',
      description: 'Real-time order statistics and status',
      category: WidgetCategories.OPERATIONS,
      icon: '📋',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['orders', 'live', 'real-time', 'status', 'operations']
    }));

    this.register(new WidgetDefinition({
      id: 'live-kitchen',
      name: 'Live Kitchen',
      description: 'Real-time kitchen operations and status',
      category: WidgetCategories.KITCHEN,
      icon: '👨‍🍳',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['kitchen', 'live', 'real-time', 'cooking', 'operations']
    }));

    this.register(new WidgetDefinition({
      id: 'live-waiter',
      name: 'Live Waiter',
      description: 'Real-time waiter operations and assignments',
      category: WidgetCategories.OPERATIONS,
      icon: '👤',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['waiter', 'live', 'real-time', 'service', 'operations']
    }));

    this.register(new WidgetDefinition({
      id: 'live-tables',
      name: 'Live Tables',
      description: 'Real-time table status and occupancy',
      category: WidgetCategories.OPERATIONS,
      icon: '🪑',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['tables', 'live', 'real-time', 'occupancy', 'status']
    }));

    this.register(new WidgetDefinition({
      id: 'live-payments',
      name: 'Live Payments',
      description: 'Real-time payment operations and status',
      category: WidgetCategories.OPERATIONS,
      icon: '💳',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['payments', 'live', 'real-time', 'transactions', 'cash']
    }));

    this.register(new WidgetDefinition({
      id: 'live-inventory',
      name: 'Live Inventory',
      description: 'Actionable inventory alerts and status',
      category: WidgetCategories.INVENTORY,
      icon: '📦',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['inventory', 'live', 'real-time', 'stock', 'alerts']
    }));

    this.register(new WidgetDefinition({
      id: 'live-reservations',
      name: 'Live Reservations',
      description: 'Real-time reservation status and upcoming',
      category: WidgetCategories.RESERVATIONS,
      icon: '📅',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['reservations', 'live', 'real-time', 'bookings', 'status']
    }));

    this.register(new WidgetDefinition({
      id: 'live-business-health',
      name: 'Live Business Health',
      description: 'Real-time health status of all business components',
      category: WidgetCategories.HEALTH,
      icon: '❤️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['health', 'live', 'real-time', 'status', 'system']
    }));

    this.register(new WidgetDefinition({
      id: 'live-alert-center',
      name: 'Live Alert Center',
      description: 'Actionable operational alerts',
      category: WidgetCategories.NOTIFICATIONS,
      icon: '🔔',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['alerts', 'live', 'real-time', 'notifications', 'issues']
    }));

    this.register(new WidgetDefinition({
      id: 'live-staff-status',
      name: 'Live Staff Status',
      description: 'Real-time staff status and activity',
      category: WidgetCategories.STAFF,
      icon: '👥',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['staff', 'live', 'real-time', 'status', 'employees']
    }));

    this.register(new WidgetDefinition({
      id: 'live-activity-timeline',
      name: 'Live Activity Timeline',
      description: 'Real-time operational events and activity',
      category: WidgetCategories.OPERATIONS,
      icon: '📊',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['activity', 'live', 'real-time', 'timeline', 'events']
    }));

    // Business Intelligence widgets
    this.register(new WidgetDefinition({
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'Comprehensive business overview with key metrics',
      category: WidgetCategories.OPERATIONS,
      icon: '📊',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['executive', 'summary', 'overview', 'business', 'metrics']
    }));

    this.register(new WidgetDefinition({
      id: 'business-health-score',
      name: 'Business Health Score',
      description: 'Overall business health with breakdown and deductions',
      category: WidgetCategories.HEALTH,
      icon: '❤️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['health', 'score', 'business', 'performance', 'status']
    }));

    this.register(new WidgetDefinition({
      id: 'revenue-analytics',
      name: 'Revenue Analytics',
      description: 'Revenue trends, breakdown, and comparisons',
      category: WidgetCategories.REVENUE,
      icon: '💰',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['revenue', 'analytics', 'trends', 'sales', 'income']
    }));

    this.register(new WidgetDefinition({
      id: 'order-intelligence',
      name: 'Order Intelligence',
      description: 'Order analytics and performance metrics',
      category: WidgetCategories.OPERATIONS,
      icon: '📋',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['orders', 'intelligence', 'analytics', 'performance', 'metrics']
    }));

    this.register(new WidgetDefinition({
      id: 'kitchen-intelligence',
      name: 'Kitchen Intelligence',
      description: 'Kitchen performance metrics and bottlenecks',
      category: WidgetCategories.KITCHEN,
      icon: '👨‍🍳',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['kitchen', 'intelligence', 'performance', 'bottlenecks', 'efficiency']
    }));

    this.register(new WidgetDefinition({
      id: 'table-intelligence',
      name: 'Table Intelligence',
      description: 'Table analytics and occupancy metrics',
      category: WidgetCategories.OPERATIONS,
      icon: '🪑',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['tables', 'intelligence', 'occupancy', 'turnover', 'analytics']
    }));

    this.register(new WidgetDefinition({
      id: 'payment-analytics',
      name: 'Payment Analytics',
      description: 'Payment breakdown and performance metrics',
      category: WidgetCategories.OPERATIONS,
      icon: '💳',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['payments', 'analytics', 'breakdown', 'performance', 'transactions']
    }));

    this.register(new WidgetDefinition({
      id: 'inventory-intelligence',
      name: 'Inventory Intelligence',
      description: 'Inventory analytics and stock insights',
      category: WidgetCategories.INVENTORY,
      icon: '📦',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['inventory', 'intelligence', 'stock', 'analytics', 'insights']
    }));

    this.register(new WidgetDefinition({
      id: 'customer-analytics',
      name: 'Customer Analytics',
      description: 'Customer insights and behavior analytics',
      category: WidgetCategories.CUSTOMERS,
      icon: '👤',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['customers', 'analytics', 'insights', 'behavior', 'loyalty']
    }));

    this.register(new WidgetDefinition({
      id: 'menu-intelligence',
      name: 'Menu Intelligence',
      description: 'Menu performance analytics and insights',
      category: WidgetCategories.OPERATIONS,
      icon: '🍽️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['menu', 'intelligence', 'performance', 'analytics', 'insights']
    }));

    this.register(new WidgetDefinition({
      id: 'recommendations',
      name: 'Recommendations',
      description: 'Actionable business recommendations with explainability',
      category: WidgetCategories.OPERATIONS,
      icon: '💡',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.NORMAL,
      keywords: ['recommendations', 'insights', 'actions', 'business', 'intelligence']
    }));

    this.register(new WidgetDefinition({
      id: 'operational-warnings',
      name: 'Operational Warnings',
      description: 'Threshold-based operational warnings',
      category: WidgetCategories.NOTIFICATIONS,
      icon: '⚠️',
      defaultSize: WidgetSizes.MEDIUM,
      defaultRefreshInterval: RefreshIntervals.FAST,
      keywords: ['warnings', 'operational', 'alerts', 'thresholds', 'issues']
    }));

    this.register(new WidgetDefinition({
      id: 'trend-analysis',
      name: 'Trend Analysis',
      description: 'Comparative trends and performance analysis',
      category: WidgetCategories.OPERATIONS,
      icon: '📈',
      defaultSize: WidgetSizes.LARGE,
      defaultRefreshInterval: RefreshIntervals.SLOW,
      keywords: ['trends', 'analysis', 'comparisons', 'performance', 'history']
    }));
  }
}

// Singleton instance
const widgetRegistry = new WidgetRegistry();

export default widgetRegistry;
