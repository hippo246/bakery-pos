// Supplier/Vendor Management System

export const SupplierStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_HOLD: 'on_hold',
  BLACKLISTED: 'blacklisted'
};

export const SupplierType = {
  FOOD: 'food',
  BEVERAGES: 'beverages',
  EQUIPMENT: 'equipment',
  PACKAGING: 'packaging',
  CLEANING: 'cleaning',
  OTHER: 'other'
};

export const PaymentTerms = {
  CASH_ON_DELIVERY: 'cod',
  NET_15: 'net_15',
  NET_30: 'net_30',
  NET_45: 'net_45',
  NET_60: 'net_60',
  ADVANCE: 'advance'
};

class SupplierManager {
  constructor() {
    this.suppliers = [];
    this.loadFromStorage();
  }

  // Load suppliers from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('suppliers');
        if (stored) {
          this.suppliers = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }

  // Save suppliers to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
      }
    } catch (error) {
      console.error('Error saving suppliers:', error);
    }
  }

  // Add new supplier
  addSupplier(supplierData) {
    const supplier = {
      id: this.generateId(),
      ...supplierData,
      status: supplierData.status || SupplierStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalPurchased: 0,
      averageDeliveryTime: 0,
      rating: 0,
      reviewCount: 0
    };

    this.suppliers.push(supplier);
    this.saveToStorage();
    
    return supplier;
  }

  // Update supplier
  updateSupplier(supplierId, updates) {
    const index = this.suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) {
      throw new Error('Supplier not found');
    }

    this.suppliers[index] = {
      ...this.suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.suppliers[index];
  }

  // Delete supplier
  deleteSupplier(supplierId) {
    const index = this.suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) {
      throw new Error('Supplier not found');
    }

    this.suppliers.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get supplier by ID
  getSupplier(supplierId) {
    return this.suppliers.find(s => s.id === supplierId);
  }

  // Get all suppliers
  getAllSuppliers(filters = {}) {
    let filtered = [...this.suppliers];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(search) ||
        s.contactPerson?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get active suppliers
  getActiveSuppliers() {
    return this.suppliers.filter(s => s.status === SupplierStatus.ACTIVE);
  }

  // Search suppliers
  searchSuppliers(query) {
    const lowerQuery = query.toLowerCase();
    return this.suppliers.filter(s =>
      s.name?.toLowerCase().includes(lowerQuery) ||
      s.contactPerson?.toLowerCase().includes(lowerQuery) ||
      s.email?.toLowerCase().includes(lowerQuery) ||
      s.phone?.includes(query) ||
      s.gstNumber?.toLowerCase().includes(lowerQuery)
    );
  }

  // Update supplier status
  updateStatus(supplierId, status) {
    return this.updateSupplier(supplierId, { status });
  }

  // Rate supplier
  rateSupplier(supplierId, rating, review = '') {
    const supplier = this.getSupplier(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const newReviewCount = supplier.reviewCount + 1;
    const newRating = ((supplier.rating * supplier.reviewCount) + rating) / newReviewCount;

    return this.updateSupplier(supplierId, {
      rating: newRating,
      reviewCount: newReviewCount,
      lastReview: {
        rating,
        review,
        date: new Date().toISOString()
      }
    });
  }

  // Update supplier statistics
  updateStatistics(supplierId, orderAmount, deliveryTime) {
    const supplier = this.getSupplier(supplierId);
    if (!supplier) return;

    const newTotalOrders = supplier.totalOrders + 1;
    const newTotalPurchased = supplier.totalPurchased + orderAmount;
    const newAvgDeliveryTime = supplier.averageDeliveryTime === 0 
      ? deliveryTime 
      : ((supplier.averageDeliveryTime * supplier.totalOrders) + deliveryTime) / newTotalOrders;

    this.updateSupplier(supplierId, {
      totalOrders: newTotalOrders,
      totalPurchased: newTotalPurchased,
      averageDeliveryTime: newAvgDeliveryTime,
      lastOrderDate: new Date().toISOString()
    });
  }

  // Get supplier performance report
  getSupplierPerformanceReport(supplierId) {
    const supplier = this.getSupplier(supplierId);
    if (!supplier) return null;

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        type: supplier.type,
        status: supplier.status
      },
      performance: {
        totalOrders: supplier.totalOrders,
        totalPurchased: supplier.totalPurchased,
        averageOrderValue: supplier.totalOrders > 0 ? supplier.totalPurchased / supplier.totalOrders : 0,
        averageDeliveryTime: supplier.averageDeliveryTime,
        rating: supplier.rating,
        reviewCount: supplier.reviewCount
      },
      reliability: {
        onTimeDeliveryRate: this.calculateOnTimeRate(supplierId),
        orderAccuracyRate: this.calculateAccuracyRate(supplierId),
        returnRate: this.calculateReturnRate(supplierId)
      }
    };
  }

  // Calculate on-time delivery rate
  calculateOnTimeRate(supplierId) {
    // This would be calculated from actual purchase order data
    // For now, return a placeholder
    return 0.95;
  }

  // Calculate order accuracy rate
  calculateAccuracyRate(supplierId) {
    // This would be calculated from actual purchase order data
    // For now, return a placeholder
    return 0.98;
  }

  // Calculate return rate
  calculateReturnRate(supplierId) {
    // This would be calculated from actual purchase order data
    // For now, return a placeholder
    return 0.02;
  }

  // Get top suppliers by performance
  getTopSuppliers(limit = 10, sortBy = 'rating') {
    const sorted = [...this.suppliers].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'totalPurchased':
          return b.totalPurchased - a.totalPurchased;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'averageDeliveryTime':
          return a.averageDeliveryTime - b.averageDeliveryTime;
        default:
          return b.rating - a.rating;
      }
    });

    return sorted.slice(0, limit);
  }

  // Get suppliers with low stock items
  getSuppliersForItem(itemName) {
    // This would match suppliers to items they supply
    // For now, return all active suppliers
    return this.getActiveSuppliers();
  }

  // Generate unique ID
  generateId() {
    return `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export suppliers as CSV
  exportToCSV() {
    const headers = ['ID', 'Name', 'Contact Person', 'Phone', 'Email', 'Type', 'Status', 'Rating', 'Total Orders', 'Total Purchased'];
    const rows = this.suppliers.map(s => [
      s.id,
      s.name,
      s.contactPerson,
      s.phone,
      s.email,
      s.type,
      s.status,
      s.rating,
      s.totalOrders,
      s.totalPurchased
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Import suppliers from CSV
  importFromCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    const imported = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const supplier = {
          name: values[1],
          contactPerson: values[2],
          phone: values[3],
          email: values[4],
          type: values[5],
          status: values[6] || SupplierStatus.ACTIVE
        };
        
        try {
          const added = this.addSupplier(supplier);
          imported.push(added);
        } catch (error) {
          console.error(`Error importing supplier at line ${i}:`, error);
        }
      }
    }
    
    return imported;
  }

  // Get supplier statistics
  getStatistics() {
    return {
      total: this.suppliers.length,
      active: this.suppliers.filter(s => s.status === SupplierStatus.ACTIVE).length,
      inactive: this.suppliers.filter(s => s.status === SupplierStatus.INACTIVE).length,
      onHold: this.suppliers.filter(s => s.status === SupplierStatus.ON_HOLD).length,
      blacklisted: this.suppliers.filter(s => s.status === SupplierStatus.BLACKLISTED).length,
      byType: this.groupByType(),
      averageRating: this.calculateAverageRating()
    };
  }

  // Group suppliers by type
  groupByType() {
    const grouped = {};
    this.suppliers.forEach(s => {
      grouped[s.type] = (grouped[s.type] || 0) + 1;
    });
    return grouped;
  }

  // Calculate average rating across all suppliers
  calculateAverageRating() {
    const ratedSuppliers = this.suppliers.filter(s => s.rating > 0);
    if (ratedSuppliers.length === 0) return 0;
    
    const total = ratedSuppliers.reduce((sum, s) => sum + s.rating, 0);
    return total / ratedSuppliers.length;
  }
}

// Singleton instance
let supplierManager = null;

export const getSupplierManager = () => {
  if (!supplierManager) {
    supplierManager = new SupplierManager();
  }
  return supplierManager;
};
