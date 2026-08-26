// GDPR Compliance Features

export const GDPRAction = {
  DATA_EXPORT: 'data_export',
  DATA_DELETION: 'data_deletion',
  CONSENT_UPDATE: 'consent_update',
  DATA_ACCESS_REQUEST: 'data_access_request',
  DATA_PORTABILITY: 'data_portability',
  RIGHT_TO_BE_FORGOTTEN: 'right_to_be_forgotten'
};

export	const ConsentType = {
  MARKETING: 'marketing',
  ANALYTICS: 'analytics',
  PERSONALIZATION: 'personalization',
  THIRD_PARTY: 'third_party',
  LOCATION_TRACKING: 'location_tracking'
};

export const ConsentStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PENDING: 'pending',
  REVOKED: 'revoked'
};

class GDPRManager {
  constructor() {
    this.consentRecords = [];
    this.dataRequests = [];
    this.loadFromStorage();
  }

  // Load consent records from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedConsent = localStorage.getItem('gdpr_consent');
        const storedRequests = localStorage.getItem('gdpr_requests');
        
        if (storedConsent) {
          this.consentRecords = JSON.parse(storedConsent);
        }
        if (storedRequests) {
          this.dataRequests = JSON.parse(storedRequests);
        }
      }
    } catch (error) {
      console.error('Error loading GDPR data:', error);
    }
  }

  // Save consent records to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gdpr_consent', JSON.stringify(this.consentRecords));
        localStorage.setItem('gdpr_requests', JSON.stringify(this.dataRequests));
      }
    } catch (error) {
      console.error('Error saving GDPR data:', error);
    }
  }

  // Record user consent
  recordConsent(customerId, consentType, status, metadata = {}) {
    const consentRecord = {
      id: this.generateId(),
      customerId,
      consentType,
      status,
      timestamp: new Date().toISOString(),
      ipAddress: metadata.ipAddress || 'N/A',
      userAgent: metadata.userAgent || 'N/A',
      consentVersion: '1.0',
      metadata
    };

    // Update or add consent record
    const existingIndex = this.consentRecords.findIndex(
      r => r.customerId === customerId && r.consentType === consentType
    );

    if (existingIndex >= 0) {
      this.consentRecords[existingIndex] = consentRecord;
    } else {
      this.consentRecords.push(consentRecord);
    }

    this.saveToStorage();
    return consentRecord;
  }

  // Check if customer has given consent
  hasConsent(customerId, consentType) {
    const record = this.consentRecords.find(
      r => r.customerId === customerId && 
           r.consentType === consentType && 
           r.status === ConsentStatus.GRANTED
    );
    return !!record;
  }

  // Get all consents for a customer
  getCustomerConsents(customerId) {
    return this.consentRecords.filter(r => r.customerId === customerId);
  }

  // Revoke consent
  revokeConsent(customerId, consentType, reason = '') {
    return this.recordConsent(customerId, consentType, ConsentStatus.REVOKED, { reason });
  }

  // Create data export request
  createDataExportRequest(customerId, requestedBy, format = 'json') {
    const request = {
      id: this.generateId(),
      type: GDPRAction.DATA_EXPORT,
      customerId,
      requestedBy,
      format,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      downloadUrl: null,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    this.dataRequests.push(request);
    this.saveToStorage();
    return request;
  }

  // Create data deletion request
  createDataDeletionRequest(customerId, requestedBy, reason = '') {
    const request = {
      id: this.generateId(),
      type: GDPRAction.DATA_DELETION,
      customerId,
      requestedBy,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      dataToDelete: []
    };

    this.dataRequests.push(request);
    this.saveToStorage();
    return request;
  }

  // Process data export - collect all customer data
  async processExportRequest(requestId, allData) {
    const request = this.dataRequests.find(r => r.id === requestId);
    if (!request) return null;

    try {
      // Collect all customer-related data
      const customerData = {
        personalInfo: allData.customers?.find(c => c.id === request.customerId),
        orders: allData.orders?.filter(o => o.customerId === request.customerId),
        payments: allData.payments?.filter(p => p.customerId === request.customerId),
        reservations: allData.reservations?.filter(r => r.customerId === request.customerId),
        consentRecords: this.getCustomerConsents(request.customerId),
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          requestId: requestId,
          format: request.format
        }
      };

      // Convert to requested format
      let exportData;
      if (request.format === 'json') {
        exportData = JSON.stringify(customerData, null, 2);
      } else if (request.format === 'csv') {
        exportData = this.convertToCSV(customerData);
      }

      request.status = 'completed';
      request.completedAt = new Date().toISOString();
      request.downloadUrl = `data:application/${request.format};base64,${btoa(exportData)}`;
      request.dataExported = customerData;

      this.saveToStorage();
      return request;
    } catch (error) {
      console.error('Error processing export request:', error);
      request.status = 'failed';
      request.error = error.message;
      this.saveToStorage();
      return request;
    }
  }

  // Process data deletion - remove all customer data
  async processDeletionRequest(requestId, dataDeleters) {
    const request = this.dataRequests.find(r => r.id === requestId);
    if (!request) return null;

    try {
      const customerId = request.customerId;
      const deletedItems = [];

      // Delete customer personal info
      if (dataDeleters.deleteCustomer) {
        deletedItems.push({ type: 'customer', id: customerId });
        await dataDeleters.deleteCustomer(customerId);
      }

      // Anonymize orders (remove customer reference)
      if (dataDeleters.anonymizeOrders) {
        const orders = await dataDeleters.anonymizeOrders(customerId);
        deletedItems.push({ type: 'orders', count: orders.length });
      }

      // Anonymize payments
      if (dataDeleters.anonymizePayments) {
        const payments = await dataDeleters.anonymizePayments(customerId);
        deletedItems.push({ type: 'payments', count: payments.length });
      }

      // Delete consent records
      this.consentRecords = this.consentRecords.filter(r => r.customerId !== customerId);
      deletedItems.push({ type: 'consent_records', count: 1 });

      request.status = 'completed';
      request.completedAt = new Date().toISOString();
      request.dataDeleted = deletedItems;

      this.saveToStorage();
      return request;
    } catch (error) {
      console.error('Error processing deletion request:', error);
      request.status = 'failed';
      request.error = error.message;
      this.saveToStorage();
      return request;
    }
  }

  // Get data request by ID
  getDataRequest(requestId) {
    return this.dataRequests.find(r => r.id === requestId);
  }

  // Get all data requests for a customer
  getCustomerDataRequests(customerId) {
    return this.dataRequests.filter(r => r.customerId === customerId);
  }

  // Get pending data requests
  getPendingRequests() {
    return this.dataRequests.filter(r => r.status === 'pending');
  }

  // Convert data to CSV format
  convertToCSV(data) {
    const rows = [];
    
    // Personal info
    if (data.personalInfo) {
      rows.push(['Type', 'Field', 'Value']);
      Object.entries(data.personalInfo).forEach(([key, value]) => {
        rows.push(['Personal', key, value]);
      });
    }

    // Orders summary
    if (data.orders && data.orders.length > 0) {
      rows.push([]);
      rows.push(['Orders Count', data.orders.length]);
      data.orders.forEach(order => {
        rows.push(['Order', order.id, order.total, order.createdAt]);
      });
    }

    return rows.map(row => row.join(',')).join('\n');
  }

  // Generate unique ID
  generateId() {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up expired export requests
  cleanupExpiredRequests() {
    const now = new Date();
    let cleaned = 0;

    this.dataRequests = this.dataRequests.filter(request => {
      if (request.expiryDate && new Date(request.expiryDate) < now) {
        cleaned++;
        return false;
      }
      return true;
    });

    this.saveToStorage();
    return cleaned;
  }

  // Get consent statistics
  getConsentStatistics() {
    const stats = {
      totalRecords: this.consentRecords.length,
      byType: {},
      byStatus: {},
      recentActivity: this.consentRecords.slice(-10).reverse()
    };

    this.consentRecords.forEach(record => {
      stats.byType[record.consentType] = (stats.byType[record.consentType] || 0) + 1;
      stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
let gdprManager = null;

export const getGDPRManager = () => {
  if (!gdprManager) {
    gdprManager = new GDPRManager();
  }
  return gdprManager;
};

// React hook for GDPR compliance
export const useGDPR = (customerId) => {
  const manager = getGDPRManager();

  return {
    hasConsent: (consentType) => manager.hasConsent(customerId, consentType),
    recordConsent: (consentType, status, metadata) => 
      manager.recordConsent(customerId, consentType, status, metadata),
    revokeConsent: (consentType, reason) => 
      manager.revokeConsent(customerId, consentType, reason),
    getConsents: () => manager.getCustomerConsents(customerId),
    requestExport: (format) => manager.createDataExportRequest(customerId, 'self', format),
    requestDeletion: (reason) => manager.createDataDeletionRequest(customerId, 'self', reason)
  };
};
