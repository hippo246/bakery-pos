import React from 'react';
import { useState, useCallback } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { TASK_TYPES, TASK_STATUS, EXECUTION_STATUS, createTaskExecution, startWorkflowExecution, pauseWorkflowExecution, resumeWorkflowExecution, completeWorkflowExecution } from "../../domain/workflowModel";

function WorkflowExecutor({ workflow, execution, onUpdate, onCancel }) {
  const [currentExecution, setCurrentExecution] = useState(execution);
  const [taskValues, setTaskValues] = useState({});

  const handleStart = useCallback(() => {
    const updated = startWorkflowExecution(currentExecution);
    setCurrentExecution(updated);
    onUpdate(updated);
  }, [currentExecution, onUpdate]);

  const handlePause = useCallback(() => {
    const updated = pauseWorkflowExecution(currentExecution);
    setCurrentExecution(updated);
    onUpdate(updated);
  }, [currentExecution, onUpdate]);

  const handleResume = useCallback(() => {
    const updated = resumeWorkflowExecution(currentExecution);
    setCurrentExecution(updated);
    onUpdate(updated);
  }, [currentExecution, onUpdate]);

  const handleComplete = useCallback(() => {
    const updated = completeWorkflowExecution(currentExecution, 'current-user', 'PASS');
    setCurrentExecution(updated);
    onUpdate(updated);
  }, [currentExecution, onUpdate]);

  const handleTaskChange = useCallback((taskId, value) => {
    setTaskValues(prev => ({ ...prev, [taskId]: value }));
  }, []);

  const renderTaskInput = (task, taskExecution) => {
    const value = taskValues[taskExecution.id] || taskExecution.value;

    switch (task.type) {
      case TASK_TYPES.CHECKBOX:
        return (
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.checked)}
            style={{ width: "20px", height: "20px" }}
          />
        );
      case TASK_TYPES.TEXT_INPUT:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.value)}
            style={{ ...input, width: "100%" }}
          />
        );
      case TASK_TYPES.NUMBER:
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, parseFloat(e.target.value) || 0)}
            style={{ ...input, width: "100%" }}
          />
        );
      case TASK_TYPES.YES_NO:
        return (
          <select
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.value)}
            style={{ ...input, width: "100%" }}
          >
            <option value="">Select...</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        );
      case TASK_TYPES.DATE:
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.value)}
            style={{ ...input, width: "100%" }}
          />
        );
      case TASK_TYPES.TIME:
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.value)}
            style={{ ...input, width: "100%" }}
          />
        );
      case TASK_TYPES.PHOTO_REQUIRED:
        return (
          <div style={{ padding: "12px", border: `2px dashed ${C.border}`, borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
            <div style={{ fontSize: "12px", color: C.text3 }}>Photo required</div>
          </div>
        );
      case TASK_TYPES.SIGNATURE_REQUIRED:
        return (
          <div style={{ padding: "12px", border: `2px dashed ${C.border}`, borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>✍️</div>
            <div style={{ fontSize: "12px", color: C.text3 }}>Signature required</div>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleTaskChange(taskExecution.id, e.target.value)}
            style={{ ...input, width: "100%" }}
          />
        );
    }
  };

  const completedTasks = currentExecution.tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  const totalTasks = currentExecution.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ ...card, padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>
              {workflow.icon} {workflow.name}
            </h1>
            <div style={{ fontSize: "14px", color: C.text3 }}>
              {workflow.category} · {workflow.estimatedDuration} min
            </div>
          </div>
          <div style={{ ...card, padding: "8px 16px", background: C.bg3 }}>
            <div style={{ fontSize: "12px", color: C.text3, marginBottom: "4px" }}>Progress</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: C.text }}>
              {completedTasks}/{totalTasks}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: "8px", background: C.bg3, borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ height: "100%", background: workflow.color || C.accent, width: `${progress}%`, transition: "width 0.3s" }} />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {currentExecution.status === EXECUTION_STATUS.NOT_STARTED && (
            <button onClick={handleStart} style={{ ...btn("primary"), padding: "10px 20px" }}>
              Start Workflow
            </button>
          )}
          {currentExecution.status === EXECUTION_STATUS.IN_PROGRESS && (
            <>
              <button onClick={handlePause} style={{ ...btn("ghost"), padding: "10px 20px" }}>
                Pause
              </button>
              <button 
                onClick={handleComplete} 
                disabled={completedTasks < totalTasks}
                style={{ ...btn("primary"), padding: "10px 20px", opacity: completedTasks < totalTasks ? 0.5 : 1 }}
              >
                Complete
              </button>
            </>
          )}
          {currentExecution.status === EXECUTION_STATUS.PAUSED && (
            <>
              <button onClick={handleResume} style={{ ...btn("primary"), padding: "10px 20px" }}>
                Resume
              </button>
              <button onClick={onCancel} style={{ ...btn("ghost"), padding: "10px 20px" }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tasks */}
      {currentExecution.status !== EXECUTION_STATUS.NOT_STARTED && (
        <div style={{ ...card, padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: C.text, marginBottom: "16px" }}>
            Tasks
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {workflow.tasks.map((task, index) => {
              const taskExecution = currentExecution.tasks[index] || createTaskExecution({
                taskDefinitionId: task.id,
                taskName: task.name
              });
              
              return (
                <div
                  key={task.id}
                  style={{
                    padding: "16px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    background: taskExecution.status === TASK_STATUS.COMPLETED ? C.bg3 : C.bg2
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ paddingTop: "4px" }}>
                      {renderTaskInput(task, taskExecution)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                        {index + 1}. {task.name}
                        {task.required && <span style={{ color: C.red, marginLeft: "4px" }}>*</span>}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: "13px", color: C.text2, marginBottom: "8px" }}>
                          {task.description}
                        </div>
                      )}
                      {task.instructions && (
                        <div style={{ fontSize: "12px", color: C.text3, fontStyle: "italic", marginBottom: "8px" }}>
                          Instructions: {task.instructions}
                        </div>
                      )}
                      {taskExecution.status === TASK_STATUS.COMPLETED && (
                        <div style={{ ...card, padding: "8px 12px", background: C.green + "20", border: `1px solid ${C.green}`, fontSize: "12px", color: C.green, display: "inline-block" }}>
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {currentExecution.status !== EXECUTION_STATUS.NOT_STARTED && (
        <div style={{ ...card, padding: "20px", marginTop: "16px" }}>
          <label style={label}>Workflow Notes</label>
          <textarea
            style={{ ...input, width: "100%", minHeight: "80px", resize: "vertical" }}
            placeholder="Add any notes about this workflow execution..."
          />
        </div>
      )}
    </div>
  );
}

export default WorkflowExecutor;
