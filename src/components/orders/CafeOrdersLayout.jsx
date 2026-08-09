import React, { useState, useCallback, useMemo } from 'react';
import { card, btn } from '../../styles/theme';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

export default function CafeOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [gstEnabled, setGstEnabled] = useState(true);

  const categories = ['All', 'Coffee', 'Food', 'Desserts', 'Beverages'];

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const tax = gstEnabled ? subTotal * 0.05 : 0;
      const total = subTotal - billDiscount + tax;

      return { totalItems, totalQty, subTotal, billDiscount, tax, total };
    } catch (error) {
      console.error('[CafeOrdersLayout] Cart summary error:', error);
      return { totalItems: 0, totalQty: 0, subTotal: 0, billDiscount: 0, tax: 0, total: 0 };
    }
  }, [cart.items, gstEnabled]);

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
      console.error('[CafeOrdersLayout] Menu item click error:', error);
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
      paymentMethod: paymentDetails.method,
      status: 'completed',
      timestamp: new Date().toLocaleString(),
      source: 'CAFE',
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
          mod: '' 
        })),
        note: selectedCustomer ? `Customer: ${selectedCustomer.name}` : '',
        startedAt: Date.now(),
        urgency: 'urgent',
        tableNumber: null,
        createdAt: Date.now()
      };
      
      const existingKds = JSON.parse(localStorage.getItem('cafeos_kdsCards') || '[]');
      localStorage.setItem('cafeos_kdsCards', JSON.stringify([kdsTicket, ...existingKds]));
      
      const existingOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
      localStorage.setItem('cafeos_orders', JSON.stringify([completedOrder, ...existingOrders]));
    } catch (error) {
      console.error('[CafeOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    setCart({ items: [] });
    setSelectedCartItem(null);
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    alert('Order placed successfully!');
  }, [cart.items, cartSummary.total, currentOrderId, selectedCustomer]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const heldOrder = {
      id: `HELD-${Date.now()}`,
      items: cart.items,
      total: cartSummary.total,
      customer: selectedCustomer,
      timestamp: new Date().toLocaleString(),
    };
    
    setHeldOrders(prev => [heldOrder, ...prev]);
    setCart({ items: [] });
    setSelectedCartItem(null);
    setSelectedCustomer(null);
    alert('Order held successfully!');
  }, [cart.items, cartSummary.total, selectedCustomer]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
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
      background: '#faf5f0',
      fontFamily: 'Georgia, serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: '#ffffff',
        borderBottom: '2px solid #8b5a2b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#3d2914', margin: 0 }}>
            ☕ Cafe Orders
          </h1>
          <p style={{ fontSize: 14, color: '#8b7355', margin: '4px 0 0' }}>
            Warm & Cozy Ordering
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '8px 16px',
              background: '#8b5a2b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            History
          </button>
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            style={{
              padding: '8px 16px',
              background: heldOrders.length > 0 ? '#8b5a2b' : '#ccc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Held ({heldOrders.length})
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              padding: '8px 16px',
              background: selectedCustomer ? '#8b5a2b' : '#ccc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Customer
          </button>
          <button
            onClick={() => setGstEnabled(!gstEnabled)}
            style={{
              padding: '8px 16px',
              background: gstEnabled ? '#8b5a2b' : '#ccc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            GST {gstEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ fontSize: 14, color: '#5c4033' }}>
          Items: {cartSummary.totalItems} | Total: ₹{cartSummary.total.toFixed(2)}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Menu */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '10px 20px',
                  background: selectedCategory === category ? '#8b5a2b' : '#ffffff',
                  color: selectedCategory === category ? '#ffffff' : '#5c4033',
                  border: `2px solid ${selectedCategory === category ? '#8b5a2b' : '#e8dcc8'}`,
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: 24,
              border: '2px solid #e8dcc8',
              borderRadius: 12,
              fontSize: 14,
              background: '#ffffff',
              color: '#3d2914'
            }}
          />

          {/* Menu Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {menuItems
              .filter(item => {
                const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
                const matchesSearch = searchQuery === '' || 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .map(item => (
                <div
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  style={{
                    ...card,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    border: '2px solid #e8dcc8',
                    borderRadius: 12
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5a2b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8dcc8';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>☕</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#3d2914', margin: '0 0 4px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 14, color: '#8b7355', margin: 0 }}>
                    ₹{item.price?.toFixed(2) || '0.00'}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div style={{ width: 320, background: '#ffffff', borderLeft: '2px solid #e8dcc8', padding: 24, overflow: 'auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#3d2914', margin: '0 0 16px' }}>
            Your Order
          </h2>

          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#a89070' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    marginBottom: 12,
                    background: '#f5ebe0',
                    borderRadius: 8,
                    border: selectedCartItem === item.id ? '2px solid #8b5a2b' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#3d2914' }}>{item.name}</span>
                    <span style={{ color: '#5c4033' }}>₹{((item.price || 0) * item.qty).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #8b5a2b', background: '#ffffff', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', color: '#3d2914' }}>{item.qty}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #8b5a2b', background: '#ffffff', cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleCartItemDelete(item.id)}
                      style={{ marginLeft: 'auto', padding: '4px 8px', background: '#c94c4c', color: '#ffffff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid #e8dcc8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#5c4033' }}>
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#5c4033' }}>
                  <span>Tax (5%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#3d2914', marginTop: 12 }}>
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
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hold Order
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'percentage' ? null : 'percentage')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'percentage' ? '#8b5a2b' : '#ccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  % Discount
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'flat' ? null : 'flat')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'flat' ? '#8b5a2b' : '#ccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ₹ Discount
                </button>
              </div>

              <button
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: 16,
                  marginTop: 24,
                  background: '#8b5a2b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer'
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
