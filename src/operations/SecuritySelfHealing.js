// Security Self-Healing
// Detect suspicious activity, auto-lock sessions, rate limit failed logins, auto-rotate credentials

export class SecuritySelfHealing {
  constructor(options = {}) {
    this.options = {
      maxFailedAttempts: options.maxFailedAttempts || 5,
      lockoutDuration: options.lockoutDuration || 15 * 60 * 1000, // 15 minutes
      suspiciousActivityThreshold: options.suspiciousActivityThreshold || 10,
      credentialRotationInterval: options.credentialRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days
      autoLockEnabled: options.autoLockEnabled !== false,
      autoRotateEnabled: options.autoRotateEnabled !== false,
      ...options
    };
    
    this.failedAttempts = new Map();
    this.lockedAccounts = new Map();
    this.suspiciousActivity = [];
    this.credentialRotationSchedule = new Map();
    this.eventHandlers = new Map();
    this.loadSecurityState();
  }

  /**
   * Load security state from localStorage
   */
  loadSecurityState() {
    try {
      const stored = localStorage.getItem('cafeos_security_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.failedAttempts = new Map(state.failedAttempts || []);
        this.lockedAccounts = new Map(state.lockedAccounts || []);
        this.suspiciousActivity = state.suspiciousActivity || [];
        this.credentialRotationSchedule = new Map(state.credentialRotationSchedule || []);
      }
    } catch (error) {
      console.error('[SecuritySelfHealing] Failed to load security state:', error);
    }
  }

  /**
   * Save security state to localStorage
   */
  saveSecurityState() {
    try {
      const state = {
        failedAttempts: Array.from(this.failedAttempts),
        lockedAccounts: Array.from(this.lockedAccounts),
        suspiciousActivity: this.suspiciousActivity.slice(-100), // Keep last 100
        credentialRotationSchedule: Array.from(this.credentialRotationSchedule)
      };
      
      localStorage.setItem('cafeos_security_state', JSON.stringify(state));
    } catch (error) {
      console.error('[SecuritySelfHealing] Failed to save security state:', error);
    }
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(identifier, metadata = {}) {
    const attempts = this.failedAttempts.get(identifier) || [];
    
    attempts.push({
      timestamp: Date.now(),
      metadata
    });
    
    // Keep only recent attempts (last 10)
    if (attempts.length > 10) {
      attempts.shift();
    }
    
    this.failedAttempts.set(identifier, attempts);
    
    // Check if should lock
    if (attempts.length >= this.options.maxFailedAttempts) {
      this.lockAccount(identifier, 'Too many failed attempts');
    }
    
    this.saveSecurityState();
    
    return {
      attempts: attempts.length,
      remaining: this.options.maxFailedAttempts - attempts.length,
      locked: attempts.length >= this.options.maxFailedAttempts
    };
  }

  /**
   * Record successful login
   */
  recordSuccessfulLogin(identifier, metadata = {}) {
    // Clear failed attempts on successful login
    this.failedAttempts.delete(identifier);
    
    // Unlock if locked
    if (this.lockedAccounts.has(identifier)) {
      this.unlockAccount(identifier);
    }
    
    this.saveSecurityState();
    
    this.emit('loginSuccess', { identifier, metadata });
  }

  /**
   * Lock account
   */
  lockAccount(identifier, reason = 'Security lock') {
    const lockUntil = Date.now() + this.options.lockoutDuration;
    
    this.lockedAccounts.set(identifier, {
      reason,
      lockedAt: Date.now(),
      lockUntil
    });
    
    console.warn(`[SecuritySelfHealing] Account locked: ${identifier} - ${reason}`);
    
    this.emit('accountLocked', { identifier, reason, lockUntil });
    
    this.saveSecurityState();
  }

  /**
   * Unlock account
   */
  unlockAccount(identifier) {
    const lockInfo = this.lockedAccounts.get(identifier);
    
    if (lockInfo) {
      this.lockedAccounts.delete(identifier);
      
      console.log(`[SecuritySelfHealing] Account unlocked: ${identifier}`);
      
      this.emit('accountUnlocked', { identifier });
      
      this.saveSecurityState();
    }
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(identifier) {
    const lockInfo = this.lockedAccounts.get(identifier);
    
    if (!lockInfo) {
      return false;
    }
    
    // Check if lock has expired
    if (Date.now() > lockInfo.lockUntil) {
      this.unlockAccount(identifier);
      return false;
    }
    
    return true;
  }

  /**
   * Get remaining lock time
   */
  getRemainingLockTime(identifier) {
    const lockInfo = this.lockedAccounts.get(identifier);
    
    if (!lockInfo) {
      return 0;
    }
    
    const remaining = lockInfo.lockUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(activity) {
    const suspiciousActivity = {
      type: activity.type || 'unknown',
      identifier: activity.identifier,
      description: activity.description,
      severity: activity.severity || 'medium',
      timestamp: Date.now(),
      metadata: activity.metadata || {}
    };
    
    this.suspiciousActivity.push(suspiciousActivity);
    
    // Check if should lock based on threshold
    const recentActivity = this.suspiciousActivity.filter(
      a => a.identifier === activity.identifier && 
      (Date.now() - a.timestamp) < 60 * 60 * 1000 // Last hour
    );
    
    if (recentActivity.length >= this.options.suspiciousActivityThreshold) {
      this.lockAccount(activity.identifier, 'Suspicious activity detected');
    }
    
    this.saveSecurityState();
    
    this.emit('suspiciousActivity', suspiciousActivity);
  }

  /**
   * Get suspicious activity for identifier
   */
  getSuspiciousActivity(identifier, limit = 20) {
    return this.suspiciousActivity
      .filter(a => a.identifier === identifier)
      .slice(-limit);
  }

  /**
   * Schedule credential rotation
   */
  scheduleCredentialRotation(credentialId, rotationDate) {
    this.credentialRotationSchedule.set(credentialId, {
      scheduledDate: rotationDate,
      lastRotated: Date.now()
    });
    
    this.saveSecurityState();
    
    this.emit('credentialRotationScheduled', { credentialId, rotationDate });
  }

  /**
   * Check if credentials need rotation
   */
  checkCredentialRotation(credentialId) {
    const schedule = this.credentialRotationSchedule.get(credentialId);
    
    if (!schedule) {
      return { needsRotation: false };
    }
    
    const now = Date.now();
    const nextRotation = schedule.lastRotated + this.options.credentialRotationInterval;
    
    if (now >= nextRotation) {
      return {
        needsRotation: true,
        lastRotated: schedule.lastRotated,
        overdueBy: now - nextRotation
      };
    }
    
    return {
      needsRotation: false,
      lastRotated: schedule.lastRotated,
      nextRotation: nextRotation,
      daysUntilRotation: Math.floor((nextRotation - now) / (24 * 60 * 60 * 1000))
    };
  }

  /**
   * Mark credentials as rotated
   */
  markCredentialsRotated(credentialId) {
    const schedule = this.credentialRotationSchedule.get(credentialId) || {};
    
    this.credentialRotationSchedule.set(credentialId, {
      ...schedule,
      lastRotated: Date.now(),
      scheduledDate: Date.now() + this.options.credentialRotationInterval
    });
    
    this.saveSecurityState();
    
    this.emit('credentialsRotated', { credentialId });
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics() {
    const now = Date.now();
    
    return {
      failedAttempts: Object.fromEntries(this.failedAttempts),
      lockedAccounts: Object.fromEntries(this.lockedAccounts),
      suspiciousActivityCount: this.suspiciousActivity.length,
      recentSuspiciousActivity: this.suspiciousActivity.slice(-10),
      credentialRotationSchedule: Object.fromEntries(this.credentialRotationSchedule),
      credentialsNeedingRotation: this.getCredentialsNeedingRotation()
    };
  }

  /**
   * Get credentials needing rotation
   */
  getCredentialsNeedingRotation() {
    const needingRotation = [];
    
    this.credentialRotationSchedule.forEach((schedule, credentialId) => {
      const check = this.checkCredentialRotation(credentialId);
      if (check.needsRotation) {
        needingRotation.push({
          credentialId,
          lastRotated: check.lastRotated,
          overdueBy: check.overdueBy
        });
      }
    });
    
    return needingRotation;
  }

  /**
   * Clear old suspicious activity
   */
  clearOldSuspiciousActivity(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAge;
    
    this.suspiciousActivity = this.suspiciousActivity.filter(
      a => a.timestamp > cutoff
    );
    
    this.saveSecurityState();
  }

  /**
   * Clear failed attempts for identifier
   */
  clearFailedAttempts(identifier) {
    this.failedAttempts.delete(identifier);
    this.saveSecurityState();
  }

  /**
   * Get failed attempts for identifier
   */
  getFailedAttempts(identifier) {
    return this.failedAttempts.get(identifier) || [];
  }

  /**
   * Update security options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
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
          console.error(`[SecuritySelfHealing] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the security self-healing
   */
  destroy() {
    this.failedAttempts.clear();
    this.lockedAccounts.clear();
    this.credentialRotationSchedule.clear();
    this.eventHandlers.clear();
    console.log('[SecuritySelfHealing] Destroyed');
  }
}

// Singleton instance
let securitySelfHealingInstance = null;

/**
 * Get the singleton security self-healing instance
 */
export function getSecuritySelfHealing(options = {}) {
  if (!securitySelfHealingInstance) {
    securitySelfHealingInstance = new SecuritySelfHealing(options);
  }
  return securitySelfHealingInstance;
}

export default SecuritySelfHealing;
