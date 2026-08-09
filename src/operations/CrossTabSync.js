// Cross-Tab Sync Recovery
// Detect conflicting state across tabs, auto-merge or elect master tab, sync via localStorage events

export class CrossTabSync {
  constructor(options = {}) {
    this.options = {
      syncInterval: options.syncInterval || 1000, // 1 second
      conflictResolution: options.conflictResolution || 'timestamp', // 'timestamp', 'manual', 'merge'
      autoElectMaster: options.autoElectMaster !== false,
      ...options
    };
    
    this.tabId = this.generateTabId();
    this.isMaster = false;
    this.otherTabs = new Map();
    this.state = new Map();
    this.syncTimer = null;
    this.eventHandlers = new Map();
    this.lastSync = Date.now();
    
    this.initialize();
  }

  /**
   * Initialize cross-tab sync
   */
  initialize() {
    // Register tab
    this.registerTab();
    
    // Listen for tab events
    this.setupEventListeners();
    
    // Start sync
    this.startSync();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => this.unregisterTab());
    
    console.log(`[CrossTabSync] Initialized with tab ID: ${this.tabId}`);
  }

  /**
   * Generate unique tab ID
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register tab
   */
  registerTab() {
    const tabs = this.getAllTabs();
    tabs.set(this.tabId, {
      id: this.tabId,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    });
    
    this.saveTabs(tabs);
    
    // Elect master if needed
    if (this.options.autoElectMaster) {
      this.electMaster();
    }
  }

  /**
   * Unregister tab
   */
  unregisterTab() {
    const tabs = this.getAllTabs();
    tabs.delete(this.tabId);
    
    this.saveTabs(tabs);
    
    // Re-elect master if we were master
    if (this.isMaster) {
      this.electMaster();
    }
  }

  /**
   * Get all tabs
   */
  getAllTabs() {
    try {
      const stored = localStorage.getItem('cafeos_tabs');
      if (stored) {
        return new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[CrossTabSync] Failed to get tabs:', error);
    }
    
    return new Map();
  }

  /**
   * Save tabs
   */
  saveTabs(tabs) {
    try {
      localStorage.setItem('cafeos_tabs', JSON.stringify(Array.from(tabs)));
    } catch (error) {
      console.error('[CrossTabSync] Failed to save tabs:', error);
    }
  }

  /**
   * Elect master tab
   */
  electMaster() {
    const tabs = this.getAllTabs();
    
    // Clean up stale tabs (not seen in last 5 seconds)
    const now = Date.now();
    const staleThreshold = 5000;
    
    tabs.forEach((tab, tabId) => {
      if (now - tab.lastSeen > staleThreshold) {
        tabs.delete(tabId);
      }
    });
    
    // Update our last seen
    tabs.set(this.tabId, {
      ...tabs.get(this.tabId),
      lastSeen: now
    });
    
    this.saveTabs(tabs);
    
    // Elect oldest tab as master
    let oldestTabId = null;
    let oldestTime = Infinity;
    
    tabs.forEach((tab, tabId) => {
      if (tab.registeredAt < oldestTime) {
        oldestTime = tab.registeredAt;
        oldestTabId = tabId;
      }
    });
    
    if (oldestTabId === this.tabId) {
      if (!this.isMaster) {
        this.isMaster = true;
        console.log(`[CrossTabSync] Elected as master tab: ${this.tabId}`);
        this.emit('masterElected', { tabId: this.tabId });
      }
    } else {
      if (this.isMaster) {
        this.isMaster = false;
        console.log(`[CrossTabSync] Demoted from master. New master: ${oldestTabId}`);
        this.emit('masterDemoted', { newMaster: oldestTabId });
      }
    }
    
    this.otherTabs = tabs;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for sync events
    window.addEventListener('storage', (event) => {
      if (event.key === 'cafeos_sync_event') {
        this.handleSyncEvent(JSON.parse(event.newValue));
      }
    });
    
    // Listen for tab registration
    window.addEventListener('storage', (event) => {
      if (event.key === 'cafeos_tabs') {
        this.electMaster();
      }
    });
  }

  /**
   * Handle sync event
   */
  handleSyncEvent(eventData) {
    if (eventData.tabId === this.tabId) {
      return; // Ignore our own events
    }
    
    const { type, key, value, timestamp, tabId } = eventData;
    
    switch (type) {
      case 'set':
        this.state.set(key, { value, timestamp, tabId });
        this.emit('syncSet', { key, value, tabId });
        break;
      
      case 'delete':
        this.state.delete(key);
        this.emit('syncDelete', { key, tabId });
        break;
      
      case 'conflict':
        this.handleConflict(key, value, timestamp, tabId);
        break;
    }
  }

  /**
   * Handle conflict
   */
  handleConflict(key, remoteValue, remoteTimestamp, remoteTabId) {
    const localValue = this.state.get(key);
    
    if (!localValue) {
      // No local value, accept remote
      this.state.set(key, { value: remoteValue, timestamp: remoteTimestamp, tabId: remoteTabId });
      return;
    }
    
    // Check timestamps
    if (this.options.conflictResolution === 'timestamp') {
      if (remoteTimestamp > localValue.timestamp) {
        // Remote is newer, accept it
        this.state.set(key, { value: remoteValue, timestamp: remoteTimestamp, tabId: remoteTabId });
        this.emit('conflictResolved', { key, resolution: 'remote_wins' });
      } else {
        // Local is newer, keep it
        this.emit('conflictResolved', { key, resolution: 'local_wins' });
      }
    } else if (this.options.conflictResolution === 'manual') {
      this.emit('conflictDetected', {
        key,
        localValue: localValue.value,
        remoteValue,
        localTimestamp: localValue.timestamp,
        remoteTimestamp,
        remoteTabId
      });
    } else if (this.options.conflictResolution === 'merge') {
      // Attempt merge
      const merged = this.mergeValues(localValue.value, remoteValue);
      this.state.set(key, { value: merged, timestamp: Date.now(), tabId: this.tabId });
      this.emit('conflictResolved', { key, resolution: 'merged' });
    }
  }

  /**
   * Merge values
   */
  mergeValues(local, remote) {
    if (typeof local === 'object' && typeof remote === 'object' && !Array.isArray(local) && !Array.isArray(remote)) {
      return { ...local, ...remote };
    }
    
    // Can't merge, return remote
    return remote;
  }

  /**
   * Start sync
   */
  startSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.sync();
    }, this.options.syncInterval);
    
    console.log('[CrossTabSync] Sync started');
  }

  /**
   * Stop sync
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[CrossTabSync] Sync stopped');
    }
  }

  /**
   * Sync state
   */
  sync() {
    this.lastSync = Date.now();
    
    // Update last seen
    const tabs = this.getAllTabs();
    if (tabs.has(this.tabId)) {
      tabs.set(this.tabId, {
        ...tabs.get(this.tabId),
        lastSeen: Date.now()
      });
      this.saveTabs(tabs);
    }
    
    // Emit sync event if master
    if (this.isMaster) {
      this.broadcastSync();
    }
  }

  /**
   * Broadcast sync event
   */
  broadcastSync() {
    const syncEvent = {
      tabId: this.tabId,
      timestamp: Date.now(),
      type: 'sync',
      state: Object.fromEntries(this.state)
    };
    
    localStorage.setItem('cafeos_sync_event', JSON.stringify(syncEvent));
  }

  /**
   * Set value (syncs across tabs)
   */
  set(key, value) {
    const timestamp = Date.now();
    
    // Check for conflict
    const existing = this.state.get(key);
    if (existing && existing.tabId !== this.tabId && existing.timestamp > timestamp - 1000) {
      // Potential conflict
      this.handleConflict(key, value, timestamp, this.tabId);
    } else {
      this.state.set(key, { value, timestamp, tabId: this.tabId });
    }
    
    // Broadcast to other tabs
    this.broadcastEvent('set', key, value, timestamp);
  }

  /**
   * Get value
   */
  get(key) {
    const entry = this.state.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Delete value (syncs across tabs)
   */
  delete(key) {
    this.state.delete(key);
    this.broadcastEvent('delete', key);
  }

  /**
   * Broadcast event to other tabs
   */
  broadcastEvent(type, key, value = null, timestamp = Date.now()) {
    const event = {
      tabId: this.tabId,
      type,
      key,
      value,
      timestamp
    };
    
    localStorage.setItem('cafeos_sync_event', JSON.stringify(event));
  }

  /**
   * Get all state
   */
  getAllState() {
    return Object.fromEntries(this.state);
  }

  /**
   * Clear all state
   */
  clearState() {
    this.state.clear();
    this.broadcastEvent('clear');
  }

  /**
   * Get sync statistics
   */
  getStatistics() {
    return {
      tabId: this.tabId,
      isMaster: this.isMaster,
      otherTabsCount: this.otherTabs.size - 1,
      stateSize: this.state.size,
      lastSync: this.lastSync,
      syncInterval: this.options.syncInterval
    };
  }

  /**
   * Force master election
   */
  forceMasterElection() {
    this.electMaster();
  }

  /**
   * Become master
   */
  becomeMaster() {
    const tabs = this.getAllTabs();
    
    // Update our registration time to be oldest
    const now = Date.now();
    tabs.set(this.tabId, {
      ...tabs.get(this.tabId),
      registeredAt: 0 // Force oldest
    });
    
    this.saveTabs(tabs);
    this.electMaster();
  }

  /**
   * Update conflict resolution strategy
   */
  setConflictResolution(strategy) {
    this.options.conflictResolution = strategy;
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
          console.error(`[CrossTabSync] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the cross-tab sync
   */
  destroy() {
    this.stopSync();
    this.unregisterTab();
    this.state.clear();
    this.eventHandlers.clear();
    console.log('[CrossTabSync] Destroyed');
  }
}

// Singleton instance
let crossTabSyncInstance = null;

/**
 * Get the singleton cross-tab sync instance
 */
export function getCrossTabSync(options = {}) {
  if (!crossTabSyncInstance) {
    crossTabSyncInstance = new CrossTabSync(options);
  }
  return crossTabSyncInstance;
}

export default CrossTabSync;
