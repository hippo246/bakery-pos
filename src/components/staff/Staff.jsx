import React, { useState, useEffect } from 'react';

export default function SimpleStaff({ staff = [], setStaff, onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    status: 'active'
  });

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setStaffToDelete(staffId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      setStaff(staff.filter(s => s.id !== staffToDelete));
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
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
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              Staff Management
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Manage your team members
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', flex: 1 }}>
        {/* Controls */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: screenSize === 'small' ? '12px' : '16px',
          marginBottom: screenSize === 'small' ? '16px' : '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          gap: screenSize === 'small' ? '12px' : '0',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: '#111827' }}>
            <span style={{ color: '#111827', fontWeight: '600' }}>{activeStaffCount}</span> of <span style={{ color: '#111827', fontWeight: '600' }}>{staff.length}</span> active
          </div>
          <button
            onClick={handleAddStaff}
            style={{
              padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
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
          padding: screenSize === 'small' ? '16px' : '20px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          {staff.length === 0 ? (
            <div style={{ padding: screenSize === 'small' ? '40px 20px' : '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: screenSize === 'small' ? '40px' : '48px', marginBottom: '12px' }}>👨‍🍳</div>
              <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500' }}>
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
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                {selectedStaff ? 'Edit Staff' : 'Add Staff'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 12px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Enter staff name..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select role...</option>
                  <option value="Manager">Manager</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Chef">Chef</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Server">Server</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Enter phone number..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Remove Staff
            </h3>
            <p style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '24px' }}>
              Are you sure you want to remove this staff member?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setStaffToDelete(null);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStaff}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Notice
            </h3>
            <p style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
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
