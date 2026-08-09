// WebSocket Reconnection Manager
// Auto-reconnect kitchen display, sync missed orders, heartbeat, offline mode with queue

export class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      offlineMode: options.offlineMode !== false,
      queueOfflineMessages: options.queueOfflineMessages !== false,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.isReconnecting = false;
    this.heartbeatTimer = null;
    this.messageQueue = [];
    this.offlineQueue = [];
    this.eventHandlers = new Map();
    this.connectionState = 'disconnected';
    this.lastConnectedAt = null;
    this.lastMessageAt = null;
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    try {
      console.log('[WebSocketManager] Connecting to:', this.url);
      this.connectionState = 'connecting';
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      
    } catch (error) {
      console.error('[WebSocketManager] Connection failed:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Handle connection open
   */
  handleOpen() {
    console.log('[WebSocketManager] Connected');
    this.isConnected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.connectionState = 'connected';
    this.lastConnectedAt = Date.now();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Sync offline messages
    this.syncOfflineMessages();
    
    // Emit connected event
    this.emit('connected', { timestamp: Date.now() });
  }

  /**
   * Handle connection close
   */
  handleClose(event) {
    console.log('[WebSocketManager] Connection closed:', event.code, event.reason);
    this.isConnected = false;
    this.connectionState = 'disconnected';
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Attempt reconnection if not intentional close
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
    
    // Emit disconnected event
    this.emit('disconnected', { code: event.code, reason: event.reason });
  }

  /**
   * Handle connection error
   */
  handleError(error) {
    console.error('[WebSocketManager] Connection error:', error);
    this.handleConnectionError(error);
  }

  /**
   * Handle connection error
   */
  handleConnectionError(error) {
    this.connectionState = 'error';
    this.emit('error', { error });
    
    if (this.options.offlineMode) {
      this.enableOfflineMode();
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(event) {
    this.lastMessageAt = Date.now();
    
    try {
      const data = JSON.parse(event.data);
      this.emit('message', data);
    } catch (error) {
      console.error('[WebSocketManager] Failed to parse message:', error);
      this.emit('message', event.data);
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  attemptReconnect() {
    if (this.isReconnecting) {
      return;
    }
    
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WebSocketManager] Max reconnection attempts reached');
      this.connectionState = 'failed';
      this.emit('reconnectFailed', { attempts: this.reconnectAttempts });
      
      if (this.options.offlineMode) {
        this.enableOfflineMode();
      }
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff
    const backoffTime = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    console.log(`[WebSocketManager] Reconnecting in ${backoffTime}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    this.connectionState = 'reconnecting';
    
    this.emit('reconnecting', { attempt: this.reconnectAttempts, backoffTime });
    
    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, backoffTime);
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendHeartbeat();
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat() {
    this.send({ type: 'heartbeat', timestamp: Date.now() });
  }

  /**
   * Send message
   */
  send(data) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        return { success: true };
      } catch (error) {
        console.error('[WebSocketManager] Failed to send message:', error);
        
        if (this.options.queueOfflineMessages) {
          this.queueOfflineMessage(data);
        }
        
        return { success: false, error: error.message };
      }
    } else {
      // Queue message if offline
      if (this.options.queueOfflineMessages) {
        this.queueOfflineMessage(data);
      }
      
      return { success: false, error: 'Not connected' };
    }
  }

  /**
   * Queue offline message
   */
  queueOfflineMessage(data) {
    const message = {
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };
    
    this.offlineQueue.push(message);
    
    // Persist to localStorage
    this.saveOfflineQueue();
    
    console.log('[WebSocketManager] Message queued for offline:', message.id);
  }

  /**
   * Sync offline messages when reconnected
   */
  syncOfflineMessages() {
    if (this.offlineQueue.length === 0) {
      return;
    }
    
    console.log(`[WebSocketManager] Syncing ${this.offlineQueue.length} offline messages`);
    
    const syncedMessages = [];
    const failedMessages = [];
    
    this.offlineQueue.forEach(message => {
      const result = this.send(message.data);
      
      if (result.success) {
        syncedMessages.push(message.id);
      } else {
        failedMessages.push(message);
      }
    });
    
    // Remove synced messages
    this.offlineQueue = failedMessages;
    this.saveOfflineQueue();
    
    this.emit('offlineSynced', {
      synced: syncedMessages.length,
      failed: failedMessages.length
    });
  }

  /**
   * Save offline queue to localStorage
   */
  saveOfflineQueue() {
    try {
      localStorage.setItem('cafeos_ws_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('[WebSocketManager] Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  loadOfflineQueue() {
    try {
      const stored = localStorage.getItem('cafeos_ws_offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[WebSocketManager] Failed to load offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue() {
    this.offlineQueue = [];
    localStorage.removeItem('cafeos_ws_offline_queue');
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode() {
    console.log('[WebSocketManager] Enabling offline mode');
    this.connectionState = 'offline';
    this.emit('offlineMode', { enabled: true });
  }

  /**
   * Disable offline mode
   */
  disableOfflineMode() {
    console.log('[WebSocketManager] Disabling offline mode');
    this.connectionState = 'connected';
    this.emit('offlineMode', { enabled: false });
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          console.error(`[WebSocketManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStatistics() {
    const uptime = this.lastConnectedAt ? Date.now() - this.lastConnectedAt : 0;
    const timeSinceLastMessage = this.lastMessageAt ? Date.now() - this.lastMessageAt : 0;
    
    return {
      connectionState: this.connectionState,
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      uptime: uptime,
      timeSinceLastMessage: timeSinceLastMessage,
      offlineQueueSize: this.offlineQueue.length,
      lastConnectedAt: this.lastConnectedAt,
      lastMessageAt: this.lastMessageAt
    };
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
    }
    
    this.isConnected = false;
    this.connectionState = 'disconnected';
  }

  /**
   * Destroy the WebSocket manager
   */
  destroy() {
    this.disconnect();
    this.eventHandlers.clear();
    this.clearOfflineQueue();
    console.log('[WebSocketManager] Destroyed');
  }
}

/**
 * Kitchen Display WebSocket Manager
 * Specialized for kitchen display connections
 */
export class KitchenDisplayWebSocketManager extends WebSocketManager {
  constructor(url, options = {}) {
    super(url, {
      ...options,
      reconnectInterval: options.reconnectInterval || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || 20,
      heartbeatInterval: options.heartbeatInterval || 15000
    });
    
    this.missedOrders = [];
    this.loadMissedOrders();
  }

  /**
   * Handle incoming message
   */
  handleMessage(event) {
    super.handleMessage(event);
    
    try {
      const data = JSON.parse(event.data);
      
      // Track orders
      if (data.type === 'order' || data.type === 'order_update') {
        this.trackOrder(data);
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  /**
   * Track order
   */
  trackOrder(orderData) {
    const orderId = orderData.orderId || orderData.id;
    
    if (orderId) {
      // Remove from missed orders if present
      this.missedOrders = this.missedOrders.filter(o => o.orderId !== orderId);
      this.saveMissedOrders();
    }
  }

  /**
   * Load missed orders from localStorage
   */
  loadMissedOrders() {
    try {
      const stored = localStorage.getItem('cafeos_kds_missed_orders');
      if (stored) {
        this.missedOrders = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[KitchenDisplayWebSocketManager] Failed to load missed orders:', error);
    }
  }

  /**
   * Save missed orders to localStorage
   */
  saveMissedOrders() {
    try {
      localStorage.setItem('cafeos_kds_missed_orders', JSON.stringify(this.missedOrders));
    } catch (error) {
      console.error('[KitchenDisplayWebSocketManager] Failed to save missed orders:', error);
    }
  }

  /**
   * Get missed orders
   */
  getMissedOrders() {
    return this.missedOrders;
  }

  /**
   * Clear missed orders
   */
  clearMissedOrders() {
    this.missedOrders = [];
    localStorage.removeItem('cafeos_kds_missed_orders');
  }

  /**
   * Sync missed orders on reconnection
   */
  syncOfflineMessages() {
    super.syncOfflineMessages();
    
    // Request missed orders from server
    if (this.isConnected) {
      this.send({ type: 'sync_missed_orders', lastSync: this.lastConnectedAt });
    }
  }

  /**
   * Destroy the kitchen display manager
   */
  destroy() {
    super.destroy();
    this.clearMissedOrders();
  }
}

// Singleton instance for kitchen display
let kitchenDisplayWSInstance = null;

/**
 * Get the singleton kitchen display WebSocket instance
 */
export function getKitchenDisplayWebSocket(url, options = {}) {
  if (!kitchenDisplayWSInstance) {
    kitchenDisplayWSInstance = new KitchenDisplayWebSocketManager(url, options);
  }
  return kitchenDisplayWSInstance;
}

// Singleton instance for general WebSocket manager
let webSocketManagerInstance = null;

/**
 * Get the singleton WebSocket manager instance
 * Note: URL must be provided on first call to initialize the instance
 */
export function getWebSocketManager(url = null, options = {}) {
  if (!webSocketManagerInstance) {
    if (!url) {
      throw new Error('WebSocketManager requires a URL on first initialization');
    }
    webSocketManagerInstance = new WebSocketManager(url, options);
  } else if (url && webSocketManagerInstance.url !== url) {
    // Reinitialize if URL changes
    webSocketManagerInstance.destroy();
    webSocketManagerInstance = new WebSocketManager(url, options);
  }
  return webSocketManagerInstance;
}

export default WebSocketManager;
