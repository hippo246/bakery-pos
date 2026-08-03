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
      <div style={{ padding: isMobile ? "20px" : "32px", borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-elevated)" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--cafe-text-primary)", margin: "0 0 8px" }}>Team & Permissions</h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)", margin: 0 }}>Configure roles, permissions, and access control</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Role Defaults</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Default Role for New Staff</label>
                <select value={formData.defaultRole} onChange={(e) => handleChange('defaultRole', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }}>
                  <option value="cashier">Cashier</option>
                  <option value="server">Server</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.managerOverride} onChange={(e) => handleChange('managerOverride', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Manager Override</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Allow managers to override restricted actions</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.allowRoleChange} onChange={(e) => handleChange('allowRoleChange', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Allow Role Change</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Allow staff to change roles during shift</div></div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Cashier Permissions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {cashierPerms.map(perm => (
                <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: formData.cashierPermissions?.includes(perm.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", border: formData.cashierPermissions?.includes(perm.id) ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)", borderRadius: 8 }}>
                  <input type="checkbox" checked={formData.cashierPermissions?.includes(perm.id)} onChange={() => togglePermission('cashierPermissions', perm.id)} style={{ margin: 0 }} />
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{perm.name}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Kitchen Permissions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {kitchenPerms.map(perm => (
                <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px", background: formData.kitchenPermissions?.includes(perm.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", border: formData.kitchenPermissions?.includes(perm.id) ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)", borderRadius: 8 }}>
                  <input type="checkbox" checked={formData.kitchenPermissions?.includes(perm.id)} onChange={() => togglePermission('kitchenPermissions', perm.id)} style={{ margin: 0 }} />
                  <div style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{perm.name}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Attendance</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.requireClockIn} onChange={(e) => handleChange('requireClockIn', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Require Clock In</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Staff must clock in to access system</div></div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.trackAttendance} onChange={(e) => handleChange('trackAttendance', e.target.checked)} style={{ margin: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Track Attendance</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Track clock in/out times for reports</div></div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>PIN Behaviour</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>PIN Requirement</label>
              <select value={formData.pinBehaviour} onChange={(e) => handleChange('pinBehaviour', e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }}>
                <option value="required">Required for All Actions</option>
                <option value="sensitive">Required for Sensitive Actions</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Sessions</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>Max Concurrent Sessions per User</label>
              <input type="number" value={formData.maxConcurrentSessions} onChange={(e) => handleChange('maxConcurrentSessions', parseInt(e.target.value) || 1)} min="1" max="5" style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid var(--cafe-border)", borderRadius: 8, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)" }} />
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: "0 0 16px", textTransform: "uppercase" }}>Display</h3>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.showPermissionSummary} onChange={(e) => handleChange('showPermissionSummary', e.target.checked)} style={{ margin: 0 }} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Show Permission Summary</div><div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Display permission summary on staff cards</div></div>
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
