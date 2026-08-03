import React from 'react';
// Advanced Settings Section - Developer Tools
import { useState, useCallback } from "react";

export default function AdvancedSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    debugMode: settings?.debugMode || false,
    verboseLogging: settings?.verboseLogging || false,
    cacheEnabled: settings?.cacheEnabled !== false,
    cacheSize: settings?.cacheSize || 50,
    performanceMonitoring: settings?.performanceMonitoring || false,
    developerMode: settings?.developerMode || false,
    showDevTools: settings?.showDevTools || false,
    apiDebug: settings?.apiDebug || false
  });

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
      <div style={{ padding: isMobile ? "20px" : "32px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--cafe-text-primary)", margin: "0 0 8px" }}>Advanced</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0 }}>Developer tools and system information</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Developer Mode */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Developer Mode</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.developerMode} onChange={(e) => handleChange('developerMode', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Developer Mode</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Unlock advanced debugging features</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.debugMode} onChange={(e) => handleChange('debugMode', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Debug Mode</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Show debug information in console</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.verboseLogging} onChange={(e) => handleChange('verboseLogging', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Verbose Logging</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Enable detailed logging</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.showDevTools} onChange={(e) => handleChange('showDevTools', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Show Dev Tools</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Display developer tools in UI</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.apiDebug} onChange={(e) => handleChange('apiDebug', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>API Debug</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Log all API calls</div></div>
              </label>
            </div>
          </div>
        </div>

        {/* Cache Controls */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Cache Controls</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.cacheEnabled} onChange={(e) => handleChange('cacheEnabled', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Cache</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Cache data for faster performance</div></div>
              </label>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Cache Size (MB)</label>
                <input type="number" value={formData.cacheSize} onChange={(e) => handleChange('cacheSize', parseInt(e.target.value) || 50)} min="10" max="500" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
              </div>
              <button onClick={handleClearCache} style={{ padding: "12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer" }}>
                Clear Cache
              </button>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Performance</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.performanceMonitoring} onChange={(e) => handleChange('performanceMonitoring', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Performance Monitoring</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Track and log performance metrics</div></div>
            </label>
          </div>
        </div>

        {/* System Information */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>System Information</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Platform</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.platform}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Language</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.language}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Screen Resolution</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.screenResolution}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Viewport</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.viewport}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Device Memory</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.deviceMemory} GB</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>CPU Cores</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{systemInfo.cores}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Cookies</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: systemInfo.cookiesEnabled ? "#10b981" : "#ef4444" }}>{systemInfo.cookiesEnabled ? "Enabled" : "Disabled"}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Online Status</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: systemInfo.online ? "#10b981" : "#ef4444" }}>{systemInfo.online ? "Online" : "Offline"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Configuration</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <button onClick={handleResetConfig} style={{ padding: "12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", cursor: "pointer" }}>
              Reset Configuration to Defaults
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "32px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Changes</button>
      </div>
    </div>
  );
}
