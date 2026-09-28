import React, { useState, useEffect } from 'react';

const safeLocalStorageGet = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const safeLocalStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

const ROLE_PERMISSIONS = {
  cashier: [
    'view_orders',
    'create_orders',
    'process_payments',
    'view_menu',
    'view_customers'
  ],
  manager: [
    'view_orders',
    'create_orders',
    'process_payments',
    'view_menu',
    'edit_menu',
    'view_customers',
    'edit_customers',
    'view_reports',
    'manage_staff',
    'view_settings',
    'edit_settings'
  ],
  admin: [
    'view_orders',
    'create_orders',
    'process_payments',
    'view_menu',
    'edit_menu',
    'delete_menu',
    'view_customers',
    'edit_customers',
    'delete_customers',
    'view_reports',
    'export_reports',
    'manage_staff',
    'manage_roles',
    'view_settings',
    'edit_settings',
    'system_admin'
  ],
  kitchen: [
    'view_kitchen',
    'update_order_status',
    'view_menu'
  ]
};

const PERMISSION_LABELS = {
  'view_orders': 'View Orders',
  'create_orders': 'Create Orders',
  'process_payments': 'Process Payments',
  'view_menu': 'View Menu',
  'edit_menu': 'Edit Menu',
  'delete_menu': 'Delete Menu',
  'view_customers': 'View Customers',
  'edit_customers': 'Edit Customers',
  'delete_customers': 'Delete Customers',
  'view_reports': 'View Reports',
  'export_reports': 'Export Reports',
  'manage_staff': 'Manage Staff',
  'manage_roles': 'Manage Roles',
  'view_settings': 'View Settings',
  'edit_settings': 'Edit Settings',
  'system_admin': 'System Admin',
  'view_kitchen': 'View Kitchen',
  'update_order_status': 'Update Order Status'
};

export default function RoleAccessPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [customPermissions, setCustomPermissions] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const loadedUsers = safeLocalStorageGet('users', []);
    setUsers(loadedUsers);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCustomPermissions(user.permissions || ROLE_PERMISSIONS[user.role] || []);
    setShowPermissionModal(true);
  };

  const handlePermissionToggle = (permission) => {
    setCustomPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const savePermissions = () => {
    if (selectedUser) {
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id
          ? { ...user, permissions: customPermissions }
          : user
      );
      setUsers(updatedUsers);
      safeLocalStorageSet('users', updatedUsers);
      setShowPermissionModal(false);
      setSelectedUser(null);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, role: newRole, permissions: ROLE_PERMISSIONS[newRole] }
        : user
    );
    setUsers(updatedUsers);
    safeLocalStorageSet('users', updatedUsers);
  };

  const addUser = () => {
    const newUser = {
      id: `USER-${Date.now()}`,
      name: 'New User',
      email: '',
      role: 'cashier',
      permissions: ROLE_PERMISSIONS.cashier,
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    safeLocalStorageSet('users', updatedUsers);
  };

  const deleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      safeLocalStorageSet('users', updatedUsers);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
          Role-Based Access Control
        </h2>
        <button
          onClick={addUser}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Add User
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Name
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Email
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Role
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Permissions
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1a1a1a' }}>
                  {user.name}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                  {user.email || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      background: '#ffffff'
                    }}
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </td>
                <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                  {user.permissions?.length || 0} permissions
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUserSelect(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#8b5cf6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Permissions
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
              Edit Permissions: {selectedUser.name}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Role
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setCustomPermissions(ROLE_PERMISSIONS[newRole]);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: '#ffffff'
                }}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="kitchen">Kitchen</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Custom Permissions
              </label>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '12px'
              }}>
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#1a1a1a' }}>
                      <input
                        type="checkbox"
                        checked={customPermissions.includes(key)}
                        onChange={() => handlePermissionToggle(key)}
                        style={{ marginRight: '8px' }}
                      />
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedUser(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
