// Kitchen Order Ticket (KOT) Types and Constants
// Defines the data structure for KOT system

/**
 * KOT Status Enum
 */
export const KOTStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled'
};

/**
 * KOT Priority Enum
 */
export const KOTPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Kitchen Station Types
 */
export const KitchenStation = {
  BAKERY: 'bakery',
  KITCHEN: 'kitchen',
  BEVERAGE: 'beverage',
  DESSERT: 'dessert',
  GRILL: 'grill',
  FRYER: 'fryer',
  COLD: 'cold',
  GENERAL: 'general'
};

/**
 * KOT Item Status
 */
export const KOTItemStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled'
};

/**
 * Default KOT configuration
 */
export const DEFAULT_KOT_CONFIG = {
  autoPrint: true,
  autoRoute: true,
  consolidateItems: true,
  showPreparationTime: true,
  showCustomerInfo: true,
  showTableInfo: true,
  defaultPriority: KOTPriority.NORMAL,
  preparationTimeEstimate: 15, // minutes
  kotRetentionDays: 30
};

/**
 * Create a new KOT
 * @param {object} orderData - Order data from POS
 * @param {object} config - KOT configuration
 * @returns {object} KOT object
 */
export function createKOT(orderData, config = DEFAULT_KOT_CONFIG) {
  console.log('createKOT called with orderData:', orderData);
  const kotId = generateKOTId();
  const timestamp = new Date().toISOString();
  
  // Group items by kitchen station
  const itemsByStation = groupItemsByStation(orderData.items);
  
  // Calculate estimated preparation time
  const estimatedPrepTime = calculatePreparationTime(orderData.items, config);
  
  const kot = {
    kotId,
    orderId: orderData.orderId,
    orderNumber: orderData.orderNumber,
    status: KOTStatus.PENDING,
    priority: orderData.priority || config.defaultPriority,
    createdAt: timestamp,
    updatedAt: timestamp,
    estimatedReadyAt: new Date(Date.now() + estimatedPrepTime * 60000).toISOString(),
    actualReadyAt: null,
    preparationTime: estimatedPrepTime,
    customer: {
      name: orderData.customerName || 'Walk-in',
      phone: orderData.customerPhone || null,
      table: orderData.tableNumber || null
    },
    terminal: orderData.terminal || 'Main',
    staff: {
      id: orderData.staffId,
      name: orderData.staffName
    },
    items: orderData.items.map(item => ({
      ...item,
      kotItemId: generateKOTItemId(),
      status: KOTItemStatus.PENDING,
      station: determineStation(item.category),
      notes: item.notes || '',
      quantity: item.quantity,
      modifications: item.modifications || []
    })),
    itemsByStation,
    totalItems: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
    notes: orderData.notes || '',
    modifications: orderData.modifications || [],
    consolidated: config.consolidateItems,
    token: orderData.token || null
  };
  
  console.log('KOT object created:', kot);
  return kot;
}

/**
 * Generate unique KOT ID
 * @returns {string} KOT ID
 */
function generateKOTId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `KOT-${dateStr}-${random}`;
}

/**
 * Generate unique KOT item ID
 * @returns {string} KOT item ID
 */
function generateKOTItemId() {
  return `KOTI-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
}

/**
 * Determine kitchen station for an item
 * @param {string} category - Item category
 * @returns {string} Kitchen station
 */
function determineStation(category) {
  const cat = (category || '').toLowerCase();
  const stationMap = {
    'bakery': KitchenStation.BAKERY,
    'bread': KitchenStation.BAKERY,
    'cake': KitchenStation.BAKERY,
    'pastry': KitchenStation.BAKERY,
    'coffee': KitchenStation.BEVERAGE,
    'tea': KitchenStation.BEVERAGE,
    'juice': KitchenStation.BEVERAGE,
    'beverage': KitchenStation.BEVERAGE,
    'cocktails': KitchenStation.BEVERAGE,
    'drinks': KitchenStation.BEVERAGE,
    'dessert': KitchenStation.DESSERT,
    'ice cream': KitchenStation.DESSERT,
    'grill': KitchenStation.GRILL,
    'steak': KitchenStation.GRILL,
    'steaks': KitchenStation.GRILL,
    'fry': KitchenStation.FRYER,
    'cold': KitchenStation.COLD,
    'salad': KitchenStation.COLD
  };
  
  return stationMap[cat] || KitchenStation.GENERAL;
}

/**
 * Group items by kitchen station
 * @param {Array} items - Order items
 * @returns {object} Items grouped by station
 */
function groupItemsByStation(items) {
  const grouped = {};
  
  items.forEach(item => {
    const station = determineStation(item.category);
    if (!grouped[station]) {
      grouped[station] = [];
    }
    grouped[station].push(item);
  });
  
  return grouped;
}

/**
 * Calculate estimated preparation time
 * @param {Array} items - Order items
 * @param {object} config - KOT configuration
 * @returns {number} Estimated time in minutes
 */
function calculatePreparationTime(items, config) {
  const baseTime = config.preparationTimeEstimate || 15;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Add time based on item count
  const timePerItem = 2; // minutes per item
  const additionalTime = Math.max(0, (itemCount - 1) * timePerItem);
  
  return baseTime + additionalTime;
}

/**
 * Update KOT item status
 * @param {object} kot - KOT object
 * @param {string} kotItemId - KOT item ID
 * @param {string} status - New status
 * @returns {object} Updated KOT
 */
export function updateKOTItemStatus(kot, kotItemId, status) {
  const item = kot.items.find(i => i.kotItemId === kotItemId);
  
  if (item) {
    item.status = status ? status.toLowerCase() : status;
    kot.updatedAt = new Date().toISOString();
    
    // Update overall KOT status based on item statuses
    updateKOTOverallStatus(kot);
  }
  
  return kot;
}

/**
 * Update overall KOT status based on item statuses
 * @param {object} kot - KOT object
 */
function updateKOTOverallStatus(kot) {
  const itemStatuses = kot.items.map(i => i.status);
  
  // If any item is cancelled, check if all are cancelled
  if (itemStatuses.every(s => s === KOTItemStatus.CANCELLED)) {
    kot.status = KOTStatus.CANCELLED;
    return;
  }
  
  // If all items are served, mark KOT as served
  if (itemStatuses.every(s => s === KOTItemStatus.SERVED || s === KOTItemStatus.CANCELLED)) {
    kot.status = KOTStatus.SERVED;
    kot.actualReadyAt = new Date().toISOString();
    return;
  }
  
  // If all items are ready, mark KOT as ready
  if (itemStatuses.every(s => s === KOTItemStatus.READY || s === KOTItemStatus.SERVED || s === KOTItemStatus.CANCELLED)) {
    kot.status = KOTStatus.READY;
    return;
  }
  
  // If any item is preparing, mark KOT as preparing
  if (itemStatuses.some(s => s === KOTItemStatus.PREPARING)) {
    kot.status = KOTStatus.PREPARING;
    return;
  }
  
  // Default to pending
  kot.status = KOTStatus.PENDING;
}

/**
 * Format KOT for display
 * @param {object} kot - KOT object
 * @returns {object} Formatted KOT
 */
export function formatKOTForDisplay(kot) {
  return {
    ...kot,
    createdAtFormatted: new Date(kot.createdAt).toLocaleString(),
    estimatedReadyAtFormatted: new Date(kot.estimatedReadyAt).toLocaleString(),
    actualReadyAtFormatted: kot.actualReadyAt ? new Date(kot.actualReadyAt).toLocaleString() : null,
    timeElapsed: Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000), // minutes
    isOverdue: new Date() > new Date(kot.estimatedReadyAt) && kot.status !== KOTStatus.SERVED,
    pendingItems: kot.items.filter(i => i.status === KOTItemStatus.PENDING).length,
    preparingItems: kot.items.filter(i => i.status === KOTItemStatus.PREPARING).length,
    readyItems: kot.items.filter(i => i.status === KOTItemStatus.READY).length,
    servedItems: kot.items.filter(i => i.status === KOTItemStatus.SERVED).length
  };
}

/**
 * Filter KOTs by status
 * @param {Array} kots - Array of KOTs
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered KOTs
 */
export function filterKOTsByStatus(kots, status) {
  return kots.filter(kot => kot.status === status);
}

/**
 * Filter KOTs by station
 * @param {Array} kots - Array of KOTs
 * @param {string} station - Station to filter by
 * @returns {Array} Filtered KOTs
 */
export function filterKOTsByStation(kots, station) {
  return kots.filter(kot => 
    kot.items.some(item => item.station === station)
  );
}

/**
 * Sort KOTs by priority and time
 * @param {Array} kots - Array of KOTs
 * @returns {Array} Sorted KOTs
 */
export function sortKOTs(kots) {
  const priorityOrder = {
    [KOTPriority.URGENT]: 0,
    [KOTPriority.HIGH]: 1,
    [KOTPriority.NORMAL]: 2,
    [KOTPriority.LOW]: 3
  };
  
  return [...kots].sort((a, b) => {
    // Sort by priority first
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by creation time (older first)
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}
