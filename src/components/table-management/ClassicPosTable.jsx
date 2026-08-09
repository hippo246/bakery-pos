/**
 * Classic POS Table Management & Floor Layout
 * 
 * High-density, desktop-first Table Management System with:
 * - Top navigation & section filter bar with zone tabs
 * - Main floor plan grid (70%) with interactive table cards
 * - Sidebar panel (30%) with live table details and quick actions
 * - Color-coded status badges and high-density layout
 * - Classic legacy POS desktop aesthetic
 */

import React, { useState, useMemo, useCallback } from 'react';

export default function ClassicPosTable({ tables = [], orders = [], staff = [], setTables, setOrders, onNavigate, menuItems = [], kdsCards = [], setKdsCards }) {
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [takeawayData, setTakeawayData] = useState({ customerName: '', phoneNumber: '' });
  const [posCart, setPosCart] = useState([]);

  // Use real table data from props
  const tableData = useMemo(() => {
    return tables.map(table => {
      // Map lowercase status to uppercase for Classic POS
      const statusMap = {
        'available': 'VACANT',
        'occupied': 'OCCUPIED',
        'billed': 'BILLED',
        'reserved': 'RESERVED',
        'cleaning': 'CLEANING'
      };
      const mappedStatus = statusMap[table.status] || 'VACANT';
      
      // Find orders for this table
      const tableOrders = orders.filter(order => order.tableId === table.id);
      const totalAmount = tableOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
      
      // Calculate running time for occupied tables
      const runningTime = mappedStatus === 'OCCUPIED' && table.occupiedAt 
        ? Math.floor((Date.now() - table.occupiedAt) / 60000) 
        : 0;

      // Get order items for display
      const orderItems = tableOrders.flatMap(order => 
        (order.items || []).map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          status: item.status || 'Served'
        }))
      );

      // Get assigned waiter
      const waiter = staff.find(s => s.id === table.assignedStaffId)?.name || '-';

      return {
        id: table.id,
        number: table.number,
        section: table.area || 'MAIN HALL',
        seats: table.capacity || 4,
        status: mappedStatus,
        runningTime,
        waiter,
        billTotal: totalAmount,
        orderItems,
        currentOrderId: table.currentOrder
      };
    });
  }, [tables, orders, staff]);

  // Filter tables by selected zone
  const filteredTables = useMemo(() => {
    if (selectedZone === 'ALL') return tableData;
    return tableData.filter(table => table.section === selectedZone);
  }, [tableData, selectedZone]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      available: tableData.filter(t => t.status === 'VACANT').length,
      occupied: tableData.filter(t => t.status === 'OCCUPIED').length,
      billed: tableData.filter(t => t.status === 'BILLED').length,
      reserved: tableData.filter(t => t.status === 'RESERVED').length,
    };
  }, [tableData]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'VACANT': { bg: '#15803D', text: '#ffffff', border: '#22C55E' },
      'OCCUPIED': { bg: '#B91C1C', text: '#ffffff', border: '#EF4444' },
      'BILLED': { bg: '#1D4ED8', text: '#ffffff', border: '#3B82F6' },
      'RESERVED': { bg: '#C2410C', text: '#ffffff', border: '#F97316' },
      'CLEANING': { bg: '#6B7280', text: '#ffffff', border: '#9CA3AF' },
    };
    return colors[status] || { bg: '#6B7280', text: '#ffffff', border: '#9CA3AF' };
  };

  // Handle table selection
  const handleTableClick = useCallback((table) => {
    // If clicking on a VACANT table, mark it as OCCUPIED
    if (table.status === 'VACANT' && setTables) {
      setTables(prev => prev.map(t => 
        t.id === table.id 
          ? { ...t, status: 'occupied', occupiedAt: Date.now() }
          : t
      ));
    }
    setSelectedTable(table);
  }, [setTables]);

  // Handle quick action
  const handleQuickAction = useCallback((action) => {
    if (action === 'clear_table' && selectedTable) {
      // Clear table - set to VACANT and remove current order
      if (setTables) {
        setTables(prev => prev.map(t => 
          t.id === selectedTable.id 
            ? { ...t, status: 'available', occupiedAt: null, currentOrder: null }
            : t
        ));
      }
      setSelectedTable(null);
      return;
    }

    if (action === 'add_items' && selectedTable) {
      // Open POS for this table - show POS panel within tables tab
      if (setTables && selectedTable.status === 'VACANT') {
        setTables(prev => prev.map(t => 
          t.id === selectedTable.id 
            ? { ...t, status: 'occupied', occupiedAt: Date.now() }
            : t
        ));
      }
      setActiveModal('add_items');
      return;
    }

    if (action === 'print_bill' && selectedTable) {
      setActiveModal('print_bill');
      return;
    }

    if (action === 'split_bill' && selectedTable) {
      setActiveModal('split_bill');
      return;
    }

    setActiveModal(action);
  }, [selectedTable, setTables, onNavigate]);

  // Close modal
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Base styles
  const baseStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    color: '#e5e5e5',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#18181B',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    ...baseStyle,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#27272A',
    borderBottom: '2px solid #3F3F46',
  };

  const tabStyle = {
    padding: '6px 12px',
    background: '#3F3F46',
    color: '#9CA3AF',
    border: '1px solid #52525B',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const activeTabStyle = {
    ...tabStyle,
    background: '#22C55E',
    color: '#ffffff',
    borderColor: '#22C55E',
  };

  const badgeStyle = {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  };

  const actionButtonStyle = {
    padding: '6px 12px',
    background: '#3B82F6',
    color: '#ffffff',
    border: '1px solid #3B82F6',
    borderRadius: '2px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const mainContentStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const floorPlanStyle = {
    flex: '0.7',
    padding: '16px',
    overflow: 'auto',
    borderRight: '2px solid #3F3F46',
  };

  const sidebarStyle = {
    flex: '0.3',
    padding: '16px',
    background: '#1F1F22',
    overflow: 'auto',
  };

  const tableCardStyle = {
    padding: '12px',
    background: '#27272A',
    border: '2px solid #3F3F46',
    borderRadius: '4px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const selectedTableCardStyle = {
    ...tableCardStyle,
    borderColor: '#22C55E',
    background: '#1A2E1A',
  };

  const sectionTitleStyle = {
    fontSize: '13px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  };

  const quickActionGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '16px',
  };

  const quickActionButtonStyle = {
    padding: '12px',
    border: '2px solid',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    textTransform: 'uppercase',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      {/* TOP HEADER - FILTER BAR */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginRight: '12px' }}>
            TABLE MANAGEMENT
          </span>
          {['ALL', 'MAIN HALL', 'PATIO / BALCONY', 'POOL SIDE', 'AC ROOM'].map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              style={selectedZone === zone ? activeTabStyle : tabStyle}
            >
              {zone}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ ...badgeStyle, background: '#15803D', color: '#ffffff' }}>
              Available: {statusCounts.available}
            </span>
            <span style={{ ...badgeStyle, background: '#C2410C', color: '#ffffff' }}>
              Occupied: {statusCounts.occupied}
            </span>
            <span style={{ ...badgeStyle, background: '#1D4ED8', color: '#ffffff' }}>
              Billed: {statusCounts.billed}
            </span>
            <span style={{ ...badgeStyle, background: '#6B21A8', color: '#ffffff' }}>
              Reserved: {statusCounts.reserved}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
            <button onClick={() => handleQuickAction('takeaway')} style={actionButtonStyle}>
              QUICK TAKEAWAY
            </button>
            <button onClick={() => handleQuickAction('merge')} style={actionButtonStyle}>
              MERGE TABLES
            </button>
            <button onClick={() => handleQuickAction('transfer')} style={actionButtonStyle}>
              TRANSFER TABLE
            </button>
            <button onClick={() => handleQuickAction('add_table')} style={{ ...actionButtonStyle, background: '#22C55E', borderColor: '#22C55E' }}>
              ADD TABLE
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={mainContentStyle}>
        {/* LEFT PANEL - FLOOR PLAN GRID */}
        <div style={floorPlanStyle}>
          <div style={sectionTitleStyle}>
            {selectedZone === 'ALL' ? 'ALL SECTIONS' : selectedZone}
          </div>
          <div style={gridStyle}>
            {filteredTables.map(table => {
              const statusColor = getStatusColor(table.status);
              const isSelected = selectedTable?.id === table.id;
              
              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  style={isSelected ? selectedTableCardStyle : tableCardStyle}
                >
                  {/* Table Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                      {table.id}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#9CA3AF', background: '#3F3F46', padding: '2px 6px', borderRadius: '2px' }}>
                      {table.seats} Seater
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: statusColor.bg,
                    color: statusColor.text,
                    borderRadius: '2px',
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}>
                    {table.status}
                  </div>
                  
                  {/* Table Details */}
                  {table.status === 'OCCUPIED' && (
                    <>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '4px' }}>
                        ⏱ {table.runningTime} mins
                      </div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '4px' }}>
                        👤 {table.waiter}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#22C55E' }}>
                        ₹{table.billTotal.toFixed(2)}
                      </div>
                    </>
                  )}
                  
                  {table.status === 'BILLED' && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#3B82F6' }}>
                      ₹{table.billTotal.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL - SIDEBAR */}
        <div style={sidebarStyle}>
          {selectedTable ? (
            <>
              {/* Selected Table Header */}
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase' }}>
                TABLE {selectedTable.id} ({selectedTable.section})
              </div>
              
              {/* Quick Info Bar */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '11px', color: '#9CA3AF' }}>
                <span>👥 Covers: {selectedTable.seats} Guests</span>
                <span>👤 Served By: {selectedTable.waiter}</span>
                <span>⏱ Session: {selectedTable.runningTime} mins</span>
              </div>
              
              {/* Active Table Items */}
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>
                ACTIVE TABLE ITEMS
              </div>
              
              <div style={{ background: '#27272A', border: '1px solid #3F3F46', borderRadius: '4px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', background: '#3F3F46', padding: '8px', fontSize: '10px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>
                  <div>Item Name</div>
                  <div>Qty</div>
                  <div>Price</div>
                  <div>KOT Status</div>
                </div>
                
                {selectedTable.orderItems.length > 0 ? (
                  selectedTable.orderItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '8px', fontSize: '11px', borderBottom: '1px solid #3F3F46' }}>
                      <div style={{ color: '#e5e5e5' }}>{item.qty}x {item.name}</div>
                      <div style={{ color: '#9CA3AF' }}>{item.qty}</div>
                      <div style={{ color: '#22C55E', fontWeight: '700' }}>₹{item.price}</div>
                      <div style={{ 
                        padding: '2px 4px', 
                        borderRadius: '2px', 
                        fontSize: '9px', 
                        fontWeight: '700', 
                        textTransform: 'uppercase',
                        background: item.status === 'Served' ? '#22C55E' : '#F59E0B',
                        color: '#ffffff',
                        textAlign: 'center',
                      }}>
                        {item.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
                    No active orders
                  </div>
                )}
              </div>
              
              {/* Financial Totals */}
              <div style={{ background: '#27272A', border: '1px solid #3F3F46', borderRadius: '4px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#9CA3AF' }}>
                  <span>Subtotal</span>
                  <span>₹{selectedTable.billTotal > 0 ? (selectedTable.billTotal / 1.05).toFixed(2) : '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#9CA3AF' }}>
                  <span>GST (5%)</span>
                  <span>₹{selectedTable.billTotal > 0 ? (selectedTable.billTotal * 0.05 / 1.05).toFixed(2) : '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #3F3F46', fontSize: '13px', fontWeight: '800', color: '#22C55E' }}>
                  <span>CURRENT TOTAL</span>
                  <span>₹{selectedTable.billTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div style={quickActionGridStyle}>
                <button 
                  onClick={() => handleQuickAction('add_items')}
                  style={{ ...quickActionButtonStyle, background: '#22C55E', borderColor: '#22C55E', color: '#ffffff' }}
                >
                  ADD ITEMS / OPEN POS
                </button>
                <button 
                  onClick={() => handleQuickAction('print_bill')}
                  style={{ ...quickActionButtonStyle, background: '#3B82F6', borderColor: '#3B82F6', color: '#ffffff' }}
                >
                  PRINT PRE-BILL
                </button>
                <button 
                  onClick={() => handleQuickAction('split_bill')}
                  style={{ ...quickActionButtonStyle, background: '#F59E0B', borderColor: '#F59E0B', color: '#ffffff' }}
                >
                  SPLIT BILL
                </button>
                <button 
                  onClick={() => handleQuickAction('clear_table')}
                  style={{ ...quickActionButtonStyle, background: '#EF4444', borderColor: '#EF4444', color: '#ffffff' }}
                >
                  CLEAR / VACATE TABLE
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '12px' }}>
              Select a table to view details
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {activeModal === 'takeaway' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              QUICK TAKEAWAY
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p style={{ marginBottom: '12px' }}>Create a new takeaway order without table assignment.</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Customer Name</label>
                <input 
                  type="text" 
                  placeholder="Enter customer name"
                  value={takeawayData.customerName}
                  onChange={(e) => setTakeawayData(prev => ({ ...prev, customerName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="Enter phone number"
                  value={takeawayData.phoneNumber}
                  onChange={(e) => setTakeawayData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Create takeaway order (walk-in order)
                  if (setOrders) {
                    const newOrder = {
                      id: `ORD-${Date.now()}`,
                      tableId: null, // Walk-in order (no table)
                      customerName: takeawayData.customerName || 'Walk-in Customer',
                      phoneNumber: takeawayData.phoneNumber,
                      orderType: 'takeaway',
                      status: 'pending',
                      items: [],
                      amount: 0,
                      createdAt: Date.now(),
                      source: 'WALK_IN',
                    };
                    setOrders(prev => [...prev, newOrder]);
                    
                    // Create KDS ticket for takeaway order
                    if (setKdsCards) {
                      const newKdsCard = {
                        id: `KDS-${Date.now()}`,
                        orderId: newOrder.id,
                        tableId: null,
                        items: [],
                        status: 'pending',
                        createdAt: Date.now(),
                        orderType: 'takeaway',
                      };
                      setKdsCards(prev => [...prev, newKdsCard]);
                    }
                  }
                  // Clear form data
                  setTakeawayData({ customerName: '', phoneNumber: '' });
                  // Navigate to orders tab
                  if (onNavigate) {
                    onNavigate('orders');
                  }
                  closeModal();
                }} 
                style={{ ...actionButtonStyle, background: '#22C55E', borderColor: '#22C55E' }}
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'merge' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              MERGE TABLES
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p style={{ marginBottom: '12px' }}>Select two tables to merge their orders together.</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Source Table</label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">Select source table...</option>
                  {tableData.filter(t => t.status === 'OCCUPIED').map(t => (
                    <option key={t.id} value={t.id}>{t.id} - {t.status} (₹{t.billTotal.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Target Table</label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">Select target table...</option>
                  {tableData.filter(t => t.status === 'OCCUPIED').map(t => (
                    <option key={t.id} value={t.id}>{t.id} - {t.status} (₹{t.billTotal.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Merge tables logic here
                  closeModal();
                }} 
                style={{ ...actionButtonStyle, background: '#F59E0B', borderColor: '#F59E0B' }}
              >
                Merge Tables
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'transfer' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              TRANSFER TABLE
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p style={{ marginBottom: '12px' }}>Transfer order from one table to another.</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Source Table</label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">Select source table...</option>
                  {tableData.filter(t => t.status === 'OCCUPIED').map(t => (
                    <option key={t.id} value={t.id}>{t.id} - {t.status} (₹{t.billTotal.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Destination Table</label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">Select destination table...</option>
                  {tableData.filter(t => t.status === 'VACANT' || t.status === 'OCCUPIED').map(t => (
                    <option key={t.id} value={t.id}>{t.id} - {t.status} ({t.seats} seats)</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Transfer order logic here
                  closeModal();
                }} 
                style={{ ...actionButtonStyle, background: '#3B82F6', borderColor: '#3B82F6' }}
              >
                Transfer Order
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'add_items' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase' }}>
                ADD ITEMS - TABLE {selectedTable?.id}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p>Select items to add to this table's order.</p>
            </div>

            {/* Menu Items Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px', maxHeight: '300px', overflow: 'auto' }}>
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPosCart(prev => [...prev, { ...item, qty: 1 }]);
                  }}
                  style={{
                    padding: '12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#22C55E'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#3F3F46'}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ color: '#22C55E', fontWeight: '800' }}>₹{item.price?.toFixed(2) || '0.00'}</div>
                </button>
              ))}
            </div>

            {/* Cart Summary */}
            {posCart.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#18181B', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                  CART ({posCart.length} items)
                </div>
                {posCart.slice(-3).map((item, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.name} x{item.qty}</span>
                    <span>₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #3F3F46', fontSize: '12px', fontWeight: '800', color: '#22C55E', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total</span>
                  <span>₹{posCart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Add items to table's order
                  if (setOrders && posCart.length > 0) {
                    const tableOrders = orders.filter(order => order.tableId === selectedTable?.id);
                    if (tableOrders.length > 0) {
                      // Update existing order
                      setOrders(prev => prev.map(order => 
                        order.tableId === selectedTable?.id 
                          ? { ...order, items: [...(order.items || []), ...posCart], amount: (order.amount || 0) + posCart.reduce((sum, item) => sum + (item.price * item.qty), 0) }
                          : order
                      ));
                    } else {
                      // Create new order for this table
                      const newOrder = {
                        id: `ORD-${Date.now()}`,
                        tableId: selectedTable?.id,
                        customerName: `Table ${selectedTable?.id}`,
                        orderType: 'dine_in',
                        status: 'pending',
                        items: posCart,
                        amount: posCart.reduce((sum, item) => sum + (item.price * item.qty), 0),
                        createdAt: Date.now(),
                        source: 'WALK_IN',
                      };
                      setOrders(prev => [...prev, newOrder]);
                      
                      // Create KDS tickets for the new order
                      if (setKdsCards) {
                        const newKdsCard = {
                          id: `KDS-${Date.now()}`,
                          orderId: newOrder.id,
                          tableId: selectedTable?.id,
                          orderType: 'DINE_IN',
                          staffId: staff.find(s => s.name === selectedTable?.waiter)?.id || null,
                          customerName: '',
                          customerPhone: '',
                          items: posCart.map(item => ({
                            name: item.name,
                            qty: item.qty,
                            status: 'pending',
                            price: item.price
                          })),
                          status: 'NEW',
                          createdAt: Date.now(),
                        };
                        setKdsCards(prev => [...prev, newKdsCard]);
                      }
                    }
                  }
                  setPosCart([]);
                  closeModal();
                }} 
                style={{ ...actionButtonStyle, background: '#22C55E', borderColor: '#22C55E' }}
                disabled={posCart.length === 0}
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'print_bill' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              PRINT PRE-BILL
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p>Print pre-bill for Table {selectedTable?.id} - ₹{selectedTable?.billTotal.toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3B82F6', borderColor: '#3B82F6' }}>
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'split_bill' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              SPLIT BILL
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p>Split bill for Table {selectedTable?.id} - Total: ₹{selectedTable?.billTotal.toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#F59E0B', borderColor: '#F59E0B' }}>
                Split Options
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'clear_table' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              CLEAR / VACATE TABLE
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p>Are you sure you want to clear Table {selectedTable?.id}?</p>
              <p style={{ color: '#EF4444', fontWeight: '700' }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button onClick={() => { setSelectedTable(null); closeModal(); }} style={{ ...actionButtonStyle, background: '#EF4444', borderColor: '#EF4444' }}>
                Clear Table
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'add_table' && (
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
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              ADD NEW TABLE
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p style={{ marginBottom: '12px' }}>Add a new table to the floor plan.</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Table Number</label>
                <input 
                  type="text" 
                  placeholder="Enter table number"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Seats</label>
                <input 
                  type="number" 
                  placeholder="Number of seats"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', color: '#9CA3AF' }}>Section</label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#18181B',
                    border: '2px solid #3F3F46',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="MAIN HALL">Main Hall</option>
                  <option value="PATIO / BALCONY">Patio / Balcony</option>
                  <option value="POOL SIDE">Pool Side</option>
                  <option value="AC ROOM">AC Room</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...actionButtonStyle, background: '#3F3F46', borderColor: '#3F3F46' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Add table logic here
                  closeModal();
                }} 
                style={{ ...actionButtonStyle, background: '#22C55E', borderColor: '#22C55E' }}
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
