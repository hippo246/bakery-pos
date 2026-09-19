// Mock data for Kitchen Display System (KDS) and Oracle KDS
// This file contains all hardcoded mock data used in kitchen components

// Default values for Oracle KDS display
export const ORACLE_KDS_DEFAULTS = {
  averagePrepTime: '12:43',
  defaultTime: '10:25',
  orderStartNumber: 36,
  defaultTable: '1',
  defaultStatus: 'PENDING',
  defaultPriority: 'normal',
  defaultOrderType: 'dine-in',
  defaultCreatedBy: 'system'
};

// Base preparation times by category (in minutes)
export const CATEGORY_PREP_TIMES = {
  'Coffee': 3,
  'Food': 10,
  'Bakery': 15,
  'Dessert': 5,
  'Beverage': 2,
  'Special': 8
};

// Default category if not found
export const DEFAULT_CATEGORY_PREP_TIME = 8;

// Sample order data for testing Oracle KDS (can be used for demo)
export const SAMPLE_ORACLE_ORDERS = [
  {
    id: 'ORD-001',
    orderNumber: 36,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      { id: 'm1', name: 'Cappuccino', quantity: 2, category: 'Coffee', status: 'PENDING' },
      { id: 'm5', name: 'Croissant', quantity: 1, category: 'Food', status: 'PENDING' }
    ],
    customer: { name: 'Rohan Mehta', table: '2' },
    status: 'PENDING',
    priority: 'normal',
    orderType: 'dine-in',
    notes: 'Window table'
  },
  {
    id: 'ORD-002',
    orderNumber: 37,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    items: [
      { id: 'm3', name: 'Cold Brew', quantity: 1, category: 'Coffee', status: 'PENDING' },
      { id: 'm7', name: 'Banana Bread', quantity: 2, category: 'Food', status: 'PENDING', modifiers: ['Warmed please'] }
    ],
    customer: { name: 'Priya Sharma', table: null },
    status: 'PENDING',
    priority: 'urgent',
    orderType: 'takeaway',
    notes: ''
  },
  {
    id: 'ORD-003',
    orderNumber: 38,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      { id: 'm4', name: 'Matcha Latte', quantity: 1, category: 'Special', status: 'COMPLETED', modifiers: ['Less sugar'] },
      { id: 'm6', name: 'Avocado Toast', quantity: 1, category: 'Food', status: 'PENDING', modifiers: ['Extra chili'] }
    ],
    customer: { name: 'Ankit Patel', table: null },
    status: 'IN_PROGRESS',
    priority: 'urgent',
    orderType: 'delivery',
    notes: ''
  }
];

// Station names for kitchen routing
export const KITCHEN_STATIONS = [
  { id: 'hot-kitchen', name: 'Hot Kitchen', icon: '🍳' },
  { id: 'cold-kitchen', name: 'Cold Kitchen', icon: '🥗' },
  { id: 'bakery', name: 'Bakery', icon: '🥐' },
  { id: 'grill', name: 'Grill', icon: '🥩' },
  { id: 'beverage', name: 'Beverage', icon: '☕' },
  { id: 'dessert', name: 'Dessert', icon: '🍰' }
];

// Priority levels with colors
export const PRIORITY_LEVELS = {
  urgent: { label: 'URGENT', color: '#ff0000', bg: '#ffe6e6' },
  high: { label: 'HIGH', color: '#ff6600', bg: '#fff0e6' },
  normal: { label: 'NORMAL', color: '#0066cc', bg: '#e6f3ff' },
  low: { label: 'LOW', color: '#666666', bg: '#f0f0f0' },
  deferred: { label: 'DEFERRED', color: '#999999', bg: '#f5f5f5' }
};

// Order types with badges
export const ORDER_TYPES = {
  'dine-in': { label: 'DINE-IN', color: '#0066cc', bg: '#e6f3ff' },
  'takeaway': { label: 'TAKEAWAY', color: '#ff6600', bg: '#fff0e6' },
  'delivery': { label: 'DELIVERY', color: '#00aa00', bg: '#e6ffe6' },
  'drive-thru': { label: 'DRIVE-THRU', color: '#9900cc', bg: '#f3e6ff' }
};

// Status colors for display
export const STATUS_COLORS = {
  PENDING: { color: '#ff6600', bg: '#fff0e6' },
  IN_PROGRESS: { color: '#0066cc', bg: '#e6f3ff' },
  PREPARING: { color: '#0066cc', bg: '#e6f3ff' },
  READY: { color: '#00aa00', bg: '#e6ffe6' },
  COMPLETED: { color: '#00aa00', bg: '#e6ffe6' },
  SERVED: { color: '#666666', bg: '#f0f0f0' },
  CANCELLED: { color: '#cc0000', bg: '#ffe6e6' }
};

// Default printers for kitchen
export const DEFAULT_PRINTERS = [
  { id: 'printer-1', name: 'Kitchen Printer 1', type: 'thermal', status: 'online' },
  { id: 'printer-2', name: 'Kitchen Printer 2', type: 'thermal', status: 'online' },
  { id: 'printer-3', name: 'Bar Printer', type: 'thermal', status: 'offline' }
];

// Default filter values for kitchen display
export const KITCHEN_FILTER_DEFAULTS = {
  station: 'all',
  status: 'all',
  orderType: 'all',
  printer: 'printer-1'
};

// Station filter options
export const STATION_FILTERS = [
  { id: 'all', name: 'All Stations' },
  { id: 'hot-kitchen', name: 'Hot Kitchen' },
  { id: 'cold-kitchen', name: 'Cold Kitchen' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'grill', name: 'Grill' },
  { id: 'beverage', name: 'Beverage' },
  { id: 'dessert', name: 'Dessert' }
];

// Status filter options
export const STATUS_FILTERS = [
  { id: 'all', name: 'All Statuses' },
  { id: 'PENDING', name: 'Pending' },
  { id: 'IN_PROGRESS', name: 'In Progress' },
  { id: 'PREPARING', name: 'Preparing' },
  { id: 'READY', name: 'Ready' },
  { id: 'COMPLETED', name: 'Completed' },
  { id: 'SERVED', name: 'Served' },
  { id: 'CANCELLED', name: 'Cancelled' }
];

// Order type filter options
export const ORDER_TYPE_FILTERS = [
  { id: 'all', name: 'All Types' },
  { id: 'dine-in', name: 'Dine-In' },
  { id: 'takeaway', name: 'Takeaway' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'drive-thru', name: 'Drive-Thru' }
];

// Default station printer
export const DEFAULT_STATION_PRINTER = '';

// Default kitchen stations configuration
export const DEFAULT_KITCHEN_STATIONS = [
  { id: 'BAKERY', name: 'Bakery', enabled: true, printer: null },
  { id: 'KITCHEN', name: 'Kitchen', enabled: true, printer: null },
  { id: 'BEVERAGE', name: 'Beverage', enabled: true, printer: null },
  { id: 'DESSERT', name: 'Dessert', enabled: true, printer: null },
  { id: 'GRILL', name: 'Grill', enabled: false, printer: null },
  { id: 'FRYER', name: 'Fryer', enabled: false, printer: null },
  { id: 'COLD', name: 'Cold', enabled: false, printer: null },
  { id: 'GENERAL', name: 'General', enabled: true, printer: null }
];
