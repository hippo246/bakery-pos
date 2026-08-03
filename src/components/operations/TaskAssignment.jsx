import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { getTasks, updateTask } from "../../utils/operationsManager.js";
import { STAFF_ROLES } from "../../domain/operationsModel.js";

function TaskAssignment() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = useCallback(() => {
    setTasks(getTasks().filter(t => t.status !== 'COMPLETED' && t.status !== 'APPROVED'));
  }, []);

  const handleAssign = (taskId, assignee) => {
    updateTask(taskId, { assignedTo: assignee.id, assignedRole: assignee.role });
    loadTasks();
    setSelectedTask(null);
  };

  const staffMembers = [
    { id: 'staff-1', name: 'John Doe', role: STAFF_ROLES.MANAGER },
    { id: 'staff-2', name: 'Jane Smith', role: STAFF_ROLES.BARISTA },
    { id: 'staff-3', name: 'Bob Johnson', role: STAFF_ROLES.KITCHEN },
    { id: 'staff-4', name: 'Alice Brown', role: STAFF_ROLES.CASHIER },
    { id: 'staff-5', name: 'Charlie Wilson', role: STAFF_ROLES.CLEANING_STAFF }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Task Assignment</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Unassigned Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.filter(t => !t.assignedTo).map(task => (
              <div key={task.id} onClick={() => setSelectedTask(task)} style={{ padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer', border: selectedTask?.id === task.id ? '2px solid var(--cafe-primary)' : '1px solid transparent' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{task.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{task.category.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Staff Members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staffMembers.map(staff => (
              <div key={staff.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{staff.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{staff.role.replace('_', ' ')}</div>
                </div>
                {selectedTask && (
                  <button onClick={() => handleAssign(selectedTask.id, staff)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
                    Assign
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTask && (
        <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '12px' }}>Selected Task</div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-primary)', marginBottom: '4px' }}>{selectedTask.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{selectedTask.description}</div>
        </div>
      )}
    </div>
  );
}

export default TaskAssignment;
