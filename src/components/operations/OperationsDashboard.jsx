import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { getTodaysTaskSummary, getTodaysChecklist, getTasks, initializeDefaultTasks, completeTask } from "../../utils/operationsManager.js";
import { TASK_CATEGORIES, getTaskCategoryIcon, getTaskCategoryColor, getTaskPriorityColor } from "../../domain/operationsModel.js";

// Import operations components
import RecurringTasks from "./RecurringTasks.jsx";
import TaskAssignment from "./TaskAssignment.jsx";
import TaskApprovals from "./TaskApprovals.jsx";
import TaskSearch from "./TaskSearch.jsx";
import OperationsReports from "./OperationsReports.jsx";
import TaskHistory from "./TaskHistory.jsx";

function OperationsDashboard({ tables, orders, staff, kdsCards }) {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    loadData();
    initializeDefaultTasks();
  }, []);

  const loadData = useCallback(() => {
    setSummary(getTodaysTaskSummary());
    const checklist = getTodaysChecklist();
    const allTasks = getTasks().filter(t => checklist.tasks.includes(t.id));
    setTasks(allTasks);
  }, []);

  const tabs = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '📊' },
    { id: 'OPENING', label: 'Opening', icon: '🌅' },
    { id: 'KITCHEN', label: 'Kitchen', icon: '👨‍🍳' },
    { id: 'CLEANING', label: 'Cleaning', icon: '🧹' },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
    { id: 'CLOSING', label: 'Closing', icon: '🌙' },
    { id: 'ALL_TASKS', label: 'All Tasks', icon: '📋' },
    { id: 'APPROVALS', label: 'Approvals', icon: '✅' },
    { id: 'RECURRING', label: 'Recurring', icon: '🔄' },
    { id: 'ASSIGNMENT', label: 'Assignment', icon: '👥' },
    { id: 'SEARCH', label: 'Search', icon: '🔍' },
    { id: 'HISTORY', label: 'History', icon: '📜' },
    { id: 'REPORTS', label: 'Reports', icon: '📈' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--cafe-bg-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'var(--cafe-bg-surface)', borderBottom: '1px solid var(--cafe-border-light)' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Operations Center</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>Daily tasks and operational checklists</div>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: isMobile ? '60px' : '200px', background: 'var(--cafe-bg-surface)', borderRight: '1px solid var(--cafe-border-light)', overflowY: 'auto', padding: isMobile ? '12px 8px' : '16px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0' : '12px', padding: isMobile ? '12px' : '12px 16px', fontSize: '14px', fontWeight: '600', background: activeTab === tab.id ? 'var(--cafe-primary)' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--cafe-text-primary)', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer', justifyContent: isMobile ? 'center' : 'flex-start', width: '100%', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {!isMobile && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'DASHBOARD' && <DashboardPanel summary={summary} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'OPENING' && <CategoryPanel category={TASK_CATEGORIES.OPENING} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'KITCHEN' && <CategoryPanel category={TASK_CATEGORIES.KITCHEN} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'CLEANING' && <CategoryPanel category={TASK_CATEGORIES.CLEANING} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'MAINTENANCE' && <CategoryPanel category={TASK_CATEGORIES.MAINTENANCE} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'CLOSING' && <CategoryPanel category={TASK_CATEGORIES.CLOSING} tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'ALL_TASKS' && <AllTasksPanel tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'APPROVALS' && <TaskApprovals tasks={tasks} onRefresh={loadData} />}
          {activeTab === 'HISTORY' && <TaskHistory />}
          {activeTab === 'REPORTS' && <OperationsReports />}
          {activeTab === 'RECURRING' && <RecurringTasks />}
          {activeTab === 'ASSIGNMENT' && <TaskAssignment />}
          {activeTab === 'SEARCH' && <TaskSearch />}
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({ summary, tasks, onRefresh }) {
  if (!summary) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
        Loading dashboard...
      </div>
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Today's Progress</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
        <MetricCard label="Total Tasks" value={summary.total} color="#3498db" />
        <MetricCard label="Completed" value={summary.completed} color="#27ae60" />
        <MetricCard label="Remaining" value={summary.pending} color="#f39c12" />
        <MetricCard label="Critical" value={summary.critical} color="#e74c3c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        <ProgressCard label="Opening Progress" progress={summary.openingProgress} color="#27ae60" />
        <ProgressCard label="Closing Progress" progress={summary.closingProgress} color="#2c3e50" />
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Overall Progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--cafe-bg-elevated)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#3498db" strokeWidth="10" strokeDasharray={`${summary.overallProgress * 3.14} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>
              {summary.overallProgress}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>
              {summary.completed} of {summary.total} tasks completed
            </div>
            <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
              {summary.pending} tasks remaining
            </div>
          </div>
        </div>
      </div>

      {summary.critical > 0 && (
        <div style={{ background: '#fee', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #e74c3c' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#e74c3c', marginBottom: '16px' }}>
            🔴 {summary.critical} Critical Task(s) Pending
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETED' && t.status !== 'APPROVED').slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} onComplete={onRefresh} />
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Upcoming Tasks</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.filter(t => t.status === 'PENDING').slice(0, 5).map(task => (
            <TaskCard key={task.id} task={task} onComplete={onRefresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryPanel({ category, tasks, onRefresh }) {
  const categoryTasks = tasks.filter(t => t.category === category);
  const icon = getTaskCategoryIcon(category);
  const color = getTaskCategoryColor(category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '32px' }}>{icon}</span>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{category.replace('_', ' ')}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{categoryTasks.length} tasks</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categoryTasks.length > 0 ? (
          categoryTasks.map(task => (
            <TaskCard key={task.id} task={task} onComplete={onRefresh} />
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)' }}>
            No tasks in this category
          </div>
        )}
      </div>
    </div>
  );
}

function AllTasksPanel({ tasks, onRefresh }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>All Tasks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onComplete={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: `1px solid ${color}` }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color }}>{value}</div>
    </div>
  );
}

function ProgressCard({ label, progress, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color }}>{progress}%</div>
      <div style={{ height: '8px', background: 'var(--cafe-bg-elevated)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function TaskCard({ task, onComplete }) {
  const handleComplete = () => {
    completeTask(task.id, 'current-user');
    onComplete();
  };

  const priorityColor = getTaskPriorityColor(task.priority);
  const isCompleted = task.status === 'COMPLETED' || task.status === 'APPROVED';
  const isAwaitingApproval = task.status === 'AWAITING_APPROVAL';

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '16px', border: isCompleted ? '1px solid #27ae60' : isAwaitingApproval ? '2px solid #f39c12' : '1px solid var(--cafe-border-light)', opacity: isCompleted ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '4px' }}>{task.title}</div>
          {task.description && <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{task.description}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '4px 8px', background: `${priorityColor}20`, color: priorityColor, borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
            {task.priority}
          </div>
          {isAwaitingApproval && (
            <div style={{ padding: '4px 8px', background: '#f39c1220', color: '#f39c12', borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
              AWAITING APPROVAL
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
          {task.dueTime && `Due: ${new Date(task.dueTime).toLocaleTimeString()}`}
          {task.estimatedTime && ` • Est: ${task.estimatedTime}min`}
        </div>
        {!isCompleted && !isAwaitingApproval && (
          <button onClick={handleComplete} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: '#27ae60', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
            Complete
          </button>
        )}
        {isCompleted && (
          <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>✓ Completed</div>
        )}
      </div>
    </div>
  );
}

export default OperationsDashboard;
