import React from 'react';
// Danger Zone Settings Section - Destructive Actions
import { useState, useCallback } from "react";

export default function DangerZoneSettingsSection({ settings, onUpdate, isMobile, onFactoryReset, onDeleteLocalData, onClearCache, onResetSettings, onDeleteDemoData }) {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, title: "", description: "" });

  const handleAction = useCallback((action) => {
    setConfirmDialog({
      open: true,
      action,
      title: getActionTitle(action),
      description: getActionDescription(action)
    });
  }, []);

  const handleConfirm = useCallback(() => {
    switch (confirmDialog.action) {
      case "factoryReset":
        onFactoryReset?.();
        break;
      case "deleteLocalData":
        onDeleteLocalData?.();
        break;
      case "clearCache":
        onClearCache?.();
        break;
      case "resetSettings":
        onResetSettings?.();
        break;
      case "deleteDemoData":
        onDeleteDemoData?.();
        break;
    }
    setConfirmDialog({ open: false, action: null, title: "", description: "" });
  }, [confirmDialog.action, onFactoryReset, onDeleteLocalData, onClearCache, onResetSettings, onDeleteDemoData]);

  const getActionTitle = (action) => {
    const titles = {
      factoryReset: "Factory Reset",
      deleteLocalData: "Delete All Local Data",
      clearCache: "Clear Application Cache",
      resetSettings: "Reset All Settings",
      deleteDemoData: "Delete Demo Data"
    };
    return titles[action] || "Confirm Action";
  };

  const getActionDescription = (action) => {
    const descriptions = {
      factoryReset: "This will reset the entire application to factory settings. All data, settings, and configurations will be permanently deleted. This action cannot be undone.",
      deleteLocalData: "This will permanently delete all local data including orders, customers, menu items, and inventory. This action cannot be undone.",
      clearCache: "This will clear the application cache. Some data may need to be reloaded. This is generally safe but may temporarily slow down the application.",
      resetSettings: "This will reset all settings to their default values. Your data will be preserved but all customizations will be lost. This action cannot be undone.",
      deleteDemoData: "This will delete all demo data. If you're in demo mode, this will clear all sample data. This action cannot be undone."
    };
    return descriptions[action] || "";
  };

  const dangerActions = [
    {
      id: "factoryReset",
      title: "Factory Reset",
      description: "Reset entire application to factory settings",
      icon: "🔄",
      severity: "critical"
    },
    {
      id: "deleteLocalData",
      title: "Delete All Local Data",
      description: "Permanently delete all local data",
      icon: "🗑️",
      severity: "critical"
    },
    {
      id: "resetSettings",
      title: "Reset All Settings",
      description: "Reset all settings to defaults",
      icon: "⚙️",
      severity: "high"
    },
    {
      id: "deleteDemoData",
      title: "Delete Demo Data",
      description: "Clear all demo/sample data",
      icon: "🧹",
      severity: "medium"
    },
    {
      id: "clearCache",
      title: "Clear Application Cache",
      description: "Clear cached data",
      icon: "💾",
      severity: "low"
    }
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#6b7280"
    };
    return colors[severity] || "#6b7280";
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "32px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#ef4444", margin: "0 0 8px" }}>Danger Zone</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0 }}>Irreversible destructive actions - proceed with caution</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Warning Banner */}
        <div style={{ marginBottom: 32, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#dc2626" }}>Warning</div>
          </div>
          <div style={{ fontSize: 13, color: "#991b1b" }}>
            Actions in this section are irreversible and may result in permanent data loss. 
            Owner confirmation is required for all actions. Please ensure you have backups before proceeding.
          </div>
        </div>

        {/* Destructive Actions */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Destructive Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dangerActions.map(action => (
              <div key={action.id} style={{ background: "var(--cafe-bg-card)", border: `1px solid ${getSeverityColor(action.severity)}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>{action.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{action.title}</div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{action.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(action.id)}
                    style={{
                      padding: "10px 20px",
                      background: getSeverityColor(action.severity),
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 16, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{confirmDialog.title}</div>
            </div>
            <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {confirmDialog.description}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDialog({ open: false, action: null, title: "", description: "" })}
                style={{
                  padding: "12px 24px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: "12px 24px",
                  background: "#dc2626",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
