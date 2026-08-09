/**
 * FastFoodKitchenComprehensive.jsx
 * Comprehensive Kitchen Display System with routing and station management
 */

import React, { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';

export default function FastFoodKitchenComprehensive({ kdsCards = [], setKdsCards }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Kitchen orders with routing
  const kitchenOrders = useMemo(() => [
    {
      id: '2847',
      orderType: 'DT1',
      customer: { name: 'RAHUL S.', phone: '+91 9876543210', tier: 'GOLD' },
      time: '1:30',
      status: 'URGENT',
      route: ['GRILL', 'FRY', 'ASSEMBLY', 'PACKAGING'],
      items: [
        { name: 'Big Mac', modifiers: ['No pickles', 'Extra cheese', 'Large'] },
        { name: 'Zinger Burger', modifiers: ['Extra spicy', 'No mayo'] },
        { name: 'Buffalo Wings', modifiers: ['Medium', 'Ranch', 'Extra crispy'] },
        { name: 'Pan Pizza', modifiers: ['Pepperoni', 'Mushrooms', 'Extra cheese'] },
      ],
    },
    {
      id: '2848',
      orderType: 'DINE',
      customer: { name: 'PRIYA P.', phone: '+91 9123456789', tier: 'SILVER' },
      time: '2:45',
      status: 'NORMAL',
      route: ['GRILL', 'ASSEMBLY'],
      items: [
        { name: 'Quarter Pounder', modifiers: ['Medium', 'Extra cheese'] },
        { name: 'McChicken', modifiers: ['Regular'] },
      ],
    },
    {
      id: '2849',
      orderType: 'TAKE',
      customer: { name: 'AMIT K.', phone: '+91 8899776655', tier: 'BRONZE' },
      time: '3:15',
      status: 'RELAXED',
      route: ['FRY', 'PACKAGING'],
      items: [
        { name: 'Large Fries', modifiers: [] },
        { name: 'Onion Rings', modifiers: [] },
        { name: 'Coleslaw', modifiers: [] },
      ],
    },
    {
      id: '2850',
      orderType: 'DT2',
      customer: { name: 'NEHA G.', phone: '+91 7766554433', tier: 'GOLD' },
      time: '1:45',
      status: 'URGENT',
      route: ['GRILL', 'FRY', 'ASSEMBLY'],
      items: [
        { name: 'Big Mac Meal', modifiers: ['Large', 'Extra cheese'] },
        { name: '10pc McNuggets', modifiers: ['Sweet & Sour', 'Honey Mustard'] },
      ],
    },
  ], []);

  // Stations
  const stations = [
    { id: 'GRILL', label: 'GRILL', icon: '🍔', count: 3 },
    { id: 'FRY', label: 'FRY', icon: '🍟', count: 5 },
    { id: 'OVEN', label: 'OVEN', icon: '🍕', count: 2 },
    { id: 'DRINKS', label: 'DRINKS', icon: '🥤', count: 1 },
    { id: 'PACK', label: 'PACKAGING', icon: '📦', count: 4 },
  ];

  // Timers
  const timers = {
    avgPrep: '4:30',
    avgDT: '2:45',
    avgDine: '8:15',
    avgDel: '15:30',
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'ALL') return kitchenOrders;
    return kitchenOrders.filter(order => order.status === selectedFilter);
  }, [kitchenOrders, selectedFilter]);

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'URGENT':
        return { backgroundColor: '#E63946', color: '#FFFFFF' };
      case 'NORMAL':
        return { backgroundColor: '#FFD166', color: '#1A1A1A' };
      case 'RELAXED':
        return { backgroundColor: '#2ECC71', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' }
    }
  };

  // Handler functions
  const handleBumpOrder = (orderId) => {
    setAlertDialog({ isOpen: true, title: 'Order Bumped', message: `Bumped order #${orderId}`, type: 'info' });
  };

  const handleCompleteOrder = (orderId) => {
    setAlertDialog({ isOpen: true, title: 'Order Completed', message: `Completed order #${orderId}`, type: 'success' });
  };

  const handleVoidOrder = (orderId) => {
    if (confirm(`Void order #${orderId}?`)) {
      setAlertDialog({ isOpen: true, title: 'Order Voided', message: `Voided order #${orderId}`, type: 'warning' });
    }
  };

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontFamily: 'Inter, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '900',
    fontSize: '12px',
  };

  const filterBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#F8F9FA',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const stationBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFD166',
    borderBottom: '2px solid #E63946',
  };

  const stationButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const ordersContainerStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  };

  const orderCardStyle = (status) => ({
    backgroundColor: '#2E2E2E',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '10px',
    minHeight: '160px',
  });

  const orderHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '2px solid #E63946',
  };

  const orderNumberStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#FFFFFF',
  };

  const orderTypeStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFD166',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const timeStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FFFFFF',
  };

  const routeStyle = {
    fontSize: '10px',
    color: '#FFD166',
    marginBottom: '6px',
    fontWeight: '700',
  };

  const itemStyle = {
    backgroundColor: '#3E3E3E',
    padding: '6px',
    marginBottom: '3px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
  };

  const modifierStyle = {
    fontSize: '9px',
    color: '#AAAAAA',
    marginTop: '2px',
  };

  const customerStyle = {
    fontSize: '10px',
    color: '#FFD166',
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px solid #4E4E4E',
    fontWeight: '700',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
  };

  const actionButtonStyle = {
    flex: 1,
    padding: '6px 4px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#2ECC71',
    color: '#FFFFFF',
    border: '2px solid #FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const cancelButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#E63946',
  };

  const footerStyle = {
    backgroundColor: '#2E2E2E',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '2px solid #E63946',
  };

  const stationInfoStyle = {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    fontWeight: '700',
  };

  const timerInfoStyle = {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#FFD166',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>👨‍🍳 KITCHEN DISPLAY SYSTEM</span>
        <span>🔴 4 URGENT │ 🟡 8 NORMAL │ 🟢 12 RELAXED</span>
      </div>

      {/* Filter Bar */}
      <div style={filterBarStyle}>
        <button onClick={() => setSelectedFilter('ALL')} style={filterButtonStyle(selectedFilter === 'ALL')}>
          🔴 URGENT
        </button>
        <button onClick={() => setSelectedFilter('NORMAL')} style={filterButtonStyle(selectedFilter === 'NORMAL')}>
          🟡 NORMAL
        </button>
        <button onClick={() => setSelectedFilter('RELAXED')} style={filterButtonStyle(selectedFilter === 'RELAXED')}>
          🟢 RELAXED
        </button>
        <button onClick={() => setSelectedFilter('ALL')} style={filterButtonStyle(selectedFilter === 'ALL')}>
          ⏱️ BY TIME
        </button>
        <button onClick={() => setSelectedStation('GRILL')} style={filterButtonStyle(selectedStation === 'GRILL')}>
          🍔 GRILL
        </button>
        <button onClick={() => setSelectedStation('FRY')} style={filterButtonStyle(selectedStation === 'FRY')}>
          🍟 FRY
        </button>
        <button onClick={() => setSelectedStation('OVEN')} style={filterButtonStyle(selectedStation === 'OVEN')}>
          🍕 OVEN
        </button>
      </div>

      {/* Station Bar */}
      <div style={stationBarStyle}>
        {stations.map(station => (
          <button
            key={station.id}
            onClick={() => setSelectedStation(station.id)}
            style={stationButtonStyle(selectedStation === station.id)}
          >
            {station.icon} {station.label}: {station.count}
          </button>
        ))}
      </div>

      {/* Orders Container */}
      <div style={ordersContainerStyle}>
        {filteredOrders.map(order => (
          <div key={order.id} style={orderCardStyle(order.status)}>
            <div style={orderHeaderStyle}>
              <div>
                <div style={orderNumberStyle}>#{order.id}</div>
                <div style={orderTypeStyle}>{order.orderType}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={statusBadgeStyle(order.status)}>{order.status}</div>
                <div style={timeStyle}>⏱️ {order.time}</div>
              </div>
            </div>

            <div style={routeStyle}>
              ROUTE: {order.route.join(' → ')}
            </div>

            {order.items.map((item, index) => (
              <div key={index} style={itemStyle}>
                {item.name}
                {item.modifiers.length > 0 && (
                  <div style={modifierStyle}>
                    {item.modifiers.map((mod, i) => (
                      <span key={i}>[{mod}] </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={customerStyle}>
              👤 {order.customer.name} │ 📞 {order.customer.phone} │ ⭐ {order.customer.tier}
            </div>

            <div style={actionButtonsStyle}>
              <button onClick={() => handleBumpOrder(order.id)} style={actionButtonStyle}>🔔 BUMP</button>
              <button onClick={() => handleCompleteOrder(order.id)} style={actionButtonStyle}>✅ DONE</button>
              <button onClick={() => handleVoidOrder(order.id)} style={cancelButtonStyle}>❌ VOID</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <div style={stationInfoStyle}>
          <span>🍔 GRILL: 3</span>
          <span>🍗 FRY: 5</span>
          <span>🍕 OVEN: 2</span>
          <span>🥤 DRINKS: 1</span>
          <span>📦 PACK: 4</span>
        </div>
        <div style={timerInfoStyle}>
          <span>⏱️ AVG PREP: {timers.avgPrep}</span>
          <span>⏱️ AVG DT: {timers.avgDT}</span>
          <span>⏱️ AVG DINE: {timers.avgDine}</span>
          <span>⏱️ AVG DEL: {timers.avgDel}</span>
        </div>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
