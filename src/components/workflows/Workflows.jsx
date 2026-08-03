import React from 'react';
import { useState, useCallback } from "react";
import { C, card, btn, pill } from "../../styles/theme";
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_STATUS,
  EXECUTION_STATUS,
  TEMPLATE_SCOPE,
  INCIDENT_STATUS,
  APPROVAL_STATUS,
  createWorkflowDefinition,
  createWorkflowExecution,
  normalizeWorkflowDefinition,
  normalizeWorkflowExecution
} from "../../domain/workflowModel";
import WorkflowBuilder from "./WorkflowBuilder.jsx";
import WorkflowExecutor from "./WorkflowExecutor.jsx";
import WorkflowReports from "./WorkflowReports.jsx";

function Workflows({ 
  workflows = [], 
  setWorkflows = () => {},
  executions = [], 
  setExecutions = () => {},
  templates = [],
  setTemplates = () => {},
  versions = [],
  setVersions = () => {},
  incidents = [],
  setIncidents = () => {},
  approvals = [],
  setApprovals = () => {},
  timelineEvents = [],
  setTimelineEvents = () => {},
  automationRules = [],
  setAutomationRules = () => {},
  staff = [],
  tables = [],
  equipment = [],
  inventory = [],
  suppliers = []
}) {
  const [view, setView] = useState('list'); // 'list', 'builder', 'executor', 'history', 'templates', 'versions', 'incidents', 'approvals', 'timeline', 'automation'
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const handleCreateWorkflow = useCallback(() => {
    const newWorkflow = createWorkflowDefinition({
      name: 'New Workflow',
      status: WORKFLOW_STATUS.DRAFT,
      createdBy: 'current-user'
    });
    setSelectedWorkflow(newWorkflow);
    setView('builder');
  }, []);

  const handleEditWorkflow = useCallback((workflow) => {
    setSelectedWorkflow(normalizeWorkflowDefinition(workflow));
    setView('builder');
  }, []);

  const handleExecuteWorkflow = useCallback((workflow) => {
    const newExecution = createWorkflowExecution({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: workflow.version,
      assignedTo: 'current-user',
      assignedBy: 'current-user'
    });
    setSelectedExecution(newExecution);
    setSelectedWorkflow(workflow);
    setView('executor');
  }, []);

  const handleViewHistory = useCallback((workflow) => {
    setSelectedWorkflow(workflow);
    setView('history');
  }, []);

  const handleSaveWorkflow = useCallback((workflowData) => {
    setWorkflows(prev => {
      const exists = prev.some(w => w.id === workflowData.id);
      return exists ? prev.map(w => (w.id === workflowData.id ? workflowData : w)) : [...prev, workflowData];
    });
    setSelectedWorkflow(null);
    setView('list');
  }, [setWorkflows]);

  const handleCancelBuilder = useCallback(() => {
    setSelectedWorkflow(null);
    setView('list');
  }, []);

  const handleUpdateExecution = useCallback((executionData) => {
    setExecutions(prev => {
      const exists = prev.some(e => e.id === executionData.id);
      return exists ? prev.map(e => (e.id === executionData.id ? executionData : e)) : [...prev, executionData];
    });
    setSelectedExecution(executionData);
  }, [setExecutions]);

  const handleCancelExecution = useCallback(() => {
    setSelectedExecution(null);
    setSelectedWorkflow(null);
    setView('list');
  }, []);

  const handleOpenExecution = useCallback((exec) => {
    const relatedWorkflow = workflows.find(w => w.id === exec.workflowId);
    if (!relatedWorkflow) return;
    setSelectedExecution(normalizeWorkflowExecution(exec));
    setSelectedWorkflow(relatedWorkflow);
  }, [workflows]);

  const filteredWorkflows = workflows.filter(w => {
    if (filter !== 'ALL' && w.category !== filter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeExecutions = executions.filter(e => 
    e.status === EXECUTION_STATUS.IN_PROGRESS || e.status === EXECUTION_STATUS.PAUSED
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>
            Workflows
          </h1>
          <p style={{ fontSize: "14px", color: C.text3 }}>
            Create, assign, and track operational workflows and checklists
          </p>
        </div>
        <button
          onClick={handleCreateWorkflow}
          style={{ ...btn("primary"), padding: "12px 24px", fontSize: "14px", fontWeight: 600 }}
        >
          + New Workflow
        </button>
      </div>

      {/* Active Executions Banner */}
      {activeExecutions.length > 0 && (
        <div style={{ ...card, background: C.bg3, border: `1px solid ${C.amber3}`, marginBottom: "24px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "24px" }}>⏳</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: C.amber }}>
                {activeExecutions.length} Active Workflow{activeExecutions.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: "12px", color: C.text3 }}>
                In progress or paused
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {activeExecutions.slice(0, 3).map(exec => (
              <div key={exec.id} style={{ ...pill, background: C.bg, padding: "8px 12px", fontSize: "12px" }}>
                {exec.workflowName}
              </div>
            ))}
            {activeExecutions.length > 3 && (
              <div style={{ ...pill, background: C.bg, padding: "8px 12px", fontSize: "12px" }}>
                +{activeExecutions.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            minWidth: "280px",
            background: C.bg2,
            color: C.text
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "10px 16px",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            background: C.bg2,
            color: C.text
          }}
        >
          <option value="ALL">All Categories</option>
          {Object.entries(WORKFLOW_CATEGORIES).map(([key, value]) => (
            <option key={key} value={value}>{key}</option>
          ))}
        </select>
      </div>

      {/* Phase 2 Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: `1px solid ${C.border}`, paddingBottom: "12px" }}>
        <button
          onClick={() => setView('list')}
          style={{
            ...btn(view === 'list' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'list' ? C.primary : 'transparent',
            color: view === 'list' ? '#fff' : C.text2
          }}
        >
          Workflows
        </button>
        <button
          onClick={() => setView('templates')}
          style={{
            ...btn(view === 'templates' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'templates' ? C.primary : 'transparent',
            color: view === 'templates' ? '#fff' : C.text2
          }}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setView('versions')}
          style={{
            ...btn(view === 'versions' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'versions' ? C.primary : 'transparent',
            color: view === 'versions' ? '#fff' : C.text2
          }}
        >
          Versions ({versions.length})
        </button>
        <button
          onClick={() => setView('incidents')}
          style={{
            ...btn(view === 'incidents' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'incidents' ? C.primary : 'transparent',
            color: view === 'incidents' ? '#fff' : C.text2
          }}
        >
          Incidents ({incidents.filter(i => i.status === INCIDENT_STATUS.OPEN).length})
        </button>
        <button
          onClick={() => setView('approvals')}
          style={{
            ...btn(view === 'approvals' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'approvals' ? C.primary : 'transparent',
            color: view === 'approvals' ? '#fff' : C.text2
          }}
        >
          Approvals ({approvals.filter(a => a.status === APPROVAL_STATUS.PENDING).length})
        </button>
        <button
          onClick={() => setView('timeline')}
          style={{
            ...btn(view === 'timeline' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'timeline' ? C.primary : 'transparent',
            color: view === 'timeline' ? '#fff' : C.text2
          }}
        >
          Timeline ({timelineEvents.length})
        </button>
        <button
          onClick={() => setView('automation')}
          style={{
            ...btn(view === 'automation' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'automation' ? C.primary : 'transparent',
            color: view === 'automation' ? '#fff' : C.text2
          }}
        >
          Automation ({automationRules.length})
        </button>
        <button
          onClick={() => setView('reports')}
          style={{
            ...btn(view === 'reports' ? 'primary' : 'ghost'),
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            background: view === 'reports' ? C.primary : 'transparent',
            color: view === 'reports' ? '#fff' : C.text2
          }}
        >
          Reports
        </button>
      </div>

      {/* Workflow Grid */}
      {view === 'list' && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filteredWorkflows.map(workflow => (
          <div
            key={workflow.id}
            style={{ ...card, padding: "20px", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--cafe-shadow-sm)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: workflow.color || C.bg3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px"
              }}>
                {workflow.icon || '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                  {workflow.name}
                </div>
                <div style={{ fontSize: "12px", color: C.text3 }}>
                  {workflow.category}
                </div>
              </div>
              <div style={{ ...pill, padding: "4px 8px", fontSize: "11px", fontWeight: 600 }}>
                {workflow.status}
              </div>
            </div>

            {workflow.description && (
              <div style={{ fontSize: "13px", color: C.text2, marginBottom: "16px", lineHeight: "1.4" }}>
                {workflow.description}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {workflow.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ ...pill, padding: "4px 8px", fontSize: "11px" }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "12px", color: C.text3 }}>
                {workflow.tasks?.length || 0} tasks · {workflow.estimatedDuration} min
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExecuteWorkflow(workflow); }}
                  style={{ ...btn("primary"), padding: "6px 12px", fontSize: "12px" }}
                >
                  Execute
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditWorkflow(workflow); }}
                  style={{ ...btn("ghost"), padding: "6px 12px", fontSize: "12px" }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredWorkflows.length === 0 && (
          <div style={{ gridColumn: "1 / -1", ...card, padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: C.text, marginBottom: "8px" }}>
              No workflows found
            </div>
            <button onClick={handleCreateWorkflow} style={{ ...btn("primary"), padding: "12px 24px" }}>
              + New Workflow
            </button>
          </div>
        )}
      </div>
      )}

      {/* Phase 2 Views */}
      {view === 'templates' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Templates ({templates.length})</h2>
          {templates.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No templates</div> : 
            templates.map(t => <div key={t.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>{t.name} - {t.scope}</div>)
          }
        </div>
      )}

      {view === 'versions' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Versions ({versions.length})</h2>
          {versions.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No versions</div> :
            versions.map(v => <div key={v.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>v{v.version} - {v.changeLog || 'No log'}</div>)
          }
        </div>
      )}

      {view === 'incidents' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Incidents ({incidents.length})</h2>
          {incidents.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No incidents</div> :
            incidents.map(i => <div key={i.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>{i.title} - {i.status}</div>)
          }
        </div>
      )}

      {view === 'approvals' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Approvals ({approvals.length})</h2>
          {approvals.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No approvals</div> :
            approvals.map(a => <div key={a.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>{a.level} - {a.status}</div>)
          }
        </div>
      )}

      {view === 'timeline' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Timeline ({timelineEvents.length})</h2>
          {timelineEvents.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No events</div> :
            timelineEvents.slice().reverse().map(e => <div key={e.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>{e.eventType} - {new Date(e.timestamp).toLocaleString()}</div>)
          }
        </div>
      )}

      {view === 'automation' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>Automation ({automationRules.length})</h2>
          {automationRules.length === 0 ? <div style={{ padding: "24px", textAlign: "center" }}>No rules</div> :
            automationRules.map(r => <div key={r.id} style={{ ...card, padding: "12px", margin: "8px 0" }}>{r.trigger} - {r.isActive ? 'Active' : 'Inactive'}</div>)
          }
        </div>
      )}

      {view === 'builder' && (
        selectedWorkflow ? (
          <WorkflowBuilder
            workflow={selectedWorkflow}
            onSave={handleSaveWorkflow}
            onCancel={handleCancelBuilder}
          />
        ) : (
          <div style={{ ...card, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>No workflow selected</h2>
            <p style={{ fontSize: 14, color: C.text2, marginBottom: 24 }}>Pick a workflow to edit, or create a new one.</p>
            <button onClick={handleCreateWorkflow} style={{ ...btn('primary'), padding: "10px 24px", marginRight: 8 }}>+ New Workflow</button>
            <button onClick={() => setView('list')} style={{ ...btn('ghost'), padding: "10px 24px" }}>← Back to Workflows</button>
          </div>
        )
      )}

      {view === 'executor' && (
        selectedExecution && selectedWorkflow ? (
          <WorkflowExecutor
            workflow={selectedWorkflow}
            execution={selectedExecution}
            onUpdate={handleUpdateExecution}
            onCancel={handleCancelExecution}
          />
        ) : (
          <div style={{ ...card, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>▶️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Workflow Executor</h2>
            <p style={{ fontSize: 14, color: C.text2, marginBottom: 24 }}>
              Run and monitor live workflow executions.
            </p>
            {executions.length === 0 ? (
              <div style={{ color: C.text3, fontSize: 14, marginBottom: 20 }}>No executions yet. Run a workflow from the list.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500, margin: "0 auto 20px", textAlign: "left" }}>
                {executions.slice(0, 10).map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => handleOpenExecution(ex)}
                    style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ex.workflowName || ex.workflowId}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : "—"}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: ex.status === "completed" ? "#052e16" : ex.status === "failed" ? "#1c0a0a" : C.bg3, color: ex.status === "completed" ? "#4ade80" : ex.status === "failed" ? "#f87171" : C.amber2 }}>
                      {ex.status || "running"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setView('list')} style={{ ...btn('ghost'), padding: "10px 24px" }}>← Back</button>
          </div>
        )
      )}

      {view === 'reports' && (
        <WorkflowReports workflows={workflows} executions={executions} />
      )}

      {view === 'history' && (
        <div style={{ ...card, padding: "24px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 16 }}>Execution History</h2>
          {executions.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.text3 }}>No executions recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {executions.slice().sort((a,b) => (b.startedAt||0) - (a.startedAt||0)).map(ex => (
                <div key={ex.id} style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ex.workflowName || ex.workflowId}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>
                      {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : "—"}
                      {ex.completedAt && ` → ${new Date(ex.completedAt).toLocaleTimeString()}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {ex.stepCount && <span style={{ fontSize: 11, color: C.text3 }}>{ex.stepCount} steps</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: ex.status === "completed" ? "#052e16" : ex.status === "failed" ? "#1c0a0a" : C.bg3, color: ex.status === "completed" ? "#4ade80" : ex.status === "failed" ? "#f87171" : C.amber2 }}>
                      {ex.status || "unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Workflows;
