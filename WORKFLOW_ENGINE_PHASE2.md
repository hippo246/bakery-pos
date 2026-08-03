# Workflow Engine Phase 2 Architecture

## Overview
Enterprise-grade Operations Automation & Execution Platform. Deterministic, rule-based, no AI/ML.

## Key Features

### 1. Templates Library
Scopes: PERSONAL, BRANCH, ORGANIZATION, GLOBAL. Cloneable, versioned, usage stats.

### 2. Versioning
Version numbers, published versions, change logs, rollback support. Staff execute published versions.

### 3. Conditional Logic
Operators: EQUALS, GREATER_THAN, CONTAINS, IN, etc. Logical: AND, OR, NOT. Visual rule builder, no scripting.

### 4. Dynamic Tasks
Generate tasks from CafeOS data (tables, equipment, staff, inventory, suppliers). Source filtering, naming patterns.

### 5. Task Dependencies
Types: FINISH_TO_START, START_TO_START, FINISH_TO_FINISH, BLOCKING, PARALLEL, WAITING.

### 6. Escalation Engine
Triggers: NOT_STARTED_AFTER, OVERDUE_AFTER, TASK_FAILED, SLA_WARNING. Actions: notify roles/users, create incidents.

### 7. SLA Tracking
targetDuration, warningThreshold, criticalThreshold. Compliance metrics, branch/department comparison.

### 8. Approvals
Levels: SUPERVISOR, MANAGER, OWNER. Status: PENDING, APPROVED, REJECTED, CHANGES_REQUESTED. Digital signatures, evidence.

### 9. Evidence Collection
Photo, video, signature, attachments. Timestamped, device info, permanent linking.

### 10. Operational Incidents
Types: INCIDENT, MAINTENANCE_REQUEST, HEALTH_VIOLATION, SAFETY_INCIDENT, EQUIPMENT_FAILURE. Priority/status tracking.

### 11. Equipment Integration
Link workflows to equipment. Service/maintenance/inspection history, failure logging.

### 12. Shift Integration
Triggers: SHIFT_START, SHIFT_END, OPENING, CLOSING, CASH_COUNT. Auto-assign to shift staff.

### 13. Dashboard Integration
Metrics: compliance %, open/overdue workflows, failed tasks, avg completion time, incidents. Branch/department comparison.

### 14. Automation
Triggers: WORKFLOW_COMPLETED, TASK_FAILED, APPROVAL_REJECTED, SLA_CRITICAL. Actions: GENERATE_PDF, NOTIFY_MANAGER, START_WORKFLOW, CREATE_INCIDENT. Chain unlimited workflows.

### 15. Multi-Branch Support
Corporate workflow distribution, branch overrides, inherited templates, version sync.

### 16. Operational Timeline
Immutable events: CREATED, ASSIGNED, STARTED, PAUSED, ESCALATED, APPROVED, COMPLETED, etc.

## Data Model Additions

**New Constants:**
- TEMPLATE_SCOPE, TASK_DEPENDENCY_TYPE, APPROVAL_STATUS, APPROVAL_LEVEL
- INCIDENT_TYPE, INCIDENT_PRIORITY, INCIDENT_STATUS
- ESCALATION_TRIGGER, TIMELINE_EVENT_TYPE
- CONDITION_OPERATOR, LOGICAL_OPERATOR
- SHIFT_TRIGGER, AUTOMATION_TRIGGER, AUTOMATION_ACTION

**New Factory Functions:**
- createWorkflowTemplate, normalizeWorkflowTemplate
- createWorkflowVersion, normalizeWorkflowVersion
- createIncident, normalizeIncident
- createTimelineEvent, normalizeTimelineEvent
- createApproval, normalizeApproval
- createEscalationRule, normalizeEscalationRule
- createConditionalRule, normalizeConditionalRule
- createCondition, normalizeCondition
- createDynamicTaskConfig, normalizeDynamicTaskConfig
- createAutomationRule, normalizeAutomationRule

**New Helper Functions:**
- evaluateCondition, evaluateConditionalRule
- generateDynamicTasks
- triggerWorkflowFromShift
- calculateComplianceMetrics
- calculateBranchMetrics
- calculateDepartmentMetrics
- executeAutomationRule

## Architecture

**Deterministic Rule Engine:**
- No AI/ML
- Explicit, configurable rules
- Visual builder only
- Full audit trail

**Performance:**
- 10,000+ executions
- 100,000+ tasks
- Virtual scrolling
- Lazy loading
- Memoization

**Integration:**
- Uses existing notification system
- Uses existing audit system
- Uses existing RBAC/ABAC
- Event-driven architecture

## Success Criteria
✓ Enterprise-grade execution engine
✓ Deterministic rule engine
✓ Multi-branch ready
✓ No AI
✓ Offline-ready
✓ Uses existing CafeOS systems
✓ Build passes
✓ Zero regressions
