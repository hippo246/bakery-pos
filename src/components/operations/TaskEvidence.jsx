import React from 'react';
import { useState, useCallback } from "react";
import { getTasks, updateTask } from "../../utils/operationsManager.js";

function TaskEvidence({ taskId, onClose }) {
  const [note, setNote] = useState('');
  const [evidenceType, setEvidenceType] = useState('NOTE');
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  const handleSubmit = useCallback(() => {
    if (!note.trim()) return;

    const evidence = {
      type: evidenceType,
      content: note,
      addedBy: 'current-user'
    };

    const updatedTask = {
      ...task,
      evidence: [...(task.evidence || []), {
        id: `EVIDENCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: evidenceType,
        content: note,
        addedBy: 'current-user',
        addedAt: new Date().toISOString()
      }],
      notes: task.notes ? `${task.notes}\n\n${note}` : note,
      updatedAt: new Date().toISOString()
    };

    updateTask(taskId, updatedTask);
    onClose();
  }, [taskId, note, evidenceType, task, onClose]);

  if (!task) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Add Evidence</div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '8px' }}>{task.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{task.description}</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Evidence Type</label>
          <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }}>
            <option value="NOTE">Note</option>
            <option value="PHOTO">Photo</option>
            <option value="COMMENT">Comment</option>
            <option value="VERIFICATION">Verification</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Content</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Add your evidence or notes here..." style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }} />
        </div>

        {task.evidence && task.evidence.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>Existing Evidence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {task.evidence.map(ev => (
                <div key={ev.id} style={{ padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
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

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Add Evidence
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskEvidence;
