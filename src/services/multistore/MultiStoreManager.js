/**
 * Multi-Store Manager
 * Manages multiple store locations, inventory, pricing, and staff assignments
 */

class MultiStoreManager {
  constructor() {
    this.stores = new Map(); // storeId -> store object
    this.currentStoreId = null;
    this.storageKey = 'multistore_data';
    this.listeners = new Set();
    this.loadStores();
  }

  /**
   * Load stores from localStorage
   */
  loadStores() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        data.stores.forEach(store => this.stores.set(store.id, store));
        this.currentStoreId = data.currentStoreId;
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  }

  /**
   * Save stores to localStorage
   */
  saveStores() {
    try {
      const data = {
        stores: Array.from(this.stores.values()),
        currentStoreId: this.currentStoreId
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving stores:', error);
    }
  }

  /**
   * Add new store
   */
  addStore(storeData) {
    const store = {
      id: storeData.id || `STORE-${Date.now()}`,
      name: storeData.name,
      address: storeData.address || '',
      phone: storeData.phone || '',
      email: storeData.email || '',
      gstin: storeData.gstin || '',
      fssaiLicense: storeData.fssaiLicense || '',
      isActive: storeData.isActive !== false,
      location: storeData.location || { lat: 0, lng: 0 },
      businessHours: storeData.businessHours || {
        monday: { open: '09:00', close: '22:00' },
        tuesday: { open: '09:00', close: '22:00' },
        wednesday: { open: '09:00', close: '22:00' },
        thursday: { open: '09:00', close: '22:00' },
        friday: { open: '09:00', close: '22:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { open: '10:00', close: '21:00' }
      },
      pricing: storeData.pricing || {}, // Location-specific pricing
      inventory: storeData.inventory || {}, // Local inventory
      assignedStaff: storeData.assignedStaff || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.stores.set(store.id, store);
    this.saveStores();
    this.emit('store_added', store);
    
    return store;
  }

  /**
   * Update store
   */
  updateStore(storeId, updates) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    const updatedStore = {
      ...store,
      ...updates,
      id: storeId, // Prevent ID change
      updatedAt: new Date().toISOString()
    };

    this.stores.set(storeId, updatedStore);
    this.saveStores();
    this.emit('store_updated', updatedStore);
    
    return updatedStore;
  }

  /**
   * Delete store
   */
  deleteStore(storeId) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    this.stores.delete(storeId);
    this.saveStores();
    this.emit('store_deleted', { storeId });
    
    return { success: true };
  }

  /**
   * Get store by ID
   */
  getStore(storeId) {
    return this.stores.get(storeId);
  }

  /**
   * Get all stores
   */
  getAllStores() {
    return Array.from(this.stores.values());
  }

  /**
   * Get active stores
   */
  getActiveStores() {
    return this.getAllStores().filter(store => store.isActive);
  }

  /**
   * Set current store
   */
  setCurrentStore(storeId) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    this.currentStoreId = storeId;
    this.saveStores();
    this.emit('current_store_changed', store);
    
    return store;
  }

  /**
   * Get current store
   */
  getCurrentStore() {
    if (!this.currentStoreId) {
      const activeStores = this.getActiveStores();
      if (activeStores.length > 0) {
        this.currentStoreId = activeStores[0].id;
        this.saveStores();
      }
    }
    return this.stores.get(this.currentStoreId);
  }

  /**
   * Update store inventory
   */
  updateStoreInventory(storeId, inventory) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    const updatedStore = {
      ...store,
      inventory: {
        ...store.inventory,
        ...inventory
      },
      updatedAt: new Date().toISOString()
    };

    this.stores.set(storeId, updatedStore);
    this.saveStores();
    this.emit('inventory_updated', { storeId, inventory });
    
    return updatedStore;
  }

  /**
   * Transfer stock between stores
   */
  transferStock(fromStoreId, toStoreId, items) {
    const fromStore = this.stores.get(fromStoreId);
    const toStore = this.stores.get(toStoreId);

    if (!fromStore || !toStore) {
      throw new Error('One or both stores not found');
    }

    // Check if from store has sufficient stock
    for (const [itemId, quantity] of Object.entries(items)) {
      const fromStock = fromStore.inventory[itemId] || 0;
      if (fromStock < quantity) {
        throw new Error(`Insufficient stock for item ${itemId}`);
      }
    }

    // Deduct from source
    const updatedFromInventory = { ...fromStore.inventory };
    for (const [itemId, quantity] of Object.entries(items)) {
      updatedFromInventory[itemId] = (updatedFromInventory[itemId] || 0) - quantity;
    }

    // Add to destination
    const updatedToInventory = { ...toStore.inventory };
    for (const [itemId, quantity] of Object.entries(items)) {
      updatedToInventory[itemId] = (updatedToInventory[itemId] || 0) + quantity;
    }

    // Update both stores
    this.updateStoreInventory(fromStoreId, updatedFromInventory);
    this.updateStoreInventory(toStoreId, updatedToInventory);

    // Create transfer record
    const transfer = {
      id: `TRANSFER-${Date.now()}`,
      fromStoreId,
      toStoreId,
      items,
      transferredAt: new Date().toISOString(),
      transferredBy: 'system'
    };

    // Store transfer history (would need separate storage in production)
    const transferHistory = JSON.parse(localStorage.getItem('stock_transfers') || '[]');
    transferHistory.push(transfer);
    localStorage.setItem('stock_transfers', JSON.stringify(transferHistory));

    this.emit('stock_transferred', transfer);
    
    return transfer;
  }

  /**
   * Get location-specific price for item
   */
  getItemPrice(storeId, itemId, defaultPrice) {
    const store = this.stores.get(storeId);
    if (!store || !store.pricing) {
      return defaultPrice;
    }

    return store.pricing[itemId] || defaultPrice;
  }

  /**
   * Set location-specific price
   */
  setItemPrice(storeId, itemId, price) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    const updatedPricing = {
      ...store.pricing,
      [itemId]: price
    };

    return this.updateStore(storeId, { pricing: updatedPricing });
  }

  /**
   * Assign staff to store
   */
  assignStaffToStore(storeId, staffIds) {
    const store = this.stores.get(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    return this.updateStore(storeId, { assignedStaff: staffIds });
  }

  /**
   * Get stores assigned to staff
   */
  getStoresForStaff(staffId) {
    return this.getAllStores().filter(store => 
      store.assignedStaff.includes(staffId)
    );
  }

  /**
   * Get unified inventory across all stores
   */
  getUnifiedInventory() {
    const unifiedInventory = {};

    for (const store of this.stores.values()) {
      for (const [itemId, quantity] of Object.entries(store.inventory || {})) {
        unifiedInventory[itemId] = (unifiedInventory[itemId] || 0) + quantity;
      }
    }

    return unifiedInventory;
  }

  /**
   * Get unified sales data across all stores
   */
  getUnifiedSalesData() {
    // This would integrate with order data from all stores
    // For now, return placeholder structure
    return {
      totalRevenue: 0,
      totalOrders: 0,
      byStore: {},
      byDate: {}
    };
  }

  /**
   * Get store statistics
   */
  getStoreStatistics() {
    const stores = this.getAllStores();
    
    return {
      totalStores: stores.length,
      activeStores: stores.filter(s => s.isActive).length,
      currentStore: this.currentStoreId,
      totalInventoryItems: Object.keys(this.getUnifiedInventory()).length,
      totalStaff: new Set(stores.flatMap(s => s.assignedStaff)).size
    };
  }

  /**
   * Event listener management
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

// Singleton instance
let multiStoreManagerInstance = null;

export function getMultiStoreManager() {
  if (!multiStoreManagerInstance) {
    multiStoreManagerInstance = new MultiStoreManager();
  }
  return multiStoreManagerInstance;
}

export default MultiStoreManager;
