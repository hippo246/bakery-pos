# Workflow Engine Architecture

## Overview
Configurable, reusable system for creating, assigning, executing, and tracking operational workflows in CafeOS. Isolated module integrating with notifications, audit logs, and permissions.

## Core Principles
- No hardcoded SOPs - all user-defined
- Isolated module - no business logic in Orders
- Reusable across all CafeOS modules
- Event-driven architecture
- Offline-ready
- Enterprise-ready (RBAC/ABAC, audit trails)

## Data Model

### Workflow Definition
```js
{
  id, name, category, description, department,
  estimatedDuration, priority, icon, color, tags,
  repeatSchedule, status, tasks[], requiredRoles,
  createdBy, createdAt, updatedAt, version, metadata
}
```

### Task Definition
```js
{
  id, name, type, description, instructions,
  required, optional, minValue, maxValue, options,
  defaultValue, notes, attachments, allowPassFail,
  weight, dependencies[], order, metadata
}
```

### Workflow Execution
```js
{
  id, workflowId, workflowName, workflowVersion, status,
  assignedTo, assignedBy, assignedAt, startedAt,
  completedAt, pausedAt, cancelledAt, duration,
  tasks[], skippedTasks[], failedTasks[], photos,
  notes, signature, overallResult, completedBy,
  branchId, linkedOrderId, linkedTableId, metadata
}
```

## Constants
- **Categories**: OPENING, CLOSING, CLEANING, MAINTENANCE, FOOD_SAFETY, SAFETY, INVENTORY, CASH_MANAGEMENT, SHIFT_HANDOVER, EQUIPMENT, INCIDENT_REPORT, QUALITY_CONTROL, TRAINING, COMPLIANCE, CUSTOM
- **Departments**: KITCHEN, FRONT_OF_HOUSE, BAR, MANAGEMENT, MAINTENANCE, ALL
- **Priority**: CRITICAL, HIGH, MEDIUM, LOW
- **Status**: DRAFT, ACTIVE, PAUSED, ARCHIVED, DISABLED
- **Task Types**: CHECKBOX, TEXT_INPUT, NUMBER, PHOTO_REQUIRED, SIGNATURE_REQUIRED, DATE, TIME, YES_NO, DROPDOWN, MULTI_SELECT, FILE_UPLOAD, QR_SCAN, BARCODE_SCAN

## Execution Lifecycle
NOT_STARTED → IN_PROGRESS → (PAUSED) → COMPLETED/CANCELLED/FAILED

## Integration Points

### Audit System (AUDIT_MODULES.WORKFLOWS)
- WORKFLOW_CREATED, WORKFLOW_UPDATED, WORKFLOW_DELETED
- WORKFLOW_EXECUTION_STARTED, PAUSED, RESUMED, COMPLETED, CANCELLED, FAILED
- TASK_COMPLETED, TASK_SKIPPED, TASK_FAILED

### Notification System (NOTIFICATION_CATEGORIES.WORKFLOWS)
- WORKFLOW_ASSIGNED, WORKFLOW_OVERDUE, WORKFLOW_FAILED
- WORKFLOW_INCOMPLETE, WORKFLOW_COMPLETED, TASK_FAILED, WORKFLOW_REMINDER

### Permissions (PERMISSION_MODULES.WORKFLOWS)
- VIEW, CREATE, EDIT, DELETE, EXECUTE, ASSIGN, REVIEW, ARCHIVE

## Component Structure

### Domain Layer (`src/domain/workflowModel.js`)
- Constants and enums
- Factory functions: createWorkflowDefinition, createTaskDefinition, createWorkflowExecution, createTaskExecution
- State transitions: startWorkflowExecution, pauseWorkflowExecution, resumeWorkflowExecution, completeWorkflowExecution, cancelWorkflowExecution

### UI Components (`src/components/workflows/`)
- **Workflows.jsx** - Main list interface with filters and active executions
- **WorkflowBuilder.jsx** - Workflow definition editor with task management
- **WorkflowExecutor.jsx** - Execution interface with progress tracking

## Future Extensions
- Equipment integration
- Advanced scheduling
- Reporting & analytics dashboard
- Workflow templates
- Conditional logic
- Multi-branch support
