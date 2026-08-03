// Smart Notifications
// Intelligent notification system that avoids spam

import { NotificationType, IncidentSeverity } from './DiagnosticsTypes.js';

class SmartNotifications {
  constructor() {
    this.isInitialized = false;
    this.notificationHistory = new Map();
    this.notificationQueue = [];
    this.cooldownPeriods = new Map();
    this.lastNotificationTime = new Map();
  }

  async initialize(config) {
    if (this.isInitialized) return;
    console.log('[SmartNotifications] Initializing...');
    this.config = config;
    this.initializeCooldowns();
    await this.loadNotificationHistory();
    this.isInitialized = true;
  }

  initializeCooldowns() {
    this.cooldownPeriods.set(NotificationType.CRITICAL, 5 * 60 * 1000);
    this.cooldownPeriods.set(NotificationType.HIGH, 15 * 60 * 1000);
    this.cooldownPeriods.set(NotificationType.RECOVERY_COMPLETE, 30 * 60 * 1000);
    this.cooldownPeriods.set(NotificationType.ISSUE_RESOLVED, 30 * 60 * 1000);
    this.cooldownPeriods.set(NotificationType.REPEATED_FAILURE, 10 * 60 * 1000);
    this.cooldownPeriods.set(NotificationType.PREDICTION_WARNING, 60 * 60 * 1000);
  }

  async loadNotificationHistory() {
    try {
      const saved = localStorage.getItem('cafeos_notification_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(n => this.notificationHistory.set(n.id, n));
      }
    } catch (error) {
      console.error('[SmartNotifications] Failed to load history:', error);
    }
  }

  async saveNotificationHistory() {
    try {
      localStorage.setItem('cafeos_notification_history', JSON.stringify(Array.from(this.notificationHistory.values())));
    } catch (error) {
      console.error('[SmartNotifications] Failed to save history:', error);
    }
  }

  shouldSendNotification(type, component) {
    const key = `${type}:${component}`;
    const lastTime = this.lastNotificationTime.get(key);
    const cooldown = this.cooldownPeriods.get(type) || 0;
    return !lastTime || (Date.now() - lastTime) > cooldown;
  }

  async notifyIncident(incident) {
    if (incident.severity !== IncidentSeverity.CRITICAL && 
        incident.severity !== IncidentSeverity.EMERGENCY &&
        incident.severity !== IncidentSeverity.HIGH) return;

    const type = incident.severity === IncidentSeverity.CRITICAL || 
                incident.severity === IncidentSeverity.EMERGENCY 
                ? NotificationType.CRITICAL : NotificationType.HIGH;

    if (!this.shouldSendNotification(type, incident.component)) return;

    const notification = {
      id: this.generateId(),
      type,
      component: incident.component,
      title: `${incident.severity.toUpperCase()} Incident: ${incident.component}`,
      message: incident.rootCause?.likelyCause || 'Unknown issue',
      severity: incident.severity,
      timestamp: new Date().toISOString(),
      incidentId: incident.id
    };

    await this.sendNotification(notification);
  }

  async notifyResolution(incident) {
    if (!this.shouldSendNotification(NotificationType.ISSUE_RESOLVED, incident.component)) return;

    const notification = {
      id: this.generateId(),
      type: NotificationType.ISSUE_RESOLVED,
      component: incident.component,
      title: `Issue Resolved: ${incident.component}`,
      message: incident.resolutionNotes || 'Incident resolved',
      severity: 'low',
      timestamp: new Date().toISOString(),
      incidentId: incident.id
    };

    await this.sendNotification(notification);
  }

  async notifyPrediction(prediction) {
    if (prediction.confidence < 70) return;
    if (!this.shouldSendNotification(NotificationType.PREDICTION_WARNING, prediction.component)) return;

    const notification = {
      id: this.generateId(),
      type: NotificationType.PREDICTION_WARNING,
      component: prediction.component,
      title: `Prediction Warning: ${prediction.component}`,
      message: prediction.predictedIssue,
      severity: prediction.severity,
      confidence: prediction.confidence,
      timestamp: new Date().toISOString()
    };

    await this.sendNotification(notification);
  }

  async sendNotification(notification) {
    this.notificationHistory.set(notification.id, notification);
    await this.saveNotificationHistory();
    
    const key = `${notification.type}:${notification.component}`;
    this.lastNotificationTime.set(key, Date.now());
    
    this.notificationQueue.push(notification);
    console.log(`[SmartNotifications] Notification sent: ${notification.title}`);
  }

  getNotificationQueue() {
    return this.notificationQueue;
  }

  clearNotificationQueue() {
    this.notificationQueue = [];
  }

  getNotificationHistory(filters = {}) {
    let history = Array.from(this.notificationHistory.values());
    if (filters.type) history = history.filter(n => n.type === filters.type);
    if (filters.component) history = history.filter(n => n.component === filters.component);
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return history;
  }

  generateId() {
    return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

const smartNotifications = new SmartNotifications();
export default smartNotifications;
