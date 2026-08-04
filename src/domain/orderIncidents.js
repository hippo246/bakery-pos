// Order Incident Handling
// Manages operational incidents related to orders

import { now } from './dates.js';

const INCIDENTS_KEY = 'cafeos_order_incidents';

/**
 * Incident Types
 */
export const INCIDENT_TYPES = {
  KITCHEN_REJECTION: 'KITCHEN_REJECTION',
  INVENTORY_UNAVAILABLE: 'INVENTORY_UNAVAILABLE',
  TABLE_UNAVAILABLE: 'TABLE_UNAVAILABLE',
  CUSTOMER_LEFT: 'CUSTOMER_LEFT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  DELAYED_ORDER: 'DELAYED_ORDER',
  WRONG_ORDER: 'WRONG_ORDER',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  STAFF_SHORTAGE: 'STAFF_SHORTAGE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  OTHER: 'OTHER'
};

/**
 * Incident Priority Levels
 */
export const INCIDENT_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

/**
 * Incident Status
 */
export const INCIDENT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
  CLOSED: 'CLOSED'
};

/**
 * Order Incident Manager class
 * Manages operational incidents for orders
 */
export class OrderIncidentManager {
  constructor() {
    this.incidents = new Map();
    this.loadIncidents();
  }

  /**
   * Load incidents from localStorage
   */
  loadIncidents() {
    try {
      const stored = localStorage.getItem(INCIDENTS_KEY);
      if (stored) {
        const incidents = JSON.parse(stored);
        incidents.forEach(incident => {
          this.incidents.set(incident.id, incident);
        });
      }
    } catch (error) {
      console.error('[OrderIncidentManager] Failed to load incidents:', error);
    }
  }

  /**
   * Save incidents to localStorage
   */
  saveIncidents() {
    try {
      const incidents = Array.from(this.incidents.values());
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    } catch (error) {
      console.error('[OrderIncidentManager] Failed to save incidents:', error);
    }
  }

  /**
   * Create a new incident
   * @param {Object} incidentData - Incident data
   * @returns {Object} Created incident
   */
  createIncident(incidentData) {
    const incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      orderId: incidentData.orderId || null,
      type: incidentData.type || INCIDENT_TYPES.OTHER,
      priority: incidentData.priority || INCIDENT_PRIORITY.MEDIUM,
      status: INCIDENT_STATUS.OPEN,
      title: incidentData.title || 'Untitled Incident',
      description: incidentData.description || '',
      reportedBy: incidentData.reportedBy || null,
      assignedTo: incidentData.assignedTo || null,
      branchId: incidentData.branchId || null,
      tableId: incidentData.tableId || null,
      customerId: incidentData.customerId || null,
      equipmentId: incidentData.equipmentId || null,
      metadata: incidentData.metadata || {},
      createdAt: now(),
      updatedAt: now(),
      resolvedAt: null,
      resolution: null,
      timeline: [{
        action: 'INCIDENT_CREATED',
        timestamp: now(),
        performedBy: incidentData.reportedBy || null,
        notes: 'Incident created'
      }]
    };

    this.incidents.set(incident.id, incident);
    this.saveIncidents();

    // Publish event for other systems
    this.publishIncidentEvent('incident_created', incident);

    return incident;
  }

  /**
   * Update incident status
   * @param {string} incidentId - Incident ID
   * @param {string} status - New status
   * @param {string} performedBy - Staff ID performing the update
   * @param {string} notes - Update notes
   * @returns {Object|null} Updated incident or null
   */
  updateIncidentStatus(incidentId, status, performedBy = null, notes = null) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const validStatuses = Object.values(INCIDENT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid incident status: ${status}`);
    }

    incident.status = status;
    incident.updatedAt = now();

    if (status === INCIDENT_STATUS.RESOLVED || status === INCIDENT_STATUS.CLOSED) {
      incident.resolvedAt = now();
    }

    incident.timeline.push({
      action: 'STATUS_CHANGED',
      timestamp: now(),
      performedBy,
      notes: notes || `Status changed to ${status}`,
      previousStatus: incident.status
    });

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    this.publishIncidentEvent('incident_updated', incident);

    return incident;
  }

  /**
   * Assign incident to staff
   * @param {string} incidentId - Incident ID
   * @param {string} assignedTo - Staff ID to assign to
   * @param {string} assignedBy - Staff ID making the assignment
   * @returns {Object|null} Updated incident or null
   */
  assignIncident(incidentId, assignedTo, assignedBy = null) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const previousAssignee = incident.assignedTo;
    incident.assignedTo = assignedTo;
    incident.updatedAt = now();

    incident.timeline.push({
      action: 'INCIDENT_ASSIGNED',
      timestamp: now(),
      performedBy: assignedBy,
      notes: `Assigned to staff ${assignedTo}`,
      previousAssignee
    });

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    this.publishIncidentEvent('incident_assigned', incident);

    return incident;
  }

  /**
   * Resolve incident
   * @param {string} incidentId - Incident ID
   * @param {string} resolution - Resolution description
   * @param {string} resolvedBy - Staff ID resolving the incident
   * @returns {Object|null} Updated incident or null
   */
  resolveIncident(incidentId, resolution, resolvedBy = null) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = INCIDENT_STATUS.RESOLVED;
    incident.resolution = resolution;
    incident.resolvedAt = now();
    incident.updatedAt = now();

    incident.timeline.push({
      action: 'INCIDENT_RESOLVED',
      timestamp: now(),
      performedBy: resolvedBy,
      notes: resolution
    });

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    this.publishIncidentEvent('incident_resolved', incident);

    return incident;
  }

  /**
   * Escalate incident
   * @param {string} incidentId - Incident ID
   * @param {string} escalatedTo - Staff ID to escalate to
   * @param {string} escalatedBy - Staff ID escalating
   * @param {string} reason - Reason for escalation
   * @returns {Object|null} Updated incident or null
   */
  escalateIncident(incidentId, escalatedTo, escalatedBy = null, reason = null) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = INCIDENT_STATUS.ESCALATED;
    incident.assignedTo = escalatedTo;
    incident.updatedAt = now();

    incident.timeline.push({
      action: 'INCIDENT_ESCALATED',
      timestamp: now(),
      performedBy: escalatedBy,
      notes: reason || 'Incident escalated',
      escalatedTo
    });

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    this.publishIncidentEvent('incident_escalated', incident);

    return incident;
  }

  /**
   * Get incident by ID
   * @param {string} incidentId - Incident ID
   * @returns {Object|null} Incident or null
   */
  getIncident(incidentId) {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Get incidents by order ID
   * @param {string} orderId - Order ID
   * @returns {Array} Array of incidents
   */
  getIncidentsByOrder(orderId) {
    return Array.from(this.incidents.values()).filter(inc => inc.orderId === orderId);
  }

  /**
   * Get incidents by type
   * @param {string} type - Incident type
   * @returns {Array} Array of incidents
   */
  getIncidentsByType(type) {
    return Array.from(this.incidents.values()).filter(inc => inc.type === type);
  }

  /**
   * Get incidents by status
   * @param {string} status - Incident status
   * @returns {Array} Array of incidents
   */
  getIncidentsByStatus(status) {
    return Array.from(this.incidents.values()).filter(inc => inc.status === status);
  }

  /**
   * Get incidents by priority
   * @param {string} priority - Incident priority
   * @returns {Array} Array of incidents
   */
  getIncidentsByPriority(priority) {
    return Array.from(this.incidents.values()).filter(inc => inc.priority === priority);
  }

  /**
   * Get incidents by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of incidents
   */
  getIncidentsByStaff(staffId) {
    return Array.from(this.incidents.values()).filter(inc => 
      inc.reportedBy === staffId || inc.assignedTo === staffId
    );
  }

  /**
   * Get open incidents
   * @returns {Array} Array of open incidents
   */
  getOpenIncidents() {
    return this.getIncidentsByStatus(INCIDENT_STATUS.OPEN);
  }

  /**
   * Get critical incidents
   * @returns {Array} Array of critical incidents
   */
  getCriticalIncidents() {
    return this.getIncidentsByPriority(INCIDENT_PRIORITY.CRITICAL);
  }

  /**
   * Search incidents
   * @param {Object} filters - Search filters
   * @returns {Array} Filtered incidents
   */
  searchIncidents(filters = {}) {
    let incidents = Array.from(this.incidents.values());

    if (filters.orderId) {
      incidents = incidents.filter(inc => inc.orderId === filters.orderId);
    }

    if (filters.type) {
      incidents = incidents.filter(inc => inc.type === filters.type);
    }

    if (filters.status) {
      incidents = incidents.filter(inc => inc.status === filters.status);
    }

    if (filters.priority) {
      incidents = incidents.filter(inc => inc.priority === filters.priority);
    }

    if (filters.branchId) {
      incidents = incidents.filter(inc => inc.branchId === filters.branchId);
    }

    if (filters.tableId) {
      incidents = incidents.filter(inc => inc.tableId === filters.tableId);
    }

    if (filters.staffId) {
      incidents = incidents.filter(inc => 
        inc.reportedBy === filters.staffId || inc.assignedTo === filters.staffId
      );
    }

    if (filters.fromDate) {
      incidents = incidents.filter(inc => inc.createdAt >= filters.fromDate);
    }

    if (filters.toDate) {
      incidents = incidents.filter(inc => inc.createdAt <= filters.toDate);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      incidents = incidents.filter(inc => {
        return (
          inc.title.toLowerCase().includes(query) ||
          inc.description.toLowerCase().includes(query)
        );
      });
    }

    return incidents;
  }

  /**
   * Get incident statistics
   * @returns {Object} Incident statistics
   */
  getStatistics() {
    const incidents = Array.from(this.incidents.values());

    const stats = {
      total: incidents.length,
      byStatus: {},
      byType: {},
      byPriority: {},
      open: 0,
      resolved: 0,
      critical: 0,
      averageResolutionTime: null
    };

    incidents.forEach(inc => {
      // Count by status
      stats.byStatus[inc.status] = (stats.byStatus[inc.status] || 0) + 1;
      
      // Count by type
      stats.byType[inc.type] = (stats.byType[inc.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[inc.priority] = (stats.byPriority[inc.priority] || 0) + 1;

      // Count open and resolved
      if (inc.status === INCIDENT_STATUS.OPEN) stats.open++;
      if (inc.status === INCIDENT_STATUS.RESOLVED) stats.resolved++;
      if (inc.priority === INCIDENT_PRIORITY.CRITICAL) stats.critical++;
    });

    // Calculate average resolution time
    const resolvedIncidents = incidents.filter(inc => 
      inc.status === INCIDENT_STATUS.RESOLVED && inc.resolvedAt
    );

    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, inc) => {
        return sum + (inc.resolvedAt - inc.createdAt);
      }, 0);
      stats.averageResolutionTime = totalResolutionTime / resolvedIncidents.length;
    }

    return stats;
  }

  /**
   * Delete incident
   * @param {string} incidentId - Incident ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteIncident(incidentId) {
    const deleted = this.incidents.delete(incidentId);
    if (deleted) {
      this.saveIncidents();
      this.publishIncidentEvent('incident_deleted', { incidentId });
    }
    return deleted;
  }

  /**
   * Archive old incidents
   * @param {number} days - Age in days
   * @returns {number} Number of incidents archived
   */
  archiveOldIncidents(days = 90) {
    const cutoff = now() - (days * 24 * 60 * 60 * 1000);
    let archived = 0;

    for (const [incidentId, incident] of this.incidents) {
      if (incident.resolvedAt && incident.resolvedAt < cutoff) {
        // In a real system, this would move to archive storage
        this.incidents.delete(incidentId);
        archived++;
      }
    }

    if (archived > 0) {
      this.saveIncidents();
    }

    return archived;
  }

  /**
   * Publish incident event (for integration with other systems)
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  publishIncidentEvent(eventType, data) {
    // This would integrate with your event system
    console.log(`[OrderIncidentManager] Event: ${eventType}`, data);
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('orderIncident', {
      detail: { eventType, data }
    }));
  }

  /**
   * Get all incidents
   * @returns {Array} Array of all incidents
   */
  getAllIncidents() {
    return Array.from(this.incidents.values());
  }
}

// Singleton instance
let incidentManagerInstance = null;

/**
 * Get the order incident manager singleton
 * @returns {OrderIncidentManager} Incident manager instance
 */
export function getOrderIncidentManager() {
  if (!incidentManagerInstance) {
    incidentManagerInstance = new OrderIncidentManager();
  }
  return incidentManagerInstance;
}

/**
 * Reset the incident manager (useful for testing)
 */
export function resetOrderIncidentManager() {
  incidentManagerInstance = null;
}

/**
 * Convenience function to create common incidents
 * @param {string} type - Incident type
 * @param {Object} data - Incident data
 * @returns {Object} Created incident
 */
export function createOrderIncident(type, data = {}) {
  const manager = getOrderIncidentManager();
  return manager.createIncident({ type, ...data });
}
