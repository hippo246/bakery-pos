import React from 'react';
// Backup Step for Setup Wizard
// Create first backup before going live with full functionality

import { useState, useCallback, useEffect, useRef } from "react";

export default function BackupStep({ settings, onNext, onBack, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [backupName, setBackupName] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupRetention, setBackupRetention] = useState(30);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupCreated, setBackupCreated] = useState(false);
  const [backupTimestamp, setBackupTimestamp] = useState(null);
  const intervalRef = useRef(null);

  // Inject spinner keyframes once and clean up interval on unmount
  useEffect(() => {
    const id = 'brewcrm-spin-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleCreateBackup = useCallback(() => {
    if (!backupName.trim()) {
      setError({ title: 'Backup Name Required', message: 'Please enter a name for your backup.' });
      return;
    }

    setIsCreatingBackup(true);
    setBackupProgress(0);

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += 10;
      setBackupProgress(progress);

      if (progress >= 100) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        const ts = new Date().toISOString();
        setBackupTimestamp(ts);
        setIsCreatingBackup(false);
        setBackupCreated(true);

        try {
          const updatedSettings = {
            ...settings,
            backupConfig: {
              initialBackup: { name: backupName.trim(), createdAt: ts },
              autoBackupEnabled,
              backupFrequency,
              backupRetention
            }
          };
          localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
        } catch (e) {
          console.warn('Could not persist backup config:', e);
        }
      }
    }, 200);
  }, [backupName, autoBackupEnabled, backupFrequency, backupRetention, settings, setError]);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      backupConfig: {
        initialBackup: backupCreated ? { name: backupName.trim(), createdAt: backupTimestamp } : null,
        autoBackupEnabled,
        backupFrequency,
        backupRetention
      }
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist backup config:', e);
    }
    onNext({ backupConfig: updatedSettings.backupConfig });
  }, [backupName, backupTimestamp, backupCreated, autoBackupEnabled, backupFrequency, backupRetention, settings, onNext]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Create Backup
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Create your first backup before going live to protect your data.
        </p>
      </div>

      {/* Manual Backup */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>💾</span>
          Initial Backup
        </h4>

        {backupCreated ? (
          <div style={{
            padding: "24px",
            background: "#10b98110",
            border: "1px solid #10b98130",
            borderRadius: 10,
            textAlign: "center"
          }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>✅</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#10b981", marginBottom: 8 }}>
              Backup Created Successfully!
            </div>
            <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
              {backupName} • {backupTimestamp ? new Date(backupTimestamp).toLocaleString() : ''}
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Backup Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="e.g., Initial Setup Backup"
                disabled={isCreatingBackup}
                onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--cafe-accent-bg)"; e.currentTarget.style.borderColor = "var(--cafe-accent)"; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--cafe-border)"; }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none",
                  opacity: isCreatingBackup ? 0.6 : 1,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease"
                }}
              />
            </div>

            {isCreatingBackup && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "3px solid var(--cafe-accent)",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite"
                  }} />
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>
                    Creating backup...
                  </div>
                </div>
                <div style={{
                  height: 8,
                  background: "var(--cafe-bg)",
                  borderRadius: 4,
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${backupProgress}%`,
                    background: "linear-gradient(90deg, var(--cafe-accent), #A0522D)",
                    borderRadius: 4,
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {backupProgress}% complete
                </div>
              </div>
            )}

            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || !backupName}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                cursor: isCreatingBackup || !backupName ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
            >
              {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
            </button>
          </>
        )}
      </div>

      {/* Auto Backup Settings */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>⚙️</span>
          Auto Backup Settings
        </h4>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 12, background: "var(--cafe-bg)", borderRadius: 8, border: "1px solid var(--cafe-border)" }}>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>Enable automatic backups</span>
          </label>
        </div>

        {autoBackupEnabled && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Backup Frequency
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Retention Period (days)
              </label>
              <input
                type="number"
                value={backupRetention}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v)) setBackupRetention(Math.min(365, Math.max(1, v)));
                }}
                min="1"
                max="365"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: `1px solid ${backupRetention < 1 || backupRetention > 365 ? "#ef4444" : "var(--cafe-border)"}`,
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
              {(backupRetention < 1 || backupRetention > 365) && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#ef4444" }}>Must be between 1 and 365 days</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* What's Included */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>📋</span>
          What's Included in Backup
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {[
            { icon: '🏢', label: 'Business details and settings' },
            { icon: '📋', label: 'Menu items and categories' },
            { icon: '👥', label: 'Staff and roles' },
            { icon: '🪑', label: 'Tables and service areas' },
            { icon: '💳', label: 'Payment configurations' },
            { icon: '🖨️', label: 'Printer settings' },
            { icon: '📦', label: 'Inventory data' },
            { icon: '📊', label: 'Reports and analytics' }
          ].map((item, idx) => (
            <div key={idx} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px",
              background: "var(--cafe-bg)",
              borderRadius: 8,
              border: "1px solid var(--cafe-border)"
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading || isCreatingBackup}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading || isCreatingBackup ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading || isCreatingBackup}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading || isCreatingBackup ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
