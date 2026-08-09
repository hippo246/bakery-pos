// External Service Health Monitoring
// Monitor payment gateway status, Zomato/Swiggy API availability, auto-switch to backup services

import { getPaymentGatewayFactory } from '../payment/PaymentGatewayFactory.js';
import { getDeliveryPlatformFactory } from '../delivery/DeliveryPlatformFactory.js';

export class ServiceHealthMonitor {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 60000, // 1 minute
      timeout: options.timeout || 10000, // 10 seconds
      failureThreshold: options.failureThreshold || 3, // 3 failures before marking unhealthy
      recoveryThreshold: options.recoveryThreshold || 2, // 2 successes before marking healthy
      autoSwitchEnabled: options.autoSwitchEnabled !== false,
      ...options
    };
    
    this.services = new Map();
    this.healthStatus = new Map();
    this.failureCounts = new Map();
    this.successCounts = new Map();
    this.checkTimers = new Map();
    this.eventHandlers = new Map();
    this.isMonitoring = false;
  }

  /**
   * Register service for monitoring
   */
  registerService(serviceId, config) {
    const service = {
      id: serviceId,
      name: config.name || serviceId,
      type: config.type || 'http',
      url: config.url,
      method: config.method || 'GET',
      headers: config.headers || {},
      timeout: config.timeout || this.options.timeout,
      checkFn: config.checkFn,
      isCritical: config.isCritical || false,
      backupServiceId: config.backupServiceId || null,
      enabled: config.enabled !== false
    };
    
    this.services.set(serviceId, service);
    this.healthStatus.set(serviceId, 'unknown');
    this.failureCounts.set(serviceId, 0);
    this.successCounts.set(serviceId, 0);
    
    console.log(`[ServiceHealthMonitor] Registered service: ${serviceId}`);
  }

  /**
   * Unregister service
   */
  unregisterService(serviceId) {
    this.stopMonitoringService(serviceId);
    this.services.delete(serviceId);
    this.healthStatus.delete(serviceId);
    this.failureCounts.delete(serviceId);
    this.successCounts.delete(serviceId);
    
    console.log(`[ServiceHealthMonitor] Unregistered service: ${serviceId}`);
  }

  /**
   * Start monitoring all services
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    console.log('[ServiceHealthMonitor] Starting monitoring');
    this.isMonitoring = true;
    
    this.services.forEach((service, serviceId) => {
      if (service.enabled) {
        this.startMonitoringService(serviceId);
      }
    });
  }

  /**
   * Stop monitoring all services
   */
  stopMonitoring() {
    console.log('[ServiceHealthMonitor] Stopping monitoring');
    this.isMonitoring = false;
    
    this.checkTimers.forEach((timer, serviceId) => {
      clearInterval(timer);
    });
    
    this.checkTimers.clear();
  }

  /**
   * Start monitoring specific service
   */
  startMonitoringService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service || !service.enabled) {
      return;
    }
    
    // Clear existing timer
    this.stopMonitoringService(serviceId);
    
    // Start health check
    this.checkServiceHealth(serviceId);
    
    // Set up periodic checks
    const timer = setInterval(() => {
      this.checkServiceHealth(serviceId);
    }, this.options.checkInterval);
    
    this.checkTimers.set(serviceId, timer);
  }

  /**
   * Stop monitoring specific service
   */
  stopMonitoringService(serviceId) {
    const timer = this.checkTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.checkTimers.delete(serviceId);
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      return;
    }
    
    const checkStartTime = Date.now();
    
    try {
      let result;
      
      if (service.checkFn) {
        // Use custom check function
        result = await service.checkFn();
      } else if (service.type === 'http') {
        // HTTP health check
        result = await this.checkHttpService(service);
      } else if (service.type === 'payment') {
        // Payment gateway health check
        result = await this.checkPaymentGateway(service);
      } else if (service.type === 'delivery') {
        // Delivery platform health check
        result = await this.checkDeliveryPlatform(service);
      } else {
        result = { healthy: false, error: 'Unknown service type' };
      }
      
      const responseTime = Date.now() - checkStartTime;
      
      if (result.healthy) {
        this.handleServiceSuccess(serviceId, responseTime, result);
      } else {
        this.handleServiceFailure(serviceId, result.error || 'Health check failed', responseTime);
      }
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - checkStartTime;
      this.handleServiceFailure(serviceId, error.message, responseTime);
      
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check HTTP service
   */
  async checkHttpService(service) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout);
    
    try {
      const response = await fetch(service.url, {
        method: service.method,
        headers: service.headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { healthy: true, status: response.status };
      } else {
        return { healthy: false, error: `HTTP ${response.status}`, status: response.status };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { healthy: false, error: 'Timeout' };
      }
      
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check payment gateway health
   */
  async checkPaymentGateway(service) {
    try {
      const factory = getPaymentGatewayFactory();
      const gatewayType = service.gatewayType;
      
      if (!gatewayType) {
        return { healthy: false, error: 'No gateway type specified' };
      }
      
      // Check if gateway is configured
      const isConfigured = factory.platformConfig.isConfigured(gatewayType);
      if (!isConfigured) {
        return { healthy: false, error: 'Gateway not configured' };
      }
      
      // Try to get gateway instance (this tests connection)
      const gateway = await factory.getGateway(gatewayType);
      
      return { healthy: true, gateway: gatewayType };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check delivery platform health
   */
  async checkDeliveryPlatform(service) {
    try {
      const factory = getDeliveryPlatformFactory();
      const platformType = service.platformType;
      
      if (!platformType) {
        return { healthy: false, error: 'No platform type specified' };
      }
      
      // Check if platform is configured
      const isConfigured = factory.platformConfig.isConfigured(platformType);
      if (!isConfigured) {
        return { healthy: false, error: 'Platform not configured' };
      }
      
      // Try to get platform instance (this tests connection)
      const platform = await factory.getPlatform(platformType);
      
      return { healthy: true, platform: platformType };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Handle service success
   */
  handleServiceSuccess(serviceId, responseTime, result) {
    const previousStatus = this.healthStatus.get(serviceId);
    const failureCount = this.failureCounts.get(serviceId) || 0;
    const successCount = this.successCounts.get(serviceId) || 0;
    
    // Reset failure count on success
    this.failureCounts.set(serviceId, 0);
    this.successCounts.set(serviceId, successCount + 1);
    
    // Mark as healthy if enough consecutive successes
    if (previousStatus === 'unhealthy' && successCount >= this.options.recoveryThreshold) {
      this.healthStatus.set(serviceId, 'healthy');
      this.emit('serviceRecovered', { serviceId, responseTime, result });
    } else if (previousStatus !== 'healthy') {
      this.healthStatus.set(serviceId, 'healthy');
      this.emit('serviceHealthy', { serviceId, responseTime, result });
    }
    
    this.emit('serviceCheck', {
      serviceId,
      healthy: true,
      responseTime,
      result
    });
  }

  /**
   * Handle service failure
   */
  handleServiceFailure(serviceId, error, responseTime) {
    const previousStatus = this.healthStatus.get(serviceId);
    const failureCount = this.failureCounts.get(serviceId) || 0;
    const successCount = this.successCounts.get(serviceId) || 0;
    
    // Reset success count on failure
    this.successCounts.set(serviceId, 0);
    this.failureCounts.set(serviceId, failureCount + 1);
    
    // Mark as unhealthy if enough consecutive failures
    if (failureCount >= this.options.failureThreshold) {
      this.healthStatus.set(serviceId, 'unhealthy');
      
      this.emit('serviceUnhealthy', { serviceId, error, responseTime });
      
      // Auto-switch to backup if enabled
      if (this.options.autoSwitchEnabled) {
        this.switchToBackup(serviceId);
      }
    } else {
      this.emit('serviceDegraded', { serviceId, error, responseTime, failureCount });
    }
    
    this.emit('serviceCheck', {
      serviceId,
      healthy: false,
      responseTime,
      error
    });
  }

  /**
   * Switch to backup service
   */
  switchToBackup(serviceId) {
    const service = this.services.get(serviceId);
    if (!service || !service.backupServiceId) {
      console.log(`[ServiceHealthMonitor] No backup service for ${serviceId}`);
      return;
    }
    
    const backupServiceId = service.backupServiceId;
    const backupService = this.services.get(backupServiceId);
    
    if (!backupService) {
      console.log(`[ServiceHealthMonitor] Backup service ${backupServiceId} not found`);
      return;
    }
    
    console.log(`[ServiceHealthMonitor] Switching from ${serviceId} to ${backupServiceId}`);
    
    this.emit('serviceSwitch', {
      from: serviceId,
      to: backupServiceId,
      reason: 'Primary service unhealthy'
    });
    
    // Enable backup service
    backupService.enabled = true;
    this.startMonitoringService(backupServiceId);
    
    // Disable primary service temporarily
    service.enabled = false;
    this.stopMonitoringService(serviceId);
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceId) {
    return {
      serviceId,
      status: this.healthStatus.get(serviceId) || 'unknown',
      failureCount: this.failureCounts.get(serviceId) || 0,
      successCount: this.successCounts.get(serviceId) || 0,
      service: this.services.get(serviceId)
    };
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth() {
    const statuses = {};
    
    this.services.forEach((service, serviceId) => {
      statuses[serviceId] = this.getServiceHealth(serviceId);
    });
    
    return statuses;
  }

  /**
   * Get overall health summary
   */
  getHealthSummary() {
    const summary = {
      total: this.services.size,
      healthy: 0,
      unhealthy: 0,
      unknown: 0,
      critical: 0
    };
    
    this.services.forEach((service, serviceId) => {
      const status = this.healthStatus.get(serviceId) || 'unknown';
      
      if (status === 'healthy') {
        summary.healthy++;
      } else if (status === 'unhealthy') {
        summary.unhealthy++;
        if (service.isCritical) {
          summary.critical++;
        }
      } else {
        summary.unknown++;
      }
    });
    
    return summary;
  }

  /**
   * Register default services
   */
  registerDefaultServices() {
    // Payment gateways
    this.registerService('razorpay', {
      name: 'Razorpay',
      type: 'payment',
      gatewayType: 'razorpay',
      isCritical: true,
      backupServiceId: 'stripe'
    });
    
    this.registerService('stripe', {
      name: 'Stripe',
      type: 'payment',
      gatewayType: 'stripe',
      isCritical: true
    });
    
    this.registerService('phonepe', {
      name: 'PhonePe',
      type: 'payment',
      gatewayType: 'phonepe',
      isCritical: true,
      backupServiceId: 'razorpay'
    });
    
    this.registerService('cashfree', {
      name: 'Cashfree',
      type: 'payment',
      gatewayType: 'cashfree',
      isCritical: false
    });
    
    // Delivery platforms
    this.registerService('zomato', {
      name: 'Zomato',
      type: 'delivery',
      platformType: 'zomato',
      isCritical: true,
      backupServiceId: 'swiggy'
    });
    
    this.registerService('swiggy', {
      name: 'Swiggy',
      type: 'delivery',
      platformType: 'swiggy',
      isCritical: true
    });
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[ServiceHealthMonitor] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the health monitor
   */
  destroy() {
    this.stopMonitoring();
    this.services.clear();
    this.healthStatus.clear();
    this.failureCounts.clear();
    this.successCounts.clear();
    this.eventHandlers.clear();
    console.log('[ServiceHealthMonitor] Destroyed');
  }
}

// Singleton instance
let serviceHealthMonitorInstance = null;

/**
 * Get the singleton service health monitor instance
 */
export function getServiceHealthMonitor(options = {}) {
  if (!serviceHealthMonitorInstance) {
    serviceHealthMonitorInstance = new ServiceHealthMonitor(options);
    serviceHealthMonitorInstance.registerDefaultServices();
  }
  return serviceHealthMonitorInstance;
}

export default ServiceHealthMonitor;
