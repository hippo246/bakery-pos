import React, { useState, useMemo, useEffect } from 'react';

export default function Waiters({ onNavigate, orders = [], setOrders, staff = [], darkMode = true }) {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [lastCallCount, setLastCallCount] = useState(0);
  const [showWaiterCallsModal, setShowWaiterCallsModal] = useState(false);
  const [qrOrders, setQROrders] = useState([]);
  const [notifiedReadyOrders, setNotifiedReadyOrders] = useState([]);



  // Poll for QR orders from localStorage
  useEffect(() => {
    const loadQROrders = () => {
      try {
        const storedOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        setQROrders(storedOrders);
      } catch (error) {
        console.error('Error loading QR orders:', error);
      }
    };

    loadQROrders();
    const interval = setInterval(loadQROrders, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Poll for waiter calls with audio notification
  useEffect(() => {
    const playChime = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error playing chime:', error);
      }
    };
    
    const checkWaiterCalls = () => {
      try {
        const calls = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
        const pendingCalls = calls.filter(call => call.status === 'PENDING');
        
        // Play chime if new calls came in
        if (pendingCalls.length > lastCallCount && lastCallCount >= 0) {
          playChime();
        }
        
        setLastCallCount(pendingCalls.length);
        setWaiterCalls(pendingCalls);
      } catch (error) {
        console.error('Error reading waiter calls:', error);
      }
    };

    checkWaiterCalls();
    const interval = setInterval(checkWaiterCalls, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [lastCallCount]);

  const handleDismissWaiterCall = (callId) => {
    try {
      const calls = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
      const updatedCalls = calls.map(call => 
        call.id === callId ? { ...call, status: 'ACKNOWLEDGED' } : call
      );
      localStorage.setItem('waiter_calls', JSON.stringify(updatedCalls));
      setWaiterCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Error dismissing waiter call:', error);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    // If it's a QR order, update localStorage
    const isQR = qrOrders.some(q => q.id === orderId) || orderId.toString().startsWith('QR-');
    if (isQR) {
      try {
        const stored = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        const updated = stored.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem('qr_orders', JSON.stringify(updated));
        setQROrders(updated);
      } catch (err) {
        console.error('Error updating QR order status:', err);
      }
    }
    
    if (setOrders) {
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        return updatedOrders;
      });
    }
  };

  // Get waiter orders (combine regular orders with QR orders)
  const allOrders = [...orders, ...qrOrders];

  // Play audio when any order status switches to READY (must be after allOrders is defined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const readyOrders = allOrders.filter(order => order && (order.status || '').toLowerCase() === 'ready');
    const newReadyOrders = readyOrders.filter(order => !notifiedReadyOrders.includes(order.id));
    if (newReadyOrders.length > 0) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (freq, delay) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.3);
          osc.start(audioContext.currentTime + delay);
          osc.stop(audioContext.currentTime + delay + 0.3);
        };
        playBeep(920, 0);
        playBeep(1150, 0.15);
      } catch (err) {
        console.error('Error playing ready chime:', err);
      }
      setNotifiedReadyOrders(prev => [...prev, ...newReadyOrders.map(o => o.id)]);
    }
  }, [allOrders, notifiedReadyOrders]);

  const waiterOrders = useMemo(() => {
    if (!selectedStaff) {
      // Show all orders when "All Waiters" is selected
      return allOrders.filter(order => order?.status !== 'CANCELLED');
    }
    return allOrders.filter(order => 
      (order.staffId === selectedStaff.id || 
       order.employeeId === selectedStaff.id ||
       (order.isQROrder && selectedStaff.id === 'qr') ||
       (!order.staffId && !order.employeeId && selectedStaff.id === 'unassigned')) && 
      order?.status !== 'CANCELLED'
    );
  }, [allOrders, selectedStaff]);

  // Filter orders by status and search
  const filteredOrders = useMemo(() => {
    let result = waiterOrders;
    
    // Filter by status (case-insensitive to handle KOT lowercase statuses)
    if (filterStatus !== 'all') {
      result = result.filter(order => (order?.status || '').toUpperCase() === filterStatus.toUpperCase());
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.id?.toLowerCase().includes(query) ||
        order.token?.toLowerCase().includes(query) ||
        order.tableName?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.items?.some(item => item.name?.toLowerCase().includes(query))
      );
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'total':
          return (b.total || 0) - (a.total || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return result;
  }, [waiterOrders, filterStatus, searchQuery, sortBy]);

  // Get waiters (staff with waiter role)
  const waiters = useMemo(() => {
    if (!staff || !Array.isArray(staff)) return [
      { id: 'all', name: 'All Staff', role: 'All', icon: '👥' },
      { id: 'qr', name: 'QR Orders', role: 'QR System', icon: '📱' },
      { id: 'unassigned', name: 'Unassigned', role: 'System', icon: '❓' }
    ];
    
    const regularWaiters = staff.filter(s => 
      s.role?.toLowerCase().includes('waiter') || 
      s.role?.toLowerCase().includes('server') ||
      s.role?.toLowerCase().includes('staff')
    );
    
    return [
      { id: 'all', name: 'All Staff', role: 'All', icon: '👥' },
      ...regularWaiters.map(w => ({ ...w, icon: '👨‍🍳' })),
      { id: 'qr', name: 'QR Orders', role: 'QR System', icon: '📱' },
      { id: 'unassigned', name: 'Unassigned', role: 'System', icon: '❓' }
    ];
  }, [staff]);

  // Calculate stats
  const stats = useMemo(() => {
    const allOrdersList = allOrders.filter(o => o?.status !== 'CANCELLED');
    return {
      total: allOrdersList.length,
      completed: allOrdersList.filter(o => o?.status === 'COMPLETED').length,
      pending: allOrdersList.filter(o => o?.status === 'PENDING' || o?.status === 'IN_PROGRESS').length,
      revenue: allOrdersList.filter(o => o?.status === 'COMPLETED').reduce((sum, o) => sum + (o?.total || 0), 0),
      activeStaff: waiters.length - 3 // Subtract the 3 special options
    };
  }, [allOrders, waiters]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return '#10b981';
      case 'READY': return '#22c55e';
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#8b8b9e';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'COMPLETED': { bg: '#10b981', text: '✅' },
      'READY': { bg: '#22c55e', text: '🛎️' },
      'PENDING': { bg: '#f59e0b', text: '⏳' },
      'IN_PROGRESS': { bg: '#3b82f6', text: '🔄' },
      'CANCELLED': { bg: '#ef4444', text: '❌' }
    };
    const config = colors[status?.toUpperCase()] || { bg: '#8b8b9e', text: '📋' };
    return config;
  };

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
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* Ready Orders Pickup Banner */}
      {(() => {
        const readyList = allOrders.filter(o => o && (o.status || '').toLowerCase() === 'ready');
        if (readyList.length === 0) return null;
        return (
          <div style={{
            background: 'linear-gradient(90deg, #10b981, #059669)',
            color: t.text,
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: '700',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(16,185,129,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛎️</span>
              <span>
                {readyList.length} ORDER{readyList.length > 1 ? 'S' : ''} READY FOR PICK-UP &nbsp;—&nbsp;
                {readyList.map(o => `${o.tableName || 'Counter'} (${o.token || '#' + String(o.id).slice(-4)})`).join(' · ')}
              </span>
            </div>
            <button
              onClick={() => setFilterStatus('READY')}
              style={{
                background: '#ffffff',
                color: '#059669',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              VIEW
            </button>
          </div>
        );
      })()}

      {/* Top Header Controls */}
      <div style={{
        padding: '24px 32px',
        background: t.bgEle,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate?.('dashboard')}
              style={{
                padding: '10px 20px',
                background: t.border,
                color: t.text,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>

            {waiterCalls.length > 0 && (
              <button
                onClick={() => setShowWaiterCallsModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#f43f5e',
                  color: t.text,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔔 {waiterCalls.length} Waiter Calls
              </button>
            )}
          </div>

          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: t.text }}>🛎️ Waiter Service Station</h2>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ background: t.bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366f1' }}>{stats.total}</div>
            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px', textTransform: 'uppercase' }}>Total Active</div>
          </div>
          <div style={{ background: t.bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px', textTransform: 'uppercase' }}>Completed</div>
          </div>
          <div style={{ background: t.bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px', textTransform: 'uppercase' }}>Pending</div>
          </div>
          <div style={{ background: t.bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>₹{stats.revenue.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px', textTransform: 'uppercase' }}>Revenue Served</div>
          </div>
        </div>
      </div>

      {/* Filter and search parameters */}
      <div style={{
        background: t.bgEle,
        padding: '16px 32px',
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Staff Row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: t.textMute, fontWeight: 'bold' }}>STAFF FILTER:</span>
          {waiters.map(waiter => (
            <button
              key={waiter.id}
              onClick={() => setSelectedStaff(waiter.id === 'all' ? null : waiter)}
              style={{
                padding: '6px 14px',
                background: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#6366f1' : '#252538',
                color: t.text,
                border: `1px solid ${(selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#6366f1' : '#2d2d44'}`,
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {waiter.icon} {waiter.name}
            </button>
          ))}
        </div>

        {/* Status and Search Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: t.textMute, fontWeight: 'bold' }}>STATUS:</span>
            {['all', 'PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '6px 12px',
                  background: filterStatus === status ? '#10b981' : '#252538',
                  color: t.text,
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search table, token, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: '6px',
                color: t.text,
                fontSize: '13px',
                outline: 'none',
                width: '200px'
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: '6px',
                color: t.text,
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="date">Sort: Time</option>
              <option value="total">Sort: Total Revenue</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid Display */}
      <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: t.textMute }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: t.text }}>No matching active orders</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredOrders.map(order => (
              <div key={order.id} style={{
                background: t.bgCard,
                borderRadius: '16px',
                border: `1px solid ${t.border}`,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Header metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: t.text }}>
                      #{order.token || order.id?.slice(-4)}
                    </span>
                    <span style={{
                      background: getStatusColor(order.status),
                      color: t.text,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: t.textMute, display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <span>🪑 Table {order.tableName || order.tableNumber || 'N/A'}</span>
                    <span>👤 {order.customerName || 'Walk-in'}</span>
                  </div>

                  {/* List of items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: t.text }}>
                        <span>{item.name} {item.notes && <span style={{ color: '#f59e0b', fontSize: '11px' }}>({item.notes})</span>}</span>
                        <span style={{ color: t.textMute }}>x{item.qty || item.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #2d2d44' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: t.textMute }}>Total Amount</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>₹{order.total || 0}</span>
                  </div>

                  {/* Serve/serve operations */}
                  {['ready', 'in_progress', 'pending', 'preparing'].includes((order.status || '').toLowerCase()) && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: (order.status || '').toLowerCase() === 'ready' ? '#10b981' : '#2d2d44',
                        color: t.text,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {(order.status || '').toLowerCase() === 'ready' ? '🛎️ Serve Order' : 'Complete Servings'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiter Alert Call Modal */}
      {showWaiterCallsModal && (
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
            padding: '24px',
            width: '400px',
            border: `1px solid ${t.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: t.text, margin: 0 }}>🔔 Pending Customer Calls</h3>
              <button
                onClick={() => setShowWaiterCallsModal(false)}
                style={{ padding: '6px 12px', background: t.border, color: t.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {waiterCalls.map(call => (
                <div key={call.id} style={{ background: t.bgInput, padding: '14px', borderRadius: '8px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: t.text }}>Table {call.tableName || 'N/A'}</div>
                    <span style={{ fontSize: '11px', color: t.textMute }}>Type: {call.type || 'Service'}</span>
                  </div>
                  <button
                    onClick={() => handleDismissWaiterCall(call.id)}
                    style={{ padding: '6px 12px', background: '#10b981', color: t.text, border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
