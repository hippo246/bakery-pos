// Delivery Tracking System

export const DeliveryStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

class DeliveryTrackingManager {
  constructor() {
    this.deliveries = [];
    this.trackingEvents = [];
    this.loadFromStorage();
  }

  // Load deliveries from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedDeliveries = localStorage.getItem('delivery_tracking');
        const storedEvents = localStorage.getItem('delivery_events');
        
        if (storedDeliveries) {
          this.deliveries = JSON.parse(storedDeliveries);
        }
        if (storedEvents) {
          this.trackingEvents = JSON.parse(storedEvents);
        }
      }
    } catch (error) {
      console.error('Error loading delivery tracking data:', error);
    }
  }

  // Save deliveries to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('delivery_tracking', JSON.stringify(this.deliveries));
        localStorage.setItem('delivery_events', JSON.stringify(this.trackingEvents));
      }
    } catch (error) {
      console.error('Error saving delivery tracking data:', error);
    }
  }

  // Create delivery tracking record
  createDelivery(deliveryData) {
    const delivery = {
      id: this.generateId(),
      ...deliveryData,
      status: DeliveryStatus.PENDING,
      trackingNumber: this.generateTrackingNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDeliveryTime: deliveryData.estimatedDeliveryTime || null,
      actualDeliveryTime: null
    };

    this.deliveries.push(delivery);
    this.recordTrackingEvent(delivery.id, DeliveryStatus.PENDING, 'Delivery created');
    this.saveToStorage();
    
    return delivery;
  }

  // Update delivery status
  updateDeliveryStatus(deliveryId, status, notes = '') {
    const index = this.deliveries.findIndex(d => d.id === deliveryId);
    if (index === -1) {
      throw new Error('Delivery not found');
    }

    this.deliveries[index].status = status;
    this.deliveries[index].updatedAt = new Date().toISOString();

    if (status === DeliveryStatus.DELIVERED) {
      this.deliveries[index].actualDeliveryTime = new Date().toISOString();
    }

    this.recordTrackingEvent(deliveryId, status, notes);
    this.saveToStorage();
    
    return this.deliveries[index];
  }

  // Assign rider to delivery
  assignRider(deliveryId, riderId, riderName) {
    const index = this.deliveries.findIndex(d => d.id === deliveryId);
    if (index === -1) {
      throw new Error('Delivery not found');
    }

    this.deliveries[index].riderId = riderId;
    this.deliveries[index].riderName = riderName;
    this.deliveries[index].status = DeliveryStatus.ASSIGNED;
    this.deliveries[index].updatedAt = new Date().toISOString();

    this.recordTrackingEvent(deliveryId, DeliveryStatus.ASSIGNED, `Assigned to rider: ${riderName}`);
    this.saveToStorage();
    
    return this.deliveries[index];
  }

  // Update delivery location
  updateLocation(deliveryId, latitude, longitude, notes = '') {
    const index = this.deliveries.findIndex(d => d.id === deliveryId);
    if (index === -1) {
      throw new Error('Delivery not found');
    }

    this.deliveries[index].currentLocation = {
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    };
    this.deliveries[index].updatedAt = new Date().toISOString();

    this.recordTrackingEvent(deliveryId, this.deliveries[index].status, `Location updated: ${latitude}, ${longitude}`, notes);
    this.saveToStorage();
    
    return this.deliveries[index];
  }

  // Record tracking event
  recordTrackingEvent(deliveryId, status, description, notes = '') {
    const event = {
      id: this.generateId(),
      deliveryId,
      status,
      description,
      notes,
      timestamp: new Date().toISOString()
    };

    this.trackingEvents.push(event);
  }

  // Get delivery by ID
  getDelivery(deliveryId) {
    return this.deliveries.find(d => d.id === deliveryId);
  }

  // Get delivery by tracking number
  getDeliveryByTrackingNumber(trackingNumber) {
    return this.deliveries.find(d => d.trackingNumber === trackingNumber);
  }

  // Get all deliveries
  getAllDeliveries(filters = {}) {
    let filtered = [...this.deliveries];

    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    if (filters.riderId) {
      filtered = filtered.filter(d => d.riderId === filters.riderId);
    }

    if (filters.platform) {
      filtered = filtered.filter(d => d.platform === filters.platform);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(d => {
        const deliveryDate = new Date(d.createdAt);
        return deliveryDate >= new Date(filters.startDate) && deliveryDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get active deliveries
  getActiveDeliveries() {
    return this.deliveries.filter(d => 
      d.status !== DeliveryStatus.DELIVERED && 
      d.status !== DeliveryStatus.CANCELLED && 
      d.status !== DeliveryStatus.FAILED
    );
  }

  // Get deliveries requiring attention
  getDeliveriesRequiringAttention() {
    const now = new Date();
    return this.deliveries.filter(d => {
      if (d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.CANCELLED) {
        return false;
      }

      // Check if estimated delivery time has passed
      if (d.estimatedDeliveryTime && new Date(d.estimatedDeliveryTime) < now) {
        return true;
      }

      // Check if delivery has been in transit too long
      if (d.status === DeliveryStatus.IN_TRANSIT) {
        const inTransitTime = (now - new Date(d.updatedAt)) / (1000 * 60 * 60); // hours
        return inTransitTime > 2; // More than 2 hours in transit
      }

      return false;
    });
  }

  // Get tracking events for delivery
  getTrackingEvents(deliveryId) {
    return this.trackingEvents
      .filter(e => e.deliveryId === deliveryId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Get delivery statistics
  getStatistics(startDate, endDate) {
    const deliveries = this.getAllDeliveries({ startDate, endDate });
    
    const totalDeliveries = deliveries.length;
    const delivered = deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
    const cancelled = deliveries.filter(d => d.status === DeliveryStatus.CANCELLED).length;
    const failed = deliveries.filter(d => d.status === DeliveryStatus.FAILED).length;

    const averageDeliveryTime = this.calculateAverageDeliveryTime(deliveries);
    const onTimeDeliveries = deliveries.filter(d => {
      if (!d.actualDeliveryTime || !d.estimatedDeliveryTime) return false;
      return new Date(d.actualDeliveryTime) <= new Date(d.estimatedDeliveryTime);
    }).length;

    return {
      totalDeliveries,
      delivered,
      cancelled,
      failed,
      deliveryRate: totalDeliveries > 0 ? (delivered / totalDeliveries) * 100 : 0,
      averageDeliveryTime,
      onTimeRate: delivered > 0 ? (onTimeDeliveries / delivered) * 100 : 0,
      byStatus: this.groupByStatus(deliveries),
      byPlatform: this.groupByPlatform(deliveries)
    };
  }

  // Calculate average delivery time
  calculateAverageDeliveryTime(deliveries) {
    const completedDeliveries = deliveries.filter(d => 
      d.actualDeliveryTime && d.createdAt
    );

    if (completedDeliveries.length === 0) return 0;

    const totalTime = completedDeliveries.reduce((sum, d) => {
      return sum + (new Date(d.actualDeliveryTime) - new Date(d.createdAt));
    }, 0);

    return totalTime / completedDeliveries.length / (1000 * 60); // in minutes
  }

  // Group deliveries by status
  groupByStatus(deliveries) {
    const grouped = {};
    deliveries.forEach(d => {
      grouped[d.status] = (grouped[d.status] || 0) + 1;
    });
    return grouped;
  }

  // Group deliveries by platform
  groupByPlatform(deliveries) {
    const grouped = {};
    deliveries.forEach(d => {
      grouped[d.platform] = (grouped[d.platform] || 0) + 1;
    });
    return grouped;
  }

  // Generate tracking number
  generateTrackingNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `DLV-${year}${month}-${random}`;
  }

  // Generate unique ID
  generateId() {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export deliveries as CSV
  exportToCSV(startDate, endDate) {
    const deliveries = this.getAllDeliveries({ startDate, endDate });
    const headers = ['ID', 'Tracking Number', 'Status', 'Rider ID', 'Platform', 'Created At', 'Estimated Delivery', 'Actual Delivery'];
    const rows = deliveries.map(d => [
      d.id,
      d.trackingNumber,
      d.status,
      d.riderId || 'N/A',
      d.platform || 'N/A',
      d.createdAt,
      d.estimatedDeliveryTime || 'N/A',
      d.actualDeliveryTime || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let deliveryTrackingManager = null;

export const getDeliveryTrackingManager = () => {
  if (!deliveryTrackingManager) {
    deliveryTrackingManager = new DeliveryTrackingManager();
  }
  return deliveryTrackingManager;
};
