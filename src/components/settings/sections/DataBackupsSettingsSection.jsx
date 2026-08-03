import React from 'react';
// Data & Backups Settings Section - Backup Tools
import { useState, useCallback } from "react";

export default function DataBackupsSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    autoBackup: settings?.autoBackup !== false,
    backupSchedule: settings?.backupSchedule || "daily",
    backupRetention: settings?.backupRetention || 7,
    cloudBackup: settings?.cloudBackup || false,
    storageUsage: settings?.storageUsage || 0,
    databaseHealth: settings?.databaseHealth || "good",
    integrityCheck: settings?.integrityCheck !== false,
    lastBackup: settings?.lastBackup || null
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleManualBackup = useCallback(() => {
    // Trigger manual backup
    console.log("Manual backup triggered");
  }, []);

  const handleRestore = useCallback(() => {
    // Trigger restore dialog
    console.log("Restore triggered");
  }, []);

  const handleExport = useCallback(() => {
    // Export data
    console.log("Export triggered");
  }, []);

  const handleImport = useCallback(() => {
    // Import data
    console.log("Import triggered");
  }, []);

  const handleIntegrityCheck = useCallback(() => {
    // Run integrity check
    console.log("Integrity check triggered");
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "32px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--cafe-text-primary)", margin: "0 0 8px" }}>Data & Backups</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0 }}>Manage backups, exports, and data integrity</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Storage Overview */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Storage Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Storage Used</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-text-primary)" }}>45.2 MB</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>of 100 MB</div>
            </div>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Database Health</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>Good</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>Last checked: Today</div>
            </div>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Last Backup</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-text-primary)" }}>Today</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>2:30 PM</div>
            </div>
          </div>
        </div>

        {/* Backup Actions */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Backup Actions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <button onClick={handleManualBackup} style={{ padding: "16px", background: "var(--cafe-accent)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>💾</span> Manual Backup
              </button>
              <button onClick={handleRestore} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>📥</span> Restore Backup
              </button>
              <button onClick={handleExport} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>📤</span> Export Data
              </button>
              <button onClick={handleImport} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>📥</span> Import Data
              </button>
            </div>
          </div>
        </div>

        {/* Auto Backup */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Auto Backup</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.autoBackup} onChange={(e) => handleChange('autoBackup', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Auto Backup</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Automatically backup data on schedule</div></div>
              </label>
              {formData.autoBackup && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Backup Schedule</label>
                    <select value={formData.backupSchedule} onChange={(e) => handleChange('backupSchedule', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }}>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Retention Period (days)</label>
                    <input type="number" value={formData.backupRetention} onChange={(e) => handleChange('backupRetention', parseInt(e.target.value) || 7)} min="1" max="90" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Backup */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Cloud Backup</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.cloudBackup} onChange={(e) => handleChange('cloudBackup', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Cloud Backup</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Sync backups to cloud storage</div></div>
            </label>
          </div>
        </div>

        {/* Data Integrity */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Data Integrity</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.integrityCheck} onChange={(e) => handleChange('integrityCheck', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Auto Integrity Check</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Automatically check database integrity</div></div>
              </label>
              <button onClick={handleIntegrityCheck} style={{ padding: "12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer" }}>
                Run Integrity Check Now
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "32px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Changes</button>
      </div>
    </div>
  );
}
