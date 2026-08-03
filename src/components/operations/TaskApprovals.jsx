import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { getTasks, approveTask, rejectTask } from "../../utils/operationsManager.js";
import { TASK_STATUS } from "../../domain/operationsModel.js";

function TaskApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = useCallback(() => {
    const tasks = getTasks();
    setPendingApprovals(tasks.filter(t => t.status === TASK_STATUS.AWAITING_APPROVAL));
  }, []);

  const handleApprove = (taskId) => {
    approveTask(taskId, 'current-manager');
    loadPendingApprovals();
    setSelectedTask(null);
  };

  const handleReject = (taskId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    rejectTask(taskId, 'current-manager', rejectionReason);
    loadPendingApprovals();
    setSelectedTask(null);
    setRejectionReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Task Approvals</div>

      {pendingApprovals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingApprovals.map(task => (
            <ApprovalCard key={task.id} task={task} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)' }}>
          No pending approvals
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ task, onApprove, onReject }) {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { getTaskPriorityColor } = require("../../domain/operationsModel.js");

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(task.id, rejectionReason);
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  const priorityColor = getTaskPriorityColor(task.priority);

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: '2px solid #f39c12' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{task.title}</div>
            <div style={{ padding: '4px 8px', background: `${priorityColor}20`, color: priorityColor, borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
              {task.priority}
            </div>
          </div>
          {task.description && <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{task.description}</div>}
          <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>
            Completed by: {task.completedBy} • {new Date(task.completedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {task.evidence && task.evidence.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>Evidence</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {task.evidence.map(ev => (
              <div key={ev.id} style={{ padding: '10px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{ev.type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--cafe-text-secondary)' }}>{new Date(ev.addedAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--cafe-text-primary)' }}>{ev.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRejectionForm ? (
        <div style={{ marginBottom: '12px' }}>
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="Reason for rejection..." style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleReject} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
              Confirm Rejection
            </button>
            <button onClick={() => { setShowRejectionForm(false); setRejectionReason(''); }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onApprove(task.id)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#27ae60', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            ✓ Approve
          </button>
          <button onClick={() => setShowRejectionForm(true)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskApprovals;
