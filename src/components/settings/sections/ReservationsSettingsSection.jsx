import React from 'react';
// Reservations Settings Section - Reservation Configuration
import { useState, useCallback } from "react";

export default function ReservationsSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    defaultDuration: settings?.defaultDuration || 90,
    allowWalkIns: settings?.allowWalkIns !== false,
    gracePeriod: settings?.gracePeriod || 15,
    lateThreshold: settings?.lateThreshold || 10,
    autoCancelLate: settings?.autoCancelLate || false,
    enableWaitlist: settings?.enableWaitlist !== false,
    autoRelease: settings?.autoRelease || false,
    requireDeposit: settings?.requireDeposit || false,
    depositAmount: settings?.depositAmount || 100,
    maxPartySize: settings?.maxPartySize || 20,
    requirePhone: settings?.requirePhone !== false
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "32px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--cafe-text-primary)", margin: "0 0 8px" }}>Reservations</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0 }}>Configure reservation rules and timing</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Defaults</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Default Duration (minutes)</label>
                <input type="number" value={formData.defaultDuration} onChange={(e) => handleChange('defaultDuration', parseInt(e.target.value) || 90)} min="30" max="240" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Max Party Size</label>
                <input type="number" value={formData.maxPartySize} onChange={(e) => handleChange('maxPartySize', parseInt(e.target.value) || 20)} min="1" max="100" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Timing</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Grace Period (minutes)</label>
                <input type="number" value={formData.gracePeriod} onChange={(e) => handleChange('gracePeriod', parseInt(e.target.value) || 15)} min="0" max="60" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Late Threshold (minutes)</label>
                <input type="number" value={formData.lateThreshold} onChange={(e) => handleChange('lateThreshold', parseInt(e.target.value) || 10)} min="0" max="60" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.autoCancelLate} onChange={(e) => handleChange('autoCancelLate', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Auto-Cancel Late</div></div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Walk-Ins</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.allowWalkIns} onChange={(e) => handleChange('allowWalkIns', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Allow Walk-Ins</div></div>
            </label>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Waitlist</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.enableWaitlist} onChange={(e) => handleChange('enableWaitlist', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Enable Waitlist</div></div>
            </label>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Auto Release</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.autoRelease} onChange={(e) => handleChange('autoRelease', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Auto-Release Tables</div></div>
            </label>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Deposit</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.requireDeposit} onChange={(e) => handleChange('requireDeposit', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Require Deposit</div></div>
              </label>
              {formData.requireDeposit && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Deposit Amount (₹)</label>
                  <input type="number" value={formData.depositAmount} onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)} min="0" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Requirements</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.requirePhone} onChange={(e) => handleChange('requirePhone', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Require Phone Number</div></div>
            </label>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "32px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Changes</button>
      </div>
    </div>
  );
}
