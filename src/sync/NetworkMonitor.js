// Network Monitor
// Monitors network connectivity and status

import { NetworkStatus } from './SyncTypes.js';

export class NetworkMonitor {
  constructor() {
    this.status = NetworkStatus.UNKNOWN;
    this.listeners = new Set();
    this.connectionType = 'unknown';
    this.effectiveType = 'unknown';
    this.downlink = 0;
    this.rtt = 0;
    this.saveData = false;
    this.isOnline = navigator.onLine;
    this.storageKey = 'cafeos_network_monitor';
    this.loadState();
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  initialize() {
    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Set up Network Information API if available
    if (navigator.connection) {
      this.connectionType = navigator.connection.type || 'unknown';
      this.effectiveType = navigator.connection.effectiveType || 'unknown';
      this.downlink = navigator.connection.downlink || 0;
      this.rtt = navigator.connection.rtt || 0;
      this.saveData = navigator.connection.saveData || false;

      navigator.connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Initial status check
    this.updateStatus();
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    this.updateStatus();
    this.notifyListeners('online', { status: this.status });
    console.log('[NetworkMonitor] Connection restored');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    this.status = NetworkStatus.OFFLINE;
    this.notifyListeners('offline', { status: this.status });
    console.log('[NetworkMonitor] Connection lost');
  }

  /**
   * Handle connection change
   */
  handleConnectionChange() {
    if (navigator.connection) {
      this.connectionType = navigator.connection.type || 'unknown';
      this.effectiveType = navigator.connection.effectiveType || 'unknown';
      this.downlink = navigator.connection.downlink || 0;
      this.rtt = navigator.connection.rtt || 0;
      this.saveData = navigator.connection.saveData || false;
    }
    this.updateStatus();
    this.notifyListeners('change', { status: this.status, connection: this.getConnectionInfo() });
  }

  /**
   * Update network status
   */
  async updateStatus() {
    if (!this.isOnline) {
      this.status = NetworkStatus.OFFLINE;
    } else {
      // Try to determine more specific status
      const connectionInfo = this.getConnectionInfo();
      
      if (connectionInfo.rtt > 500) {
        this.status = NetworkStatus.HIGH_LATENCY;
      } else if (connectionInfo.downlink < 0.5) {
        this.status = NetworkStatus.SLOW;
      } else if (connectionInfo.saveData) {
        this.status = NetworkStatus.LIMITED;
      } else {
        this.status = NetworkStatus.ONLINE;
      }
    }

    this.saveState();
  }

  /**
   * Get connection information
   * @returns {object} Connection info
   */
  getConnectionInfo() {
    return {
      isOnline: this.isOnline,
      status: this.status,
      connectionType: this.connectionType,
      effectiveType: this.effectiveType,
      downlink: this.downlink,
      rtt: this.rtt,
      saveData: this.saveData
    };
  }

  /**
   * Get current network status
   * @returns {NetworkStatus} Network status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if online
   * @returns {boolean} Online status
   */
  isNetworkOnline() {
    return this.isOnline;
  }

  /**
   * Check if on WiFi
   * @returns {boolean} WiFi status
   */
  isOnWifi() {
    return this.connectionType === 'wifi';
  }

  /**
   * Check if connection is metered
   * @returns {boolean} Metered status
   */
  isMetered() {
    return this.saveData;
  }

  /**
   * Get connection quality score
   * @returns {number} Quality score (0-100)
   */
  getQualityScore() {
    if (!this.isOnline) return 0;

    let score = 100;

    // Deduct for high latency
    if (this.rtt > 500) {
      score -= 30;
    } else if (this.rtt > 200) {
      score -= 15;
    }

    // Deduct for slow connection
    if (this.downlink < 0.5) {
      score -= 40;
    } else if (this.downlink < 2) {
      score -= 20;
    }

    // Deduct for metered connection
    if (this.saveData) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Subscribe to network events
   * @param {function} listener - Event listener
   * @returns {function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /**
   * Unsubscribe from network events
   * @param {function} listener - Event listener
   */
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify listeners of network events
   * @param {string} event - Event type
   * @param {object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('[NetworkMonitor] Error in listener:', error);
      }
    });
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        status: this.status,
        connectionType: this.connectionType,
        effectiveType: this.effectiveType,
        downlink: this.downlink,
        rtt: this.rtt,
        saveData: this.saveData,
        isOnline: this.isOnline
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save network monitor state:', error);
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
        this.status = parsed.status || NetworkStatus.UNKNOWN;
        this.connectionType = parsed.connectionType || 'unknown';
        this.effectiveType = parsed.effectiveType || 'unknown';
        this.downlink = parsed.downlink || 0;
        this.rtt = parsed.rtt || 0;
        this.saveData = parsed.saveData || false;
        this.isOnline = parsed.isOnline !== undefined ? parsed.isOnline : navigator.onLine;
      }
    } catch (error) {
      console.error('Failed to load network monitor state:', error);
    }
  }

  /**
   * Destroy the network monitor
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if (navigator.connection) {
      navigator.connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }

    this.listeners.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[NetworkMonitor] Destroyed');
  }
}

// Singleton instance
let networkMonitorInstance = null;

/**
 * Get the singleton network monitor instance
 * @returns {NetworkMonitor} Network monitor instance
 */
export function getNetworkMonitor() {
  if (!networkMonitorInstance) {
    networkMonitorInstance = new NetworkMonitor();
  }
  return networkMonitorInstance;
}

export default NetworkMonitor;
