// Visual Rule Builder
// No-code rule builder for pricing, discounts, and promotions

import { now } from '../domain/dates.js';

const RULES_KEY = 'cafeos_visual_rules';

/**
 * Rule Types
 */
export const RULE_TYPES = {
  PRICING_RULE: 'PRICING_RULE',
  DISCOUNT_RULE: 'DISCOUNT_RULE',
  PROMOTION_RULE: 'PROMOTION_RULE',
  TAX_RULE: 'TAX_RULE'
};

/**
 * Condition Operators
 */
export const CONDITION_OPERATORS = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  BETWEEN: 'BETWEEN',
  IS_NULL: 'IS_NULL',
  IS_NOT_NULL: 'IS_NOT_NULL'
};

/**
 * Action Types
 */
export const ACTION_TYPES = {
  SET_PRICE: 'SET_PRICE',
  APPLY_DISCOUNT_PERCENTAGE: 'APPLY_DISCOUNT_PERCENTAGE',
  APPLY_DISCOUNT_AMOUNT: 'APPLY_DISCOUNT_AMOUNT',
  APPLY_TAX_RATE: 'APPLY_TAX_RATE',
  GIVE_BONUS_POINTS: 'GIVE_BONUS_POINTS',
  GIVE_FREE_ITEM: 'GIVE_FREE_ITEM',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION'
};

/**
 * Logical Operators
 */
export const LOGICAL_OPERATORS = {
  AND: 'AND',
  OR: 'OR'
};

/**
 * Visual Rule Builder class
 * No-code rule builder for pricing, discounts, and promotions
 */
export class VisualRuleBuilder {
  constructor() {
    this.rules = new Map();
    this.ruleTemplates = new Map();
    this.loadRules();
    this.loadTemplates();
  }

  /**
   * Load rules from localStorage
   */
  loadRules() {
    try {
      const stored = localStorage.getItem(RULES_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        rules.forEach(rule => {
          this.rules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('[VisualRuleBuilder] Failed to load rules:', error);
    }
  }

  /**
   * Save rules to localStorage
   */
  saveRules() {
    try {
      const rules = Array.from(this.rules.values());
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('[VisualRuleBuilder] Failed to save rules:', error);
    }
  }

  /**
   * Load templates from localStorage
   */
  loadTemplates() {
    try {
      const stored = localStorage.getItem('cafeos_rule_templates');
      if (stored) {
        const templates = JSON.parse(stored);
        templates.forEach(template => {
          this.ruleTemplates.set(template.id, template);
        });
      } else {
        this.setDefaultTemplates();
      }
    } catch (error) {
      console.error('[VisualRuleBuilder] Failed to load templates:', error);
      this.setDefaultTemplates();
    }
  }

  /**
   * Save templates to localStorage
   */
  saveTemplates() {
    try {
      const templates = Array.from(this.ruleTemplates.values());
      localStorage.setItem('cafeos_rule_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('[VisualRuleBuilder] Failed to save templates:', error);
    }
  }

  /**
   * Set default rule templates
   */
  setDefaultTemplates() {
    // Happy Hour Template
    this.ruleTemplates.set('happy_hour', {
      id: 'happy_hour',
      name: 'Happy Hour',
      description: 'Apply discount during happy hours',
      ruleType: RULE_TYPES.DISCOUNT_RULE,
      conditions: [
        {
          field: 'time',
          operator: CONDITION_OPERATORS.BETWEEN,
          value: [17, 21]
        }
      ],
      actions: [
        {
          type: ACTION_TYPES.APPLY_DISCOUNT_PERCENTAGE,
          value: 15
        }
      ]
    });

    // VIP Discount Template
    this.ruleTemplates.set('vip_discount', {
      id: 'vip_discount',
      name: 'VIP Discount',
      description: 'Apply discount for VIP customers',
      ruleType: RULE_TYPES.DISCOUNT_RULE,
      conditions: [
        {
          field: 'customerGroup',
          operator: CONDITION_OPERATORS.EQUALS,
          value: 'VIP'
        }
      ],
      actions: [
        {
          type: ACTION_TYPES.APPLY_DISCOUNT_PERCENTAGE,
          value: 10
        }
      ]
    });

    // First Visit Template
    this.ruleTemplates.set('first_visit', {
      id: 'first_visit',
      name: 'First Visit Bonus',
      description: 'Give bonus points on first visit',
      ruleType: RULE_TYPES.PROMOTION_RULE,
      conditions: [
        {
          field: 'isFirstOrder',
          operator: CONDITION_OPERATORS.EQUALS,
          value: true
        }
      ],
      actions: [
        {
          type: ACTION_TYPES.GIVE_BONUS_POINTS,
          value: 100
        }
      ]
    });

    this.saveTemplates();
  }

  /**
   * Create a visual rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  createRule(ruleData) {
    const rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: ruleData.name || 'Untitled Rule',
      description: ruleData.description || '',
      ruleType: ruleData.ruleType || RULE_TYPES.DISCOUNT_RULE,
      
      // Conditions
      conditions: ruleData.conditions || [],
      logicalOperator: ruleData.logicalOperator || LOGICAL_OPERATORS.AND,
      
      // Actions
      actions: ruleData.actions || [],
      
      // Targeting
      branches: ruleData.branches || [],
      categories: ruleData.categories || [],
      items: ruleData.items || [],
      customerGroups: ruleData.customerGroups || [],
      
      // Schedule
      schedule: ruleData.schedule || null,
      
      // Priority
      priority: ruleData.priority || 100,
      
      // Status
      enabled: ruleData.enabled !== false,
      
      // Metadata
      metadata: ruleData.metadata || {},
      createdAt: now(),
      createdBy: ruleData.createdBy || null
    };

    this.rules.set(rule.id, rule);
    this.saveRules();

    return rule;
  }

  /**
   * Create rule from template
   * @param {string} templateId - Template ID
   * @param {Object} overrides - Override values
   * @returns {Object} Created rule
   */
  createFromTemplate(templateId, overrides = {}) {
    const template = this.ruleTemplates.get(templateId);

    if (!template) {
      return {
        success: false,
        reason: 'Template not found'
      };
    }

    return this.createRule({
      ...template,
      ...overrides,
      id: undefined // Generate new ID
    });
  }

  /**
   * Add condition to rule
   * @param {string} ruleId - Rule ID
   * @param {Object} condition - Condition to add
   * @returns {Object} Updated rule or null
   */
  addCondition(ruleId, condition) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.conditions.push({
      id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...condition
    });

    this.saveRules();

    return rule;
  }

  /**
   * Remove condition from rule
   * @param {string} ruleId - Rule ID
   * @param {string} conditionId - Condition ID
   * @returns {Object} Updated rule or null
   */
  removeCondition(ruleId, conditionId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.conditions = rule.conditions.filter(c => c.id !== conditionId);
    this.saveRules();

    return rule;
  }

  /**
   * Add action to rule
   * @param {string} ruleId - Rule ID
   * @param {Object} action - Action to add
   * @returns {Object} Updated rule or null
   */
  addAction(ruleId, action) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.actions.push({
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action
    });

    this.saveRules();

    return rule;
  }

  /**
   * Remove action from rule
   * @param {string} ruleId - Rule ID
   * @param {string} actionId - Action ID
   * @returns {Object} Updated rule or null
   */
  removeAction(ruleId, actionId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.actions = rule.actions.filter(a => a.id !== actionId);
    this.saveRules();

    return rule;
  }

  /**
   * Evaluate rule against context
   * @param {string} ruleId - Rule ID
   * @param {Object} context - Evaluation context
   * @returns {Object} Evaluation result
   */
  evaluateRule(ruleId, context) {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return {
        success: false,
        reason: 'Rule not found'
      };
    }

    if (!rule.enabled) {
      return {
        success: false,
        reason: 'Rule is disabled'
      };
    }

    // Check schedule
    if (rule.schedule) {
      if (!this.isScheduleActive(rule.schedule, context.timestamp || now())) {
        return {
          success: false,
          reason: 'Rule schedule not active'
        };
      }
    }

    // Check targeting
    if (rule.branches.length > 0 && !rule.branches.includes(context.branchId)) {
      return {
        success: false,
        reason: 'Rule not applicable to this branch'
      };
    }

    if (rule.categories.length > 0 && !rule.categories.includes(context.categoryId)) {
      return {
        success: false,
        reason: 'Rule not applicable to this category'
      };
    }

    if (rule.items.length > 0 && !rule.items.includes(context.menuItemId)) {
      return {
        success: false,
        reason: 'Rule not applicable to this item'
      };
    }

    if (rule.customerGroups.length > 0 && !rule.customerGroups.includes(context.customerGroup)) {
      return {
        success: false,
        reason: 'Rule not applicable to this customer group'
      };
    }

    // Evaluate conditions
    const conditionsMet = this.evaluateConditions(rule.conditions, context, rule.logicalOperator);

    if (!conditionsMet) {
      return {
        success: false,
        reason: 'Conditions not met'
      };
    }

    // Execute actions
    const actionResults = this.executeActions(rule.actions, context);

    return {
      success: true,
      ruleId: rule.id,
      ruleName: rule.name,
      actionsExecuted: actionResults
    };
  }

  /**
   * Evaluate conditions
   * @param {Array} conditions - Array of conditions
   * @param {Object} context - Evaluation context
   * @param {string} logicalOperator - Logical operator (AND/OR)
   * @returns {boolean} Whether conditions are met
   */
  evaluateConditions(conditions, context, logicalOperator = LOGICAL_OPERATORS.AND) {
    if (conditions.length === 0) return true;

    const results = conditions.map(condition => {
      return this.evaluateCondition(condition, context);
    });

    if (logicalOperator === LOGICAL_OPERATORS.AND) {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  /**
   * Evaluate single condition
   * @param {Object} condition - Condition object
   * @param {Object} context - Evaluation context
   * @returns {boolean} Whether condition is met
   */
  evaluateCondition(condition, context) {
    const fieldValue = this.getFieldValue(condition.field, context);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case CONDITION_OPERATORS.EQUALS:
        return fieldValue === conditionValue;

      case CONDITION_OPERATORS.NOT_EQUALS:
        return fieldValue !== conditionValue;

      case CONDITION_OPERATORS.GREATER_THAN:
        return fieldValue > conditionValue;

      case CONDITION_OPERATORS.LESS_THAN:
        return fieldValue < conditionValue;

      case CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL:
        return fieldValue >= conditionValue;

      case CONDITION_OPERATORS.LESS_THAN_OR_EQUAL:
        return fieldValue <= conditionValue;

      case CONDITION_OPERATORS.CONTAINS:
        return Array.isArray(fieldValue) ? fieldValue.includes(conditionValue) : String(fieldValue).includes(conditionValue);

      case CONDITION_OPERATORS.NOT_CONTAINS:
        return Array.isArray(fieldValue) ? !fieldValue.includes(conditionValue) : !String(fieldValue).includes(conditionValue);

      case CONDITION_OPERATORS.IN:
        return Array.isArray(conditionValue) ? conditionValue.includes(fieldValue) : false;

      case CONDITION_OPERATORS.NOT_IN:
        return Array.isArray(conditionValue) ? !conditionValue.includes(fieldValue) : true;

      case CONDITION_OPERATORS.BETWEEN:
        return Array.isArray(conditionValue) && fieldValue >= conditionValue[0] && fieldValue <= conditionValue[1];

      case CONDITION_OPERATORS.IS_NULL:
        return fieldValue === null || fieldValue === undefined;

      case CONDITION_OPERATORS.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;

      default:
        return true;
    }
  }

  /**
   * Get field value from context
   * @param {string} field - Field name
   * @param {Object} context - Context object
   * @returns {*} Field value
   */
  getFieldValue(field, context) {
    const fieldPath = field.split('.');
    let value = context;

    for (const part of fieldPath) {
      value = value?.[part];
    }

    return value;
  }

  /**
   * Check if schedule is active
   * @param {Object} schedule - Schedule configuration
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} Whether schedule is active
   */
  isScheduleActive(schedule, currentTime) {
    if (schedule.startDate && currentTime < schedule.startDate) return false;
    if (schedule.endDate && currentTime > schedule.endDate) return false;

    const currentDay = new Date(currentTime).getDay();
    if (schedule.days && schedule.days.length > 0) {
      if (!schedule.days.includes(currentDay)) return false;
    }

    const currentHour = new Date(currentTime).getHours();
    if (schedule.startTime !== undefined && schedule.endTime !== undefined) {
      if (currentHour < schedule.startTime || currentHour >= schedule.endTime) return false;
    }

    return true;
  }

  /**
   * Execute actions
   * @param {Array} actions - Array of actions
   * @param {Object} context - Execution context
   * @returns {Array} Action results
   */
  executeActions(actions, context) {
    return actions.map(action => {
      return this.executeAction(action, context);
    });
  }

  /**
   * Execute single action
   * @param {Object} action - Action object
   * @param {Object} context - Execution context
   * @returns {Object} Action result
   */
  executeAction(action, context) {
    const result = {
      actionId: action.id,
      type: action.type,
      success: false
    };

    switch (action.type) {
      case ACTION_TYPES.SET_PRICE:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.APPLY_DISCOUNT_PERCENTAGE:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.APPLY_DISCOUNT_AMOUNT:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.APPLY_TAX_RATE:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.GIVE_BONUS_POINTS:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.GIVE_FREE_ITEM:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.REQUIRE_APPROVAL:
        result.value = action.value;
        result.success = true;
        break;

      case ACTION_TYPES.SEND_NOTIFICATION:
        result.value = action.value;
        result.success = true;
        break;

      default:
        result.success = false;
        result.reason = 'Unknown action type';
    }

    return result;
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
   * Get rules by type
   * @param {string} ruleType - Rule type
   * @returns {Array} Array of rules
   */
  getRulesByType(ruleType) {
    return this.getAllRules().filter(r => r.ruleType === ruleType);
  }

  /**
   * Get enabled rules
   * @returns {Array} Array of enabled rules
   */
  getEnabledRules() {
    return this.getAllRules().filter(r => r.enabled);
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
      updatedAt: now()
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
   * Enable/disable rule
   * @param {string} ruleId - Rule ID
   * @param {boolean} enabled - Whether to enable
   * @returns {Object} Result
   */
  setRuleEnabled(ruleId, enabled) {
    return this.updateRule(ruleId, { enabled });
  }

  /**
   * Get all templates
   * @returns {Array} Array of templates
   */
  getAllTemplates() {
    return Array.from(this.ruleTemplates.values());
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template or null
   */
  getTemplate(templateId) {
    return this.ruleTemplates.get(templateId) || null;
  }

  /**
   * Add template
   * @param {Object} templateData - Template data
   * @returns {Object} Created template
   */
  addTemplate(templateData) {
    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...templateData
    };

    this.ruleTemplates.set(template.id, template);
    this.saveTemplates();

    return template;
  }

  /**
   * Get available fields for conditions
   * @returns {Array} Array of available fields
   */
  getAvailableFields() {
    return [
      { field: 'customerGroup', label: 'Customer Group', type: 'string' },
      { field: 'customerId', label: 'Customer ID', type: 'string' },
      { field: 'branchId', label: 'Branch ID', type: 'string' },
      { field: 'categoryId', label: 'Category ID', type: 'string' },
      { field: 'menuItemId', label: 'Menu Item ID', type: 'string' },
      { field: 'quantity', label: 'Quantity', type: 'number' },
      { field: 'total', label: 'Order Total', type: 'number' },
      { field: 'time', label: 'Time (hour)', type: 'number' },
      { field: 'day', label: 'Day of Week', type: 'number' },
      { field: 'isFirstOrder', label: 'Is First Order', type: 'boolean' },
      { field: 'isNewCustomer', label: 'Is New Customer', type: 'boolean' }
    ];
  }

  /**
   * Get available operators
   * @returns {Array} Array of available operators
   */
  getAvailableOperators() {
    return Object.entries(CONDITION_OPERATORS).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/_/g, ' ')
    }));
  }

  /**
   * Get available actions
   * @returns {Array} Array of available actions
   */
  getAvailableActions() {
    return Object.entries(ACTION_TYPES).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/_/g, ' ')
    }));
  }

  /**
   * Validate rule
   * @param {Object} rule - Rule to validate
   * @returns {Object} Validation result
   */
  validateRule(rule) {
    const errors = [];

    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule name is required');
    }

    if (!rule.ruleType) {
      errors.push('Rule type is required');
    }

    if (rule.conditions && rule.conditions.length > 0) {
      rule.conditions.forEach((condition, index) => {
        if (!condition.field) {
          errors.push(`Condition ${index + 1}: Field is required`);
        }
        if (!condition.operator) {
          errors.push(`Condition ${index + 1}: Operator is required`);
        }
        if (condition.value === undefined && condition.operator !== CONDITION_OPERATORS.IS_NULL && condition.operator !== CONDITION_OPERATORS.IS_NOT_NULL) {
          errors.push(`Condition ${index + 1}: Value is required`);
        }
      });
    }

    if (rule.actions && rule.actions.length > 0) {
      rule.actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`Action ${index + 1}: Type is required`);
        }
        if (action.value === undefined && action.type !== ACTION_TYPES.REQUIRE_APPROVAL && action.type !== ACTION_TYPES.SEND_NOTIFICATION) {
          errors.push(`Action ${index + 1}: Value is required`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const rules = this.getAllRules();

    return {
      totalRules: rules.length,
      byType: rules.reduce((acc, r) => {
        acc[r.ruleType] = (acc[r.ruleType] || 0) + 1;
        return acc;
      }, {}),
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      totalTemplates: this.ruleTemplates.size
    };
  }

  /**
   * Export rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    return {
      rules: Array.from(this.rules.values()),
      templates: Array.from(this.ruleTemplates.values()),
      exportedAt: now()
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

      if (Array.isArray(data.templates)) {
        data.templates.forEach(template => {
          this.ruleTemplates.set(template.id, template);
        });
      }

      this.saveRules();
      this.saveTemplates();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let ruleBuilderInstance = null;

/**
 * Get the visual rule builder singleton
 * @returns {VisualRuleBuilder} Rule builder instance
 */
export function getVisualRuleBuilder() {
  if (!ruleBuilderInstance) {
    ruleBuilderInstance = new VisualRuleBuilder();
  }
  return ruleBuilderInstance;
}

/**
 * Reset the visual rule builder (useful for testing)
 */
export function resetVisualRuleBuilder() {
  ruleBuilderInstance = null;
}

/**
 * Convenience function to create a rule
 * @param {Object} ruleData - Rule data
 * @returns {Object} Created rule
 */
export function createVisualRule(ruleData = {}) {
  const builder = getVisualRuleBuilder();
  return builder.createRule(ruleData);
}

/**
 * Convenience function to evaluate a rule
 * @param {string} ruleId - Rule ID
 * @param {Object} context - Evaluation context
 * @returns {Object} Evaluation result
 */
export function evaluateVisualRule(ruleId, context = {}) {
  const builder = getVisualRuleBuilder();
  return builder.evaluateRule(ruleId, context);
}
