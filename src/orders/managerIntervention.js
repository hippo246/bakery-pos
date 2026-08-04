// Manager Intervention
// Remote manager controls for approvals, unlocks, cancellations

import { now } from '../domain/dates.js';
import { getTerminalManager } from './terminalManager.js';
import { getApprovalEngine } from '../pricing/approvalEngine.js';

const INTERVENTIONS_KEY = 'cafeos_manager_interventions';

/**
 * Intervention Types
 */
export const INTERVENTION_TYPES = {
  APPROVE_DISCOUNT: 'APPROVE_DISCOUNT',
  APPROVE_VOID: 'APPROVE_VOID',
  APPROVE_REFUND: 'APPROVE_REFUND',
  UNLOCK_TERMINAL: 'UNLOCK_TERMINAL',
  CANCEL_ORDER: 'CANCEL_ORDER',
  TRANSFER_TABLE: 'TRANSFER_TABLE',
  FORCE_COMPLETE_WORKFLOW: 'FORCE_COMPLETE_WORKFLOW',
  OVERRIDE_PRICE: 'OVERRIDE_PRICE',
  ADJUST_QUANTITY: 'ADJUST_QUANTITY',
  FORCE_CLOSE_SHIFT: 'FORCE_CLOSE_SHIFT'
};

/**
 * Intervention Status
 */
export const INTERVENTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

/**
 * Manager Intervention class
 * Remote manager controls for approvals, unlocks, cancellations
 */
export class ManagerIntervention {
  constructor() {
    this.interventions = new Map();
    this.loadInterventions();
  }

  /**
   * Load interventions from localStorage
   */
  loadInterventions() {
    try {
      const stored = localStorage.getItem(INTERVENTIONS_KEY);
      if (stored) {
        const interventions = JSON.parse(stored);
        interventions.forEach(intervention => {
          this.interventions.set(intervention.id, intervention);
        });
      }
    } catch (error) {
      console.error('[ManagerIntervention] Failed to load interventions:', error);
    }
  }

  /**
   * Save interventions to localStorage
   */
  saveInterventions() {
    try {
      const interventions = Array.from(this.interventions.values());
      localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(interventions));
    } catch (error) {
      console.error('[ManagerIntervention] Failed to save interventions:', error);
    }
  }

  /**
   * Create intervention request
   * @param {Object} interventionData - Intervention data
   * @returns {Object} Created intervention
   */
  createIntervention(interventionData) {
    const intervention = {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: interventionData.type || INTERVENTION_TYPES.APPROVE_DISCOUNT,
      
      // Source
      requestedBy: interventionData.requestedBy || null,
      requestedFromTerminalId: interventionData.requestedFromTerminalId || null,
      requestedFromStaffId: interventionData.requestedFromStaffId || null,
      
      // Target
      targetOrderId: interventionData.targetOrderId || null,
      targetTableId: interventionData.targetTableId || null,
      targetTerminalId: interventionData.targetTerminalId || null,
      targetStaffId: interventionData.targetStaffId || null,
      targetShiftId: interventionData.targetShiftId || null,
      
      // Details
      reason: interventionData.reason || '',
      details: interventionData.details || {},
      
      // Status
      status: INTERVENTION_STATUS.PENDING,
      
      // Approval
      requiresApproval: interventionData.requiresApproval !== false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      
      // Execution
      executedBy: null,
      executedAt: null,
      executionResult: null,
      
      // Priority
      priority: interventionData.priority || 'MEDIUM',
      
      // Timestamps
      createdAt: now(),
      expiresAt: interventionData.expiresAt || null,
      
      // Metadata
      metadata: interventionData.metadata || {}
    };

    this.interventions.set(intervention.id, intervention);
    this.saveInterventions();

    return intervention;
  }

  /**
   * Get intervention by ID
   * @param {string} interventionId - Intervention ID
   * @returns {Object|null} Intervention or null
   */
  getIntervention(interventionId) {
    return this.interventions.get(interventionId) || null;
  }

  /**
   * Get all interventions
   * @returns {Array} Array of interventions
   */
  getAllInterventions() {
    return Array.from(this.interventions.values());
  }

  /**
   * Get interventions by status
   * @param {string} status - Intervention status
   * @returns {Array} Array of interventions
   */
  getInterventionsByStatus(status) {
    return this.getAllInterventions().filter(i => i.status === status);
  }

  /**
   * Get interventions by type
   * @param {string} type - Intervention type
   * @returns {Array} Array of interventions
   */
  getInterventionsByType(type) {
    return this.getAllInterventions().filter(i => i.type === type);
  }

  /**
   * Get pending interventions
   * @returns {Array} Array of pending interventions
   */
  getPendingInterventions() {
    return this.getInterventionsByStatus(INTERVENTION_STATUS.PENDING);
  }

  /**
   * Get interventions for terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Array} Array of interventions
   */
  getInterventionsForTerminal(terminalId) {
    return this.getAllInterventions().filter(i => 
      i.targetTerminalId === terminalId || i.requestedFromTerminalId === terminalId
    );
  }

  /**
   * Approve intervention
   * @param {string} interventionId - Intervention ID
   * @param {string} managerId - Manager ID
   * @param {string} notes - Approval notes
   * @returns {Object} Result
   */
  approveIntervention(interventionId, managerId, notes = '') {
    const intervention = this.interventions.get(interventionId);
    if (!intervention) {
      return { success: false, reason: 'Intervention not found' };
    }

    if (intervention.status !== INTERVENTION_STATUS.PENDING) {
      return { success: false, reason: `Intervention is ${intervention.status.toLowerCase()}` };
    }

    intervention.status = INTERVENTION_STATUS.APPROVED;
    intervention.approvedBy = managerId;
    intervention.approvedAt = now();
    intervention.approvalNotes = notes;

    this.interventions.set(interventionId, intervention);
    this.saveInterventions();

    return { success: true, intervention };
  }

  /**
   * Reject intervention
   * @param {string} interventionId - Intervention ID
   * @param {string} managerId - Manager ID
   * @param {string} reason - Rejection reason
   * @returns {Object} Result
   */
  rejectIntervention(interventionId, managerId, reason = '') {
    const intervention = this.interventions.get(interventionId);
    if (!intervention) {
      return { success: false, reason: 'Intervention not found' };
    }

    if (intervention.status !== INTERVENTION_STATUS.PENDING) {
      return { success: false, reason: `Intervention is ${intervention.status.toLowerCase()}` };
    }

    intervention.status = INTERVENTION_STATUS.REJECTED;
    intervention.approvedBy = managerId;
    intervention.approvedAt = now();
    intervention.rejectionReason = reason;

    this.interventions.set(interventionId, intervention);
    this.saveInterventions();

    return { success: true, intervention };
  }

  /**
   * Execute intervention
   * @param {string} interventionId - Intervention ID
   * @param {string} executorId - Executor ID
   * @returns {Object} Result
   */
  executeIntervention(interventionId, executorId) {
    const intervention = this.interventions.get(interventionId);
    if (!intervention) {
      return { success: false, reason: 'Intervention not found' };
    }

    if (intervention.status !== INTERVENTION_STATUS.APPROVED) {
      return { success: false, reason: `Intervention is ${intervention.status.toLowerCase()}` };
    }

    // Execute based on type
    const executionResult = this.executeByType(intervention);

    intervention.status = executionResult.success ? INTERVENTION_STATUS.COMPLETED : INTERVENTION_STATUS.FAILED;
    intervention.executedBy = executorId;
    intervention.executedAt = now();
    intervention.executionResult = executionResult;

    this.interventions.set(interventionId, intervention);
    this.saveInterventions();

    return { success: executionResult.success, intervention, executionResult };
  }

  /**
   * Execute intervention by type
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeByType(intervention) {
    switch (intervention.type) {
      case INTERVENTION_TYPES.APPROVE_DISCOUNT:
        return this.executeApproveDiscount(intervention);

      case INTERVENTION_TYPES.APPROVE_VOID:
        return this.executeApproveVoid(intervention);

      case INTERVENTION_TYPES.APPROVE_REFUND:
        return this.executeApproveRefund(intervention);

      case INTERVENTION_TYPES.UNLOCK_TERMINAL:
        return this.executeUnlockTerminal(intervention);

      case INTERVENTION_TYPES.CANCEL_ORDER:
        return this.executeCancelOrder(intervention);

      case INTERVENTION_TYPES.TRANSFER_TABLE:
        return this.executeTransferTable(intervention);

      case INTERVENTION_TYPES.FORCE_COMPLETE_WORKFLOW:
        return this.executeForceCompleteWorkflow(intervention);

      case INTERVENTION_TYPES.OVERRIDE_PRICE:
        return this.executeOverridePrice(intervention);

      case INTERVENTION_TYPES.ADJUST_QUANTITY:
        return this.executeAdjustQuantity(intervention);

      case INTERVENTION_TYPES.FORCE_CLOSE_SHIFT:
        return this.executeForceCloseShift(intervention);

      default:
        return { success: false, reason: 'Unknown intervention type' };
    }
  }

  /**
   * Execute approve discount
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeApproveDiscount(intervention) {
    const approvalEngine = getApprovalEngine();
    
    // In a real implementation, this would approve the discount request
    // For now, we'll create an approval record
    const approval = approvalEngine.createApproval({
      type: 'DISCOUNT',
      orderId: intervention.targetOrderId,
      requestedBy: intervention.requestedBy,
      amount: intervention.details.amount || 0,
      reason: intervention.reason
    });

    const result = approvalEngine.approveApproval(approval.id, intervention.approvedBy);

    return {
      success: result.success,
      approvalId: approval.id,
      result
    };
  }

  /**
   * Execute approve void
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeApproveVoid(intervention) {
    const approvalEngine = getApprovalEngine();
    
    const approval = approvalEngine.createApproval({
      type: 'VOID',
      orderId: intervention.targetOrderId,
      requestedBy: intervention.requestedBy,
      reason: intervention.reason
    });

    const result = approvalEngine.approveApproval(approval.id, intervention.approvedBy);

    return {
      success: result.success,
      approvalId: approval.id,
      result
    };
  }

  /**
   * Execute approve refund
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeApproveRefund(intervention) {
    const approvalEngine = getApprovalEngine();
    
    const approval = approvalEngine.createApproval({
      type: 'REFUND',
      orderId: intervention.targetOrderId,
      requestedBy: intervention.requestedBy,
      amount: intervention.details.amount || 0,
      reason: intervention.reason
    });

    const result = approvalEngine.approveApproval(approval.id, intervention.approvedBy);

    return {
      success: result.success,
      approvalId: approval.id,
      result
    };
  }

  /**
   * Execute unlock terminal
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeUnlockTerminal(intervention) {
    const terminalManager = getTerminalManager();
    
    const result = terminalManager.unlockTerminal(intervention.targetTerminalId);

    return {
      success: result.success,
      terminalId: intervention.targetTerminalId,
      result
    };
  }

  /**
   * Execute cancel order
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeCancelOrder(intervention) {
    // In a real implementation, this would cancel the order
    // For now, we'll return a placeholder result
    return {
      success: true,
      orderId: intervention.targetOrderId,
      cancelledBy: intervention.approvedBy,
      cancelledAt: now()
    };
  }

  /**
   * Execute transfer table
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeTransferTable(intervention) {
    // In a real implementation, this would transfer the table
    // For now, we'll return a placeholder result
    const fromTableId = intervention.details.fromTableId;
    const toTableId = intervention.details.toTableId;

    return {
      success: true,
      fromTableId,
      toTableId,
      transferredBy: intervention.approvedBy,
      transferredAt: now()
    };
  }

  /**
   * Execute force complete workflow
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeForceCompleteWorkflow(intervention) {
    // In a real implementation, this would force complete the workflow
    // For now, we'll return a placeholder result
    return {
      success: true,
      workflowId: intervention.details.workflowId,
      completedBy: intervention.approvedBy,
      completedAt: now()
    };
  }

  /**
   * Execute override price
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeOverridePrice(intervention) {
    // In a real implementation, this would override the price
    // For now, we'll return a placeholder result
    return {
      success: true,
      orderId: intervention.targetOrderId,
      newPrice: intervention.details.newPrice,
      overriddenBy: intervention.approvedBy,
      overriddenAt: now()
    };
  }

  /**
   * Execute adjust quantity
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeAdjustQuantity(intervention) {
    // In a real implementation, this would adjust the quantity
    // For now, we'll return a placeholder result
    return {
      success: true,
      orderId: intervention.targetOrderId,
      menuItemId: intervention.details.menuItemId,
      newQuantity: intervention.details.newQuantity,
      adjustedBy: intervention.approvedBy,
      adjustedAt: now()
    };
  }

  /**
   * Execute force close shift
   * @param {Object} intervention - Intervention object
   * @returns {Object} Execution result
   */
  executeForceCloseShift(intervention) {
    // In a real implementation, this would force close the shift
    // For now, we'll return a placeholder result
    return {
      success: true,
      shiftId: intervention.targetShiftId,
      closedBy: intervention.approvedBy,
      closedAt: now()
    };
  }

  /**
   * Request discount approval
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestDiscountApproval(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.APPROVE_DISCOUNT,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetOrderId: requestData.orderId,
      reason: requestData.reason || 'Discount approval required',
      details: {
        amount: requestData.amount,
        discountType: requestData.discountType
      },
      priority: requestData.priority || 'MEDIUM'
    });
  }

  /**
   * Request void approval
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestVoidApproval(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.APPROVE_VOID,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetOrderId: requestData.orderId,
      reason: requestData.reason || 'Void approval required',
      details: {
        voidAmount: requestData.voidAmount
      },
      priority: requestData.priority || 'HIGH'
    });
  }

  /**
   * Request refund approval
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestRefundApproval(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.APPROVE_REFUND,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetOrderId: requestData.orderId,
      reason: requestData.reason || 'Refund approval required',
      details: {
        amount: requestData.amount,
        refundMethod: requestData.refundMethod
      },
      priority: requestData.priority || 'HIGH'
    });
  }

  /**
   * Request terminal unlock
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestTerminalUnlock(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.UNLOCK_TERMINAL,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetTerminalId: requestData.terminalId,
      reason: requestData.reason || 'Terminal unlock required',
      priority: requestData.priority || 'HIGH'
    });
  }

  /**
   * Request order cancellation
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestOrderCancellation(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.CANCEL_ORDER,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetOrderId: requestData.orderId,
      reason: requestData.reason || 'Order cancellation required',
      priority: requestData.priority || 'HIGH'
    });
  }

  /**
   * Request table transfer
   * @param {Object} requestData - Request data
   * @returns {Object} Created intervention
   */
  requestTableTransfer(requestData) {
    return this.createIntervention({
      type: INTERVENTION_TYPES.TRANSFER_TABLE,
      requestedBy: requestData.requestedBy,
      requestedFromTerminalId: requestData.terminalId,
      requestedFromStaffId: requestData.staffId,
      targetTableId: requestData.toTableId,
      reason: requestData.reason || 'Table transfer required',
      details: {
        fromTableId: requestData.fromTableId,
        toTableId: requestData.toTableId
      },
      priority: requestData.priority || 'MEDIUM'
    });
  }

  /**
   * Update intervention
   * @param {string} interventionId - Intervention ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated intervention or null
   */
  updateIntervention(interventionId, updates) {
    const intervention = this.interventions.get(interventionId);
    if (!intervention) return null;

    const updated = {
      ...intervention,
      ...updates,
      updatedAt: now()
    };

    this.interventions.set(interventionId, updated);
    this.saveInterventions();

    return updated;
  }

  /**
   * Delete intervention
   * @param {string} interventionId - Intervention ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteIntervention(interventionId) {
    const deleted = this.interventions.delete(interventionId);
    if (deleted) {
      this.saveInterventions();
    }
    return deleted;
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const interventions = this.getAllInterventions();

    return {
      totalInterventions: interventions.length,
      byStatus: interventions.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {}),
      byType: interventions.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {}),
      pending: this.getPendingInterventions().length,
      completed: interventions.filter(i => i.status === INTERVENTION_STATUS.COMPLETED).length,
      failed: interventions.filter(i => i.status === INTERVENTION_STATUS.FAILED).length
    };
  }

  /**
   * Export interventions
   * @returns {Object} Exported interventions
   */
  exportInterventions() {
    return {
      interventions: Array.from(this.interventions.values()),
      exportedAt: now()
    };
  }

  /**
   * Import interventions
   * @param {Object} data - Imported interventions data
   * @returns {Object} Import result
   */
  importInterventions(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.interventions)) {
        data.interventions.forEach(intervention => {
          this.interventions.set(intervention.id, intervention);
        });
      }

      this.saveInterventions();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let managerInterventionInstance = null;

/**
 * Get the manager intervention singleton
 * @returns {ManagerIntervention} Manager intervention instance
 */
export function getManagerIntervention() {
  if (!managerInterventionInstance) {
    managerInterventionInstance = new ManagerIntervention();
  }
  return managerInterventionInstance;
}

/**
 * Reset the manager intervention (useful for testing)
 */
export function resetManagerIntervention() {
  managerInterventionInstance = null;
}

/**
 * Convenience function to create an intervention
 * @param {Object} interventionData - Intervention data
 * @returns {Object} Created intervention
 */
export function createIntervention(interventionData = {}) {
  const intervention = getManagerIntervention();
  return intervention.createIntervention(interventionData);
}

/**
 * Convenience function to approve an intervention
 * @param {string} interventionId - Intervention ID
 * @param {string} managerId - Manager ID
 * @param {string} notes - Approval notes
 * @returns {Object} Result
 */
export function approveIntervention(interventionId, managerId, notes = '') {
  const intervention = getManagerIntervention();
  return intervention.approveIntervention(interventionId, managerId, notes);
}
