import React, { useState, useCallback, useMemo } from 'react';
import { card, btn } from '../../styles/theme';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

export default function FineDiningOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [discountMode, setDiscountMode] = useState(null);

  const categories = ['All', 'Appetizers', 'Soups', 'Salads', 'Main Course', 'Desserts', 'Beverages'];
  const courses = ['All', 'First Course', 'Second Course', 'Main Course', 'Dessert'];

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const tax = subTotal * 0.18;
      const serviceCharge = subTotal * 0.10;
      const total = subTotal - billDiscount + tax + serviceCharge;

      return { totalItems, totalQty, subTotal, billDiscount, tax, serviceCharge, total };
    } catch (error) {
      console.error('[FineDiningOrdersLayout] Cart summary error:', error);
      return { totalItems: 0, totalQty: 0, subTotal: 0, billDiscount: 0, tax: 0, serviceCharge: 0, total: 0 };
    }
  }, [cart.items]);

  const handleMenuItemClick = useCallback((item) => {
    try {
      if (!item) return;
      setCart(prev => {
        const items = prev?.items || [];
        const existing = items.find(i => i.id === item.id);
        if (existing) {
          return { items: items.map(i => i.id === item.id ? { ...i, qty: (i.qty || 0) + 1 } : i) };
        }
        return { items: [...items, { ...item, qty: 1 }] };
      });
    } catch (error) {
      console.error('[FineDiningOrdersLayout] Menu item click error:', error);
    }
  }, []);

  const handleCartItemDelete = useCallback((itemId) => {
    setCart(prev => ({ items: prev.items.filter(i => i.id !== itemId) }));
    if (selectedCartItem === itemId) setSelectedCartItem(null);
  }, [selectedCartItem]);

  const handleQuantityChange = useCallback((itemId, delta) => {
    setCart(prev => ({
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, (item.qty || 0) + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    }));
  }, []);

  const handlePlaceOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    setCurrentOrderId(orderId);
    setShowPaymentModal(true);
  }, [cart.items]);

  const handlePaymentSuccess = useCallback((paymentDetails) => {
    const completedOrder = {
      id: currentOrderId,
      receiptNumber: `RCP${Date.now().toString().slice(-8)}`,
      orderNumber: currentOrderId,
      items: cart.items,
      total: cartSummary.total,
      customer: selectedCustomer,
      table: tableNumber,
      paymentMethod: paymentDetails.method,
      status: 'completed',
      timestamp: new Date().toLocaleString(),
      source: 'FINE_DINING',
    };
    
    setOrderHistory(prev => [completedOrder, ...prev]);
    
    // Add to KDS for kitchen display
    try {
      const kdsTicket = {
        id: `KDS-${Date.now()}`,
        orderId: completedOrder.id,
        source: completedOrder.source,
        station: 'Kitchen',
        status: 'NEW',
        items: cart.items.map(item => ({ 
          name: item.name, 
          qty: item.qty, 
          mod: specialRequests 
        })),
        note: `Table ${tableNumber}, ${guestCount} guests. ${specialRequests}`,
        startedAt: Date.now(),
        urgency: 'normal',
        tableNumber: tableNumber || null,
        createdAt: Date.now()
      };
      
      const existingKds = JSON.parse(localStorage.getItem('cafeos_kdsCards') || '[]');
      localStorage.setItem('cafeos_kdsCards', JSON.stringify([kdsTicket, ...existingKds]));
      
      const existingOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
      localStorage.setItem('cafeos_orders', JSON.stringify([completedOrder, ...existingOrders]));
    } catch (error) {
      console.error('[FineDiningOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    setCart({ items: [] });
    setSelectedCartItem(null);
    setTableNumber('');
    setGuestCount(2);
    setSpecialRequests('');
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    alert('Order placed successfully!');
  }, [cart.items, cartSummary.total, currentOrderId, selectedCustomer, tableNumber, guestCount, specialRequests]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const heldOrder = {
      id: `HELD-${Date.now()}`,
      items: cart.items,
      total: cartSummary.total,
      customer: selectedCustomer,
      table: tableNumber,
      guestCount,
      specialRequests,
      timestamp: new Date().toLocaleString(),
    };
    
    setHeldOrders(prev => [heldOrder, ...prev]);
    setCart({ items: [] });
    setSelectedCartItem(null);
    setTableNumber('');
    setGuestCount(2);
    setSpecialRequests('');
    setSelectedCustomer(null);
    alert('Order held successfully!');
  }, [cart.items, cartSummary.total, selectedCustomer, tableNumber, guestCount, specialRequests]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
    setTableNumber(heldOrder.table || '');
    setGuestCount(heldOrder.guestCount || 2);
    setSpecialRequests(heldOrder.specialRequests || '');
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
    setShowHeldOrdersModal(false);
  }, []);

  const handleDeleteHeldOrder = useCallback((heldOrderId) => {
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrderId));
  }, []);

  const handleApplyDiscount = useCallback((itemId, discountType, discountValue) => {
    setCart(prev => ({
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const discount = discountType === 'percentage' 
            ? (item.price * item.qty * discountValue) / 100 
            : discountValue;
          return { ...item, discount };
        }
        return item;
      })
    }));
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1a1a1a',
      fontFamily: 'Playfair Display, serif',
      overflow: 'hidden',
      color: '#e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        background: '#0a0a0a',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#d4af37', margin: 0, letterSpacing: '2px' }}>
            FINE DINING
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Exquisite Dining Experience
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '10px 20px',
              background: '#d4af37',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            History
          </button>
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            style={{
              padding: '10px 20px',
              background: heldOrders.length > 0 ? '#d4af37' : '#333',
              color: heldOrders.length > 0 ? '#0a0a0a' : '#d4af37',
              border: '1px solid #d4af37',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            Held ({heldOrders.length})
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              padding: '10px 20px',
              background: selectedCustomer ? '#d4af37' : '#333',
              color: selectedCustomer ? '#0a0a0a' : '#d4af37',
              border: '1px solid #d4af37',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            Customer
          </button>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>Table</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table #"
              style={{
                width: 80,
                padding: '4px 8px',
                marginLeft: 8,
                background: '#1a1a1a',
                border: '1px solid #444',
                color: '#e8e8e8',
                fontSize: 14,
                textAlign: 'center'
              }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>Guests</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 2)}
              min="1"
              style={{
                width: 60,
                padding: '4px 8px',
                marginLeft: 8,
                background: '#1a1a1a',
                border: '1px solid #444',
                color: '#e8e8e8',
                fontSize: 14,
                textAlign: 'center'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Menu */}
        <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '8px 16px',
                  background: selectedCategory === category ? '#d4af37' : 'transparent',
                  color: selectedCategory === category ? '#0a0a0a' : '#888',
                  border: selectedCategory === category ? 'none' : '1px solid #333',
                  borderRadius: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Courses */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            {courses.map(course => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                style={{
                  padding: '6px 12px',
                  background: selectedCourse === course ? '#d4af37' : 'transparent',
                  color: selectedCourse === course ? '#0a0a0a' : '#666',
                  border: 'none',
                  borderRadius: 0,
                  fontSize: 10,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderBottom: selectedCourse === course ? '2px solid #d4af37' : '1px solid #333'
                }}
              >
                {course}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
            {menuItems
              .filter(item => {
                const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
                return matchesCategory;
              })
              .map(item => (
                <div
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  style={{
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d4af37';
                    e.currentTarget.style.background = '#222';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.background = '#1a1a1a';
                  }}
                >
                  <div style={{ fontSize: 12, color: '#d4af37', marginBottom: 8, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {item.category}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 400, color: '#e8e8e8', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.6, minHeight: 40 }}>
                    {item.description || 'Exquisite preparation with premium ingredients'}
                  </p>
                  <div style={{ marginTop: 16, fontSize: 18, color: '#d4af37', fontWeight: 300 }}>
                    ₹{item.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div style={{ width: 380, background: '#0a0a0a', borderLeft: '1px solid #333', padding: 32, overflow: 'auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#d4af37', margin: '0 0 24px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Current Order
          </h2>

          {/* Special Requests */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 8 }}>
              Special Requests
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Dietary restrictions, allergies, preferences..."
              style={{
                width: '100%',
                height: 60,
                padding: 12,
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#e8e8e8',
                fontSize: 12,
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: '#d4af37' }}>🍽️</div>
              <p style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase' }}>No items selected</p>
            </div>
          ) : (
            <>
              {cart.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 400, color: '#e8e8e8', fontSize: 13 }}>{item.name}</span>
                    <span style={{ color: '#d4af37', fontSize: 13 }}>₹{((item.price || 0) * item.qty).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{ width: 24, height: 24, border: '1px solid #444', background: '#0a0a0a', color: '#e8e8e8', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center', color: '#e8e8e8', fontSize: 13 }}>{item.qty}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{ width: 24, height: 24, border: '1px solid #444', background: '#0a0a0a', color: '#e8e8e8', cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleCartItemDelete(item.id)}
                      style={{ marginLeft: 'auto', padding: '4px 12px', background: '#333', color: '#888', border: 'none', cursor: 'pointer', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#888', fontSize: 12 }}>
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#888', fontSize: 12 }}>
                  <span>Tax (18%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#888', fontSize: 12 }}>
                  <span>Service Charge (10%)</span>
                  <span>₹{cartSummary.serviceCharge.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 300, color: '#d4af37', marginTop: 16, paddingTop: 16, borderTop: '1px solid #333' }}>
                  <span>Total</span>
                  <span>₹{cartSummary.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={handleHoldOrder}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#8b7355',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Hold Order
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'percentage' ? null : 'percentage')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'percentage' ? '#d4af37' : '#333',
                    color: discountMode === 'percentage' ? '#0a0a0a' : '#d4af37',
                    border: '1px solid #d4af37',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  % Disc
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'flat' ? null : 'flat')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'flat' ? '#d4af37' : '#333',
                    color: discountMode === 'flat' ? '#0a0a0a' : '#d4af37',
                    border: '1px solid #d4af37',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  ₹ Disc
                </button>
              </div>

              <button
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: 16,
                  marginTop: 24,
                  background: '#d4af37',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
              >
                Place Order
              </button>
            </>
          )}
        </div>
      </div>

      {showOrderHistory && (
        <OrderHistoryModal
          orders={orderHistory}
          onRecallOrder={(order) => {
            setCart({ items: order.items || [] });
            setTableNumber(order.table || '');
            setShowOrderHistory(false);
          }}
          onPrintOrder={(order) => {
            alert(`Printing order ${order.orderNumber}`);
          }}
          onClose={() => setShowOrderHistory(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={cartSummary.total}
          orderId={currentOrderId}
          onSuccess={handlePaymentSuccess}
          initialPaymentMethod={selectedPaymentMethod}
        />
      )}

      {showHeldOrdersModal && (
        <HeldOrdersModal
          heldOrders={heldOrders}
          onRecallOrder={handleRecallHeldOrder}
          onDeleteOrder={handleDeleteHeldOrder}
          onClose={() => setShowHeldOrdersModal(false)}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
    </div>
  );
}
