/**
 * FastFoodKitchenSimple.jsx
 * Simplified Kitchen Display System
 */

import React, { useState, useMemo } from 'react';

export default function FastFoodKitchenSimple({ kdsCards = [], setKdsCards }) {
  // Simplified kitchen orders
  const kitchenOrders = useMemo(() => [
    { id: '2847', items: ['Big Mac', 'Fries', 'Coke'], time: '2:30', status: 'URGENT' },
    { id: '2848', items: ['Zinger Burger', 'Onion Rings'], time: '4:15', status: 'NORMAL' },
    { id: '2849', items: ['Pan Pizza', 'Buffalo Wings'], time: '5:00', status: 'RELAXED' },
  ], []);

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
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
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
    fontWeight: '900',
    fontSize: '12px',
  };

  const ordersContainerStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
  };

  const orderCardStyle = (status) => ({
    backgroundColor: '#2E2E2E',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
    minHeight: '150px',
  });

  const orderHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '2px solid #E63946',
  };

  const orderNumberStyle = {
    fontSize: '16px',
    fontWeight: '900',
    color: '#FFFFFF',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const timeStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '10px',
  };

  const itemStyle = {
    backgroundColor: '#3E3E3E',
    padding: '8px',
    marginBottom: '4px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  };

  const actionButtonStyle = {
    flex: 1,
    padding: '10px',
    fontSize: '12px',
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

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        👨‍🍳 KITCHEN DISPLAY
      </div>

      {/* Orders Container */}
      <div style={ordersContainerStyle}>
        {kitchenOrders.map(order => (
          <div key={order.id} style={orderCardStyle(order.status)}>
            <div style={orderHeaderStyle}>
              <div style={orderNumberStyle}>#{order.id}</div>
              <div style={statusBadgeStyle(order.status)}>{order.status}</div>
            </div>

            <div style={timeStyle}>⏱️ {order.time}</div>

            {order.items.map((item, index) => (
              <div key={index} style={itemStyle}>
                {item}
              </div>
            ))}

            <div style={actionButtonsStyle}>
              <button style={actionButtonStyle}>✅ DONE</button>
              <button style={cancelButtonStyle}>❌ VOID</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
