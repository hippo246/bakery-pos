import React, { useState, useEffect, useMemo } from 'react';

export default function ChowbusKDS({ orders = [], setOrders, menuItems = [] }) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'dine_in', 'takeout'
  const [completedNotification, setCompletedNotification] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [undoTimer, setUndoTimer] = useState(5);
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const [completedHistory, setCompletedHistory] = useState([]);
  const [itemStatusMap, setItemStatusMap] = useState({});

  // KDS display settings
  const [kdsSettings, setKdsSettings] = useState({
    autoCompleteOnCheck: false,
    soundAlert: true,
    fontSize: 'normal', // 'compact', 'normal', 'large'
    cardColumns: 5
  });

  // Clock tick
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto decrement undo timer if notification exists
  useEffect(() => {
    if (!completedNotification) return;
    const timer = setInterval(() => {
      setUndoTimer(prev => {
        if (prev <= 1) {
          setCompletedNotification(null);
          setLastCompletedOrder(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completedNotification]);

  // Combine real app orders with Chowbus demo baseline when real orders are empty
  const activeOrdersList = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders.map(ord => {
        const orderTime = ord.createdAt ? new Date(ord.createdAt) : new Date();
        const minsElapsed = Math.floor((new Date() - orderTime) / 60000);
        const minsStr = String(Math.floor(minsElapsed / 60)).padStart(2, '0') + ':' + String(minsElapsed % 60).padStart(2, '0');
        
        return {
          id: ord.id,
          orderNumber: ord.orderNumber || String(ord.id).slice(-2) || '1',
          orderType: ord.orderType === 'takeaway' ? 'Take Out' : ord.orderType === 'delivery' ? 'Delivery' : 'Dine In',
          platform: ord.platform || (ord.isQROrder ? 'QR Scan' : 'POS'),
          table: ord.table || ord.tableNumber || (ord.customer?.table) || null,
          timer: minsStr,
          isPaid: ord.paymentStatus === 'PAID' || ord.isPaid || false,
          customerName: ord.customerName || ord.customer?.name || null,
          phone: ord.phone || ord.customer?.phone || null,
          orderNote: ord.notes || ord.orderNote || '',
          items: (ord.items || []).map((itm, iIdx) => ({
            id: itm.id || `itm-${iIdx}`,
            name: itm.name,
            qty: itm.quantity || itm.qty || 1,
            isChecked: !!itemStatusMap[`${ord.id}-${itm.id || iIdx}`],
            note: itm.notes || (itm.modifiers ? itm.modifiers.join('\n') : '')
          }))
        };
      });
    }

    // Default reference screenshot mock data if no real POS orders present
    return [
      {
        id: 'ord-23',
        orderNumber: '23',
        orderType: 'Delivery',
        platform: 'DoorDash',
        timer: '00:29',
        isPaid: true,
        customerName: 'Kyle',
        phone: '617 *** 3331',
        orderNote: 'This is order note',
        items: [
          { id: '1', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-23-1'] ?? true, note: 'This is customization\n2x Just name' },
          { id: '2', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-23-2'] ?? true, isYellowDot: true, note: 'This is customization\n2x Just name' },
          { id: '3', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-23-3'], isRedDot: true, note: 'This is customization\n2x Just name' }
        ]
      },
      {
        id: 'ord-24',
        orderNumber: '24',
        orderType: 'Take Out',
        platform: 'Call In',
        timer: '00:25',
        isPaid: false,
        isChanged: true,
        changeText: 'Delivery > Take out',
        customerName: 'Kyle',
        phone: '617 *** 3331',
        orderNote: 'This is order note',
        items: [
          { id: '1', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-24-1'] ?? true, note: 'This is customization\n2x Just name' },
          { id: '2', name: 'This is a long dish name', qty: '2/5', isChecked: !!itemStatusMap['ord-24-2'], note: '2x This Is customization\nJust name\nAdd spicy' },
          { id: '3', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-24-3'], isRedDot: true, note: '' }
        ]
      },
      {
        id: 'ord-25',
        orderNumber: '25',
        orderType: 'Dine In',
        table: 'R3',
        timer: '00:14',
        isPaid: true,
        items: [
          { id: '1', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-25-1'], isYellowDot: true, note: '2x This Is customization' },
          { 
            id: '2', 
            name: 'This is dish name', 
            qty: 1, 
            isChecked: !!itemStatusMap['ord-25-2'], 
            tags: [
              { text: 'RUSH', bg: '#ffe4e6', color: '#e11d48' },
              { text: 'ADD', bg: '#fef3c7', color: '#d97706' },
              { text: 'TO GO', bg: '#dbeafe', color: '#2563eb' }
            ],
            note: 'This is dish note\nNo Egg\nThis is customization\nThis is 2ed cus. note\nThis is 3rd describe' 
          },
          { id: '3', name: '2x Just name', qty: '', isChecked: !!itemStatusMap['ord-25-3'], isBlueText: true, note: '3x Just name' },
          { 
            id: '4', 
            name: 'This is dish name', 
            qty: 1, 
            isChecked: false, 
            isStriked: true,
            tags: [
              { text: 'RUSH', bg: '#f3f4f6', color: '#6b7280' },
              { text: 'TO GO', bg: '#f3f4f6', color: '#6b7280' },
              { text: 'VOID 1', bg: '#f3f4f6', color: '#6b7280' }
            ],
            note: 'This is customization\nThis is 3rd describe' 
          }
        ]
      },
      {
        id: 'ord-25-2',
        orderNumber: '25',
        orderType: 'Dine In',
        table: 'R5',
        timer: '00:10',
        isPaid: true,
        items: [
          { id: '1', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-25-2-1'] ?? true, note: 'This is customization' },
          { 
            id: '2', 
            name: 'This is dish name', 
            qty: 2, 
            isChecked: !!itemStatusMap['ord-25-2-2'], 
            isYellowDot: true,
            tags: [
              { text: 'RUSH', bg: '#ffe4e6', color: '#e11d48' },
              { text: 'ADD', bg: '#fef3c7', color: '#d97706' },
              { text: 'VOID 1', bg: '#e5e7eb', color: '#374151' }
            ],
            note: 'This is customization\nThis is 3rd describe' 
          },
          { 
            id: '3', 
            name: 'This is dish name', 
            qty: 1, 
            isChecked: false, 
            isStriked: true,
            tags: [{ text: 'VOID 1', bg: '#f3f4f6', color: '#6b7280' }],
            note: 'This is customization\nThis is 3rd describe' 
          }
        ]
      },
      {
        id: 'ord-27',
        orderNumber: '27',
        orderType: 'Dine In',
        table: 'R4',
        timer: '00:05',
        isPaid: true,
        items: [
          { id: '1', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-27-1'] ?? true, note: 'This is customization\n2x Just name' },
          { id: '2', name: 'This is a long dish name', qty: '2/5', isChecked: !!itemStatusMap['ord-27-2'], note: '2x This Is customization\nJust name\nAdd spicy' },
          { id: '3', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-27-3'], note: '' },
          { id: '4', name: 'This is dish name', qty: 1, isChecked: !!itemStatusMap['ord-27-4'], note: 'This is customization\nJust name\nThis is 3rd describe\n2x Just name' }
        ]
      }
    ];
  }, [orders, itemStatusMap]);

  // Filter orders by orderType tab & search query
  const filteredOrders = useMemo(() => {
    return activeOrdersList.filter(order => {
      const matchesType = filterType === 'all' 
        ? true 
        : filterType === 'dine_in' 
        ? (order.orderType || '').toLowerCase().includes('dine')
        : (order.orderType || '').toLowerCase().includes('take') || (order.orderType || '').toLowerCase().includes('delivery');

      if (!matchesType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = (order.orderNumber || '').toString().toLowerCase().includes(q);
        const nameMatch = (order.customerName || '').toLowerCase().includes(q);
        const itemMatch = (order.items || []).some(i => i.name.toLowerCase().includes(q));
        return numMatch || nameMatch || itemMatch;
      }
      return true;
    });
  }, [activeOrdersList, filterType, searchQuery]);

  // Handle Item Check toggle
  const handleToggleItemCheck = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`;
    setItemStatusMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Complete single order
  const handleCompleteOrder = (orderToComplete) => {
    setCompletedNotification(`Order #${orderToComplete.orderNumber} Complete`);
    setLastCompletedOrder(orderToComplete);
    setUndoTimer(5);

    // Save to completed history
    setCompletedHistory(prev => [
      { ...orderToComplete, completedAt: new Date().toLocaleTimeString() },
      ...prev
    ]);

    // Mutate state / setOrders if real POS orders
    if (setOrders) {
      setOrders(prev => prev.filter(o => o.id !== orderToComplete.id));
    }
  };

  // Undo last completion
  const handleUndo = () => {
    if (lastCompletedOrder) {
      if (setOrders) {
        setOrders(prev => [lastCompletedOrder, ...prev]);
      }
      setCompletedHistory(prev => prev.filter(h => h.id !== lastCompletedOrder.id));
    }
    setCompletedNotification(null);
    setLastCompletedOrder(null);
  };

  // Refresh action
  const handleRefresh = () => {
    window.dispatchEvent(new Event('cafeos_settings_changed'));
    setCompletedNotification('Kitchen Display Refreshed');
    setUndoTimer(3);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      background: '#121212',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div style={{
        height: '56px',
        padding: '0 20px',
        background: '#181818',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Left: Clock & Order Type Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>
            {currentTime || '10:00 AM'}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#242424',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid #333333'
          }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '6px 18px',
                borderRadius: '16px',
                border: 'none',
                background: filterType === 'all' ? '#ffffff' : 'transparent',
                color: filterType === 'all' ? '#000000' : '#a0a0a0',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({activeOrdersList.length})
            </button>
            <button
              onClick={() => setFilterType('dine_in')}
              style={{
                padding: '6px 18px',
                borderRadius: '16px',
                border: 'none',
                background: filterType === 'dine_in' ? '#ffffff' : 'transparent',
                color: filterType === 'dine_in' ? '#000000' : '#a0a0a0',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Dine In
            </button>
            <span style={{ color: '#444444', margin: '0 2px' }}>|</span>
            <button
              onClick={() => setFilterType('takeout')}
              style={{
                padding: '6px 18px',
                borderRadius: '16px',
                border: 'none',
                background: filterType === 'takeout' ? '#ffffff' : 'transparent',
                color: filterType === 'takeout' ? '#000000' : '#a0a0a0',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Take Out
            </button>
          </div>
        </div>

        {/* Floating Notification Toast overlay in header center */}
        {completedNotification && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '8px',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            color: '#000000',
            borderRadius: '24px',
            padding: '6px 16px 6px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span>{completedNotification}</span>
            {lastCompletedOrder && (
              <button
                onClick={handleUndo}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#111827',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ color: '#6b7280' }}>({undoTimer}s)</span> Undo
              </button>
            )}
          </div>
        )}

        {/* Right: Functional Header Icons & Chowbus logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={handleRefresh} style={iconButtonStyle} title="Refresh Tickets">🔄</button>
          <button onClick={() => setShowSearchModal(true)} style={iconButtonStyle} title="Search Orders">🔍</button>
          <button onClick={() => setShowHistoryModal(true)} style={iconButtonStyle} title="Ticket History">🕒</button>
          <button onClick={() => setShowLangModal(true)} style={iconButtonStyle} title="Change Language">🌐</button>
          <button onClick={() => setShowSettingsModal(true)} style={iconButtonStyle} title="KDS Display Settings">⚙️</button>

          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#2b7fff',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            W
          </div>

          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '18px', color: '#ffffff' }}>⚡</span>
            <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff' }}>
              chowbus
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Orders Grid View Area ─────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: '16px 20px',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start'
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            width: '100%',
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <span style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🍳</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>No active tickets</span>
            <span style={{ fontSize: '13px', marginTop: '4px' }}>New incoming orders will automatically populate here</span>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const headerBg = order.orderType === 'Delivery' ? '#ff2a55' :
                             order.orderType === 'Take Out' ? '#ff2a55' : '#ffc021';
            const headerTextColor = order.orderType === 'Dine In' ? '#000000' : '#ffffff';

            return (
              <div
                key={order.id || idx}
                style={{
                  width: '240px',
                  minWidth: '240px',
                  maxWidth: '240px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#1e293b'
                }}
              >
                {/* Card Header Header */}
                <div style={{
                  background: headerBg,
                  color: headerTextColor,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      #{order.orderNumber} {order.orderType}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {order.platform === 'DoorDash' && <span>🚗 DoorDash</span>}
                      {order.platform === 'Call In' && <span>📞 Call In</span>}
                      {order.table && <span>🪑 {order.table}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'monospace' }}>
                      {order.timer}
                    </div>
                    {order.isPaid ? (
                      <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>
                        PAID
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        background: '#ffffff',
                        color: '#ef4444',
                        padding: '1px 6px',
                        borderRadius: '8px'
                      }}>
                        UNPAID
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Changed Alert Banner if present */}
                {order.isChanged && (
                  <div style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ background: '#000000', padding: '1px 4px', borderRadius: '2px', fontSize: '9px' }}>CHANGED</span>
                    <span>{order.changeText}</span>
                  </div>
                )}

                {/* Customer details bar */}
                {order.customerName && (
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '11px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>👤 {order.customerName} {order.phone ? `· ${order.phone}` : ''}</span>
                  </div>
                )}

                {/* Order Notes */}
                {order.orderNote && (
                  <div style={{
                    padding: '6px 12px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155'
                  }}>
                    {order.orderNote}
                  </div>
                )}

                {/* Order Items List */}
                <div style={{ padding: '10px 12px', flex: 1, overflowY: 'auto' }}>
                  {(order.items || []).map((item, itemIdx) => (
                    <div 
                      key={item.id || itemIdx} 
                      onClick={() => handleToggleItemCheck(order.id, item.id || itemIdx)}
                      style={{ 
                        marginBottom: '12px', 
                        opacity: item.isStriked ? 0.4 : 1,
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                          {/* Checkbox circle indicator */}
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: item.isChecked ? 'none' : '1.5px solid #cbd5e1',
                            background: item.isChecked ? '#22c55e' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#ffffff',
                            marginTop: '2px',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}>
                            {item.isChecked && '✓'}
                          </div>

                          {/* Item Title & Dots */}
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            textDecoration: item.isStriked || item.isChecked ? 'line-through' : 'none',
                            color: item.isChecked ? '#16a34a' : (item.isBlueText ? '#2563eb' : (item.isStriked ? '#94a3b8' : '#0f172a')),
                            lineHeight: '1.3'
                          }}>
                            {item.name}
                            {item.isYellowDot && <span style={{ color: '#eab308', marginLeft: '4px' }}>●</span>}
                            {item.isRedDot && <span style={{ color: '#ef4444', marginLeft: '4px' }}>●</span>}
                          </div>
                        </div>

                        {/* Quantity */}
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: item.qty === '2/5' ? '#e11d48' : '#0f172a'
                        }}>
                          {item.qty}
                        </span>
                      </div>

                      {/* Action Badges / Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px', marginLeft: '24px' }}>
                          {item.tags.map((tag, tIdx) => (
                            <span key={tIdx} style={{
                              background: tag.bg,
                              color: tag.color,
                              fontSize: '9px',
                              fontWeight: '800',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {tag.text}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Customization Details & Notes */}
                      {item.note && (
                        <div style={{
                          fontSize: '11px',
                          color: item.isBlueText ? '#2563eb' : '#64748b',
                          marginLeft: '24px',
                          marginTop: '3px',
                          whiteSpace: 'pre-line',
                          lineHeight: '1.4',
                          textDecoration: item.isStriked ? 'line-through' : 'none'
                        }}>
                          {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Complete Order Button at bottom of card */}
                <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <button
                    onClick={() => handleCompleteOrder(order)}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      background: '#22c55e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
                    onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
                  >
                    ✓ Complete Ticket
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Search Modal ───────────────────────────────────────────── */}
      {showSearchModal && (
        <ModalOverlay onClose={() => setShowSearchModal(false)}>
          <div style={{ padding: '20px', width: '400px', background: '#1e293b', color: '#fff', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🔍 Search Orders & Items</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer or dish..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => { setSearchQuery(''); setShowSearchModal(false); }}
                style={modalButtonStyle}
              >
                Clear
              </button>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{ ...modalButtonStyle, background: '#2563eb', color: '#fff' }}
              >
                Done
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Ticket History Modal ────────────────────────────────────── */}
      {showHistoryModal && (
        <ModalOverlay onClose={() => setShowHistoryModal(false)}>
          <div style={{ padding: '20px', width: '480px', maxHeight: '70vh', overflowY: 'auto', background: '#1e293b', color: '#fff', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🕒 Completed Ticket History</h3>
            {completedHistory.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No completed tickets in this session yet.</p>
            ) : (
              completedHistory.map((hOrd, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: '#0f172a', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: '#22c55e' }}>#{hOrd.orderNumber} {hOrd.orderType}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>Completed at {hOrd.completedAt}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (setOrders) setOrders(prev => [hOrd, ...prev]);
                      setCompletedHistory(prev => prev.filter((_, i) => i !== idx));
                    }}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Re-open
                  </button>
                </div>
              ))
            )}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button onClick={() => setShowHistoryModal(false)} style={modalButtonStyle}>Close</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Language Selector Modal ──────────────────────────────────── */}
      {showLangModal && (
        <ModalOverlay onClose={() => setShowLangModal(false)}>
          <div style={{ padding: '20px', width: '320px', background: '#1e293b', color: '#fff', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🌐 Select KDS Language</h3>
            {['English', '中文 (Chinese)', 'Español (Spanish)', 'Français (French)'].map((lang, lIdx) => (
              <div
                key={lIdx}
                onClick={() => { setCurrentLang(lang.split(' ')[0]); setShowLangModal(false); }}
                style={{
                  padding: '10px 14px',
                  background: currentLang === lang.split(' ')[0] ? '#2563eb' : '#0f172a',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {lang}
              </div>
            ))}
          </div>
        </ModalOverlay>
      )}

      {/* ── Settings Modal ─────────────────────────────────────────── */}
      {showSettingsModal && (
        <ModalOverlay onClose={() => setShowSettingsModal(false)}>
          <div style={{ padding: '20px', width: '400px', background: '#1e293b', color: '#fff', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>⚙️ Chowbus KDS Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={kdsSettings.soundAlert}
                  onChange={e => setKdsSettings(prev => ({ ...prev, soundAlert: e.target.checked }))}
                />
                Audio chime on new order
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={kdsSettings.autoCompleteOnCheck}
                  onChange={e => setKdsSettings(prev => ({ ...prev, autoCompleteOnCheck: e.target.checked }))}
                />
                Auto-complete ticket when all items checked
              </label>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setShowSettingsModal(false)} style={{ ...modalButtonStyle, background: '#2563eb', color: '#fff' }}>Save & Close</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000
      }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

const iconButtonStyle = {
  background: '#242424',
  border: '1px solid #333333',
  color: '#d1d5db',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const modalButtonStyle = {
  padding: '8px 16px',
  background: '#334155',
  border: 'none',
  borderRadius: '6px',
  color: '#cbd5e1',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer'
};
