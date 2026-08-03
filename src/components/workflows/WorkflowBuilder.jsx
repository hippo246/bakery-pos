import React from 'react';
import { useState } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { 
  WORKFLOW_CATEGORIES, 
  WORKFLOW_DEPARTMENTS, 
  WORKFLOW_PRIORITY, 
  WORKFLOW_STATUS, 
  REPEAT_SCHEDULE, 
  TASK_TYPES,
  TASK_DEPENDENCY_TYPE,
  APPROVAL_LEVEL,
  ESCALATION_TRIGGER,
  CONDITION_OPERATOR,
  LOGICAL_OPERATOR,
  createTaskDefinition, 
  normalizeWorkflowDefinition 
} from "../../domain/workflowModel";

function WorkflowBuilder({ workflow, onSave, onCancel }) {
  const [formData, setFormData] = useState(normalizeWorkflowDefinition(workflow) || { 
    name: '', 
    category: WORKFLOW_CATEGORIES.CUSTOM, 
    description: '', 
    department: WORKFLOW_DEPARTMENTS.ALL, 
    estimatedDuration: 30, 
    priority: WORKFLOW_PRIORITY.MEDIUM, 
    icon: '📋', 
    color: '#6366f1', 
    tags: [], 
    repeatSchedule: REPEAT_SCHEDULE.NONE, 
    status: WORKFLOW_STATUS.DRAFT, 
    tasks: [],
    // Phase 2 fields
    targetDuration: 30,
    warningThreshold: 25,
    criticalThreshold: 35,
    requiresApproval: false,
    approvalLevel: APPROVAL_LEVEL.SUPERVISOR,
    escalationRules: [],
    conditionalRules: [],
    isDynamic: false,
    dynamicTaskConfig: null
  });

  const handleSave = () => onSave(formData);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>{formData.id ? 'Edit' : 'Create'} Workflow</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{ ...btn("ghost"), padding: "10px 20px" }}>Cancel</button>
          <button onClick={handleSave} style={{ ...btn("primary"), padding: "10px 20px" }}>Save</button>
        </div>
      </div>

      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} style={{ ...input, width: "100%" }} />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Category</label>
          <select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} style={{ ...input, width: "100%" }}>
            {Object.entries(WORKFLOW_CATEGORIES).map(([k, v]) => <option key={k} value={v}>{k}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Description</label>
          <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} style={{ ...input, width: "100%", minHeight: "80px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={label}>Duration (min)</label>
            <input type="number" value={formData.estimatedDuration} onChange={e => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))} style={{ ...input, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Priority</label>
            <select value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))} style={{ ...input, width: "100%" }}>
              {Object.entries(WORKFLOW_PRIORITY).map(([k, v]) => <option key={k} value={v}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Phase 2: SLA Settings */}
      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>SLA Settings</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={label}>Target Duration (min)</label>
            <input type="number" value={formData.targetDuration} onChange={e => setFormData(prev => ({ ...prev, targetDuration: parseInt(e.target.value) || 0 }))} style={{ ...input, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Warning Threshold (min)</label>
            <input type="number" value={formData.warningThreshold} onChange={e => setFormData(prev => ({ ...prev, warningThreshold: parseInt(e.target.value) || 0 }))} style={{ ...input, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Critical Threshold (min)</label>
            <input type="number" value={formData.criticalThreshold} onChange={e => setFormData(prev => ({ ...prev, criticalThreshold: parseInt(e.target.value) || 0 }))} style={{ ...input, width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Phase 2: Approval Settings */}
      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Approval Settings</h2>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={formData.requiresApproval} onChange={e => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))} />
            <span style={{ fontSize: "14px" }}>Requires Approval</span>
          </label>
        </div>
        {formData.requiresApproval && (
          <div>
            <label style={label}>Approval Level</label>
            <select value={formData.approvalLevel} onChange={e => setFormData(prev => ({ ...prev, approvalLevel: e.target.value }))} style={{ ...input, width: "100%" }}>
              {Object.entries(APPROVAL_LEVEL).map(([k, v]) => <option key={k} value={v}>{k}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Phase 2: Escalation Rules */}
      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Escalation Rules ({formData.escalationRules.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {formData.escalationRules.map((rule, i) => (
            <div key={i} style={{ padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.bg2 }}>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{rule.trigger}</div>
              <div style={{ fontSize: "12px", color: C.text3 }}>After {rule.escalationAfterMinutes} min → {rule.escalateTo}</div>
            </div>
          ))}
          {formData.escalationRules.length === 0 && <div style={{ fontSize: "14px", color: C.text3, textAlign: "center", padding: "20px" }}>No escalation rules</div>}
          <button onClick={() => setFormData(prev => ({ ...prev, escalationRules: [...prev.escalationRules, { trigger: ESCALATION_TRIGGER.TASK_OVERDUE, escalationAfterMinutes: 30, escalateTo: 'manager' }] }))} style={{ ...btn("ghost"), padding: "8px 16px", fontSize: "13px" }}>
            + Add Escalation Rule
          </button>
        </div>
      </div>

      {/* Phase 2: Conditional Rules */}
      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Conditional Logic ({formData.conditionalRules.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {formData.conditionalRules.map((rule, i) => (
            <div key={i} style={{ padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.bg2 }}>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{rule.logicalOperator}</div>
              <div style={{ fontSize: "12px", color: C.text3 }}>{rule.conditions?.length || 0} conditions</div>
            </div>
          ))}
          {formData.conditionalRules.length === 0 && <div style={{ fontSize: "14px", color: C.text3, textAlign: "center", padding: "20px" }}>No conditional rules</div>}
          <button onClick={() => setFormData(prev => ({ ...prev, conditionalRules: [...prev.conditionalRules, { logicalOperator: LOGICAL_OPERATOR.AND, conditions: [] }] }))} style={{ ...btn("ghost"), padding: "8px 16px", fontSize: "13px" }}>
            + Add Conditional Rule
          </button>
        </div>
      </div>

      {/* Phase 2: Dynamic Tasks */}
      <div style={{ ...card, padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Dynamic Tasks</h2>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={formData.isDynamic} onChange={e => setFormData(prev => ({ ...prev, isDynamic: e.target.checked }))} />
            <span style={{ fontSize: "14px" }}>Enable Dynamic Task Generation</span>
          </label>
        </div>
        {formData.isDynamic && (
          <div style={{ fontSize: "13px", color: C.text3 }}>
            Tasks will be generated dynamically from CafeOS data (inventory, tables, staff, etc.)
          </div>
        )}
      </div>

      {/* Tasks */}
      <div style={{ ...card, padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Tasks ({formData.tasks.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {formData.tasks.map((task, i) => (
            <div key={task.id} style={{ padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", background: C.bg2 }}>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{i + 1}. {task.name}</div>
              <div style={{ fontSize: "12px", color: C.text3 }}>{task.type}</div>
              {task.dependencyType && <div style={{ ...pill, padding: "2px 6px", fontSize: "10px", marginTop: "4px", display: "inline-block" }}>{task.dependencyType}</div>}
              {task.requiresApproval && <div style={{ ...pill, padding: "2px 6px", fontSize: "10px", marginTop: "4px", display: "inline-block", marginLeft: "4px" }}>Requires Approval</div>}
            </div>
          ))}
          {formData.tasks.length === 0 && <div style={{ fontSize: "14px", color: C.text3, textAlign: "center", padding: "20px" }}>No tasks yet</div>}
          <button onClick={() => setFormData(prev => ({ ...prev, tasks: [...prev.tasks, createTaskDefinition({ name: 'New Task', type: TASK_TYPES.CHECKLIST })] }))} style={{ ...btn("ghost"), padding: "8px 16px", fontSize: "13px" }}>
            + Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;
