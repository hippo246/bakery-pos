// Approval Engine
// Requires manager approval for pricing overrides, discounts, refunds, voids

import { now } from '../domain/dates.js';

const APPROVAL_REQUESTS_KEY = 'cafeos_approval_requests';

/**
 * Approval Types
 */
export const APPROVAL_TYPES = {
  LARGE_DISCOUNT: 'LARGE_DISCOUNT',
  PRICE_OVERRIDE: 'PRICE_OVERRIDE',
  REFUND: 'REFUND',
  VOID: 'VOID',
  TAX_OVERRIDE: 'TAX_OVERRIDE',
  PROMOTION_OVERRIDE: 'PROMOTION_OVERRIDE',
  MANUAL_DISCOUNT: 'MANUAL_DISCOUNT',
  EMERGENCY_OVERRIDE: 'EMERGENCY_OVERRIDE'
};

/**
 * Approval Status
 */
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

/**
 * Approval Engine class
 * Requires manager approval for pricing overrides
 */
export class ApprovalEngine {
  constructor() {
    this.approvalRequests = new Map();
    this.approvalThresholds = new Map();
    this.loadApprovalRequests();
    this.loadApprovalThresholds();
    this.startExpirationChecker();
  }

  /**
   * Load approval requests from localStorage
   */
  loadApprovalRequests() {
    try {
      const stored = localStorage.getItem(APPROVAL_REQUESTS_KEY);
      if (stored) {
        const requests = JSON.parse(stored);
        requests.forEach(request => {
          this.approvalRequests.set(request.id, request);
        });
      }
    } catch (error) {
      console.error('[ApprovalEngine] Failed to load approval requests:', error);
    }
  }

  /**
   * Save approval requests to localStorage
   */
  saveApprovalRequests() {
    try {
      const requests = Array.from(this.approvalRequests.values());
      localStorage.setItem(APPROVAL_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('[ApprovalEngine] Failed to save approval requests:', error);
    }
  }

  /**
   * Load approval thresholds from localStorage
   */
  loadApprovalThresholds() {
    try {
      const stored = localStorage.getItem('cafeos_approval_thresholds');
      if (stored) {
        const thresholds = JSON.parse(stored);
        Object.entries(thresholds).forEach(([key, value]) => {
          this.approvalThresholds.set(key, value);
        });
      } else {
        // Set default thresholds
        this.setDefaultThresholds();
      }
    } catch (error) {
      console.error('[ApprovalEngine] Failed to load approval thresholds:', error);
      this.setDefaultThresholds();
    }
  }

  /**
   * Save approval thresholds to localStorage
   */
  saveApprovalThresholds() {
    try {
      const thresholds = Object.fromEntries(this.approvalThresholds);
      localStorage.setItem('cafeos_approval_thresholds', JSON.stringify(thresholds));
    } catch (error) {
      console.error('[ApprovalEngine] Failed to save approval thresholds:', error);
    }
  }

  /**
   * Set default approval thresholds
   */
  setDefaultThresholds() {
    this.approvalThresholds.set(APPROVAL_TYPES.LARGE_DISCOUNT, {
      enabled: true,
      threshold: 20, // Percentage
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.PRICE_OVERRIDE, {
      enabled: true,
      threshold: 10, // Percentage deviation
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.REFUND, {
      enabled: true,
      threshold: 100, // Amount
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.VOID, {
      enabled: true,
      threshold: 50, // Amount
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.TAX_OVERRIDE, {
      enabled: true,
      threshold: 5, // Percentage deviation
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.PROMOTION_OVERRIDE, {
      enabled: true,
      threshold: 0, // Always requires approval
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.MANUAL_DISCOUNT, {
      enabled: true,
      threshold: 15, // Percentage
      requiresApproval: true
    });

    this.approvalThresholds.set(APPROVAL_TYPES.EMERGENCY_OVERRIDE, {
      enabled: true,
      threshold: 0, // Always requires approval
      requiresApproval: true
    });

    this.saveApprovalThresholds();
  }

  /**
   * Start expiration checker for pending approvals
   */
  startExpirationChecker() {
    // Check every 5 minutes for expired approvals
    setInterval(() => {
      this.checkExpiredApprovals();
    }, 300000);
  }

  /**
   * Check and expire pending approvals
   */
  checkExpiredApprovals() {
    const currentTime = now();
    const expirationTime = 30 * 60 * 1000; // 30 minutes

    for (const [requestId, request] of this.approvalRequests) {
      if (request.status === APPROVAL_STATUS.PENDING) {
        if (currentTime - request.createdAt > expirationTime) {
          request.status = APPROVAL_STATUS.EXPIRED;
          request.expiredAt = currentTime;
          this.saveApprovalRequests();
        }
      }
    }
  }

  /**
   * Check if approval is required
   * @param {string} approvalType - Approval type
   * @param {Object} context - Approval context
   * @returns {Object} Check result
   */
  checkApprovalRequired(approvalType, context) {
    const threshold = this.approvalThresholds.get(approvalType);

    if (!threshold || !threshold.enabled) {
      return {
        required: false,
        reason: 'Approval type not configured or disabled'
      };
    }

    if (!threshold.requiresApproval) {
      return {
        required: false,
        reason: 'Approval not required for this type'
      };
    }

    // Check threshold
    let value = context.value || 0;
    let exceedsThreshold = false;

    switch (approvalType) {
      case APPROVAL_TYPES.LARGE_DISCOUNT:
      case APPROVAL_TYPES.MANUAL_DISCOUNT:
        exceedsThreshold = value >= threshold.threshold;
        break;

      case APPROVAL_TYPES.PRICE_OVERRIDE:
      case APPROVAL_TYPES.TAX_OVERRIDE:
        exceedsThreshold = Math.abs(value) >= threshold.threshold;
        break;

      case APPROVAL_TYPES.REFUND:
      case APPROVAL_TYPES.VOID:
        exceedsThreshold = value >= threshold.threshold;
        break;

      case APPROVAL_TYPES.PROMOTION_OVERRIDE:
      case APPROVAL_TYPES.EMERGENCY_OVERRIDE:
        exceedsThreshold = true; // Always requires approval
        break;

      default:
        exceedsThreshold = false;
    }

    return {
      required: exceedsThreshold,
      threshold: threshold.threshold,
      value,
      reason: exceedsThreshold ? 'Value exceeds threshold' : 'Value within threshold'
    };
  }

  /**
   * Create an approval request
   * @param {Object} requestData - Request data
   * @returns {Object} Approval request result
   */
  createApprovalRequest(requestData) {
    const check = this.checkApprovalRequired(requestData.type, requestData);

    if (!check.required) {
      return {
        success: true,
        approvalRequired: false,
        reason: check.reason
      };
    }

    const request = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: requestData.type,
      status: APPROVAL_STATUS.PENDING,
      
      // Request details
      orderId: requestData.orderId || null,
      orderNumber: requestData.orderNumber || null,
      branchId: requestData.branchId || null,
      terminalId: requestData.terminalId || null,
      
      // Approval data
      requestedBy: requestData.requestedBy || null,
      requestedByRole: requestData.requestedByRole || 'STAFF',
      value: requestData.value || 0,
      reason: requestData.reason || '',
      details: requestData.details || {},
      
      // Timestamps
      createdAt: now(),
      expiresAt: now() + (30 * 60 * 1000), // 30 minutes
      approvedAt: null,
      rejectedAt: null,
      
      // Approval details
      approvedBy: null,
      approvedByRole: null,
      rejectionReason: null,
      
      // Metadata
      metadata: requestData.metadata || {}
    };

    this.approvalRequests.set(request.id, request);
    this.saveApprovalRequests();

    return {
      success: true,
      approvalRequired: true,
      request
    };
  }

  /**
   * Approve a request
   * @param {string} requestId - Request ID
   * @param {Object} approvalData - Approval data
   * @returns {Object} Approval result
   */
  approveRequest(requestId, approvalData) {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      return {
        success: false,
        reason: 'Approval request not found'
      };
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      return {
        success: false,
        reason: `Request is ${request.status.toLowerCase()}`
      };
    }

    // Check if expired
    if (now() > request.expiresAt) {
      request.status = APPROVAL_STATUS.EXPIRED;
      request.expiredAt = now();
      this.saveApprovalRequests();

      return {
        success: false,
        reason: 'Request has expired'
      };
    }

    // Approve
    request.status = APPROVAL_STATUS.APPROVED;
    request.approvedBy = approvalData.approvedBy;
    request.approvedByRole = approvalData.approvedByRole || 'MANAGER';
    request.approvedAt = now();
    request.approvalNotes = approvalData.notes || '';

    this.saveApprovalRequests();

    return {
      success: true,
      request
    };
  }

  /**
   * Reject a request
   * @param {string} requestId - Request ID
   * @param {Object} rejectionData - Rejection data
   * @returns {Object} Rejection result
   */
  rejectRequest(requestId, rejectionData) {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      return {
        success: false,
        reason: 'Approval request not found'
      };
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      return {
        success: false,
        reason: `Request is ${request.status.toLowerCase()}`
      };
    }

    // Reject
    request.status = APPROVAL_STATUS.REJECTED;
    request.rejectedBy = rejectionData.rejectedBy;
    request.rejectedByRole = rejectionData.rejectedByRole || 'MANAGER';
    request.rejectedAt = now();
    request.rejectionReason = rejectionData.reason || '';

    this.saveApprovalRequests();

    return {
      success: true,
      request
    };
  }

  /**
   * Cancel a request
   * @param {string} requestId - Request ID
   * @param {string} cancelledBy - Who cancelled
   * @returns {Object} Cancellation result
   */
  cancelRequest(requestId, cancelledBy) {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      return {
        success: false,
        reason: 'Approval request not found'
      };
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      return {
        success: false,
        reason: `Request is ${request.status.toLowerCase()}`
      };
    }

    request.status = APPROVAL_STATUS.CANCELLED;
    request.cancelledBy = cancelledBy;
    request.cancelledAt = now();

    this.saveApprovalRequests();

    return {
      success: true,
      request
    };
  }

  /**
   * Get approval request by ID
   * @param {string} requestId - Request ID
   * @returns {Object|null} Request or null
   */
  getRequest(requestId) {
    return this.approvalRequests.get(requestId) || null;
  }

  /**
   * Get all approval requests
   * @returns {Array} Array of requests
   */
  getAllRequests() {
    return Array.from(this.approvalRequests.values());
  }

  /**
   * Get pending requests
   * @returns {Array} Array of pending requests
   */
  getPendingRequests() {
    return this.getAllRequests().filter(r => r.status === APPROVAL_STATUS.PENDING);
  }

  /**
   * Get requests by status
   * @param {string} status - Approval status
   * @returns {Array} Array of requests
   */
  getRequestsByStatus(status) {
    return this.getAllRequests().filter(r => r.status === status);
  }

  /**
   * Get requests by type
   * @param {string} type - Approval type
   * @returns {Array} Array of requests
   */
  getRequestsByType(type) {
    return this.getAllRequests().filter(r => r.type === type);
  }

  /**
   * Get requests by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of requests
   */
  getRequestsByOrder(orderId) {
    return this.getAllRequests().filter(r => r.orderId === orderId);
  }

  /**
   * Get requests by requester
   * @param {string} requestedBy - Requester ID
   * @returns {Array} Array of requests
   */
  getRequestsByRequester(requestedBy) {
    return this.getAllRequests().filter(r => r.requestedBy === requestedBy);
  }

  /**
   * Get requests by approver
   * @param {string} approvedBy - Approver ID
   * @returns {Array} Array of requests
   */
  getRequestsByApprover(approvedBy) {
    return this.getAllRequests().filter(r => r.approvedBy === approvedBy);
  }

  /**
   * Set approval threshold
   * @param {string} approvalType - Approval type
   * @param {Object} threshold - Threshold configuration
   * @returns {Object} Result
   */
  setThreshold(approvalType, threshold) {
    const existing = this.approvalThresholds.get(approvalType) || {};
    this.approvalThresholds.set(approvalType, { ...existing, ...threshold });
    this.saveApprovalThresholds();

    return {
      success: true,
      approvalType,
      threshold: this.approvalThresholds.get(approvalType)
    };
  }

  /**
   * Get approval threshold
   * @param {string} approvalType - Approval type
   * @returns {Object|null} Threshold or null
   */
  getThreshold(approvalType) {
    return this.approvalThresholds.get(approvalType) || null;
  }

  /**
   * Get all thresholds
   * @returns {Object} All thresholds
   */
  getAllThresholds() {
    return Object.fromEntries(this.approvalThresholds);
  }

  /**
   * Get approval statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const requests = this.getAllRequests();

    return {
      totalRequests: requests.length,
      byStatus: requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      byType: requests.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {}),
      pending: requests.filter(r => r.status === APPROVAL_STATUS.PENDING).length,
      approved: requests.filter(r => r.status === APPROVAL_STATUS.APPROVED).length,
      rejected: requests.filter(r => r.status === APPROVAL_STATUS.REJECTED).length,
      expired: requests.filter(r => r.status === APPROVAL_STATUS.EXPIRED).length,
      averageApprovalTime: this.calculateAverageApprovalTime(requests)
    };
  }

  /**
   * Calculate average approval time
   * @param {Array} requests - Array of requests
   * @returns {number} Average time in milliseconds
   */
  calculateAverageApprovalTime(requests) {
    const approved = requests.filter(r => r.status === APPROVAL_STATUS.APPROVED && r.approvedAt);
    
    if (approved.length === 0) return 0;

    const totalTime = approved.reduce((sum, r) => {
      return sum + (r.approvedAt - r.createdAt);
    }, 0);

    return totalTime / approved.length;
  }

  /**
   * Export approval requests
   * @returns {Object} Exported requests
   */
  exportRequests() {
    return {
      requests: Array.from(this.approvalRequests.values()),
      thresholds: Object.fromEntries(this.approvalThresholds),
      exportedAt: now()
    };
  }

  /**
   * Import approval requests
   * @param {Object} data - Imported requests data
   * @returns {Object} Import result
   */
  importRequests(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.requests)) {
        data.requests.forEach(request => {
          this.approvalRequests.set(request.id, request);
        });
      }

      if (data.thresholds && typeof data.thresholds === 'object') {
        Object.entries(data.thresholds).forEach(([key, value]) => {
          this.approvalThresholds.set(key, value);
        });
      }

      this.saveApprovalRequests();
      this.saveApprovalThresholds();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let approvalEngineInstance = null;

/**
 * Get the approval engine singleton
 * @returns {ApprovalEngine} Approval engine instance
 */
export function getApprovalEngine() {
  if (!approvalEngineInstance) {
    approvalEngineInstance = new ApprovalEngine();
  }
  return approvalEngineInstance;
}

/**
 * Reset the approval engine (useful for testing)
 */
export function resetApprovalEngine() {
  approvalEngineInstance = null;
}

/**
 * Convenience function to check if approval is required
 * @param {string} approvalType - Approval type
 * @param {Object} context - Approval context
 * @returns {Object} Check result
 */
export function checkApprovalRequired(approvalType, context = {}) {
  const engine = getApprovalEngine();
  return engine.checkApprovalRequired(approvalType, context);
}

/**
 * Convenience function to create an approval request
 * @param {Object} requestData - Request data
 * @returns {Object} Approval request result
 */
export function createApprovalRequest(requestData = {}) {
  const engine = getApprovalEngine();
  return engine.createApprovalRequest(requestData);
}
