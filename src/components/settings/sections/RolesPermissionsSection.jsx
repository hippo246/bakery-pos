import React from 'react';
import { useState } from "react";
import RoleManager from "../../permissions/RoleManager.jsx";
import UserAssignment from "../../permissions/UserAssignment.jsx";
import { isEmergencyMode, setEmergencyMode, getActivityLog, DEVICE_TYPES, setDeviceRestriction, getDeviceRestrictions } from "../../../utils/permissions.js";

// ── Roles & Permissions Section ─────────────────────────────────────────
export default function RolesPermissionsSection({ settings, setSettings, isMobile = false }) {
  const [emergencyMode, setEmergencyModeState] = useState(isEmergencyMode());
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activeTab, setActiveTab] = useState("roles"); // roles | users | devices
  const [currentDeviceId, setCurrentDeviceId] = useState("current_device");

  const handleToggleEmergencyMode = () => {
    const newState = !emergencyMode;
    setEmergencyMode(newState);
    setEmergencyModeState(newState);
  };

  const handleViewActivityLog = () => {
    setActivityLog(getActivityLog(50));
    setShowActivityLog(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          marginBottom: 8
        }}>
          Roles & Permissions
        </h2>
        <p style={{
          fontSize: 13,
          color: "var(--cafe-text-tertiary)",
          lineHeight: 1.5
        }}>
          Manage access control, roles, and permissions for your team. Configure who can view, edit, delete, and perform actions across all modules.
        </p>
      </div>

      {/* Emergency Mode Toggle */}
      <div style={{
        background: emergencyMode ? "var(--cafe-danger-bg)" : "var(--cafe-bg-card)",
        border: emergencyMode ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-border)",
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }}>
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: emergencyMode ? "var(--cafe-danger)" : "var(--cafe-text-primary)",
              marginBottom: 4
            }}>
              Emergency Mode
            </div>
            <div style={{
              fontSize: 12,
              color: emergencyMode ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)"
            }}>
              {emergencyMode 
                ? "All permissions are temporarily disabled. Only Owner can access." 
                : "Temporarily disable all permissions for maintenance or emergencies."}
            </div>
          </div>
          <button
            onClick={handleToggleEmergencyMode}
            style={{
              padding: "10px 20px",
              background: emergencyMode ? "var(--cafe-bg-surface)" : "var(--cafe-danger-bg)",
              border: emergencyMode ? "1px solid var(--cafe-border)" : "1px solid var(--cafe-danger-border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: emergencyMode ? "var(--cafe-text-secondary)" : "var(--cafe-danger)",
              cursor: "pointer"
            }}
          >
            {emergencyMode ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {/* Activity Log Button */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      }}>
        <button
          onClick={handleViewActivityLog}
          style={{
            padding: "12px 20px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cafe-text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span>📝</span>
          View Activity Log
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: 4,
        background: "var(--cafe-bg-surface)",
        padding: 4,
        borderRadius: 8,
        width: "fit-content"
      }}>
        <button
          onClick={() => setActiveTab("roles")}
          style={{
            padding: "10px 20px",
            background: activeTab === "roles" ? "var(--cafe-bg-card)" : "transparent",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === "roles" ? "var(--cafe-text-primary)" : "var(--cafe-text-tertiary)",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "10px 20px",
            background: activeTab === "users" ? "var(--cafe-bg-card)" : "transparent",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === "users" ? "var(--cafe-text-primary)" : "var(--cafe-text-tertiary)",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          style={{
            padding: "10px 20px",
            background: activeTab === "devices" ? "var(--cafe-bg-card)" : "transparent",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === "devices" ? "var(--cafe-text-primary)" : "var(--cafe-text-tertiary)",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          Devices
        </button>
      </div>

      {/* Activity Log Modal */}
      {showActivityLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setShowActivityLog(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: 600,
              maxHeight: "80vh",
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: 20,
              borderBottom: "1px solid var(--cafe-border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}>
                Permission Activity Log
              </h3>
              <button
                onClick={() => setShowActivityLog(false)}
                style={{
                  padding: "8px 12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: 16
            }}>
              {activityLog.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  No activity logged yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activityLog.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        padding: 12,
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4
                      }}>
                        <span style={{
                          fontWeight: 600,
                          color: "var(--cafe-text-primary)"
                        }}>
                          {entry.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span style={{
                          color: "var(--cafe-text-tertiary)"
                        }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{
                        color: "var(--cafe-text-secondary)",
                        fontSize: 11
                      }}>
                        User: {entry.userId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Manager or User Assignment or Device Restrictions */}
      {activeTab === "roles" ? (
        <RoleManager isMobile={isMobile} />
      ) : activeTab === "users" ? (
        <UserAssignment isMobile={isMobile} />
      ) : (
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
            marginBottom: 8
          }}>
            Device Restrictions
          </h3>
          <p style={{
            fontSize: 13,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 24
          }}>
            Limit which modules can be accessed from specific devices
          </p>

          {/* Current Device */}
          <div style={{
            marginBottom: 24
          }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              marginBottom: 8
            }}>
              Current Device Type
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12
            }}>
              {DEVICE_TYPES.map(device => (
                <button
                  key={device.id}
                  onClick={() => setDeviceRestriction(currentDeviceId, device.id)}
                  style={{
                    padding: "16px",
                    background: getDeviceRestrictions()[currentDeviceId] === device.id ? device.icon + "20" : "var(--cafe-bg-surface)",
                    border: getDeviceRestrictions()[currentDeviceId] === device.id ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8
                  }}>
                    <span style={{ fontSize: 20 }}>{device.icon}</span>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--cafe-text-primary)"
                    }}>
                      {device.name}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "var(--cafe-text-tertiary)"
                  }}>
                    {device.allowedModules.length} modules allowed
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div style={{
            padding: 16,
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--cafe-text-secondary)"
          }}>
            <strong>Note:</strong> Device restrictions are based on device fingerprinting. In production, this would automatically detect the device type and apply restrictions accordingly.
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 16
      }}>
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{
            fontSize: 24,
            marginBottom: 8
          }}>👥</div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 4
          }}>
            User Assignment
          </div>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)"
          }}>
            Assign roles to staff members and grant custom permissions
          </div>
        </div>

        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{
            fontSize: 24,
            marginBottom: 8
          }}>🔄</div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 4
          }}>
            Permission Overrides
          </div>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)"
          }}>
            Managers can temporarily grant access with PIN verification
          </div>
        </div>

        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{
            fontSize: 24,
            marginBottom: 8
          }}>📍</div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 4
          }}>
            Station Restrictions
          </div>
          <div style={{
            fontSize: 11,
            color: "var(--cafe-text-tertiary)"
          }}>
            Limit access based on work stations and devices
          </div>
        </div>
      </div>
    </div>
  );
}
