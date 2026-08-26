// Delivery Rider Management System

export const RiderStatus = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFF_DUTY: 'off_duty',
  ON_BREAK: 'on_break',
  INACTIVE: 'inactive'
};

export const RiderType = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACTOR: 'contractor'
};

class DeliveryRiderManager {
  constructor() {
    this.riders = [];
    this.riderShifts = [];
    this.loadFromStorage();
  }

  // Load riders from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedRiders = localStorage.getItem('delivery_riders');
        const storedShifts = localStorage.getItem('rider_shifts');
        
        if (storedRiders) {
          this.riders = JSON.parse(storedRiders);
        }
        if (storedShifts) {
          this.riderShifts = JSON.parse(storedShifts);
        }
      }
    } catch (error) {
      console.error('Error loading rider data:', error);
    }
  }

  // Save riders to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('delivery_riders', JSON.stringify(this.riders));
        localStorage.setItem('rider_shifts', JSON.stringify(this.riderShifts));
      }
    } catch (error) {
      console.error('Error saving rider data:', error);
    }
  }

  // Add rider
  addRider(riderData) {
    const rider = {
      id: this.generateId(),
      ...riderData,
      status: RiderStatus.OFF_DUTY,
      type: riderData.type || RiderType.FULL_TIME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDeliveries: 0,
      totalEarnings: 0,
      rating: 0,
      reviewCount: 0
    };

    this.riders.push(rider);
    this.saveToStorage();
    
    return rider;
  }

  // Update rider
  updateRider(riderId, updates) {
    const index = this.riders.findIndex(r => r.id === riderId);
    if (index === -1) {
      throw new Error('Rider not found');
    }

    this.riders[index] = {
      ...this.riders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.riders[index];
  }

  // Delete rider
  deleteRider(riderId) {
    const index = this.riders.findIndex(r => r.id === riderId);
    if (index === -1) {
      throw new Error('Rider not found');
    }

    this.riders[index].status = RiderStatus.INACTIVE;
    this.riders[index].deletedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // Get rider by ID
  getRider(riderId) {
    return this.riders.find(r => r.id === riderId);
  }

  // Get all riders
  getAllRiders(filters = {}) {
    let filtered = [...this.riders];

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    if (filters.locationId) {
      filtered = filtered.filter(r => r.locationId === filters.locationId);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get available riders
  getAvailableRiders(locationId = null) {
    let available = this.riders.filter(r => r.status === RiderStatus.AVAILABLE);
    
    if (locationId) {
      available = available.filter(r => r.locationId === locationId);
    }
    
    return available;
  }

  // Update rider status
  updateRiderStatus(riderId, status) {
    return this.updateRider(riderId, { status });
  }

  // Start rider shift
  startShift(riderId, locationId, notes = '') {
    const shift = {
      id: this.generateId(),
      riderId,
      locationId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      deliveries: [],
      earnings: 0,
      notes
    };

    this.riderShifts.push(shift);
    this.updateRiderStatus(riderId, RiderStatus.AVAILABLE);
    this.saveToStorage();
    
    return shift;
  }

  // End rider shift
  endShift(shiftId, notes = '') {
    const index = this.riderShifts.findIndex(s => s.id === shiftId);
    if (index === -1) {
      throw new Error('Shift not found');
    }

    this.riderShifts[index].endTime = new Date().toISOString();
    this.riderShifts[index].status = 'completed';
    this.riderShifts[index].endNotes = notes;

    this.updateRiderStatus(this.riderShifts[index].riderId, RiderStatus.OFF_DUTY);
    this.saveToStorage();
    
    return this.riderShifts[index];
  }

  // Add delivery to rider shift
  addDeliveryToShift(shiftId, deliveryId, deliveryFee) {
    const shift = this.riderShifts.find(s => s.id === shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    shift.deliveries.push(deliveryId);
    shift.earnings += deliveryFee;

    // Update rider total stats
    const rider = this.getRider(shift.riderId);
    if (rider) {
      this.updateRider(rider.id, {
        totalDeliveries: rider.totalDeliveries + 1,
        totalEarnings: rider.totalEarnings + deliveryFee
      });
    }

    this.saveToStorage();
    return shift;
  }

  // Rate rider
  rateRider(riderId, rating, review = '') {
    const rider = this.getRider(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    const newReviewCount = rider.reviewCount + 1;
    const newRating = ((rider.rating * rider.reviewCount) + rating) / newReviewCount;

    return this.updateRider(riderId, {
      rating: newRating,
      reviewCount: newReviewCount,
      lastReview: {
        rating,
        review,
        date: new Date().toISOString()
      }
    });
  }

  // Get rider shifts
  getRiderShifts(riderId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.riderShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shift.riderId === riderId && 
             shiftDate >= start && 
             shiftDate <= end;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  // Get active shifts
  getActiveShifts() {
    return this.riderShifts.filter(s => s.status === 'active');
  }

  // Get rider performance report
  getRiderPerformanceReport(riderId, startDate, endDate) {
    const rider = this.getRider(riderId);
    if (!rider) return null;

    const shifts = this.getRiderShifts(riderId, startDate, endDate);
    const completedShifts = shifts.filter(s => s.status === 'completed');

    const totalShifts = completedShifts.length;
    const totalDeliveries = completedShifts.reduce((sum, s) => sum + s.deliveries.length, 0);
    const totalEarnings = completedShifts.reduce((sum, s) => sum + s.earnings, 0);
    const totalHours = completedShifts.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    return {
      rider: {
        id: rider.id,
        name: rider.name,
        type: rider.type,
        status: rider.status
      },
      performance: {
        totalShifts,
        totalDeliveries,
        totalEarnings,
        totalHours,
        averageDeliveriesPerShift: totalShifts > 0 ? totalDeliveries / totalShifts : 0,
        averageEarningsPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
        rating: rider.rating,
        reviewCount: rider.reviewCount
      }
    };
  }

  // Get rider statistics
  getStatistics(startDate, endDate) {
    const shifts = this.riderShifts.filter(s => {
      const shiftDate = new Date(s.startTime);
      return shiftDate >= new Date(startDate) && shiftDate <= new Date(endDate);
    });

    const activeRiders = this.riders.filter(r => r.status === RiderStatus.AVAILABLE).length;
    const totalDeliveries = shifts.reduce((sum, s) => sum + s.deliveries.length, 0);
    const totalEarnings = shifts.reduce((sum, s) => sum + s.earnings, 0);

    const byStatus = {};
    this.riders.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    return {
      totalRiders: this.riders.length,
      activeRiders,
      totalShifts: shifts.length,
      totalDeliveries,
      totalEarnings,
      byStatus
    };
  }

  // Assign rider to delivery
  assignRiderToDelivery(riderId, deliveryId) {
    const rider = this.getRider(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    if (rider.status !== RiderStatus.AVAILABLE) {
      throw new Error('Rider is not available');
    }

    // Update rider status to busy
    this.updateRiderStatus(riderId, RiderStatus.BUSY);

    // Find active shift or create new one
    const activeShift = this.riderShifts.find(s => 
      s.riderId === riderId && s.status === 'active'
    );

    if (activeShift) {
      return this.addDeliveryToShift(activeShift.id, deliveryId, 0);
    } else {
      const newShift = this.startShift(riderId, rider.locationId);
      return this.addDeliveryToShift(newShift.id, deliveryId, 0);
    }
  }

  // Generate unique ID
  generateId() {
    return `rider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export riders as CSV
  exportToCSV() {
    const headers = ['ID', 'Name', 'Phone', 'Status', 'Type', 'Total Deliveries', 'Total Earnings', 'Rating', 'Review Count'];
    const rows = this.riders.map(r => [
      r.id,
      r.name,
      r.phone,
      r.status,
      r.type,
      r.totalDeliveries,
      r.totalEarnings,
      r.rating,
      r.reviewCount
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let deliveryRiderManager = null;

export const getDeliveryRiderManager = () => {
  if (!deliveryRiderManager) {
    deliveryRiderManager = new DeliveryRiderManager();
  }
  return deliveryRiderManager;
};
