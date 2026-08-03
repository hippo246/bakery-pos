import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { getTaskHistory, getTasks } from "../../utils/operationsManager.js";

function TaskHistory() {
  const [history, setHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState('7');
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    loadHistory();
  }, [dateFilter]);

  const loadHistory = useCallback(() => {
    const days = parseInt(dateFilter);
    setHistory(getTaskHistory(days));
  }, [dateFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Task History</div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }}>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
        Showing {history.length} completion(s)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length > 0 ? (
          history.map(completion => (
            <HistoryEntry key={completion.id} completion={completion} />
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)' }}>
            No task history found
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryEntry({ completion }) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === completion.taskId);

  if (!task) return null;

  const statusColors = {
    'COMPLETED': '#27ae60',
    'APPROVED': '#3498db',
    'REJECTED': '#e74c3c'
  };

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '16px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '4px' }}>{task.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{task.category.replace('_', ' ')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '4px 8px', background: `${statusColors[completion.status]}20`, color: statusColors[completion.status], borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
            {completion.status}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>
        <div>Completed by: {completion.completedBy}</div>
        <div>{new Date(completion.completedAt).toLocaleString()}</div>
      </div>

      {completion.notes && (
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-primary)', marginBottom: '8px', padding: '8px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-sm)' }}>
          {completion.notes}
        </div>
      )}

      {completion.approvedBy && (
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
          Approved by: {completion.approvedBy} • {new Date(completion.approvedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default TaskHistory;
