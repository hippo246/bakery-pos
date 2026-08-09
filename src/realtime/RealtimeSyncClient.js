// Real-time Sync Client (WebSocket Client)
// Client-side WebSocket connection for POS terminals

import { getTerminalManager } from '../terminal/TerminalManager.js';
import { getWebSocketManager } from '../operations/WebSocketManager.js';

export class RealtimeSyncClient {
  constructor(options = {}) {
    this.options = {
      serverUrl: options.serverUrl || 'ws://localhost:3001',
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options
    };
    
    this.terminalManager = getTerminalManager();
    this.wsManager = null;
    this.subscriptions = new Set();
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.terminalId = null;
    this.offlineQueue = [];
    this.heartbeatTimer = null;
  }

  /**
   * Connect to sync server
   */
  async connect(terminalId) {
    this.terminalId = terminalId;
    
    console.log(`[RealtimeSyncClient] Connecting to sync server as ${terminalId}`);
    
    try {
      // Initialize WebSocketManager if not already initialized
      if (!this.wsManager) {
        const { getWebSocketManager } = await import('../operations/WebSocketManager.js');
        this.wsManager = getWebSocketManager(this.options.serverUrl);
      }
      
      // Use WebSocketManager for connection with auto-reconnect
      const wsUrl = this.options.serverUrl;
      await this.wsManager.connect(wsUrl, {
        onMessage: (data) => this.handleMessage(data),
        onConnect: () => this.handleConnect(),
        onDisconnect: () => this.handleDisconnect(),
        onError: (error) => this.handleError(error)
      });
      
      // Send terminal identification
      this.send({
        type: 'identify',
        terminalId: this.terminalId,
        timestamp: Date.now()
      });
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Resubscribe to resources
      this.resubscribe();
      
      // Process offline queue
      this.processOfflineQueue();
      
    } catch (error) {
      console.error('[RealtimeSyncClient] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from sync server
   */
  disconnect() {
    console.log('[RealtimeSyncClient] Disconnecting from sync server');
    
    this.stopHeartbeat();
    
    if (this.wsManager) {
      this.wsManager.disconnect();
    }
    
    this.isConnected = false;
    
    this.emit('disconnected', { terminalId: this.terminalId });
  }

  /**
   * Handle connection established
   */
  handleConnect() {
    console.log('[RealtimeSyncClient] Connected to sync server');
    
    this.isConnected = true;
    
    // Update terminal last seen
    this.terminalManager.updateLastSeen(this.terminalId);
    
    this.emit('connected', { terminalId: this.terminalId });
  }

  /**
   * Handle disconnection
   */
  handleDisconnect() {
    console.log('[RealtimeSyncClient] Disconnected from sync server');
    
    this.isConnected = false;
    
    this.emit('disconnected', { terminalId: this.terminalId });
  }

  /**
   * Handle error
   */
  handleError(error) {
    console.error('[RealtimeSyncClient] WebSocket error:', error);
    
    this.emit('error', { error });
  }

  /**
   * Handle message from server
   */
  handleMessage(data) {
    const message = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Update terminal last seen
    this.terminalManager.updateLastSeen(this.terminalId);
    
    switch (message.type) {
      case 'connected':
        console.log(`[RealtimeSyncClient] Server acknowledged connection: ${message.terminalId}`);
        break;
      
      case 'order_created':
        this.emit('orderCreated', message);
        break;
      
      case 'order_updated':
        this.emit('orderUpdated', message);
        break;
      
      case 'order_deleted':
        this.emit('orderDeleted', message);
        break;
      
      case 'table_updated':
        this.emit('tableUpdated', message);
        break;
      
      case 'inventory_updated':
        this.emit('inventoryUpdated', message);
        break;
      
      case 'resource_locked':
        this.emit('resourceLocked', message);
        break;
      
      case 'resource_unlocked':
        this.emit('resourceUnlocked', message);
        break;
      
      case 'lock_granted':
        this.emit('lockGranted', message);
        break;
      
      case 'lock_denied':
        this.emit('lockDenied', message);
        break;
      
      case 'lock_released':
        this.emit('lockReleased', message);
        break;
      
      default:
        console.log(`[RealtimeSyncClient] Received message: ${message.type}`);
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.isConnected) {
      this.wsManager.send(message);
    } else {
      // Queue for offline mode
      this.offlineQueue.push(message);
      console.log('[RealtimeSyncClient] Queued message (offline):', message.type);
    }
  }

  /**
   * Subscribe to resource
   */
  subscribe(resource) {
    this.subscriptions.add(resource);
    
    this.send({
      type: 'subscribe',
      resource,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
    
    console.log(`[RealtimeSyncClient] Subscribed to ${resource}`);
  }

  /**
   * Unsubscribe from resource
   */
  unsubscribe(resource) {
    this.subscriptions.delete(resource);
    
    this.send({
      type: 'unsubscribe',
      resource,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
    
    console.log(`[RealtimeSyncClient] Unsubscribed from ${resource}`);
  }

  /**
   * Resubscribe to all resources
   */
  resubscribe() {
    this.subscriptions.forEach(resource => {
      this.send({
        type: 'subscribe',
        resource,
        terminalId: this.terminalId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Broadcast order creation
   */
  broadcastOrderCreated(order) {
    this.send({
      type: 'order_created',
      data: order,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast order update
   */
  broadcastOrderUpdated(order) {
    this.send({
      type: 'order_updated',
      data: order,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast order deletion
   */
  broadcastOrderDeleted(orderId) {
    this.send({
      type: 'order_deleted',
      data: { orderId },
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast table update
   */
  broadcastTableUpdated(table) {
    this.send({
      type: 'table_updated',
      data: table,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdated(inventory) {
    this.send({
      type: 'inventory_updated',
      data: inventory,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Request lock on resource
   */
  requestLock(resourceId) {
    this.send({
      type: 'lock_request',
      resourceId,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Release lock on resource
   */
  releaseLock(resourceId) {
    this.send({
      type: 'lock_release',
      resourceId,
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
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
    this.send({
      type: 'heartbeat',
      terminalId: this.terminalId,
      timestamp: Date.now()
    });
  }

  /**
   * Process offline queue
   */
  processOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      return;
    }
    
    console.log(`[RealtimeSyncClient] Processing ${this.offlineQueue.length} queued messages`);
    
    while (this.offlineQueue.length > 0) {
      const message = this.offlineQueue.shift();
      this.send(message);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      terminalId: this.terminalId,
      subscriptions: Array.from(this.subscriptions),
      queuedMessages: this.offlineQueue.length
    };
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
          console.error(`[RealtimeSyncClient] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the sync client
   */
  destroy() {
    this.disconnect();
    this.subscriptions.clear();
    this.offlineQueue = [];
    this.eventHandlers.clear();
    console.log('[RealtimeSyncClient] Destroyed');
  }
}

// Singleton instance
let realtimeSyncClientInstance = null;

/**
 * Get the singleton realtime sync client instance
 */
export function getRealtimeSyncClient(options = {}) {
  if (!realtimeSyncClientInstance) {
    realtimeSyncClientInstance = new RealtimeSyncClient(options);
  }
  return realtimeSyncClientInstance;
}

export default RealtimeSyncClient;
