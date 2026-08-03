// Background Sync Manager
// Manages automatic background synchronization

import { getSyncManager } from './SyncManager.js';
import { getNetworkMonitor } from './NetworkMonitor.js';
import { SyncPriority } from './SyncTypes.js';

export class BackgroundSyncManager {
  constructor() {
    this.syncManager = getSyncManager();
    this.networkMonitor = getNetworkMonitor();
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 30000; // 30 seconds
    this.lastSyncTime = null;
    this.syncCount = 0;
    this.storageKey = 'cafeos_background_sync';
    this.loadState();
  }

  /**
   * Start background synchronization
   */
  start() {
    if (this.isRunning) {
      console.log('[BackgroundSyncManager] Already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.performSync();
    }, this.intervalMs);

    // Perform initial sync
    this.performSync();

    // Subscribe to network events
    this.networkUnsubscribe = this.networkMonitor.subscribe((event, _data) => {
      if (event === 'online') {
        // Sync immediately when coming back online
        this.performSync();
      }
    });

    console.log('[BackgroundSyncManager] Started');
  }

  /**
   * Stop background synchronization
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }

    console.log('[BackgroundSyncManager] Stopped');
  }

  /**
   * Perform background sync
   */
  async performSync() {
    if (!this.isRunning) {
      return;
    }

    // Check network status
    const networkStatus = this.networkMonitor.getStatus();
    if (networkStatus === 'offline') {
      console.log('[BackgroundSyncManager] Offline, skipping sync');
      return;
    }

    // Check sync filters
    const syncFilters = this.syncManager.getSyncFilters();
    if (syncFilters.manualSync) {
      console.log('[BackgroundSyncManager] Manual sync mode, skipping');
      return;
    }

    if (syncFilters.wifiOnly && !this.networkMonitor.isOnWifi()) {
      console.log('[BackgroundSyncManager] WiFi only mode, not on WiFi');
      return;
    }

    // Check battery status if available
    if (this.shouldPauseForBattery()) {
      console.log('[BackgroundSyncManager] Battery saving mode, pausing sync');
      return;
    }

    // Check network quality
    const qualityScore = this.networkMonitor.getQualityScore();
    if (qualityScore < 30) {
      console.log('[BackgroundSyncManager] Poor network quality, pausing sync');
      return;
    }

    // Perform sync
    try {
      console.log('[BackgroundSyncManager] Performing background sync');
      await this.syncManager.processQueue();
      
      this.lastSyncTime = new Date().toISOString();
      this.syncCount++;
      this.saveState();

      console.log('[BackgroundSyncManager] Background sync completed');
    } catch (error) {
      console.error('[BackgroundSyncManager] Background sync failed:', error);
    }
  }

  /**
   * Check if should pause for battery
   * @returns {boolean} Whether to pause
   */
  shouldPauseForBattery() {
    // Check if battery API is available
    if (!navigator.getBattery) {
      return false;
    }

    // This is a simplified check - in production would use actual battery API
    return false;
  }

  /**
   * Queue an item for background sync
   * @param {object} config - Sync configuration
   * @returns {object} Queue result
   */
  async queueSync(config = {}) {
    return await this.syncManager.queueSync({
      ...config,
      priority: config.priority || SyncPriority.NORMAL
    });
  }

  /**
   * Get background sync statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      lastSyncTime: this.lastSyncTime,
      syncCount: this.syncCount,
      networkStatus: this.networkMonitor.getStatus(),
      qualityScore: this.networkMonitor.getQualityScore()
    };
  }

  /**
   * Set sync interval
   * @param {number} ms - Interval in milliseconds
   */
  setInterval(ms) {
    this.intervalMs = ms;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        lastSyncTime: this.lastSyncTime,
        syncCount: this.syncCount
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save background sync state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.lastSyncTime = parsed.lastSyncTime || null;
        this.syncCount = parsed.syncCount || 0;
      }
    } catch (error) {
      console.error('Failed to load background sync state:', error);
    }
  }

  /**
   * Destroy the background sync manager
   */
  destroy() {
    this.stop();
    localStorage.removeItem(this.storageKey);
    console.log('[BackgroundSyncManager] Destroyed');
  }
}

// Singleton instance
let backgroundSyncManagerInstance = null;

/**
 * Get the singleton background sync manager instance
 * @returns {BackgroundSyncManager} Background sync manager instance
 */
export function getBackgroundSyncManager() {
  if (!backgroundSyncManagerInstance) {
    backgroundSyncManagerInstance = new BackgroundSyncManager();
  }
  return backgroundSyncManagerInstance;
}

export default BackgroundSyncManager;
