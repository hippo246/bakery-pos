import React from 'react';
import { useState, useEffect, useCallback } from "react";
import AlertDialog from '../common/AlertDialog.jsx';
import { getTasks, approveTask, rejectTask } from "../../utils/operationsManager.js";
import { TASK_STATUS } from "../../domain/operationsModel.js";

function TaskApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
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
      setAlertDialog({ isOpen: true, title: 'Rejection Reason Required', message: 'Please provide a reason for rejection', type: 'error' });
      return;
    }
    rejectTask(taskId, 'current-manager', rejectionReason);
    loadPendingApprovals();
    setSelectedTask(null);
    setRejectionReason('');
  };

  return (
    <>
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

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </>
  );
}

function ApprovalCard({ task, onApprove, onReject }) {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const { getTaskPriorityColor } = require("../../domain/operationsModel.js");

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setAlertDialog({ isOpen: true, title: 'Rejection Reason Required', message: 'Please provide a reason for rejection', type: 'error' });
      return;
    }
    onReject(task.id, rejectionReason);
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  const priorityColor = getTaskPriorityColor(task.priority);

  return (
    <>
      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: `1px solid ${priorityColor}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{getTaskCategoryIcon(task.category)}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{task.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginTop: '4px' }}>{task.description}</div>
              <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginTop: '8px' }}>
                Due: {task.dueTime} • Priority: {task.priority}
              </div>
            </div>
          </div>
          <div style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '600', background: priorityColor, color: 'white', borderRadius: 'var(--cafe-radius-sm)' }}>
            {task.priority}
          </div>
        </div>

        {showRejectionForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{ width: '100%', minHeight: '80px', padding: '12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', outline: 'none', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </>
  );
}

export default TaskApprovals;
