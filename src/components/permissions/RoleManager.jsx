import React from 'react';
import { useState, useEffect } from "react";
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  cloneRole,
  DEFAULT_ROLES 
} from "../../utils/permissions.js";
import PermissionMatrix from "./PermissionMatrix.jsx";

// ── Role Manager Component ───────────────────────────────────────────────
export default function RoleManager({ isMobile = false }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    icon: "🔑",
    color: "#2196F3",
    description: ""
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = () => {
    setRoles(getRoles());
  };

  const handlePermissionChange = (moduleId, permissionId) => {
    if (!selectedRole || selectedRole.isSystem) return;

    const updatedPermissions = { ...selectedRole.permissions };
    if (!updatedPermissions[moduleId]) {
      updatedPermissions[moduleId] = [];
    }

    const index = updatedPermissions[moduleId].indexOf(permissionId);
    if (index > -1) {
      updatedPermissions[moduleId].splice(index, 1);
    } else {
      updatedPermissions[moduleId].push(permissionId);
    }

    const updatedRole = updateRole(selectedRole.id, { permissions: updatedPermissions });
    if (updatedRole) {
      setSelectedRole(updatedRole);
      loadRoles();
    }
  };

  const handleCreateRole = () => {
    if (!newRole.name.trim()) return;

    const created = createRole({
      name: newRole.name,
      icon: newRole.icon,
      color: newRole.color,
      description: newRole.description,
      permissions: {}
    });

    if (created) {
      loadRoles();
      setSelectedRole(created);
      setNewRole({ name: "", icon: "🔑", color: "#2196F3", description: "" });
      setIsCreating(false);
    }
  };

  const handleDeleteRole = (roleId) => {
    if (deleteRole(roleId)) {
      loadRoles();
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
    }
  };

  const handleCloneRole = (roleId) => {
    const cloned = cloneRole(roleId);
    if (cloned) {
      loadRoles();
      setSelectedRole(cloned);
    }
  };

  const roleIcons = ["🔑", "👑", "🎯", "💳", "👨‍🍳", "🍽️", "📦", "📊", "⚙️", "🔔", "🚀", "⭐"];
  const roleColors = ["#2196F3", "#FFD700", "#4CAF50", "#FF9800", "#9C27B0", "#607D8B", "#00BCD4", "#F44336", "#795548", "#607D8B"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 16,
        flexDirection: isMobile ? "column" : "row"
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? 20 : 24,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            marginBottom: 4
          }}>
            Roles & Permissions
          </h2>
          <p style={{
            fontSize: 13,
            color: "var(--cafe-text-tertiary)"
          }}>
            Manage access control for your team
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: "10px 20px",
            background: "var(--cafe-accent)",
            border: "1px solid var(--cafe-accent)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span>➕</span>
          Create Role
        </button>
      </div>

      {/* Create Role Form */}
      {isCreating && (
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 20
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 16
          }}>
            Create New Role
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 16
          }}>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                marginBottom: 6
              }}>
                Role Name
              </label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Bar Staff"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                marginBottom: 6
              }}>
                Icon
              </label>
              <div style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap"
              }}>
                {roleIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewRole({ ...newRole, icon })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: newRole.icon === icon ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                      border: newRole.icon === icon ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                      fontSize: 16,
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                marginBottom: 6
              }}>
                Color
              </label>
              <div style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap"
              }}>
                {roleColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewRole({ ...newRole, color })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: color,
                      border: newRole.color === color ? "2px solid var(--cafe-accent)" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                marginBottom: 6
              }}>
                Description
              </label>
              <input
                type="text"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
          </div>
          <div style={{
            display: "flex",
            gap: 12
          }}>
            <button
              onClick={handleCreateRole}
              style={{
                padding: "10px 20px",
                background: "var(--cafe-accent)",
                border: "1px solid var(--cafe-accent)",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Create Role
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewRole({ name: "", icon: "🔑", color: "#2196F3", description: "" });
              }}
              style={{
                padding: "10px 20px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16
      }}>
        {roles.map(role => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            style={{
              background: "var(--cafe-bg-card)",
              border: selectedRole?.id === role.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 12,
              padding: 16,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: role.color + "20",
                border: `2px solid ${role.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20
              }}>
                {role.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  marginBottom: 2
                }}>
                  {role.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  {role.description}
                </div>
              </div>
              {role.isSystem && (
                <span style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border-light)",
                  borderRadius: 4,
                  color: "var(--cafe-text-tertiary)",
                  textTransform: "uppercase"
                }}>
                  System
                </span>
              )}
            </div>
            <div style={{
              display: "flex",
              gap: 8
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloneRole(role.id);
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer"
                }}
              >
                Clone
              </button>
              {!role.isSystem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete role "${role.name}"?`)) {
                      handleDeleteRole(role.id);
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "var(--cafe-danger-bg)",
                    border: "1px solid var(--cafe-danger-border)",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--cafe-danger)",
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20
          }}>
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--cafe-text-primary)",
                marginBottom: 4
              }}>
                {selectedRole.name} Permissions
              </h3>
              <p style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)"
              }}>
                {selectedRole.isSystem ? "System role - cannot be modified" : "Custom role"}
              </p>
            </div>
            {!selectedRole.isSystem && (
              <button
                onClick={() => setSelectedRole(null)}
                style={{
                  padding: "8px 16px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            )}
          </div>
          <PermissionMatrix
            role={selectedRole}
            onPermissionChange={selectedRole.isSystem ? null : handlePermissionChange}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
}
