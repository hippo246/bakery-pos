import React from 'react';
import { useState, useEffect } from "react";
import { 
  getRoles, 
  assignRoleToUser, 
  getUserPermissions, 
  setUserPermissions,
  STATIONS,
  DEVICE_TYPES,
  setStationRestriction,
  removeStationRestriction,
  getUserStation
} from "../../utils/permissions.js";

// ── User Assignment Component ───────────────────────────────────────────
export default function UserAssignment({ isMobile = false }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    pin: ""
  });

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const loadRoles = () => {
    setRoles(getRoles());
  };

  const loadUsers = () => {
    // Mock users - in production this would come from your user management system
    const mockUsers = [
      { id: "user_1", name: "John Smith", email: "john@cafe.com", roleId: "manager" },
      { id: "user_2", name: "Sarah Johnson", email: "sarah@cafe.com", roleId: "cashier" },
      { id: "user_3", name: "Mike Chen", email: "mike@cafe.com", roleId: "kitchen" },
      { id: "user_4", name: "Emily Davis", email: "emily@cafe.com", roleId: "waiter" }
    ];
    setUsers(mockUsers);
  };

  const handleAssignRole = (userId, roleId) => {
    assignRoleToUser(userId, roleId);
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, roleId } : u
    );
    setUsers(updatedUsers);
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, roleId });
    }
  };

  const handleAssignStation = (userId, stationId) => {
    if (stationId === null) {
      removeStationRestriction(userId);
    } else {
      setStationRestriction(userId, stationId);
    }
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.pin) return;

    const createdUser = {
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      pin: newUser.pin,
      roleId: null
    };

    setUsers([...users, createdUser]);
    setNewUser({ name: "", email: "", pin: "" });
    setIsCreating(false);
  };

  const handleDeleteUser = (userId) => {
    if (confirm("Delete this user?")) {
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    }
  };

  const getRoleForUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.roleId) return null;
    return roles.find(r => r.id === user.roleId);
  };

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
            User Assignment
          </h2>
          <p style={{
            fontSize: 13,
            color: "var(--cafe-text-tertiary)"
          }}>
            Assign roles and permissions to staff members
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
          Add User
        </button>
      </div>

      {/* Create User Form */}
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
            Add New User
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
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
                Name
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Full name"
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
                Email
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Email address"
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
                PIN (4 digits)
              </label>
              <input
                type="password"
                value={newUser.pin}
                onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                placeholder="****"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--cafe-text-primary)",
                  outline: "none",
                  letterSpacing: "4px",
                  textAlign: "center"
                }}
              />
            </div>
          </div>
          <div style={{
            display: "flex",
            gap: 12
          }}>
            <button
              onClick={handleCreateUser}
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
              Add User
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewUser({ name: "", email: "", pin: "" });
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

      {/* Users List */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16
      }}>
        {users.map(user => {
          const role = getRoleForUser(user.id);
          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              style={{
                background: "var(--cafe-bg-card)",
                border: selectedUser?.id === user.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
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
                  background: role ? role.color + "20" : "var(--cafe-bg-surface)",
                  border: role ? `2px solid ${role.color}` : "1px solid var(--cafe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}>
                  {role ? role.icon : "👤"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    marginBottom: 2
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "var(--cafe-text-tertiary)"
                  }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{
                  fontSize: 12,
                  color: role ? "var(--cafe-text-secondary)" : "var(--cafe-text-tertiary)"
                }}>
                  {role ? role.name : "No role assigned"}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(user.id);
                  }}
                  style={{
                    padding: "6px 12px",
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Assignment */}
      {selectedUser && (
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
                Assign Role to {selectedUser.name}
              </h3>
              <p style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)"
              }}>
                Select a role to assign permissions
              </p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
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
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24
          }}>
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleAssignRole(selectedUser.id, role.id)}
                style={{
                  padding: "16px",
                  background: selectedUser.roleId === role.id ? role.color + "20" : "var(--cafe-bg-surface)",
                  border: selectedUser.roleId === role.id ? `2px solid ${role.color}` : "1px solid var(--cafe-border)",
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
                  <span style={{ fontSize: 20 }}>{role.icon}</span>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)"
                  }}>
                    {role.name}
                  </div>
                </div>
                <div style={{
                  fontSize: 11,
                  color: "var(--cafe-text-tertiary)"
                }}>
                  {role.description}
                </div>
              </button>
            ))}
          </div>

          {/* Station Assignment */}
          <div style={{
            borderTop: "1px solid var(--cafe-border-light)",
            paddingTop: 20
          }}>
            <h4 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              marginBottom: 12
            }}>
              Station Restriction
            </h4>
            <p style={{
              fontSize: 12,
              color: "var(--cafe-text-tertiary)",
              marginBottom: 16
            }}>
              Limit this user to specific work stations
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10
            }}>
              <button
                onClick={() => handleAssignStation(selectedUser.id, null)}
                style={{
                  padding: "12px",
                  background: !getUserStation(selectedUser.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  border: !getUserStation(selectedUser.id) ? "1px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--cafe-text-primary)"
                }}
              >
                No Restriction
              </button>
              {STATIONS.map(station => (
                <button
                  key={station.id}
                  onClick={() => handleAssignStation(selectedUser.id, station.id)}
                  style={{
                    padding: "12px",
                    background: getUserStation(selectedUser.id) === station.id ? station.icon + "20" : "var(--cafe-bg-surface)",
                    border: getUserStation(selectedUser.id) === station.id ? "1px solid var(--cafe-border)" : "1px solid var(--cafe-border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--cafe-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>{station.icon}</span>
                  {station.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
