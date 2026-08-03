// Incident Manager
// Manages incident lifecycle, tracking, and resolution

import { Incident, IncidentSeverity, IncidentStatus, IncidentPriority } from './DiagnosticsTypes.js';

/**
 * Incident Manager - Centralized incident tracking and management
 */
class IncidentManager {
  constructor() {
    this.incidents = new Map(); // id -> Incident
    this.isInitialized = false;
  }

  /**
   * Initialize the Incident Manager
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[IncidentManager] Already initialized');
      return;
    }

    console.log('[IncidentManager] Initializing...');
    await this.loadIncidents();
    this.isInitialized = true;
    console.log('[IncidentManager] Initialized successfully');
  }

  /**
   * Load incidents from localStorage
   */
  async loadIncidents() {
    try {
      const saved = localStorage.getItem('cafeos_incidents');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(incidentData => {
          const incident = new Incident(incidentData);
          this.incidents.set(incident.id, incident);
        });
        console.log(`[IncidentManager] Loaded ${this.incidents.size} incidents`);
      }
    } catch (error) {
      console.error('[IncidentManager] Failed to load incidents:', error);
    }
  }

  /**
   * Save incidents to localStorage
   */
  async saveIncidents() {
    try {
      const incidentsArray = Array.from(this.incidents.values());
      localStorage.setItem('cafeos_incidents', JSON.stringify(incidentsArray));
    } catch (error) {
      console.error('[IncidentManager] Failed to save incidents:', error);
    }
  }

  /**
   * Create a new incident
   */
  async createIncident(incidentData) {
    const incident = new Incident(incidentData);
    this.incidents.set(incident.id, incident);
    await this.saveIncidents();
    
    console.log(`[IncidentManager] Created incident ${incident.id} for component ${incident.component}`);
    return incident;
  }

  /**
   * Update an incident
   */
  async updateIncident(incidentId, updates) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    Object.assign(incident, updates);
    
    // Recalculate priority if severity changed
    if (updates.severity) {
      incident.priority = incident.calculatePriority();
    }

    this.incidents.set(incidentId, incident);
    await this.saveIncidents();
    
    return incident;
  }

  /**
   * Acknowledge an incident
   */
  async acknowledgeIncident(incidentId, owner) {
    return await this.updateIncident(incidentId, {
      status: IncidentStatus.ACKNOWLEDGED,
      owner,
      acknowledgedAt: new Date().toISOString()
    });
  }

  /**
   * Start investigating an incident
   */
  async startInvestigation(incidentId, owner) {
    return await this.updateIncident(incidentId, {
      status: IncidentStatus.INVESTIGATING,
      owner,
      investigationStartedAt: new Date().toISOString()
    });
  }

  /**
   * Start resolving an incident
   */
  async startResolution(incidentId, owner) {
    return await this.updateIncident(incidentId, {
      status: IncidentStatus.RESOLVING,
      owner,
      resolutionStartedAt: new Date().toISOString()
    });
  }

  /**
   * Resolve an incident
   */
  async resolveIncident(incidentId, resolutionNotes, owner) {
    return await this.updateIncident(incidentId, {
      status: IncidentStatus.RESOLVED,
      resolved: new Date().toISOString(),
      resolutionNotes,
      owner
    });
  }

  /**
   * Close an incident
   */
  async closeIncident(incidentId) {
    return await this.updateIncident(incidentId, {
      status: IncidentStatus.CLOSED,
      closedAt: new Date().toISOString()
    });
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId) {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all incidents
   */
  getAllIncidents(filters = {}) {
    let incidents = Array.from(this.incidents.values());

    // Apply filters
    if (filters.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity);
    }
    if (filters.status) {
      incidents = incidents.filter(i => i.status === filters.status);
    }
    if (filters.component) {
      incidents = incidents.filter(i => i.component === filters.component);
    }
    if (filters.priority) {
      incidents = incidents.filter(i => i.priority === filters.priority);
    }
    if (filters.owner) {
      incidents = incidents.filter(i => i.owner === filters.owner);
    }
    if (filters.startDate) {
      incidents = incidents.filter(i => new Date(i.started) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      incidents = incidents.filter(i => new Date(i.started) <= new Date(filters.endDate));
    }

    // Sort by started date (newest first)
    incidents.sort((a, b) => new Date(b.started) - new Date(a.started));

    return incidents;
  }

  /**
   * Get active incidents (not resolved or closed)
   */
  getActiveIncidents() {
    return this.getAllIncidents({
      status: [IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVING]
    });
  }

  /**
   * Get incidents by severity
   */
  getIncidentsBySeverity(severity) {
    return this.getAllIncidents({ severity });
  }

  /**
   * Get incidents by component
   */
  getIncidentsByComponent(component) {
    return this.getAllIncidents({ component });
  }

  /**
   * Get incident statistics
   */
  getIncidentStatistics() {
    const allIncidents = Array.from(this.incidents.values());
    const activeIncidents = this.getActiveIncidents();
    
    const bySeverity = {
      [IncidentSeverity.INFORMATION]: 0,
      [IncidentSeverity.LOW]: 0,
      [IncidentSeverity.MEDIUM]: 0,
      [IncidentSeverity.HIGH]: 0,
      [IncidentSeverity.CRITICAL]: 0,
      [IncidentSeverity.EMERGENCY]: 0
    };

    const byStatus = {
      [IncidentStatus.DETECTED]: 0,
      [IncidentStatus.ACKNOWLEDGED]: 0,
      [IncidentStatus.INVESTIGATING]: 0,
      [IncidentStatus.RESOLVING]: 0,
      [IncidentStatus.RESOLVED]: 0,
      [IncidentStatus.CLOSED]: 0
    };

    const byComponent = {};

    allIncidents.forEach(incident => {
      bySeverity[incident.severity]++;
      byStatus[incident.status]++;
      
      if (!byComponent[incident.component]) {
        byComponent[incident.component] = 0;
      }
      byComponent[incident.component]++;
    });

    // Calculate average resolution time
    const resolvedIncidents = allIncidents.filter(i => i.resolved);
    const averageResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, i) => sum + (i.getDuration() || 0), 0) / resolvedIncidents.length
      : 0;

    return {
      total: allIncidents.length,
      active: activeIncidents.length,
      resolved: resolvedIncidents.length,
      bySeverity,
      byStatus,
      byComponent,
      averageResolutionTime
    };
  }

  /**
   * Get related incidents (same component, similar time range)
   */
  getRelatedIncidents(incidentId, timeRangeHours = 24) {
    const incident = this.getIncident(incidentId);
    if (!incident) return [];

    const startTime = new Date(incident.started).getTime();
    const timeRange = timeRangeHours * 60 * 60 * 1000;

    return Array.from(this.incidents.values()).filter(i => {
      if (i.id === incidentId) return false;
      if (i.component !== incident.component) return false;
      
      const iTime = new Date(i.started).getTime();
      return Math.abs(iTime - startTime) <= timeRange;
    });
  }

  /**
   * Cleanup old incidents based on retention policy
   */
  async cleanupOldIncidents(retentionDays) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, incident] of this.incidents.entries()) {
      const incidentTime = new Date(incident.started).getTime();
      
      // Only remove resolved/closed incidents older than retention period
      if (
        (incident.status === IncidentStatus.RESOLVED || incident.status === IncidentStatus.CLOSED) &&
        incidentTime < cutoff
      ) {
        this.incidents.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveIncidents();
      console.log(`[IncidentManager] Cleaned up ${removedCount} old incidents`);
    }

    return removedCount;
  }

  /**
   * Get incident timeline
   */
  getIncidentTimeline(incidentId) {
    const incident = this.getIncident(incidentId);
    if (!incident) return [];

    const timeline = [
      { event: 'Detected', timestamp: incident.started },
    ];

    if (incident.acknowledgedAt) {
      timeline.push({ event: 'Acknowledged', timestamp: incident.acknowledgedAt });
    }
    if (incident.investigationStartedAt) {
      timeline.push({ event: 'Investigation Started', timestamp: incident.investigationStartedAt });
    }
    if (incident.resolutionStartedAt) {
      timeline.push({ event: 'Resolution Started', timestamp: incident.resolutionStartedAt });
    }
    if (incident.resolved) {
      timeline.push({ event: 'Resolved', timestamp: incident.resolved });
    }
    if (incident.closedAt) {
      timeline.push({ event: 'Closed', timestamp: incident.closedAt });
    }

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
}

// Singleton instance
const incidentManager = new IncidentManager();

export default incidentManager;
export { IncidentManager };
