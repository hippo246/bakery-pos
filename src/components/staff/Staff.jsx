import React, { useState, useEffect } from 'react';

export default function SimpleStaff({ staff = [], setStaff, orders = [], onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [activeTab, setActiveTab] = useState('staff');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    status: 'active',
    hourlyRate: 0,
    permissions: {
      viewOrders: false,
      editOrders: false,
    deleteOrders: false,
      viewReports: false,
      manageStaff: false,
      manageSettings: false,
      processPayments: false,
      manageInventory: false
    }
  });

  // Scheduling state
  const [schedules, setSchedules] = useState([
    { id: 1, staffId: 's1', staffName: 'Rahul Sharma', day: 'Monday', startTime: '09:00', endTime: '18:00', status: 'scheduled' },
    { id: 2, staffId: 's2', staffName: 'Priya Singh', day: 'Monday', startTime: '10:00', endTime: '19:00', status: 'scheduled' }
  ]);

  // Performance tracking state
  const [performanceData, setPerformanceData] = useState([
    { id: 1, staffId: 's1', staffName: 'Rahul Sharma', ordersServed: 45, totalSales: 12500, avgOrderValue: 278, rating: 4.5 },
    { id: 2, staffId: 's2', staffName: 'Priya Singh', ordersServed: 38, totalSales: 9800, avgOrderValue: 258, rating: 4.2 }
  ]);

  // Payroll state
  const [payrollData, setPayrollData] = useState([
    { id: 1, staffId: 's1', staffName: 'Rahul Sharma', hoursWorked: 160, hourlyRate: 150, totalPay: 24000, bonus: 2000, deductions: 0, netPay: 26000, period: 'January 2024' },
    { id: 2, staffId: 's2', staffName: 'Priya Singh', hoursWorked: 145, hourlyRate: 140, totalPay: 20300, bonus: 1500, deductions: 500, netPay: 21300, period: 'January 2024' }
  ]);

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
    setFormData({ 
      name: '', 
      role: '', 
      phone: '', 
      status: 'active',
      hourlyRate: 0,
      permissions: {
        viewOrders: false,
        editOrders: false,
        deleteOrders: false,
        viewReports: false,
        manageStaff: false,
        manageSettings: false,
        processPayments: false,
        manageInventory: false
      }
    });
    setShowModal(true);
  };

  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      role: staffMember.role || '',
      phone: staffMember.phone || '',
      status: staffMember.status || 'active',
      hourlyRate: staffMember.hourlyRate || 0,
      permissions: staffMember.permissions || {
        viewOrders: false,
        editOrders: false,
        deleteOrders: false,
        viewReports: false,
        manageStaff: false,
        manageSettings: false,
        processPayments: false,
        manageInventory: false
      }
    });
    setShowModal(true);
  };

  const handleViewStaff = (staffMember) => {
    setViewingStaff(staffMember);
    setShowViewModal(true);
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
      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '12px 16px' : '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        overflow: 'auto'
      }}>
        {['staff', 'scheduling', 'payroll', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: activeTab === tab ? '#111827' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#6b7280',
              border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'staff' && (
          <>
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
                onView={() => handleViewStaff(staffMember)}
                onDelete={() => handleDeleteStaff(staffMember.id)}
                onStatusToggle={() => handleStatusToggle(staffMember)}
              />
            ))
          )}
        </div>
          </>
        )}

        {activeTab === 'scheduling' && (
          <>
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                📅 Staff Scheduling
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Staff</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Day</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Start Time</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>End Time</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule, index) => (
                      <tr key={schedule.id} style={{ borderBottom: index < schedules.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{schedule.staffName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{schedule.day}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{schedule.startTime}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{schedule.endTime}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: schedule.status === 'scheduled' ? '#10b981' : '#f59e0b',
                            color: '#ffffff'
                          }}>
                            {schedule.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                + Add Schedule
              </button>
            </div>
          </>
        )}

        {activeTab === 'payroll' && (
          <>
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                💰 Payroll Management
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Staff</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Hours</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Rate/Hr</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Bonus</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Deductions</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((payroll, index) => (
                      <tr key={payroll.id} style={{ borderBottom: index < payrollData.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{payroll.staffName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{payroll.hoursWorked}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>₹{payroll.hourlyRate}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>₹{payroll.totalPay}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>+₹{payroll.bonus}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>-₹{payroll.deductions}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '700' }}>₹{payroll.netPay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Generate Payroll
              </button>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                📊 Performance Tracking
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Staff</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Orders</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Sales</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Avg Order</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((perf, index) => (
                      <tr key={perf.id} style={{ borderBottom: index < performanceData.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{perf.staffName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{perf.ordersServed}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>₹{perf.totalSales.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>₹{perf.avgOrderValue}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: perf.rating >= 4.5 ? '#10b981' : perf.rating >= 4 ? '#f59e0b' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {perf.rating} ⭐
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
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
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
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
                  placeholder="Enter hourly rate..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '12px' }}>
                  Permissions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { key: 'viewOrders', label: 'View Orders' },
                    { key: 'editOrders', label: 'Edit Orders' },
                    { key: 'deleteOrders', label: 'Delete Orders' },
                    { key: 'viewReports', label: 'View Reports' },
                    { key: 'manageStaff', label: 'Manage Staff' },
                    { key: 'manageSettings', label: 'Manage Settings' },
                    { key: 'processPayments', label: 'Process Payments' },
                    { key: 'manageInventory', label: 'Manage Inventory' }
                  ].map(perm => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e0e0e0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.permissions[perm.key] || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          permissions: { 
                            ...formData.permissions, 
                            [perm.key]: e.target.checked 
                          } 
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
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

      {/* View Staff Modal */}
      {showViewModal && viewingStaff && (
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
            background: '#252538',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #2d2d44'
          }}>
            <div style={{
              background: '#1a1a2e',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #2d2d44'
            }}>
              <span>👤 Staff Details</span>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', overflow: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                  {viewingStaff.name}
                </div>
                <div style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '16px' }}>
                  Staff ID: {viewingStaff.id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#1a1a2e', padding: '16px', borderRadius: '8px', border: '1px solid #2d2d44' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>🎭 Role</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                    {viewingStaff.role || 'N/A'}
                  </div>
                </div>
                <div style={{ background: '#1a1a2e', padding: '16px', borderRadius: '8px', border: '1px solid #2d2d44' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>📞 Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                    {viewingStaff.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#1a1a2e', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d44', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>₹{viewingStaff.hourlyRate || 0}</div>
                  <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Hourly Rate</div>
                </div>
                <div style={{ background: '#1a1a2e', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d44', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: viewingStaff.status === 'active' ? '#10b981' : '#ef4444' }}>
                    {viewingStaff.status || 'active'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Status</div>
                </div>
                <div style={{ background: '#1a1a2e', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d44', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>
                    {Object.values(viewingStaff.permissions || {}).filter(Boolean).length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Permissions</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>🔐 Permissions</div>
                <div style={{ 
                  background: '#1a1a2e', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #2d2d44',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {Object.entries(viewingStaff.permissions || {}).map(([perm, enabled]) => (
                    <div key={perm} style={{ 
                      fontSize: '12px', 
                      color: enabled ? '#10b981' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {enabled ? '✓' : '○'} {perm}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditStaff(viewingStaff);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Edit Staff
                </button>
              </div>
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

function StaffCard({ staff, onEdit, onView, onDelete, onStatusToggle }) {
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
          onClick={onView}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          👁️ View
        </button>
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
