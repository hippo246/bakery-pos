import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function BackupSection({ settings, setSettings, isMobile, dataTools }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Automatic Backups */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Automatic Backups
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Enable Auto Backup
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Automatically backup data at scheduled intervals
              </div>
            </div>
            <PremiumToggle
              value={settings.autoBackup || false}
              onChange={(enabled) => setSettings("autoBackup", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Backup Frequency</label>
              <select
                value={settings.backupFrequency || "daily"}
                onChange={e => setSettings("backupFrequency", e.target.value)}
                disabled={!settings.autoBackup}
                style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Retention Period (days)</label>
              <input
                type="number"
                value={settings.backupRetention || 30}
                onChange={e => setSettings("backupRetention", parseInt(e.target.value) || 30)}
                disabled={!settings.autoBackup}
                style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
                min="1"
                max="365"
              />
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* Manual Backup */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Manual Backup
        </h4>
        
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              if (dataTools && dataTools.exportLocalData) {
                const data = dataTools.exportLocalData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cafeos_backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            disabled={!dataTools}
            style={{
              ...input,
              padding: "10px 20px",
              background: "var(--cafe-accent)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: dataTools ? "pointer" : "not-allowed",
              fontSize: 12,
              fontWeight: 500
            }}
          >
            Export Backup
          </button>
          
          <button
            onClick={() => {
              if (dataTools && dataTools.getStorageSnapshot) {
                const snap = dataTools.getStorageSnapshot();
                console.log("Storage Snapshot:", snap);
              }
            }}
            disabled={!dataTools}
            style={{
              ...input,
              padding: "10px 20px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: dataTools ? "pointer" : "not-allowed",
              fontSize: 12
            }}
          >
            View Storage Status
          </button>
        </div>
      </PremiumCard>

      {/* Restore Backup */}
      <PremiumCard style={{
        border: "1px solid var(--cafe-danger-border)",
        background: "var(--cafe-danger-bg)"
      }}>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-danger)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Restore Backup
        </h4>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...label, fontSize: 12, marginBottom: 6, color: "var(--cafe-danger)" }}>Import Backup File</label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && dataTools && dataTools.importLocalData) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    dataTools.importLocalData(data);
                  } catch (err) {
                    console.error("Failed to parse backup file:", err);
                  }
                };
                reader.readAsText(file);
              }
            }}
            disabled={!dataTools}
            style={{ ...input, width: "100%", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-danger-border)", color: "var(--cafe-text-primary)" }}
          />
        </div>
        
        <p style={{
          fontSize: 11,
          color: "var(--cafe-danger)",
          margin: 0,
          fontStyle: "italic"
        }}>
          ⚠️ Warning: Restoring from backup will replace all existing data. This action cannot be undone.
        </p>
      </PremiumCard>

      {/* Storage Usage */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Storage Usage
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Total Storage
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--cafe-text-primary)"
            }}>
              {dataTools?.getStorageSnapshot ? "2.4 MB" : "N/A"}
            </div>
          </div>
          
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Last Backup
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--cafe-accent)"
            }}>
              {settings.lastBackup ? new Date(settings.lastBackup).toLocaleDateString() : "Never"}
            </div>
          </div>
          
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 10
          }}>
            <div style={{
              fontSize: 11,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 8
            }}>
              Backup Count
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--cafe-text-primary)"
            }}>
              {settings.backupCount || 0}
            </div>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
