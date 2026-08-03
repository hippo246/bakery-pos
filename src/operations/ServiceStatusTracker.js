// Service Status Tracker
// Tracks status of all internal services

import { ServiceStatus, MonitoredSystem } from './OperationsTypes.js';

export class ServiceStatusTracker {
  constructor() {
    this.serviceStatus = new Map();
    this.initializeServiceStatus();
  }

  /**
   * Initialize service status
   */
  initializeServiceStatus() {
    Object.values(MonitoredSystem).forEach(system => {
      this.serviceStatus.set(system, {
        service: system,
        status: ServiceStatus.STOPPED,
        reason: 'Not started',
        lastUpdated: null,
        uptime: 0,
        restartCount: 0
      });
    });
  }

  /**
   * Set service status
   * @param {string} service - Service
   * @param {string} status - Status
   * @param {string} reason - Reason
   */
  setServiceStatus(service, status, reason = '') {
    const serviceData = this.serviceStatus.get(service);
    
    if (!serviceData) {
      return;
    }

    // Track restarts
    if (status === ServiceStatus.RESTARTING && serviceData.status !== ServiceStatus.RESTARTING) {
      serviceData.restartCount++;
    }

    // Track uptime
    if (status === ServiceStatus.RUNNING && serviceData.status !== ServiceStatus.RUNNING) {
      serviceData.startTime = new Date().toISOString();
    } else if (status !== ServiceStatus.RUNNING && serviceData.status === ServiceStatus.RUNNING) {
      if (serviceData.startTime) {
        serviceData.uptime += Date.now() - new Date(serviceData.startTime).getTime();
      }
    }

    serviceData.status = status;
    serviceData.reason = reason;
    serviceData.lastUpdated = new Date().toISOString();

    this.serviceStatus.set(service, serviceData);
  }

  /**
   * Get service status
   * @param {string} service - Service
   * @returns {object|null} Service status
   */
  getServiceStatus(service) {
    return this.serviceStatus.get(service) || null;
  }

  /**
   * Get all service status
   * @returns {object} All service statuses
   */
  getAllServiceStatus() {
    return Object.fromEntries(this.serviceStatus);
  }

  /**
   * Start service
   * @param {string} service - Service
   */
  startService(service) {
    this.setServiceStatus(service, ServiceStatus.STARTING, 'Service starting');
    
    // Simulate service starting
    setTimeout(() => {
      this.setServiceStatus(service, ServiceStatus.RUNNING, 'Service running');
    }, 1000);
  }

  /**
   * Stop service
   * @param {string} service - Service
   */
  stopService(service) {
    this.setServiceStatus(service, ServiceStatus.STOPPED, 'Service stopped');
  }

  /**
   * Pause service
   * @param {string} service - Service
   */
  pauseService(service) {
    this.setServiceStatus(service, ServiceStatus.PAUSED, 'Service paused');
  }

  /**
   * Resume service
   * @param {string} service - Service
   */
  resumeService(service) {
    this.setServiceStatus(service, ServiceStatus.RUNNING, 'Service resumed');
  }

  /**
   * Restart service
   * @param {string} service - Service
   */
  restartService(service) {
    this.setServiceStatus(service, ServiceStatus.RESTARTING, 'Service restarting');
    
    // Simulate service restart
    setTimeout(() => {
      this.setServiceStatus(service, ServiceStatus.RUNNING, 'Service restarted');
    }, 2000);
  }

  /**
   * Mark service as failed
   * @param {string} service - Service
   * @param {string} reason - Failure reason
   */
  markServiceFailed(service, reason = '') {
    this.setServiceStatus(service, ServiceStatus.FAILED, reason || 'Service failed');
  }

  /**
   * Mark service as recovering
   * @param {string} service - Service
   */
  markServiceRecovering(service) {
    this.setServiceStatus(service, ServiceStatus.RECOVERING, 'Service recovering');
  }

  /**
   * Get service statistics
   * @returns {object} Statistics
   */
  getServiceStatistics() {
    const allServices = Array.from(this.serviceStatus.values());
    const total = allServices.length;

    const byStatus = {};
    allServices.forEach(service => {
      byStatus[service.status] = (byStatus[service.status] || 0) + 1;
    });

    const running = byStatus[ServiceStatus.RUNNING] || 0;
    const failed = byStatus[ServiceStatus.FAILED] || 0;
    const stopped = byStatus[ServiceStatus.STOPPED] || 0;

    const totalRestarts = allServices.reduce((sum, service) => sum + service.restartCount, 0);

    return {
      total,
      running,
      failed,
      stopped,
      totalRestarts,
      runningPercentage: total > 0 ? Math.round((running / total) * 100) : 0
    };
  }

  /**
   * Get running services
   * @returns {Array} Running services
   */
  getRunningServices() {
    return Array.from(this.serviceStatus.values()).filter(
      service => service.status === ServiceStatus.RUNNING
    );
  }

  /**
   * Get failed services
   * @returns {Array} Failed services
   */
  getFailedServices() {
    return Array.from(this.serviceStatus.values()).filter(
      service => service.status === ServiceStatus.FAILED
    );
  }

  /**
   * Destroy the service status tracker
   */
  destroy() {
    this.serviceStatus.clear();
    console.log('[ServiceStatusTracker] Destroyed');
  }
}

// Singleton instance
let serviceStatusTrackerInstance = null;

/**
 * Get the singleton service status tracker instance
 * @returns {ServiceStatusTracker} Service status tracker instance
 */
export function getServiceStatusTracker() {
  if (!serviceStatusTrackerInstance) {
    serviceStatusTrackerInstance = new ServiceStatusTracker();
  }
  return serviceStatusTrackerInstance;
}

export default ServiceStatusTracker;
