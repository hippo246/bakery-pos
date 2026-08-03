// Workflow Engine Domain Model
import { generateId } from './ids.js';
import { now } from './dates.js';

export const WORKFLOW_CATEGORIES = {
  OPENING: 'OPENING',
  CLOSING: 'CLOSING',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
  FOOD_SAFETY: 'FOOD_SAFETY',
  SAFETY: 'SAFETY',
  INVENTORY: 'INVENTORY',
  CASH_MANAGEMENT: 'CASH_MANAGEMENT',
  SHIFT_HANDOVER: 'SHIFT_HANDOVER',
  EQUIPMENT: 'EQUIPMENT',
  INCIDENT_REPORT: 'INCIDENT_REPORT',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  TRAINING: 'TRAINING',
  COMPLIANCE: 'COMPLIANCE',
  CUSTOM: 'CUSTOM'
};

export const WORKFLOW_DEPARTMENTS = {
  KITCHEN: 'KITCHEN',
  FRONT_OF_HOUSE: 'FRONT_OF_HOUSE',
  BAR: 'BAR',
  MANAGEMENT: 'MANAGEMENT',
  MAINTENANCE: 'MAINTENANCE',
  ALL: 'ALL'
};

export const WORKFLOW_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
  DISABLED: 'DISABLED',
  PUBLISHED: 'PUBLISHED'
};

export const TEMPLATE_SCOPE = {
  PERSONAL: 'PERSONAL',
  BRANCH: 'BRANCH',
  ORGANIZATION: 'ORGANIZATION',
  GLOBAL: 'GLOBAL'
};

export const TASK_DEPENDENCY_TYPE = {
  FINISH_TO_START: 'FINISH_TO_START',
  START_TO_START: 'START_TO_START',
  FINISH_TO_FINISH: 'FINISH_TO_FINISH',
  BLOCKING: 'BLOCKING',
  PARALLEL: 'PARALLEL',
  WAITING: 'WAITING'
};

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED'
};

export const APPROVAL_LEVEL = {
  SUPERVISOR: 'SUPERVISOR',
  MANAGER: 'MANAGER',
  OWNER: 'OWNER'
};

export const INCIDENT_TYPE = {
  INCIDENT: 'INCIDENT',
  ISSUE: 'ISSUE',
  MAINTENANCE_REQUEST: 'MAINTENANCE_REQUEST',
  HEALTH_VIOLATION: 'HEALTH_VIOLATION',
  SAFETY_INCIDENT: 'SAFETY_INCIDENT',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  CUSTOMER_COMPLAINT: 'CUSTOMER_COMPLAINT'
};

export const INCIDENT_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const INCIDENT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED'
};

export const ESCALATION_TRIGGER = {
  NOT_STARTED_AFTER: 'NOT_STARTED_AFTER',
  OVERDUE_AFTER: 'OVERDUE_AFTER',
  TASK_FAILED: 'TASK_FAILED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_CRITICAL: 'SLA_CRITICAL'
};

export const TIMELINE_EVENT_TYPE = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  STARTED: 'STARTED',
  PAUSED: 'PAUSED',
  RESUMED: 'RESUMED',
  ESCALATED: 'ESCALATED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'ARCHIVED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_SKIPPED: 'TASK_SKIPPED',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED'
};

// Phase 2: Conditional Logic Operators
export const CONDITION_OPERATOR = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
  IS_EMPTY: 'IS_EMPTY',
  IS_NOT_EMPTY: 'IS_NOT_EMPTY',
  IN: 'IN',
  NOT_IN: 'NOT_IN'
};

export const LOGICAL_OPERATOR = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
};

// Phase 2: Shift Triggers
export const SHIFT_TRIGGER = {
  SHIFT_START: 'SHIFT_START',
  SHIFT_END: 'SHIFT_END',
  SHIFT_HANDOVER: 'SHIFT_HANDOVER',
  OPENING: 'OPENING',
  CLOSING: 'CLOSING',
  CASH_COUNT: 'CASH_COUNT',
  CLEANING: 'CLEANING'
};

// Phase 2: Automation Triggers
export const AUTOMATION_TRIGGER = {
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_CRITICAL: 'SLA_CRITICAL'
};

// Phase 2: Automation Actions
export const AUTOMATION_ACTION = {
  GENERATE_PDF: 'GENERATE_PDF',
  NOTIFY_MANAGER: 'NOTIFY_MANAGER',
  NOTIFY_OWNER: 'NOTIFY_OWNER',
  ARCHIVE: 'ARCHIVE',
  UPDATE_DASHBOARD: 'UPDATE_DASHBOARD',
  CREATE_AUDIT_LOG: 'CREATE_AUDIT_LOG',
  START_WORKFLOW: 'START_WORKFLOW',
  ASSIGN_WORKFLOW: 'ASSIGN_WORKFLOW',
  CREATE_INCIDENT: 'CREATE_INCIDENT',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  UPDATE_EQUIPMENT_STATUS: 'UPDATE_EQUIPMENT_STATUS'
};

export const EXECUTION_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

export const TASK_TYPES = {
  CHECKBOX: 'CHECKBOX',
  TEXT_INPUT: 'TEXT_INPUT',
  NUMBER: 'NUMBER',
  PHOTO_REQUIRED: 'PHOTO_REQUIRED',
  SIGNATURE_REQUIRED: 'SIGNATURE_REQUIRED',
  DATE: 'DATE',
  TIME: 'TIME',
  YES_NO: 'YES_NO',
  DROPDOWN: 'DROPDOWN',
  MULTI_SELECT: 'MULTI_SELECT',
  FILE_UPLOAD: 'FILE_UPLOAD',
  QR_SCAN: 'QR_SCAN',
  BARCODE_SCAN: 'BARCODE_SCAN'
};

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED'
};

export const REPEAT_SCHEDULE = {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BI_WEEKLY: 'BI_WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
  CUSTOM: 'CUSTOM'
};

function safeStr(v, fb = '') { return typeof v === 'string' && v.trim() ? v.trim() : fb; }
function safeNum(v, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function safeBool(v, fb = false) { if (typeof v === 'boolean') return v; if (typeof v === 'string') { const lower = v.toLowerCase(); if (lower === 'true' || lower === '1' || lower === 'yes') return true; if (lower === 'false' || lower === '0' || lower === 'no') return false; } return fb; }
function safeArr(v) { return Array.isArray(v) ? v : []; }
function safeObj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function safeTs(v) { if (v == null) return now(); if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v; if (v instanceof Date) { const t = v.getTime(); return Number.isFinite(t) ? t : now(); } if (typeof v === 'string' && v.trim()) { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : now(); } return now(); }

export function createWorkflowDefinition(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    name: safeStr(data.name, 'Untitled Workflow'),
    category: Object.values(WORKFLOW_CATEGORIES).includes(data.category) ? data.category : WORKFLOW_CATEGORIES.CUSTOM,
    description: safeStr(data.description),
    department: Object.values(WORKFLOW_DEPARTMENTS).includes(data.department) ? data.department : WORKFLOW_DEPARTMENTS.ALL,
    estimatedDuration: safeNum(data.estimatedDuration, 30),
    priority: Object.values(WORKFLOW_PRIORITY).includes(data.priority) ? data.priority : WORKFLOW_PRIORITY.MEDIUM,
    icon: safeStr(data.icon, '📋'),
    color: safeStr(data.color, '#6366f1'),
    tags: safeArr(data.tags),
    repeatSchedule: Object.values(REPEAT_SCHEDULE).includes(data.repeatSchedule) ? data.repeatSchedule : REPEAT_SCHEDULE.NONE,
    repeatConfig: safeObj(data.repeatConfig),
    status: Object.values(WORKFLOW_STATUS).includes(data.status) ? data.status : WORKFLOW_STATUS.DRAFT,
    tasks: safeArr(data.tasks).map(t => createTaskDefinition(t)),
    requiredRoles: safeArr(data.requiredRoles),
    createdBy: safeStr(data.createdBy),
    createdAt: safeTs(data.createdAt),
    updatedAt: safeTs(data.updatedAt),
    version: safeNum(data.version, 1),
    publishedVersion: safeNum(data.publishedVersion, 0),
    isTemplate: safeBool(data.isTemplate, false),
    templateScope: Object.values(TEMPLATE_SCOPE).includes(data.templateScope) ? data.templateScope : TEMPLATE_SCOPE.PERSONAL,
    branchId: safeStr(data.branchId),
    organizationId: safeStr(data.organizationId),
    // Phase 2: Shift Integration
    shiftTrigger: Object.values(SHIFT_TRIGGER).includes(data.shiftTrigger) ? data.shiftTrigger : null,
    autoAssignToShift: safeBool(data.autoAssignToShift, false),
    // Phase 2: SLA Tracking
    targetDuration: safeNum(data.targetDuration),
    warningThreshold: safeNum(data.warningThreshold),
    criticalThreshold: safeNum(data.criticalThreshold),
    // Phase 2: Approvals
    requiresApproval: safeBool(data.requiresApproval, false),
    approvalLevel: Object.values(APPROVAL_LEVEL).includes(data.approvalLevel) ? data.approvalLevel : APPROVAL_LEVEL.SUPERVISOR,
    // Phase 2: Escalation
    escalationRules: safeArr(data.escalationRules).map(r => createEscalationRule(r)),
    // Phase 2: Conditional Logic
    conditionalRules: safeArr(data.conditionalRules),
    // Phase 2: Dynamic Tasks
    isDynamic: safeBool(data.isDynamic, false),
    dynamicTaskConfig: safeObj(data.dynamicTaskConfig),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeWorkflowDefinition(workflow) { if (!workflow || typeof workflow !== 'object') return null; return createWorkflowDefinition(workflow); }

export function createTaskDefinition(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    name: safeStr(data.name, 'Untitled Task'),
    type: Object.values(TASK_TYPES).includes(data.type) ? data.type : TASK_TYPES.CHECKBOX,
    description: safeStr(data.description),
    instructions: safeStr(data.instructions),
    required: safeBool(data.required, true),
    optional: safeBool(data.optional, false),
    minValue: data.minValue != null ? safeNum(data.minValue) : null,
    maxValue: data.maxValue != null ? safeNum(data.maxValue) : null,
    options: safeArr(data.options),
    defaultValue: data.defaultValue,
    notes: safeStr(data.notes),
    attachments: safeArr(data.attachments),
    allowPassFail: safeBool(data.allowPassFail, false),
    weight: safeNum(data.weight, 1),
    dependencies: safeArr(data.dependencies),
    dependencyType: Object.values(TASK_DEPENDENCY_TYPE).includes(data.dependencyType) ? data.dependencyType : TASK_DEPENDENCY_TYPE.FINISH_TO_START,
    order: safeNum(data.order, 0),
    // Phase 2: Approvals
    requiresApproval: safeBool(data.requiresApproval, false),
    approvalLevel: Object.values(APPROVAL_LEVEL).includes(data.approvalLevel) ? data.approvalLevel : APPROVAL_LEVEL.SUPERVISOR,
    // Phase 2: Evidence Collection
    evidenceRequired: safeArr(data.evidenceRequired),
    // Phase 2: Equipment Integration
    linkedEquipmentId: safeStr(data.linkedEquipmentId),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeTaskDefinition(task) { if (!task || typeof task !== 'object') return null; return createTaskDefinition(task); }

export function createTaskExecution(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    taskDefinitionId: safeStr(data.taskDefinitionId),
    taskName: safeStr(data.taskName),
    status: Object.values(TASK_STATUS).includes(data.status) ? data.status : TASK_STATUS.PENDING,
    value: data.value,
    photoUrl: safeStr(data.photoUrl),
    signature: data.signature || null,
    notes: safeStr(data.notes),
    result: data.result || null,
    startedAt: data.startedAt ? safeTs(data.startedAt) : null,
    completedAt: data.completedAt ? safeTs(data.completedAt) : null,
    skippedAt: data.skippedAt ? safeTs(data.skippedAt) : null,
    skippedBy: safeStr(data.skippedBy),
    skipReason: safeStr(data.skipReason),
    failedAt: data.failedAt ? safeTs(data.failedAt) : null,
    failedBy: safeStr(data.failedBy),
    failureReason: safeStr(data.failureReason),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeTaskExecution(taskExecution) { if (!taskExecution || typeof taskExecution !== 'object') return null; return createTaskExecution(taskExecution); }

export function createWorkflowExecution(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowId: safeStr(data.workflowId),
    workflowName: safeStr(data.workflowName),
    workflowVersion: safeNum(data.workflowVersion, 1),
    status: Object.values(EXECUTION_STATUS).includes(data.status) ? data.status : EXECUTION_STATUS.NOT_STARTED,
    assignedTo: safeStr(data.assignedTo),
    assignedBy: safeStr(data.assignedBy),
    assignedAt: data.assignedAt ? safeTs(data.assignedAt) : null,
    startedAt: data.startedAt ? safeTs(data.startedAt) : null,
    completedAt: data.completedAt ? safeTs(data.completedAt) : null,
    pausedAt: data.pausedAt ? safeTs(data.pausedAt) : null,
    cancelledAt: data.cancelledAt ? safeTs(data.cancelledAt) : null,
    duration: safeNum(data.duration, 0),
    tasks: safeArr(data.tasks).map(t => createTaskExecution(t)),
    skippedTasks: safeArr(data.skippedTasks),
    failedTasks: safeArr(data.failedTasks),
    photos: safeArr(data.photos),
    notes: safeStr(data.notes),
    signature: data.signature || null,
    overallResult: data.overallResult || null,
    completedBy: safeStr(data.completedBy),
    branchId: safeStr(data.branchId),
    linkedOrderId: safeStr(data.linkedOrderId),
    linkedTableId: safeStr(data.linkedTableId),
    linkedEquipmentId: safeStr(data.linkedEquipmentId),
    createdAt: safeTs(data.createdAt),
    updatedAt: safeTs(data.updatedAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeWorkflowExecution(execution) { if (!execution || typeof execution !== 'object') return null; return createWorkflowExecution(execution); }

export function startWorkflowExecution(execution, actor = 'current-user') {
  if (execution.status === EXECUTION_STATUS.IN_PROGRESS) return execution;
  return { ...execution, status: EXECUTION_STATUS.IN_PROGRESS, startedAt: now(), updatedAt: now() };
}

export function pauseWorkflowExecution(execution, actor = 'current-user') {
  if (execution.status !== EXECUTION_STATUS.IN_PROGRESS) return execution;
  return { ...execution, status: EXECUTION_STATUS.PAUSED, pausedAt: now(), updatedAt: now() };
}

export function resumeWorkflowExecution(execution, actor = 'current-user') {
  if (execution.status !== EXECUTION_STATUS.PAUSED) return execution;
  return { ...execution, status: EXECUTION_STATUS.IN_PROGRESS, pausedAt: null, updatedAt: now() };
}

export function completeWorkflowExecution(execution, actor = 'current-user', result = 'PASS') {
  if (execution.status === EXECUTION_STATUS.COMPLETED) return execution;
  const startedAt = execution.startedAt || execution.createdAt;
  const duration = now() - startedAt;
  return { ...execution, status: EXECUTION_STATUS.COMPLETED, completedAt: now(), duration, completedBy: actor, overallResult: result, updatedAt: now() };
}

export function cancelWorkflowExecution(execution, actor = 'current-user', reason = null) {
  if (execution.status === EXECUTION_STATUS.COMPLETED || execution.status === EXECUTION_STATUS.CANCELLED) return execution;
  return { ...execution, status: EXECUTION_STATUS.CANCELLED, cancelledAt: now(), metadata: { ...execution.metadata, cancelReason: reason, cancelledBy: actor }, updatedAt: now() };
}

// Phase 2: Workflow Template
export function createWorkflowTemplate(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    name: safeStr(data.name, 'Untitled Template'),
    category: Object.values(WORKFLOW_CATEGORIES).includes(data.category) ? data.category : WORKFLOW_CATEGORIES.CUSTOM,
    description: safeStr(data.description),
    scope: Object.values(TEMPLATE_SCOPE).includes(data.scope) ? data.scope : TEMPLATE_SCOPE.PERSONAL,
    branchId: safeStr(data.branchId),
    organizationId: safeStr(data.organizationId),
    isPublic: safeBool(data.isPublic, false),
    isCloneable: safeBool(data.isCloneable, true),
    baseWorkflowId: safeStr(data.baseWorkflowId),
    tasks: safeArr(data.tasks).map(t => createTaskDefinition(t)),
    tags: safeArr(data.tags),
    usageCount: safeNum(data.usageCount, 0),
    createdBy: safeStr(data.createdBy),
    createdAt: safeTs(data.createdAt),
    updatedAt: safeTs(data.updatedAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeWorkflowTemplate(template) {
  if (!template || typeof template !== 'object') return null;
  return createWorkflowTemplate(template);
}

// Phase 2: Workflow Version
export function createWorkflowVersion(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowId: safeStr(data.workflowId),
    version: safeNum(data.version, 1),
    publishedAt: data.publishedAt ? safeTs(data.publishedAt) : null,
    publishedBy: safeStr(data.publishedBy),
    changeLog: safeStr(data.changeLog),
    tasks: safeArr(data.tasks).map(t => createTaskDefinition(t)),
    isActive: safeBool(data.isActive, false),
    rollbackData: safeObj(data.rollbackData),
    createdAt: safeTs(data.createdAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeWorkflowVersion(version) {
  if (!version || typeof version !== 'object') return null;
  return createWorkflowVersion(version);
}

// Phase 2: Incident
export function createIncident(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    type: Object.values(INCIDENT_TYPE).includes(data.type) ? data.type : INCIDENT_TYPE.INCIDENT,
    priority: Object.values(INCIDENT_PRIORITY).includes(data.priority) ? data.priority : INCIDENT_PRIORITY.MEDIUM,
    status: Object.values(INCIDENT_STATUS).includes(data.status) ? data.status : INCIDENT_STATUS.OPEN,
    title: safeStr(data.title),
    description: safeStr(data.description),
    workflowId: safeStr(data.workflowId),
    workflowExecutionId: safeStr(data.workflowExecutionId),
    taskId: safeStr(data.taskId),
    equipmentId: safeStr(data.equipmentId),
    branchId: safeStr(data.branchId),
    owner: safeStr(data.owner),
    assignedTo: safeStr(data.assignedTo),
    resolution: safeStr(data.resolution),
    resolvedAt: data.resolvedAt ? safeTs(data.resolvedAt) : null,
    resolvedBy: safeStr(data.resolvedBy),
    evidence: safeArr(data.evidence),
    createdAt: safeTs(data.createdAt),
    updatedAt: safeTs(data.updatedAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeIncident(incident) {
  if (!incident || typeof incident !== 'object') return null;
  return createIncident(incident);
}

// Phase 2: Timeline Event
export function createTimelineEvent(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    eventType: Object.values(TIMELINE_EVENT_TYPE).includes(data.eventType) ? data.eventType : TIMELINE_EVENT_TYPE.CREATED,
    workflowExecutionId: safeStr(data.workflowExecutionId),
    taskId: safeStr(data.taskId),
    actor: safeStr(data.actor),
    timestamp: safeTs(data.timestamp),
    details: safeStr(data.details),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeTimelineEvent(event) {
  if (!event || typeof event !== 'object') return null;
  return createTimelineEvent(event);
}

// Phase 2: Approval
export function createApproval(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowExecutionId: safeStr(data.workflowExecutionId),
    taskId: safeStr(data.taskId),
    level: Object.values(APPROVAL_LEVEL).includes(data.level) ? data.level : APPROVAL_LEVEL.SUPERVISOR,
    status: Object.values(APPROVAL_STATUS).includes(data.status) ? data.status : APPROVAL_STATUS.PENDING,
    requestedBy: safeStr(data.requestedBy),
    requestedAt: data.requestedAt ? safeTs(data.requestedAt) : null,
    approvedBy: safeStr(data.approvedBy),
    approvedAt: data.approvedAt ? safeTs(data.approvedAt) : null,
    rejectedBy: safeStr(data.rejectedBy),
    rejectedAt: data.rejectedAt ? safeTs(data.rejectedAt) : null,
    comments: safeStr(data.comments),
    signature: data.signature || null,
    evidence: safeArr(data.evidence),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeApproval(approval) {
  if (!approval || typeof approval !== 'object') return null;
  return createApproval(approval);
}

// Phase 2: Escalation Rule
export function createEscalationRule(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowId: safeStr(data.workflowId),
    trigger: Object.values(ESCALATION_TRIGGER).includes(data.trigger) ? data.trigger : ESCALATION_TRIGGER.OVERDUE_AFTER,
    thresholdValue: safeNum(data.thresholdValue),
    thresholdUnit: safeStr(data.thresholdUnit, 'minutes'),
    notifyRoles: safeArr(data.notifyRoles),
    notifyUsers: safeArr(data.notifyUsers),
    notificationPriority: Object.values(WORKFLOW_PRIORITY).includes(data.notificationPriority) ? data.notificationPriority : WORKFLOW_PRIORITY.MEDIUM,
    isActive: safeBool(data.isActive, true),
    createdAt: safeTs(data.createdAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeEscalationRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  return createEscalationRule(rule);
}

// Phase 2: Conditional Rule
export function createConditionalRule(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowId: safeStr(data.workflowId),
    taskId: safeStr(data.taskId),
    operator: Object.values(LOGICAL_OPERATOR).includes(data.operator) ? data.operator : LOGICAL_OPERATOR.AND,
    conditions: safeArr(data.conditions),
    thenAction: safeObj(data.thenAction),
    elseAction: data.elseAction ? safeObj(data.elseAction) : null,
    isActive: safeBool(data.isActive, true),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeConditionalRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  return createConditionalRule(rule);
}

// Phase 2: Condition
export function createCondition(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    field: safeStr(data.field),
    operator: Object.values(CONDITION_OPERATOR).includes(data.operator) ? data.operator : CONDITION_OPERATOR.EQUALS,
    value: data.value,
    dataType: safeStr(data.dataType, 'string'),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeCondition(condition) {
  if (!condition || typeof condition !== 'object') return null;
  return createCondition(condition);
}

// Phase 2: Dynamic Task Configuration
export function createDynamicTaskConfig(input = {}) {
  const data = safeObj(input);
  return {
    source: safeStr(data.source), // 'tables', 'equipment', 'staff', 'inventory', 'suppliers'
    sourceFilter: safeObj(data.sourceFilter),
    taskTemplate: safeObj(data.taskTemplate),
    namingPattern: safeStr(data.namingPattern),
    maxTasks: safeNum(data.maxTasks),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeDynamicTaskConfig(config) {
  if (!config || typeof config !== 'object') return null;
  return createDynamicTaskConfig(config);
}

// Phase 2: Evaluate Conditional Rule
export function evaluateCondition(condition, context = {}) {
  const { field, operator, value } = condition;
  const contextValue = context[field];
  
  switch (operator) {
    case CONDITION_OPERATOR.EQUALS:
      return contextValue === value;
    case CONDITION_OPERATOR.NOT_EQUALS:
      return contextValue !== value;
    case CONDITION_OPERATOR.GREATER_THAN:
      return Number(contextValue) > Number(value);
    case CONDITION_OPERATOR.LESS_THAN:
      return Number(contextValue) < Number(value);
    case CONDITION_OPERATOR.GREATER_THAN_OR_EQUAL:
      return Number(contextValue) >= Number(value);
    case CONDITION_OPERATOR.LESS_THAN_OR_EQUAL:
      return Number(contextValue) <= Number(value);
    case CONDITION_OPERATOR.CONTAINS:
      return String(contextValue).includes(String(value));
    case CONDITION_OPERATOR.NOT_CONTAINS:
      return !String(contextValue).includes(String(value));
    case CONDITION_OPERATOR.STARTS_WITH:
      return String(contextValue).startsWith(String(value));
    case CONDITION_OPERATOR.ENDS_WITH:
      return String(contextValue).endsWith(String(value));
    case CONDITION_OPERATOR.IS_EMPTY:
      return !contextValue;
    case CONDITION_OPERATOR.IS_NOT_EMPTY:
      return !!contextValue;
    case CONDITION_OPERATOR.IN:
      return Array.isArray(value) && value.includes(contextValue);
    case CONDITION_OPERATOR.NOT_IN:
      return Array.isArray(value) && !value.includes(contextValue);
    default:
      return false;
  }
}

export function evaluateConditionalRule(rule, context = {}) {
  const { operator, conditions } = rule;
  
  if (operator === LOGICAL_OPERATOR.AND) {
    return conditions.every(c => evaluateCondition(c, context));
  } else if (operator === LOGICAL_OPERATOR.OR) {
    return conditions.some(c => evaluateCondition(c, context));
  } else if (operator === LOGICAL_OPERATOR.NOT) {
    return !conditions.every(c => evaluateCondition(c, context));
  }
  
  return false;
}

// Phase 2: Generate Dynamic Tasks from CafeOS Data
export function generateDynamicTasks(config, cafeOSData = {}) {
  const { source, sourceFilter, taskTemplate, namingPattern, maxTasks } = config;
  let sourceItems = [];
  
  switch (source) {
    case 'tables':
      sourceItems = (cafeOSData.tables || []).filter(table => {
        if (!sourceFilter) return true;
        return Object.entries(sourceFilter).every(([key, value]) => table[key] === value);
      });
      break;
    case 'equipment':
      sourceItems = (cafeOSData.equipment || []).filter(equipment => {
        if (!sourceFilter) return true;
        return Object.entries(sourceFilter).every(([key, value]) => equipment[key] === value);
      });
      break;
    case 'staff':
      sourceItems = (cafeOSData.staff || []).filter(staff => {
        if (!sourceFilter) return true;
        return Object.entries(sourceFilter).every(([key, value]) => staff[key] === value);
      });
      break;
    case 'inventory':
      sourceItems = (cafeOSData.inventory || []).filter(item => {
        if (!sourceFilter) return true;
        return Object.entries(sourceFilter).every(([key, value]) => item[key] === value);
      });
      break;
    case 'suppliers':
      sourceItems = (cafeOSData.suppliers || []).filter(supplier => {
        if (!sourceFilter) return true;
        return Object.entries(sourceFilter).every(([key, value]) => supplier[key] === value);
      });
      break;
    default:
      return [];
  }
  
  if (maxTasks && sourceItems.length > maxTasks) {
    sourceItems = sourceItems.slice(0, maxTasks);
  }
  
  return sourceItems.map((item, index) => {
    const taskName = namingPattern
      ? namingPattern.replace('{name}', item.name || item.id || `Item ${index + 1}`)
      : `${taskTemplate.name || 'Task'} - ${item.name || item.id || index + 1}`;
    
    return createTaskDefinition({
      ...taskTemplate,
      id: generateId(),
      name: taskName,
      order: index,
      metadata: {
        ...taskTemplate.metadata,
        sourceId: item.id,
        sourceType: source,
        generated: true
      }
    });
  });
}

// Phase 2: Trigger Workflow from Shift Event
export function triggerWorkflowFromShift(workflow, shiftEvent, shiftData = {}) {
  if (!workflow.shiftTrigger || workflow.shiftTrigger !== shiftEvent) {
    return null;
  }
  
  const execution = createWorkflowExecution({
    workflowId: workflow.id,
    workflowName: workflow.name,
    workflowVersion: workflow.publishedVersion || workflow.version,
    assignedTo: workflow.autoAssignToShift ? shiftData.staffId : null,
    assignedBy: 'system',
    branchId: workflow.branchId || shiftData.branchId,
    metadata: {
      ...workflow.metadata,
      shiftEvent,
      shiftId: shiftData.shiftId,
      triggeredBy: 'shift'
    }
  });
  
  return execution;
}

// Phase 2: Dashboard Compliance Metrics
export function calculateComplianceMetrics(executions = [], workflows = []) {
  const totalExecutions = executions.length;
  const completedExecutions = executions.filter(e => e.status === EXECUTION_STATUS.COMPLETED);
  const failedExecutions = executions.filter(e => e.status === EXECUTION_STATUS.FAILED);
  const overdueExecutions = executions.filter(e => {
    if (!e.startedAt || e.status === EXECUTION_STATUS.COMPLETED) return false;
    const workflow = workflows.find(w => w.id === e.workflowId);
    if (!workflow?.targetDuration) return false;
    const elapsed = Date.now() - e.startedAt;
    return elapsed > workflow.targetDuration * 60000;
  });
  
  const completionRate = totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0;
  
  const allTasks = executions.flatMap(e => e.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  const failedTasks = allTasks.filter(t => t.status === TASK_STATUS.FAILED).length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const avgDuration = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
    : 0;
  
  const openIncidents = executions.filter(e => e.metadata?.incidentCount || 0).reduce((sum, e) => sum + (e.metadata.incidentCount || 0), 0);
  
  return {
    totalExecutions,
    completedExecutions: completedExecutions.length,
    failedExecutions: failedExecutions.length,
    overdueExecutions: overdueExecutions.length,
    completionRate,
    totalTasks,
    completedTasks,
    failedTasks,
    taskCompletionRate,
    avgDuration,
    openIncidents
  };
}

// Phase 2: Branch Comparison Metrics
export function calculateBranchMetrics(executions = [], branchId) {
  const branchExecutions = executions.filter(e => e.branchId === branchId);
  return calculateComplianceMetrics(branchExecutions);
}

// Phase 2: Department Comparison Metrics
export function calculateDepartmentMetrics(executions = [], workflows = [], department) {
  const departmentWorkflowIds = workflows.filter(w => w.department === department).map(w => w.id);
  const departmentExecutions = executions.filter(e => departmentWorkflowIds.includes(e.workflowId));
  return calculateComplianceMetrics(departmentExecutions, workflows);
}

// Phase 2: Automation Rule
export function createAutomationRule(input = {}) {
  const data = safeObj(input);
  return {
    id: safeStr(data.id) || generateId(),
    workflowId: safeStr(data.workflowId),
    trigger: Object.values(AUTOMATION_TRIGGER).includes(data.trigger) ? data.trigger : AUTOMATION_TRIGGER.WORKFLOW_COMPLETED,
    actions: safeArr(data.actions),
    isActive: safeBool(data.isActive, true),
    conditions: safeArr(data.conditions),
    createdAt: safeTs(data.createdAt),
    metadata: safeObj(data.metadata)
  };
}

export function normalizeAutomationRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  return createAutomationRule(rule);
}

// Phase 2: Execute Automation Rule
export function executeAutomationRule(rule, context = {}) {
  if (!rule.isActive) return [];
  
  const executedActions = [];
  
  for (const action of rule.actions) {
    const actionType = action.type;
    const actionParams = action.params || {};
    
    executedActions.push({
      type: actionType,
      params: actionParams,
      executedAt: now(),
      success: true
    });
  }
  
  return executedActions;
}

// Phase 2: Performance Optimization - Batch Operations
export function batchNormalizeWorkflowExecutions(executions = []) {
  return executions.map(e => normalizeWorkflowExecution(e)).filter(Boolean);
}

export function batchNormalizeWorkflowDefinitions(workflows = []) {
  return workflows.map(w => normalizeWorkflowDefinition(w)).filter(Boolean);
}

export function batchNormalizeTaskExecutions(tasks = []) {
  return tasks.map(t => normalizeTaskExecution(t)).filter(Boolean);
}

// Phase 2: Performance Optimization - Indexed Lookups
export function createExecutionIndex(executions = []) {
  const index = {
    byId: new Map(),
    byWorkflowId: new Map(),
    byStatus: new Map(),
    byBranchId: new Map(),
    byAssignedTo: new Map()
  };
  
  for (const execution of executions) {
    index.byId.set(execution.id, execution);
    
    if (!index.byWorkflowId.has(execution.workflowId)) {
      index.byWorkflowId.set(execution.workflowId, []);
    }
    index.byWorkflowId.get(execution.workflowId).push(execution);
    
    if (!index.byStatus.has(execution.status)) {
      index.byStatus.set(execution.status, []);
    }
    index.byStatus.get(execution.status).push(execution);
    
    if (execution.branchId) {
      if (!index.byBranchId.has(execution.branchId)) {
        index.byBranchId.set(execution.branchId, []);
      }
      index.byBranchId.get(execution.branchId).push(execution);
    }
    
    if (execution.assignedTo) {
      if (!index.byAssignedTo.has(execution.assignedTo)) {
        index.byAssignedTo.set(execution.assignedTo, []);
      }
      index.byAssignedTo.get(execution.assignedTo).push(execution);
    }
  }
  
  return index;
}

// Phase 2: Performance Optimization - Pagination
export function paginateExecutions(executions = [], page = 1, pageSize = 50) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: executions.slice(start, end),
    page,
    pageSize,
    total: executions.length,
    totalPages: Math.ceil(executions.length / pageSize)
  };
}

// Phase 2: Performance Optimization - Memoization Cache
const memoCache = new Map();

export function memoizeComplianceMetrics(executions, workflows) {
  const cacheKey = JSON.stringify({
    execCount: executions.length,
    workflowIds: workflows.map(w => w.id).sort()
  });
  
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }
  
  const result = calculateComplianceMetrics(executions, workflows);
  memoCache.set(cacheKey, result);
  
  // Limit cache size
  if (memoCache.size > 100) {
    const firstKey = memoCache.keys().next().value;
    memoCache.delete(firstKey);
  }
  
  return result;
}

export function clearMemoCache() {
  memoCache.clear();
}

// Phase 2: Workflow Calendar - Organize executions by date for calendar views
export function getCalendarEvents(executions = [], workflows = [], startDate, endDate) {
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000; // Default 30 days ago
  const end = endDate ? new Date(endDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000; // Default 30 days ahead
  
  return executions
    .filter(e => {
      const execDate = e.startedAt || e.createdAt || e.assignedAt;
      return execDate && execDate >= start && execDate <= end;
    })
    .map(e => {
      const workflow = workflows.find(w => w.id === e.workflowId);
      return {
        id: e.id,
        title: e.workflowName || 'Unknown Workflow',
        start: new Date(e.startedAt || e.createdAt || e.assignedAt),
        end: new Date(e.completedAt || e.startedAt || e.createdAt || e.assignedAt),
        status: e.status,
        workflowId: e.workflowId,
        workflowCategory: workflow?.category,
        workflowPriority: workflow?.priority,
        assignedTo: e.assignedTo,
        branchId: e.branchId,
        color: workflow?.color || '#6366f1'
      };
    });
}

// Phase 2: Workflow Calendar - Get timeline data for Gantt view
export function getGanttTimeline(executions = [], workflows = []) {
  return executions.map(e => {
    const workflow = workflows.find(w => w.id === e.workflowId);
    const startedAt = e.startedAt || e.createdAt;
    const completedAt = e.completedAt || Date.now();
    
    return {
      id: e.id,
      name: e.workflowName || 'Unknown Workflow',
      start: new Date(startedAt),
      end: new Date(completedAt),
      progress: e.status === EXECUTION_STATUS.COMPLETED ? 100 : 
                e.status === EXECUTION_STATUS.IN_PROGRESS ? 50 : 0,
      status: e.status,
      workflowCategory: workflow?.category,
      assignedTo: e.assignedTo,
      tasks: e.tasks || [],
      dependencies: workflow?.tasks?.map(t => t.dependencies).flat() || []
    };
  });
}

// Phase 2: Advanced Analytics - Heat map data
export function getComplianceHeatmap(executions = [], workflows = [], groupBy = 'department') {
  const grouped = {};
  
  executions.forEach(e => {
    const workflow = workflows.find(w => w.id === e.workflowId);
    if (!workflow) return;
    
    const key = groupBy === 'department' ? workflow.department : 
                groupBy === 'category' ? workflow.category :
                groupBy === 'branch' ? e.branchId : 'all';
    
    if (!grouped[key]) {
      grouped[key] = { total: 0, completed: 0, failed: 0, overdue: 0 };
    }
    
    grouped[key].total++;
    if (e.status === EXECUTION_STATUS.COMPLETED) grouped[key].completed++;
    if (e.status === EXECUTION_STATUS.FAILED) grouped[key].failed++;
    
    if (workflow.targetDuration && e.startedAt) {
      const elapsed = Date.now() - e.startedAt;
      if (elapsed > workflow.targetDuration * 60000) grouped[key].overdue++;
    }
  });
  
  return Object.entries(grouped).map(([key, data]) => ({
    key,
    complianceRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    failureRate: data.total > 0 ? (data.failed / data.total) * 100 : 0,
    overdueRate: data.total > 0 ? (data.overdue / data.total) * 100 : 0,
    total: data.total
  }));
}

// Phase 2: Advanced Analytics - Trend data
export function getComplianceTrends(executions = [], workflows = [], days = 30) {
  const trends = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i * dayMs);
    const dayEnd = dayStart + dayMs;
    
    const dayExecutions = executions.filter(e => {
      const execDate = e.completedAt || e.startedAt || e.createdAt;
      return execDate >= dayStart && execDate < dayEnd;
    });
    
    const completed = dayExecutions.filter(e => e.status === EXECUTION_STATUS.COMPLETED).length;
    const failed = dayExecutions.filter(e => e.status === EXECUTION_STATUS.FAILED).length;
    
    trends.push({
      date: new Date(dayStart).toISOString().split('T')[0],
      total: dayExecutions.length,
      completed,
      failed,
      complianceRate: dayExecutions.length > 0 ? (completed / dayExecutions.length) * 100 : 0
    });
  }
  
  return trends;
}

// Phase 2: Advanced Analytics - Export data
export function exportWorkflowData(executions = [], workflows = [], format = 'json') {
  const data = {
    exportedAt: new Date().toISOString(),
    totalExecutions: executions.length,
    totalWorkflows: workflows.length,
    executions: executions.map(e => ({
      id: e.id,
      workflowName: e.workflowName,
      status: e.status,
      assignedTo: e.assignedTo,
      startedAt: e.startedAt ? new Date(e.startedAt).toISOString() : null,
      completedAt: e.completedAt ? new Date(e.completedAt).toISOString() : null,
      duration: e.duration,
      branchId: e.branchId
    })),
    workflows: workflows.map(w => ({
      id: w.id,
      name: w.name,
      category: w.category,
      department: w.department,
      status: w.status,
      version: w.version
    }))
  };
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    const headers = ['ID', 'Workflow Name', 'Status', 'Assigned To', 'Started At', 'Completed At', 'Duration (ms)', 'Branch ID'];
    const rows = data.executions.map(e => [
      e.id,
      e.workflowName,
      e.status,
      e.assignedTo || '',
      e.startedAt || '',
      e.completedAt || '',
      e.duration || 0,
      e.branchId || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
  
  return data;
}

// Phase 2: Global Search
export function searchWorkflows(query = '', workflows = [], executions = [], incidents = [], equipment = []) {
  const searchLower = query.toLowerCase();
  
  if (!searchLower) return { workflows: [], executions: [], incidents: [], equipment: [] };
  
  const workflowResults = workflows.filter(w => 
    w.name?.toLowerCase().includes(searchLower) ||
    w.description?.toLowerCase().includes(searchLower) ||
    w.category?.toLowerCase().includes(searchLower) ||
    w.tags?.some(t => t.toLowerCase().includes(searchLower))
  );
  
  const executionResults = executions.filter(e =>
    e.workflowName?.toLowerCase().includes(searchLower) ||
    e.assignedTo?.toLowerCase().includes(searchLower) ||
    e.id?.toLowerCase().includes(searchLower)
  );
  
  const incidentResults = incidents.filter(i =>
    i.title?.toLowerCase().includes(searchLower) ||
    i.description?.toLowerCase().includes(searchLower) ||
    i.type?.toLowerCase().includes(searchLower) ||
    i.assignedTo?.toLowerCase().includes(searchLower)
  );
  
  const equipmentResults = equipment.filter(eq =>
    eq.name?.toLowerCase().includes(searchLower) ||
    eq.type?.toLowerCase().includes(searchLower) ||
    eq.serialNumber?.toLowerCase().includes(searchLower) ||
    eq.location?.toLowerCase().includes(searchLower)
  );
  
  return {
    workflows: workflowResults,
    executions: executionResults,
    incidents: incidentResults,
    equipment: equipmentResults,
    total: workflowResults.length + executionResults.length + incidentResults.length + equipmentResults.length
  };
}
