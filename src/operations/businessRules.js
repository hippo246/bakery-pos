// Business Rules Engine
// Integrates triggers, conditions, and actions for deterministic rule execution

import { now } from '../domain/dates.js';
import { getEventOrchestration } from './eventOrchestration.js';
import { getRuleBuilder } from './ruleBuilder.js';
import { getTriggerLibrary } from './triggerLibrary.js';
import { getActionLibrary } from './actionLibrary.js';

const RULE_EXECUTIONS_KEY = 'cafeos_rule_executions';

/**
 * Execution Status
 */
export const EXECUTION_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT'
};

/**
 * Business Rules Engine class
 * Integrates triggers, conditions, and actions for deterministic rule execution
 */
export class BusinessRulesEngine {
  constructor() {
    this.executions = new Map();
    this.loadExecutions();
    this.setupEventListeners();
  }

  /**
   * Load executions from localStorage
   */
  loadExecutions() {
    try {
      const stored = localStorage.getItem(RULE_EXECUTIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.executions) {
          data.executions.forEach(exec => {
            this.executions.set(exec.id, exec);
          });
        }
      }
    } catch (error) {
      console.error('[BusinessRulesEngine] Failed to load executions:', error);
    }
  }

  /**
   * Save executions to localStorage
   */
  saveExecutions() {
    try {
      const executions = Array.from(this.executions.values());
      localStorage.setItem(RULE_EXECUTIONS_KEY, JSON.stringify({ executions }));
    } catch (error) {
      console.error('[BusinessRulesEngine] Failed to save executions:', error);
    }
  }

  /**
   * Setup event listeners for trigger events
   */
  setupEventListeners() {
    const eventOrchestration = getEventOrchestration();

    // Subscribe to all events and check for matching rules
    eventOrchestration.subscribe({
      source: null // Listen to all sources
    }, (event) => {
      this.handleEvent(event);
    });
  }

  /**
   * Handle an incoming event
   * @param {Object} event - Event object
   */
  handleEvent(event) {
    const ruleBuilder = getRuleBuilder();
    const triggerLibrary = getTriggerLibrary();

    // Find matching rules
    const matchingRules = ruleBuilder.getActiveRules().filter(rule => {
      if (!rule.trigger) return false;

      // Check trigger type matches event source
      if (rule.trigger.type !== event.source) return false;

      // Check trigger subtype matches event type
      if (rule.trigger.subtype !== event.type) return false;

      // Check branch filter
      if (rule.branchId && rule.branchId !== event.branchId) return false;

      return true;
    });

    // Execute matching rules
    matchingRules.forEach(rule => {
      this.executeRule(rule, event);
    });
  }

  /**
   * Execute a rule
   * @param {Object} rule - Rule object
   * @param {Object} triggerEvent - Trigger event
   * @returns {Object} Execution result
   */
  async executeRule(rule, triggerEvent = null) {
    const execution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: triggerEvent || null,
      status: EXECUTION_STATUS.RUNNING,
      startedAt: now(),
      completedAt: null,
      duration: null,
      conditionsMet: null,
      actionsExecuted: [],
      results: [],
      error: null,
      context: triggerEvent ? triggerEvent.payload : {}
    };

    this.executions.set(execution.id, execution);
    this.saveExecutions();

    try {
      // Check max executions
      if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
        execution.status = EXECUTION_STATUS.CANCELLED;
        execution.error = 'Max executions reached';
        execution.completedAt = now();
        this.executions.set(execution.id, execution);
        this.saveExecutions();
        return execution;
      }

      // Build context
      const context = this.buildContext(rule, triggerEvent);

      // Evaluate conditions
      const ruleBuilder = getRuleBuilder();
      const conditionsMet = ruleBuilder.evaluateConditions(rule, context);
      execution.conditionsMet = conditionsMet;

      if (!conditionsMet && rule.elseActions.length === 0) {
        // Conditions not met and no else actions - skip
        execution.status = EXECUTION_STATUS.COMPLETED;
        execution.completedAt = now();
        this.executions.set(execution.id, execution);
        this.saveExecutions();
        return execution;
      }

      // Execute actions
      const actionLibrary = getActionLibrary();
      const actionsToExecute = conditionsMet ? rule.actions : rule.elseActions;

      for (const actionConfig of actionsToExecute) {
        const actionResult = await actionLibrary.executeAction(
          `${actionConfig.type}_${actionConfig.subtype}`,
          actionConfig.parameters || {},
          context
        );

        execution.actionsExecuted.push({
          type: actionConfig.type,
          subtype: actionConfig.subtype,
          success: actionResult.success,
          result: actionResult
        });

        execution.results.push(actionResult);

        // Stop on failure if configured
        if (!actionResult.success && actionConfig.stopOnFailure !== false) {
          execution.status = EXECUTION_STATUS.FAILED;
          execution.error = `Action failed: ${actionConfig.type}_${actionConfig.subtype}`;
          break;
        }
      }

      // Update rule execution count
      rule.executionCount++;
      rule.lastExecutedAt = now();
      ruleBuilder.updateRule(rule.id, {
        executionCount: rule.executionCount,
        lastExecutedAt: rule.lastExecutedAt
      });

      if (execution.status !== EXECUTION_STATUS.FAILED) {
        execution.status = EXECUTION_STATUS.COMPLETED;
      }

    } catch (error) {
      execution.status = EXECUTION_STATUS.FAILED;
      execution.error = error.message;
    }

    execution.completedAt = now();
    execution.duration = execution.completedAt - execution.startedAt;
    this.executions.set(execution.id, execution);
    this.saveExecutions();

    return execution;
  }

  /**
   * Build execution context
   * @param {Object} rule - Rule object
   * @param {Object} triggerEvent - Trigger event
   * @returns {Object} Execution context
   */
  buildContext(rule, triggerEvent) {
    const context = {
      rule: {
        id: rule.id,
        name: rule.name,
        category: rule.category
      },
      timestamp: now()
    };

    if (triggerEvent) {
      context.event = {
        id: triggerEvent.id,
        source: triggerEvent.source,
        type: triggerEvent.type,
        subtype: triggerEvent.subtype,
        payload: triggerEvent.payload,
        orderId: triggerEvent.orderId,
        paymentId: triggerEvent.paymentId,
        kitchenOrderId: triggerEvent.kitchenOrderId,
        reservationId: triggerEvent.reservationId,
        customerId: triggerEvent.customerId,
        staffId: triggerEvent.staffId,
        tableId: triggerEvent.tableId,
        branchId: triggerEvent.branchId,
        workflowId: triggerEvent.workflowId
      };
    }

    return context;
  }

  /**
   * Manually trigger a rule
   * @param {string} ruleId - Rule ID
   * @param {Object} context - Manual context
   * @returns {Object} Execution result
   */
  async triggerRule(ruleId, context = {}) {
    const ruleBuilder = getRuleBuilder();
    const rule = ruleBuilder.getRule(ruleId);

    if (!rule) {
      return { success: false, reason: 'Rule not found' };
    }

    if (rule.status !== 'ACTIVE') {
      return { success: false, reason: 'Rule is not active' };
    }

    return await this.executeRule(rule, { payload: context });
  }

  /**
   * Get execution by ID
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution or null
   */
  getExecution(executionId) {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all executions
   * @returns {Array} Array of executions
   */
  getAllExecutions() {
    return Array.from(this.executions.values());
  }

  /**
   * Get executions by rule
   * @param {string} ruleId - Rule ID
   * @returns {Array} Array of executions
   */
  getExecutionsByRule(ruleId) {
    return this.getAllExecutions().filter(e => e.ruleId === ruleId);
  }

  /**
   * Get executions by status
   * @param {string} status - Execution status
   * @returns {Array} Array of executions
   */
  getExecutionsByStatus(status) {
    return this.getAllExecutions().filter(e => e.status === status);
  }

  /**
   * Get recent executions
   * @param {number} limit - Number of executions to return
   * @returns {Array} Array of executions
   */
  getRecentExecutions(limit = 100) {
    return this.getAllExecutions()
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }

  /**
   * Get execution statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const executions = this.getAllExecutions();

    return {
      total: executions.length,
      byStatus: executions.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {}),
      byRule: executions.reduce((acc, e) => {
        acc[e.ruleId] = (acc[e.ruleId] || 0) + 1;
        return acc;
      }, {}),
      conditionsMet: executions.filter(e => e.conditionsMet === true).length,
      conditionsNotMet: executions.filter(e => e.conditionsMet === false).length,
      averageDuration: executions.length > 0
        ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length
        : 0
    };
  }

  /**
   * Get rule execution history
   * @param {string} ruleId - Rule ID
   * @param {Object} options - Options
   * @returns {Array} Array of executions
   */
  getRuleExecutionHistory(ruleId, options = {}) {
    let executions = this.getExecutionsByRule(ruleId);

    if (options.startTime) {
      executions = executions.filter(e => e.startedAt >= options.startTime);
    }
    if (options.endTime) {
      executions = executions.filter(e => e.startedAt <= options.endTime);
    }
    if (options.status) {
      executions = executions.filter(e => e.status === options.status);
    }

    executions.sort((a, b) => b.startedAt - a.startedAt);

    if (options.limit) {
      executions = executions.slice(0, options.limit);
    }

    return executions;
  }

  /**
   * Cleanup old executions
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of executions cleaned up
   */
  cleanupOldExecutions(olderThan = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleaned = 0;

    for (const [id, execution] of this.executions) {
      if (execution.startedAt && execution.startedAt < cutoff) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveExecutions();
    }

    return cleaned;
  }

  /**
   * Export executions
   * @param {Object} options - Export options
   * @returns {Object} Exported executions
   */
  exportExecutions(options = {}) {
    const { ruleId, status, startTime, endTime, limit } = options;
    
    let executions = this.getAllExecutions();
    
    if (ruleId) {
      executions = executions.filter(e => e.ruleId === ruleId);
    }
    if (status) {
      executions = executions.filter(e => e.status === status);
    }
    if (startTime) {
      executions = executions.filter(e => e.startedAt >= startTime);
    }
    if (endTime) {
      executions = executions.filter(e => e.startedAt <= endTime);
    }
    if (limit) {
      executions = executions.slice(0, limit);
    }

    return {
      executions,
      exportedAt: now(),
      totalExecutions: executions.length
    };
  }

  /**
   * Import executions
   * @param {Object} data - Imported executions data
   * @returns {Object} Import result
   */
  importExecutions(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.executions)) {
        data.executions.forEach(execution => {
          this.executions.set(execution.id, execution);
        });
      }

      this.saveExecutions();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let businessRulesEngineInstance = null;

/**
 * Get the business rules engine singleton
 * @returns {BusinessRulesEngine} Business rules engine instance
 */
export function getBusinessRulesEngine() {
  if (!businessRulesEngineInstance) {
    businessRulesEngineInstance = new BusinessRulesEngine();
  }
  return businessRulesEngineInstance;
}

/**
 * Reset the business rules engine (useful for testing)
 */
export function resetBusinessRulesEngine() {
  businessRulesEngineInstance = null;
}

/**
 * Convenience function to trigger a rule
 * @param {string} ruleId - Rule ID
 * @param {Object} context - Manual context
 * @returns {Promise<Object>} Execution result
 */
export function triggerRule(ruleId, context = {}) {
  const engine = getBusinessRulesEngine();
  return engine.triggerRule(ruleId, context);
}

/**
 * Convenience function to get execution statistics
 * @returns {Object} Statistics
 */
export function getRuleExecutionStatistics() {
  const engine = getBusinessRulesEngine();
  return engine.getStatistics();
}
