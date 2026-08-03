import React from 'react';
import { useState, useMemo } from "react";
import { MODULES, PERMISSION_TYPES } from "../../utils/permissions.js";

// ── Permission Matrix Component ───────────────────────────────────────────
export default function PermissionMatrix({ role, onPermissionChange, isMobile = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState(new Set());

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery) return MODULES;
    const query = searchQuery.toLowerCase();
    return MODULES.filter(module => 
      module.name.toLowerCase().includes(query) || 
      module.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter permission types based on search
  const filteredPermissionTypes = useMemo(() => {
    if (!searchQuery) return PERMISSION_TYPES;
    const query = searchQuery.toLowerCase();
    return PERMISSION_TYPES.filter(perm => 
      perm.name.toLowerCase().includes(query) || 
      perm.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const togglePermission = (moduleId, permissionId) => {
    if (onPermissionChange) {
      onPermissionChange(moduleId, permissionId);
    }
  };

  const toggleModuleExpanded = (moduleId) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const hasPermission = (moduleId, permissionId) => {
    if (!role || !role.permissions) return false;
    return role.permissions[moduleId]?.includes(permissionId) || false;
  };

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search */}
        <div style={{
          position: "relative",
          marginBottom: 8
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 8,
              fontSize: 14,
              color: "var(--cafe-text-primary)",
              outline: "none"
            }}
          />
          <span style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16
          }}>🔍</span>
        </div>

        {/* Mobile: Grouped cards */}
        {filteredModules.map(module => {
          const modulePerms = filteredPermissionTypes.filter(perm => 
            hasPermission(module.id, perm.id)
          );
          const isExpanded = expandedModules.has(module.id);

          return (
            <div
              key={module.id}
              style={{
                background: "var(--cafe-bg-card)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 12,
                overflow: "hidden"
              }}
            >
              {/* Module Header */}
              <div
                onClick={() => toggleModuleExpanded(module.id)}
                style={{
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  borderBottom: isExpanded ? "1px solid var(--cafe-border-light)" : "none"
                }}
              >
                <span style={{ fontSize: 24 }}>{module.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)"
                  }}>
                    {module.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: "var(--cafe-text-tertiary)",
                    marginTop: 2
                  }}>
                    {modulePerms.length} permissions enabled
                  </div>
                </div>
                <span style={{
                  fontSize: 12,
                  color: "var(--cafe-text-tertiary)",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s"
                }}>▼</span>
              </div>

              {/* Permissions */}
              {isExpanded && (
                <div style={{ padding: 12 }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8
                  }}>
                    {filteredPermissionTypes.map(perm => (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(module.id, perm.id)}
                        style={{
                          padding: "10px 12px",
                          background: hasPermission(module.id, perm.id)
                            ? "var(--cafe-accent-bg)"
                            : "var(--cafe-bg-surface)",
                          border: hasPermission(module.id, perm.id)
                            ? "1px solid var(--cafe-accent-border)"
                            : "1px solid var(--cafe-border)",
                          borderRadius: 8,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.15s"
                        }}
                      >
                        <span style={{
                          fontSize: hasPermission(module.id, perm.id) ? 16 : 14,
                          opacity: hasPermission(module.id, perm.id) ? 1 : 0.3
                        }}>
                          {hasPermission(module.id, perm.id) ? "✓" : "○"}
                        </span>
                        <div>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--cafe-text-primary)"
                          }}>
                            {perm.name}
                          </div>
                          <div style={{
                            fontSize: 10,
                            color: "var(--cafe-text-tertiary)"
                          }}>
                            {perm.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: Matrix view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search */}
      <div style={{
        position: "relative",
        marginBottom: 8
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search permissions..."
          style={{
            width: "100%",
            padding: "10px 16px 10px 40px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--cafe-text-primary)",
            outline: "none"
          }}
        />
        <span style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 14
        }}>🔍</span>
      </div>

      {/* Matrix Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `200px repeat(${filteredPermissionTypes.length}, minmax(80px, 1fr))`,
        gap: 4,
        padding: "8px 12px",
        background: "var(--cafe-bg-surface)",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 11,
        color: "var(--cafe-text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        <div>Module</div>
        {filteredPermissionTypes.map(perm => (
          <div key={perm.id} style={{ textAlign: "center" }}>
            {perm.name}
          </div>
        ))}
      </div>

      {/* Matrix Rows */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}>
        {filteredModules.map(module => (
          <div
            key={module.id}
            style={{
              display: "grid",
              gridTemplateColumns: `200px repeat(${filteredPermissionTypes.length}, minmax(80px, 1fr))`,
              gap: 4,
              padding: "8px 12px",
              background: "var(--cafe-bg-card)",
              borderRadius: 6,
              alignItems: "center",
              transition: "background 0.15s"
            }}
          >
            {/* Module Name */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--cafe-text-primary)"
            }}>
              <span>{module.icon}</span>
              {module.name}
            </div>

            {/* Permission Toggles */}
            {filteredPermissionTypes.map(perm => (
              <button
                key={perm.id}
                onClick={() => togglePermission(module.id, perm.id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: hasPermission(module.id, perm.id)
                    ? "1px solid var(--cafe-accent)"
                    : "1px solid var(--cafe-border)",
                  background: hasPermission(module.id, perm.id)
                    ? "var(--cafe-accent)"
                    : "var(--cafe-bg-surface)",
                  color: hasPermission(module.id, perm.id)
                    ? "#fff"
                    : "var(--cafe-text-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  transition: "all 0.15s",
                  fontWeight: hasPermission(module.id, perm.id) ? 600 : 400
                }}
                title={perm.description}
              >
                {hasPermission(module.id, perm.id) ? "✓" : "○"}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        gap: 16,
        padding: 12,
        background: "var(--cafe-bg-surface)",
        borderRadius: 8,
        fontSize: 11,
        color: "var(--cafe-text-tertiary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "var(--cafe-accent)",
            border: "1px solid var(--cafe-accent)"
          }} />
          <span>Granted</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)"
          }} />
          <span>Denied</span>
        </div>
      </div>
    </div>
  );
}
