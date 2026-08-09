import React from 'react';
// Team & Permissions Settings Section - Role Management
import { useState, useCallback } from "react";

export default function TeamPermissionsSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState({
    defaultRole: settings?.defaultRole || "cashier",
    managerOverride: settings?.managerOverride !== false,
    cashierPermissions: settings?.cashierPermissions || ["orders", "payments"],
    kitchenPermissions: settings?.kitchenPermissions || ["view", "complete"],
    requireClockIn: settings?.requireClockIn || false,
    trackAttendance: settings?.trackAttendance !== false,
    pinBehaviour: settings?.pinBehaviour || "required",
    allowRoleChange: settings?.allowRoleChange || false,
    showPermissionSummary: settings?.showPermissionSummary !== false,
    maxConcurrentSessions: settings?.maxConcurrentSessions || 1
  });

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const togglePermission = (category, permission) => {
    const current = formData[category] || [];
    if (current.includes(permission)) {
      handleChange(category, current.filter(p => p !== permission));
    } else {
      handleChange(category, [...current, permission]);
    }
  };

  const cashierPerms = [
    { id: "orders", name: "Create Orders" },
    { id: "payments", name: "Process Payments" },
    { id: "refunds", name: "Process Refunds" },
    { id: "void", name: "Void Items" },
    { id: "discounts", name: "Apply Discounts" },
    { id: "reports", name: "View Reports" },
    { id: "settings", name: "Access Settings" }
  ];

  const kitchenPerms = [
    { id: "view", name: "View Orders" },
    { id: "complete", name: "Complete Orders" },
    { id: "recall", name: "Recall Orders" },
    { id: "modify", name: "Modify Orders" },
    { id: "inventory", name: "Manage Inventory" }
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isMobile ? "20px" : "28px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--cafe-text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Team & Permissions</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0, fontWeight: 500 }}>Configure roles, permissions, and access control</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role Defaults</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Default Role for New Staff</label>
                <select value={formData.defaultRole} onChange={(e) => handleChange('defaultRole', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                  <option value="cashier">Cashier</option>
                  <option value="server">Server</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.managerOverride} onChange={(e) => handleChange('managerOverride', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Manager Override</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Allow managers to override restricted actions</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.allowRoleChange} onChange={(e) => handleChange('allowRoleChange', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Allow Role Change</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Allow staff to change roles during shift</div></div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cashier Permissions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {cashierPerms.map(perm => (
                <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: formData.cashierPermissions?.includes(perm.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", border: formData.cashierPermissions?.includes(perm.id) ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)", borderRadius: 12, transition: "all 0.2s" }} onMouseOver={e => { if (!formData.cashierPermissions?.includes(perm.id)) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }} onMouseOut={e => { if (!formData.cashierPermissions?.includes(perm.id)) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}>
                  <input type="checkbox" checked={formData.cashierPermissions?.includes(perm.id)} onChange={() => togglePermission('cashierPermissions', perm.id)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: formData.cashierPermissions?.includes(perm.id) ? "var(--cafe-accent)" : "var(--cafe-text-secondary)" }}>{perm.name}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kitchen Permissions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {kitchenPerms.map(perm => (
                <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: formData.kitchenPermissions?.includes(perm.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", border: formData.kitchenPermissions?.includes(perm.id) ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)", borderRadius: 12, transition: "all 0.2s" }} onMouseOver={e => { if (!formData.kitchenPermissions?.includes(perm.id)) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }} onMouseOut={e => { if (!formData.kitchenPermissions?.includes(perm.id)) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}>
                  <input type="checkbox" checked={formData.kitchenPermissions?.includes(perm.id)} onChange={() => togglePermission('kitchenPermissions', perm.id)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: formData.kitchenPermissions?.includes(perm.id) ? "var(--cafe-accent)" : "var(--cafe-text-secondary)" }}>{perm.name}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Attendance</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.requireClockIn} onChange={(e) => handleChange('requireClockIn', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Require Clock In</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Staff must clock in to access system</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
                <input type="checkbox" checked={formData.trackAttendance} onChange={(e) => handleChange('trackAttendance', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Track Attendance</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Track clock in/out times for reports</div></div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>PIN Behaviour</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>PIN Requirement</label>
              <select value={formData.pinBehaviour} onChange={(e) => handleChange('pinBehaviour', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                <option value="required">Required for All Actions</option>
                <option value="sensitive">Required for Sensitive Actions</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sessions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8, display: "block" }}>Max Concurrent Sessions per User</label>
              <input type="number" value={formData.maxConcurrentSessions} onChange={(e) => handleChange('maxConcurrentSessions', parseInt(e.target.value) || 1)} min="1" max="5" style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid var(--cafe-border-light)", borderRadius: 12, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Display</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
              <input type="checkbox" checked={formData.showPermissionSummary} onChange={(e) => handleChange('showPermissionSummary', e.target.checked)} style={{ margin: 0, width: 18, height: 18, accentColor: 'var(--cafe-accent)' }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Show Permission Summary</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>Display permission summary on staff cards</div></div>
            </label>
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px" : "28px", borderTop: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "12px 32px", background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Save Changes</button>
      </div>
    </div>
  );
}
