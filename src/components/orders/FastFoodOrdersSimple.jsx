/**
 * FastFoodOrdersSimple.jsx
 * Simplified Fast Food POS with essential features
 */

import React, { useState, useMemo } from 'react';

export default function FastFoodOrdersSimple({ menuItems = [], setMenuItems, orders = [], setOrders }) {
  const [currentOrder, setCurrentOrder] = useState([]);

  // Simplified product data
  const products = useMemo(() => [
    { id: 'BM001', name: 'Big Mac', price: 5.99, category: 'BURGERS', image: '🍔' },
    { id: 'QP001', name: 'Quarter Pounder', price: 6.49, category: 'BURGERS', image: '🍔' },
    { id: 'ZB001', name: 'Zinger Burger', price: 5.99, category: 'CHICKEN', image: '🍗' },
    { id: 'HW001', name: 'Hot Wings 8pc', price: 8.99, category: 'CHICKEN', image: '🍗' },
    { id: 'PP001', name: 'Pan Pizza', price: 12.99, category: 'PIZZA', image: '🍕' },
    { id: 'CK001', name: 'Coke', price: 1.99, category: 'DRINKS', image: '🥤' },
    { id: 'FR001', name: 'Fries', price: 2.99, category: 'SIDES', image: '🍟' },
    { id: 'MF001', name: 'McFlurry', price: 4.99, category: 'DESSERT', image: '🍦' },
  ], []);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [currentOrder]);

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
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

  const mainContentStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  };

  const productGridStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  };

  const productCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    minHeight: '110px',
  };

  const orderPanelStyle = {
    width: '250px',
    backgroundColor: '#FFFFFF',
    borderLeft: '2px solid #E63946',
    display: 'flex',
    flexDirection: 'column',
  };

  const orderHeaderStyle = {
    padding: '10px',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: '12px',
  };

  const orderItemsStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '10px',
  };

  const orderItemStyle = {
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
  };

  const totalsStyle = {
    padding: '16px',
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
  };

  const totalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '700',
  };

  const grandTotalStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '2px solid #FFFFFF',
    fontSize: '24px',
    fontWeight: '900',
    color: '#FFD166',
  };

  const payButtonStyle = {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '900',
    backgroundColor: '#2ECC71',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const clearButtonStyle = {
    padding: '12px',
    fontSize: '14px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        🍔 FAST FOOD POS
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Product Grid */}
        <div style={productGridStyle}>
          {products.map(product => (
            <div
              key={product.id}
              style={productCardStyle}
              onClick={() => setCurrentOrder([...currentOrder, product])}
            >
              <div style={{ fontSize: '40px' }}>{product.image}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', marginTop: '8px' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#E63946', marginTop: '4px' }}>
                ${product.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Order Panel */}
        <div style={orderPanelStyle}>
          <div style={orderHeaderStyle}>
            CURRENT ORDER
          </div>

          <div style={orderItemsStyle}>
            {currentOrder.map((item, index) => (
              <div key={index} style={orderItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setCurrentOrder(currentOrder.filter((_, i) => i !== index))}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: '#E63946',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={totalsStyle}>
            <div style={totalRowStyle}>
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={totalRowStyle}>
              <span>Tax</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div style={grandTotalStyle}>
              <span>TOTAL</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button style={payButtonStyle}>
            ✅ PAY ${totals.total.toFixed(2)}
          </button>
          <button
            onClick={() => setCurrentOrder([])}
            style={clearButtonStyle}
          >
            ❌ CLEAR ORDER
          </button>
        </div>
      </div>
    </div>
  );
}
