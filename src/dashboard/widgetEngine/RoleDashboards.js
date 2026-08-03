/**
 * Role-based Default Dashboards
 * Pre-configured dashboard layouts for different roles
 */

import { DashboardLayout, WidgetSizes } from './WidgetTypes.js';

class RoleDashboards {
  constructor() {
    this.defaultLayouts = new Map();
    this.initialized = false;
  }

  /**
   * Initialize default role dashboards
   */
  initialize() {
    if (this.initialized) return;
    
    this.createOwnerDashboard();
    this.createManagerDashboard();
    this.createCashierDashboard();
    this.createKitchenDashboard();
    this.createWaiterDashboard();
    this.createInventoryDashboard();
    
    this.initialized = true;
  }

  /**
   * Create Owner Dashboard
   */
  createOwnerDashboard() {
    const layout = new DashboardLayout({
      id: 'owner_default',
      name: 'Owner Dashboard',
      description: 'Executive operations center for cafe owners',
      role: 'owner',
      isDefault: true,
      widgets: [
        {
          id: 'executive-summary-1',
          widgetId: 'executive-summary',
          position: { x: 0, y: 0 },
          size: WidgetSizes.LARGE,
          order: 0
        },
        {
          id: 'business-health-score-1',
          widgetId: 'business-health-score',
          position: { x: 8, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'revenue-analytics-1',
          widgetId: 'revenue-analytics',
          position: { x: 0, y: 2 },
          size: WidgetSizes.LARGE,
          order: 2
        },
        {
          id: 'recommendations-1',
          widgetId: 'recommendations',
          position: { x: 0, y: 4 },
          size: WidgetSizes.LARGE,
          order: 3
        },
        {
          id: 'operational-warnings-1',
          widgetId: 'operational-warnings',
          position: { x: 8, y: 2 },
          size: WidgetSizes.MEDIUM,
          order: 4
        },
        {
          id: 'trend-analysis-1',
          widgetId: 'trend-analysis',
          position: { x: 8, y: 4 },
          size: WidgetSizes.LARGE,
          order: 5
        }
      ]
    });

    this.defaultLayouts.set('owner', layout);
  }

  /**
   * Create Manager Dashboard
   */
  createManagerDashboard() {
    const layout = new DashboardLayout({
      id: 'manager_default',
      name: 'Manager Dashboard',
      description: 'Operations intelligence dashboard for managers',
      role: 'manager',
      isDefault: true,
      widgets: [
        {
          id: 'executive-summary-2',
          widgetId: 'executive-summary',
          position: { x: 0, y: 0 },
          size: WidgetSizes.LARGE,
          order: 0
        },
        {
          id: 'order-intelligence-1',
          widgetId: 'order-intelligence',
          position: { x: 0, y: 2 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'kitchen-intelligence-1',
          widgetId: 'kitchen-intelligence',
          position: { x: 4, y: 2 },
          size: WidgetSizes.MEDIUM,
          order: 2
        },
        {
          id: 'table-intelligence-1',
          widgetId: 'table-intelligence',
          position: { x: 8, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 3
        },
        {
          id: 'recommendations-2',
          widgetId: 'recommendations',
          position: { x: 0, y: 4 },
          size: WidgetSizes.LARGE,
          order: 4
        }
      ]
    });

    this.defaultLayouts.set('manager', layout);
  }

  /**
   * Create Cashier Dashboard
   */
  createCashierDashboard() {
    const layout = new DashboardLayout({
      id: 'cashier_default',
      name: 'Cashier Dashboard',
      description: 'POS intelligence dashboard for cashiers',
      role: 'cashier',
      isDefault: true,
      widgets: [
        {
          id: 'order-intelligence-2',
          widgetId: 'order-intelligence',
          position: { x: 0, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 0
        },
        {
          id: 'payment-analytics-1',
          widgetId: 'payment-analytics',
          position: { x: 4, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'table-intelligence-2',
          widgetId: 'table-intelligence',
          position: { x: 8, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 2
        }
      ]
    });

    this.defaultLayouts.set('cashier', layout);
  }

  /**
   * Create Kitchen Dashboard
   */
  createKitchenDashboard() {
    const layout = new DashboardLayout({
      id: 'kitchen_default',
      name: 'Kitchen Dashboard',
      description: 'Kitchen intelligence dashboard',
      role: 'kitchen',
      isDefault: true,
      widgets: [
        {
          id: 'kitchen-intelligence-2',
          widgetId: 'kitchen-intelligence',
          position: { x: 0, y: 0 },
          size: WidgetSizes.EXTRA_LARGE,
          order: 0
        },
        {
          id: 'order-intelligence-3',
          widgetId: 'order-intelligence',
          position: { x: 0, y: 4 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'operational-warnings-2',
          widgetId: 'operational-warnings',
          position: { x: 4, y: 4 },
          size: WidgetSizes.MEDIUM,
          order: 2
        }
      ]
    });

    this.defaultLayouts.set('kitchen', layout);
  }

  /**
   * Create Waiter Dashboard
   */
  createWaiterDashboard() {
    const layout = new DashboardLayout({
      id: 'waiter_default',
      name: 'Waiter Dashboard',
      description: 'Service intelligence dashboard for waiters',
      role: 'waiter',
      isDefault: true,
      widgets: [
        {
          id: 'order-intelligence-4',
          widgetId: 'order-intelligence',
          position: { x: 0, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 0
        },
        {
          id: 'table-intelligence-3',
          widgetId: 'table-intelligence',
          position: { x: 4, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'customer-analytics-1',
          widgetId: 'customer-analytics',
          position: { x: 8, y: 0 },
          size: WidgetSizes.MEDIUM,
          order: 2
        }
      ]
    });

    this.defaultLayouts.set('waiter', layout);
  }

  /**
   * Create Inventory Dashboard
   */
  createInventoryDashboard() {
    const layout = new DashboardLayout({
      id: 'inventory_default',
      name: 'Inventory Dashboard',
      description: 'Inventory intelligence dashboard',
      role: 'inventory',
      isDefault: true,
      widgets: [
        {
          id: 'inventory-intelligence-1',
          widgetId: 'inventory-intelligence',
          position: { x: 0, y: 0 },
          size: WidgetSizes.LARGE,
          order: 0
        },
        {
          id: 'menu-intelligence-1',
          widgetId: 'menu-intelligence',
          position: { x: 0, y: 2 },
          size: WidgetSizes.MEDIUM,
          order: 1
        },
        {
          id: 'operational-warnings-3',
          widgetId: 'operational-warnings',
          position: { x: 4, y: 2 },
          size: WidgetSizes.MEDIUM,
          order: 2
        }
      ]
    });

    this.defaultLayouts.set('inventory', layout);
  }

  /**
   * Get default layout for a role
   * @param {string} role - User role
   * @returns {DashboardLayout|null}
   */
  getDefaultLayout(role) {
    return this.defaultLayouts.get(role) || null;
  }

  /**
   * Get all default layouts
   * @returns {Array<DashboardLayout>}
   */
  getAllDefaultLayouts() {
    return Array.from(this.defaultLayouts.values());
  }

  /**
   * Check if role has a default layout
   * @param {string} role - User role
   * @returns {boolean}
   */
  hasDefaultLayout(role) {
    return this.defaultLayouts.has(role);
  }
}

// Singleton instance
const roleDashboards = new RoleDashboards();

export default roleDashboards;
