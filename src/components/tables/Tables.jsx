import React, { useState, useMemo } from 'react';
import QROrdering from '../qrodering/QROrdering';

export default function Tables({ onNavigate, orders = [], setOrders, tables: externalTables = [], setTables: setExternalTables, menuItems = [] }) {
  const [localTables, setLocalTables] = useState([
    { id: 1, name: 'T1', status: 'available', capacity: 4 },
    { id: 2, name: 'T2', status: 'available', capacity: 4 },
    { id: 3, name: 'T3', status: 'occupied', capacity: 6 },
    { id: 4, name: 'T4', status: 'available', capacity: 2 },
    { id: 5, name: 'T5', status: 'available', capacity: 8 },
    { id: 6, name: 'T6', status: 'occupied', capacity: 4 },
    { id: 7, name: 'T7', status: 'available', capacity: 4 },
    { id: 8, name: 'T8', status: 'available', capacity: 6 }
  ]);

  // Use external tables if provided, otherwise use local state
  const tables = externalTables.length > 0 ? externalTables : localTables;
  const setTables = setExternalTables || setLocalTables;
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: 4 });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedTableForOrders, setSelectedTableForOrders] = useState(null);
  const [showQRDemoModal, setShowQRDemoModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    tableId: 'all'
  });

  // Get orders for each table with filters applied
  const tableOrders = useMemo(() => {
    const ordersByTable = {};
    orders.forEach(order => {
      if (order.tableId && order.status !== 'CANCELLED') {
        // Apply filters
        if (filters.status !== 'all' && order.status !== filters.status) return;
        if (filters.tableId !== 'all' && order.tableId !== filters.tableId) return;
        if (filters.dateFrom && new Date(order.createdAt) < new Date(filters.dateFrom)) return;
        if (filters.dateTo && new Date(order.createdAt) > new Date(filters.dateTo)) return;
        
        if (!ordersByTable[order.tableId]) {
          ordersByTable[order.tableId] = [];
        }
        ordersByTable[order.tableId].push(order);
      }
    });
    return ordersByTable;
  }, [orders, filters]);

  // Auto-occupy tables based on active orders
  const tablesWithStatus = useMemo(() => {
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
      setTables(tables.map(t => 
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
      setTables([...tables, newTable]);
    }
    setShowModal(false);
  };

  const handleDeleteTable = (tableId) => {
    if (confirm('Are you sure you want to delete this table?')) {
      setTables(tables.filter(t => t.id !== tableId));
    }
  };

  const handleStatusToggle = (table) => {
    const newStatus = table.status === 'available' ? 'occupied' : 'available';
    setTables(tables.map(t => 
      t.id === table.id 
        ? { ...t, status: newStatus }
        : t
    ));
  };

  const availableCount = tablesWithStatus.filter(t => t.status === 'available').length;
  const occupiedCount = tablesWithStatus.filter(t => t.status === 'occupied').length;

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
              Tables
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Manage your restaurant tables
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
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              Available: <span style={{ color: '#111827', fontWeight: '600' }}>{availableCount}</span> | Occupied: <span style={{ color: '#111827', fontWeight: '600' }}>{occupiedCount}</span>
            </div>
            <button
              onClick={handleAddTable}
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
              + Add Table
            </button>
          </div>
          
          {/* Filters */}
          <div style={{ 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            padding: '16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
              Filters
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Table
                </label>
                <select
                  value={filters.tableId}
                  onChange={(e) => setFilters({ ...filters, tableId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Tables</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '', tableId: 'all' })}
                style={{
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
          width: '100%'
        }}>
          {tablesWithStatus.map(table => (
            <div
              key={table.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                width: '100%'
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                background: table.status === 'available' ? '#f0fdf4' : '#fef2f2',
                border: '2px solid',
                borderColor: table.status === 'available' ? '#059669' : '#dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '600',
                color: table.status === 'available' ? '#059669' : '#dc2626',
                cursor: 'pointer'
              }}
                onClick={() => {
                  setSelectedTableForOrders(table);
                  setShowOrdersModal(true);
                }}
                title="Click to view orders"
              >
                {table.name}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {table.name}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Capacity: {table.capacity}
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                color: table.status === 'available' ? '#059669' : '#dc2626',
                padding: '4px 12px',
                borderRadius: '12px',
                background: table.status === 'available' ? '#f0fdf4' : '#fef2f2'
              }}>
                {table.status === 'available' ? 'Available' : 'Occupied'}
              </div>
              {table.orderCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedTableForOrders(table);
                    setShowOrdersModal(true);
                  }}
                  style={{
                    background: '#f9fafb',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px'
                  }}
                >
                  {table.orderCount} Order{table.orderCount > 1 ? 's' : ''}
                </button>
              )}
              {tableOrders[table.id] && tableOrders[table.id].length > 0 && (
                <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                  Latest: ₹{tableOrders[table.id][tableOrders[table.id].length - 1].total?.toLocaleString() || 0}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setSelectedTableForQR(table);
                    setShowQRModal(true);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    flex: 1
                  }}
                >
                  QR
                </button>
                <button
                  onClick={() => handleEditTable(table)}
                  style={{
                    background: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    flex: 1
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  style={{
                    background: '#ffffff',
                    color: '#ef4444',
                    border: '1px solid #fecaca',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    flex: 1
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTableForQR && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '90%',
            maxWidth: '320px',
            overflow: 'hidden'
          }}>
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
              <span>QR Code - {selectedTableForQR.name}</span>
              <button
                onClick={() => setShowQRModal(false)}
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
            <div style={{ padding: '24px', textAlign: 'center', background: '#ffffff' }}>
              <img 
                src={generateQRCode(selectedTableForQR)} 
                alt={`QR Code for ${selectedTableForQR.name}`}
                style={{ width: '150px', height: '150px', marginBottom: '16px', maxWidth: '100%' }}
              />
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                {selectedTableForQR.name}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Capacity: {selectedTableForQR.capacity}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Scan to order from this table
              </div>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setShowQRDemoModal(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#8B4513',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📱 Demo QR Menu View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && selectedTableForOrders && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <span>Orders - {selectedTableForOrders.name}</span>
              <button
                onClick={() => setShowOrdersModal(false)}
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
            <div style={{ padding: '24px', background: '#ffffff' }}>
              {tableOrders[selectedTableForOrders.id] && tableOrders[selectedTableForOrders.id].length > 0 ? (
                tableOrders[selectedTableForOrders.id].map((order, index) => (
                  <div key={order.id} style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        Order #{order.id.split('-')[1]}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                      Status: <span style={{ fontWeight: '500', color: order.status === 'COMPLETED' ? '#059669' : order.status === 'CANCELLED' ? '#dc2626' : '#d97706' }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                      Staff: <span style={{ fontWeight: '500', color: '#111827' }}>
                        {order.employeeName || 'Unknown'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                      Customer: <span style={{ fontWeight: '500', color: '#111827' }}>
                        {order.customerName || 'Walk-in'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                      Payment: <span style={{ fontWeight: '500', color: '#111827' }}>
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      Total: <span style={{ fontWeight: '600', color: '#111827' }}>
                        ₹{order.total?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Items:
                    </div>
                    {order.items && order.items.map((item, itemIndex) => (
                      <div key={itemIndex} style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        padding: '4px 0',
                        borderBottom: itemIndex < order.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}>
                        {item.name} x {item.qty} - ₹{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No orders for this table
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '90%',
            maxWidth: '400px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {selectedTable ? 'Edit Table' : 'Add Table'}
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Table Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., T9"
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
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  min="1"
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
              <div style={{ display: 'flex', gap: '12px' }}>
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
                  onClick={handleSaveTable}
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
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Demo Modal */}
      {showQRDemoModal && selectedTableForQR && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '40px',
            padding: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '380px'
          }}>
            {/* Phone Frame */}
            <div style={{
              background: '#000',
              borderRadius: '32px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Phone Notch */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '28px',
                background: '#000',
                borderRadius: '0 0 16px 16px',
                zIndex: 10
              }} />
              
              {/* Status Bar */}
              <div style={{
                background: '#8B4513',
                color: '#fff',
                padding: '12px 20px 8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '36px'
              }}>
                <span>9:41</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Phone Screen Content */}
              <div style={{
                height: '600px',
                overflow: 'auto',
                background: '#f5f5f5'
              }}>
                <QROrdering 
                  menuItems={menuItems} 
                  onPlaceOrder={(order) => {
                    setOrders([...orders, order]);
                    setShowQRDemoModal(false);
                  }} 
                />
              </div>

              {/* Home Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                zIndex: 10
              }} />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowQRDemoModal(false)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close Phone View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
