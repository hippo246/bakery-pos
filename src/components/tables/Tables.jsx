import React, { useState, useMemo, useEffect } from 'react';
import QROrdering from '../qrodering/QROrdering';

export default function Tables({ onNavigate, orders = [], setOrders, tables: externalTables = [], setTables: setExternalTables, menuItems = [], settings = {} }) {
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
      background: '#1a1a2e',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Controls */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '28px 32px',
        borderBottom: '1px solid #2d2d44'
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
                background: '#2d2d44',
                color: '#e0e0e0',
                border: '1px solid #3d3d5c',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#3d3d5c'}
              onMouseLeave={(e) => e.target.style.background = '#2d2d44'}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '28px 32px', overflow: 'auto', flex: 1 }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: screenSize === 'small' ? '12px' : '20px',
          marginBottom: screenSize === 'small' ? '16px' : '28px'
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Available
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#22c55e' }}>
              {availableCount}
            </div>
          </div>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '24px',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Occupied
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
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: screenSize === 'small' ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => e.target.style.background = '#5558e3'}
            onMouseLeave={(e) => e.target.style.background = '#6366f1'}
          >
            + Add Table
          </button>
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
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: screenSize === 'small' ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => e.target.style.background = '#7c3aed'}
            onMouseLeave={(e) => e.target.style.background = '#8b5cf6'}
          >
            📱 QR
          </button>
          <button
            onClick={() => setShowQRDemoModal(true)}
            style={{
              padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
              background: '#2d2d44',
              color: '#e0e0e0',
              border: '1px solid #3d3d5c',
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: screenSize === 'small' ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3d3d5c'}
            onMouseLeave={(e) => e.target.style.background = '#2d2d44'}
          >
            QR Demo
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
                background: '#252538',
                borderRadius: '16px',
                padding: screenSize === 'small' ? '16px' : '24px',
                border: table.status === 'occupied' ? '2px solid #f59e0b' : '2px solid #2d2d44',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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
              <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                {table.name}
              </div>
              <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '12px' }}>
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
                        background: '#1a1a2e',
                        borderRadius: '6px',
                        marginBottom: idx < tableOrders[table.id].slice(0, 2).length - 1 ? '8px' : '0',
                        border: '1px solid #2d2d44'
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
                        color: '#e0e0e0',
                        marginBottom: '4px'
                      }}>
                        {order.customerName || 'Walk-in'}
                      </div>
                      <div style={{
                        fontSize: screenSize === 'small' ? '10px' : '11px',
                        color: '#8b8b9e',
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
                      color: '#8b8b9e',
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      +{tableOrders[table.id].length - 2} more
                    </div>
                  )}
                </div>
              )}
              
              {table.orderCount > 0 && !tableOrders[table.id] && (
                <div style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  background: '#2d2d44',
                  borderRadius: '6px',
                  fontSize: screenSize === 'small' ? '11px' : '12px',
                  color: '#e0e0e0'
                }}>
                  {table.orderCount} order{table.orderCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
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
          zIndex: 1000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#252538',
           borderRadius: '16px',
            padding: screenSize === 'small' ? '24px' : '32px',
            width: screenSize === 'small' ? '100%' : '400px',
            maxWidth: screenSize === 'small' ? '100%' : '90vw',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              {selectedTable ? 'Edit Table' : 'Add Table'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                Table Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '10px' : '12px',
                  background: '#1a1a2e',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  outline: 'none'
                }}
                placeholder="e.g., T1"
              />
            </div>
            <div style={{ marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#8b8b9e', marginBottom: '8px' }}>
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '10px' : '12px',
                  background: '#1a1a2e',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: screenSize === 'small' ? '14px' : '14px',
                  outline: 'none'
                }}
                min="1"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
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

      {showQRDemoModal && (
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
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '32px',
            width: '90%',
            maxWidth: screenSize === 'small' ? '100%' : '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff' }}>
                QR Ordering
              </div>
              <button
                onClick={() => setShowQRDemoModal(false)}
                style={{
                  padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
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
            <QROrdering tables={tables} menuItems={menuItems} onPlaceOrder={(order) => {
              // Handle QR order - add to orders
              setOrders(prev => [...(prev || []), order]);
              setAlertMessage('QR order received!');
              setShowAlert(true);
            }} />
          </div>
        </div>
      )}

      {showOrdersModal && selectedTableForOrders && (
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
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '16px' : '32px',
            width: '90%',
            maxWidth: screenSize === 'small' ? '100%' : '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff' }}>
                Orders for {selectedTableForOrders.name}
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                style={{
                  padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
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
            
            {/* Date Filter */}
            <div style={{
              background: '#1a1a2e',
              borderRadius: '8px',
              padding: screenSize === 'small' ? '12px' : '16px',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '12px' }}>
                Filter by Date
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'today', 'yesterday', 'week', 'custom'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setOrdersDateFilter(filter)}
                    style={{
                      padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                      background: ordersDateFilter === filter ? '#6366f1' : '#2d2d44',
                      color: ordersDateFilter === filter ? '#ffffff' : '#e0e0e0',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '11px' : '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {ordersDateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>
                      From
                    </label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#252538',
                        border: '1px solid #2d2d44',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>
                      To
                    </label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#252538',
                        border: '1px solid #2d2d44',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {(!getFilteredTableOrders(selectedTableForOrders?.id) || getFilteredTableOrders(selectedTableForOrders?.id)?.length === 0) ? (
              <div style={{ padding: screenSize === 'small' ? '24px' : '40px', textAlign: 'center', color: '#8b8b9e', fontSize: screenSize === 'small' ? '14px' : 'inherit' }}>
                No orders for this table
              </div>
            ) : (
              <div>
                {getFilteredTableOrders(selectedTableForOrders?.id).map(order => (
                  <div key={order.id} style={{
                    background: '#1a1a2e',
                    borderRadius: '12px',
                    padding: screenSize === 'small' ? '12px' : '16px',
                    marginBottom: '12px',
                    border: order.isQROrder ? '1px solid #8b5cf6' : '1px solid #2d2d44'
                  }}>
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '600', color: '#ffffff' }}>
                          Order #{order.id?.slice(-6)}
                        </span>
                        {order.token && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: screenSize === 'small' ? '12px' : '13px',
                            fontWeight: '700',
                            background: '#6366f1',
                            color: '#ffffff'
                          }}>
                            {order.token}
                          </span>
                        )}
                        {order.isQROrder && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: '#8b5cf6',
                            color: '#ffffff'
                          }}>
                            QR
                          </span>
                        )}
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: screenSize === 'small' ? '11px' : '12px',
                        fontWeight: '600',
                        background: order.status === 'COMPLETED' ? '#22c55e20' : order.status === 'PENDING' ? '#f59e0b20' : '#3b82f620',
                        color: order.status === 'COMPLETED' ? '#22c55e' : order.status === 'PENDING' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#e0e0e0', marginBottom: '4px' }}>
                        {order.customerName || 'Walk-in'}
                      </div>
                      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{
                        background: '#252538',
                        borderRadius: '8px',
                        padding: screenSize === 'small' ? '10px' : '12px',
                        marginBottom: '12px'
                      }}>
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '6px 0',
                              borderBottom: idx < order.items.length - 1 ? '1px solid #2d2d44' : 'none'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#e0e0e0' }}>
                                {item.name}
                                {item.isCustom && (
                                  <span style={{ 
                                    marginLeft: '4px', 
                                    fontSize: '10px', 
                                    padding: '1px 4px', 
                                    borderRadius: '3px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #f59e0b',
                                    fontWeight: '600'
                                  }}>
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: '#8b8b9e' }}>
                                Qty: {item.qty || item.quantity || 1}
                              </div>
                              {item.baseItemName && (
                                <div style={{ fontSize: '10px', color: '#92400e', fontStyle: 'italic' }}>
                                  Base: {item.baseItemName}
                                </div>
                              )}
                              {item.notes && (
                                <div style={{ 
                                  fontSize: '10px', 
                                  color: item.noteType === 'allergy' ? '#ef4444' : '#8b8b9e',
                                  fontStyle: 'italic',
                                  marginTop: '2px'
                                }}>
                                  {item.noteType === 'allergy' ? '⚠️ ALLERGY: ' : '📝 '}{item.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', color: '#e0e0e0' }}>
                              ₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e' }}>
                        {order.paymentMethod || 'CASH'}
                      </div>
                      <div style={{ fontSize: screenSize === 'small' ? '15px' : '16px', fontWeight: '700', color: '#ffffff' }}>
                        ₹{(order.total || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          zIndex: 2000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '24px' : '32px',
            width: screenSize === 'small' ? '100%' : '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Delete Table
            </h3>
            <p style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: '#8b8b9e', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              Are you sure you want to delete this table?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTableToDelete(null);
                }}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#2d2d44',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTable}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiter Calls Modal */}
      {showWaiterCalls && (
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
          zIndex: 2000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '24px' : '32px',
            width: screenSize === 'small' ? '100%' : '500px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Waiter Calls
              </h3>
              <button
                onClick={() => setShowWaiterCalls(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b8b9e',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>
            {waiterCalls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b8b9e' }}>
                No pending waiter calls
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {waiterCalls.map(call => (
                  <div key={call.id} style={{
                    background: '#2d2d44',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #3d3d5c'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {call.tableName || 'Unknown Table'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#8b8b9e' }}>
                          {call.customerName || 'Guest'}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8b8b9e' }}>
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissWaiterCall(call.id)}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '8px'
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
          zIndex: 2000,
          padding: screenSize === 'small' ? '16px' : '0'
        }}>
          <div style={{
            background: '#252538',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '24px' : '32px',
            width: screenSize === 'small' ? '100%' : '400px',
            maxWidth: '90vw',
            border: '1px solid #2d2d44'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', margin: 0 }}>
              Notice
            </h3>
            <p style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: '#8b8b9e', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '12px' : '14px',
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
