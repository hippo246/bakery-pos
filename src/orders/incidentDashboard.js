// Incident Dashboard
// Operational incident tracking, assignment, resolution, history

import { now } from '../domain/dates.js';

const INCIDENTS_KEY = 'cafeos_incidents';

/**
 * Incident Types
 */
export const INCIDENT_TYPES = {
  TERMINAL_OFFLINE: 'TERMINAL_OFFLINE',
  PRINTER_FAILURE: 'PRINTER_FAILURE',
  KITCHEN_DELAY: 'KITCHEN_DELAY',
  PAYMENT_FAILURE: 'PAYMENT_FAILURE',
  INVENTORY_CONFLICT: 'INVENTORY_CONFLICT',
  NETWORK_LOSS: 'NETWORK_LOSS',
  WORKFLOW_FAILURE: 'WORKFLOW_FAILURE',
  CASH_DRAWER_MISMATCH: 'CASH_DRAWER_MISMATCH',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  POWER_OUTAGE: 'POWER_OUTAGE',
  CUSTOMER_COMPLAINT: 'CUSTOMER_COMPLAINT',
  STAFF_ISSUE: 'STAFF_ISSUE'
};

/**
 * Incident Priority
 */
export const INCIDENT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

/**
 * Incident Status
 */
export const INCIDENT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED'
};

/**
 * Incident Dashboard class
 * Operational incident tracking, assignment, resolution, history
 */
export class IncidentDashboard {
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
      console.error('[IncidentDashboard] Failed to load incidents:', error);
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
      console.error('[IncidentDashboard] Failed to save incidents:', error);
    }
  }

  /**
   * Create an incident
   * @param {Object} incidentData - Incident data
   * @returns {Object} Created incident
   */
  createIncident(incidentData) {
    const incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: incidentData.type || INCIDENT_TYPES.SYSTEM_ERROR,
      
      // Description
      title: incidentData.title || 'Untitled Incident',
      description: incidentData.description || '',
      
      // Location
      branchId: incidentData.branchId || null,
      terminalId: incidentData.terminalId || null,
      tableId: incidentData.tableId || null,
      orderId: incidentData.orderId || null,
      
      // Priority & Status
      priority: incidentData.priority || INCIDENT_PRIORITY.MEDIUM,
      status: INCIDENT_STATUS.OPEN,
      
      // Assignment
      assignedTo: incidentData.assignedTo || null,
      assignedBy: incidentData.assignedBy || null,
      assignedAt: null,
      
      // Resolution
      resolvedBy: null,
      resolvedAt: null,
      resolution: '',
      resolutionNotes: '',
      
      // Escalation
      escalated: false,
      escalatedTo: null,
      escalatedAt: null,
      escalationReason: '',
      
      // Impact
      affectedCustomers: incidentData.affectedCustomers || 0,
      affectedOrders: incidentData.affectedOrders || 0,
      estimatedLoss: incidentData.estimatedLoss || 0,
      
      // Timeline
      detectedAt: incidentData.detectedAt || now(),
      reportedBy: incidentData.reportedBy || null,
      
      // Metadata
      metadata: incidentData.metadata || {},
      createdAt: now(),
      createdBy: incidentData.createdBy || null,
      updatedAt: null
    };

    this.incidents.set(incident.id, incident);
    this.saveIncidents();

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
   * Get all incidents
   * @returns {Array} Array of incidents
   */
  getAllIncidents() {
    return Array.from(this.incidents.values());
  }

  /**
   * Get incidents by status
   * @param {string} status - Incident status
   * @returns {Array} Array of incidents
   */
  getIncidentsByStatus(status) {
    return this.getAllIncidents().filter(i => i.status === status);
  }

  /**
   * Get incidents by type
   * @param {string} type - Incident type
   * @returns {Array} Array of incidents
   */
  getIncidentsByType(type) {
    return this.getAllIncidents().filter(i => i.type === type);
  }

  /**
   * Get incidents by priority
   * @param {string} priority - Incident priority
   * @returns {Array} Array of incidents
   */
  getIncidentsByPriority(priority) {
    return this.getAllIncidents().filter(i => i.priority === priority);
  }

  /**
   * Get incidents by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of incidents
   */
  getIncidentsByBranch(branchId) {
    return this.getAllIncidents().filter(i => i.branchId === branchId);
  }

  /**
   * Get incidents by assignee
   * @param {string} assigneeId - Assignee ID
   * @returns {Array} Array of incidents
   */
  getIncidentsByAssignee(assigneeId) {
    return this.getAllIncidents().filter(i => i.assignedTo === assigneeId);
  }

  /**
   * Get open incidents
   * @returns {Array} Array of open incidents
   */
  getOpenIncidents() {
    return this.getIncidentsByStatus(INCIDENT_STATUS.OPEN);
  }

  /**
   * Get in-progress incidents
   * @returns {Array} Array of in-progress incidents
   */
  getInProgressIncidents() {
    return this.getIncidentsByStatus(INCIDENT_STATUS.IN_PROGRESS);
  }

  /**
   * Get active incidents (open or in-progress)
   * @returns {Array} Array of active incidents
   */
  getActiveIncidents() {
    return this.getAllIncidents().filter(i => 
      i.status === INCIDENT_STATUS.OPEN || i.status === INCIDENT_STATUS.IN_PROGRESS
    );
  }

  /**
   * Get critical incidents
   * @returns {Array} Array of critical incidents
   */
  getCriticalIncidents() {
    return this.getAllIncidents().filter(i => 
      i.priority === INCIDENT_PRIORITY.CRITICAL || i.priority === INCIDENT_PRIORITY.EMERGENCY
    );
  }

  /**
   * Assign incident
   * @param {string} incidentId - Incident ID
   * @param {string} assigneeId - Assignee ID
   * @param {string} assignedBy - Who assigned it
   * @returns {Object} Result
   */
  assignIncident(incidentId, assigneeId, assignedBy) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    incident.assignedTo = assigneeId;
    incident.assignedBy = assignedBy;
    incident.assignedAt = now();
    incident.status = INCIDENT_STATUS.IN_PROGRESS;
    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
  }

  /**
   * Update incident status
   * @param {string} incidentId - Incident ID
   * @param {string} status - New status
   * @returns {Object} Result
   */
  updateIncidentStatus(incidentId, status) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    incident.status = status;
    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
  }

  /**
   * Resolve incident
   * @param {string} incidentId - Incident ID
   * @param {string} resolvedBy - Who resolved it
   * @param {string} resolution - Resolution description
   * @param {string} resolutionNotes - Additional notes
   * @returns {Object} Result
   */
  resolveIncident(incidentId, resolvedBy, resolution = '', resolutionNotes = '') {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    incident.status = INCIDENT_STATUS.RESOLVED;
    incident.resolvedBy = resolvedBy;
    incident.resolvedAt = now();
    incident.resolution = resolution;
    incident.resolutionNotes = resolutionNotes;
    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
  }

  /**
   * Close incident
   * @param {string} incidentId - Incident ID
   * @returns {Object} Result
   */
  closeIncident(incidentId) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    if (incident.status !== INCIDENT_STATUS.RESOLVED) {
      return { success: false, reason: 'Only resolved incidents can be closed' };
    }

    incident.status = INCIDENT_STATUS.CLOSED;
    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
  }

  /**
   * Escalate incident
   * @param {string} incidentId - Incident ID
   * @param {string} escalatedTo - Who to escalate to
   * @param {string} escalationReason - Reason for escalation
   * @returns {Object} Result
   */
  escalateIncident(incidentId, escalatedTo, escalationReason = '') {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    incident.escalated = true;
    incident.escalatedTo = escalatedTo;
    incident.escalatedAt = now();
    incident.escalationReason = escalationReason;
    incident.status = INCIDENT_STATUS.ESCALATED;
    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
  }

  /**
   * Update incident
   * @param {string} incidentId - Incident ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated incident or null
   */
  updateIncident(incidentId, updates) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const updated = {
      ...incident,
      ...updates,
      updatedAt: now()
    };

    this.incidents.set(incidentId, updated);
    this.saveIncidents();

    return updated;
  }

  /**
   * Add incident note
   * @param {string} incidentId - Incident ID
   * @param {string} note - Note to add
   * @param {string} author - Note author
   * @returns {Object} Result
   */
  addIncidentNote(incidentId, note, author) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, reason: 'Incident not found' };
    }

    if (!incident.notes) {
      incident.notes = [];
    }

    incident.notes.push({
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      note,
      author,
      createdAt: now()
    });

    incident.updatedAt = now();

    this.incidents.set(incidentId, incident);
    this.saveIncidents();

    return { success: true, incident };
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
    }
    return deleted;
  }

  /**
   * Get incident history
   * @param {string} incidentId - Incident ID
   * @returns {Object|null} Incident history or null
   */
  getIncidentHistory(incidentId) {
    const incident = this.getIncident(incidentId);
    if (!incident) return null;

    return {
      incidentId: incident.id,
      title: incident.title,
      type: incident.type,
      priority: incident.priority,
      status: incident.status,
      
      // Timeline
      detectedAt: incident.detectedAt,
      createdAt: incident.createdAt,
      assignedAt: incident.assignedAt,
      escalatedAt: incident.escalatedAt,
      resolvedAt: incident.resolvedAt,
      updatedAt: incident.updatedAt,
      
      // Assignment
      assignedTo: incident.assignedTo,
      assignedBy: incident.assignedBy,
      
      // Resolution
      resolvedBy: incident.resolvedBy,
      resolution: incident.resolution,
      resolutionNotes: incident.resolutionNotes,
      
      // Escalation
      escalated: incident.escalated,
      escalatedTo: incident.escalatedTo,
      escalationReason: incident.escalationReason,
      
      // Impact
      affectedCustomers: incident.affectedCustomers,
      affectedOrders: incident.affectedOrders,
      estimatedLoss: incident.estimatedLoss,
      
      // Notes
      notes: incident.notes || []
    };
  }

  /**
   * Get incident statistics
   * @param {Object} options - Query options
   * @returns {Object} Statistics
   */
  getIncidentStatistics(options = {}) {
    const { branchId, startDate, endDate } = options;
    
    let incidents = this.getAllIncidents();
    
    if (branchId) {
      incidents = incidents.filter(i => i.branchId === branchId);
    }
    if (startDate) {
      incidents = incidents.filter(i => i.createdAt >= startDate);
    }
    if (endDate) {
      incidents = incidents.filter(i => i.createdAt <= endDate);
    }

    return {
      total: incidents.length,
      byStatus: incidents.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {}),
      byType: incidents.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: incidents.reduce((acc, i) => {
        acc[i.priority] = (acc[i.priority] || 0) + 1;
        return acc;
      }, {}),
      active: this.getActiveIncidents().length,
      critical: this.getCriticalIncidents().length,
      resolved: incidents.filter(i => i.status === INCIDENT_STATUS.RESOLVED).length,
      closed: incidents.filter(i => i.status === INCIDENT_STATUS.CLOSED).length,
      escalated: incidents.filter(i => i.escalated).length,
      totalAffectedCustomers: incidents.reduce((sum, i) => sum + i.affectedCustomers, 0),
      totalAffectedOrders: incidents.reduce((sum, i) => sum + i.affectedOrders, 0),
      totalEstimatedLoss: incidents.reduce((sum, i) => sum + i.estimatedLoss, 0),
      averageResolutionTime: this.calculateAverageResolutionTime(incidents)
    };
  }

  /**
   * Calculate average resolution time
   * @param {Array} incidents - Array of incidents
   * @returns {number} Average resolution time in milliseconds
   */
  calculateAverageResolutionTime(incidents) {
    const resolvedIncidents = incidents.filter(i => i.resolvedAt && i.detectedAt);
    
    if (resolvedIncidents.length === 0) return 0;
    
    const totalResolutionTime = resolvedIncidents.reduce((sum, i) => {
      return sum + (i.resolvedAt - i.detectedAt);
    }, 0);
    
    return totalResolutionTime / resolvedIncidents.length;
  }

  /**
   * Get incident trends
   * @param {number} days - Number of days to analyze
   * @returns {Array} Array of daily incident counts
   */
  getIncidentTrends(days = 30) {
    const trends = [];
    const nowTime = now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = nowTime - (i * dayMs);
      const dayEnd = dayStart + dayMs;
      
      const dayIncidents = this.getAllIncidents().filter(i => 
        i.createdAt >= dayStart && i.createdAt < dayEnd
      );

      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        total: dayIncidents.length,
        critical: dayIncidents.filter(i => i.priority === INCIDENT_PRIORITY.CRITICAL || i.priority === INCIDENT_PRIORITY.EMERGENCY).length,
        resolved: dayIncidents.filter(i => i.status === INCIDENT_STATUS.RESOLVED || i.status === INCIDENT_STATUS.CLOSED).length
      });
    }

    return trends;
  }

  /**
   * Clear old incidents
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of incidents cleared
   */
  clearOldIncidents(olderThan = 90 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [id, incident] of this.incidents) {
      if (incident.status === INCIDENT_STATUS.CLOSED && incident.updatedAt && incident.updatedAt < cutoff) {
        this.incidents.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveIncidents();
    }

    return cleared;
  }

  /**
   * Export incidents
   * @param {Object} options - Export options
   * @returns {Object} Exported incidents
   */
  exportIncidents(options = {}) {
    const { branchId, startDate, endDate } = options;
    
    let incidents = this.getAllIncidents();
    
    if (branchId) {
      incidents = incidents.filter(i => i.branchId === branchId);
    }
    if (startDate) {
      incidents = incidents.filter(i => i.createdAt >= startDate);
    }
    if (endDate) {
      incidents = incidents.filter(i => i.createdAt <= endDate);
    }

    return {
      incidents,
      exportedAt: now(),
      totalIncidents: incidents.length
    };
  }

  /**
   * Import incidents
   * @param {Object} data - Imported incidents data
   * @returns {Object} Import result
   */
  importIncidents(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.incidents)) {
        data.incidents.forEach(incident => {
          this.incidents.set(incident.id, incident);
        });
      }

      this.saveIncidents();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let incidentDashboardInstance = null;

/**
 * Get the incident dashboard singleton
 * @returns {IncidentDashboard} Incident dashboard instance
 */
export function getIncidentDashboard() {
  if (!incidentDashboardInstance) {
    incidentDashboardInstance = new IncidentDashboard();
  }
  return incidentDashboardInstance;
}

/**
 * Reset the incident dashboard (useful for testing)
 */
export function resetIncidentDashboard() {
  incidentDashboardInstance = null;
}

/**
 * Convenience function to create an incident
 * @param {Object} incidentData - Incident data
 * @returns {Object} Created incident
 */
export function createIncident(incidentData = {}) {
  const dashboard = getIncidentDashboard();
  return dashboard.createIncident(incidentData);
}

/**
 * Convenience function to resolve an incident
 * @param {string} incidentId - Incident ID
 * @param {string} resolvedBy - Who resolved it
 * @param {string} resolution - Resolution description
 * @returns {Object} Result
 */
export function resolveIncident(incidentId, resolvedBy, resolution = '') {
  const dashboard = getIncidentDashboard();
  return dashboard.resolveIncident(incidentId, resolvedBy, resolution);
}
