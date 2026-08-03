// Recovery Tracker
// Tracks recovery metrics and time to resolution

import { RecoveryTracking } from './DiagnosticsTypes.js';
import incidentManager from './IncidentManager.js';

/**
 * Recovery Tracker - Tracks recovery metrics
 */
class RecoveryTracker {
  constructor() {
    this.isInitialized = false;
    this.recoveryData = new Map(); // incidentId -> RecoveryTracking
  }

  /**
   * Initialize the Recovery Tracker
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[RecoveryTracker] Already initialized');
      return;
    }

    console.log('[RecoveryTracker] Initializing...');
    await this.loadRecoveryData();
    this.isInitialized = true;
    console.log('[RecoveryTracker] Initialized successfully');
  }

  /**
   * Load recovery data from localStorage
   */
  async loadRecoveryData() {
    try {
      const saved = localStorage.getItem('cafeos_recovery_tracking');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([incidentId, data]) => {
          this.recoveryData.set(incidentId, data);
        });
        console.log(`[RecoveryTracker] Loaded ${this.recoveryData.size} recovery records`);
      }
    } catch (error) {
      console.error('[RecoveryTracker] Failed to load recovery data:', error);
    }
  }

  /**
   * Save recovery data to localStorage
   */
  async saveRecoveryData() {
    try {
      const dataObj = Object.fromEntries(this.recoveryData);
      localStorage.setItem('cafeos_recovery_tracking', JSON.stringify(dataObj));
    } catch (error) {
      console.error('[RecoveryTracker] Failed to save recovery data:', error);
    }
  }

  /**
   * Track acknowledgment of an incident
   */
  async trackAcknowledgment(incidentId, owner) {
    const incident = incidentManager.getIncident(incidentId);
    if (!incident) return;

    const timeToDetect = new Date(incident.acknowledgedAt).getTime() - new Date(incident.started).getTime();
    const timeToAcknowledge = timeToDetect;

    const recoveryTracking = new RecoveryTracking({
      incidentId,
      timeToDetect,
      timeToAcknowledge,
      timeToResolve: null,
      recoverySuccess: null,
      recoveryFailures: [],
      repeatedIncidents: []
    });

    this.recoveryData.set(incidentId, recoveryTracking);
    await this.saveRecoveryData();
  }

  /**
   * Track resolution of an incident
   */
  async trackResolution(incidentId, owner) {
    const incident = incidentManager.getIncident(incidentId);
    if (!incident) return;

    const existing = this.recoveryData.get(incidentId);
    const timeToResolve = new Date(incident.resolved).getTime() - new Date(incident.started).getTime();

    const recoveryTracking = new RecoveryTracking({
      incidentId,
      timeToDetect: existing?.timeToDetect || null,
      timeToAcknowledge: existing?.timeToAcknowledge || null,
      timeToResolve,
      recoverySuccess: true,
      recoveryFailures: existing?.recoveryFailures || [],
      repeatedIncidents: this.checkForRepeatedIncidents(incidentId, incident.component)
    });

    this.recoveryData.set(incidentId, recoveryTracking);
    await this.saveRecoveryData();
  }

  /**
   * Track a recovery failure
   */
  async trackRecoveryFailure(incidentId, failureReason) {
    const existing = this.recoveryData.get(incidentId);
    if (!existing) return;

    existing.recoveryFailures.push({
      timestamp: new Date().toISOString(),
      reason: failureReason
    });

    this.recoveryData.set(incidentId, existing);
    await this.saveRecoveryData();
  }

  /**
   * Check for repeated incidents
   */
  checkForRepeatedIncidents(incidentId, component) {
    const relatedIncidents = incidentManager.getRelatedIncidents(incidentId, 168); // 7 days
    
    return relatedIncidents
      .filter(inc => inc.id !== incidentId)
      .map(inc => ({
        id: inc.id,
        started: inc.started,
        resolved: inc.resolved
      }));
  }

  /**
   * Get recovery data for an incident
   */
  getRecoveryData(incidentId) {
    return this.recoveryData.get(incidentId);
  }

  /**
   * Get recovery statistics
   */
  getStatistics() {
    const allRecoveryData = Array.from(this.recoveryData.values());
    
    if (allRecoveryData.length === 0) {
      return {
        totalIncidents: 0,
        averageTimeToDetect: 0,
        averageTimeToAcknowledge: 0,
        averageTimeToResolve: 0,
        recoverySuccessRate: 0,
        repeatedIncidentRate: 0,
        averageRecoveryFailures: 0
      };
    }

    const resolvedIncidents = allRecoveryData.filter(r => r.recoverySuccess !== null);
    
    const averageTimeToDetect = resolvedIncidents
      .filter(r => r.timeToDetect !== null)
      .reduce((sum, r) => sum + r.timeToDetect, 0) / resolvedIncidents.length || 0;

    const averageTimeToAcknowledge = resolvedIncidents
      .filter(r => r.timeToAcknowledge !== null)
      .reduce((sum, r) => sum + r.timeToAcknowledge, 0) / resolvedIncidents.length || 0;

    const averageTimeToResolve = resolvedIncidents
      .filter(r => r.timeToResolve !== null)
      .reduce((sum, r) => sum + r.timeToResolve, 0) / resolvedIncidents.length || 0;

    const successfulRecoveries = resolvedIncidents.filter(r => r.recoverySuccess).length;
    const recoverySuccessRate = (successfulRecoveries / resolvedIncidents.length) * 100;

    const incidentsWithRepeats = resolvedIncidents.filter(r => r.repeatedIncidents.length > 0).length;
    const repeatedIncidentRate = (incidentsWithRepeats / resolvedIncidents.length) * 100;

    const totalFailures = resolvedIncidents.reduce((sum, r) => sum + r.recoveryFailures.length, 0);
    const averageRecoveryFailures = totalFailures / resolvedIncidents.length;

    return {
      totalIncidents: allRecoveryData.length,
      averageTimeToDetect: Math.round(averageTimeToDetect),
      averageTimeToAcknowledge: Math.round(averageTimeToAcknowledge),
      averageTimeToResolve: Math.round(averageTimeToResolve),
      recoverySuccessRate: Math.round(recoverySuccessRate),
      repeatedIncidentRate: Math.round(repeatedIncidentRate),
      averageRecoveryFailures: Math.round(averageRecoveryFailures * 100) / 100
    };
  }

  /**
   * Get recovery timeline for an incident
   */
  getRecoveryTimeline(incidentId) {
    const incident = incidentManager.getIncident(incidentId);
    const recoveryData = this.recoveryData.get(incidentId);

    if (!incident || !recoveryData) return null;

    const timeline = [
      { event: 'Detected', timestamp: incident.started, duration: 0 }
    ];

    if (incident.acknowledgedAt) {
      timeline.push({
        event: 'Acknowledged',
        timestamp: incident.acknowledgedAt,
        duration: recoveryData.timeToAcknowledge
      });
    }

    if (incident.resolved) {
      timeline.push({
        event: 'Resolved',
        timestamp: incident.resolved,
        duration: recoveryData.timeToResolve
      });
    }

    // Add recovery failures
    recoveryData.recoveryFailures.forEach(failure => {
      timeline.push({
        event: 'Recovery Failed',
        timestamp: failure.timestamp,
        duration: null,
        reason: failure.reason
      });
    });

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get slowest recoveries
   */
  getSlowestRecoveries(limit = 10) {
    const allRecoveryData = Array.from(this.recoveryData.values())
      .filter(r => r.timeToResolve !== null)
      .sort((a, b) => b.timeToResolve - a.timeToResolve)
      .slice(0, limit);

    return allRecoveryData.map(r => ({
      incidentId: r.incidentId,
      timeToResolve: r.timeToResolve,
      timeToAcknowledge: r.timeToAcknowledge,
      recoverySuccess: r.recoverySuccess,
      repeatedIncidents: r.repeatedIncidents.length
    }));
  }

  /**
   * Get fastest recoveries
   */
  getFastestRecoveries(limit = 10) {
    const allRecoveryData = Array.from(this.recoveryData.values())
      .filter(r => r.timeToResolve !== null)
      .sort((a, b) => a.timeToResolve - b.timeToResolve)
      .slice(0, limit);

    return allRecoveryData.map(r => ({
      incidentId: r.incidentId,
      timeToResolve: r.timeToResolve,
      timeToAcknowledge: r.timeToAcknowledge,
      recoverySuccess: r.recoverySuccess
    }));
  }

  /**
   * Cleanup old recovery data
   */
  async cleanupOldData(retentionDays = 90) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [incidentId, recoveryData] of this.recoveryData.entries()) {
      const incident = incidentManager.getIncident(incidentId);
      
      if (!incident || new Date(incident.started).getTime() < cutoff) {
        this.recoveryData.delete(incidentId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveRecoveryData();
      console.log(`[RecoveryTracker] Cleaned up ${removedCount} old recovery records`);
    }

    return removedCount;
  }
}

// Singleton instance
const recoveryTracker = new RecoveryTracker();

export default recoveryTracker;
export { RecoveryTracker };
