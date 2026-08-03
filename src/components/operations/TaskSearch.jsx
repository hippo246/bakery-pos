import React from 'react';
import { useState, useCallback, useEffect } from "react";
import { getTasks, searchTasks, getTasksByCategory, getTasksByStatus, getTasksByAssignee } from "../../utils/operationsManager.js";
import { TASK_CATEGORIES, TASK_STATUS, TASK_PRIORITY } from "../../domain/operationsModel.js";

function TaskSearch() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [results, setResults] = useState([]);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const handleSearch = useCallback(() => {
    let tasks = getTasks();

    if (query.trim()) {
      tasks = searchTasks(query);
    }

    if (categoryFilter !== 'ALL') {
      tasks = tasks.filter(t => t.category === categoryFilter);
    }

    if (statusFilter !== 'ALL') {
      tasks = tasks.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      tasks = tasks.filter(t => t.priority === priorityFilter);
    }

    setResults(tasks);
  }, [query, categoryFilter, statusFilter, priorityFilter]);

  const handleReset = () => {
    setQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setResults(getTasks());
  };

  useEffect(() => {
    setResults(getTasks());
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Task Search</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          style={{ padding: '10px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)' }}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)' }}>
          <option value="ALL">All Categories</option>
          {Object.values(TASK_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)' }}>
          <option value="ALL">All Status</option>
          {Object.values(TASK_STATUS).map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '10px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)' }}>
          <option value="ALL">All Priorities</option>
          {Object.values(TASK_PRIORITY).map(priority => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSearch} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
          Search
        </button>
        <button onClick={handleReset} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
          Reset
        </button>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
        Found {results.length} task(s)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map(task => (
          <TaskResultCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskResultCard({ task }) {
  const { getTaskCategoryIcon, getTaskPriorityColor } = require("../../domain/operationsModel.js");

  const priorityColor = getTaskPriorityColor(task.priority);
  const isCompleted = task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.APPROVED;

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '16px', border: '1px solid var(--cafe-border-light)', opacity: isCompleted ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getTaskCategoryIcon(task.category)}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{task.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{task.category.replace('_', ' ')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '4px 8px', background: `${priorityColor}20`, color: priorityColor, borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
            {task.priority}
          </div>
          <div style={{ padding: '4px 8px', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-secondary)', borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
            {task.status.replace('_', ' ')}
          </div>
        </div>
      </div>
      {task.description && <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{task.description}</div>}
      <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
        {task.dueTime && `Due: ${new Date(task.dueTime).toLocaleString()}`}
        {task.assignedTo && ` • Assigned: ${task.assignedTo}`}
      </div>
    </div>
  );
}

export default TaskSearch;
