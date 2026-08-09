import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { card, btn } from '../../styles/theme';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

export default function AccessibilityOrdersLayout(props) {
  const { menuItems = [], onNavigate } = props;
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highContrast, setHighContrast] = useState(true);
  const [largeText, setLargeText] = useState(true);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visualAlerts, setVisualAlerts] = useState(true);
  const [voiceAnnouncements, setVoiceAnnouncements] = useState(false);
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
  const announcementRef = useRef(null);

  const categories = ['All', 'Coffee', 'Food', 'Desserts', 'Beverages', 'Special'];

  // Voice announcement for screen reader users
  const announce = useCallback((message) => {
    if (voiceAnnouncements && announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, [voiceAnnouncements]);

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    try {
      const items = cart?.items || [];
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + (item?.qty || 0), 0);
      const subTotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 0)), 0);
      const billDiscount = items.reduce((sum, item) => sum + (item?.discount || 0), 0);
      const tax = subTotal * 0.05;
      const total = subTotal - billDiscount + tax;

      return { totalItems, totalQty, subTotal, billDiscount, tax, total };
    } catch (error) {
      console.error('[AccessibilityOrdersLayout] Cart summary error:', error);
      return { totalItems: 0, totalQty: 0, subTotal: 0, billDiscount: 0, tax: 0, total: 0 };
    }
  }, [cart.items]);

  const handleMenuItemClick = useCallback((item) => {
    try {
      if (!item) return;
      setCart(prev => {
        const items = prev?.items || [];
        const existing = items.find(i => i.id === item.id);
        if (existing) {
          announce(`Added another ${item.name} to cart. Total quantity: ${existing.qty + 1}`);
          return { items: items.map(i => i.id === item.id ? { ...i, qty: (i.qty || 0) + 1 } : i) };
        }
        announce(`Added ${item.name} to cart. Price: ₹${item.price}`);
        return { items: [...items, { ...item, qty: 1 }] };
      });
    } catch (error) {
      console.error('[AccessibilityOrdersLayout] Menu item click error:', error);
    }
  }, [announce]);

  const handleCartItemDelete = useCallback((itemId) => {
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      announce(`Removed ${item.name} from cart`);
    }
    setCart(prev => ({ items: prev.items.filter(i => i.id !== itemId) }));
    if (selectedCartItem === itemId) setSelectedCartItem(null);
  }, [cart.items, selectedCartItem, announce]);

  const handleQuantityChange = useCallback((itemId, delta) => {
    const item = cart.items.find(i => i.id === itemId);
    const newQty = Math.max(1, (item?.qty || 0) + delta);
    announce(`${item.name} quantity changed to ${newQty}`);
    setCart(prev => ({
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, qty: newQty };
        }
        return item;
      })
    }));
  }, [cart.items, announce]);

  const handlePlaceOrder = useCallback(() => {
    if (cart.items.length === 0) {
      announce('Cart is empty. Please add items before placing order.');
      return;
    }
    
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    setCurrentOrderId(orderId);
    setShowPaymentModal(true);
  }, [cart.items, announce]);

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
      source: 'ACCESSIBILITY',
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
      console.error('[AccessibilityOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    setCart({ items: [] });
    setSelectedCartItem(null);
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    announce(`Order placed successfully. Total: ₹${cartSummary.total.toFixed(2)}`);
  }, [cart.items, cartSummary.total, currentOrderId, selectedCustomer, announce]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) {
      announce('Cart is empty. Please add items before holding order.');
      return;
    }
    
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
    announce('Order held successfully');
  }, [cart.items, cartSummary.total, selectedCustomer, announce]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setSelectedCustomer(heldOrder.customer);
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
    setShowHeldOrdersModal(false);
    announce('Order recalled from history');
  }, [announce]);

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

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        announce('Search cleared');
      }
      // Enter to focus first item
      if (e.key === 'Enter' && !searchQuery && cart.items.length === 0) {
        const firstItem = menuItems[0];
        if (firstItem) {
          handleMenuItemClick(firstItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, menuItems, cart.items, handleMenuItemClick, announce]);

  const getContrastColors = () => {
    if (highContrast) {
      return {
        background: '#000000',
        text: '#ffffff',
        accent: '#ffff00',
        border: '#ffffff',
        card: '#1a1a1a'
      };
    }
    return {
      background: '#f0f0f0',
      text: '#000000',
      accent: '#0066cc',
      border: '#cccccc',
      card: '#ffffff'
    };
  };

  const colors = getContrastColors();
  const fontSize = largeText ? '18px' : '14px';
  const buttonSize = largeText ? '48px' : '40px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: colors.background,
        color: colors.text,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        fontSize
      }}
      role="application"
      aria-label="Accessibility Orders Interface"
    >
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      />

      {/* Header */}
      <header
        style={{
          padding: '24px 32px',
          background: colors.card,
          borderBottom: `4px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        role="banner"
      >
        <div>
          <h1 style={{ fontSize: largeText ? '32px' : '24px', fontWeight: 700, margin: 0 }}>
            ♿ Accessible Orders
          </h1>
          <p style={{ fontSize: largeText ? '18px' : '14px', margin: '8px 0 0' }}>
            Screen reader and keyboard friendly
          </p>
        </div>

        {/* Accessibility Controls */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '12px 20px',
              background: colors.card,
              color: colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-label="View order history"
          >
            History
          </button>
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            style={{
              padding: '12px 20px',
              background: heldOrders.length > 0 ? colors.accent : colors.card,
              color: heldOrders.length > 0 ? '#000000' : colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-label={`View held orders, ${heldOrders.length} orders held`}
          >
            Held ({heldOrders.length})
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              padding: '12px 20px',
              background: selectedCustomer ? colors.accent : colors.card,
              color: selectedCustomer ? '#000000' : colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-label="Select customer"
          >
            Customer
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            style={{
              padding: '12px 20px',
              background: highContrast ? colors.accent : colors.card,
              color: highContrast ? '#000000' : colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-pressed={highContrast}
            aria-label="Toggle high contrast mode"
          >
            High Contrast
          </button>
          <button
            onClick={() => setLargeText(!largeText)}
            style={{
              padding: '12px 20px',
              background: largeText ? colors.accent : colors.card,
              color: largeText ? '#000000' : colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-pressed={largeText}
            aria-label="Toggle large text mode"
          >
            Large Text
          </button>
          <button
            onClick={() => setVoiceAnnouncements(!voiceAnnouncements)}
            style={{
              padding: '12px 20px',
              background: voiceAnnouncements ? colors.accent : colors.card,
              color: voiceAnnouncements ? '#000000' : colors.text,
              border: `3px solid ${colors.border}`,
              borderRadius: 8,
              fontSize,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            aria-pressed={voiceAnnouncements}
            aria-label="Toggle voice announcements"
          >
            🔊 Voice
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }} role="main">
        {/* Left Panel - Menu */}
        <section style={{ flex: 1, padding: 32, overflow: 'auto' }} aria-label="Menu items">
          {/* Categories */}
          <nav aria-label="Product categories" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: largeText ? '22px' : '18px', marginBottom: 16 }}>Categories</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    announce(`Selected category: ${category}`);
                  }}
                  style={{
                    padding: '16px 24px',
                    background: selectedCategory === category ? colors.accent : colors.card,
                    color: selectedCategory === category ? '#000000' : colors.text,
                    border: `3px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                  aria-pressed={selectedCategory === category}
                  aria-label={`Filter by ${category}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </nav>

          {/* Search */}
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="search-input" style={{ fontSize, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              Search menu items:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `3px solid ${colors.border}`,
                borderRadius: 8,
                fontSize,
                background: colors.card,
                color: colors.text
              }}
              aria-label="Search menu items"
              aria-describedby="search-help"
            />
            <p id="search-help" style={{ fontSize: '14px', marginTop: 8, color: colors.text }}>
              Press Escape to clear search
            </p>
          </div>

          {/* Menu Grid */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}
            role="list"
            aria-label="Menu items"
          >
            {menuItems
              .filter(item => {
                const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
                const matchesSearch = searchQuery === '' || 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  style={{
                    padding: 24,
                    cursor: 'pointer',
                    transition: reducedMotion ? 'none' : 'all 0.3s ease',
                    background: colors.card,
                    border: `3px solid ${colors.border}`,
                    borderRadius: 12,
                    textAlign: 'left',
                    fontSize
                  }}
                  role="listitem"
                  aria-label={`${item.name}, price ₹${item.price?.toFixed(2) || '0.00'}, category ${item.category || 'General'}`}
                  tabIndex={0}
                >
                  <div style={{ fontSize: largeText ? '40px' : '32px', marginBottom: 12 }}>☕</div>
                  <h3 style={{ fontSize: largeText ? '20px' : '16px', fontWeight: 700, margin: '0 0 8px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize, margin: 0, marginBottom: 12 }}>
                    {item.description || 'Fresh and delicious'}
                  </p>
                  <div style={{ fontSize: largeText ? '22px' : '18px', fontWeight: 700, color: colors.accent }}>
                    ₹{item.price?.toFixed(2) || '0.00'}
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Right Panel - Cart */}
        <aside
          style={{ width: 400, background: colors.card, borderLeft: `4px solid ${colors.border}`, padding: 32, overflow: 'auto' }}
          role="region"
          aria-label="Shopping cart"
        >
          <h2 style={{ fontSize: largeText ? '24px' : '20px', fontWeight: 700, marginBottom: 24 }}>
            Your Cart ({cartSummary.totalItems} items)
          </h2>

          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }} role="alert" aria-live="polite">
              <div style={{ fontSize: 64, marginBottom: 16 }}>♿</div>
              <p style={{ fontSize }}>Your cart is empty</p>
              <p style={{ fontSize, marginTop: 8 }}>Add items from the menu</p>
            </div>
          ) : (
            <>
              <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cart.items.map(item => (
                  <li
                    key={item.id}
                    style={{
                      padding: 20,
                      marginBottom: 16,
                      background: colors.background,
                      border: `3px solid ${colors.border}`,
                      borderRadius: 12
                    }}
                    role="listitem"
                    aria-label={`${item.name}, quantity ${item.qty}, total ₹${((item.price || 0) * item.qty).toFixed(2)}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize }}>{item.name}</span>
                      <span style={{ fontSize, fontWeight: 700, color: colors.accent }}>
                        ₹{((item.price || 0) * item.qty).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        style={{
                          width: buttonSize,
                          height: buttonSize,
                          borderRadius: 8,
                          border: `3px solid ${colors.border}`,
                          background: colors.card,
                          color: colors.text,
                          fontSize: largeText ? '24px' : '20px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span
                        style={{ minWidth: 40, textAlign: 'center', fontSize, fontWeight: 700 }}
                        aria-label={`Quantity: ${item.qty}`}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        style={{
                          width: buttonSize,
                          height: buttonSize,
                          borderRadius: 8,
                          border: `3px solid ${colors.border}`,
                          background: colors.card,
                          color: colors.text,
                          fontSize: largeText ? '24px' : '20px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleCartItemDelete(item.id)}
                        style={{
                          marginLeft: 'auto',
                          padding: '12px 24px',
                          background: '#cc0000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize,
                          fontWeight: 700
                        }}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Summary */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: `4px solid ${colors.border}` }} role="region" aria-label="Order summary">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize }}>
                  <span>Subtotal</span>
                  <span>₹{cartSummary.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize }}>
                  <span>Tax (5%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: largeText ? '28px' : '24px',
                    fontWeight: 700,
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: `4px solid ${colors.accent}`,
                    color: colors.accent
                  }}
                  role="alert"
                  aria-live="polite"
                >
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
                    background: highContrast ? '#000000' : '#4A90E2',
                    color: '#FFFFFF',
                    border: highContrast ? '3px solid #FFFFFF' : 'none',
                    borderRadius: 12,
                    fontSize: largeText ? 18 : 16,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  aria-label="Hold order for later"
                >
                  Hold Order
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'percentage' ? null : 'percentage')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'percentage' ? (highContrast ? '#000000' : '#4A90E2') : '#ccc',
                    color: '#FFFFFF',
                    border: highContrast ? '3px solid #FFFFFF' : 'none',
                    borderRadius: 12,
                    fontSize: largeText ? 18 : 16,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  aria-label="Apply percentage discount"
                >
                  % Discount
                </button>
                <button
                  onClick={() => setDiscountMode(discountMode === 'flat' ? null : 'flat')}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: discountMode === 'flat' ? (highContrast ? '#000000' : '#4A90E2') : '#ccc',
                    color: '#FFFFFF',
                    border: highContrast ? '3px solid #FFFFFF' : 'none',
                    borderRadius: 12,
                    fontSize: largeText ? 18 : 16,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  aria-label="Apply flat discount"
                >
                  ₹ Discount
                </button>
              </div>

              <button
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: 20,
                  marginTop: 24,
                  background: highContrast ? '#000000' : '#4A90E2',
                  color: '#FFFFFF',
                  border: highContrast ? '3px solid #FFFFFF' : 'none',
                  borderRadius: 12,
                  fontSize: largeText ? 18 : 16,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                aria-label={`Place order for total ₹${cartSummary.total.toFixed(2)}`}
              >
                Place Order
              </button>
            </>
          )}
        </aside>
      </main>

      {showOrderHistory && (
        <OrderHistoryModal
          orders={orderHistory}
          onRecallOrder={(order) => {
            setCart({ items: order.items || [] });
            setShowOrderHistory(false);
            announce('Order recalled from history');
          }}
          onPrintOrder={(order) => {
            announce(`Printing order ${order.orderNumber}`);
          }}
          onClose={() => {
            setShowOrderHistory(false);
            announce('Order history closed');
          }}
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
          onClose={() => {
            setShowHeldOrdersModal(false);
            announce('Held orders closed');
          }}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onClose={() => {
            setShowCustomerModal(false);
            announce('Customer selection closed');
          }}
        />
      )}
    </div>
  );
}
