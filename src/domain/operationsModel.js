// Operations Center Domain Model for CafeOS
// Defines tasks, checklists, assignments, and operational workflows

// Task categories
export const TASK_CATEGORIES = {
  OPENING: 'OPENING',
  KITCHEN: 'KITCHEN',
  CLEANING: 'CLEANING',
  COFFEE_MACHINE: 'COFFEE_MACHINE',
  INVENTORY: 'INVENTORY',
  PRODUCTION: 'PRODUCTION',
  DINING_AREA: 'DINING_AREA',
  RESTROOMS: 'RESTROOMS',
  MAINTENANCE: 'MAINTENANCE',
  CLOSING: 'CLOSING',
  CUSTOM: 'CUSTOM'
};

// Task priorities
export const TASK_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  NORMAL: 'NORMAL',
  LOW: 'LOW'
};

// Task status
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  OVERDUE: 'OVERDUE',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Staff roles
export const STAFF_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
  BARISTA: 'BARISTA',
  CLEANING_STAFF: 'CLEANING_STAFF',
  CUSTOM: 'CUSTOM'
};

// Recurrence patterns
export const RECURRENCE_PATTERNS = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  EVERY_X_DAYS: 'EVERY_X_DAYS',
  CUSTOM: 'CUSTOM'
};

// Days of week
export const DAYS_OF_WEEK = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY'
};

/**
 * Create a task
 */
export function createTask(data) {
  return {
    id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    description: data.description || '',
    category: data.category || TASK_CATEGORIES.CUSTOM,
    priority: data.priority || TASK_PRIORITY.NORMAL,
    status: data.status || TASK_STATUS.PENDING,
    assignedTo: data.assignedTo || null,
    assignedRole: data.assignedRole || null,
    dueTime: data.dueTime || null,
    estimatedTime: data.estimatedTime || 15,
    requiresApproval: data.requiresApproval || false,
    approvedBy: null,
    approvedAt: null,
    attachments: data.attachments || [],
    notes: data.notes || '',
    completedBy: null,
    completedAt: null,
    evidence: data.evidence || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: data.metadata || {}
  };
}

/**
 * Create a recurring task template
 */
export function createRecurringTaskTemplate(data) {
  return {
    id: `TEMPLATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    description: data.description || '',
    category: data.category || TASK_CATEGORIES.CUSTOM,
    priority: data.priority || TASK_PRIORITY.NORMAL,
    assignedRole: data.assignedRole || null,
    dueTime: data.dueTime || null,
    estimatedTime: data.estimatedTime || 15,
    requiresApproval: data.requiresApproval || false,
    recurrencePattern: data.recurrencePattern || RECURRENCE_PATTERNS.DAILY,
    recurrenceDays: data.recurrenceDays || [DAYS_OF_WEEK.MONDAY, DAYS_OF_WEEK.TUESDAY, DAYS_OF_WEEK.WEDNESDAY, DAYS_OF_WEEK.THURSDAY, DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY],
    recurrenceInterval: data.recurrenceInterval || 1,
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || null,
    isActive: data.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Create a task completion record
 */
export function createTaskCompletion(data) {
  return {
    id: `COMPLETION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId: data.taskId,
    completedBy: data.completedBy,
    completedAt: data.completedAt || new Date().toISOString(),
    notes: data.notes || '',
    evidence: data.evidence || [],
    approvedBy: data.approvedBy || null,
    approvedAt: data.approvedAt || null,
    status: data.status || 'COMPLETED'
  };
}

/**
 * Create a daily checklist
 */
export function createDailyChecklist(data) {
  return {
    id: `CHECKLIST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: data.date || new Date().toISOString().split('T')[0],
    tasks: data.tasks || [],
    openingProgress: 0,
    closingProgress: 0,
    overallProgress: 0,
    createdBy: data.createdBy || 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Normalize a task
 */
export function normalizeTask(task) {
  return {
    ...task,
    id: task.id || `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: task.status || TASK_STATUS.PENDING,
    priority: task.priority || TASK_PRIORITY.NORMAL,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString()
  };
}

/**
 * Update task status
 */
export function updateTaskStatus(task, status, userId) {
  const now = new Date().toISOString();
  const updated = {
    ...task,
    status,
    updatedAt: now
  };

  if (status === TASK_STATUS.COMPLETED) {
    updated.completedBy = userId;
    updated.completedAt = now;
  }

  if (status === TASK_STATUS.APPROVED) {
    updated.approvedBy = userId;
    updated.approvedAt = now;
  }

  return updated;
}

/**
 * Add evidence to task
 */
export function addTaskEvidence(task, evidence) {
  return {
    ...task,
    evidence: [...(task.evidence || []), {
      id: `EVIDENCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: evidence.type || 'NOTE',
      content: evidence.content,
      addedBy: evidence.addedBy,
      addedAt: new Date().toISOString()
    }],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Calculate checklist progress
 */
export function calculateChecklistProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.APPROVED).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Calculate category progress
 */
export function calculateCategoryProgress(tasks, category) {
  const categoryTasks = tasks.filter(t => t.category === category);
  if (categoryTasks.length === 0) return 0;
  const completed = categoryTasks.filter(t => t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.APPROVED).length;
  return Math.round((completed / categoryTasks.length) * 100);
}

/**
 * Get task priority color
 */
export function getTaskPriorityColor(priority) {
  switch (priority) {
    case TASK_PRIORITY.CRITICAL:
      return '#e74c3c';
    case TASK_PRIORITY.HIGH:
      return '#f39c12';
    case TASK_PRIORITY.NORMAL:
      return '#3498db';
    case TASK_PRIORITY.LOW:
      return '#95a5a6';
    default:
      return '#95a5a6';
  }
}

/**
 * Get task category icon
 */
export function getTaskCategoryIcon(category) {
  const icons = {
    [TASK_CATEGORIES.OPENING]: '🌅',
    [TASK_CATEGORIES.KITCHEN]: '👨‍🍳',
    [TASK_CATEGORIES.CLEANING]: '🧹',
    [TASK_CATEGORIES.COFFEE_MACHINE]: '☕',
    [TASK_CATEGORIES.INVENTORY]: '📦',
    [TASK_CATEGORIES.PRODUCTION]: '🏭',
    [TASK_CATEGORIES.DINING_AREA]: '🪑',
    [TASK_CATEGORIES.RESTROOMS]: '🚻',
    [TASK_CATEGORIES.MAINTENANCE]: '🔧',
    [TASK_CATEGORIES.CLOSING]: '🌙',
    [TASK_CATEGORIES.CUSTOM]: '📋'
  };
  return icons[category] || '📋';
}

/**
 * Get task category color
 */
export function getTaskCategoryColor(category) {
  const colors = {
    [TASK_CATEGORIES.OPENING]: '#27ae60',
    [TASK_CATEGORIES.KITCHEN]: '#e67e22',
    [TASK_CATEGORIES.CLEANING]: '#3498db',
    [TASK_CATEGORIES.COFFEE_MACHINE]: '#8e44ad',
    [TASK_CATEGORIES.INVENTORY]: '#16a085',
    [TASK_CATEGORIES.PRODUCTION]: '#d35400',
    [TASK_CATEGORIES.DINING_AREA]: '#c0392b',
    [TASK_CATEGORIES.RESTROOMS]: '#7f8c8d',
    [TASK_CATEGORIES.MAINTENANCE]: '#f39c12',
    [TASK_CATEGORIES.CLOSING]: '#2c3e50',
    [TASK_CATEGORIES.CUSTOM]: '#95a5a6'
  };
  return colors[category] || '#95a5a6';
}

/**
 * Filter tasks by category
 */
export function filterTasksByCategory(tasks, category) {
  return tasks.filter(t => t.category === category);
}

/**
 * Filter tasks by status
 */
export function filterTasksByStatus(tasks, status) {
  return tasks.filter(t => t.status === status);
}

/**
 * Filter tasks by assignee
 */
export function filterTasksByAssignee(tasks, assigneeId) {
  return tasks.filter(t => t.assignedTo === assigneeId);
}

/**
 * Filter tasks by priority
 */
export function filterTasksByPriority(tasks, priority) {
  return tasks.filter(t => t.priority === priority);
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(tasks) {
  const now = new Date();
  return tasks.filter(t => {
    if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.APPROVED) return false;
    if (!t.dueTime) return false;
    const dueTime = new Date(t.dueTime);
    return dueTime < now;
  });
}

/**
 * Get critical tasks
 */
export function getCriticalTasks(tasks) {
  return tasks.filter(t => 
    t.priority === TASK_PRIORITY.CRITICAL && 
    t.status !== TASK_STATUS.COMPLETED && 
    t.status !== TASK_STATUS.APPROVED
  );
}

/**
 * Generate tasks from recurring template
 */
export function generateTasksFromTemplate(template, date) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  // Check if this day matches the recurrence pattern
  if (!template.recurrenceDays.includes(dayOfWeek)) {
    return [];
  }

  return [createTask({
    title: template.title,
    description: template.description,
    category: template.category,
    priority: template.priority,
    assignedRole: template.assignedRole,
    dueTime: template.dueTime ? `${date}T${template.dueTime}` : null,
    estimatedTime: template.estimatedTime,
    requiresApproval: template.requiresApproval,
    metadata: {
      templateId: template.id,
      generatedFrom: 'RECURRING_TEMPLATE'
    }
  })];
}

/**
 * Sort tasks by priority
 */
export function sortTasksByPriority(tasks) {
  const priorityOrder = {
    [TASK_PRIORITY.CRITICAL]: 0,
    [TASK_PRIORITY.HIGH]: 1,
    [TASK_PRIORITY.NORMAL]: 2,
    [TASK_PRIORITY.LOW]: 3
  };

  return [...tasks].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.dueTime || 0) - new Date(b.dueTime || 0);
  });
}

/**
 * Sort tasks by due time
 */
export function sortTasksByDueTime(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = a.dueTime ? new Date(a.dueTime).getTime() : Infinity;
    const bTime = b.dueTime ? new Date(b.dueTime).getTime() : Infinity;
    return aTime - bTime;
  });
}

export default {
  TASK_CATEGORIES,
  TASK_PRIORITY,
  TASK_STATUS,
  STAFF_ROLES,
  RECURRENCE_PATTERNS,
  DAYS_OF_WEEK,
  createTask,
  createRecurringTaskTemplate,
  createTaskCompletion,
  createDailyChecklist,
  normalizeTask,
  updateTaskStatus,
  addTaskEvidence,
  calculateChecklistProgress,
  calculateCategoryProgress,
  getTaskPriorityColor,
  getTaskCategoryIcon,
  getTaskCategoryColor,
  filterTasksByCategory,
  filterTasksByStatus,
  filterTasksByAssignee,
  filterTasksByPriority,
  getOverdueTasks,
  getCriticalTasks,
  generateTasksFromTemplate,
  sortTasksByPriority,
  sortTasksByDueTime
};
