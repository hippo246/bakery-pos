// Database Connection Pool Recovery
// Detect stale connections, auto-reconnect with exponential backoff, health checks, fallback to read replica

export class DatabaseConnectionPool {
  constructor(options = {}) {
    this.options = {
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      connectionTimeout: options.connectionTimeout || 30000, // 30 seconds
      idleTimeout: options.idleTimeout || 60000, // 1 minute
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      retryMultiplier: options.retryMultiplier || 2,
      autoReconnect: options.autoReconnect !== false,
      fallbackToReplica: options.fallbackToReplica !== false,
      ...options
    };
    
    this.connections = new Map();
    this.primaryConfig = options.primaryConfig || null;
    this.replicaConfig = options.replicaConfig || null;
    this.currentConfig = this.primaryConfig;
    this.isUsingReplica = false;
    this.healthCheckTimer = null;
    this.eventHandlers = new Map();
    this.connectionCount = 0;
    this.isHealthy = true;
  }

  /**
   * Initialize connection pool
   */
  async initialize() {
    console.log('[DatabaseConnectionPool] Initializing connection pool');
    
    // Create minimum connections
    const connectionsToCreate = this.options.minConnections;
    
    for (let i = 0; i < connectionsToCreate; i++) {
      await this.createConnection();
    }
    
    // Start health checks
    this.startHealthChecks();
    
    console.log(`[DatabaseConnectionPool] Initialized with ${this.connectionCount} connections`);
  }

  /**
   * Create a new connection
   */
  async createConnection() {
    if (this.connectionCount >= this.options.maxConnections) {
      console.warn('[DatabaseConnectionPool] Max connections reached');
      return null;
    }
    
    const connectionId = this.generateConnectionId();
    
    try {
      const connection = await this.establishConnection(this.currentConfig);
      
      this.connections.set(connectionId, {
        id: connectionId,
        connection,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isHealthy: true,
        retryCount: 0
      });
      
      this.connectionCount++;
      
      console.log(`[DatabaseConnectionPool] Created connection: ${connectionId}`);
      
      this.emit('connectionCreated', { connectionId });
      
      return connectionId;
    } catch (error) {
      console.error('[DatabaseConnectionPool] Failed to create connection:', error);
      
      // Try fallback to replica if enabled
      if (this.options.fallbackToReplica && !this.isUsingReplica && this.replicaConfig) {
        console.log('[DatabaseConnectionPool] Falling back to replica');
        await this.switchToReplica();
        return await this.createConnection();
      }
      
      throw error;
    }
  }

  /**
   * Establish connection to database
   */
  async establishConnection(config) {
    // This would use the actual database connection library
    // For now, simulate connection
    console.log('[DatabaseConnectionPool] Establishing connection to:', config?.host || 'database');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock connection
    return {
      connected: true,
      config
    };
  }

  /**
   * Get a connection from the pool
   */
  async getConnection() {
    // Find an available healthy connection
    for (const [connectionId, conn] of this.connections) {
      if (conn.isHealthy && (Date.now() - conn.lastUsed) < this.options.idleTimeout) {
        conn.lastUsed = Date.now();
        return conn.connection;
      }
    }
    
    // No available connection, create new one
    const newConnectionId = await this.createConnection();
    
    if (newConnectionId) {
      const newConn = this.connections.get(newConnectionId);
      return newConn.connection;
    }
    
    throw new Error('No available connections');
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connection) {
    // Find connection by reference
    for (const [connectionId, conn] of this.connections) {
      if (conn.connection === connection) {
        conn.lastUsed = Date.now();
        return;
      }
    }
  }

  /**
   * Execute query with retry logic
   */
  async executeQuery(query, params = []) {
    let lastError = null;
    let attempt = 0;
    
    while (attempt < this.options.maxRetries) {
      try {
        const connection = await this.getConnection();
        
        // Health check before query
        if (!await this.checkConnectionHealth(connection)) {
          throw new Error('Connection unhealthy');
        }
        
        // Execute query (simulated)
        const result = await this.executeQueryOnConnection(connection, query, params);
        
        this.releaseConnection(connection);
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        
        console.error(`[DatabaseConnectionPool] Query failed (attempt ${attempt}):`, error);
        
        if (attempt < this.options.maxRetries) {
          // Exponential backoff
          const delay = this.options.retryDelay * Math.pow(this.options.retryMultiplier, attempt - 1);
          await this.delay(delay);
          
          // Try to reconnect
          if (this.options.autoReconnect) {
            await this.reconnect();
          }
        }
      }
    }
    
    // All retries failed, try fallback to replica
    if (this.options.fallbackToReplica && !this.isUsingReplica && this.replicaConfig) {
      console.log('[DatabaseConnectionPool] Query failed, trying replica');
      await this.switchToReplica();
      return await this.executeQuery(query, params);
    }
    
    throw lastError;
  }

  /**
   * Execute query on specific connection
   */
  async executeQueryOnConnection(connection, query, params) {
    // This would use the actual database query method
    // For now, simulate query
    console.log('[DatabaseConnectionPool] Executing query:', query);
    
    // Simulate query delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      rows: [],
      query
    };
  }

  /**
   * Check connection health
   */
  async checkConnectionHealth(connection) {
    try {
      // Execute a simple health check query
      await this.executeQueryOnConnection(connection, 'SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
    
    console.log('[DatabaseConnectionPool] Health checks started');
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('[DatabaseConnectionPool] Health checks stopped');
    }
  }

  /**
   * Perform health checks on all connections
   */
  async performHealthChecks() {
    const unhealthyConnections = [];
    
    for (const [connectionId, conn] of this.connections) {
      const isHealthy = await this.checkConnectionHealth(conn.connection);
      
      if (!isHealthy) {
        conn.isHealthy = false;
        unhealthyConnections.push(connectionId);
      } else {
        conn.isHealthy = true;
      }
    }
    
    // Remove unhealthy connections
    for (const connectionId of unhealthyConnections) {
      await this.removeConnection(connectionId);
    }
    
    // Recreate connections if below minimum
    if (this.connectionCount < this.options.minConnections) {
      const needed = this.options.minConnections - this.connectionCount;
      for (let i = 0; i < needed; i++) {
        await this.createConnection();
      }
    }
    
    // Update overall health status
    const wasHealthy = this.isHealthy;
    this.isHealthy = unhealthyConnections.length === 0;
    
    if (wasHealthy && !this.isHealthy) {
      this.emit('poolUnhealthy', { unhealthyCount: unhealthyConnections.length });
    } else if (!wasHealthy && this.isHealthy) {
      this.emit('poolHealthy', {});
    }
  }

  /**
   * Remove connection
   */
  async removeConnection(connectionId) {
    const conn = this.connections.get(connectionId);
    
    if (conn) {
      try {
        // Close connection
        await this.closeConnection(conn.connection);
      } catch (error) {
        console.error(`[DatabaseConnectionPool] Failed to close connection ${connectionId}:`, error);
      }
      
      this.connections.delete(connectionId);
      this.connectionCount--;
      
      console.log(`[DatabaseConnectionPool] Removed connection: ${connectionId}`);
      
      this.emit('connectionRemoved', { connectionId });
    }
  }

  /**
   * Close connection
   */
  async closeConnection(connection) {
    // This would close the actual database connection
    console.log('[DatabaseConnectionPool] Closing connection');
  }

  /**
   * Reconnect to database
   */
  async reconnect() {
    console.log('[DatabaseConnectionPool] Reconnecting to database');
    
    // Close all existing connections
    const connectionIds = Array.from(this.connections.keys());
    
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId);
    }
    
    // Recreate connections
    await this.initialize();
    
    this.emit('reconnected', {});
  }

  /**
   * Switch to replica
   */
  async switchToReplica() {
    if (!this.replicaConfig) {
      console.warn('[DatabaseConnectionPool] No replica config available');
      return;
    }
    
    console.log('[DatabaseConnectionPool] Switching to replica');
    
    this.currentConfig = this.replicaConfig;
    this.isUsingReplica = true;
    
    await this.reconnect();
    
    this.emit('switchedToReplica', {});
  }

  /**
   * Switch to primary
   */
  async switchToPrimary() {
    if (!this.primaryConfig) {
      console.warn('[DatabaseConnectionPool] No primary config available');
      return;
    }
    
    console.log('[DatabaseConnectionPool] Switching to primary');
    
    this.currentConfig = this.primaryConfig;
    this.isUsingReplica = false;
    
    await this.reconnect();
    
    this.emit('switchedToPrimary', {});
  }

  /**
   * Get pool statistics
   */
  getStatistics() {
    const healthyCount = Array.from(this.connections.values()).filter(c => c.isHealthy).length;
    
    return {
      totalConnections: this.connectionCount,
      healthyConnections: healthyCount,
      unhealthyConnections: this.connectionCount - healthyCount,
      maxConnections: this.options.maxConnections,
      minConnections: this.options.minConnections,
      isHealthy: this.isHealthy,
      isUsingReplica: this.isUsingReplica,
      currentConfig: this.currentConfig
    };
  }

  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Set primary config
   */
  setPrimaryConfig(config) {
    this.primaryConfig = config;
    
    if (!this.isUsingReplica) {
      this.currentConfig = config;
    }
  }

  /**
   * Set replica config
   */
  setReplicaConfig(config) {
    this.replicaConfig = config;
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
          console.error(`[DatabaseConnectionPool] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the connection pool
   */
  async destroy() {
    this.stopHealthChecks();
    
    // Close all connections
    const connectionIds = Array.from(this.connections.keys());
    
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId);
    }
    
    this.eventHandlers.clear();
    
    console.log('[DatabaseConnectionPool] Destroyed');
  }
}

// Singleton instance
let databaseConnectionPoolInstance = null;

/**
 * Get the singleton database connection pool instance
 */
export function getDatabaseConnectionPool(options = {}) {
  if (!databaseConnectionPoolInstance) {
    databaseConnectionPoolInstance = new DatabaseConnectionPool(options);
  }
  return databaseConnectionPoolInstance;
}

export default DatabaseConnectionPool;
