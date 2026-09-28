// Audit trail system for tracking system changes

export const AuditEvent = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  TABLE_ASSIGNED: 'TABLE_ASSIGNED',
  TABLE_RELEASED: 'TABLE_RELEASED',
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  STAFF_ASSIGNED: 'STAFF_ASSIGNED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

export const createAuditEntry = (eventType, details, userId = 'system') => {
  return {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    details,
    ipAddress: 'local', // In production, this would be the actual IP
    userAgent: navigator.userAgent
  };
};

export const logAuditEvent = (eventType, details, userId) => {
  try {
    const auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
    const entry = createAuditEntry(eventType, details, userId);
    auditLog.push(entry);
    
    // Keep only last 1000 audit entries
    if (auditLog.length > 1000) {
      auditLog.splice(0, auditLog.length - 1000);
    }
    
    localStorage.setItem('audit_log', JSON.stringify(auditLog));
    return entry;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    return null;
  }
};

export const getAuditLog = (filters = {}) => {
  try {
    const auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
    
    let filtered = auditLog;
    
    if (filters.eventType) {
      filtered = filtered.filter(entry => entry.eventType === filters.eventType);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
    }
    
    return filtered.slice().reverse();
  } catch (error) {
    console.error('Failed to get audit log:', error);
    return [];
  }
};

export const exportAuditLog = () => {
  const auditLog = getAuditLog();
  const csv = [
    ['ID', 'Event Type', 'User ID', 'Timestamp', 'Details'],
    ...auditLog.map(entry => [
      entry.id,
      entry.eventType,
      entry.userId,
      entry.timestamp,
      JSON.stringify(entry.details)
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
