// Real-time Sync Server (WebSocket Server)
// Handles real-time synchronization between multiple POS terminals

export class RealtimeSyncServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3001,
      heartbeatInterval: options.heartbeatInterval || 30000, // 30 seconds
      ...options
    };
    
    this.clients = new Map(); // terminalId -> { ws, lastSeen, subscriptions }
    this.locks = new Map(); // resourceId -> { terminalId, timestamp }
    this.eventHandlers = new Map();
    this.server = null;
    this.heartbeatTimer = null;
  }

  /**
   * Start the WebSocket server
   */
  start() {
    console.log('[RealtimeSyncServer] Starting server on port', this.options.port);
    
    // In a real implementation, this would use ws or Socket.io
    // For now, we'll simulate the server structure
    this.server = {
      on: (event, handler) => {
        this.server[event] = handler;
      }
    };
    
    // Start heartbeat
    this.startHeartbeat();
    
    console.log('[RealtimeSyncServer] Server started');
  }

  /**
   * Stop the WebSocket server
   */
  stop() {
    console.log('[RealtimeSyncServer] Stopping server');
    
    // Close all client connections
    this.clients.forEach((client, terminalId) => {
      this.disconnectClient(terminalId);
    });
    
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    this.server = null;
    
    console.log('[RealtimeSyncServer] Server stopped');
  }

  /**
   * Handle client connection
   */
  handleConnection(ws, terminalId) {
    console.log(`[RealtimeSyncServer] Client connected: ${terminalId}`);
    
    this.clients.set(terminalId, {
      ws,
      terminalId,
      lastSeen: Date.now(),
      subscriptions: new Set()
    });
    
    // Send welcome message
    this.sendToClient(terminalId, {
      type: 'connected',
      terminalId,
      timestamp: Date.now()
    });
    
    this.emit('clientConnected', { terminalId });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(terminalId) {
    console.log(`[RealtimeSyncServer] Client disconnected: ${terminalId}`);
    
    // Release all locks held by this terminal
    this.releaseTerminalLocks(terminalId);
    
    this.clients.delete(terminalId);
    
    this.emit('clientDisconnected', { terminalId });
  }

  /**
   * Handle message from client
   */
  handleMessage(terminalId, message) {
    const client = this.clients.get(terminalId);
    
    if (!client) {
      console.warn(`[RealtimeSyncServer] Message from unknown client: ${terminalId}`);
      return;
    }
    
    client.lastSeen = Date.now();
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(terminalId, message.resource);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscribe(terminalId, message.resource);
        break;
      
      case 'order_created':
        this.broadcastToSubscribers('orders', {
          type: 'order_created',
          data: message.data,
          sourceTerminal: terminalId,
          timestamp: Date.now()
        }, terminalId);
        break;
      
      case 'order_updated':
        this.broadcastToSubscribers('orders', {
          type: 'order_updated',
          data: message.data,
          sourceTerminal: terminalId,
          timestamp: Date.now()
        }, terminalId);
        break;
      
      case 'order_deleted':
        this.broadcastToSubscribers('orders', {
          type: 'order_deleted',
          data: message.data,
          sourceTerminal: terminalId,
          timestamp: Date.now()
        }, terminalId);
        break;
      
      case 'table_updated':
        this.broadcastToSubscribers('tables', {
          type: 'table_updated',
          data: message.data,
          sourceTerminal: terminalId,
          timestamp: Date.now()
        }, terminalId);
        break;
      
      case 'inventory_updated':
        this.broadcastToSubscribers('inventory', {
          type: 'inventory_updated',
          data: message.data,
          sourceTerminal: terminalId,
          timestamp: Date.now()
        }, terminalId);
        break;
      
      case 'lock_request':
        this.handleLockRequest(terminalId, message.resourceId);
        break;
      
      case 'lock_release':
        this.handleLockRelease(terminalId, message.resourceId);
        break;
      
      case 'heartbeat':
        // Update last seen
        client.lastSeen = Date.now();
        break;
      
      default:
        console.warn(`[RealtimeSyncServer] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle subscription request
   */
  handleSubscribe(terminalId, resource) {
    const client = this.clients.get(terminalId);
    
    if (client) {
      client.subscriptions.add(resource);
      
      console.log(`[RealtimeSyncServer] Terminal ${terminalId} subscribed to ${resource}`);
      
      this.emit('subscriptionAdded', { terminalId, resource });
    }
  }

  /**
   * Handle unsubscription request
   */
  handleUnsubscribe(terminalId, resource) {
    const client = this.clients.get(terminalId);
    
    if (client) {
      client.subscriptions.delete(resource);
      
      console.log(`[RealtimeSyncServer] Terminal ${terminalId} unsubscribed from ${resource}`);
      
      this.emit('subscriptionRemoved', { terminalId, resource });
    }
  }

  /**
   * Broadcast message to all subscribers of a resource
   */
  broadcastToSubscribers(resource, message, excludeTerminalId = null) {
    this.clients.forEach((client, terminalId) => {
      // Skip excluded terminal
      if (excludeTerminalId && terminalId === excludeTerminalId) {
        return;
      }
      
      // Check if subscribed to resource
      if (client.subscriptions.has(resource)) {
        this.sendToClient(terminalId, message);
      }
    });
  }

  /**
   * Broadcast message to all clients
   */
  broadcastToAll(message, excludeTerminalId = null) {
    this.clients.forEach((client, terminalId) => {
      if (excludeTerminalId && terminalId === excludeTerminalId) {
        return;
      }
      
      this.sendToClient(terminalId, message);
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(terminalId, message) {
    const client = this.clients.get(terminalId);
    
    if (client && client.ws) {
      try {
        // In real implementation, this would use ws.send()
        console.log(`[RealtimeSyncServer] Sending to ${terminalId}:`, message.type);
        
        this.emit('messageSent', { terminalId, message });
      } catch (error) {
        console.error(`[RealtimeSyncServer] Failed to send to ${terminalId}:`, error);
      }
    }
  }

  /**
   * Handle lock request
   */
  handleLockRequest(terminalId, resourceId) {
    const existingLock = this.locks.get(resourceId);
    
    if (existingLock) {
      // Resource already locked
      this.sendToClient(terminalId, {
        type: 'lock_denied',
        resourceId,
        lockedBy: existingLock.terminalId,
        timestamp: Date.now()
      });
      
      this.emit('lockDenied', { terminalId, resourceId, lockedBy: existingLock.terminalId });
    } else {
      // Grant lock
      this.locks.set(resourceId, {
        terminalId,
        timestamp: Date.now()
      });
      
      this.sendToClient(terminalId, {
        type: 'lock_granted',
        resourceId,
        timestamp: Date.now()
      });
      
      // Notify other subscribers
      this.broadcastToSubscribers('orders', {
        type: 'resource_locked',
        resourceId,
        lockedBy: terminalId,
        timestamp: Date.now()
      }, terminalId);
      
      this.emit('lockGranted', { terminalId, resourceId });
    }
  }

  /**
   * Handle lock release
   */
  handleLockRelease(terminalId, resourceId) {
    const lock = this.locks.get(resourceId);
    
    if (lock && lock.terminalId === terminalId) {
      this.locks.delete(resourceId);
      
      this.sendToClient(terminalId, {
        type: 'lock_released',
        resourceId,
        timestamp: Date.now()
      });
      
      // Notify other subscribers
      this.broadcastToSubscribers('orders', {
        type: 'resource_unlocked',
        resourceId,
        timestamp: Date.now()
      }, terminalId);
      
      this.emit('lockReleased', { terminalId, resourceId });
    }
  }

  /**
   * Release all locks held by a terminal
   */
  releaseTerminalLocks(terminalId) {
    const locksToRelease = [];
    
    this.locks.forEach((lock, resourceId) => {
      if (lock.terminalId === terminalId) {
        locksToRelease.push(resourceId);
      }
    });
    
    locksToRelease.forEach(resourceId => {
      this.locks.delete(resourceId);
      
      this.broadcastToSubscribers('orders', {
        type: 'resource_unlocked',
        resourceId,
        timestamp: Date.now()
      });
    });
    
    console.log(`[RealtimeSyncServer] Released ${locksToRelease.length} locks for ${terminalId}`);
  }

  /**
   * Disconnect client
   */
  disconnectClient(terminalId) {
    const client = this.clients.get(terminalId);
    
    if (client && client.ws) {
      // In real implementation, this would close the WebSocket connection
      this.handleDisconnection(terminalId);
    }
  }

  /**
   * Start heartbeat to detect disconnected clients
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.checkClientHeartbeat();
    }, this.options.heartbeatInterval);
  }

  /**
   * Check client heartbeat
   */
  checkClientHeartbeat() {
    const now = Date.now();
    const timeout = this.options.heartbeatInterval * 2; // 2x heartbeat interval
    
    const disconnectedTerminals = [];
    
    this.clients.forEach((client, terminalId) => {
      if (now - client.lastSeen > timeout) {
        disconnectedTerminals.push(terminalId);
      }
    });
    
    disconnectedTerminals.forEach(terminalId => {
      console.log(`[RealtimeSyncServer] Client timeout: ${terminalId}`);
      this.disconnectClient(terminalId);
    });
  }

  /**
   * Get connected clients
   */
  getConnectedClients() {
    return Array.from(this.clients.keys());
  }

  /**
   * Get client info
   */
  getClientInfo(terminalId) {
    const client = this.clients.get(terminalId);
    
    if (client) {
      return {
        terminalId: client.terminalId,
        lastSeen: client.lastSeen,
        subscriptions: Array.from(client.subscriptions)
      };
    }
    
    return null;
  }

  /**
   * Get all locks
   */
  getAllLocks() {
    return Object.fromEntries(this.locks);
  }

  /**
   * Get lock for resource
   */
  getLock(resourceId) {
    return this.locks.get(resourceId);
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
          console.error(`[RealtimeSyncServer] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the sync server
   */
  destroy() {
    this.stop();
    this.eventHandlers.clear();
    console.log('[RealtimeSyncServer] Destroyed');
  }
}

// Singleton instance
let realtimeSyncServerInstance = null;

/**
 * Get the singleton realtime sync server instance
 */
export function getRealtimeSyncServer(options = {}) {
  if (!realtimeSyncServerInstance) {
    realtimeSyncServerInstance = new RealtimeSyncServer(options);
  }
  return realtimeSyncServerInstance;
}

export default RealtimeSyncServer;
