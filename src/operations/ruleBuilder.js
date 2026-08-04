// Visual Rule Builder
// No-code rule creation with IF/ELSE/AND/OR/NOT support

import { now } from '../domain/dates.js';

const RULES_KEY = 'cafeos_rules';

/**
 * Logical Operators
 */
export const LOGICAL_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
};

/**
 * Comparison Operators
 */
export const COMPARISON_OPERATORS = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN: 'LESS_THAN',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL',
  BETWEEN: 'BETWEEN'
};

/**
 * Rule Status
 */
export const RULE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED'
};

/**
 * Visual Rule Builder class
 * No-code rule creation with IF/ELSE/AND/OR/NOT support
 */
export class RuleBuilder {
  constructor() {
    this.rules = new Map();
    this.loadRules();
  }

  /**
   * Load rules from localStorage
   */
  loadRules() {
    try {
      const stored = localStorage.getItem(RULES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.rules) {
          data.rules.forEach(rule => {
            this.rules.set(rule.id, rule);
          });
        }
      }
    } catch (error) {
      console.error('[RuleBuilder] Failed to load rules:', error);
    }
  }

  /**
   * Save rules to localStorage
   */
  saveRules() {
    try {
      const rules = Array.from(this.rules.values());
      localStorage.setItem(RULES_KEY, JSON.stringify({ rules }));
    } catch (error) {
      console.error('[RuleBuilder] Failed to save rules:', error);
    }
  }

  /**
   * Create a rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  createRule(ruleData) {
    const rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Basic info
      name: ruleData.name || 'Untitled Rule',
      description: ruleData.description || '',
      category: ruleData.category || 'GENERAL',
      
      // Trigger
      trigger: ruleData.trigger || null,
      
      // Conditions
      conditions: ruleData.conditions || [],
      conditionLogic: ruleData.conditionLogic || LOGICAL_OPERATORS.AND,
      
      // Actions
      actions: ruleData.actions || [],
      elseActions: ruleData.elseActions || [],
      
      // Settings
      status: ruleData.status || RULE_STATUS.DRAFT,
      priority: ruleData.priority || 0,
      
      // Scope
      branchId: ruleData.branchId || null,
      appliesTo: ruleData.appliesTo || [], // roles, users, etc.
      
      // Execution
      maxExecutions: ruleData.maxExecutions || null,
      executionCount: 0,
      lastExecutedAt: null,
      
      // Metadata
      metadata: ruleData.metadata || {},
      createdAt: now(),
      createdBy: ruleData.createdBy || null,
      updatedAt: null,
      updatedBy: null
    };

    this.rules.set(rule.id, rule);
    this.saveRules();

    return rule;
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule or null
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules
   * @returns {Array} Array of rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get active rules
   * @returns {Array} Array of active rules
   */
  getActiveRules() {
    return this.getAllRules().filter(r => r.status === RULE_STATUS.ACTIVE);
  }

  /**
   * Get rules by category
   * @param {string} category - Rule category
   * @returns {Array} Array of rules
   */
  getRulesByCategory(category) {
    return this.getAllRules().filter(r => r.category === category);
  }

  /**
   * Get rules by trigger
   * @param {string} triggerType - Trigger type
   * @returns {Array} Array of rules
   */
  getRulesByTrigger(triggerType) {
    return this.getAllRules().filter(r => r.trigger && r.trigger.type === triggerType);
  }

  /**
   * Update rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated rule or null
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      updatedAt: now(),
      updatedBy: updates.updatedBy || null
    };

    this.rules.set(ruleId, updated);
    this.saveRules();

    return updated;
  }

  /**
   * Delete rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteRule(ruleId) {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.saveRules();
    }
    return deleted;
  }

  /**
   * Activate rule
   * @param {string} ruleId - Rule ID
   * @param {string} activatedBy - Who activated it
   * @returns {Object} Result
   */
  activateRule(ruleId, activatedBy) {
    return this.updateRule(ruleId, {
      status: RULE_STATUS.ACTIVE,
      updatedBy: activatedBy
    });
  }

  /**
   * Pause rule
   * @param {string} ruleId - Rule ID
   * @param {string} pausedBy - Who paused it
   * @returns {Object} Result
   */
  pauseRule(ruleId, pausedBy) {
    return this.updateRule(ruleId, {
      status: RULE_STATUS.PAUSED,
      updatedBy: pausedBy
    });
  }

  /**
   * Archive rule
   * @param {string} ruleId - Rule ID
   * @param {string} archivedBy - Who archived it
   * @returns {Object} Result
   */
  archiveRule(ruleId, archivedBy) {
    return this.updateRule(ruleId, {
      status: RULE_STATUS.ARCHIVED,
      updatedBy: archivedBy
    });
  }

  /**
   * Evaluate rule conditions
   * @param {Object} rule - Rule object
   * @param {Object} context - Evaluation context
   * @returns {boolean} Whether conditions are met
   */
  evaluateConditions(rule, context) {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }

    const results = rule.conditions.map(condition => {
      return this.evaluateCondition(condition, context);
    });

    // Apply logic operator
    switch (rule.conditionLogic) {
      case LOGICAL_OPERATORS.AND:
        return results.every(r => r === true);
      case LOGICAL_OPERATORS.OR:
        return results.some(r => r === true);
      case LOGICAL_OPERATORS.NOT:
        return !results[0];
      default:
        return results.every(r => r === true);
    }
  }

  /**
   * Evaluate a single condition
   * @param {Object} condition - Condition object
   * @param {Object} context - Evaluation context
   * @returns {boolean} Whether condition is met
   */
  evaluateCondition(condition, context) {
    const { field, operator, value, not } = condition;
    
    // Get actual value from context
    const actualValue = this.getValueFromContext(field, context);
    
    // Apply NOT if specified
    const shouldNegate = not === true;
    
    let result = false;

    switch (operator) {
      case COMPARISON_OPERATORS.EQUALS:
        result = actualValue === value;
        break;
      case COMPARISON_OPERATORS.NOT_EQUALS:
        result = actualValue !== value;
        break;
      case COMPARISON_OPERATORS.GREATER_THAN:
        result = actualValue > value;
        break;
      case COMPARISON_OPERATORS.GREATER_THAN_OR_EQUAL:
        result = actualValue >= value;
        break;
      case COMPARISON_OPERATORS.LESS_THAN:
        result = actualValue < value;
        break;
      case COMPARISON_OPERATORS.LESS_THAN_OR_EQUAL:
        result = actualValue <= value;
        break;
      case COMPARISON_OPERATORS.CONTAINS:
        result = String(actualValue).includes(String(value));
        break;
      case COMPARISON_OPERATORS.NOT_CONTAINS:
        result = !String(actualValue).includes(String(value));
        break;
      case COMPARISON_OPERATORS.STARTS_WITH:
        result = String(actualValue).startsWith(String(value));
        break;
      case COMPARISON_OPERATORS.ENDS_WITH:
        result = String(actualValue).endsWith(String(value));
        break;
      case COMPARISON_OPERATORS.IN:
        result = Array.isArray(value) && value.includes(actualValue);
        break;
      case COMPARISON_OPERATORS.NOT_IN:
        result = Array.isArray(value) && !value.includes(actualValue);
        break;
      case COMPARISON_OPERATORS.IS_NULL:
        result = actualValue === null || actualValue === undefined;
        break;
      case COMPARISON_OPERATORS.IS_NOT_NULL:
        result = actualValue !== null && actualValue !== undefined;
        break;
      case COMPARISON_OPERATORS.BETWEEN:
        result = Array.isArray(value) && 
                 actualValue >= value[0] && 
                 actualValue <= value[1];
        break;
      default:
        result = false;
    }

    return shouldNegate ? !result : result;
  }

  /**
   * Get value from context using dot notation
   * @param {string} field - Field path (e.g., 'order.total')
   * @param {Object} context - Context object
   * @returns {*} Value
   */
  getValueFromContext(field, context) {
    const parts = field.split('.');
    let value = context;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Execute rule actions
   * @param {Object} rule - Rule object
   * @param {Object} context - Execution context
   * @param {boolean} conditionsMet - Whether conditions were met
   * @returns {Object} Execution result
   */
  executeActions(rule, context, conditionsMet = true) {
    const actionsToExecute = conditionsMet ? rule.actions : rule.elseActions;
    const results = [];

    for (const action of actionsToExecute) {
      try {
        const result = this.executeAction(action, context);
        results.push({ action, success: true, result });
      } catch (error) {
        results.push({ action, success: false, error: error.message });
      }
    }

    // Update execution count
    rule.executionCount++;
    rule.lastExecutedAt = now();
    this.rules.set(rule.id, rule);
    this.saveRules();

    return {
      ruleId: rule.id,
      conditionsMet,
      actionsExecuted: results.length,
      successfulActions: results.filter(r => r.success).length,
      failedActions: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Execute a single action
   * @param {Object} action - Action object
   * @param {Object} context - Execution context
   * @returns {*} Action result
   */
  executeAction(action, context) {
    // This is a placeholder - actual action execution would be handled by action library
    // For now, return the action with context
    return {
      type: action.type,
      parameters: action.parameters,
      context
    };
  }

  /**
   * Duplicate rule
   * @param {string} ruleId - Rule ID
   * @param {string} duplicatedBy - Who duplicated it
   * @returns {Object|null} Duplicated rule or null
   */
  duplicateRule(ruleId, duplicatedBy) {
    const original = this.rules.get(ruleId);
    if (!original) return null;

    const duplicated = this.createRule({
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      trigger: original.trigger,
      conditions: original.conditions,
      conditionLogic: original.conditionLogic,
      actions: original.actions,
      elseActions: original.elseActions,
      branchId: original.branchId,
      appliesTo: original.appliesTo,
      createdBy: duplicatedBy
    });

    return duplicated;
  }

  /**
   * Get rule statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const rules = this.getAllRules();

    return {
      total: rules.length,
      active: rules.filter(r => r.status === RULE_STATUS.ACTIVE).length,
      draft: rules.filter(r => r.status === RULE_STATUS.DRAFT).length,
      paused: rules.filter(r => r.status === RULE_STATUS.PAUSED).length,
      archived: rules.filter(r => r.status === RULE_STATUS.ARCHIVED).length,
      byCategory: rules.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {}),
      totalExecutions: rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)
    };
  }

  /**
   * Export rules
   * @param {Object} options - Export options
   * @returns {Object} Exported rules
   */
  exportRules(options = {}) {
    const { category, status, branchId } = options;
    
    let rules = this.getAllRules();
    
    if (category) {
      rules = rules.filter(r => r.category === category);
    }
    if (status) {
      rules = rules.filter(r => r.status === status);
    }
    if (branchId) {
      rules = rules.filter(r => r.branchId === branchId);
    }

    return {
      rules,
      exportedAt: now(),
      totalRules: rules.length
    };
  }

  /**
   * Import rules
   * @param {Object} data - Imported rules data
   * @returns {Object} Import result
   */
  importRules(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.rules)) {
        data.rules.forEach(rule => {
          this.rules.set(rule.id, rule);
        });
      }

      this.saveRules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let ruleBuilderInstance = null;

/**
 * Get the rule builder singleton
 * @returns {RuleBuilder} Rule builder instance
 */
export function getRuleBuilder() {
  if (!ruleBuilderInstance) {
    ruleBuilderInstance = new RuleBuilder();
  }
  return ruleBuilderInstance;
}

/**
 * Reset the rule builder (useful for testing)
 */
export function resetRuleBuilder() {
  ruleBuilderInstance = null;
}

/**
 * Convenience function to create a rule
 * @param {Object} ruleData - Rule data
 * @returns {Object} Created rule
 */
export function createRule(ruleData = {}) {
  const builder = getRuleBuilder();
  return builder.createRule(ruleData);
}

/**
 * Convenience function to evaluate conditions
 * @param {Object} rule - Rule object
 * @param {Object} context - Evaluation context
 * @returns {boolean} Whether conditions are met
 */
export function evaluateRuleConditions(rule, context) {
  const builder = getRuleBuilder();
  return builder.evaluateConditions(rule, context);
}
