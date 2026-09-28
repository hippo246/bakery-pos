// Run this script in browser console to initialize the update tracker with the first entry
// Or copy this to localStorage directly

const initialData = {
  currentVersion: 1,
  updates: [
    {
      version: 1,
      type: 'feature',
      category: 'integration',
      description: 'Implemented comprehensive real-time order workflow integration across all tabs (Orders, Tables, Kitchen, Waiters, Tokens). Created centralized event system for cross-tab synchronization, KOT routing system, order lifecycle management, and update tracker system for project change tracking.',
      agent: 'Devin',
      filesModified: [
        'src/services/OrderEventManager.js',
        'src/services/OrderWorkflowService.js',
        'src/components/tables/ToastTables.jsx',
        'src/components/kitchen/Kitchen.jsx',
        'src/components/waiters/Waiters.jsx',
        'src/components/tokens/TokenManagement.jsx',
        'src/components/orders/ToastOrders.jsx',
        'src/components/settings/UpdateTracker.jsx',
        'src/components/settings/Settings.jsx',
        'ORDER_WORKFLOW_INTEGRATION.md'
      ],
      timestamp: new Date().toISOString()
    }
  ],
  lastUpdated: new Date().toISOString(),
  projectStarted: new Date().toISOString()
};

localStorage.setItem('bakerypos_update_tracker', JSON.stringify(initialData));
console.log('Update tracker initialized with v1 entry');