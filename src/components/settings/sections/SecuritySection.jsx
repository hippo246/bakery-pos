import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function SecuritySection({ settings, setSettings, isMobile }) {
  const handleResetWelcomeScreen = () => {
    localStorage.removeItem('cafeos_visited');
    window.location.reload();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Session Management */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Session Management
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
                Auto Logout
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Automatically logout after inactivity
              </div>
            </div>
            <PremiumToggle
              value={settings.autoLogout || false}
              onChange={(enabled) => setSettings("autoLogout", enabled)}
              size="small"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.sessionTimeout || 30}
              onChange={e => setSettings("sessionTimeout", parseInt(e.target.value) || 30)}
              disabled={!settings.autoLogout}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="5"
              max="120"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                PIN Timeout
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Require PIN re-entry after timeout
              </div>
            </div>
            <PremiumToggle
              value={settings.pinTimeout || false}
              onChange={(enabled) => setSettings("pinTimeout", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Password Security */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Password Security
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Minimum Password Length</label>
            <input
              type="number"
              value={settings.minPasswordLength || 8}
              onChange={e => setSettings("minPasswordLength", parseInt(e.target.value) || 8)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="6"
              max="32"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Password Expiry (days)</label>
            <input
              type="number"
              value={settings.passwordExpiry || 90}
              onChange={e => setSettings("passwordExpiry", parseInt(e.target.value) || 90)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="0"
              max="365"
            />
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Require Special Characters
              </div>
            </div>
            <PremiumToggle
              value={settings.requireSpecialChars || true}
              onChange={(enabled) => setSettings("requireSpecialChars", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Require Numbers
              </div>
            </div>
            <PremiumToggle
              value={settings.requireNumbers || true}
              onChange={(enabled) => setSettings("requireNumbers", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Prevent Password Reuse
              </div>
            </div>
            <PremiumToggle
              value={settings.preventPasswordReuse || false}
              onChange={(enabled) => setSettings("preventPasswordReuse", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Access Control */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Access Control
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
                Require PIN for Sensitive Actions
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Ask for PIN when performing refunds, voids, or discounts
              </div>
            </div>
            <PremiumToggle
              value={settings.requirePinForSensitive || true}
              onChange={(enabled) => setSettings("requirePinForSensitive", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Trusted Devices
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Allow remember me on trusted devices
              </div>
            </div>
            <PremiumToggle
              value={settings.trustedDevices || false}
              onChange={(enabled) => setSettings("trustedDevices", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Two-Factor Authentication
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Require 2FA for admin accounts
              </div>
            </div>
            <PremiumToggle
              value={settings.twoFactorAuth || false}
              onChange={(enabled) => setSettings("twoFactorAuth", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Audit Log */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Audit Log
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
                Enable Audit Logging
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Log all sensitive actions for security review
              </div>
            </div>
            <PremiumToggle
              value={settings.auditLogging !== false}
              onChange={(enabled) => setSettings("auditLogging", enabled)}
              size="small"
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Log Retention (days)</label>
            <input
              type="number"
              value={settings.logRetention || 90}
              onChange={e => setSettings("logRetention", parseInt(e.target.value) || 90)}
              disabled={!settings.auditLogging}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="7"
              max="365"
            />
          </div>
          
          <button
            onClick={() => console.log("View Audit Log")}
            style={{
              ...input,
              padding: "10px 20px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              color: "var(--cafe-text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              width: "fit-content"
            }}
          >
            View Audit Log
          </button>
        </div>
      </PremiumCard>

      {/* System Reset */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          System Reset
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              Reset Welcome Screen
            </div>
            <div style={{
              fontSize: 10,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 12
            }}>
              Show the welcome screen again on next launch
            </div>
            <button
              onClick={handleResetWelcomeScreen}
              style={{
                ...input,
                padding: "10px 20px",
                background: "var(--cafe-accent-bg)",
                border: "1px solid var(--cafe-accent)",
                borderRadius: 8,
                color: "var(--cafe-accent)",
                cursor: "pointer",
                fontSize: 12,
                width: "fit-content"
              }}
            >
              Show Welcome Screen
            </button>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
