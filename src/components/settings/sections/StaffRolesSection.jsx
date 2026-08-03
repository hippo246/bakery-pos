import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function StaffRolesSection({ settings, setSettings, isMobile }) {
  const roles = [
    { id: "owner", name: "Owner", icon: "👑" },
    { id: "manager", name: "Manager", icon: "👔" },
    { id: "cashier", name: "Cashier", icon: "💰" },
    { id: "kitchen", name: "Kitchen", icon: "👨‍🍳" },
    { id: "waiter", name: "Waiter", icon: "🍽️" },
    { id: "inventory", name: "Inventory", icon: "📦" }
  ];

  const permissions = [
    { id: "dashboard", name: "Dashboard" },
    { id: "orders", name: "Orders" },
    { id: "kitchen", name: "Kitchen" },
    { id: "tables", name: "Tables" },
    { id: "inventory", name: "Inventory" },
    { id: "reservations", name: "Reservations" },
    { id: "reports", name: "Reports" },
    { id: "settings", name: "Settings" },
    { id: "displays", name: "Displays" },
    { id: "notifications", name: "Notifications" }
  ];

  // Simplified permission matrix (in real app, this would be from settings)
  const getPermissionLevel = (roleId, permissionId) => {
    // Owner has all permissions
    if (roleId === "owner") return "full";
    // Manager has most except settings
    if (roleId === "manager" && permissionId !== "settings") return "full";
    // Cashier has orders, tables
    if (roleId === "cashier" && (permissionId === "orders" || permissionId === "tables")) return "full";
    // Kitchen has kitchen
    if (roleId === "kitchen" && permissionId === "kitchen") return "full";
    // Waiter has orders, tables, reservations
    if (roleId === "waiter" && (permissionId === "orders" || permissionId === "tables" || permissionId === "reservations")) return "full";
    // Inventory has inventory
    if (roleId === "inventory" && permissionId === "inventory") return "full";
    return "none";
  };

  const getPermissionColor = (level) => {
    switch (level) {
      case "full": return "var(--cafe-success)";
      case "read": return "var(--cafe-warning)";
      case "none": return "var(--cafe-bg-surface)";
      default: return "var(--cafe-bg-surface)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Permission Matrix */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Permission Matrix
        </h4>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--cafe-text-secondary)",
                  borderBottom: "1px solid var(--cafe-border)",
                  whiteSpace: "nowrap"
                }}>
                  Role
                </th>
                {permissions.map(permission => (
                  <th key={permission.id} style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "var(--cafe-text-secondary)",
                    borderBottom: "1px solid var(--cafe-border)",
                    whiteSpace: "nowrap",
                    fontSize: 10
                  }}>
                    {permission.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td style={{
                    padding: "12px",
                    borderBottom: "1px solid var(--cafe-border-light)",
                    fontWeight: 500,
                    color: "var(--cafe-text-primary)",
                    whiteSpace: "nowrap"
                  }}>
                    <span style={{ marginRight: 8 }}>{role.icon}</span>
                    {role.name}
                  </td>
                  {permissions.map(permission => {
                    const level = getPermissionLevel(role.id, permission.id);
                    return (
                      <td key={permission.id} style={{
                        padding: "8px",
                        textAlign: "center",
                        borderBottom: "1px solid var(--cafe-border-light)"
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: getPermissionColor(level),
                          margin: "0 auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: level === "full" ? "#fff" : "var(--cafe-text-tertiary)",
                          border: level === "none" ? "1px solid var(--cafe-border-light)" : "none"
                        }}>
                          {level === "full" ? "✓" : level === "read" ? "👁" : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{
          marginTop: 16,
          display: "flex",
          gap: 16,
          fontSize: 10,
          color: "var(--cafe-text-tertiary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: "var(--cafe-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10
            }}>✓</div>
            <span>Full Access</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: "var(--cafe-warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10
            }}>👁</div>
            <span>Read Only</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--cafe-text-tertiary)",
              fontSize: 10
            }}>—</div>
            <span>No Access</span>
          </div>
        </div>
      </PremiumCard>

      {/* Role Management */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Role Management
        </h4>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 16
        }}>
          {roles.map(role => (
            <div key={role.id} style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>{role.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  marginBottom: 2
                }}>
                  {role.name}
                </div>
                <div style={{
                  fontSize: 10,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  {role.id === "owner" ? "Full system access" : 
                   role.id === "manager" ? "Operational control" :
                   role.id === "cashier" ? "POS & orders" :
                   role.id === "kitchen" ? "Kitchen operations" :
                   role.id === "waiter" ? "Service & tables" :
                   "Stock management"}
                </div>
              </div>
              <button style={{
                ...input,
                padding: "6px 12px",
                fontSize: 10,
                background: "var(--cafe-bg-card)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 6,
                cursor: "pointer",
                color: "var(--cafe-text-secondary)"
              }}>
                Edit
              </button>
            </div>
          ))}
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
                Auto-logout Idle Sessions
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
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              min="5"
              max="120"
            />
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
