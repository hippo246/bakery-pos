/**
 * Waiter Operations Center
 * Enterprise Service Operations Platform
 * 
 * A dedicated workspace for waiters to manage their entire shift without leaving this screen.
 * Integrates with Orders, Kitchen, Tables, Payments, Reservations, CRM, and Dashboard.
 * 
 * Layout:
 * - Left Sidebar: My Tables (assigned tables with status)
 * - Main Workspace: Current Orders, Table Details, Order Workflow
 * - Right Sidebar: Notifications, Kitchen Status, Customer Requests, Bill Requests, Shift Summary
 * 
 * Responsive for tablets with touch-friendly interface.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { C, card, btn, input, label, statusBadge, emptyState } from '../../styles/theme';
import OrderWorkflow from './OrderWorkflow.jsx';
import ReadyForPickup from './ReadyForPickup.jsx';
import ServingWorkflow from './ServingWorkflow.jsx';
import WaiterNotifications from './WaiterNotifications.jsx';

function WaiterOperationsCenter({
  orders,
  setOrders,
  kdsCards,
  setKdsCards,
  tables,
  setTables,
  menuItems,
  staff,
  inventory,
  customers,
  setCustomers,
  notifications,
  setNotifications,
  shifts,
  setShifts,
  currentShift,
  reservations
}) {
  // Waiter state
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('tables'); // tables, orders, kitchen, ready, serving, requests, bills, notifications, shift
  const [searchQuery, setSearchQuery] = useState('');
  const [customerRequests, setCustomerRequests] = useState([]);
  const [billRequests, setBillRequests] = useState([]);

  // Get current waiter (from currentShift or auth)
  const currentWaiter = currentShift?.staffId || null;

  // Filter tables assigned to this waiter
  const assignedTables = useMemo(() => {
    if (!currentWaiter || !tables) return [];
    return tables.filter(table => table.assignedStaffId === currentWaiter);
  }, [tables, currentWaiter]);

  // Get orders for selected table
  const tableOrders = useMemo(() => {
    if (!selectedTable || !orders) return [];
    return orders.filter(order => order.tableId === selectedTable.id);
  }, [orders, selectedTable]);

  // Get KDS cards for table orders
  const tableKdsCards = useMemo(() => {
    if (!tableOrders || !kdsCards) return [];
    return kdsCards.filter(card => tableOrders.some(order => order.id === card.orderId));
  }, [kdsCards, tableOrders]);

  // Get customer requests for assigned tables
  const tableCustomerRequests = useMemo(() => {
    if (!assignedTables.length || !customerRequests) return [];
    return customerRequests.filter(req => 
      assignedTables.some(table => table.id === req.tableId)
    );
  }, [customerRequests, assignedTables]);

  // Get bill requests for assigned tables
  const tableBillRequests = useMemo(() => {
    if (!assignedTables.length || !billRequests) return [];
    return billRequests.filter(req => 
      assignedTables.some(table => table.id === req.tableId)
    );
  }, [billRequests, assignedTables]);

  // Shift summary calculations
  const shiftSummary = useMemo(() => {
    if (!currentShift || !orders) return {
      ordersServed: 0,
      tablesManaged: assignedTables.length,
      averageServiceTime: 0,
      completedPayments: 0,
      shiftDuration: 0
    };

    const shiftOrders = orders.filter(order => 
      order.staffId === currentWaiter && 
      new Date(order.createdAt) >= new Date(currentShift.startTime)
    );

    const completedOrders = shiftOrders.filter(order => order.status === 'COMPLETED');
    const completedPayments = completedOrders.filter(order => order.paymentStatus === 'PAID');

    // Calculate average service time
    const serviceTimes = completedOrders
      .map(order => {
        const created = new Date(order.createdAt).getTime();
        const completed = order.completedAt ? new Date(order.completedAt).getTime() : Date.now();
        return (completed - created) / 1000 / 60; // minutes
      })
      .filter(time => time > 0);

    const avgServiceTime = serviceTimes.length > 0
      ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
      : 0;

    // Shift duration
    const startTime = new Date(currentShift.startTime).getTime();
    const endTime = currentShift.endTime ? new Date(currentShift.endTime).getTime() : Date.now();
    const shiftDuration = (endTime - startTime) / 1000 / 60 / 60; // hours

    return {
      ordersServed: completedOrders.length,
      tablesManaged: assignedTables.length,
      averageServiceTime: Math.round(avgServiceTime),
      completedPayments: completedPayments.length,
      shiftDuration: Math.round(shiftDuration * 10) / 10
    };
  }, [currentShift, orders, currentWaiter, assignedTables]);

  // Handle table selection
  const handleTableSelect = useCallback((table) => {
    setSelectedTable(table);
    setSelectedOrder(null);
    setActiveTab('orders');
  }, []);

  // Handle order selection
  const handleOrderSelect = useCallback((order) => {
    setSelectedOrder(order);
    setActiveTab('orders');
  }, []);

  // Handle customer request completion
  const handleCustomerRequestComplete = useCallback((requestId) => {
    setCustomerRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, completed: true, completedAt: Date.now() } : req
      )
    );
  }, []);

  // Handle bill request completion
  const handleBillRequestComplete = useCallback((requestId) => {
    setBillRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, completed: true, completedAt: Date.now() } : req
      )
    );
  }, []);

  // Handle order status change (send to kitchen, ready, collected, served)
  const handleOrderStatusChange = useCallback((orderId, newStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updatedAt: Date.now() } : order
      )
    );
  }, [setOrders]);

  // Handle KDS card collection
  const handleKdsCardCollect = useCallback((cardId) => {
    setKdsCards(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, status: 'COLLECTED', collectedAt: Date.now() } : card
      )
    );
  }, [setKdsCards]);

  // Handle table status change
  const handleTableStatusChange = useCallback((tableId, newStatus) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, status: newStatus, updatedAt: Date.now() } : table
      )
    );
  }, [setTables]);

  // Add customer request
  const handleAddCustomerRequest = useCallback((request) => {
    setCustomerRequests(prev => [...prev, {
      ...request,
      id: Date.now(),
      createdAt: Date.now(),
      completed: false
    }]);
  }, []);

  // Add bill request
  const handleAddBillRequest = useCallback((request) => {
    setBillRequests(prev => [...prev, {
      ...request,
      id: Date.now(),
      createdAt: Date.now(),
      completed: false
    }]);
  }, []);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery) return { tables: [], orders: [], customers: [] };

    const query = searchQuery.toLowerCase();
    
    const matchingTables = assignedTables.filter(table =>
      table.id.toString().includes(query) ||
      (table.reservationName && table.reservationName.toLowerCase().includes(query))
    );

    const matchingOrders = orders.filter(order =>
      order.id.toString().includes(query) ||
      (order.customerName && order.customerName.toLowerCase().includes(query)) ||
      (order.tableId && order.tableId.toString().includes(query))
    );

    const matchingCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );

    return { tables: matchingTables, orders: matchingOrders, customers: matchingCustomers };
  }, [searchQuery, assignedTables, orders, customers]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--cafe-bg-primary)',
      overflow: 'hidden',
      // Tablet/touch optimizations
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--cafe-bg-surface)',
        borderBottom: '1px solid var(--cafe-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
            Waiter Operations Center
          </div>
          <div style={{ fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>
            {currentShift?.staffName || 'Waiter'} • Shift: {shiftSummary.shiftDuration}h
          </div>
        </div>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search tables, orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--cafe-border)',
              background: 'var(--cafe-bg-primary)',
              color: 'var(--cafe-text-primary)',
              fontSize: 14,
              width: 300,
              outline: 'none',
              // Touch optimizations
              fontSize: 16, // Prevents iOS zoom on focus
              touchAction: 'manipulation'
            }}
          />
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - My Tables */}
        <div style={{
          width: 280,
          background: 'var(--cafe-bg-surface)',
          borderRight: '1px solid var(--cafe-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid var(--cafe-border)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--cafe-text-primary)'
          }}>
            My Tables ({assignedTables.length})
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {assignedTables.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--cafe-text-tertiary)',
                fontSize: 13
              }}>
                No tables assigned
              </div>
            ) : (
              assignedTables.map(table => (
                <div
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  style={{
                    padding: 16, // Increased for touch
                    marginBottom: 8,
                    background: selectedTable?.id === table.id 
                      ? 'var(--cafe-accent-bg)' 
                      : 'var(--cafe-bg-primary)',
                    border: selectedTable?.id === table.id 
                      ? '1px solid var(--cafe-accent)' 
                      : '1px solid var(--cafe-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    // Touch optimizations
                    minHeight: 80,
                    touchAction: 'manipulation'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      Table {table.id}
                    </div>
                    {statusBadge(table.status)}
                  </div>
                  
                  {table.guests && (
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                      {table.guests} guests
                    </div>
                  )}
                  
                  {table.reservationName && (
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 2 }}>
                      {table.reservationName}
                    </div>
                  )}
                  
                  {table.occupiedAt && (
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                      {Math.floor((Date.now() - table.occupiedAt) / 60000)}m
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Workspace */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {!selectedTable ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cafe-text-tertiary)',
              fontSize: 16
            }}>
              Select a table to view details
            </div>
          ) : (
            <>
              {/* Table Details Header */}
              <div style={{
                padding: 16,
                borderBottom: '1px solid var(--cafe-border)',
                background: 'var(--cafe-bg-surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      Table {selectedTable.id}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>
                      {selectedTable.guests} guests • {selectedTable.reservationName || 'Walk-in'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleAddCustomerRequest({ tableId: selectedTable.id, type: 'BILL' })}
                      style={{
                        padding: '12px 20px', // Increased for touch
                        background: 'var(--cafe-warning-bg)',
                        border: '1px solid var(--cafe-warning-border)',
                        borderRadius: 8,
                        color: 'var(--cafe-warning)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        // Touch optimizations
                        minHeight: 44,
                        touchAction: 'manipulation'
                      }}
                    >
                      Request Bill
                    </button>
                    <button
                      onClick={() => handleAddCustomerRequest({ tableId: selectedTable.id, type: 'WATER' })}
                      style={{
                        padding: '12px 20px', // Increased for touch
                        background: 'var(--cafe-info-bg)',
                        border: '1px solid var(--cafe-info-border)',
                        borderRadius: 8,
                        color: 'var(--cafe-info)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        // Touch optimizations
                        minHeight: 44,
                        touchAction: 'manipulation'
                      }}
                    >
                      Water
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Orders */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
                  Current Orders ({tableOrders.length})
                </div>
                
                {tableOrders.length === 0 ? (
                  <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--cafe-text-tertiary)',
                    fontSize: 14
                  }}>
                    No orders for this table
                  </div>
                ) : (
                  tableOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderSelect(order)}
                      style={{
                    padding: 16,
                    marginBottom: 12,
                    background: selectedOrder?.id === order.id 
                      ? 'var(--cafe-accent-bg)' 
                      : 'var(--cafe-bg-surface)',
                    border: selectedOrder?.id === order.id 
                      ? '1px solid var(--cafe-accent)' 
                      : '1px solid var(--cafe-border)',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                        Order #{order.id}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                        ₹{order.total}
                      </div>
                      {statusBadge(order.status)}
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                      {order.items.slice(0, 3).map(item => item.name).join(', ')}
                      {order.items.length > 3 && ` +${order.items.length - 3} more`}
                    </div>
                  )}
                </div>
              ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{
          width: 320,
          background: 'var(--cafe-bg-surface)',
          borderLeft: '1px solid var(--cafe-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--cafe-border)',
            flexWrap: 'wrap'
          }}>
            {['orders', 'ready', 'serving', 'kitchen', 'requests', 'bills', 'notifications', 'shift'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  minWidth: 80,
                  padding: 12,
                  background: activeTab === tab ? 'var(--cafe-bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--cafe-accent)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 'orders' && selectedTable && (
              <OrderWorkflow
                selectedTable={selectedTable}
                selectedOrder={selectedOrder}
                orders={orders}
                setOrders={setOrders}
                menuItems={menuItems}
                kdsCards={kdsCards}
                setKdsCards={setKdsCards}
                tables={tables}
                setTables={setTables}
                inventory={inventory}
                setInventory={setInventory}
                customers={customers}
                setCustomers={setCustomers}
                currentShift={currentShift}
              />
            )}

            {activeTab === 'ready' && (
              <ReadyForPickup
                kdsCards={kdsCards}
                setKdsCards={setKdsCards}
                orders={orders}
                tables={tables}
                currentShift={currentShift}
              />
            )}

            {activeTab === 'serving' && selectedOrder && (
              <ServingWorkflow
                selectedTable={selectedTable}
                selectedOrder={selectedOrder}
                orders={orders}
                setOrders={setOrders}
                kdsCards={kdsCards}
                currentShift={currentShift}
              />
            )}

            {activeTab === 'kitchen' && (
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
                  Kitchen Status
                </div>
                
                {tableKdsCards.length === 0 ? (
                  <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--cafe-text-tertiary)',
                    fontSize: 13
                  }}>
                    No active kitchen orders
                  </div>
                ) : (
                  tableKdsCards.map(card => (
                    <div
                      key={card.id}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        background: card.status === 'READY' 
                          ? 'var(--cafe-success-bg)' 
                          : 'var(--cafe-bg-primary)',
                        border: card.status === 'READY' 
                          ? '1px solid var(--cafe-success-border)' 
                          : '1px solid var(--cafe-border)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                          Order #{card.orderId}
                        </div>
                        {statusBadge(card.status)}
                      </div>
                      
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                        {card.station}
                      </div>
                      
                      {card.status === 'READY' && (
                        <button
                          onClick={() => handleKdsCardCollect(card.id)}
                          style={{
                            marginTop: 8,
                            padding: '6px 12px',
                            background: 'var(--cafe-success)',
                            border: 'none',
                            borderRadius: 4,
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <WaiterNotifications
                notifications={notifications}
                setNotifications={setNotifications}
                currentShift={currentShift}
                tables={tables}
                orders={orders}
                kdsCards={kdsCards}
              />
            )}

            {activeTab === 'requests' && (
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
                  Customer Requests ({tableCustomerRequests.filter(r => !r.completed).length})
                </div>
                
                {tableCustomerRequests.length === 0 ? (
                  <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--cafe-text-tertiary)',
                    fontSize: 13
                  }}>
                    No customer requests
                  </div>
                ) : (
                  tableCustomerRequests.map(req => (
                    <div
                      key={req.id}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        background: req.completed 
                          ? 'var(--cafe-bg-primary)' 
                          : 'var(--cafe-warning-bg)',
                        border: req.completed 
                          ? '1px solid var(--cafe-border)' 
                          : '1px solid var(--cafe-warning-border)',
                        borderRadius: 8,
                        opacity: req.completed ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                            Table {req.tableId}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                            {req.type}
                          </div>
                        </div>
                        {!req.completed && (
                          <button
                            onClick={() => handleCustomerRequestComplete(req.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--cafe-success)',
                              border: 'none',
                              borderRadius: 4,
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'bills' && (
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
                  Bill Requests ({tableBillRequests.filter(r => !r.completed).length})
                </div>
                
                {tableBillRequests.length === 0 ? (
                  <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--cafe-text-tertiary)',
                    fontSize: 13
                  }}>
                    No bill requests
                  </div>
                ) : (
                  tableBillRequests.map(req => (
                    <div
                      key={req.id}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        background: req.completed 
                          ? 'var(--cafe-bg-primary)' 
                          : 'var(--cafe-warning-bg)',
                        border: req.completed 
                          ? '1px solid var(--cafe-border)' 
                          : '1px solid var(--cafe-warning-border)',
                        borderRadius: 8,
                        opacity: req.completed ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                            Table {req.tableId}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                            ₹{req.amount}
                          </div>
                        </div>
                        {!req.completed && (
                          <button
                            onClick={() => handleBillRequestComplete(req.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--cafe-success)',
                              border: 'none',
                              borderRadius: 4,
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'shift' && (
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
                  Shift Summary
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{
                    padding: 12,
                    background: 'var(--cafe-bg-primary)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Orders Served</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      {shiftSummary.ordersServed}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: 12,
                    background: 'var(--cafe-bg-primary)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Tables Managed</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      {shiftSummary.tablesManaged}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: 12,
                    background: 'var(--cafe-bg-primary)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Avg Service Time</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      {shiftSummary.averageServiceTime}m
                    </div>
                  </div>
                  
                  <div style={{
                    padding: 12,
                    background: 'var(--cafe-bg-primary)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Payments</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                      {shiftSummary.completedPayments}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: 'var(--cafe-bg-primary)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8
                }}>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Shift Duration</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                    {shiftSummary.shiftDuration}h
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaiterOperationsCenter;
