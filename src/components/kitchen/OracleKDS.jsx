import React, { useState, useEffect } from 'react';
import OracleKDSSettingsPanel from './OracleKDSSettingsPanel';
import { 
  ORACLE_KDS_DEFAULTS, 
  CATEGORY_PREP_TIMES, 
  DEFAULT_CATEGORY_PREP_TIME 
} from '../../data/mockData/kitchenData';

export default function OracleKDS({ orders = [], setOrders, menuItems = [], oracleSettings, onOracleSettingsChange }) {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [averagePrepTime, setAveragePrepTime] = useState(ORACLE_KDS_DEFAULTS.averagePrepTime);
  const [activePrepTime, setActivePrepTime] = useState(null);
  const [prepTimeFilter, setPrepTimeFilter] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Update current time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Convert orders to Oracle format with mode-specific filtering
  const oracleOrders = orders.map((order, index) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const now = new Date();
    const minutesElapsed = Math.floor((now - createdAt) / 60000);
    
    // Calculate estimated prep time based on items
    const estimatedPrepTime = (order.items || []).reduce((total, item) => {
      const categoryPrep = CATEGORY_PREP_TIMES[item.category] || DEFAULT_CATEGORY_PREP_TIME;
      return total + (categoryPrep * (item.quantity || 1));
    }, 0);
    
    const timeRemaining = Math.max(0, estimatedPrepTime - minutesElapsed);
    
    return {
      id: order.id || `CHK ${ORACLE_KDS_DEFAULTS.orderStartNumber + index}`,
      number: order.orderNumber || (ORACLE_KDS_DEFAULTS.orderStartNumber + index),
      time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : ORACLE_KDS_DEFAULTS.defaultTime,
      items: order.items || [],
      table: order.customer?.table || ORACLE_KDS_DEFAULTS.defaultTable,
      status: order.status || ORACLE_KDS_DEFAULTS.defaultStatus,
      isSelected: selectedOrders.includes(order.id),
      timeRemaining: timeRemaining,
      estimatedPrepTime: estimatedPrepTime,
      priority: order.priority || ORACLE_KDS_DEFAULTS.defaultPriority,
      category: (order.items || [])[0]?.category || 'Food',
      orderType: order.orderType || ORACLE_KDS_DEFAULTS.defaultOrderType,
      createdBy: order.createdBy || ORACLE_KDS_DEFAULTS.defaultCreatedBy
    };
  }).filter(order => {
    if (!prepTimeFilter) return true;
    
    const mode = oracleSettings?.buttons?.prepButtonMode || 'timeFilter';
    
    if (mode === 'timeFilter') {
      const filterMinutes = parseInt(prepTimeFilter.replace('P', '').replace('m', '').replace('min', '')) || 5;
      return order.timeRemaining <= filterMinutes && order.timeRemaining > 0;
    }
    
    if (mode === 'priority') {
      const priorityLevel = oracleSettings?.buttons?.priorityLevels?.[prepTimeFilter] || 'normal';
      return order.priority === priorityLevel;
    }
    
    if (mode === 'preset') {
      const presetFilter = oracleSettings?.buttons?.presetFilters?.[prepTimeFilter] || 'all';
      if (presetFilter === 'all') return true;
      if (presetFilter === 'myOrders') return order.createdBy === 'current-user';
      if (presetFilter === 'drinksOnly') return order.category === 'Beverage';
      if (presetFilter === 'allPending') return order.status === 'PENDING';
      if (presetFilter === 'urgent') return order.priority === 'urgent' || order.timeRemaining < 3;
      if (presetFilter === 'today') {
        const today = new Date().toDateString();
        return new Date(order.createdAt).toDateString() === today;
      }
      if (presetFilter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(order.createdAt) >= weekAgo;
      }
      return true;
    }
    
    if (mode === 'staff') {
      const staffAssignment = oracleSettings?.buttons?.staffAssignments?.[prepTimeFilter] || '';
      return order.assignedStaff === staffAssignment;
    }
    
    if (mode === 'hold') {
      const holdSlot = oracleSettings?.buttons?.holdSlots?.[prepTimeFilter] || '';
      return order.holdSlot === holdSlot;
    }
    
    if (mode === 'zone') {
      const zoneFilter = oracleSettings?.buttons?.zoneFilters?.[prepTimeFilter] || 'all';
      if (zoneFilter === 'all') return true;
      if (zoneFilter === 'patio') return order.table?.startsWith('P');
      if (zoneFilter === 'bar') return order.table?.startsWith('B');
      if (zoneFilter === 'dining') return order.table?.startsWith('D');
      if (zoneFilter === 'takeout') return order.orderType === 'takeaway';
      if (zoneFilter === 'delivery') return order.orderType === 'delivery';
      if (zoneFilter === 'driveThru') return order.orderType === 'drive-thru';
      return true;
    }
    
    return true;
  });

  const handleOrderClick = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleDone = () => {
    if (selectedOrders.length === 0) return;
    
    const updatedOrders = orders.map(order => {
      if (selectedOrders.includes(order.id)) {
        return { ...order, status: 'COMPLETED', completedAt: new Date().toISOString() };
      }
      return order;
    });
    
    setOrders(updatedOrders);
    setSelectedOrders([]);
    console.log('Marked', selectedOrders.length, 'orders as completed');
  };

  const handleRecall = () => {
    if (selectedOrders.length === 0) return;

    // Recall orders - bring them back to pending status
    const updatedOrders = orders.map(order => {
      if (selectedOrders.includes(order.id)) {
        return { ...order, status: 'PENDING', recalledAt: new Date().toISOString() };
      }
      return order;
    });

    setOrders(updatedOrders);
    setSelectedOrders([]);
    console.log('Recalled', selectedOrders.length, 'orders to pending');
  };

  const handleView = () => {
    if (selectedOrders.length === 0) return;

    // Get selected order details
    const selectedOrderDetails = orders.filter(order => selectedOrders.includes(order.id));
    setViewOrderDetails(selectedOrderDetails);
    setShowViewModal(true);
    console.log('Viewing', selectedOrderDetails.length, 'order(s)');
  };

  const handleMove = () => {
    if (selectedOrders.length === 0) return;

    setShowMoveModal(true);
    console.log('Opening move dialog for', selectedOrders.length, 'order(s)');
  };

  const handleCancel = () => {
    if (selectedOrders.length === 0) return;

    const reason = prompt('Enter cancellation reason:');
    if (reason) {
      const updatedOrders = orders.map(order => {
        if (selectedOrders.includes(order.id)) {
          return { 
            ...order, 
            status: 'CANCELLED', 
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setSelectedOrders([]);
      console.log('Cancelled', selectedOrders.length, 'orders:', reason);
    }
  };

  const executeMove = (newStatus, newStation) => {
    const updatedOrders = orders.map(order => {
      if (selectedOrders.includes(order.id)) {
        return { 
          ...order, 
          status: newStatus,
          station: newStation,
          movedAt: new Date().toISOString()
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    setSelectedOrders([]);
    setShowMoveModal(false);
    console.log('Moved', selectedOrders.length, 'orders to', newStatus, '/', newStation);
  };

  const handlePrepTimeClick = (prepTime) => {
    if (prepTime === 'CLEAR') {
      setActivePrepTime(null);
      setPrepTimeFilter(null);
      console.log('Filter cleared');
    } else {
      setActivePrepTime(prepTime);
      setPrepTimeFilter(prepTime);
      console.log('Filter selected:', prepTime, 'Mode:', oracleSettings?.buttons?.prepButtonMode);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gridAutoRows: 'min-content',
        gap: '8px',
        padding: '10px',
        overflow: 'auto',
        minHeight: 0
      }}>
        {oracleOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => handleOrderClick(order.id)}
            style={{
              background: order.isSelected ? '#ffd700' : '#ffffff',
              border: `2px solid ${order.isSelected ? '#ff8c00' : '#cccccc'}`,
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: order.isSelected ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '140px'
            }}
          >
            {/* Order Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {oracleSettings?.columns?.showOrderNumber !== false && (
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '15px',
                    color: '#000000',
                    letterSpacing: '0.5px'
                  }}>
                    CHK {order.number}
                  </span>
                )}
                {oracleSettings?.columns?.showCustomer !== false && order.customer?.name && (
                  <span style={{
                    fontSize: '11px',
                    color: '#333333',
                    fontWeight: '500'
                  }}>
                    {order.customer.name}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                {oracleSettings?.columns?.showTime !== false && (
                  <span style={{
                    fontSize: '11px',
                    color: '#666666',
                    fontWeight: '600',
                    fontFamily: 'Courier New, monospace'
                  }}>
                    {order.time}
                  </span>
                )}
                {order.orderType && (
                  <span style={{
                    fontSize: '9px',
                    color: '#0066cc',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    background: '#e6f3ff',
                    borderRadius: '3px'
                  }}>
                    {order.orderType}
                  </span>
                )}
              </div>
            </div>

            {/* Priority Indicator */}
            {order.priority === 'urgent' && (
              <div style={{
                background: '#ff4444',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                ⚠️ URGENT
              </div>
            )}

            {/* Items List */}
            {oracleSettings?.columns?.showItems !== false && (
              <div style={{ marginBottom: '8px', maxHeight: '120px', overflow: 'auto' }}>
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#000000',
                      padding: '4px',
                      background: item.status === 'COMPLETED' ? '#f0fff0' : '#ffffff',
                      borderRadius: '4px',
                      border: item.status === 'COMPLETED' ? '1px solid #00aa00' : '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          fontSize: '13px',
                          color: item.status === 'COMPLETED' ? '#00aa00' : '#000000'
                        }}>
                          {item.quantity}x
                        </span>
                        <span style={{ fontWeight: '500' }}>
                          {item.name}
                        </span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px', marginLeft: '28px' }}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: '10px', color: '#cc6600', marginTop: '2px', marginLeft: '28px', fontStyle: 'italic' }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    {item.status === 'COMPLETED' && (
                      <span style={{ 
                        color: '#00aa00', 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        marginLeft: '8px'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Order Notes */}
            {oracleSettings?.columns?.showNotes !== false && order.notes && (
              <div style={{
                background: '#fff9e6',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#996600',
                marginBottom: '6px',
                border: '1px solid #ffcc00',
                fontStyle: 'italic'
              }}>
                <strong>Note:</strong> {order.notes}
              </div>
            )}

            {/* Allergy Alert */}
            {order.items?.some(item => item.allergies && item.allergies.length > 0) && (
              <div style={{
                background: '#ffe6e6',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#cc0000',
                marginBottom: '6px',
                border: '1px solid #ff0000',
                fontWeight: 'bold'
              }}>
                ⚠️ ALLERGIES: {order.items.filter(i => i.allergies).flatMap(i => i.allergies).join(', ')}
              </div>
            )}

            {/* Order Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              color: '#666666',
              borderTop: '2px solid #f0f0f0',
              paddingTop: '6px',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {oracleSettings?.columns?.showTable !== false && (
                  <span style={{ 
                    fontWeight: '600',
                    color: '#333333'
                  }}>
                    Table {order.table}
                  </span>
                )}
                {oracleSettings?.columns?.showStatus !== false && (
                  <span style={{ 
                    color: order.status === 'COMPLETED' ? '#00aa00' : 
                          order.status === 'PENDING' ? '#ff6600' : 
                          order.status === 'IN_PROGRESS' ? '#0066cc' : '#666666',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    background: order.status === 'COMPLETED' ? '#e6ffe6' : 
                               order.status === 'PENDING' ? '#fff0e6' : 
                               order.status === 'IN_PROGRESS' ? '#e6f3ff' : '#f0f0f0',
                    borderRadius: '3px'
                  }}>
                    {order.status}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {oracleSettings?.columns?.showPrepTime !== false && (
                  <span style={{ 
                    color: order.timeRemaining < 3 ? '#ff0000' : '#666666',
                    fontWeight: order.timeRemaining < 3 ? 'bold' : 'normal'
                  }}>
                    {order.timeRemaining}m
                  </span>
                )}
                {oracleSettings?.columns?.showAge !== false && (
                  <span style={{ color: '#666666' }}>
                    {Math.floor((Date.now() - new Date(order.createdAt || Date.now())) / 60000)}m old
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Menu Bar */}
      <div style={{
        background: '#0f0f1a',
        borderTop: '2px solid #2a2a4a',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        minHeight: '80px'
      }}>
        {/* Left Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDone}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #4CAF50',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '80px',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
              display: oracleSettings?.buttons?.showDone ? 'block' : 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            DONE
          </button>

          <button
            onClick={handleRecall}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #2196F3',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '80px',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
              display: oracleSettings?.buttons?.showRecall ? 'block' : 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            RECALL
          </button>

          <button
            onClick={handleView}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #FF9800',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '80px',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
              display: oracleSettings?.buttons?.showView ? 'block' : 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            VIEW
          </button>

          <button
            onClick={handleMove}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #9C27B0',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '80px',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
              display: oracleSettings?.buttons?.showMove ? 'block' : 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            MOVE
          </button>

          <button
            onClick={handleCancel}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #ff0000',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '80px',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
              display: oracleSettings?.buttons?.showCancel ? 'block' : 'none'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            CANCEL
          </button>
        </div>

        {/* Center Info */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          color: '#ffffff',
          fontSize: '11px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: '#2a2a4a',
            padding: '5px 10px',
            borderRadius: '3px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            PREP1
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {oracleSettings?.buttons?.prepButtons?.map((prepButton) => (
              <button
                key={prepButton}
                onClick={() => handlePrepTimeClick(prepButton)}
                style={{
                  background: activePrepTime === prepButton 
                    ? 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)' 
                    : 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
                  color: activePrepTime === prepButton ? '#ffffff' : '#000000',
                  border: activePrepTime === prepButton ? '3px solid #2E7D32' : '3px solid #4CAF50',
                  borderRadius: '8px',
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  minWidth: '70px',
                  minHeight: '60px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: activePrepTime === prepButton 
                    ? '0 4px 8px rgba(76, 175, 80, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' 
                    : '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
                  textShadow: activePrepTime === prepButton ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  letterSpacing: '1px'
                }}
                onMouseOver={(e) => {
                  if (activePrepTime !== prepButton) {
                    e.target.style.background = 'linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%)';
                    e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
                  }
                }}
                onMouseOut={(e) => {
                  if (activePrepTime !== prepButton) {
                    e.target.style.background = 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
                  }
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                {prepButton}
              </button>
            ))}

            <button
              onClick={() => handlePrepTimeClick('CLEAR')}
              style={{
                background: activePrepTime === 'CLEAR' 
                  ? 'linear-gradient(180deg, #f44336 0%, #d32f2f 100%)' 
                  : 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
                color: activePrepTime === 'CLEAR' ? '#ffffff' : '#f44336',
                border: activePrepTime === 'CLEAR' ? '3px solid #c62828' : '3px solid #f44336',
                borderRadius: '8px',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: 'pointer',
                minWidth: '70px',
                minHeight: '60px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: activePrepTime === 'CLEAR' 
                  ? '0 4px 8px rgba(244, 67, 54, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' 
                  : '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
                textShadow: activePrepTime === 'CLEAR' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                if (activePrepTime !== 'CLEAR') {
                  e.target.style.background = 'linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%)';
                  e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
                }
              }}
              onMouseOut={(e) => {
                if (activePrepTime !== 'CLEAR') {
                  e.target.style.background = 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
                }
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.92)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Right Info */}
        <div style={{
          display: 'flex',
          gap: '10px',
          color: '#ffffff',
          fontSize: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              // Print selected orders
              if (selectedOrders.length === 0) {
                alert('Please select orders to print');
                return;
              }
              const selectedOrderDetails = orders.filter(order => selectedOrders.includes(order.id));
              console.log('Printing orders:', selectedOrderDetails);
              alert(`Printing ${selectedOrderDetails.length} order(s)`);
            }}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #00ff00',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            🖨️ PRINT
          </button>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #00ff00',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            ⚙️ SETTINGS
          </button>

          <div style={{
            background: '#2a2a4a',
            padding: '5px 10px',
            borderRadius: '3px',
            whiteSpace: 'nowrap'
          }}>
            Avg Prep: {averagePrepTime}
          </div>

          <div style={{
            background: '#2a2a4a',
            padding: '5px 10px',
            borderRadius: '3px',
            fontFamily: 'Courier New, monospace',
            whiteSpace: 'nowrap'
          }}>
            {currentTime}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && viewOrderDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '2px solid #00ff00',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #00ff00',
              paddingBottom: '12px'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#00ff00' }}>
                ORDER DETAILS ({viewOrderDetails.length})
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: '#ff0000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                [X]
              </button>
            </div>

            {viewOrderDetails.map((order, index) => (
              <div key={order.id} style={{
                background: '#2a2a4a',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '12px',
                border: '1px solid #4a4a6a'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ color: '#00ff00', fontSize: '16px' }}>
                      CHK {order.orderNumber || index + 36}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#aaaaaa', marginTop: '4px' }}>
                      Table: {order.customer?.table || 'N/A'} | 
                      Status: <span style={{ 
                        color: order.status === 'COMPLETED' ? '#00ff00' : '#ffaa00',
                        fontWeight: 'bold'
                      }}>{order.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaaaaa' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#00ff00', marginBottom: '8px', fontWeight: 'bold' }}>
                    ITEMS:
                  </div>
                  {order.items?.map((item, itemIndex) => (
                    <div key={itemIndex} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px',
                      background: '#1a1a2e',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px'
                    }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span style={{ 
                        color: item.status === 'COMPLETED' ? '#00ff00' : '#aaaaaa',
                        fontWeight: 'bold'
                      }}>
                        {item.status || 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div style={{
                    background: '#3a3a5a',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffff00'
                  }}>
                    <strong>Notes:</strong> {order.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '2px solid #00ff00',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #00ff00',
              paddingBottom: '12px'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#00ff00' }}>
                MOVE ORDERS ({selectedOrders.length})
              </h2>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{
                  background: '#ff0000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                [X]
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#00ff00' }}>
                New Status:
              </label>
              <select
                id="moveStatus"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#000000',
                  color: '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#00ff00' }}>
                New Station:
              </label>
              <select
                id="moveStation"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#000000',
                  color: '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <option value="">Keep Current Station</option>
                <option value="hot-kitchen">Hot Kitchen</option>
                <option value="cold-kitchen">Cold Kitchen</option>
                <option value="bakery">Bakery</option>
                <option value="grill">Grill</option>
                <option value="beverage">Beverage</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#666666',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  const statusSelect = document.getElementById('moveStatus');
                  const stationSelect = document.getElementById('moveStation');
                  executeMove(
                    statusSelect?.value || 'PENDING',
                    stationSelect?.value || ''
                  );
                }}
                style={{
                  padding: '12px 24px',
                  background: '#00ff00',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                MOVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <OracleKDSSettingsPanel
            settings={oracleSettings}
            onSettingsChange={onOracleSettingsChange}
            darkMode={true}
          />
          <button
            onClick={() => setShowSettings(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '8px 16px',
              background: '#ff0000',
              color: '#ffffff',
              border: '2px solid #ff0000',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            [CLOSE]
          </button>
        </div>
      )}
    </div>
  );
}