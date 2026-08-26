// Stock Transfer Between Locations System

export const TransferStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  PARTIALLY_RECEIVED: 'partially_received',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

export const TransferPriority = {
  NORMAL: 'normal',
  URGENT: 'urgent',
  EMERGENCY: 'emergency'
};

class StockTransferManager {
  constructor() {
    this.transfers = [];
    this.locations = [];
    this.loadFromStorage();
  }

  // Load transfers from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedTransfers = localStorage.getItem('stock_transfers');
        const storedLocations = localStorage.getItem('stock_locations');
        
        if (storedTransfers) {
          this.transfers = JSON.parse(storedTransfers);
        }
        if (storedLocations) {
          this.locations = JSON.parse(storedLocations);
        }
      }
    } catch (error) {
      console.error('Error loading stock transfer data:', error);
    }
  }

  // Save transfers to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('stock_transfers', JSON.stringify(this.transfers));
        localStorage.setItem('stock_locations', JSON.stringify(this.locations));
      }
    } catch (error) {
      console.error('Error saving stock transfer data:', error);
    }
  }

  // Add location
  addLocation(locationData) {
    const location = {
      id: this.generateId(),
      ...locationData,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.locations.push(location);
    this.saveToStorage();
    
    return location;
  }

  // Create stock transfer
  createTransfer(transferData) {
    const transfer = {
      id: this.generateId(),
      transferNumber: this.generateTransferNumber(),
      ...transferData,
      status: TransferStatus.PENDING,
      priority: transferData.priority || TransferPriority.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: transferData.items || [],
      receivedItems: [],
      totalItems: transferData.items?.length || 0,
      receivedCount: 0,
      estimatedArrival: transferData.estimatedArrival || null
    };

    this.transfers.push(transfer);
    this.saveToStorage();
    
    return transfer;
  }

  // Update transfer
  updateTransfer(transferId, updates) {
    const index = this.transfers.findIndex(t => t.id === transferId);
    if (index === -1) {
      throw new Error('Transfer not found');
    }

    this.transfers[index] = {
      ...this.transfers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.transfers[index];
  }

  // Delete transfer
  deleteTransfer(transferId) {
    const index = this.transfers.findIndex(t => t.id === transferId);
    if (index === -1) {
      throw new Error('Transfer not found');
    }

    this.transfers.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get transfer by ID
  getTransfer(transferId) {
    return this.transfers.find(t => t.id === transferId);
  }

  // Get all transfers
  getAllTransfers(filters = {}) {
    let filtered = [...this.transfers];

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.fromLocationId) {
      filtered = filtered.filter(t => t.fromLocationId === filters.fromLocationId);
    }

    if (filters.toLocationId) {
      filtered = filtered.filter(t => t.toLocationId === filters.toLocationId);
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(t => {
        const transferDate = new Date(t.createdAt);
        return transferDate >= new Date(filters.startDate) && transferDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get pending transfers
  getPendingTransfers() {
    return this.transfers.filter(t => t.status === TransferStatus.PENDING);
  }

  // Get in-transit transfers
  getInTransitTransfers() {
    return this.transfers.filter(t => t.status === TransferStatus.IN_TRANSIT);
  }

  // Approve transfer
  approveTransfer(transferId, approvedBy, notes = '') {
    return this.updateTransfer(transferId, {
      status: TransferStatus.APPROVED,
      approvedBy,
      approvedAt: new Date().toISOString(),
      approvalNotes: notes
    });
  }

  // Reject transfer
  rejectTransfer(transferId, rejectedBy, reason = '') {
    return this.updateTransfer(transferId, {
      status: TransferStatus.REJECTED,
      rejectedBy,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });
  }

  // Start transfer (mark as in transit)
  startTransfer(transferId, shippedBy, trackingNumber = '') {
    return this.updateTransfer(transferId, {
      status: TransferStatus.IN_TRANSIT,
      shippedBy,
      shippedAt: new Date().toISOString(),
      trackingNumber
    });
  }

  // Record received items
  recordReceivedItems(transferId, receivedItems, receivedBy, notes = '') {
    const transfer = this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const newReceivedItems = [...transfer.receivedItems, ...receivedItems];
    const receivedCount = newReceivedItems.length;
    
    // Check if all items received
    const allReceived = receivedCount >= transfer.totalItems;
    const status = allReceived ? TransferStatus.RECEIVED : TransferStatus.PARTIALLY_RECEIVED;

    return this.updateTransfer(transferId, {
      receivedItems: newReceivedItems,
      receivedCount,
      status,
      receivedBy,
      receivedAt: new Date().toISOString(),
      receivingNotes: notes
    });
  }

  // Cancel transfer
  cancelTransfer(transferId, cancelledBy, reason = '') {
    return this.updateTransfer(transferId, {
      status: TransferStatus.CANCELLED,
      cancelledBy,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    });
  }

  // Get location by ID
  getLocation(locationId) {
    return this.locations.find(l => l.id === locationId);
  }

  // Get all locations
  getAllLocations() {
    return this.locations.filter(l => l.isActive);
  }

  // Update location
  updateLocation(locationId, updates) {
    const index = this.locations.findIndex(l => l.id === locationId);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations[index] = {
      ...this.locations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.locations[index];
  }

  // Delete location
  deleteLocation(locationId) {
    const index = this.locations.findIndex(l => l.id === locationId);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations[index].isActive = false;
    this.saveToStorage();
    return true;
  }

  // Generate transfer number
  generateTransferNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = this.transfers.filter(t => {
      const transferDate = new Date(t.createdAt);
      return transferDate.getFullYear() === year && transferDate.getMonth() === date.getMonth();
    }).length + 1;
    
    return `ST-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Generate unique ID
  generateId() {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get transfer statistics
  getStatistics() {
    const now = new Date();
    const thisMonth = this.transfers.filter(t => {
      const transferDate = new Date(t.createdAt);
      return transferDate.getMonth() === now.getMonth() && transferDate.getFullYear() === now.getFullYear();
    });

    const overdueTransfers = this.transfers.filter(t => {
      return t.status === TransferStatus.IN_TRANSIT && 
             t.estimatedArrival && 
             new Date(t.estimatedArrival) < now;
    });

    return {
      total: this.transfers.length,
      byStatus: this.groupByStatus(),
      byPriority: this.groupByPriority(),
      thisMonth: {
        count: thisMonth.length,
        totalItems: thisMonth.reduce((sum, t) => sum + t.totalItems, 0)
      },
      overdue: overdueTransfers.length,
      locations: this.locations.filter(l => l.isActive).length
    };
  }

  // Group transfers by status
  groupByStatus() {
    const grouped = {};
    this.transfers.forEach(t => {
      grouped[t.status] = (grouped[t.status] || 0) + 1;
    });
    return grouped;
  }

  // Group transfers by priority
  groupByPriority() {
    const grouped = {};
    this.transfers.forEach(t => {
      grouped[t.priority] = (grouped[t.priority] || 0) + 1;
    });
    return grouped;
  }

  // Get transfer history between locations
  getTransferHistory(fromLocationId, toLocationId) {
    return this.transfers.filter(t => 
      t.fromLocationId === fromLocationId && t.toLocationId === toLocationId
    );
  }

  // Get location inventory summary
  getLocationInventorySummary(locationId) {
    const transfersTo = this.transfers.filter(t => t.toLocationId === locationId);
    const transfersFrom = this.transfers.filter(t => t.fromLocationId === locationId);

    return {
      incoming: transfersTo.filter(t => t.status === TransferStatus.IN_TRANSIT).length,
      outgoing: transfersFrom.filter(t => t.status === TransferStatus.IN_TRANSIT).length,
      pendingApproval: transfersTo.filter(t => t.status === TransferStatus.PENDING).length
    };
  }

  // Export transfers as CSV
  exportToCSV(startDate, endDate) {
    const transfers = this.getAllTransfers({ startDate, endDate });
    const headers = ['Transfer Number', 'From Location', 'To Location', 'Status', 'Priority', 'Total Items', 'Received Count', 'Created At', 'Estimated Arrival'];
    const rows = transfers.map(t => [
      t.transferNumber,
      t.fromLocationId,
      t.toLocationId,
      t.status,
      t.priority,
      t.totalItems,
      t.receivedCount,
      t.createdAt,
      t.estimatedArrival || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let stockTransferManager = null;

export const getStockTransferManager = () => {
  if (!stockTransferManager) {
    stockTransferManager = new StockTransferManager();
  }
  return stockTransferManager;
};
