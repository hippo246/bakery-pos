import React, { useState, useEffect } from 'react';

export default function QROrdering({ menuItems = [], onPlaceOrder, onNavigate, darkMode = true }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [showCallWaiterSuccess, setShowCallWaiterSuccess] = useState(false);

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

  // Get table info from URL
  const getTableInfo = () => {
    const params = new URLSearchParams(window.location.search);
    const tableData = params.get('table');
    if (tableData) {
      try {
        return JSON.parse(decodeURIComponent(tableData));
      } catch {
        return null;
      }
    }
    return null;
  };

  const tableInfo = getTableInfo();

  // Get unique categories
  const categories = ['All', ...new Set(menuItems.filter(item => item.active).map(item => item.category))];

  // Filter menu items by category
  const filteredItems = selectedCategory === 'All' 
    ? menuItems.filter(item => item.active && !item.eightySixed)
    : menuItems.filter(item => item.active && !item.eightySixed && item.category === selectedCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id === itemId) {
        const newQty = Math.max(1, c.qty + delta);
        return { ...c, qty: newQty };
      }
      return c;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCallWaiter = () => {
    const waiterCall = {
      id: `WAITER-${Date.now()}`,
      tableId: tableInfo?.tableId || null,
      tableName: tableInfo?.tableName || null,
      customerName: customerName || 'Guest',
      type: 'CALL_WAITER',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Store in localStorage for POS to pick up
    try {
      const existingCalls = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
      localStorage.setItem('waiter_calls', JSON.stringify([...existingCalls, waiterCall]));
      setShowCallWaiterSuccess(true);
      setTimeout(() => setShowCallWaiterSuccess(false), 3000);
    } catch (error) {
      console.error('Error storing waiter call in localStorage:', error);
      setAlertMessage('Failed to call waiter. Please try again.');
      setShowAlert(true);
    }
  };

  const handlePlaceOrder = () => {
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (cart.length === 0) {
      alert('Please add items to your cart');
      return;
    }

    const order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      total: cartTotal,
      subtotal: cartTotal,
      discount: 0,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: cartTotal * 0.18,
      paymentMethod: 'QR_ORDER',
      customerId: null,
      customerName: customerName,
      tableId: tableInfo?.tableId || null,
      tableName: tableInfo?.tableName || null,
      employeeId: 'qr',
      employeeName: 'QR Self-Order',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      isQROrder: true
    };

    // Store in localStorage for POS to pick up with error handling
    try {
      const existingOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      localStorage.setItem('qr_orders', JSON.stringify([...existingOrders, order]));
    } catch (error) {
      console.error('Error storing QR order in localStorage:', error);
      setAlertMessage('Failed to place order. Please try again.');
      setShowAlert(true);
      return;
    }

    setCart([]);
    setCustomerName('');
    setShowOrderSuccess(true);
    setTimeout(() => setShowOrderSuccess(false), 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        color: '#ffffff',
        padding: screenSize === 'small' ? '12px' : '16px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <h1 style={{ margin: 0, fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: 'bold' }}>
          {tableInfo?.tableName || 'Table'} Menu
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: screenSize === 'small' ? '12px' : '14px', opacity: 0.9 }}>
          Scan & Order
        </p>
        <button
          onClick={handleCallWaiter}
          style={{
            position: 'absolute',
            top: screenSize === 'small' ? '12px' : '16px',
            right: screenSize === 'small' ? '12px' : '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
            fontSize: screenSize === 'small' ? '12px' : '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span style={{ fontSize: screenSize === 'small' ? '16px' : '18px' }}>🔔</span>
          Call Waiter
        </button>
      </div>

      {/* Success Message */}
      {showOrderSuccess && (
        <div style={{
          position: 'fixed',
          top: screenSize === 'small' ? '60px' : '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: '#ffffff',
          padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          fontSize: screenSize === 'small' ? '14px' : '16px'
        }}>
          Order placed successfully!
        </div>
      )}

      {/* Call Waiter Success Message */}
      {showCallWaiterSuccess && (
        <div style={{
          position: 'fixed',
          top: screenSize === 'small' ? '60px' : '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#3b82f6',
          color: '#ffffff',
          padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          fontSize: screenSize === 'small' ? '14px' : '16px'
        }}>
          Waiter called successfully!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', padding: screenSize === 'small' ? '12px' : '16px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Categories */}
        <div style={{
          display: 'flex',
          gap: screenSize === 'small' ? '6px' : '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: screenSize === 'small' ? '12px' : '16px'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                background: selectedCategory === category ? '#8B4513' : '#ffffff',
                color: selectedCategory === category ? '#ffffff' : '#333',
                border: '1px solid #ddd',
                borderRadius: '20px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: screenSize === 'small' ? '12px' : '16px',
          marginBottom: screenSize === 'small' ? '12px' : '16px'
        }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{
              background: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}>
              <div style={{ height: screenSize === 'small' ? '120px' : '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: screenSize === 'small' ? '40px' : '48px' }}>{item.emoji || '🍽️'}</span>
              </div>
              <div style={{ padding: screenSize === 'small' ? '10px' : '12px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: screenSize === 'small' ? '14px' : '16px', fontWeight: 'bold', color: '#333' }}>
                  {item.name}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#666' }}>
                  {item.description || 'Delicious item'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: 'bold', color: '#8B4513' }}>
                    ₹{item.price}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    style={{
                      padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                      background: '#8B4513',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            background: '#ffffff',
            borderTop: '1px solid #ddd',
            padding: screenSize === 'small' ? '12px' : '16px',
            boxShadow: '0 -4px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: 'bold', color: '#333' }}>
                Your Order ({cart.length} items)
              </h3>
              
              <div style={{ marginBottom: screenSize === 'small' ? '10px' : '12px' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: screenSize === 'small' ? '10px' : '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: screenSize === 'small' ? '14px' : '14px'
                  }}
                />
              </div>

              <div style={{ maxHeight: screenSize === 'small' ? '120px' : '150px', overflowY: 'auto', marginBottom: screenSize === 'small' ? '10px' : '12px' }}>
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: screenSize === 'small' ? '6px 0' : '8px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px', fontWeight: '500', color: '#333' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#666' }}>
                        ₹{item.price} x {item.qty}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '6px' : '8px' }}>
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        style={{
                          width: screenSize === 'small' ? '24px' : '28px',
                          height: screenSize === 'small' ? '24px' : '28px',
                          borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: '#f5f5f5',
                          fontSize: screenSize === 'small' ? '14px' : '16px',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: screenSize === 'small' ? '12px' : '14px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        style={{
                          width: screenSize === 'small' ? '24px' : '28px',
                          height: screenSize === 'small' ? '24px' : '28px',
                          borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: '#f5f5f5',
                          fontSize: screenSize === 'small' ? '14px' : '16px',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          padding: screenSize === 'small' ? '3px 6px' : '4px 8px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: screenSize === 'small' ? '10px' : '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: screenSize === 'small' ? '10px' : '12px' }}>
                <span style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#666' }}>Total:</span>
                <span style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: 'bold', color: '#8B4513' }}>
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: screenSize === 'small' ? '12px' : '16px',
                  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '14px' : '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>

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
            background: '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '24px' : '32px',
            width: screenSize === 'small' ? '100%' : '400px',
            maxWidth: '90vw',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#111827', marginBottom: '12px', margin: 0 }}>
              Notice
            </h3>
            <p style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: '#6b7280', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: '#8B4513',
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
