// Audit Trail System for tracking all data changes

export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PERMISSION_CHANGE: 'permission_change',
  SETTINGS_CHANGE: 'settings_change'
};

export const AuditEntity = {
  ORDER: 'order',
  MENU_ITEM: 'menu_item',
  INVENTORY: 'inventory',
  SUPPLIER: 'supplier',
  PURCHASE_ORDER: 'purchase_order',
  CUSTOMER: 'customer',
  STAFF: 'staff',
  TABLE: 'table',
  PAYMENT: 'payment',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  RECIPE: 'recipe',
  SCHEDULE: 'schedule',
  ATTENDANCE: 'attendance',
  DELIVERY_ORDER: 'delivery_order',
  DELIVERY_RIDER: 'delivery_rider',
  USER: 'user',
  ROLE: 'role',
  SETTINGS: 'settings',
  BACKUP: 'backup'
};

class AuditTrailManager {
  constructor() {
    this.auditLogs = [];
    this.maxLogs = 10000; // Keep last 10,000 logs
    this.loadFromStorage();
  }

  // Load audit logs from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('audit_trail');
        if (stored) {
          this.auditLogs = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading audit trail:', error);
    }
  }

  // Save audit logs to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        // Keep only the most recent logs
        const logsToSave = this.auditLogs.slice(-this.maxLogs);
        localStorage.setItem('audit_trail', JSON.stringify(logsToSave));
      }
    } catch (error) {
      console.error('Error saving audit trail:', error);
    }
  }

  // Log an action
  log({
    userId,
    username,
    action,
    entity,
    entityId,
    entityName,
    changes,
    ipAddress,
    userAgent,
    timestamp = new Date().toISOString()
  }) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp,
      userId,
      username: username || 'Unknown',
      action,
      entity,
      entityId,
      entityName,
      changes: changes || {},
      ipAddress: ipAddress || 'N/A',
      userAgent: userAgent || 'N/A'
    };

    this.auditLogs.push(logEntry);
    this.saveToStorage();

    return logEntry;
  }

  // Generate unique log ID
  generateLogId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get logs by entity
  getLogsByEntity(entity, entityId = null) {
    let logs = this.auditLogs.filter(log => log.entity === entity);
    
    if (entityId) {
      logs = logs.filter(log => log.entityId === entityId);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get logs by user
  getLogsByUser(userId) {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get logs by action
  getLogsByAction(action) {
    return this.auditLogs
      .filter(log => log.action === action)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get logs by date range
  getLogsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get recent logs
  getRecentLogs(limit = 100) {
    return this.auditLogs
      .slice(-limit)
      .reverse();
  }

  // Search logs
  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.auditLogs.filter(log => 
      log.username?.toLowerCase().includes(lowerQuery) ||
      log.entity?.toLowerCase().includes(lowerQuery) ||
      log.entityName?.toLowerCase().includes(lowerQuery) ||
      log.action?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Export logs as JSON
  exportLogs(startDate, endDate) {
    const logs = this.getLogsByDateRange(startDate, endDate);
    return JSON.stringify(logs, null, 2);
  }

  // Clear old logs (older than specified days)
  clearOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const beforeCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );
    
    const cleared = beforeCount - this.auditLogs.length;
    this.saveToStorage();
    
    return cleared;
  }

  // Get statistics
  getStatistics() {
    const stats = {
      totalLogs: this.auditLogs.length,
      byAction: {},
      byEntity: {},
      byUser: {},
      byDate: {}
    };

    this.auditLogs.forEach(log => {
      // By action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // By entity
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      
      // By user
      stats.byUser[log.username] = (stats.byUser[log.username] || 0) + 1;
      
      // By date
      const date = log.timestamp.split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
let auditTrailManager = null;

export const getAuditTrailManager = () => {
  if (!auditTrailManager) {
    auditTrailManager = new AuditTrailManager();
  }
  return auditTrailManager;
};

// Helper function to track changes
export const trackChanges = (oldData, newData) => {
  const changes = {};
  
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  }
  
  return changes;
};

// Higher-order component wrapper for audit logging
export const withAuditLogging = (Component) => {
  return (props) => {
    const auditManager = getAuditTrailManager();
    
    // Add audit logging methods to props
    const enhancedProps = {
      ...props,
      auditLog: (action, entity, entityId, entityName, changes) => {
        auditManager.log({
          userId: props.currentUser?.id,
          username: props.currentUser?.username,
          action,
          entity,
          entityId,
          entityName,
          changes,
          ipAddress: props.ipAddress,
          userAgent: navigator.userAgent
        });
      }
    };
    
    return <Component {...enhancedProps} />;
  };
};
