import React, { useState, useEffect } from 'react';

export default function OnlineOrdering({ menuItems, onNavigate }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

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

  useEffect(() => {
    // Load cart from localStorage
    try {
      const savedCart = localStorage.getItem('bakerypos_online_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('bakerypos_online_cart', JSON.stringify(newCart));
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category || 'Other'))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || (item.category || 'Other') === selectedCategory;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = item.active !== false && item.eightySixed !== true;
    return matchesCategory && matchesSearch && isActive;
  });

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      saveCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      saveCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    saveCart(cart.filter(c => c.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      saveCart(cart.map(c => c.id === itemId ? { ...c, quantity } : c));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = (e) => {
    e.preventDefault();
    // Create order
    const order = {
      id: Date.now(),
      items: cart,
      total: cartTotal,
      customer: customerInfo,
      status: 'PENDING',
      type: 'online',
      paymentMethod: paymentMethod, // 'cash' for Pay at Counter, 'online' for prepaid
      createdAt: new Date().toISOString()
    };

    console.log('Saving order to localStorage:', order);

    // Save to localStorage for processing
    try {
      const existingOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      console.log('Existing orders:', existingOrders);
      const updatedOrders = [...existingOrders, order];
      localStorage.setItem('qr_orders', JSON.stringify(updatedOrders));
      console.log('Order saved successfully to qr_orders');
      console.log('Current qr_orders in localStorage:', localStorage.getItem('qr_orders'));
    } catch (e) {
      console.error('Failed to save order:', e);
    }

    // Clear cart
    saveCart([]);
    setCustomerInfo({ name: '', phone: '', email: '', address: '', notes: '' });
    setShowCheckout(false);
    setShowCart(false);
    setOrderSuccess(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: '#0a0a0a',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              🥐 BakeryPOS
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Online Ordering
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            style={{
              padding: screenSize === 'small' ? '10px 16px' : '12px 20px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🛒 Cart ({cartCount})
          </button>
        </div>
      </div>

      {/* Success Message */}
      {orderSuccess && (
        <div style={{
          background: '#10b981',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Order Placed Successfully!</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Thank you for your order. We'll prepare it shortly.</div>
            </div>
          </div>
          <button
            onClick={() => setOrderSuccess(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: '#f9fafb' }}>
        {/* Search */}
        <div style={{ marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: screenSize === 'small' ? '12px 16px' : '16px 20px',
              background: '#ffffff',
              color: '#0a0a0a',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '14px' : '15px',
              outline: 'none'
            }}
          />
        </div>

        {/* Categories */}
        <div style={{
          display: 'flex',
          gap: screenSize === 'small' ? '6px' : '8px',
          marginBottom: screenSize === 'small' ? '16px' : '24px',
          overflow: 'auto',
          paddingBottom: '8px'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: selectedCategory === category ? '#0a0a0a' : '#ffffff',
                color: selectedCategory === category ? '#ffffff' : '#0a0a0a',
                border: selectedCategory === category ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '13px' : '14px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {category === 'all' ? 'All Items' : category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>No items found</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>Try adjusting your search or filter</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={() => addToCart(item)}
                cartQuantity={cart.find(c => c.id === item.id)?.quantity || 0}
                onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          onClose={() => setShowCart(false)}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          cartTotal={cartTotal}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckout}
        />
      )}
    </div>
  );
}

function MenuItemCard({ item, onAddToCart, cartQuantity, onUpdateQuantity }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease'
    }}>
      {item.image && (
        <div style={{
          height: '160px',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px'
        }}>
          {item.image}
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', minHeight: '36px' }}>
          {item.description || 'Delicious bakery item'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a' }}>
            ₹{item.price?.toFixed(2) || '0.00'}
          </div>
          {cartQuantity > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onUpdateQuantity(cartQuantity - 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#f3f4f6',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a', minWidth: '24px', textAlign: 'center' }}>
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(cartQuantity + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#0a0a0a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAddToCart}
              style={{
                padding: '10px 20px',
                background: '#0a0a0a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CartSidebar({ cart, cartTotal, onClose, onRemoveItem, onUpdateQuantity, onCheckout }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '400px',
      background: '#ffffff',
      boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a' }}>
          Your Cart ({cart.length})
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            background: '#f9fafb',
            color: '#0a0a0a',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>Your cart is empty</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>Add some delicious items to get started</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ₹{item.price?.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#f3f4f6',
                        color: '#0a0a0a',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#0a0a0a', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#0a0a0a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a' }}>₹{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            style={{
              width: '100%',
              padding: '16px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

function CheckoutModal({ cart, cartTotal, customerInfo, setCustomerInfo, paymentMethod, setPaymentMethod, onClose, onSubmit }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#0a0a0a' }}>
            Checkout
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: '#f9fafb',
              color: '#0a0a0a',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Order Summary */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '12px' }}>
            Order Summary
          </div>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: '500', color: '#0a0a0a' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a' }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a' }}>₹{cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter your name"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter email (optional)"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Delivery Address *
            </label>
            <textarea
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              rows={3}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Enter delivery address"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Special Instructions
            </label>
            <textarea
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Any special requests or notes"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111111', marginBottom: '8px' }}>
              Payment Method *
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: paymentMethod === 'cash' ? '#0a0a0a' : '#ffffff',
                  color: paymentMethod === 'cash' ? '#ffffff' : '#0a0a0a',
                  border: paymentMethod === 'cash' ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                💰 Pay at Counter
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: paymentMethod === 'online' ? '#0a0a0a' : '#ffffff',
                  color: paymentMethod === 'online' ? '#ffffff' : '#0a0a0a',
                  border: paymentMethod === 'online' ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                💳 Pay Online
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Place Order • ₹{cartTotal.toFixed(2)}
          </button>
        </form>
      </div>
    </div>
  );
}
