import React from 'react';
// Security Settings Section - Password, PIN, and Access Control
// Premium security management

import { useState, useCallback } from "react";

export default function SecuritySettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    ownerPassword: settings?.ownerPassword || "",
    managerPin: settings?.managerPin || "",
    sessionTimeout: settings?.sessionTimeout || 30,
    autoLock: settings?.autoLock !== false,
    failedLoginProtection: settings?.failedLoginProtection !== false,
    maxFailedAttempts: settings?.maxFailedAttempts || 5,
    lockoutDuration: settings?.lockoutDuration || 15,
    requireTwoFactor: settings?.requireTwoFactor || false,
    auditLogEnabled: settings?.auditLogEnabled !== false,
    supportMode: settings?.supportMode || false,
    passwordMinLength: settings?.passwordMinLength || 8,
    requireUppercase: settings?.requireUppercase !== false,
    requireNumbers: settings?.requireNumbers !== false,
    requireSpecialChars: settings?.requireSpecialChars !== false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const securityScore = () => {
    let score = 0;
    if (formData.ownerPassword && formData.ownerPassword.length >= 8) score += 20;
    if (formData.managerPin && formData.managerPin.length === 4) score += 15;
    if (formData.failedLoginProtection) score += 15;
    if (formData.requireTwoFactor) score += 20;
    if (formData.auditLogEnabled) score += 15;
    if (formData.autoLock) score += 15;
    return score;
  };

  const getSecurityLevel = (score) => {
    if (score >= 80) return { level: "Strong", color: "#10b981" };
    if (score >= 60) return { level: "Good", color: "#3b82f6" };
    if (score >= 40) return { level: "Fair", color: "#f59e0b" };
    return { level: "Weak", color: "#ef4444" };
  };

  const score = securityScore();
  const securityLevel = getSecurityLevel(score);

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
          Security
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Manage access control and security settings
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Security Score */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 20
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `${securityLevel.color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: securityLevel.color }}>
                {score}
              </div>
              <div style={{ fontSize: 10, color: securityLevel.color }}>
                /100
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                Security Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: securityLevel.color, marginBottom: 4 }}>
                {securityLevel.level}
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                Based on your current security settings
              </div>
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Access Control
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Owner Password
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.ownerPassword}
                    onChange={(e) => handleChange('ownerPassword', e.target.value)}
                    placeholder="Enter owner password"
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      padding: "12px 16px",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Manager Override PIN
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showPin ? "text" : "password"}
                    value={formData.managerPin}
                    onChange={(e) => handleChange('managerPin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      fontSize: 15,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)"
                    }}
                  />
                  <button
                    onClick={() => setShowPin(!showPin)}
                    style={{
                      padding: "12px 16px",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
                  >
                    {showPin ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 30)}
                  min="5"
                  max="120"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)"
                  }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.autoLock}
                  onChange={(e) => handleChange('autoLock', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Auto-Lock
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Automatically lock after session timeout
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Login Protection */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Login Protection
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.failedLoginProtection}
                  onChange={(e) => handleChange('failedLoginProtection', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Failed Login Protection
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Lock account after multiple failed attempts
                  </div>
                </div>
              </label>

              {formData.failedLoginProtection && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                        Max Failed Attempts
                      </label>
                      <input
                        type="number"
                        value={formData.maxFailedAttempts}
                        onChange={(e) => handleChange('maxFailedAttempts', parseInt(e.target.value) || 5)}
                        min="3"
                        max="10"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          fontSize: 15,
                          border: "1px solid var(--cafe-border)",
                          borderRadius: 8,
                          background: "var(--cafe-bg-surface)",
                          color: "var(--cafe-text-primary)"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                        Lockout Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.lockoutDuration}
                        onChange={(e) => handleChange('lockoutDuration', parseInt(e.target.value) || 15)}
                        min="5"
                        max="60"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          fontSize: 15,
                          border: "1px solid var(--cafe-border)",
                          borderRadius: 8,
                          background: "var(--cafe-bg-surface)",
                          color: "var(--cafe-text-primary)"
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireTwoFactor}
                  onChange={(e) => handleChange('requireTwoFactor', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Two-Factor Authentication
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Additional security for sensitive operations
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Password Requirements
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={formData.passwordMinLength}
                  onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value) || 8)}
                  min="6"
                  max="20"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-primary)"
                  }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireUppercase}
                  onChange={(e) => handleChange('requireUppercase', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Uppercase Letters
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireNumbers}
                  onChange={(e) => handleChange('requireNumbers', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Numbers
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.requireSpecialChars}
                  onChange={(e) => handleChange('requireSpecialChars', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Require Special Characters
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Audit & Support */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Audit & Support
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.auditLogEnabled}
                  onChange={(e) => handleChange('auditLogEnabled', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Enable Audit Logging
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Log all security-related events
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.supportMode}
                  onChange={(e) => handleChange('supportMode', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    Support Mode
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                    Allow remote support access (use with caution)
                  </div>
                </div>
              </label>
            </div>
          </div>
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
