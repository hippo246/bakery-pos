// Authentication Health Check Provider
// Real health checks for authentication

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';
import { isAuthenticated, getCurrentUserId, getCurrentRoleType } from '../../utils/authService.js';

/**
 * Health check provider for Authentication
 * Verifies authentication service and session management
 */
export class AuthenticationHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'authentication',
      'Authentication',
      ComponentCategory.AUTHENTICATION
    );
  }

  /**
   * Perform authentication health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check if authentication service is available
      const serviceCheck = await this.checkAuthService();
      if (!serviceCheck.success) {
        return this.createCriticalResult({
          reason: `Authentication service check failed: ${serviceCheck.error}`,
          recommendedAction: 'Check authentication service configuration'
        });
      }

      // Check session management
      const sessionCheck = await this.checkSessionManagement();
      if (!sessionCheck.success) {
        return this.createWarningResult({
          reason: `Session management check failed: ${sessionCheck.error}`,
          recommendedAction: 'Verify session storage and configuration'
        });
      }

      // Check user session
      const userCheck = await this.checkUserSession();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, serviceCheck, sessionCheck, userCheck);

      return this.createHealthyResult({
        reason: 'Authentication service is operational',
        latency,
        healthScore,
        metadata: {
          serviceAvailable: serviceCheck.available,
          sessionOperational: sessionCheck.operational,
          hasActiveSession: userCheck.hasSession,
          userId: userCheck.userId,
          roleType: userCheck.roleType
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Authentication health check error: ${error.message}`,
        recommendedAction: 'Check authentication service logs'
      });
    }
  }

  /**
   * Check authentication service
   * @returns {Promise<Object>}
   */
  async checkAuthService() {
    try {
      // Check if authentication functions are available
      const available = typeof isAuthenticated === 'function';
      
      return {
        success: available,
        available,
        error: available ? null : 'Authentication service not available'
      };
    } catch (error) {
      return {
        success: false,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Check session management
   * @returns {Promise<Object>}
   */
  async checkSessionManagement() {
    try {
      // Try to access session storage
      const hasSessionStorage = typeof sessionStorage !== 'undefined';
      const hasLocalStorage = typeof localStorage !== 'undefined';
      
      const operational = hasSessionStorage && hasLocalStorage;
      
      return {
        success: operational,
        operational,
        error: operational ? null : 'Session storage not available'
      };
    } catch (error) {
      return {
        success: false,
        operational: false,
        error: error.message
      };
    }
  }

  /**
   * Check user session
   * @returns {Promise<Object>}
   */
  async checkUserSession() {
    try {
      const hasSession = isAuthenticated();
      const userId = hasSession ? getCurrentUserId() : null;
      const roleType = hasSession ? getCurrentRoleType() : null;
      
      return {
        success: true,
        hasSession,
        userId,
        roleType,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        hasSession: false,
        userId: null,
        roleType: null,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} serviceCheck - Service check result
   * @param {Object} sessionCheck - Session check result
   * @param {Object} userCheck - User session check result
   * @returns {number}
   */
  calculateHealthScore(latency, serviceCheck, sessionCheck, userCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 100) score -= 10;
    if (latency > 500) score -= 20;

    // Deduct for failed checks
    if (!serviceCheck.success) score -= 40;
    if (!sessionCheck.success) score -= 30;
    if (!userCheck.success) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Get authentication version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default AuthenticationHealthCheck;
