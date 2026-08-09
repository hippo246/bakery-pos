import React from 'react';
// Advanced Settings Section - Developer Tools
import { useState, useCallback } from "react";
import AlertDialog from '../../common/AlertDialog.jsx';
import { getSelfHealingEngine } from '../../../operations/SelfHealingEngine.js';
import HealthMonitor from '../../../components/common/HealthMonitor.jsx';

export default function AdvancedSettingsSection({ settings, onUpdate, isMobile }) {
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState({
    debugMode: settings?.debugMode || false,
    verboseLogging: settings?.verboseLogging || false,
    cacheEnabled: settings?.cacheEnabled !== false,
    cacheSize: settings?.cacheSize || 50,
    performanceMonitoring: settings?.performanceMonitoring || false,
    developerMode: settings?.developerMode || false,
    showDevTools: settings?.showDevTools || false,
    apiDebug: settings?.apiDebug || false,
    selfHealingEnabled: settings?.selfHealingEnabled !== false,
    healthMonitoringEnabled: settings?.healthMonitoringEnabled !== false
  });

  const [showHealthMonitor, setShowHealthMonitor] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleClearCache = useCallback(() => {
    console.log("Clear cache triggered");
  }, []);

  const handleResetConfig = useCallback(() => {
    console.log("Reset config triggered");
  }, []);

  const handleToggleSelfHealing = useCallback(() => {
    const healingEngine = getSelfHealingEngine();
    if (formData.selfHealingEnabled) {
      healingEngine.enableSelfHealing();
    } else {
      healingEngine.disableSelfHealing();
    }
    handleChange('selfHealingEnabled', !formData.selfHealingEnabled);
  }, [formData.selfHealingEnabled, handleChange]);

  const handleProcessRecoveryQueue = useCallback(async () => {
    const healingEngine = getSelfHealingEngine();
    const result = await healingEngine.processRecoveryQueue();
    setAlertDialog({ isOpen: true, title: 'Queue Processed', message: `Processed ${result.processed} items, ${result.remaining} remaining`, type: 'success' });
  }, [alertDialog]);

  const handleResetCircuitBreakers = useCallback(() => {
    const healingEngine = getSelfHealingEngine();
    healingEngine.resetCircuitBreakers();
    setAlertDialog({ isOpen: true, title: 'Circuit Breakers Reset', message: 'Circuit breakers reset', type: 'info' });
  }, [alertDialog]);

  const systemInfo = {
    platform: navigator.platform || "Unknown",
    userAgent: navigator.userAgent.substring(0, 50) + "...",
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    deviceMemory: navigator.deviceMemory || "Unknown",
    cores: navigator.hardwareConcurrency || "Unknown"
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "28px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--cafe-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Advanced</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0, fontWeight: 500 }}>Developer tools and system information</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        {/* Developer Mode */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Developer Mode</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.developerMode} onChange={(e) => handleChange('developerMode', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Developer Mode</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Unlock advanced debugging features</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.debugMode} onChange={(e) => handleChange('debugMode', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Debug Mode</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Show debug information in console</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.verboseLogging} onChange={(e) => handleChange('verboseLogging', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Verbose Logging</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Enable detailed logging</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.showDevTools} onChange={(e) => handleChange('showDevTools', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Show Dev Tools</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Display developer tools in UI</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.apiDebug} onChange={(e) => handleChange('apiDebug', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>API Debug</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Log all API calls</div></div>
              </label>
            </div>
          </div>
        </div>

        {/* Cache Controls */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cache Controls</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.cacheEnabled} onChange={(e) => handleChange('cacheEnabled', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Cache</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Cache data for faster performance</div></div>
              </label>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Cache Size (MB)</label>
                <input type="number" value={formData.cacheSize} onChange={(e) => handleChange('cacheSize', parseInt(e.target.value) || 50)} min="10" max="500" style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
              </div>
              <button onClick={handleClearCache} style={{ padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                Clear Cache
              </button>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Performance</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
              <input type="checkbox" checked={formData.performanceMonitoring} onChange={(e) => handleChange('performanceMonitoring', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Performance Monitoring</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Track and log performance metrics</div></div>
            </label>
          </div>
        </div>

        {/* Self-Healing */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Self-Healing</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.selfHealingEnabled} onChange={handleToggleSelfHealing} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Self-Healing</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Automatic error recovery and retry logic</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.healthMonitoringEnabled} onChange={(e) => handleChange('healthMonitoringEnabled', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Health Monitoring</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Real-time system health checks</div></div>
              </label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setShowHealthMonitor(true)} style={{ padding: "12px 24px", background: "var(--cafe-accent)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; }} onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
                  Open Health Monitor
                </button>
                <button onClick={handleProcessRecoveryQueue} style={{ padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                  Process Recovery Queue
                </button>
                <button onClick={handleResetCircuitBreakers} style={{ padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
                  Reset Circuit Breakers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>System Information</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Platform</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.platform}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Language</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.language}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Screen Resolution</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.screenResolution}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Viewport</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.viewport}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Device Memory</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.deviceMemory} GB</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>CPU Cores</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{systemInfo.cores}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Cookies</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: systemInfo.cookiesEnabled ? "var(--cafe-success)" : "var(--cafe-danger)", letterSpacing: "-0.01em" }}>{systemInfo.cookiesEnabled ? "Enabled" : "Disabled"}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)" }}>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4, fontWeight: 500 }}>Online Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: systemInfo.online ? "var(--cafe-success)" : "var(--cafe-danger)", letterSpacing: "-0.01em" }}>{systemInfo.online ? "Online" : "Offline"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Configuration</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <button onClick={handleResetConfig} style={{ padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }}>
              Reset Configuration to Defaults
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "28px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Save Changes</button>
      </div>
      <HealthMonitor visible={showHealthMonitor} onClose={() => setShowHealthMonitor(false)} />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
