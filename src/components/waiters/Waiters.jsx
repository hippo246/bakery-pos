import React, { useState, useMemo, useEffect } from 'react';

export default function Waiters({ onNavigate, orders = [], staff = [] }) {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [lastCallCount, setLastCallCount] = useState(0);
  const [showWaiterCallsModal, setShowWaiterCallsModal] = useState(false);
  const [qrOrders, setQROrders] = useState([]);

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

  // Get waiter orders (combine regular orders with QR orders)
  const allOrders = [...orders, ...qrOrders];
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
    
    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(order => order?.status === filterStatus);
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
    switch (status) {
      case 'COMPLETED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'COMPLETED': { bg: '#10b981', text: '✅' },
      'PENDING': { bg: '#f59e0b', text: '⏳' },
      'IN_PROGRESS': { bg: '#3b82f6', text: '🔄' },
      'CANCELLED': { bg: '#ef4444', text: '❌' }
    };
    const config = colors[status] || { bg: '#6b7280', text: '📋' };
    return config;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#1e293b',
        padding: screenSize === 'small' ? '16px' : '24px 32px',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0',
          marginBottom: screenSize === 'small' ? '16px' : '20px'
        }}>
          <div>
            <div style={{
              color: '#f8fafc',
              fontSize: screenSize === 'small' ? '20px' : '24px',
              fontWeight: '700',
              marginBottom: '4px'
            }}>
              👨‍🍳 Waiters & Servers
            </div>
            <div style={{ color: '#94a3b8', fontSize: screenSize === 'small' ? '12px' : '14px' }}>
              Manage waiter orders and performance
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {waiterCalls.length > 0 && (
              <button
                onClick={() => setShowWaiterCallsModal(true)}
                style={{
                  padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulse 2s infinite'
                }}
              >
                <span style={{ fontSize: screenSize === 'small' ? '16px' : '18px' }}>🔔</span>
                {waiterCalls.length} Waiter Call{waiterCalls.length > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => onNavigate?.('dashboard')}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: '#334155',
                color: '#f1f5f9',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#475569'}
              onMouseLeave={(e) => e.target.style.background = '#334155'}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: screenSize === 'small' ? '12px' : '16px'
        }}>
          <div style={{
            background: '#1e293b',
            padding: screenSize === 'small' ? '12px' : '16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#3b82f6' }}>{stats.total}</div>
            <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</div>
          </div>
          <div style={{
            background: '#1e293b',
            padding: screenSize === 'small' ? '12px' : '16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
          </div>
          <div style={{
            background: '#1e293b',
            padding: screenSize === 'small' ? '12px' : '16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
          </div>
          <div style={{
            background: '#1e293b',
            padding: screenSize === 'small' ? '12px' : '16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#8b5cf6' }}>₹{stats.revenue.toLocaleString()}</div>
            <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
          </div>
          <div style={{
            background: '#1e293b',
            padding: screenSize === 'small' ? '12px' : '16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#06b6d4' }}>{stats.activeStaff}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Staff</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: '#1e293b',
        padding: '16px 32px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Staff Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>STAFF:</span>
          {waiters.map(waiter => (
            <button
              key={waiter.id}
              onClick={() => setSelectedStaff(waiter.id === 'all' ? null : waiter)}
              style={{
                padding: '8px 16px',
                background: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#3b82f6' : '#334155',
                color: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '#ffffff' : '#94a3b8',
                border: (selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all')) ? '2px solid #60a5fa' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!(selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all'))) {
                  e.target.style.background = '#475569';
                  e.target.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!(selectedStaff?.id === waiter.id || (!selectedStaff && waiter.id === 'all'))) {
                  e.target.style.background = '#334155';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              {waiter.icon} {waiter.name}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>STATUS:</span>
          {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 16px',
                background: filterStatus === status ? '#10b981' : '#334155',
                color: filterStatus === status ? '#ffffff' : '#94a3b8',
                border: filterStatus === status ? '2px solid #34d399' : '2px solid transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) {
                  e.target.style.background = '#475569';
                  e.target.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) {
                  e.target.style.background = '#334155';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#334155',
              color: '#f1f5f9',
              border: '2px solid #475569',
              borderRadius: '8px',
              fontSize: '14px',
              width: '250px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#475569'}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#334155',
              color: '#f1f5f9',
              border: '2px solid #475569',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="total">Sort by Total</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ 
        padding: '24px',
        background: '#0f172a',
        flex: 1,
        overflow: 'auto'
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '120px 40px',
            color: '#64748b',
            background: '#1e293b',
            borderRadius: '16px',
            border: '2px dashed #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ fontSize: '72px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px' }}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Orders will appear here when they are created'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {filteredOrders.map(order => (
              <div key={order.id} style={{
                background: '#1e293b',
                borderRadius: '12px',
                border: '2px solid #334155',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3)';
              }}
              >
                {/* Order Header */}
                <div style={{
                  padding: '16px 20px',
                  background: '#334155',
                  borderBottom: '1px solid #475569',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                      #{order.id?.split('-')[1] || order.id?.slice(-4)}
                    </span>
                    {order.token && (
                      <span style={{
                        padding: '4px 12px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {order.token}
                      </span>
                    )}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: getStatusBadge(order.status).bg,
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {getStatusBadge(order.status).text} {order.status.replace('_', ' ')}
                  </div>
                </div>

                {/* Order Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>🪑</span>
                      <span>{order.tableName || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>👤</span>
                      <span>{order.customerName || 'Walk-in'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>⏱️</span>
                      <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                    Items:
                  </div>
                  {order.items?.slice(0, 3).map((item, itemIndex) => (
                    <div key={itemIndex} style={{
                      fontSize: '13px',
                      color: '#cbd5e1',
                      padding: '8px 0',
                      borderBottom: itemIndex < Math.min(order.items.length - 1, 2) ? '1px solid #334155' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{item.name}</span>
                      <span style={{ color: '#94a3b8' }}>x{item.qty}</span>
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                      +{order.items.length - 3} more items
                    </div>
                  )}

                  <div style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      ₹{order.total?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiter Calls Modal */}
      {showWaiterCallsModal && (
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
          zIndex: 1000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            width: '90%',
            maxWidth: screenSize === 'small' ? '100%' : '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: screenSize === 'small' ? '16px' : '20px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#f8fafc' }}>
                🔔 Waiter Calls
              </div>
              <button
                onClick={() => setShowWaiterCallsModal(false)}
                style={{
                  padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                  background: '#334155',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
            
            {waiterCalls.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No pending waiter calls
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {waiterCalls.map(call => (
                  <div key={call.id} style={{
                    background: '#0f172a',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #334155'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
                          {call.customerName || 'Guest'}
                        </div>
                        {call.tableName && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Table: {call.tableName}
                          </div>
                        )}
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#ef4444',
                        color: '#ffffff'
                      }}>
                        PENDING
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                      {new Date(call.createdAt).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleDismissWaiterCall(call.id)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Acknowledge & Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
