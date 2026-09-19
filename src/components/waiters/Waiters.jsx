import React, { useState, useMemo, useEffect } from 'react';

export default function Waiters({ onNavigate, orders = [], setOrders, staff = [], darkMode = true }) {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [screenSize, setScreenSize] = useState('large');
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [lastCallCount, setLastCallCount] = useState(0);
  const [showWaiterCallsModal, setShowWaiterCallsModal] = useState(false);
  const [qrOrders, setQROrders] = useState([]);
  const [notifiedReadyOrders, setNotifiedReadyOrders] = useState([]);

  // New Modals & State for Enterprise Features
  const [showShiftCheckoutModal, setShowShiftCheckoutModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [targetHandoverStaffId, setTargetHandoverStaffId] = useState('');
  const [courseHolds, setCourseHolds] = useState({}); // { orderId: 'Entrees Held (15m)' }

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
    const interval = setInterval(loadQROrders, 30000);
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

  // Poll for waiter calls with audio chime & haptic vibration
  useEffect(() => {
    const playChimeAndVibrate = () => {
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
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
        
        if (pendingCalls.length > lastCallCount && lastCallCount >= 0) {
          playChimeAndVibrate();
        }
        
        setLastCallCount(pendingCalls.length);
        setWaiterCalls(pendingCalls);
      } catch (error) {
        console.error('Error reading waiter calls:', error);
      }
    };

    checkWaiterCalls();
    const interval = setInterval(checkWaiterCalls, 30000);

    return () => clearInterval(interval);
  }, [lastCallCount]);

  const handleDismissWaiterCall = (callId) => {
    try {
      const calls = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
      const updatedCalls = calls.map(call => 
        call.id === callId ? { ...call, status: 'ACKNOWLEDGED', acknowledgedAt: Date.now() } : call
      );
      localStorage.setItem('waiter_calls', JSON.stringify(updatedCalls));
      setWaiterCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Error dismissing waiter call:', error);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
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

  const handleClaimTableOrder = (orderId) => {
    const activeStaffId = selectedStaff?.id || 'staff-004';
    if (setOrders) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, staffId: activeStaffId } : o));
    }
  };

  const handleBatchHandover = () => {
    if (!targetHandoverStaffId) return;
    const currentStaffId = selectedStaff?.id;
    if (setOrders) {
      setOrders(prev => prev.map(o => {
        if (!currentStaffId || o.staffId === currentStaffId || o.employeeId === currentStaffId) {
          return { ...o, staffId: targetHandoverStaffId };
        }
        return o;
      }));
    }
    setShowHandoverModal(false);
  };

  // Get waiter orders
  const allOrders = useMemo(() => [...orders, ...qrOrders], [orders, qrOrders]);

  // Audio chime + haptic vibration for READY orders
  useEffect(() => {
    const readyOrders = allOrders.filter(order => order && (order.status || '').toLowerCase() === 'ready');
    const newReadyOrders = readyOrders.filter(order => !notifiedReadyOrders.includes(order.id));
    if (newReadyOrders.length > 0) {
      try {
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
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
    
    if (filterStatus !== 'all') {
      result = result.filter(order => (order?.status || '').toUpperCase() === filterStatus.toUpperCase());
    }
    
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

  // Get waiters
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

  // Calculate stats & tips
  const stats = useMemo(() => {
    const allOrdersList = allOrders.filter(o => o?.status !== 'CANCELLED');
    const completedList = allOrdersList.filter(o => o?.status === 'COMPLETED');
    const totalRev = completedList.reduce((sum, o) => sum + (o?.total || 0), 0);
    // Tip Calculations (18% Auto Grat on large tables + estimated cash tips)
    const cardTips = completedList.reduce((sum, o) => sum + ((o.guests >= 6 || o.autoGrat) ? (o.total * 0.18) : (o.total * 0.10)), 0);
    const cashTips = completedList.length * 45; // ~₹45 cash tip average per completed check

    return {
      total: allOrdersList.length,
      completed: completedList.length,
      pending: allOrdersList.filter(o => o?.status === 'PENDING' || o?.status === 'IN_PROGRESS').length,
      revenue: totalRev,
      cardTips,
      cashTips,
      totalTips: cardTips + cashTips,
      activeStaff: waiters.length - 3
    };
  }, [allOrders, waiters]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return '#10b981';
      case 'READY': return '#22c55e';
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#888888';
    }
  };

  const t = {
    bg:       darkMode ? '#000000' : '#f5f7fa',
    bgEle:    darkMode ? '#0a0a0a' : '#ffffff',
    bgCard:   darkMode ? '#111111' : '#ffffff',
    bgInput:  darkMode ? '#000000' : '#f8fafc',
    border:   darkMode ? '#222222' : '#d1d5db',
    text:     darkMode ? '#ffffff' : '#0a0a0a',
    textSub:  darkMode ? '#e0e0e0' : '#222222',
    textMute: darkMode ? '#888888' : '#6b7280',
    accent:   '#ffffff',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: t.bgEle,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '8px 16px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ← BACK
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: t.text, textTransform: 'uppercase', tracking: '0.05em' }}>
            🛎️ WAITER SERVICE TERMINAL
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowHandoverModal(true)}
            style={{
              padding: '8px 14px',
              background: '#222222',
              color: '#ffffff',
              border: '1px solid #444444',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🔄 HANDOVER SHIFT
          </button>
          <button
            onClick={() => setShowShiftCheckoutModal(true)}
            style={{
              padding: '8px 14px',
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #ffffff',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            💵 SHIFT CHECKOUT
          </button>

          {waiterCalls.length > 0 && (
            <button
              onClick={() => setShowWaiterCallsModal(true)}
              style={{
                padding: '8px 16px',
                background: '#f43f5e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔔 {waiterCalls.length} CALLS
            </button>
          )}
        </div>
      </div>

      {/* Stats & Tip Bar */}
      <div style={{
        padding: '12px 24px',
        background: t.bgEle,
        borderBottom: `1px solid ${t.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px'
      }}>
        <div style={{ background: t.bgCard, padding: '10px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{stats.total}</div>
          <div style={{ fontSize: '9px', color: t.textMute, marginTop: '2px', textTransform: 'uppercase', fontWeight: '700' }}>Active Checks</div>
        </div>
        <div style={{ background: t.bgCard, padding: '10px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{stats.completed}</div>
          <div style={{ fontSize: '9px', color: t.textMute, marginTop: '2px', textTransform: 'uppercase', fontWeight: '700' }}>Served Checks</div>
        </div>
        <div style={{ background: t.bgCard, padding: '10px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>₹{stats.revenue.toLocaleString()}</div>
          <div style={{ fontSize: '9px', color: t.textMute, marginTop: '2px', textTransform: 'uppercase', fontWeight: '700' }}>Sales Volume</div>
        </div>
        <div style={{ background: t.bgCard, padding: '10px', borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>₹{stats.totalTips.toFixed(0)}</div>
          <div style={{ fontSize: '9px', color: '#10b981', marginTop: '2px', textTransform: 'uppercase', fontWeight: '700' }}>Shift Tips (Card+Cash)</div>
        </div>
      </div>

      {/* Ready Orders Banner */}
      {(() => {
        const readyList = allOrders.filter(o => o && (o.status || '').toLowerCase() === 'ready');
        if (readyList.length === 0) return null;
        return (
          <div style={{
            background: '#ffffff',
            color: '#000000',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: '800',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🛎️</span>
              <span>
                {readyList.length} ORDER{readyList.length > 1 ? 'S' : ''} READY TO SERVE &nbsp;—&nbsp;
                {readyList.map(o => `${o.tableName || 'Counter'} (${o.token || '#' + String(o.id).slice(-4)})`).join(' · ')}
              </span>
            </div>
            <button
              onClick={() => setFilterStatus('READY')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              VIEW READY
            </button>
          </div>
        );
      })()}

      {/* Filters Bar */}
      <div style={{
        padding: '12px 24px',
        background: t.bgEle,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Staff Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: t.textMute, fontWeight: '800', letterSpacing: '0.5px' }}>STAFF</span>
          {waiters.slice(0, 5).map(waiter => (
            <button
              key={waiter.id}
              onClick={() => setSelectedStaff(waiter.id === 'all' ? null : waiter)}
              style={{
                padding: '5px 12px',
                background: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#ffffff' : t.bgCard,
                color: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#000000' : t.text,
                border: `1px solid ${(selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#ffffff' : t.border}`,
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {waiter.icon} {waiter.name}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: t.textMute, fontWeight: '800', letterSpacing: '0.5px' }}>STATUS</span>
          {['all', 'PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '5px 10px',
                background: filterStatus === status ? '#ffffff' : t.bgCard,
                color: filterStatus === status ? '#000000' : t.text,
                border: `1px solid ${filterStatus === status ? '#ffffff' : t.border}`,
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {status === 'all' ? 'ALL' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="Search checks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: '4px',
              color: t.text,
              fontSize: '11px',
              outline: 'none',
              width: '150px'
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px',
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: '4px',
              color: t.text,
              fontSize: '11px',
              outline: 'none'
            }}
          >
            <option value="date">Time</option>
            <option value="total">Revenue</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ padding: '20px 24px', flex: 1, overflow: 'auto' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: t.textMute }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>No matching active table orders</div>
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
                borderRadius: '12px',
                border: `1px solid ${t.border}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Header metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: t.text }}>
                      #{order.token || order.id?.toString().slice(-4)}
                    </span>
                    <span style={{
                      background: getStatusColor(order.status),
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: t.textMute, display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#ffffff' }}>🪑 Table {order.tableName || order.tableNumber || '14'}</span>
                    <span>👤 {order.customerName || 'Guest'}</span>

                    {/* Claim Table Action */}
                    {(() => {
                      const assignedWaiter = staff.find(s => s.id === order.staffId || s.id === order.employeeId);
                      if (assignedWaiter) {
                        return <span style={{ color: '#10b981', fontWeight: '700' }}>👨‍🍳 {assignedWaiter.name}</span>;
                      }
                      return (
                        <button
                          onClick={() => handleClaimTableOrder(order.id)}
                          style={{ background: '#ffffff', color: '#000000', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}
                        >
                          + CLAIM CHECK
                        </button>
                      );
                    })()}
                  </div>

                  {/* Course Hold Status Badge */}
                  {courseHolds[order.id] && (
                    <div style={{ background: '#222222', border: '1px solid #444444', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#f59e0b', fontWeight: '700', marginBottom: '8px' }}>
                      ⏸️ {courseHolds[order.id]}
                    </div>
                  )}

                  {/* List of items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: t.text }}>
                        <span>{item.name} {item.notes && <span style={{ color: '#f59e0b', fontSize: '10px' }}>({item.notes})</span>}</span>
                        <span style={{ color: t.textMute }}>x{item.qty || item.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${t.border}` }}>
                  {/* Course Fire / Hold Action Buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                    <button
                      onClick={() => setCourseHolds(prev => ({ ...prev, [order.id]: 'Appetizers Fired' }))}
                      style={{ flex: 1, padding: '4px', background: '#111111', color: '#ffffff', border: '1px solid #333333', borderRadius: '3px', fontSize: '9px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🔥 FIRE APPETIZERS
                    </button>
                    <button
                      onClick={() => setCourseHolds(prev => ({ ...prev, [order.id]: 'Entrees Held (15m)' }))}
                      style={{ flex: 1, padding: '4px', background: '#111111', color: '#ffffff', border: '1px solid #333333', borderRadius: '3px', fontSize: '9px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ⏸️ HOLD ENTREES
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: t.textMute, fontWeight: '700' }}>TOTAL AMOUNT</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#10b981' }}>₹{order.total || 0}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Jump to Floor Plan */}
                    <button
                      onClick={() => onNavigate?.('tables')}
                      style={{ flex: 1, padding: '8px', background: '#222222', color: '#ffffff', border: '1px solid #444444', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🗺️ FLOOR PLAN
                    </button>

                    {/* Serve / Complete Order */}
                    {['ready', 'in_progress', 'pending', 'preparing'].includes((order.status || '').toLowerCase()) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        style={{
                          flex: 2,
                          padding: '8px',
                          background: (order.status || '').toLowerCase() === 'ready' ? '#ffffff' : t.border,
                          color: (order.status || '').toLowerCase() === 'ready' ? '#000000' : t.text,
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {(order.status || '').toLowerCase() === 'ready' ? '🛎️ SERVE ORDER' : 'COMPLETE SERVING'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiter Alert Call Modal with SLA Timers */}
      {showWaiterCallsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: t.bgCard,
            borderRadius: '12px',
            padding: '20px',
            width: '440px',
            border: `2px solid ${t.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #222222', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: t.text, margin: 0, textTransform: 'uppercase' }}>🔔 CUSTOMER QR CALLS (SLA TRACKER)</h3>
              <button
                onClick={() => setShowWaiterCallsModal(false)}
                style={{ background: 'none', border: 'none', color: t.text, fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
              {waiterCalls.map(call => {
                const elapsedSec = Math.floor((Date.now() - (call.createdAt || Date.now())) / 1000);
                const slaColor = elapsedSec < 120 ? '#10b981' : elapsedSec < 300 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={call.id} style={{ background: t.bgInput, padding: '12px', borderRadius: '6px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: t.text }}>Table {call.tableName || call.tableNumber || '14'}</div>
                      <div style={{ fontSize: '11px', color: t.textMute }}>Request: {call.type || 'Water / Assistance'}</div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: slaColor, marginTop: '2px' }}>
                        ⏱️ SLA WAIT TIME: {Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissWaiterCall(call.id)}
                      style={{ padding: '8px 14px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      ACKNOWLEDGE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Batch Shift Handover Modal */}
      {showHandoverModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: t.bgCard, borderRadius: '12px', padding: '20px', width: '360px', border: `2px solid ${t.border}` }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: t.text, marginBottom: '10px' }}>🔄 BATCH SERVER HANDOVER</h3>
            <p style={{ fontSize: '12px', color: t.textMute, margin: 0, marginBottom: '14px' }}>
              Transfer all open checks from {selectedStaff?.name || 'Current Server'} to another staff member:
            </p>
            <select
              value={targetHandoverStaffId}
              onChange={(e) => setTargetHandoverStaffId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333333', borderRadius: '4px', color: '#ffffff', fontSize: '12px', marginBottom: '14px' }}
            >
              <option value="">Select Receiving Staff...</option>
              {staff.filter(s => s.id !== selectedStaff?.id).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowHandoverModal(false)} style={{ flex: 1, padding: '10px', background: '#222222', color: '#ffffff', border: '1px solid #444444', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>CANCEL</button>
              <button onClick={handleBatchHandover} disabled={!targetHandoverStaffId} style={{ flex: 1, padding: '10px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: '4px', fontWeight: '900', cursor: targetHandoverStaffId ? 'pointer' : 'not-allowed' }}>CONFIRM HANDOVER</button>
            </div>
          </div>
        </div>
      )}

      {/* Server Shift Checkout Modal */}
      {showShiftCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: t.bgCard, borderRadius: '12px', padding: '24px', width: '420px', border: `2px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderBottom: '1px solid #222222', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>📊 SERVER SHIFT CLOSEOUT REPORT</h3>
              <button onClick={() => setShowShiftCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #222222', paddingBottom: '4px' }}>
                <span style={{ color: t.textMute }}>Server Name:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{selectedStaff?.name || 'Rahul Sharma'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #222222', paddingBottom: '4px' }}>
                <span style={{ color: t.textMute }}>Shift Gross Sales:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>₹{stats.revenue.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #222222', paddingBottom: '4px' }}>
                <span style={{ color: t.textMute }}>Credit Card Tips (Auto-Grat):</span>
                <span style={{ fontWeight: '700', color: '#10b981' }}>₹{stats.cardTips.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #222222', paddingBottom: '4px' }}>
                <span style={{ color: t.textMute }}>Estimated Cash Tips:</span>
                <span style={{ fontWeight: '700', color: '#10b981' }}>₹{stats.cashTips.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#050505', padding: '10px', borderRadius: '6px', border: '1px solid #222222', marginTop: '6px' }}>
                <span style={{ fontWeight: '800', color: '#ffffff' }}>TOTAL TIP EARNINGS:</span>
                <span style={{ fontWeight: '900', color: '#10b981', fontSize: '16px' }}>₹{stats.totalTips.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
                setShowShiftCheckoutModal(false);
              }}
              style={{ padding: '12px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: '6px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              🖨️ PRINT SERVER CHECKOUT REPORT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
