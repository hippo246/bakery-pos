import React, { useState, useCallback } from 'react';
import { C, card, btn, pill } from '../../styles/theme';
import {
  AUTOMATION_TRIGGER,
  AUTOMATION_ACTION,
  createAutomationRule,
  normalizeAutomationRule
} from '../../domain/workflowModel';

function AutomationChains({
  automationRules = [],
  setAutomationRules = () => {},
  workflows = [],
  staff = []
}) {
  const [view, setView] = useState('list'); // 'list', 'builder', 'history'
  const [selectedRule, setSelectedRule] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const triggerOptions = Object.entries(AUTOMATION_TRIGGER).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const actionOptions = Object.entries(AUTOMATION_ACTION).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const handleCreateRule = useCallback(() => {
    const newRule = createAutomationRule({
      workflowId: workflows[0]?.id || '',
      trigger: AUTOMATION_TRIGGER.WORKFLOW_COMPLETED,
      actions: [],
      isActive: true
    });
    setSelectedRule(newRule);
    setView('builder');
  }, [workflows]);

  const handleEditRule = useCallback((rule) => {
    setSelectedRule(normalizeAutomationRule(rule));
    setView('builder');
  }, []);

  const handleSaveRule = useCallback((ruleData) => {
    setAutomationRules(prev => {
      const exists = prev.some(r => r.id === ruleData.id);
      return exists ? prev.map(r => (r.id === ruleData.id ? ruleData : r)) : [...prev, ruleData];
    });
    setSelectedRule(null);
    setView('list');
  }, [setAutomationRules]);

  const handleDeleteRule = useCallback((ruleId) => {
    setAutomationRules(prev => prev.filter(r => r.id !== ruleId));
  }, [setAutomationRules]);

  const handleToggleActive = useCallback((ruleId) => {
    setAutomationRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
  }, [setAutomationRules]);

  const handleCancelBuilder = useCallback(() => {
    setSelectedRule(null);
    setView('list');
  }, []);

  const filteredRules = automationRules.filter(rule => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return rule.isActive;
    if (filter === 'INACTIVE') return !rule.isActive;
    return true;
  });

  if (view === 'builder' && selectedRule) {
    return (
      <AutomationRuleBuilder
        rule={selectedRule}
        workflows={workflows}
        staff={staff}
        triggerOptions={triggerOptions}
        actionOptions={actionOptions}
        onSave={handleSaveRule}
        onCancel={handleCancelBuilder}
      />
    );
  }

  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: C.text }}>
          Automation Chains
        </h2>
        <button
          onClick={handleCreateRule}
          style={{
            ...btn.primary,
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + Create Automation Rule
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...btn.ghost,
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: filter === f ? C.primary : 'transparent',
              color: filter === f ? '#fff' : C.textSecondary,
              border: filter === f ? 'none' : `1px solid ${C.border}`
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredRules.length === 0 ? (
        <div style={{
          ...card.base,
          textAlign: 'center',
          padding: '60px 20px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: C.text }}>
            No Automation Rules
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: C.textSecondary }}>
            Create automation rules to trigger actions based on workflow events
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredRules.map(rule => {
            const workflow = workflows.find(w => w.id === rule.workflowId);
            return (
              <div
                key={rule.id}
                style={{
                  ...card.base,
                  padding: '20px',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${rule.isActive ? C.success : C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      ...pill.base,
                      backgroundColor: rule.isActive ? `${C.success}20` : `${C.border}40`,
                      color: rule.isActive ? C.success : C.textSecondary,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: C.text }}>
                      {workflow?.name || 'Unknown Workflow'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: C.textSecondary, marginBottom: '12px' }}>
                    <strong>Trigger:</strong> {triggerOptions.find(t => t.value === rule.trigger)?.label || rule.trigger}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: C.textSecondary }}>
                    <strong>Actions:</strong> {rule.actions?.length || 0} configured
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    style={{
                      ...btn.ghost,
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    title={rule.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {rule.isActive ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    style={{
                      ...btn.ghost,
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    title="Edit"
                  >
                    ✏
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{
                      ...btn.ghost,
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: C.error
                    }}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AutomationRuleBuilder({
  rule,
  workflows,
  staff,
  triggerOptions,
  actionOptions,
  onSave,
  onCancel
}) {
  const [formData, setFormData] = useState({
    ...rule,
    actions: rule.actions || []
  });
  const [newAction, setNewAction] = useState({
    type: AUTOMATION_ACTION.NOTIFY_MANAGER,
    params: {}
  });

  const handleAddAction = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { ...newAction, id: Date.now().toString() }]
    }));
    setNewAction({
      type: AUTOMATION_ACTION.NOTIFY_MANAGER,
      params: {}
    });
  }, [newAction]);

  const handleRemoveAction = useCallback((actionId) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }));
  }, []);

  const handleActionParamChange = useCallback((actionId, paramKey, value) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map(a => 
        a.id === actionId 
          ? { ...a, params: { ...a.params, [paramKey]: value } }
          : a
      )
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      ...formData,
      updatedAt: Date.now()
    });
  }, [formData, onSave]);

  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: C.text }}>
          {rule.id ? 'Edit Automation Rule' : 'Create Automation Rule'}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              ...btn.ghost,
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              ...btn.primary,
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Save Rule
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
        <div style={{ ...card.base, padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: C.text }}>
            Trigger Configuration
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: C.text, marginBottom: '8px' }}>
              Workflow
            </label>
            <select
              value={formData.workflowId}
              onChange={(e) => setFormData(prev => ({ ...prev, workflowId: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                fontSize: '14px',
                color: C.text,
                backgroundColor: C.bg
              }}
            >
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: C.text, marginBottom: '8px' }}>
              Trigger Event
            </label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                fontSize: '14px',
                color: C.text,
                backgroundColor: C.bg
              }}
            >
              {triggerOptions.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ ...card.base, padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: C.text }}>
            Actions
          </h3>

          {formData.actions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textSecondary, fontSize: '14px' }}>
              No actions configured yet
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {formData.actions.map((action, index) => (
                <div
                  key={action.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.bgHover
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: C.text }}>
                      {index + 1}. {actionOptions.find(a => a.value === action.type)?.label || action.type}
                    </span>
                    <button
                      onClick={() => handleRemoveAction(action.id)}
                      style={{
                        ...btn.ghost,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: C.error
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {action.type === AUTOMATION_ACTION.NOTIFY_MANAGER && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: C.textSecondary, marginBottom: '4px' }}>
                        Manager ID
                      </label>
                      <input
                        type="text"
                        value={action.params.managerId || ''}
                        onChange={(e) => handleActionParamChange(action.id, 'managerId', e.target.value)}
                        placeholder="Enter manager ID"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${C.border}`,
                          fontSize: '13px',
                          color: C.text,
                          backgroundColor: C.bg
                        }}
                      />
                    </div>
                  )}

                  {action.type === AUTOMATION_ACTION.START_WORKFLOW && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: C.textSecondary, marginBottom: '4px' }}>
                        Target Workflow ID
                      </label>
                      <select
                        value={action.params.targetWorkflowId || ''}
                        onChange={(e) => handleActionParamChange(action.id, 'targetWorkflowId', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${C.border}`,
                          fontSize: '13px',
                          color: C.text,
                          backgroundColor: C.bg
                        }}
                      >
                        <option value="">Select workflow...</option>
                        {workflows.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {action.type === AUTOMATION_ACTION.SEND_NOTIFICATION && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: C.textSecondary, marginBottom: '4px' }}>
                        Message
                      </label>
                      <input
                        type="text"
                        value={action.params.message || ''}
                        onChange={(e) => handleActionParamChange(action.id, 'message', e.target.value)}
                        placeholder="Enter notification message"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${C.border}`,
                          fontSize: '13px',
                          color: C.text,
                          backgroundColor: C.bg
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '16px', borderRadius: '8px', border: `1px dashed ${C.border}`, backgroundColor: C.bg }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: C.text, marginBottom: '8px' }}>
              Add New Action
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={newAction.type}
                onChange={(e) => setNewAction(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  fontSize: '14px',
                  color: C.text,
                  backgroundColor: C.bg
                }}
              >
                {actionOptions.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <button
                onClick={handleAddAction}
                style={{
                  ...btn.primary,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...card.base, padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: C.text }}>
                Active Status
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: C.textSecondary }}>
                Enable or disable this automation rule
              </p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: formData.isActive ? C.success : C.border,
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationChains;
