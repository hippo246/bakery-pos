import React, { useState, useEffect, useMemo } from 'react';
import useScreenSize from '../../hooks/useScreenSize';

export default function SimpleStaff({ staff = [], setStaff, orders = [], onNavigate, darkMode = true }) {
  const [activeTab, setActiveTab] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showViewModal, setShowViewModal] = useState(null);
  const screenSize = useScreenSize();
  const [search, setSearch] = useState('');

  // Modals for Scheduling & Payroll
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    staffId: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '18:00',
    status: 'scheduled'
  });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    staffId: '',
    hoursWorked: '',
    bonus: '',
    deductions: '',
    period: 'Current Month'
  });

  const [formData, setFormData] = useState({
    name: '',
    role: 'Waiter',
    phone: '',
    status: 'active',
    hourlyRate: 150,
    permissions: {
      viewOrders: true,
      editOrders: false,
      deleteOrders: false,
      viewReports: false,
      manageStaff: false,
      manageSettings: false,
      processPayments: true,
      manageInventory: false
    }
  });

  // Load from localStorage or defaults
  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('bakerypos_schedules');
      return saved ? JSON.parse(saved) : [
        { id: 1, staffId: 's1', staffName: 'Rahul Sharma', day: 'Monday', startTime: '09:00', endTime: '18:00', status: 'scheduled' },
        { id: 2, staffId: 's2', staffName: 'Priya Singh', day: 'Monday', startTime: '10:00', endTime: '19:00', status: 'scheduled' }
      ];
    } catch {
      return [];
    }
  });

  const [payrollData, setPayrollData] = useState(() => {
    try {
      const saved = localStorage.getItem('bakerypos_payroll');
      return saved ? JSON.parse(saved) : [
        { id: 1, staffId: 's1', staffName: 'Rahul Sharma', hoursWorked: 160, hourlyRate: 150, totalPay: 24000, bonus: 2000, deductions: 0, netPay: 26000, period: 'Current Month' },
        { id: 2, staffId: 's2', staffName: 'Priya Singh', hoursWorked: 145, hourlyRate: 140, totalPay: 20300, bonus: 1500, deductions: 500, netPay: 21300, period: 'Current Month' }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bakerypos_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('bakerypos_payroll', JSON.stringify(payrollData));
  }, [payrollData]);

  // Compute live performance metrics from active orders list
  const livePerformance = useMemo(() => {
    const perfMap = {};
    // Seed with existing staff
    staff.forEach(s => {
      perfMap[s.name] = { staffName: s.name, ordersServed: 0, totalSales: 0, rating: 4.5 };
    });

    // Parse completed orders
    orders.forEach(ord => {
      if (ord.status === 'COMPLETED') {
        const serverName = ord.employeeName || ord.waiter || 'Unknown';
        if (serverName !== 'Unknown') {
          if (!perfMap[serverName]) {
            perfMap[serverName] = { staffName: serverName, ordersServed: 0, totalSales: 0, rating: 4.5 };
          }
          perfMap[serverName].ordersServed++;
          perfMap[serverName].totalSales += (ord.total || 0);
        }
      }
    });

    return Object.values(perfMap).map(p => ({
      ...p,
      avgOrderValue: p.ordersServed > 0 ? Math.round(p.totalSales / p.ordersServed) : 0
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [orders, staff]);

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setFormData({ 
      name: '', 
      role: 'Waiter', 
      phone: '', 
      status: 'active',
      hourlyRate: 150,
      permissions: {
        viewOrders: true,
        editOrders: false,
        deleteOrders: false,
        viewReports: false,
        manageStaff: false,
        manageSettings: false,
        processPayments: true,
        manageInventory: false
      }
    });
    setShowModal(true);
  };

  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      role: staffMember.role || 'Waiter',
      phone: staffMember.phone || '',
      status: staffMember.status || 'active',
      hourlyRate: staffMember.hourlyRate || 150,
      permissions: staffMember.permissions || {
        viewOrders: true,
        editOrders: false,
        deleteOrders: false,
        viewReports: false,
        manageStaff: false,
        manageSettings: false,
        processPayments: true,
        manageInventory: false
      }
    });
    setShowModal(true);
  };

  const handleSaveStaff = () => {
    if (!formData.name.trim()) return;

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

  // Scheduling operations
  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      staffId: staff[0]?.id || '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '18:00',
      status: 'scheduled'
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    const selectedEmp = staff.find(s => s.id === scheduleForm.staffId) || staff[0];
    if (!selectedEmp) return;

    const newSched = {
      id: editingSchedule ? editingSchedule.id : Date.now(),
      staffId: scheduleForm.staffId || selectedEmp.id,
      staffName: selectedEmp.name,
      day: scheduleForm.day,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      status: scheduleForm.status
    };

    if (editingSchedule) {
      setSchedules(schedules.map(s => s.id === editingSchedule.id ? newSched : s));
    } else {
      setSchedules([...schedules, newSched]);
    }
    setShowScheduleModal(false);
  };

  // Payroll operations
  const handleAddPayroll = () => {
    setPayrollForm({
      staffId: staff[0]?.id || '',
      hoursWorked: '',
      bonus: '',
      deductions: '',
      period: 'Current Month'
    });
    setShowPayrollModal(true);
  };

  const handleSavePayroll = () => {
    const selectedEmp = staff.find(s => s.id === payrollForm.staffId) || staff[0];
    if (!selectedEmp) return;

    const hrs = parseFloat(payrollForm.hoursWorked) || 0;
    const rate = selectedEmp.hourlyRate || 150;
    const bonusVal = parseFloat(payrollForm.bonus) || 0;
    const dedVal = parseFloat(payrollForm.deductions) || 0;
    const basePay = hrs * rate;

    const newPay = {
      id: Date.now(),
      staffId: selectedEmp.id,
      staffName: selectedEmp.name,
      hoursWorked: hrs,
      hourlyRate: rate,
      totalPay: basePay,
      bonus: bonusVal,
      deductions: dedVal,
      netPay: basePay + bonusVal - dedVal,
      period: payrollForm.period
    };

    setPayrollData([newPay, ...payrollData]);
    setShowPayrollModal(false);
  };

  // Export Payroll to CSV helper
  const exportPayrollCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Staff Name,Period,Hours Worked,Hourly Rate,Base Pay,Bonus,Deductions,Net Pay\n";
    payrollData.forEach(p => {
      csvContent += `"${p.staffName}","${p.period}",${p.hoursWorked},${p.hourlyRate},${p.totalPay},${p.bonus},${p.deductions},${p.netPay}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeStaffCount = staff.filter(s => s.status === 'active').length;

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q);
    });
  }, [staff, search]);

  // Theme colors
  const t = {
    bg:       darkMode ? '#1a1a2e' : '#f8fafc',
    bgEle:    darkMode ? '#1f1f35' : '#ffffff',
    bgCard:   darkMode ? '#252538' : '#ffffff',
    bgInput:  darkMode ? '#1a1a2e' : '#f1f5f9',
    border:   darkMode ? '#2d2d44' : '#e2e8f0',
    text:     darkMode ? '#ffffff' : '#111827',
    textSub:  darkMode ? '#e0e0e0' : '#374151',
    textMute: darkMode ? '#8b8b9e' : '#6b7280',
    accent:   '#6366f1',
    accentHover: '#4f46e5',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Tabs */}
      <div style={{
        background: t.bgEle,
        padding: '12px 24px',
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        gap: '8px',
        overflow: 'auto'
      }}>
        {['staff', 'scheduling', 'payroll', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? '#6366f1' : t.bgCard,
              color: t.text,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
        
        {/* TAB 1: Staff Directory */}
        {activeTab === 'staff' && (
          <>
            {/* Search and control header */}
            <div style={{
              background: t.bgCard,
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              border: `1px solid ${t.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    background: t.bgInput,
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    color: t.text,
                    fontSize: '14px',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                />
                <span style={{ fontSize: '13px', color: t.textMute }}>
                  🟢 <strong style={{ color: t.text }}>{activeStaffCount}</strong> / {staff.length} active
                </span>
              </div>
              <button
                onClick={handleAddStaff}
                style={{
                  padding: '10px 20px',
                  background: '#6366f1',
                  color: t.text,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Team Member
              </button>
            </div>

            {/* Premium Staff Visual Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredStaff.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: t.textMute }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧑‍🍳</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: t.text }}>No team members found</div>
                </div>
              ) : (
                filteredStaff.map(emp => {
                  const initials = emp.name ? emp.name.split(' ').map(n=>n[0]).join('').toUpperCase() : '?';
                  const isActive = emp.status === 'active';
                  return (
                    <div
                      key={emp.id}
                      style={{
                        background: t.bgCard,
                        borderRadius: '16px',
                        border: `1px solid ${t.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        opacity: isActive ? 1 : 0.5
                      }}
                    >
                      <div>
                        {/* Upper Section */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '16px',
                            color: t.text
                          }}>
                            {initials}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: t.text }}>{emp.name}</h4>
                            <span style={{ fontSize: '12px', color: t.textMute }}>👔 {emp.role}</span>
                          </div>
                        </div>

                        {/* Stats mini grid */}
                        <div style={{
                          background: t.bgInput,
                          padding: '10px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          marginBottom: '16px'
                        }}>
                          <div>
                            <span style={{ color: t.textMute }}>Phone:</span>
                            <span style={{ color: t.text, marginLeft: '4px' }}>{emp.phone || '–'}</span>
                          </div>
                          <div>
                            <span style={{ color: t.textMute }}>Hourly:</span>
                            <span style={{ color: '#10b981', fontWeight: '600', marginLeft: '4px' }}>₹{emp.hourlyRate}/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Operations row */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleStatusToggle(emp)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: isActive ? '#059669' : '#b91c1c',
                            color: t.text,
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditStaff(emp)}
                          style={{
                            padding: '8px 12px',
                            background: t.border,
                            color: t.text,
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(emp.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: Scheduling */}
        {activeTab === 'scheduling' && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, margin: 0 }}>📅 Staff Shift Rosters</h3>
              <button
                onClick={handleAddSchedule}
                style={{ padding: '10px 20px', background: '#6366f1', color: t.text, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                + Add Shift Schedule
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: t.bgInput, borderBottom: `2px solid ${t.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Staff</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Day</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Hours</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, index) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.text, fontWeight: '600' }}>{s.staffName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.textMute }}>{s.day}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.textMute }}>{s.startTime} – {s.endTime}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: s.status === 'scheduled' ? '#059669' : '#d97706', color: t.text }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => {
                            setSchedules(schedules.filter(x => x.id !== s.id));
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          Cancel Shift
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Payroll */}
        {activeTab === 'payroll' && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, margin: 0 }}>💰 Payroll Ledger</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={exportPayrollCSV}
                  style={{ padding: '10px 16px', background: t.border, color: t.text, border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={handleAddPayroll}
                  style={{ padding: '10px 16px', background: '#6366f1', color: t.text, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Record Payroll Entry
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: t.bgInput, borderBottom: `2px solid ${t.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Staff</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Hours Worked</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Rate/Hr</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Bonus</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Deductions</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Net Pay</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.text, fontWeight: '600' }}>{p.staffName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.text }}>{p.hoursWorked} hrs</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.textMute }}>₹{p.hourlyRate}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#10b981' }}>+₹{p.bonus}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#f43f5e' }}>-₹{p.deductions}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#10b981', fontWeight: '700' }}>₹{p.netPay.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.textMute }}>{p.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Performance */}
        {activeTab === 'performance' && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, marginBottom: '20px' }}>📊 Live Sales Leaderboard</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: t.bgInput, borderBottom: `2px solid ${t.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Staff Member</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Orders Served</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Total Revenue</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: t.textMute, textTransform: 'uppercase' }}>Avg Ticket Value</th>
                  </tr>
                </thead>
                <tbody>
                  {livePerformance.map((perf, index) => (
                    <tr key={perf.staffName} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6366f1', fontWeight: '700' }}>#{index + 1}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.text, fontWeight: '600' }}>{perf.staffName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.text }}>{perf.ordersServed}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#10b981', fontWeight: '700' }}>₹{perf.totalSales.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: t.textMute }}>₹{perf.avgOrderValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Staff Editor Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: t.bgCard,
            borderRadius: '16px',
            padding: '28px',
            width: '450px',
            border: `1px solid ${t.border}`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, marginTop: 0, marginBottom: '20px' }}>
              {selectedStaff ? 'Edit Staff Details' : 'Create Staff Member'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Staff Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                  >
                    <option value="Waiter">Waiter</option>
                    <option value="Chef">Chef</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', background: t.border, color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                style={{ padding: '10px 20px', background: '#6366f1', color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Scheduler Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: t.bgCard,
            borderRadius: '16px',
            padding: '28px',
            width: '400px',
            border: `1px solid ${t.border}`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, marginTop: 0, marginBottom: '20px' }}>
              Assign Shift Schedule
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Select Employee</label>
                <select
                  value={scheduleForm.staffId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, staffId: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                >
                  <option value="">-- Choose Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Day of Week</label>
                <select
                  value={scheduleForm.day}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                >
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ padding: '10px 20px', background: t.border, color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                style={{ padding: '10px 20px', background: '#6366f1', color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Assign Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Entry Modal */}
      {showPayrollModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: t.bgCard,
            borderRadius: '16px',
            padding: '28px',
            width: '400px',
            border: `1px solid ${t.border}`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, marginTop: 0, marginBottom: '20px' }}>
              Record Payroll Entry
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Select Employee</label>
                <select
                  value={payrollForm.staffId}
                  onChange={(e) => setPayrollForm({ ...payrollForm, staffId: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                >
                  <option value="">-- Choose Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} (Rate: ₹{s.hourlyRate}/hr)</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Hours Worked</label>
                  <input
                    type="number"
                    value={payrollForm.hoursWorked}
                    onChange={(e) => setPayrollForm({ ...payrollForm, hoursWorked: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                    placeholder="e.g. 160"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Period</label>
                  <input
                    type="text"
                    value={payrollForm.period}
                    onChange={(e) => setPayrollForm({ ...payrollForm, period: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Bonus (₹)</label>
                  <input
                    type="number"
                    value={payrollForm.bonus}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                    placeholder="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: t.textMute, display: 'block', marginBottom: '6px' }}>Deductions (₹)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPayrollModal(false)}
                style={{ padding: '10px 20px', background: t.border, color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayroll}
                style={{ padding: '10px 20px', background: '#6366f1', color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Submit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
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
            background: t.bgCard,
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: `1px solid ${t.border}`
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: t.text, marginBottom: '12px', margin: 0 }}>
              Remove Staff
            </h3>
            <p style={{ fontSize: '14px', color: t.textMute, marginBottom: '24px' }}>
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
                  background: t.border,
                  color: t.textSub,
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
                  color: t.text,
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
          zIndex: 5000
        }}>
          <div style={{
            background: t.bgCard,
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${t.border}`
          }}>
            <div style={{
              background: t.bgInput,
              color: t.text,
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${t.border}`
            }}>
              <span>👤 Staff Details</span>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: t.text,
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', overflow: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: t.text, marginBottom: '8px' }}>
                  {viewingStaff.name}
                </div>
                <div style={{ fontSize: '14px', color: t.textMute, marginBottom: '16px' }}>
                  Staff ID: {viewingStaff.id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: t.bgInput, padding: '16px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: '12px', color: t.textMute, marginBottom: '4px' }}>🎭 Role</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: t.text }}>
                    {viewingStaff.role || 'N/A'}
                  </div>
                </div>
                <div style={{ background: t.bgInput, padding: '16px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: '12px', color: t.textMute, marginBottom: '4px' }}>📞 Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: t.text }}>
                    {viewingStaff.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: t.bgInput, padding: '12px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>₹{viewingStaff.hourlyRate || 0}</div>
                  <div style={{ fontSize: '11px', color: t.textMute }}>Hourly Rate</div>
                </div>
                <div style={{ background: t.bgInput, padding: '12px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: viewingStaff.status === 'active' ? '#10b981' : '#ef4444' }}>
                    {viewingStaff.status || 'active'}
                  </div>
                  <div style={{ fontSize: '11px', color: t.textMute }}>Status</div>
                </div>
                <div style={{ background: t.bgInput, padding: '12px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>
                    {Object.values(viewingStaff.permissions || {}).filter(Boolean).length}
                  </div>
                  <div style={{ fontSize: '11px', color: t.textMute }}>Permissions</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: t.textMute, marginBottom: '8px', fontWeight: '500' }}>🔐 Permissions</div>
                <div style={{ 
                  background: t.bgInput, 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: `1px solid ${t.border}`,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {Object.entries(viewingStaff.permissions || {}).map(([perm, enabled]) => (
                    <div key={perm} style={{ 
                      fontSize: '12px', 
                      color: enabled ? '#10b981' : '#8b8b9e',
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
                    color: t.text,
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
            background: t.bgCard,
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: `1px solid ${t.border}`
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: t.text, marginBottom: '12px', margin: 0 }}>
              Notice
            </h3>
            <p style={{ fontSize: '14px', color: t.textMute, marginBottom: '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: t.text,
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
        <div style={{ fontSize: '13px', color: t.textMute, marginBottom: '4px' }}>
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
            color: t.textSub,
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
