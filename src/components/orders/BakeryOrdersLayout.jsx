import React, { useState, useCallback, useMemo } from 'react';
import { card, btn } from '../../styles/theme';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

export default function BakeryOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('pickup'); // pickup, delivery
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

  const categories = ['All', 'Breads', 'Pastries', 'Cakes', 'Cookies', 'Savory', 'Beverages'];

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const tax = subTotal * 0.05;
      const deliveryFee = orderType === 'delivery' ? 50 : 0;
      const total = subTotal - billDiscount + tax + deliveryFee;

      return { totalItems, totalQty, subTotal, billDiscount, tax, deliveryFee, total };
    } catch (error) {
      console.error('[BakeryOrdersLayout] Cart summary error:', error);
      return { totalItems: 0, totalQty: 0, subTotal: 0, billDiscount: 0, tax: 0, deliveryFee: 0, total: 0 };
    }
  }, [cart.items, orderType]);

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
      console.error('[BakeryOrdersLayout] Menu item click error:', error);
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
      source: orderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
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
        note: orderType === 'delivery' ? 'Delivery Order' : 'Pickup Order',
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
      console.error('[BakeryOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    setCart({ items: [] });
    setSelectedCartItem(null);
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    alert('Order placed successfully!');
  }, [cart.items, cartSummary.total, currentOrderId, selectedCustomer, orderType]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const heldOrder = {
      id: `HELD-${Date.now()}`,
      items: cart.items,
      total: cartSummary.total,
      customer: selectedCustomer,
      orderType,
      timestamp: new Date().toLocaleString(),
    };
    
    setHeldOrders(prev => [heldOrder, ...prev]);
    setCart({ items: [] });
    setSelectedCartItem(null);
    setSelectedCustomer(null);
    alert('Order held successfully!');
  }, [cart.items, cartSummary.total, selectedCustomer, orderType]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
    setOrderType(heldOrder.orderType || 'pickup');
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
      background: '#fff8f0',
      fontFamily: 'Quicksand, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 32px',
        background: '#ffffff',
        borderBottom: '3px solid #f4a460',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#8b4513', margin: 0 }}>
            🥐 Bakery Orders
          </h1>
          <p style={{ fontSize: 14, color: '#cd853f', margin: '4px 0 0' }}>
            Fresh from the oven
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '10px 20px',
              background: '#f4a460',
              color: '#ffffff',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            History
          </button>
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            style={{
              padding: '10px 20px',
              background: heldOrders.length > 0 ? '#f4a460' : '#ccc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Held ({heldOrders.length})
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              padding: '10px 20px',
              background: selectedCustomer ? '#f4a460' : '#ccc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Customer
          </button>
          <button
            onClick={() => setOrderType('pickup')}
            style={{
              padding: '10px 20px',
              background: orderType === 'pickup' ? '#f4a460' : '#ffffff',
              color: orderType === 'pickup' ? '#ffffff' : '#8b4513',
              border: `2px solid ${orderType === 'pickup' ? '#f4a460' : '#f4a460'}`,
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🛒 Pickup
          </button>
          <button
            onClick={() => setOrderType('delivery')}
            style={{
              padding: '10px 20px',
              background: orderType === 'delivery' ? '#f4a460' : '#ffffff',
              color: orderType === 'delivery' ? '#ffffff' : '#8b4513',
              border: `2px solid ${orderType === 'delivery' ? '#f4a460' : '#f4a460'}`,
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🚗 Delivery
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Menu */}
        <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '12px 24px',
                  background: selectedCategory === category ? '#f4a460' : '#ffffff',
                  color: selectedCategory === category ? '#ffffff' : '#8b4513',
                  border: `2px solid ${selectedCategory === category ? '#f4a460' : '#deb887'}`,
                  borderRadius: 25,
                  fontSize: 14,
                  fontWeight: 700,
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
            placeholder="🔍 Search our fresh items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              marginBottom: 28,
              border: '2px solid #deb887',
              borderRadius: 25,
              fontSize: 15,
              background: '#ffffff',
              color: '#8b4513'
            }}
          />

          {/* Menu Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
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
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#ffffff',
                    border: '2px solid #deb887',
                    borderRadius: 20
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f4a460';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(244, 164, 96, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#deb887';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🥐</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#8b4513', margin: '0 0 6px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#cd853f', margin: 0, marginBottom: 12 }}>
                    {item.description || 'Freshly baked'}
                  </p>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f4a460' }}>
                    ₹{item.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div style={{ width: 340, background: '#ffffff', borderLeft: '3px solid #f4a460', padding: 28, overflow: 'auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#8b4513', margin: '0 0 20px' }}>
            🛒 Your Basket
          </h2>

          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#cd853f' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🥐</div>
              <p style={{ fontSize: 16 }}>Your basket is empty</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Add some fresh goodies!</p>
            </div>
          ) : (
            <>
              {cart.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    marginBottom: 16,
                    background: '#fff8f0',
                    borderRadius: 16,
                    border: selectedCartItem === item.id ? '2px solid #f4a460' : '2px solid #deb887'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, color: '#8b4513', fontSize: 15 }}>{item.name}</span>
                    <span style={{ color: '#f4a460', fontWeight: 700, fontSize: 15 }}>₹{((item.price || 0) * item.qty).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{ width: 32, height: 32, borderRadius: 50, border: '2px solid #f4a460', background: '#ffffff', color: '#f4a460', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 30, textAlign: 'center', color: '#8b4513', fontSize: 16, fontWeight: 700 }}>{item.qty}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{ width: 32, height: 32, borderRadius: 50, border: '2px solid #f4a460', background: '#ffffff', color: '#f4a460', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleCartItemDelete(item.id)}
                      style={{ marginLeft: 'auto', padding: '8px 16px', background: '#cd5c5c', color: '#ffffff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '3px solid #deb887' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#8b4513', fontSize: 15 }}>
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#8b4513', fontSize: 15 }}>
                  <span>Tax (5%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#8b4513', fontSize: 15 }}>
                    <span>Delivery Fee</span>
                    <span>₹{cartSummary.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, color: '#f4a460', marginTop: 16, paddingTop: 16, borderTop: '3px solid #f4a460' }}>
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
                    borderRadius: 12,
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
                    background: discountMode === 'percentage' ? '#f4a460' : '#ccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
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
                    background: discountMode === 'flat' ? '#f4a460' : '#ccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
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
                  background: '#f4a460',
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
