import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { getTaskTemplates, createRecurringTemplate, generateDailyTasks } from "../../utils/operationsManager.js";
import { RECURRENCE_PATTERNS, DAYS_OF_WEEK, TASK_CATEGORIES } from "../../domain/operationsModel.js";

function RecurringTasks() {
  const [templates, setTemplates] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(() => {
    setTemplates(getTaskTemplates());
  }, []);

  const handleCreateTemplate = (templateData) => {
    createRecurringTemplate(templateData);
    loadTemplates();
    setShowCreateForm(false);
  };

  const handleGenerateTasks = () => {
    generateDailyTasks();
    alert('Tasks generated for today');
  };

  const handleToggleActive = (templateId) => {
    const updated = templates.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    );
    setTemplates(updated);
    localStorage.setItem('cafeos_operations_templates', JSON.stringify(updated));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Recurring Tasks</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleGenerateTasks} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Generate Today's Tasks
          </button>
          <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            + New Template
          </button>
        </div>
      </div>

      {showCreateForm && <CreateTemplateForm onSubmit={handleCreateTemplate} onCancel={() => setShowCreateForm(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {templates.length > 0 ? (
          templates.map(template => (
            <TemplateCard key={template.id} template={template} onToggleActive={handleToggleActive} />
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)' }}>
            No recurring task templates configured
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template, onToggleActive }) {
  const { getTaskCategoryIcon, getTaskCategoryColor } = require("../../domain/operationsModel.js");

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: template.isActive ? '1px solid #27ae60' : '1px solid var(--cafe-border-light)', opacity: template.isActive ? 1 : 0.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{getTaskCategoryIcon(template.category)}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{template.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginTop: '4px' }}>{template.description}</div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginTop: '8px' }}>
              {template.recurrencePattern} • {template.recurrenceDays.join(', ')}
            </div>
          </div>
        </div>
        <button onClick={() => onToggleActive(template.id)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: template.isActive ? '#27ae60' : 'var(--cafe-bg-elevated)', color: template.isActive ? 'white' : 'var(--cafe-text-primary)', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
          {template.isActive ? 'Active' : 'Inactive'}
        </button>
      </div>
    </div>
  );
}

function CreateTemplateForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: TASK_CATEGORIES.CUSTOM,
    priority: 'NORMAL',
    recurrencePattern: RECURRENCE_PATTERNS.DAILY,
    recurrenceDays: [DAYS_OF_WEEK.MONDAY, DAYS_OF_WEEK.TUESDAY, DAYS_OF_WEEK.WEDNESDAY, DAYS_OF_WEEK.THURSDAY, DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY],
    dueTime: '09:00',
    estimatedTime: 15,
    requiresApproval: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day]
    }));
  };

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Create Recurring Task Template</div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Category</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }}>
              {Object.values(TASK_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Recurrence</label>
            <select value={formData.recurrencePattern} onChange={(e) => setFormData({...formData, recurrencePattern: e.target.value})} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }}>
              {Object.values(RECURRENCE_PATTERNS).map(pattern => <option key={pattern} value={pattern}>{pattern.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Due Time</label>
            <input type="time" value={formData.dueTime} onChange={(e) => setFormData({...formData, dueTime: e.target.value})} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '4px', display: 'block' }}>Est. Time (min)</label>
            <input type="number" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)' }} />
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px', display: 'block' }}>Days</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.values(DAYS_OF_WEEK).map(day => (
              <button key={day} type="button" onClick={() => handleDayToggle(day)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: formData.recurrenceDays.includes(day) ? 'var(--cafe-primary)' : 'var(--cafe-bg-elevated)', color: formData.recurrenceDays.includes(day) ? 'white' : 'var(--cafe-text-primary)', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--cafe-text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.requiresApproval} onChange={(e) => setFormData({...formData, requiresApproval: e.target.checked})} />
            Requires Manager Approval
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Create Template
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecurringTasks;
