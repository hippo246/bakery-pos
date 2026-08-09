import React from 'react';
import { card, btn } from "../../../styles/theme";

export default function WorkflowsStep({ settings, onSettingsChange, onNext, onBack, onSkip, stepIndex, totalSteps }) {
  const handleWorkflowToggle = (workflow) => {
    const currentWorkflows = settings?.enabledWorkflows || [];
    if (currentWorkflows.includes(workflow)) {
      onSettingsChange({ enabledWorkflows: currentWorkflows.filter(w => w !== workflow) });
    } else {
      onSettingsChange({ enabledWorkflows: [...currentWorkflows, workflow] });
    }
  };

  const workflows = [
    { id: 'auto-stock-alert', name: 'Auto Stock Alerts', icon: '📦', description: 'Automatically alert when stock runs low' },
    { id: 'auto-order-routing', name: 'Auto Order Routing', icon: '🔄', description: 'Route orders to appropriate kitchen stations' },
    { id: 'auto-receipt', name: 'Auto Receipt Print', icon: '🖨️', description: 'Automatically print receipts on order completion' },
    { id: 'auto-backup', name: 'Auto Backup', icon: '💾', description: 'Schedule automatic data backups' },
    { id: 'auto-cleanup', name: 'Auto Cleanup', icon: '🧹', description: 'Automatically clean up old data' },
    { id: 'auto-report', name: 'Auto Reports', icon: '📊', description: 'Generate daily/weekly reports automatically' },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Workflows & Automation
        </h2>
        <p style={{
          fontSize: 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Enable automated workflows to streamline your operations. You can customize these later in Settings.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {workflows.map((workflow) => {
          const isSelected = settings?.enabledWorkflows?.includes(workflow.id);
          return (
            <div
              key={workflow.id}
              onClick={() => handleWorkflowToggle(workflow.id)}
              style={{
                ...card,
                padding: 20,
                cursor: "pointer",
                border: isSelected ? "2px solid var(--cafe-accent)" : "2px solid transparent",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--cafe-border-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div style={{ fontSize: 32 }}>{workflow.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  margin: "0 0 4px"
                }}>
                  {workflow.name}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "var(--cafe-text-secondary)",
                  margin: 0
                }}>
                  {workflow.description}
                </p>
              </div>
              {isSelected && (
                <div style={{ fontSize: 20, color: "var(--cafe-success)" }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 32, background: "var(--cafe-bg-surface)" }}>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-secondary)",
          margin: 0,
          lineHeight: 1.5
        }}>
          💡 <strong>Tip:</strong> Workflows can be customized with triggers, conditions, and actions in the Workflows section after setup.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ ...btn("secondary"), fontSize: 14, padding: "12px 24px" }}>
          Back
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onSkip} style={{ ...btn("ghost"), fontSize: 14, padding: "12px 24px" }}>
            Skip
          </button>
          <button onClick={onNext} style={{ ...btn("primary"), fontSize: 14, padding: "12px 32px" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
