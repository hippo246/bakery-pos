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

  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrationSource, setMigrationSource] = useState('');
  const [migrationTarget, setMigrationTarget] = useState('');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);

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

  const handleStartMigration = useCallback(async () => {
    if (!migrationSource || !migrationTarget) return;
    
    setIsMigrating(true);
    setMigrationProgress(0);
    
    // Simulate migration progress
    const interval = setInterval(() => {
      setMigrationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMigrating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
    
    // In production, this would call the actual migration API
    console.log("Migration started from", migrationSource, "to", migrationTarget);
  }, [migrationSource, migrationTarget]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "28px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--cafe-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Data & Backups</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0, fontWeight: 500 }}>Manage backups, exports, and data integrity</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        {/* Storage Overview */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Storage Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Storage Used</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em" }}>45.2 MB</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>of 100 MB</div>
            </div>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Database Health</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cafe-success)", letterSpacing: "-0.02em" }}>Good</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>Last checked: Today</div>
            </div>
            <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Last Backup</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em" }}>Today</div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>2:30 PM</div>
            </div>
          </div>
        </div>

        {/* Backup Actions */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Backup Actions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <button onClick={handleManualBackup} style={{ padding: "16px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <span>💾</span> Manual Backup
              </button>
              <button onClick={handleRestore} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                <span>📥</span> Restore Backup
              </button>
              <button onClick={handleExport} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                <span>📤</span> Export Data
              </button>
              <button onClick={handleImport} style={{ padding: "16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                <span>📥</span> Import Data
              </button>
            </div>
          </div>
        </div>

        {/* Auto Backup */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Auto Backup</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.autoBackup} onChange={(e) => handleChange('autoBackup', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Auto Backup</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Automatically backup data on schedule</div></div>
              </label>
              {formData.autoBackup && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Backup Schedule</label>
                    <select value={formData.backupSchedule} onChange={(e) => handleChange('backupSchedule', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Retention Period (days)</label>
                    <input type="number" value={formData.backupRetention} onChange={(e) => handleChange('backupRetention', parseInt(e.target.value) || 7)} min="1" max="90" style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Backup */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cloud Backup</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
              <input type="checkbox" checked={formData.cloudBackup} onChange={(e) => handleChange('cloudBackup', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Cloud Backup</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Sync backups to cloud storage</div></div>
            </label>
          </div>
        </div>

        {/* Data Integrity */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Integrity</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.integrityCheck} onChange={(e) => handleChange('integrityCheck', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Auto Integrity Check</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Automatically check database integrity</div></div>
              </label>
              <button onClick={handleIntegrityCheck} style={{ padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                Run Integrity Check Now
              </button>
            </div>
          </div>
        </div>

        {/* Data Migration */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Migration</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>Migrate Data Between Backends</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500, marginBottom: 16 }}>Transfer all your data from one storage backend to another (e.g., Local Storage to Cloud)</div>
              </div>
              <button onClick={() => setShowMigrationDialog(true)} style={{ padding: "12px 24px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                Start Migration
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "28px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Save Changes</button>
      </div>

      {/* Migration Dialog */}
      {showMigrationDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', border: '1px solid var(--cafe-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Data Migration</h3>
              <button onClick={() => setShowMigrationDialog(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--cafe-text-secondary)', padding: 0, lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 8, display: 'block' }}>Source Backend</label>
                <select value={migrationSource} onChange={(e) => setMigrationSource(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid var(--cafe-border-light)', borderRadius: 12, background: 'var(--cafe-bg)', color: 'var(--cafe-text-primary)', cursor: 'pointer', transition: 'all 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                  <option value="">Select source...</option>
                  <option value="local">Local Storage</option>
                  <option value="aws-s3">AWS S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="azure-blob">Azure Blob Storage</option>
                  <option value="firebase">Firebase Storage</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 8, display: 'block' }}>Target Backend</label>
                <select value={migrationTarget} onChange={(e) => setMigrationTarget(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid var(--cafe-border-light)', borderRadius: 12, background: 'var(--cafe-bg)', color: 'var(--cafe-text-primary)', cursor: 'pointer', transition: 'all 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                  <option value="">Select target...</option>
                  <option value="local">Local Storage</option>
                  <option value="aws-s3">AWS S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="azure-blob">Azure Blob Storage</option>
                  <option value="firebase">Firebase Storage</option>
                </select>
              </div>

              {isMigrating && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Migration Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cafe-accent)' }}>{migrationProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--cafe-bg)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${migrationProgress}%`, height: '100%', background: 'var(--cafe-accent)', borderRadius: 8, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={() => setShowMigrationDialog(false)} disabled={isMigrating} style={{ padding: '12px 24px', background: 'var(--cafe-bg-surface)', border: '1px solid var(--cafe-border-light)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-secondary)', cursor: isMigrating ? 'not-allowed' : 'pointer', flex: 1, transition: 'all 0.2s' }} onMouseOver={e => { if (!isMigrating) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; } }} onMouseOut={e => { if (!isMigrating) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; } }}>
                  Cancel
                </button>
                <button onClick={handleStartMigration} disabled={!migrationSource || !migrationTarget || isMigrating} style={{ padding: '12px 24px', background: 'var(--cafe-accent-bg)', border: '1px solid var(--cafe-accent)', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'var(--cafe-accent)', cursor: (!migrationSource || !migrationTarget || isMigrating) ? 'not-allowed' : 'pointer', flex: 1, transition: 'all 0.2s' }} onMouseOver={e => { if (migrationSource && migrationTarget && !isMigrating) { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; } }} onMouseOut={e => { if (migrationSource && migrationTarget && !isMigrating) { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}>
                  {isMigrating ? 'Migrating...' : 'Start Migration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
