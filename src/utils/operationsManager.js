// Operations Manager Utilities for CafeOS
// Handles task management, checklists, recurring tasks, and operational workflows

import {
  createTask,
  createRecurringTaskTemplate,
  createDailyChecklist,
  createTaskCompletion,
  updateTaskStatus,
  addTaskEvidence,
  calculateChecklistProgress,
  calculateCategoryProgress,
  TASK_CATEGORIES,
  TASK_STATUS,
  TASK_PRIORITY,
  generateTasksFromTemplate,
  getOverdueTasks,
  getCriticalTasks
} from "../domain/operationsModel.js";

const TASKS_KEY = 'cafeos_operations_tasks';
const TEMPLATES_KEY = 'cafeos_operations_templates';
const CHECKLISTS_KEY = 'cafeos_operations_checklists';
const COMPLETIONS_KEY = 'cafeos_operations_completions';

/**
 * Get all tasks
 */
export function getTasks() {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsManager] Failed to load tasks:', e);
    return [];
  }
}

/**
 * Save tasks
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('[OperationsManager] Failed to save tasks:', e);
  }
}

/**
 * Get task templates
 */
export function getTaskTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsManager] Failed to load templates:', e);
    return [];
  }
}

/**
 * Save task templates
 */
function saveTaskTemplates(templates) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('[OperationsManager] Failed to save templates:', e);
  }
}

/**
 * Get daily checklists
 */
export function getDailyChecklists() {
  try {
    const stored = localStorage.getItem(CHECKLISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsManager] Failed to load checklists:', e);
    return [];
  }
}

/**
 * Save daily checklists
 */
function saveDailyChecklists(checklists) {
  try {
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists));
  } catch (e) {
    console.error('[OperationsManager] Failed to save checklists:', e);
  }
}

/**
 * Get task completions
 */
export function getTaskCompletions() {
  try {
    const stored = localStorage.getItem(COMPLETIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsManager] Failed to load completions:', e);
    return [];
  }
}

/**
 * Save task completions
 */
function saveTaskCompletions(completions) {
  try {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  } catch (e) {
    console.error('[OperationsManager] Failed to save completions:', e);
  }
}

/**
 * Create a new task
 */
export function createNewTask(taskData) {
  const tasks = getTasks();
  const task = createTask(taskData);
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Update a task
 */
export function updateTask(taskId, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
    saveTasks(tasks);
    return tasks[index];
  }
  
  return null;
}

/**
 * Delete a task
 */
export function deleteTask(taskId) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
  return filtered;
}

/**
 * Complete a task
 */
export function completeTask(taskId, userId, evidence = null) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return null;
  
  let updatedTask = updateTaskStatus(task, TASK_STATUS.COMPLETED, userId);
  
  if (evidence) {
    updatedTask = addTaskEvidence(updatedTask, evidence);
  }
  
  if (task.requiresApproval) {
    updatedTask.status = TASK_STATUS.AWAITING_APPROVAL;
  }
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  tasks[taskIndex] = updatedTask;
  saveTasks(tasks);
  
  // Record completion
  const completions = getTaskCompletions();
  completions.push(createTaskCompletion({
    taskId,
    completedBy: userId,
    notes: evidence?.notes || '',
    evidence: evidence ? [evidence] : [],
    status: updatedTask.status
  }));
  saveTaskCompletions(completions);
  
  return updatedTask;
}

/**
 * Approve a task completion
 */
export function approveTask(taskId, userId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return null;
  
  const updatedTask = updateTaskStatus(task, TASK_STATUS.APPROVED, userId);
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  tasks[taskIndex] = updatedTask;
  saveTasks(tasks);
  
  // Update completion record
  const completions = getTaskCompletions();
  const completionIndex = completions.findIndex(c => c.taskId === taskId && !c.approvedAt);
  if (completionIndex !== -1) {
    completions[completionIndex].approvedBy = userId;
    completions[completionIndex].approvedAt = new Date().toISOString();
    completions[completionIndex].status = 'APPROVED';
    saveTaskCompletions(completions);
  }
  
  return updatedTask;
}

/**
 * Reject a task completion
 */
export function rejectTask(taskId, userId, reason) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return null;
  
  const updatedTask = {
    ...task,
    status: TASK_STATUS.PENDING,
    approvedBy: userId,
    approvedAt: new Date().toISOString(),
    notes: reason || 'Completion rejected',
    updatedAt: new Date().toISOString()
  };
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  tasks[taskIndex] = updatedTask;
  saveTasks(tasks);
  
  // Update completion record
  const completions = getTaskCompletions();
  const completionIndex = completions.findIndex(c => c.taskId === taskId && !c.approvedAt);
  if (completionIndex !== -1) {
    completions[completionIndex].approvedBy = userId;
    completions[completionIndex].approvedAt = new Date().toISOString();
    completions[completionIndex].status = 'REJECTED';
    completions[completionIndex].notes = reason || 'Completion rejected';
    saveTaskCompletions(completions);
  }
  
  return updatedTask;
}

/**
 * Create a recurring task template
 */
export function createRecurringTemplate(templateData) {
  const templates = getTaskTemplates();
  const template = createRecurringTaskTemplate(templateData);
  templates.push(template);
  saveTaskTemplates(templates);
  return template;
}

/**
 * Generate daily tasks from templates
 */
export function generateDailyTasks(date) {
  const templates = getTaskTemplates().filter(t => t.isActive);
  const tasks = getTasks();
  const existingDate = date || new Date().toISOString().split('T')[0];
  
  const newTasks = [];
  
  templates.forEach(template => {
    const generated = generateTasksFromTemplate(template, existingDate);
    generated.forEach(task => {
      // Check if task already exists for this date
      const exists = tasks.some(t => 
        t.metadata?.templateId === template.id && 
        t.createdAt.startsWith(existingDate)
      );
      
      if (!exists) {
        newTasks.push(task);
      }
    });
  });
  
  if (newTasks.length > 0) {
    tasks.push(...newTasks);
    saveTasks(tasks);
  }
  
  return newTasks;
}

/**
 * Get or create today's checklist
 */
export function getTodaysChecklist() {
  const today = new Date().toISOString().split('T')[0];
  const checklists = getDailyChecklists();
  let checklist = checklists.find(c => c.date === today);
  
  if (!checklist) {
    // Generate tasks for today
    generateDailyTasks(today);
    
    // Get all tasks for today
    const tasks = getTasks().filter(t => t.createdAt.startsWith(today));
    
    checklist = createDailyChecklist({
      date: today,
      tasks: tasks.map(t => t.id)
    });
    
    checklists.push(checklist);
    saveDailyChecklists(checklists);
  }
  
  return checklist;
}

/**
 * Update checklist progress
 */
export function updateChecklistProgress() {
  const checklist = getTodaysChecklist();
  const tasks = getTasks().filter(t => checklist.tasks.includes(t.id));
  
  checklist.openingProgress = calculateCategoryProgress(tasks, TASK_CATEGORIES.OPENING);
  checklist.closingProgress = calculateCategoryProgress(tasks, TASK_CATEGORIES.CLOSING);
  checklist.overallProgress = calculateChecklistProgress(tasks);
  checklist.updatedAt = new Date().toISOString();
  
  const checklists = getDailyChecklists();
  const index = checklists.findIndex(c => c.id === checklist.id);
  if (index !== -1) {
    checklists[index] = checklist;
    saveDailyChecklists(checklists);
  }
  
  return checklist;
}

/**
 * Get today's task summary
 */
export function getTodaysTaskSummary() {
  const checklist = getTodaysChecklist();
  const tasks = getTasks().filter(t => checklist.tasks.includes(t.id));
  
  const summary = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.APPROVED).length,
    pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
    inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
    overdue: getOverdueTasks(tasks).length,
    critical: getCriticalTasks(tasks).length,
    awaitingApproval: tasks.filter(t => t.status === TASK_STATUS.AWAITING_APPROVAL).length,
    openingProgress: calculateCategoryProgress(tasks, TASK_CATEGORIES.OPENING),
    closingProgress: calculateCategoryProgress(tasks, TASK_CATEGORIES.CLOSING),
    overallProgress: calculateChecklistProgress(tasks)
  };
  
  return summary;
}

/**
 * Get tasks by category
 */
export function getTasksByCategory(category) {
  const tasks = getTasks();
  return tasks.filter(t => t.category === category);
}

/**
 * Get tasks by assignee
 */
export function getTasksByAssignee(assigneeId) {
  const tasks = getTasks();
  return tasks.filter(t => t.assignedTo === assigneeId);
}

/**
 * Get tasks by status
 */
export function getTasksByStatus(status) {
  const tasks = getTasks();
  return tasks.filter(t => t.status === status);
}

/**
 * Search tasks
 */
export function searchTasks(query) {
  const tasks = getTasks();
  const lowerQuery = query.toLowerCase();
  
  return tasks.filter(t =>
    t.title?.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery) ||
    t.category?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get default opening tasks
 */
export function getDefaultOpeningTasks() {
  return [
    { title: 'Unlock Store', category: TASK_CATEGORIES.OPENING, priority: TASK_PRIORITY.CRITICAL, dueTime: '08:00' },
    { title: 'Switch Lights On', category: TASK_CATEGORIES.OPENING, priority: TASK_PRIORITY.HIGH, dueTime: '08:05' },
    { title: 'Start POS', category: TASK_CATEGORIES.OPENING, priority: TASK_PRIORITY.CRITICAL, dueTime: '08:10' },
    { title: 'Count Float', category: TASK_CATEGORIES.OPENING, priority: TASK_PRIORITY.CRITICAL, dueTime: '08:15', requiresApproval: true },
    { title: 'Turn On Espresso Machine', category: TASK_CATEGORIES.COFFEE_MACHINE, priority: TASK_PRIORITY.HIGH, dueTime: '08:20' },
    { title: 'Prepare Grinder', category: TASK_CATEGORIES.COFFEE_MACHINE, priority: TASK_PRIORITY.HIGH, dueTime: '08:25' },
    { title: 'Prepare Milk', category: TASK_CATEGORIES.COFFEE_MACHINE, priority: TASK_PRIORITY.NORMAL, dueTime: '08:30' },
    { title: 'Check Inventory', category: TASK_CATEGORIES.INVENTORY, priority: TASK_PRIORITY.HIGH, dueTime: '08:35' },
    { title: 'Open Kitchen', category: TASK_CATEGORIES.KITCHEN, priority: TASK_PRIORITY.HIGH, dueTime: '08:40' },
    { title: 'Check Fridge Temperature', category: TASK_CATEGORIES.MAINTENANCE, priority: TASK_PRIORITY.NORMAL, dueTime: '08:45' },
    { title: 'Print Opening Report', category: TASK_CATEGORIES.OPENING, priority: TASK_PRIORITY.NORMAL, dueTime: '08:50' }
  ];
}

/**
 * Get default closing tasks
 */
export function getDefaultClosingTasks() {
  return [
    { title: 'Cash Count', category: TASK_CATEGORIES.CLOSING, priority: TASK_PRIORITY.CRITICAL, dueTime: '22:00', requiresApproval: true },
    { title: 'Kitchen Clean', category: TASK_CATEGORIES.CLEANING, priority: TASK_PRIORITY.HIGH, dueTime: '22:15' },
    { title: 'Tables Clean', category: TASK_CATEGORIES.CLEANING, priority: TASK_PRIORITY.HIGH, dueTime: '22:30' },
    { title: 'Equipment Off', category: TASK_CATEGORIES.MAINTENANCE, priority: TASK_PRIORITY.NORMAL, dueTime: '22:45' },
    { title: 'Lock Inventory', category: TASK_CATEGORIES.INVENTORY, priority: TASK_PRIORITY.HIGH, dueTime: '22:50' },
    { title: 'Shift Closed', category: TASK_CATEGORIES.CLOSING, priority: TASK_PRIORITY.CRITICAL, dueTime: '22:55' },
    { title: 'Backup Completed', category: TASK_CATEGORIES.CLOSING, priority: TASK_PRIORITY.CRITICAL, dueTime: '23:00' },
    { title: 'Doors Locked', category: TASK_CATEGORIES.CLOSING, priority: TASK_PRIORITY.CRITICAL, dueTime: '23:05' },
    { title: 'Alarm Enabled', category: TASK_CATEGORIES.CLOSING, priority: TASK_PRIORITY.CRITICAL, dueTime: '23:10' }
  ];
}

/**
 * Initialize default tasks
 */
export function initializeDefaultTasks() {
  getTasks();
  const templates = getTaskTemplates();
  
  if (templates.length === 0) {
    // Create default recurring templates
    const openingTemplate = createRecurringTemplate({
      title: 'Daily Opening Checklist',
      description: 'Standard opening procedures',
      category: TASK_CATEGORIES.OPENING,
      priority: TASK_PRIORITY.HIGH,
      recurrencePattern: 'DAILY',
      recurrenceDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      dueTime: '08:00'
    });
    
    const closingTemplate = createRecurringTemplate({
      title: 'Daily Closing Checklist',
      description: 'Standard closing procedures',
      category: TASK_CATEGORIES.CLOSING,
      priority: TASK_PRIORITY.HIGH,
      recurrencePattern: 'DAILY',
      recurrenceDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      dueTime: '22:00'
    });
    
    return { openingTemplate, closingTemplate };
  }
  
  return null;
}

/**
 * Get task history
 */
export function getTaskHistory(days = 30) {
  const completions = getTaskCompletions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return completions.filter(c => new Date(c.completedAt) >= cutoffDate);
}

/**
 * Get completion statistics
 */
export function getCompletionStatistics(days = 7) {
  const history = getTaskHistory(days);
  const tasks = getTasks();
  
  const stats = {
    totalCompletions: history.length,
    approvedCompletions: history.filter(c => c.status === 'APPROVED').length,
    rejectedCompletions: history.filter(c => c.status === 'REJECTED').length,
    pendingApprovals: history.filter(c => c.status === 'COMPLETED').length,
    byCategory: {},
    byStaff: {}
  };
  
  history.forEach(completion => {
    const task = tasks.find(t => t.id === completion.taskId);
    if (task) {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
      stats.byStaff[completion.completedBy] = (stats.byStaff[completion.completedBy] || 0) + 1;
    }
  });
  
  return stats;
}

export default {
  getTasks,
  getTaskTemplates,
  getDailyChecklists,
  getTaskCompletions,
  createNewTask,
  updateTask,
  deleteTask,
  completeTask,
  approveTask,
  rejectTask,
  createRecurringTemplate,
  generateDailyTasks,
  getTodaysChecklist,
  updateChecklistProgress,
  getTodaysTaskSummary,
  getTasksByCategory,
  getTasksByAssignee,
  getTasksByStatus,
  searchTasks,
  getDefaultOpeningTasks,
  getDefaultClosingTasks,
  initializeDefaultTasks,
  getTaskHistory,
  getCompletionStatistics
};
