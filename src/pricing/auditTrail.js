// Audit Trail
// Records every pricing decision with immutable history

import { now } from '../domain/dates.js';

const AUDIT_TRAIL_KEY = 'cafeos_pricing_audit';

/**
 * Audit Event Types
 */
export const AUDIT_EVENT_TYPES = {
  PRICE_CALCULATION: 'PRICE_CALCULATION',
  DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
  PROMOTION_APPLIED: 'PROMOTION_APPLIED',
  COUPON_REDEEMED: 'COUPON_REDEEMED',
  TAX_CALCULATED: 'TAX_CALCULATED',
  APPROVAL_GRANTED: 'APPROVAL_GRANTED',
  APPROVAL_DENIED: 'APPROVAL_DENIED',
  RULE_MODIFIED: 'RULE_MODIFIED',
  RULE_CREATED: 'RULE_CREATED',
  RULE_DELETED: 'RULE_DELETED',
  CONFLICT_RESOLVED: 'CONFLICT_RESOLVED',
  OVERRIDE_APPLIED: 'OVERRIDE_APPLIED',
  PRICING_ERROR: 'PRICING_ERROR'
};

/**
 * Audit Trail class
 * Records every pricing decision with immutable history
 */
export class PricingAuditTrail {
  constructor() {
    this.auditEvents = new Map();
    this.loadAuditEvents();
  }

  /**
   * Load audit events from localStorage
   */
  loadAuditEvents() {
    try {
      const stored = localStorage.getItem(AUDIT_TRAIL_KEY);
      if (stored) {
        const events = JSON.parse(stored);
        events.forEach(event => {
          this.auditEvents.set(event.id, event);
        });
      }
    } catch (error) {
      console.error('[PricingAuditTrail] Failed to load audit events:', error);
    }
  }

  /**
   * Save audit events to localStorage
   */
  saveAuditEvents() {
    try {
      const events = Array.from(this.auditEvents.values());
      localStorage.setItem(AUDIT_TRAIL_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('[PricingAuditTrail] Failed to save audit events:', error);
    }
  }

  /**
   * Record a pricing calculation
   * @param {Object} calculationData - Calculation data
   * @returns {Object} Audit event
   */
  recordPriceCalculation(calculationData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.PRICE_CALCULATION,
      orderId: calculationData.orderId,
      branchId: calculationData.branchId,
      terminalId: calculationData.terminalId,
      menuItemId: calculationData.menuItemId,
      categoryId: calculationData.categoryId,
      customerId: calculationData.customerId,
      
      // Calculation details
      basePrice: calculationData.basePrice,
      finalPrice: calculationData.finalPrice,
      appliedRules: calculationData.appliedRules || [],
      calculationSteps: calculationData.calculationSteps || [],
      
      // Context
      context: calculationData.context || {},
      
      // Metadata
      userId: calculationData.userId || null,
      sessionId: calculationData.sessionId || null
    });
  }

  /**
   * Record a discount application
   * @param {Object} discountData - Discount data
   * @returns {Object} Audit event
   */
  recordDiscountApplied(discountData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.DISCOUNT_APPLIED,
      orderId: discountData.orderId,
      branchId: discountData.branchId,
      terminalId: discountData.terminalId,
      
      // Discount details
      discountRuleId: discountData.discountRuleId,
      discountType: discountData.discountType,
      discountValue: discountData.discountValue,
      discountAmount: discountData.discountAmount,
      baseAmount: discountData.baseAmount,
      finalAmount: discountData.finalAmount,
      
      // Approval
      approvalId: discountData.approvalId || null,
      approvedBy: discountData.approvedBy || null,
      
      // Metadata
      userId: discountData.userId || null,
      reason: discountData.reason || ''
    });
  }

  /**
   * Record a promotion application
   * @param {Object} promotionData - Promotion data
   * @returns {Object} Audit event
   */
  recordPromotionApplied(promotionData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.PROMOTION_APPLIED,
      orderId: promotionData.orderId,
      branchId: promotionData.branchId,
      terminalId: promotionData.terminalId,
      
      // Promotion details
      promotionId: promotionData.promotionId,
      promotionType: promotionData.promotionType,
      promotionName: promotionData.promotionName,
      discountAmount: promotionData.discountAmount,
      bonusPoints: promotionData.bonusPoints,
      freeItemId: promotionData.freeItemId,
      
      // Context
      customerId: promotionData.customerId,
      
      // Metadata
      userId: promotionData.userId || null
    });
  }

  /**
   * Record a coupon redemption
   * @param {Object} couponData - Coupon data
   * @returns {Object} Audit event
   */
  recordCouponRedeemed(couponData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.COUPON_REDEEMED,
      orderId: couponData.orderId,
      branchId: couponData.branchId,
      terminalId: couponData.terminalId,
      
      // Coupon details
      couponCode: couponData.couponCode,
      couponType: couponData.couponType,
      discountAmount: couponData.discountAmount,
      bonusPoints: couponData.bonusPoints,
      
      // Customer
      customerId: couponData.customerId,
      
      // Metadata
      userId: couponData.userId || null
    });
  }

  /**
   * Record a tax calculation
   * @param {Object} taxData - Tax data
   * @returns {Object} Audit event
   */
  recordTaxCalculated(taxData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.TAX_CALCULATED,
      orderId: taxData.orderId,
      branchId: taxData.branchId,
      terminalId: taxData.terminalId,
      
      // Tax details
      taxRuleId: taxData.taxRuleId,
      taxType: taxData.taxType,
      taxRate: taxData.taxRate,
      calculationMethod: taxData.calculationMethod,
      baseAmount: taxData.baseAmount,
      taxAmount: taxData.taxAmount,
      finalAmount: taxData.finalAmount,
      
      // Calculation steps
      calculationSteps: taxData.calculationSteps || [],
      
      // Metadata
      userId: taxData.userId || null
    });
  }

  /**
   * Record an approval granted
   * @param {Object} approvalData - Approval data
   * @returns {Object} Audit event
   */
  recordApprovalGranted(approvalData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.APPROVAL_GRANTED,
      approvalId: approvalData.approvalId,
      approvalType: approvalData.approvalType,
      orderId: approvalData.orderId,
      branchId: approvalData.branchId,
      
      // Approval details
      requestedBy: approvalData.requestedBy,
      approvedBy: approvalData.approvedBy,
      approvedByRole: approvalData.approvedByRole,
      value: approvalData.value,
      reason: approvalData.reason,
      
      // Metadata
      approvalNotes: approvalData.approvalNotes || ''
    });
  }

  /**
   * Record an approval denied
   * @param {Object} approvalData - Approval data
   * @returns {Object} Audit event
   */
  recordApprovalDenied(approvalData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.APPROVAL_DENIED,
      approvalId: approvalData.approvalId,
      approvalType: approvalData.approvalType,
      orderId: approvalData.orderId,
      branchId: approvalData.branchId,
      
      // Approval details
      requestedBy: approvalData.requestedBy,
      rejectedBy: approvalData.rejectedBy,
      rejectedByRole: approvalData.rejectedByRole,
      value: approvalData.value,
      rejectionReason: approvalData.rejectionReason
    });
  }

  /**
   * Record a rule modification
   * @param {Object} ruleData - Rule data
   * @returns {Object} Audit event
   */
  recordRuleModified(ruleData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.RULE_MODIFIED,
      ruleId: ruleData.ruleId,
      ruleType: ruleData.ruleType,
      
      // Modification details
      previousValues: ruleData.previousValues || {},
      newValues: ruleData.newValues || {},
      changedFields: ruleData.changedFields || [],
      
      // Metadata
      modifiedBy: ruleData.modifiedBy || null,
      reason: ruleData.reason || ''
    });
  }

  /**
   * Record a rule creation
   * @param {Object} ruleData - Rule data
   * @returns {Object} Audit event
   */
  recordRuleCreated(ruleData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.RULE_CREATED,
      ruleId: ruleData.ruleId,
      ruleType: ruleData.ruleType,
      
      // Rule details
      ruleValues: ruleData.ruleValues || {},
      
      // Metadata
      createdBy: ruleData.createdBy || null,
      reason: ruleData.reason || ''
    });
  }

  /**
   * Record a rule deletion
   * @param {Object} ruleData - Rule data
   * @returns {Object} Audit event
   */
  recordRuleDeleted(ruleData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.RULE_DELETED,
      ruleId: ruleData.ruleId,
      ruleType: ruleData.ruleType,
      
      // Rule details
      deletedValues: ruleData.deletedValues || {},
      
      // Metadata
      deletedBy: ruleData.deletedBy || null,
      reason: ruleData.reason || ''
    });
  }

  /**
   * Record a conflict resolution
   * @param {Object} conflictData - Conflict data
   * @returns {Object} Audit event
   */
  recordConflictResolved(conflictData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.CONFLICT_RESOLVED,
      orderId: conflictData.orderId,
      branchId: conflictData.branchId,
      
      // Conflict details
      conflictingRules: conflictData.conflictingRules || [],
      appliedRules: conflictData.appliedRules || [],
      rejectedRules: conflictData.rejectedRules || [],
      resolutionStrategy: conflictData.resolutionStrategy,
      
      // Metadata
      userId: conflictData.userId || null
    });
  }

  /**
   * Record an override application
   * @param {Object} overrideData - Override data
   * @returns {Object} Audit event
   */
  recordOverrideApplied(overrideData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.OVERRIDE_APPLIED,
      orderId: overrideData.orderId,
      branchId: overrideData.branchId,
      terminalId: overrideData.terminalId,
      
      // Override details
      overrideType: overrideData.overrideType,
      originalValue: overrideData.originalValue,
      overriddenValue: overrideData.overriddenValue,
      reason: overrideData.reason,
      
      // Approval
      approvalId: overrideData.approvalId || null,
      approvedBy: overrideData.approvedBy || null,
      
      // Metadata
      userId: overrideData.userId || null
    });
  }

  /**
   * Record a pricing error
   * @param {Object} errorData - Error data
   * @returns {Object} Audit event
   */
  recordPricingError(errorData) {
    return this.recordEvent({
      eventType: AUDIT_EVENT_TYPES.PRICING_ERROR,
      orderId: errorData.orderId,
      branchId: errorData.branchId,
      terminalId: errorData.terminalId,
      
      // Error details
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      errorStack: errorData.errorStack || null,
      context: errorData.context || {},
      
      // Metadata
      userId: errorData.userId || null
    });
  }

  /**
   * Record a generic audit event
   * @param {Object} eventData - Event data
   * @returns {Object} Audit event
   */
  recordEvent(eventData) {
    const event = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: eventData.eventType,
      
      // Order context
      orderId: eventData.orderId || null,
      branchId: eventData.branchId || null,
      terminalId: eventData.terminalId || null,
      
      // Customer context
      customerId: eventData.customerId || null,
      
      // Item context
      menuItemId: eventData.menuItemId || null,
      categoryId: eventData.categoryId || null,
      
      // Event-specific data
      data: {
        ...eventData
      },
      
      // Timestamps
      timestamp: now(),
      
      // Metadata
      userId: eventData.userId || null,
      sessionId: eventData.sessionId || null,
      metadata: eventData.metadata || {}
    };

    this.auditEvents.set(event.id, event);
    this.saveAuditEvents();

    return event;
  }

  /**
   * Get audit event by ID
   * @param {string} eventId - Event ID
   * @returns {Object|null} Event or null
   */
  getEvent(eventId) {
    return this.auditEvents.get(eventId) || null;
  }

  /**
   * Get all audit events
   * @returns {Array} Array of events
   */
  getAllEvents() {
    return Array.from(this.auditEvents.values());
  }

  /**
   * Get events by type
   * @param {string} eventType - Event type
   * @returns {Array} Array of events
   */
  getEventsByType(eventType) {
    return this.getAllEvents().filter(e => e.eventType === eventType);
  }

  /**
   * Get events by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of events
   */
  getEventsByOrder(orderId) {
    return this.getAllEvents().filter(e => e.orderId === orderId);
  }

  /**
   * Get events by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of events
   */
  getEventsByBranch(branchId) {
    return this.getAllEvents().filter(e => e.branchId === branchId);
  }

  /**
   * Get events by user
   * @param {string} userId - User ID
   * @returns {Array} Array of events
   */
  getEventsByUser(userId) {
    return this.getAllEvents().filter(e => e.userId === userId);
  }

  /**
   * Get events by date range
   * @param {number} startDate - Start timestamp
   * @param {number} endDate - End timestamp
   * @returns {Array} Array of events
   */
  getEventsByDateRange(startDate, endDate) {
    return this.getAllEvents().filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  /**
   * Get events with pagination
   * @param {Object} options - Pagination options
   * @returns {Object} Paginated result
   */
  getEventsPaginated(options = {}) {
    const {
      page = 1,
      pageSize = 50,
      eventType,
      orderId,
      branchId,
      userId,
      startDate,
      endDate
    } = options;

    let events = this.getAllEvents();

    // Apply filters
    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }
    if (orderId) {
      events = events.filter(e => e.orderId === orderId);
    }
    if (branchId) {
      events = events.filter(e => e.branchId === branchId);
    }
    if (userId) {
      events = events.filter(e => e.userId === userId);
    }
    if (startDate) {
      events = events.filter(e => e.timestamp >= startDate);
    }
    if (endDate) {
      events = events.filter(e => e.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      page,
      pageSize,
      totalEvents: events.length,
      totalPages: Math.ceil(events.length / pageSize),
      hasNextPage: page < Math.ceil(events.length / pageSize),
      hasPreviousPage: page > 1
    };
  }

  /**
   * Get pricing history for an order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of events
   */
  getOrderPricingHistory(orderId) {
    const events = this.getEventsByOrder(orderId);
    
    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    return events.map(event => ({
      timestamp: event.timestamp,
      eventType: event.eventType,
      description: this.getEventDescription(event),
      data: event.data
    }));
  }

  /**
   * Get event description
   * @param {Object} event - Audit event
   * @returns {string} Event description
   */
  getEventDescription(event) {
    switch (event.eventType) {
      case AUDIT_EVENT_TYPES.PRICE_CALCULATION:
        return `Price calculated: ${event.data.basePrice} → ${event.data.finalPrice}`;
      
      case AUDIT_EVENT_TYPES.DISCOUNT_APPLIED:
        return `Discount applied: ${event.data.discountType} - ${event.data.discountAmount}`;
      
      case AUDIT_EVENT_TYPES.PROMOTION_APPLIED:
        return `Promotion applied: ${event.data.promotionName}`;
      
      case AUDIT_EVENT_TYPES.COUPON_REDEEMED:
        return `Coupon redeemed: ${event.data.couponCode}`;
      
      case AUDIT_EVENT_TYPES.TAX_CALCULATED:
        return `Tax calculated: ${event.data.taxType} - ${event.data.taxAmount}`;
      
      case AUDIT_EVENT_TYPES.APPROVAL_GRANTED:
        return `Approval granted for ${event.data.approvalType} by ${event.data.approvedBy}`;
      
      case AUDIT_EVENT_TYPES.APPROVAL_DENIED:
        return `Approval denied for ${event.data.approvalType} by ${event.data.rejectedBy}`;
      
      case AUDIT_EVENT_TYPES.RULE_MODIFIED:
        return `Rule modified: ${event.data.ruleId}`;
      
      case AUDIT_EVENT_TYPES.RULE_CREATED:
        return `Rule created: ${event.data.ruleId}`;
      
      case AUDIT_EVENT_TYPES.RULE_DELETED:
        return `Rule deleted: ${event.data.ruleId}`;
      
      case AUDIT_EVENT_TYPES.CONFLICT_RESOLVED:
        return `Conflict resolved using ${event.data.resolutionStrategy}`;
      
      case AUDIT_EVENT_TYPES.OVERRIDE_APPLIED:
        return `Override applied: ${event.data.overrideType}`;
      
      case AUDIT_EVENT_TYPES.PRICING_ERROR:
        return `Pricing error: ${event.data.errorMessage}`;
      
      default:
        return `Unknown event: ${event.eventType}`;
    }
  }

  /**
   * Get audit statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const events = this.getAllEvents();

    return {
      totalEvents: events.length,
      byEventType: events.reduce((acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      }, {}),
      byBranch: events.reduce((acc, e) => {
        if (e.branchId) {
          acc[e.branchId] = (acc[e.branchId] || 0) + 1;
        }
        return acc;
      }, {}),
      byUser: events.reduce((acc, e) => {
        if (e.userId) {
          acc[e.userId] = (acc[e.userId] || 0) + 1;
        }
        return acc;
      }, {}),
      oldestEvent: events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : null,
      newestEvent: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : null
    };
  }

  /**
   * Clean up old audit events
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of events cleaned up
   */
  cleanupOldEvents(olderThan = 90 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleaned = 0;

    for (const [eventId, event] of this.auditEvents) {
      if (event.timestamp < cutoff) {
        this.auditEvents.delete(eventId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveAuditEvents();
    }

    return cleaned;
  }

  /**
   * Export audit events
   * @param {Object} options - Export options
   * @returns {Object} Exported events
   */
  exportEvents(options = {}) {
    let events = this.getAllEvents();

    if (options.startDate) {
      events = events.filter(e => e.timestamp >= options.startDate);
    }
    if (options.endDate) {
      events = events.filter(e => e.timestamp <= options.endDate);
    }

    return {
      events,
      exportedAt: now(),
      totalEvents: events.length
    };
  }

  /**
   * Import audit events
   * @param {Object} data - Imported events data
   * @returns {Object} Import result
   */
  importEvents(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.events)) {
        data.events.forEach(event => {
          this.auditEvents.set(event.id, event);
        });
      }

      this.saveAuditEvents();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let auditTrailInstance = null;

/**
 * Get the pricing audit trail singleton
 * @returns {PricingAuditTrail} Audit trail instance
 */
export function getPricingAuditTrail() {
  if (!auditTrailInstance) {
    auditTrailInstance = new PricingAuditTrail();
  }
  return auditTrailInstance;
}

/**
 * Reset the audit trail (useful for testing)
 */
export function resetPricingAuditTrail() {
  auditTrailInstance = null;
}

/**
 * Convenience function to record price calculation
 * @param {Object} calculationData - Calculation data
 * @returns {Object} Audit event
 */
export function recordPriceCalculation(calculationData) {
  const trail = getPricingAuditTrail();
  return trail.recordPriceCalculation(calculationData);
}
