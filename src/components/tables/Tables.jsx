import React, { useState, useMemo, useEffect } from 'react';

export default function Tables({ onNavigate, orders = [], setOrders, tables: externalTables = [], setTables: setExternalTables, menuItems = [], settings = {}, darkMode = true }) {
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [lastCallCount, setLastCallCount] = useState(0);
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

  // Poll for waiter calls
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
  // Default tables - can be overridden by settings or external tables
  const defaultTables = settings.defaultTables || [
    { id: 1, name: 'T1', status: 'available', capacity: 4 },
    { id: 2, name: 'T2', status: 'available', capacity: 4 },
    { id: 3, name: 'T3', status: 'occupied', capacity: 6 },
    { id: 4, name: 'T4', status: 'available', capacity: 2 },
    { id: 5, name: 'T5', status: 'available', capacity: 8 },
    { id: 6, name: 'T6', status: 'occupied', capacity: 4 },
    { id: 7, name: 'T7', status: 'available', capacity: 4 },
    { id: 8, name: 'T8', status: 'available', capacity: 6 }
  ];
  
  const [localTables, setLocalTables] = useState(defaultTables);

  // Use external tables if provided, otherwise use local state
  const tables = (externalTables && Array.isArray(externalTables) && externalTables.length > 0) ? externalTables : localTables;
  const setTables = setExternalTables || setLocalTables;
  const [showModal, setShowModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: 4 });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedTableForOrders, setSelectedTableForOrders] = useState(null);
  const [ordersDateFilter, setOrdersDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showQRDemoModal, setShowQRDemoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [showWaiterCalls, setShowWaiterCalls] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    tableId: 'all'
  });

  // Get filtered orders for the selected table
  const getFilteredTableOrders = (tableId) => {
    const tableOrdersList = tableOrders[tableId] || [];
    
    if (ordersDateFilter === 'all') return tableOrdersList;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    
    return tableOrdersList.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      switch (ordersDateFilter) {
        case 'today':
          return orderDate.toDateString() === today;
        case 'yesterday':
          return orderDate.toDateString() === yesterday;
        case 'week':
          return orderDate >= weekAgo;
        case 'custom':
          if (!customDateFrom || !customDateTo) return true;
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          return orderDate >= fromDate && orderDate <= toDate;
        default:
          return true;
      }
    });
  };

  // Get orders for each table with filters applied (combine regular orders with QR orders)
  const tableOrders = useMemo(() => {
    const ordersByTable = {};
    
    const allOrders = [...orders, ...qrOrders];
    
    if (!allOrders || !Array.isArray(allOrders)) return ordersByTable;
    
    allOrders.forEach(order => {
      if (!order) return;
      
      // Check both tableId and tableName for compatibility
      const tableId = order.tableId || (order.tableName && tables ? tables.find(t => t.name === order.tableName)?.id : null);
      
      if (tableId && order.status !== 'CANCELLED') {
        // Apply filters
        if (filters.status !== 'all' && order.status !== filters.status) return;
        if (filters.tableId !== 'all' && tableId !== filters.tableId) return;
        if (filters.dateFrom && order.createdAt && new Date(order.createdAt) < new Date(filters.dateFrom)) return;
        if (filters.dateTo && order.createdAt && new Date(order.createdAt) > new Date(filters.dateTo)) return;
        
        if (!ordersByTable[tableId]) {
          ordersByTable[tableId] = [];
        }
        ordersByTable[tableId].push(order);
      }
    });

    // Also include QR orders from localStorage
    try {
      const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      qrOrders.forEach(qrOrder => {
        if (qrOrder.status === 'PENDING') {
          const tableId = qrOrder.tableId || (qrOrder.tableName && tables ? tables.find(t => t.name === qrOrder.tableName)?.id : null);
          if (tableId) {
            if (!ordersByTable[tableId]) {
              ordersByTable[tableId] = [];
            }
            // Add QR order if not already in the list
            if (!ordersByTable[tableId].find(o => o.id === qrOrder.id)) {
              ordersByTable[tableId].push({
                ...qrOrder,
                isQROrder: true
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('Error reading QR orders:', error);
    }

    return ordersByTable;
  }, [orders, filters, tables]);

  // Auto-occupy tables based on active orders
  const tablesWithStatus = useMemo(() => {
    if (!tables || !Array.isArray(tables)) return [];
    
    return tables.map(table => {
      const tableOrderCount = tableOrders[table.id]?.length || 0;
      const hasActiveOrder = tableOrders[table.id]?.some(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING');
      return {
        ...table,
        status: hasActiveOrder ? 'occupied' : 'available',
        orderCount: tableOrderCount
      };
    });
  }, [tables, tableOrders]);

  // Generate QR code URL
  const generateQRCode = (table) => {
    const tableData = JSON.stringify({ tableId: table.id, tableName: table.name });
    const encoded = encodeURIComponent(tableData);
    const baseUrl = window.location.origin + window.location.pathname;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl + '?table=' + encoded)}`;
  };

  const handleAddTable = () => {
    setSelectedTable(null);
    setFormData({ name: '', capacity: 4 });
    setShowModal(true);
  };

  const handleEditTable = (table) => {
    setSelectedTable(table);
    setFormData({ name: table.name, capacity: table.capacity });
    setShowModal(true);
  };

  const handleSaveTable = () => {
    if (!formData.name.trim()) return;

    if (selectedTable) {
      setTables((prevTables) => (prevTables || []).map(t =>
        t.id === selectedTable.id
          ? { ...t, ...formData }
          : t
      ));
    } else {
      const newTable = {
        id: Date.now(),
        ...formData,
        status: 'available'
      };
      setTables((prevTables) => [...(prevTables || []), newTable]);
    }
    setShowModal(false);
  };

  const handleDeleteTable = (tableId) => {
    setTableToDelete(tableId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTable = () => {
    if (tableToDelete) {
      setTables((prevTables) => (prevTables || []).filter(t => t.id !== tableToDelete));
      setShowDeleteConfirm(false);
      setTableToDelete(null);
    }
  };

  const handleStatusToggle = (table) => {
    const newStatus = table.status === 'available' ? 'occupied' : 'available';
    setTables((prevTables) => (prevTables || []).map(t =>
      t.id === table.id
        ? { ...t, status: newStatus }
        : t
    ));
  };

  const availableCount = (tablesWithStatus || []).filter(t => t.status === 'available').length;
  const occupiedCount = (tablesWithStatus || []).filter(t => t.status === 'occupied').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#1a1a2e' : '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Controls */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '28px 32px',
        borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {waiterCalls.length > 0 && (
              <button
                onClick={() => setShowWaiterCalls(true)}
                style={{
                  padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
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
                background: darkMode ? '#252538' : '#ffffff',
                color: darkMode ? '#ffffff' : '#e0e0e0',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = darkMode ? '#2d2d48' : '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.background = darkMode ? '#252538' : '#ffffff'}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '28px 32px', overflow: 'auto', flex: 1, background: darkMode ? '#14142a' : '#f1f5f9' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: screenSize === 'small' ? '12px' : '20px',
          marginBottom: screenSize === 'small' ? '16px' : '28px'
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              🟢 Available
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#22c55e' }}>
              {availableCount}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
              🟠 Occupied
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#f59e0b' }}>
              {occupiedCount}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: screenSize === 'small' ? '12px' : '16px',
          marginBottom: screenSize === 'small' ? '16px' : '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', border: 'none', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)' }}>
              <button
                onClick={() => { setShowModal(true); setSelectedTable(null); setFormData({ name: '', capacity: 4 }); }}
                style={{
                  padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
                  background: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ➕ Add Table
              </button>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: '12px 10px',
                  background: '#1f2937',
                  color: '#ffffff',
                  border: 'none',
                  borderLeft: '1px solid #374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ▼
              </button>
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '6px',
                background: darkMode ? '#252538' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                minWidth: '180px',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => { setShowModal(true); setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setShowDropdown(false); }}
                  style={{ padding: '10px 14px', fontSize: '13px', color: darkMode ? '#fff' : '#1f2937', cursor: 'pointer', hover: { background: '#f3f4f6' } }}
                  onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  ➕ Add New Table
                </div>
                <div
                  onClick={() => { setShowManageModal(true); setShowDropdown(false); }}
                  style={{ padding: '10px 14px', fontSize: '13px', color: darkMode ? '#fff' : '#1f2937', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  ⚙️ Manage All Tables
                </div>
                <div
                  onClick={() => {
                    setShowDropdown(false);
                    setDeleteAllInput('');
                    setShowDeleteAllConfirm(true);
                  }}
                  style={{ padding: '10px 14px', fontSize: '13px', color: '#ef4444', cursor: 'pointer', borderTop: `1px solid ${darkMode ? '#2d2d44' : '#eee'}` }}
                  onMouseEnter={(e) => e.target.style.background = darkMode ? '#3a2020' : '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  🗑️ Delete All Tables
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              const tableData = encodeURIComponent(JSON.stringify({
                tableId: 1,
                tableName: 'T1'
              }));
              window.open(`/qr-ordering.html?table=${tableData}`, '_blank');
            }}
            style={{
              padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
              background: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
              width: screenSize === 'small' ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#7c3aed';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#8b5cf6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            📱 QR Ordering
          </button>
        </div>

        {/* Tables Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: screenSize === 'small' ? '12px' : '20px'
        }}>
          {(tablesWithStatus || []).map(table => (
            <div
              key={table.id}
              onClick={() => {
                setSelectedTableForOrders(table);
                setShowOrdersModal(true);
              }}
              style={{
                background: darkMode ? '#252538' : '#ffffff',
                borderRadius: '16px',
                padding: screenSize === 'small' ? '16px' : '24px',
                border: table.status === 'occupied' ? `2px solid ${darkMode ? '#f59e0b' : '#f59e0b'}` : `2px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 8px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: screenSize === 'small' ? '12px' : '16px',
                right: screenSize === 'small' ? '12px' : '16px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: table.status === 'occupied' ? '#f59e0b' : '#22c55e'
              }} />
              <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginBottom: '8px' }}>
                {table.name}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '12px' }}>
                Capacity: {table.capacity}
              </div>
              <div style={{
                fontSize: screenSize === 'small' ? '11px' : '12px',
                color: table.status === 'occupied' ? '#f59e0b' : '#22c55e',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px'
              }}>
                {table.status}
              </div>
              
              {/* Order Details */}
              {tableOrders[table.id] && tableOrders[table.id].length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {tableOrders[table.id].slice(0, 2).map((order, idx) => (
                    <div
                      key={order.id || idx}
                      style={{
                        padding: '8px',
                        background: darkMode ? '#1a1a2e' : '#f3f4f6',
                        borderRadius: '8px',
                        marginBottom: idx < tableOrders[table.id].slice(0, 2).length - 1 ? '8px' : '0',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                      }}
                    >
                      {order.token && (
                        <div style={{
                          fontSize: screenSize === 'small' ? '14px' : '16px',
                          fontWeight: '700',
                          color: '#6366f1',
                          marginBottom: '4px'
                        }}>
                          {order.token}
                        </div>
                      )}
                      <div style={{
                        fontSize: screenSize === 'small' ? '11px' : '12px',
                        color: darkMode ? '#8b8b9e' : '#8b8b9e',
                        marginBottom: '4px'
                      }}>
                        {order.customerName || 'Walk-in'}
                      </div>
                      <div style={{
                        fontSize: screenSize === 'small' ? '10px' : '11px',
                        color: darkMode ? '#8b8b9e' : '#8b8b9e',
                        marginBottom: '4px'
                      }}>
                        {order.items?.length || 0} items • ₹{(order.total || 0).toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: screenSize === 'small' ? '10px' : '11px',
                        color: order.status === 'PENDING' ? '#f59e0b' : order.status === 'IN_PROGRESS' ? '#3b82f6' : '#22c55e',
                        fontWeight: '500'
                      }}>
                        {order.status}
                      </div>
                    </div>
                  ))}
                  {tableOrders[table.id].length > 2 && (
                    <div style={{
                      fontSize: screenSize === 'small' ? '10px' : '11px',
                      color: darkMode ? '#8b8b9e' : '#8b8b9e',
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      +{tableOrders[table.id].length - 2} more
                    </div>
                  )}
                </div>
              )}
              
              {/* QR Code Quick Button (reverted to single clean button) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTableForQR(table);
                  setShowQRModal(true);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '36px',
                  background: darkMode ? '#2d2d48' : '#f3f4f6',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: darkMode ? '#fff' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 15
                }}
                title="View QR Code"
              >
                📱 QR
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Table Order History Modal */}
      {showOrdersModal && selectedTableForOrders && (() => {
        const tableId = selectedTableForOrders.id;

        const allTableOrders = [...orders, ...qrOrders].filter(order => {
          if (!order) return false;
          const oTableId = order.tableId || (order.tableName && tables ? tables.find(t => t.name === order.tableName)?.id : null);
          return oTableId === tableId && order.status !== 'CANCELLED';
        });

        const filteredModalOrders = allTableOrders.filter(order => {
          if (!order.createdAt) return ordersDateFilter === 'all';
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
          const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          switch (ordersDateFilter) {
            case 'today': return orderDate >= startOfToday;
            case 'yesterday': return orderDate >= startOfYesterday && orderDate < startOfToday;
            case 'week': return orderDate >= startOfWeek;
            case 'month': return orderDate >= startOfMonth;
            case 'custom':
              if (!customDateFrom && !customDateTo) return true;
              const from = customDateFrom ? new Date(customDateFrom) : new Date(0);
              const to = customDateTo ? new Date(customDateTo) : new Date();
              to.setHours(23, 59, 59, 999);
              return orderDate >= from && orderDate <= to;
            default: return true;
          }
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const totalRevenue = filteredModalOrders.reduce((s, o) => s + (o.total || 0), 0);

        const statusColors = {
          'COMPLETED': '#22c55e', 'completed': '#22c55e',
          'PENDING': '#f59e0b', 'pending': '#f59e0b',
          'IN_PROGRESS': '#3b82f6', 'in_progress': '#3b82f6',
          'READY': '#22c55e', 'ready': '#22c55e',
          'PREPARING': '#8b5cf6', 'preparing': '#8b5cf6',
        };

        const filterBtns = [
          { key: 'all', label: 'All Time' },
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'custom', label: '📅 Custom' },
        ];

        return (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '16px'
          }} onClick={(e) => { if (e.target === e.currentTarget) setShowOrdersModal(false); }}>
            <div style={{
              background: darkMode ? '#1e1e2e' : '#ffffff',
              borderRadius: '20px',
              width: '100%', maxWidth: '760px',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: darkMode ? '#252535' : '#f8fafc',
                flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
                    🪑 {selectedTableForOrders.name} — Order History
                  </div>
                  <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginTop: '4px' }}>
                    {filteredModalOrders.length} order{filteredModalOrders.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Total Revenue: <strong style={{ color: '#22c55e' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  style={{
                    width: '36px', height: '36px',
                    background: darkMode ? '#3a3a4a' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#e0e0e0',
                    border: 'none', borderRadius: '10px',
                    fontSize: '18px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>
              </div>

              {/* Date Filters */}
              <div style={{
                padding: '14px 24px',
                borderBottom: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`,
                flexShrink: 0,
                background: darkMode ? '#1e1e2e' : '#ffffff'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {filterBtns.map(fb => (
                    <button key={fb.key} onClick={() => setOrdersDateFilter(fb.key)} style={{
                      padding: '6px 14px',
                      background: ordersDateFilter === fb.key ? '#6366f1' : (darkMode ? '#2a2a3a' : '#f3f4f6'),
                      color: ordersDateFilter === fb.key ? '#ffffff' : (darkMode ? '#c0c0d0' : '#e0e0e0'),
                      border: ordersDateFilter === fb.key ? '2px solid #6366f1' : `2px solid transparent`,
                      borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>{fb.label}</button>
                  ))}
                </div>
                {ordersDateFilter === 'custom' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', fontWeight: '600' }}>FROM</span>
                    <input type="date" value={customDateFrom}
                      onChange={e => setCustomDateFrom(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, background: darkMode ? '#2a2a3a' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', fontSize: '12px' }} />
                    <span style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', fontWeight: '600' }}>TO</span>
                    <input type="date" value={customDateTo}
                      onChange={e => setCustomDateTo(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, background: darkMode ? '#2a2a3a' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', fontSize: '12px' }} />
                  </div>
                )}
              </div>

              {/* Orders List */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                {filteredModalOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: darkMode ? '#555570' : '#9ca3af' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>No orders found</div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>Try changing the date filter</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredModalOrders.map((order, idx) => (
                      <div key={order.id || idx} style={{
                        background: darkMode ? '#252535' : '#f8fafc',
                        borderRadius: '12px',
                        border: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`,
                        overflow: 'hidden'
                      }}>
                        {/* Order Header */}
                        <div style={{
                          padding: '12px 16px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: darkMode ? '#2a2a3a' : '#f3f4f6',
                          borderBottom: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
                              #{order.orderNumber || String(order.id).slice(-6)}
                            </span>
                            {order.token && (
                              <span style={{ padding: '2px 8px', background: '#6366f1', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {order.token}
                              </span>
                            )}
                            {order.isQROrder && (
                              <span style={{ padding: '2px 8px', background: '#8b5cf6', color: '#fff', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>QR</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                            <span style={{
                              padding: '3px 10px',
                              background: statusColors[(order.status || '').toLowerCase()] || '#8b8b9e',
                              color: '#ffffff', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
                            }}>
                              {order.status || 'unknown'}
                            </span>
                          </div>
                        </div>
                        {/* Order Body */}
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px' }}>
                            {order.customerName || 'Walk-in'} &nbsp;·&nbsp; {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                            {(order.items || []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: darkMode ? '#d0d0e0' : '#e0e0e0' }}>
                                <span>{item.quantity || item.qty || 1}× {item.name}</span>
                                <span style={{ color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>₹{((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}` }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#22c55e' }}>₹{(order.total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Code Modal */}
      {showQRModal && selectedTableForQR && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setShowQRModal(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '20px',
            width: '100%', maxWidth: '400px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
              📱 QR Code — {selectedTableForQR.name}
            </div>
            
            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <img
                src={generateQRCode(selectedTableForQR)}
                alt={`QR Code for ${selectedTableForQR.name}`}
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>
            
            <p style={{ fontSize: '13px', color: darkMode ? '#a0a0b0' : '#4b5563', lineHeight: '1.4' }}>
              Customers can scan this QR code on their phones to place self-orders directly from their table.
            </p>

            <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  const tableData = encodeURIComponent(JSON.stringify({
                    tableId: selectedTableForQR.id,
                    tableName: selectedTableForQR.name
                  }));
                  window.open(`/qr-ordering.html?table=${tableData}`, '_blank');
                }}
                style={{
                  flex: 1, padding: '12px',
                  background: '#6366f1', color: '#ffffff',
                  border: 'none', borderRadius: '10px',
                  fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Open Ordering Page
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  padding: '12px 20px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#c0c0d0' : '#2d2d48',
                  border: 'none', borderRadius: '10px',
                  fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Table Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: screenSize === 'small' ? '0' : '16px'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: screenSize === 'small' ? '0' : '20px',
            width: screenSize === 'small' ? '100vw' : '100%', maxWidth: screenSize === 'small' ? '100vw' : '400px',
            maxHeight: screenSize === 'small' ? '100vh' : 'auto',
            padding: screenSize === 'small' ? '24px 20px' : '24px',
            border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
                {selectedTable ? '✏️ Edit Table' : '➕ Add New Table'}
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: screenSize === 'small' ? '40px' : '32px', height: screenSize === 'small' ? '40px' : '32px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: 'none', borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '20px' : '16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  minHeight: screenSize === 'small' ? '40px' : 'auto'
                }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'small' ? '16px' : '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', color: darkMode ? '#a0a0b0' : '#2d2d48', marginBottom: screenSize === 'small' ? '8px' : '6px' }}>
                  Table Name / Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. T9 or Table 9"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%', padding: screenSize === 'small' ? '14px' : '10px 12px',
                    borderRadius: '8px', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    background: darkMode ? '#252535' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#111827',
                    fontSize: screenSize === 'small' ? '16px' : '14px', boxSizing: 'border-box',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', color: darkMode ? '#a0a0b0' : '#2d2d48', marginBottom: screenSize === 'small' ? '8px' : '6px' }}>
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                  style={{
                    width: '100%', padding: screenSize === 'small' ? '14px' : '10px 12px',
                    borderRadius: '8px', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    background: darkMode ? '#252535' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#111827',
                    fontSize: screenSize === 'small' ? '16px' : '14px', boxSizing: 'border-box',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', marginTop: screenSize === 'small' ? '16px' : '8px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: screenSize === 'small' ? '14px' : '12px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: screenSize === 'small' ? '15px' : '14px',
                  minHeight: screenSize === 'small' ? '48px' : 'auto'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                style={{
                  flex: 1, padding: screenSize === 'small' ? '14px' : '12px',
                  background: '#10b981', color: '#ffffff',
                  border: 'none', borderRadius: '10px',
                  fontWeight: '600', cursor: 'pointer', fontSize: screenSize === 'small' ? '15px' : '14px',
                  minHeight: screenSize === 'small' ? '48px' : 'auto'
                }}
              >
                Save Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tables List Modal */}
      {showManageModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setShowManageModal(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '20px',
            width: '100%', maxWidth: '500px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
                ⚙️ Manage Tables
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                style={{
                  width: '32px', height: '32px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: 'none', borderRadius: '8px',
                  fontSize: '16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                  No tables added yet.
                </div>
              ) : (
                tables.map(table => (
                  <div
                    key={table.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: darkMode ? '#252535' : '#f8fafc',
                      border: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', fontSize: '15px' }}>
                        {table.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b8b9e' }}>
                        Capacity: {table.capacity} guests
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          handleEditTable(table);
                          setShowManageModal(false);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: darkMode ? '#2d2d48' : '#f3f4f6',
                          color: darkMode ? '#ffffff' : '#e0e0e0',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteTable(table.id);
                          setShowManageModal(false);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: `1px solid #fca5a5`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setShowDeleteAllConfirm(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '20px',
            width: '100%', maxWidth: '380px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '40px' }}>🚨</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
              Delete ALL Tables?
            </div>
            <p style={{ fontSize: '13px', color: darkMode ? '#a0a0b0' : '#4b5563', margin: '0', lineHeight: '1.5' }}>
              This will permanently delete all tables from your POS system. To confirm, please type <strong style={{ color: darkMode ? '#fff' : '#111827' }}>DELETE ALL</strong> below:
            </p>
            <input
              type="text"
              placeholder="Type DELETE ALL to confirm"
              value={deleteAllInput}
              onChange={(e) => setDeleteAllInput(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: `1px solid ${deleteAllInput === 'DELETE ALL' ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db')}`,
                background: darkMode ? '#252535' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                fontSize: '14px', boxSizing: 'border-box',
                textAlign: 'center', fontWeight: 'bold'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                style={{
                  flex: 1, padding: '10px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTables([]);
                  setShowDeleteAllConfirm(false);
                }}
                disabled={deleteAllInput !== 'DELETE ALL'}
                style={{
                  flex: 1, padding: '10px',
                  background: deleteAllInput === 'DELETE ALL' ? '#ef4444' : (darkMode ? '#3a1a1a' : '#fca5a5'),
                  color: deleteAllInput === 'DELETE ALL' ? '#ffffff' : (darkMode ? '#666' : '#999'),
                  border: 'none', borderRadius: '8px',
                  fontWeight: '600', cursor: deleteAllInput === 'DELETE ALL' ? 'pointer' : 'not-allowed', fontSize: '13px'
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '20px',
            width: '100%', maxWidth: '350px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '40px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
              Delete Table?
            </div>
            <p style={{ fontSize: '14px', color: darkMode ? '#a0a0b0' : '#4b5563', margin: '0' }}>
              Are you sure you want to delete this table? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: '10px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTable}
                style={{
                  flex: 1, padding: '10px',
                  background: '#ef4444', color: '#ffffff',
                  border: 'none', borderRadius: '8px',
                  fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiter Calls List Modal */}
      {showWaiterCalls && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setShowWaiterCalls(false)}>
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '20px',
            width: '100%', maxWidth: '450px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>
                🔔 Waiter & Assistance Calls
              </div>
              <button
                onClick={() => setShowWaiterCalls(false)}
                style={{
                  width: '32px', height: '32px',
                  background: darkMode ? '#2a2a3a' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#e0e0e0',
                  border: 'none', borderRadius: '8px',
                  fontSize: '16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>

            {waiterCalls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: darkMode ? '#666' : '#9ca3af' }}>
                No active waiter calls.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {waiterCalls.map(call => (
                  <div key={call.id} style={{
                    background: darkMode ? '#252535' : '#f8fafc',
                    border: `1px solid ${darkMode ? '#252538' : '#e5e7eb'}`,
                    borderRadius: '12px', padding: '14px',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', fontSize: '14px' }}>
                        🪑 {call.tableName || 'Table'} ({call.customerName || 'Guest'})
                      </span>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                        background: call.type?.includes('WHEELCHAIR') ? '#6366f1' : (call.type?.includes('WATER') ? '#3b82f6' : '#ef4444'),
                        color: '#fff'
                      }}>
                        {call.type?.replace('CALL_', '').replace('_', ' ') || 'CALL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: darkMode ? '#a0a0b0' : '#4b5563' }}>
                      Requested: {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button
                      onClick={() => handleDismissWaiterCall(call.id)}
                      style={{
                        width: '100%', padding: '8px',
                        background: '#10b981', color: '#fff',
                        border: 'none', borderRadius: '8px',
                        fontWeight: '600', cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      ✓ Acknowledge & Clear
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
