import React from 'react';
// Staff & Roles Step for Setup Wizard
// Full staff management with RBAC/ABAC support

import { useState, useCallback } from "react";

const ROLES = [
  { id: 'manager', name: 'Manager', icon: '👔', description: 'Full operational access', permissions: ['orders', 'menu', 'staff', 'reports', 'settings'] },
  { id: 'supervisor', name: 'Supervisor', icon: '👤', description: 'Team lead access', permissions: ['orders', 'menu', 'staff'] },
  { id: 'cashier', name: 'Cashier', icon: '💳', description: 'Order processing only', permissions: ['orders'] },
  { id: 'waiter', name: 'Waiter', icon: '🍽️', description: 'Table service', permissions: ['orders', 'tables'] },
  { id: 'kitchen', name: 'Kitchen Staff', icon: '👨‍🍳', description: 'Kitchen operations', permissions: ['kitchen'] }
];

const PERMISSIONS = [
  { id: 'orders', name: 'Orders', description: 'Create and manage orders' },
  { id: 'menu', name: 'Menu Management', description: 'Edit menu items and prices' },
  { id: 'staff', name: 'Staff Management', description: 'Manage team members' },
  { id: 'reports', name: 'Reports', description: 'View sales and analytics' },
  { id: 'settings', name: 'Settings', description: 'Configure system settings' },
  { id: 'tables', name: 'Table Management', description: 'Manage table assignments' },
  { id: 'kitchen', name: 'Kitchen Display', description: 'View and manage kitchen orders' }
];

const DEFAULT_ROLE = 'cashier';

const emptyFormData = () => ({
  name: '',
  email: '',
  phone: '',
  role: DEFAULT_ROLE,
  // Seed with the default role's permissions so "custom permissions" always
  // reflects an explicit user choice, rather than an empty array that gets
  // silently swapped for role defaults on save (see handleAddStaff).
  permissions: ROLES.find(r => r.id === DEFAULT_ROLE)?.permissions || [],
  attributes: {
    department: '',
    location: '',
    shift: ''
  }
});

export default function StaffRolesStep({ settings, onNext, onBack, onSkip, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [staff, setStaff] = useState(settings?.staff || []);
  const [accessModel, setAccessModel] = useState(settings?.accessModel || 'rbac'); // 'rbac' or 'abac'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState(emptyFormData);

  const handleAddStaff = useCallback(() => {
    if (!formData.name || formData.name.trim() === '') {
      setError({ title: 'Error', message: 'Staff name is required' });
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError({ title: 'Error', message: 'Enter a valid email address' });
      return;
    }

    const isDuplicate = staff.some(s => {
      if (editingStaff && s.id === editingStaff.id) return false;
      const sameName = s.name.trim().toLowerCase() === trimmedName.toLowerCase();
      const sameEmail = trimmedEmail && s.email && s.email.trim().toLowerCase() === trimmedEmail.toLowerCase();
      return sameName || sameEmail;
    });
    if (isDuplicate) {
      setError({ title: 'Error', message: 'A staff member with this name or email already exists' });
      return;
    }

    const newStaff = {
      id: editingStaff?.id || (crypto.randomUUID ? crypto.randomUUID() : `staff-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      name: trimmedName,
      email: trimmedEmail,
      phone: formData.phone.trim(),
      role: formData.role,
      // formData.permissions is always seeded from the role (see emptyFormData /
      // role-select handler), so it's safe to save as-is: an intentionally
      // empty selection now means zero permissions instead of being coerced
      // back to the role's full default list.
      permissions: formData.permissions,
      attributes: formData.attributes,
      createdAt: editingStaff?.createdAt || new Date().toISOString()
    };

    let updatedStaff;
    if (editingStaff) {
      updatedStaff = staff.map(s => s.id === editingStaff.id ? newStaff : s);
    } else {
      updatedStaff = [...staff, newStaff];
    }

    setStaff(updatedStaff);
    setFormData(emptyFormData());
    setShowAddForm(false);
    setEditingStaff(null);
  }, [formData, staff, editingStaff, setError]);

  const handleEditStaff = useCallback((staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.role,
      permissions: staffMember.permissions || [],
      attributes: staffMember.attributes || { department: '', location: '', shift: '' }
    });
    setShowAddForm(true);
  }, []);

  const handleDeleteStaff = useCallback((staffId) => {
    setStaff(prev => prev.filter(s => s.id !== staffId));
  }, []);

  const handleTogglePermission = useCallback((permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  }, []);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      staff,
      accessModel
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // Non-fatal: private browsing, storage quota, or SSR context without
      // localStorage shouldn't prevent the user from advancing the wizard.
      console.warn('Could not persist settings to localStorage:', e);
    }
    onNext({ staff, accessModel });
  }, [staff, accessModel, settings, onNext]);

  return (
    <div className="staff-roles-step" style={{ maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        .staff-roles-step input,
        .staff-roles-step select,
        .staff-roles-step textarea {
          box-sizing: border-box;
        }
        .staff-roles-step [style*="grid-template-columns"] > div {
          min-width: 0;
        }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Staff & Roles Setup
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Add team members and configure their access permissions using RBAC or ABAC.
        </p>
      </div>

      {/* Access Model Selection */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            Access Control Model
          </h4>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button
            type="button"
            onClick={() => setAccessModel('rbac')}
            style={{
              flex: 1,
              padding: "16px",
              border: accessModel === 'rbac' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              background: accessModel === 'rbac' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
              RBAC (Role-Based)
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
              Permissions based on predefined roles
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAccessModel('abac')}
            style={{
              flex: 1,
              padding: "16px",
              border: accessModel === 'abac' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              background: accessModel === 'abac' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
              ABAC (Attribute-Based)
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
              Dynamic permissions based on attributes
            </div>
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>👥</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              Team Members ({staff.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null);
              setFormData(emptyFormData());
              setShowAddForm(true);
            }}
            style={{
              padding: "10px 20px",
              background: "var(--cafe-accent)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            + Add Staff
          </button>
        </div>

        {staff.length === 0 ? (
          <div style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--cafe-text-tertiary)",
            background: "var(--cafe-bg)",
            borderRadius: 12,
            border: "1px dashed var(--cafe-border)"
          }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>👥</span>
            <p style={{ fontSize: 14, margin: 0 }}>
              No staff members added yet. Click "Add Staff" to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {staff.map(staffMember => {
              const role = ROLES.find(r => r.id === staffMember.role);
              return (
                <div
                  key={staffMember.id}
                  style={{
                    padding: "16px",
                    background: "var(--cafe-bg)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24
                    }}>
                      {role?.icon || '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {staffMember.name}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                        {role?.name || staffMember.role} • {staffMember.email || staffMember.phone || 'No contact info'}
                      </div>
                      {accessModel === 'abac' && staffMember.attributes && (
                        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                          {staffMember.attributes.department && `Dept: ${staffMember.attributes.department}`}
                          {staffMember.attributes.shift && ` • Shift: ${staffMember.attributes.shift}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleEditStaff(staffMember)}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-info-bg)",
                        border: "1px solid var(--cafe-info-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--cafe-info)",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${staffMember.name} from the team? This can't be undone.`)) {
                          handleDeleteStaff(staffMember.id);
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-danger-bg)",
                        border: "1px solid var(--cafe-danger-border)",
                        borderRadius: 6,
                        fontSize: 12,
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
        )}
      </div>

      {/* Add/Edit Staff Form */}
      {showAddForm && (
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>{editingStaff ? '✏️' : '➕'}</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h4>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 9876543210"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Role
            </label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: role.id, permissions: role.permissions }))}
                  style={{
                    padding: "12px",
                    border: formData.role === role.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    background: formData.role === role.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{role.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{role.name}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-secondary)" }}>{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ABAC Attributes */}
          {accessModel === 'abac' && (
            <div style={{ marginBottom: 16, padding: 16, background: "var(--cafe-bg)", borderRadius: 10, border: "1px solid var(--cafe-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 12 }}>
                ABAC Attributes
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.attributes.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, attributes: { ...prev.attributes, department: e.target.value } }))}
                    placeholder="e.g., Kitchen"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 14,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.attributes.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, attributes: { ...prev.attributes, location: e.target.value } }))}
                    placeholder="e.g., Main Floor"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 14,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 6, display: "block" }}>
                    Shift
                  </label>
                  <input
                    type="text"
                    value={formData.attributes.shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, attributes: { ...prev.attributes, shift: e.target.value } }))}
                    placeholder="e.g., Morning"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 14,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 8,
                      background: "var(--cafe-bg-surface)",
                      color: "var(--cafe-text-primary)",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Permissions */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Custom Permissions (optional override)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERMISSIONS.map(permission => (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => handleTogglePermission(permission.id)}
                  style={{
                    padding: "8px 14px",
                    border: formData.permissions.includes(permission.id) ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                    borderRadius: 20,
                    background: formData.permissions.includes(permission.id) ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)"
                  }}
                  title={permission.description}
                >
                  {formData.permissions.includes(permission.id) ? '✓ ' : ''}{permission.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingStaff(null);
                setFormData(emptyFormData());
              }}
              style={{
                padding: "12px 24px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddStaff}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {isLoading ? 'Saving…' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
