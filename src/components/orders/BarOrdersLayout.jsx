import React, { useState, useCallback, useMemo } from 'react';
import { card, btn } from '../../styles/theme';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

export default function BarOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [tabNumber, setTabNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
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

  const categories = ['All', 'Cocktails', 'Beer', 'Wine', 'Whiskey', 'Non-Alcoholic', 'Shots', 'Mixers'];

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const serviceCharge = subTotal * 0.15;
      const total = subTotal + serviceCharge - billDiscount;

      return { totalItems, totalQty, subTotal, billDiscount, serviceCharge, total };
    } catch (error) {
      console.error('[BarOrdersLayout] Cart summary error:', error);
      return { totalItems: 0, totalQty: 0, subTotal: 0, billDiscount: 0, serviceCharge: 0, total: 0 };
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
      console.error('[BarOrdersLayout] Menu item click error:', error);
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
      customer: selectedCustomer || customerName,
      table: tabNumber,
      paymentMethod: paymentDetails.method,
      status: 'completed',
      timestamp: new Date().toLocaleString(),
      source: 'TAB',
    };
    
    setOrderHistory(prev => [completedOrder, ...prev]);
    
    // Add to KDS for kitchen display
    try {
      const kdsTicket = {
        id: `KDS-${Date.now()}`,
        orderId: completedOrder.id,
        source: completedOrder.source,
        station: 'Bar',
        status: 'NEW',
        items: cart.items.map(item => ({ 
          name: item.name, 
          qty: item.qty, 
          mod: '' 
        })),
        note: `Tab: ${tabNumber}`,
        startedAt: Date.now(),
        urgency: 'urgent',
        tableNumber: tabNumber || null,
        createdAt: Date.now()
      };
      
      const existingKds = JSON.parse(localStorage.getItem('cafeos_kdsCards') || '[]');
      localStorage.setItem('cafeos_kdsCards', JSON.stringify([kdsTicket, ...existingKds]));
      
      const existingOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
      localStorage.setItem('cafeos_orders', JSON.stringify([completedOrder, ...existingOrders]));
    } catch (error) {
      console.error('[BarOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    setCart({ items: [] });
    setSelectedCartItem(null);
    setTabNumber('');
    setCustomerName('');
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    alert('Order placed successfully!');
  }, [cart.items, cartSummary.total, currentOrderId, selectedCustomer, customerName, tabNumber]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const heldOrder = {
      id: `HELD-${Date.now()}`,
      items: cart.items,
      total: cartSummary.total,
      customer: selectedCustomer || customerName,
      table: tabNumber,
      timestamp: new Date().toLocaleString(),
    };
    
    setHeldOrders(prev => [heldOrder, ...prev]);
    setCart({ items: [] });
    setSelectedCartItem(null);
    setTabNumber('');
    setCustomerName('');
    setSelectedCustomer(null);
    alert('Order held successfully!');
  }, [cart.items, cartSummary.total, selectedCustomer, customerName, tabNumber]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
    setTabNumber(heldOrder.table || '');
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
      background: '#0d0d0d',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      color: '#00ff88'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 32px',
        background: '#000000',
        borderBottom: '2px solid #00ff88',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
      }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#00ff88', margin: 0, textTransform: 'uppercase', letterSpacing: '4px' }}>
            BAR
          </h1>
          <p style={{ fontSize: 12, color: '#00ff88', margin: '4px 0 0', letterSpacing: '2px', opacity: 0.7 }}>
            Premium Cocktails & Spirits
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '8px 16px',
              background: '#00ff88',
              color: '#000000',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            History
          </button>
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            style={{
              padding: '8px 16px',
              background: heldOrders.length > 0 ? '#00ff88' : '#333',
              color: heldOrders.length > 0 ? '#000000' : '#00ff88',
              border: '1px solid #00ff88',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Held ({heldOrders.length})
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              padding: '8px 16px',
              background: selectedCustomer ? '#00ff88' : '#333',
              color: selectedCustomer ? '#000000' : '#00ff88',
              border: '1px solid #00ff88',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Customer
          </button>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: 10, color: '#00ff88', letterSpacing: '2px', textTransform: 'uppercase' }}>Tab #</label>
            <input
              type="text"
              value={tabNumber}
              onChange={(e) => setTabNumber(e.target.value)}
              placeholder="TAB"
              style={{
                width: 70,
                padding: '6px 12px',
                marginLeft: 8,
                background: '#0d0d0d',
                border: '1px solid #00ff88',
                color: '#00ff88',
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase'
              }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: 10, color: '#00ff88', letterSpacing: '2px', textTransform: 'uppercase' }}>Customer</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name"
              style={{
                width: 120,
                padding: '6px 12px',
                marginLeft: 8,
                background: '#0d0d0d',
                border: '1px solid #00ff88',
                color: '#00ff88',
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
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '10px 20px',
                  background: selectedCategory === category ? '#00ff88' : 'transparent',
                  color: selectedCategory === category ? '#000000' : '#00ff88',
                  border: selectedCategory === category ? 'none' : '1px solid #00ff88',
                  borderRadius: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedCategory === category ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
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
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00ff88';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: 10, color: '#00ff88', marginBottom: 8, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7 }}>
                    {item.category}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#00ff88', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {item.name}
                  </h3>
                  <div style={{ marginTop: 12, fontSize: 20, color: '#00ff88', fontWeight: 900 }}>
                    ₹{item.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div style={{ width: 350, background: '#000000', borderLeft: '2px solid #00ff88', padding: 24, overflow: 'auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#00ff88', margin: '0 0 24px', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Current Tab
          </h2>

          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#00ff88', opacity: 0.3 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🍸</div>
              <p style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase' }}>Tab is empty</p>
            </div>
          ) : (
            <>
              {cart.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    background: '#0d0d0d',
                    border: '1px solid #333',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#00ff88', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</span>
                    <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 700 }}>₹{((item.price || 0) * item.qty).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{ width: 32, height: 32, border: '1px solid #00ff88', background: '#000000', color: '#00ff88', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 30, textAlign: 'center', color: '#00ff88', fontSize: 16, fontWeight: 700 }}>{item.qty}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{ width: 32, height: 32, border: '1px solid #00ff88', background: '#000000', color: '#00ff88', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleCartItemDelete(item.id)}
                      style={{ marginLeft: 'auto', padding: '6px 16px', background: '#00ff88', color: '#000000', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #00ff88' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#00ff88', fontSize: 12, letterSpacing: '1px' }}>
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#00ff88', fontSize: 12, letterSpacing: '1px' }}>
                  <span>Tax (18%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#00ff88', fontSize: 12, letterSpacing: '1px' }}>
                  <span>Service (15%)</span>
                  <span>₹{cartSummary.serviceCharge.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, fontWeight: 900, color: '#00ff88', marginTop: 16, paddingTop: 16, borderTop: '2px solid #00ff88', letterSpacing: '2px' }}>
                  <span>TOTAL</span>
                  <span>₹{cartSummary.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={handleHoldOrder}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#00ff88',
                    color: '#000000',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Hold Tab
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'percentage' ? null : 'percentage')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'percentage' ? '#00ff88' : '#333',
                    color: discountMode === 'percentage' ? '#000000' : '#00ff88',
                    border: '1px solid #00ff88',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
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
                    background: discountMode === 'flat' ? '#00ff88' : '#333',
                    color: discountMode === 'flat' ? '#000000' : '#00ff88',
                    border: '1px solid #00ff88',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
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
                  padding: 20,
                  marginTop: 24,
                  background: '#00ff88',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)'
                }}
              >
                Close Tab
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
            setTabNumber(order.table || '');
            setCustomerName(order.customer || '');
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
