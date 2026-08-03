import React from 'react';
// Support Settings Section - Diagnostics, Logs, and Support Information
// Premium support tools

import { useState, useCallback } from "react";
import RemoteAssistance from "../../remote/RemoteAssistance.jsx";

export default function SupportSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    version: "1.0.0",
    build: "2024.07.26",
    installationId: "CAF-2024-001",
    deviceId: "DEV-CAF-001"
  });

  const [diagnostics, setDiagnostics] = useState(null);
  const [logs, setLogs] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateDiagnostics = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setDiagnostics({
        timestamp: new Date().toISOString(),
        system: {
          os: navigator.platform,
          browser: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        },
        application: {
          version: formData.version,
          build: formData.build,
          installationId: formData.installationId,
          deviceId: formData.deviceId
        },
        performance: {
          memory: navigator.deviceMemory || "Unknown",
          cores: navigator.hardwareConcurrency || "Unknown",
          connection: navigator.connection?.effectiveType || "Unknown"
        },
        storage: {
          localStorage: Math.round(JSON.stringify(localStorage).length / 1024) + " KB",
          sessionStorage: Math.round(JSON.stringify(sessionStorage).length / 1024) + " KB"
        }
      });
      setIsGenerating(false);
    }, 1500);
  }, [formData]);

  const handleExportLogs = useCallback(() => {
    const logData = {
      timestamp: new Date().toISOString(),
      installationId: formData.installationId,
      deviceId: formData.deviceId,
      logs: [
        { level: "INFO", message: "Application started", timestamp: new Date().toISOString() },
        { level: "INFO", message: "Settings loaded", timestamp: new Date().toISOString() },
        { level: "DEBUG", message: "Support section accessed", timestamp: new Date().toISOString() }
      ]
    };
    setLogs(logData);
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cafeos-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formData]);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Support
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Diagnostics, logs, and support information
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* System Information */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            System Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Version
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.version}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Build
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.build}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Installation ID
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.installationId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  Device ID
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {formData.deviceId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Diagnostics
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <button
              onClick={handleGenerateDiagnostics}
              disabled={isGenerating}
              style={{
                padding: "12px 20px",
                background: "var(--cafe-accent)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1
              }}
            >
              {isGenerating ? "Generating..." : "Generate Diagnostics"}
            </button>

            {diagnostics && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 12,
                color: "var(--cafe-text-primary)"
              }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Logs
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <button
              onClick={handleExportLogs}
              style={{
                padding: "12px 20px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Export Logs
            </button>

            <div style={{
              marginTop: 16,
              padding: 16,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 11,
              color: "var(--cafe-text-secondary)"
            }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: "#10b981" }}>[INFO]</span> Application started
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: "#10b981" }}>[INFO]</span> Settings loaded
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: "#3b82f6" }}>[DEBUG]</span> Support section accessed
              </div>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Support Information
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  Email Support
                </div>
                <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
                  support@cafeos.com
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  Phone Support
                </div>
                <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
                  +91 1800-CAFE-OS
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  Documentation
                </div>
                <a
                  href="https://docs.cafeos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 14,
                    color: "var(--cafe-accent)",
                    textDecoration: "none"
                  }}
                >
                  docs.cafeos.com
                </a>
              </div>

              <div style={{
                marginTop: 16,
                padding: 16,
                background: "var(--cafe-info-bg)",
                border: "1px solid var(--cafe-info-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--cafe-info)"
              }}>
                <strong>💡 Tip:</strong> Include your Installation ID ({formData.installationId}) when contacting support for faster assistance.
              </div>
            </div>
          </div>
        </div>

        {/* Remote Assistance Integration */}
        <div style={{ marginTop: 32 }}>
           <RemoteAssistance />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "flex-end"
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
