// Expiry Date Tracking for Inventory Items

export const ExpiryStatus = {
  FRESH: 'fresh',
  APPROACHING: 'approaching',
  EXPIRED: 'expired',
  CRITICAL: 'critical'
};

export const ExpiryWarningDays = {
  CRITICAL: 3,      // 3 days or less
  APPROACHING: 7,   // 7 days or less
  FRESH: 30         // More than 7 days
};

class ExpiryTrackingManager {
  constructor() {
    this.expiryRecords = [];
    this.loadFromStorage();
  }

  // Load expiry records from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('expiry_records');
        if (stored) {
          this.expiryRecords = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading expiry records:', error);
    }
  }

  // Save expiry records to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('expiry_records', JSON.stringify(this.expiryRecords));
      }
    } catch (error) {
      console.error('Error saving expiry records:', error);
    }
  }

  // Add expiry record for inventory item
  addExpiryRecord(record) {
    const expiryRecord = {
      id: this.generateId(),
      ...record,
      status: this.calculateStatus(record.expiryDate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notified: false,
      disposed: false
    };

    this.expiryRecords.push(expiryRecord);
    this.saveToStorage();
    
    return expiryRecord;
  }

  // Update expiry record
  updateExpiryRecord(recordId, updates) {
    const index = this.expiryRecords.findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error('Expiry record not found');
    }

    this.expiryRecords[index] = {
      ...this.expiryRecords[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      status: updates.expiryDate ? this.calculateStatus(updates.expiryDate) : this.expiryRecords[index].status
    };

    this.saveToStorage();
    return this.expiryRecords[index];
  }

  // Delete expiry record
  deleteExpiryRecord(recordId) {
    const index = this.expiryRecords.findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error('Expiry record not found');
    }

    this.expiryRecords.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get expiry record by ID
  getExpiryRecord(recordId) {
    return this.expiryRecords.find(r => r.id === recordId);
  }

  // Get all expiry records
  getAllExpiryRecords(filters = {}) {
    let filtered = [...this.expiryRecords];

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.itemId) {
      filtered = filtered.filter(r => r.itemId === filters.itemId);
    }

    if (filters.batchNumber) {
      filtered = filtered.filter(r => r.batchNumber === filters.batchNumber);
    }

    if (filters.disposed !== undefined) {
      filtered = filtered.filter(r => r.disposed === filters.disposed);
    }

    return filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  // Calculate expiry status based on date
  calculateStatus(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= ExpiryWarningDays.CRITICAL) {
      return ExpiryStatus.CRITICAL;
    } else if (daysUntilExpiry <= ExpiryWarningDays.APPROACHING) {
      return ExpiryStatus.APPROACHING;
    } else if (daysUntilExpiry < 0) {
      return ExpiryStatus.EXPIRED;
    } else {
      return ExpiryStatus.FRESH;
    }
  }

  // Get items expiring soon
  getExpiringSoon(days = 7) {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.expiryRecords.filter(r => {
      const expiryDate = new Date(r.expiryDate);
      return expiryDate <= cutoffDate && expiryDate >= now && !r.disposed;
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  // Get expired items
  getExpiredItems() {
    const now = new Date();
    
    return this.expiryRecords.filter(r => {
      const expiryDate = new Date(r.expiryDate);
      return expiryDate < now && !r.disposed;
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  // Get critical items (expiring in 3 days or less)
  getCriticalItems() {
    return this.expiryRecords.filter(r => 
      r.status === ExpiryStatus.CRITICAL && !r.disposed
    ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  // Mark item as disposed
  markAsDisposed(recordId, disposedBy, reason = '') {
    return this.updateExpiryRecord(recordId, {
      disposed: true,
      disposedAt: new Date().toISOString(),
      disposedBy,
      disposalReason: reason
    });
  }

  // Mark notification as sent
  markAsNotified(recordId) {
    return this.updateExpiryRecord(recordId, {
      notified: true,
      notifiedAt: new Date().toISOString()
    });
  }

  // Get items requiring notification
  getItemsRequiringNotification() {
    return this.expiryRecords.filter(r => 
      (r.status === ExpiryStatus.CRITICAL || r.status === ExpiryStatus.APPROACHING) && 
      !r.notified && 
      !r.disposed
    );
  }

  // Get expiry report
  getExpiryReport() {
    const now = new Date();
    
    const fresh = this.expiryRecords.filter(r => r.status === ExpiryStatus.FRESH && !r.disposed);
    const approaching = this.expiryRecords.filter(r => r.status === ExpiryStatus.APPROACHING && !r.disposed);
    const critical = this.expiryRecords.filter(r => r.status === ExpiryStatus.CRITICAL && !r.disposed);
    const expired = this.expiryRecords.filter(r => r.status === ExpiryStatus.EXPIRED && !r.disposed);
    const disposed = this.expiryRecords.filter(r => r.disposed);

    return {
      summary: {
        total: this.expiryRecords.length,
        fresh: fresh.length,
        approaching: approaching.length,
        critical: critical.length,
        expired: expired.length,
        disposed: disposed.length
      },
      items: {
        fresh: fresh.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
        approaching: approaching.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
        critical: critical.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
        expired: expired.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      },
      valueAtRisk: this.calculateValueAtRisk([...critical, ...expired]),
      recommendations: this.generateRecommendations(critical.length, expired.length)
    };
  }

  // Calculate value of items at risk
  calculateValueAtRisk(items) {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitCost || 0);
    }, 0);
  }

  // Generate recommendations based on expiry situation
  generateRecommendations(criticalCount, expiredCount) {
    const recommendations = [];

    if (criticalCount > 0) {
      recommendations.push({
        priority: 'high',
        message: `${criticalCount} items expiring within 3 days. Consider discounting or using immediately.`
      });
    }

    if (expiredCount > 0) {
      recommendations.push({
        priority: 'urgent',
        message: `${expiredCount} items have expired. Dispose immediately and update inventory.`
      });
    }

    if (criticalCount === 0 && expiredCount === 0) {
      recommendations.push({
        priority: 'info',
        message: 'No immediate expiry concerns. Continue regular monitoring.'
      });
    }

    return recommendations;
  }

  // Get expiry statistics by item
  getExpiryByItem(itemId) {
    return this.expiryRecords.filter(r => r.itemId === itemId);
  }

  // Get expiry statistics by category
  getExpiryByCategory(category) {
    return this.expiryRecords.filter(r => r.category === category);
  }

  // Calculate wastage due to expiry
  calculateWastage(startDate, endDate) {
    const disposedInPeriod = this.expiryRecords.filter(r => {
      if (!r.disposed || !r.disposedAt) return false;
      const disposedDate = new Date(r.disposedAt);
      return disposedDate >= new Date(startDate) && disposedDate <= new Date(endDate);
    });

    return {
      count: disposedInPeriod.length,
      value: disposedInPeriod.reduce((sum, item) => sum + (item.quantity * item.unitCost || 0), 0),
      items: disposedInPeriod
    };
  }

  // Generate unique ID
  generateId() {
    return `expiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export expiry report as CSV
  exportToCSV() {
    const headers = ['ID', 'Item ID', 'Item Name', 'Batch Number', 'Quantity', 'Unit Cost', 'Expiry Date', 'Status', 'Disposed', 'Disposed At'];
    const rows = this.expiryRecords.map(r => [
      r.id,
      r.itemId,
      r.itemName,
      r.batchNumber || 'N/A',
      r.quantity,
      r.unitCost || 0,
      r.expiryDate,
      r.status,
      r.disposed ? 'Yes' : 'No',
      r.disposedAt || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Update all statuses (should be called daily)
  updateAllStatuses() {
    let updated = 0;
    
    this.expiryRecords = this.expiryRecords.map(record => {
      const newStatus = this.calculateStatus(record.expiryDate);
      if (newStatus !== record.status) {
        updated++;
        return {
          ...record,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return record;
    });

    this.saveToStorage();
    return updated;
  }
}

// Singleton instance
let expiryTrackingManager = null;

export const getExpiryTrackingManager = () => {
  if (!expiryTrackingManager) {
    expiryTrackingManager = new ExpiryTrackingManager();
  }
  return expiryTrackingManager;
};

// React hook for expiry tracking
export const useExpiryTracking = (itemId) => {
  const manager = getExpiryTrackingManager();

  return {
    addRecord: (record) => manager.addExpiryRecord({ ...record, itemId }),
    getRecords: () => manager.getExpiryByItem(itemId),
    getExpiringSoon: (days) => manager.getExpiringSoon(days),
    updateRecord: (recordId, updates) => manager.updateExpiryRecord(recordId, updates),
    markAsDisposed: (recordId, disposedBy, reason) => manager.markAsDisposed(recordId, disposedBy, reason)
  };
};
