import React, { useState } from 'react';

export default function SimpleStaff({ staff = [], setStaff, onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    status: 'active'
  });

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setFormData({ name: '', role: '', phone: '', status: 'active' });
    setShowModal(true);
  };

  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      role: staffMember.role || '',
      phone: staffMember.phone || '',
      status: staffMember.status || 'active'
    });
    setShowModal(true);
  };

  const handleSaveStaff = () => {
    if (!formData.name.trim() || !formData.role.trim()) return;

    if (selectedStaff) {
      setStaff(staff.map(s => 
        s.id === selectedStaff.id 
          ? { ...s, ...formData, updatedAt: new Date().toISOString() }
          : s
      ));
    } else {
      const newStaff = {
        id: `s${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setStaff([...staff, newStaff]);
    }
    setShowModal(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(s => s.id !== staffId));
    }
  };

  const handleStatusToggle = (staffMember) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    setStaff(staff.map(s => 
      s.id === staffMember.id 
        ? { ...s, status: newStatus, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const activeStaffCount = staff.filter(s => s.status === 'active').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Staff Management
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Manage your team members
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
        {/* Controls */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
            <span style={{ color: '#111827', fontWeight: '600' }}>{activeStaffCount}</span> of <span style={{ color: '#111827', fontWeight: '600' }}>{staff.length}</span> active
          </div>
          <button
            onClick={handleAddStaff}
            style={{
              padding: '12px 24px',
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Add Staff
          </button>
        </div>

        {/* Staff Grid */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          {staff.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🍳</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                No staff members yet. Add your first team member!
              </div>
            </div>
          ) : (
            staff.map(staffMember => (
              <StaffCard
                key={staffMember.id}
                staff={staffMember}
                onEdit={() => handleEditStaff(staffMember)}
                onDelete={() => handleDeleteStaff(staffMember.id)}
                onStatusToggle={() => handleStatusToggle(staffMember)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden'
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedStaff ? 'Edit Staff' : 'Add Staff'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Baker, Cashier, Manager"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaff}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#111827',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {selectedStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffCard({ staff, onEdit, onDelete, onStatusToggle }) {
  const isActive = staff.status === 'active';
  
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity: isActive ? 1 : 0.6
    }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '6px' }}>
          {staff.name}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          👔 {staff.role} {staff.phone ? `• 📞 ${staff.phone}` : ''}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: isActive ? '#059669' : '#dc2626', 
          fontWeight: '500',
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          background: isActive ? '#f0fdf4' : '#fef2f2'
        }}>
          {isActive ? '✓ Active' : '✗ Inactive'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onStatusToggle}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
