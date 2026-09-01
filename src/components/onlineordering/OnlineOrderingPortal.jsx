import React, { useState, useEffect } from 'react';

export default function OnlineOrderingPortal() {
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
    notes: '',
    tableId: ''
  });
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    // Load menu items from localStorage
    try {
      const storedMenu = localStorage.getItem('menuItems');
      if (storedMenu) {
        setMenuItems(JSON.parse(storedMenu));
      } else {
        // Try alternative key
        const altMenu = localStorage.getItem('brewcrm_local_menuItems');
        if (altMenu) {
          setMenuItems(JSON.parse(altMenu));
        }
      }
    } catch (e) {
      console.error('Failed to load menu items:', e);
    }

    // Load tables from localStorage
    try {
      const storedTables = localStorage.getItem('tables');
      if (storedTables) {
        setTables(JSON.parse(storedTables));
      } else {
        // Default tables
        setTables([
          { id: 1, name: 'T1', status: 'available' },
          { id: 2, name: 'T2', status: 'available' },
          { id: 3, name: 'T3', status: 'available' },
          { id: 4, name: 'T4', status: 'available' },
          { id: 5, name: 'T5', status: 'available' },
          { id: 6, name: 'T6', status: 'available' }
        ]);
      }
    } catch (e) {
      console.error('Failed to load tables:', e);
    }
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
    
    // Find selected table
    const selectedTable = tables.find(t => t.id === parseInt(customerInfo.tableId));
    
    // Create order with proper structure
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderNumber,
      orderNumber: orderNumber,
      items: cart,
      total: cartTotal,
      subtotal: cartTotal,
      discount: 0,
      tax: 0,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      customerAddress: customerInfo.address,
      notes: customerInfo.notes,
      tableId: parseInt(customerInfo.tableId) || null,
      tableName: selectedTable?.name || null,
      status: 'PENDING',
      type: 'online',
      paymentMethod: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to main orders system
    try {
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders', JSON.stringify([...existingOrders, newOrder]));
    } catch (e) {
      console.error('Failed to save order:', e);
    }

    // Also save to qr_orders for compatibility
    try {
      const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      localStorage.setItem('qr_orders', JSON.stringify([...qrOrders, newOrder]));
    } catch (e) {
      console.error('Failed to save QR order:', e);
    }

    // Clear cart
    saveCart([]);
    setCustomerInfo({ name: '', phone: '', email: '', address: '', notes: '', tableId: '' });
    setShowCheckout(false);
    setShowCart(false);
    alert('Order placed successfully! Thank you for your order.');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{
              color: '#0a0a0a',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              🥐 BakeryPOS
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Online Ordering
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            style={{
              padding: '12px 24px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
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

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            overflow: 'auto',
            paddingBottom: '8px'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '12px 24px',
                  background: selectedCategory === category ? '#0a0a0a' : '#ffffff',
                  color: selectedCategory === category ? '#ffffff' : '#0a0a0a',
                  border: selectedCategory === category ? 'none' : '1px solid #d1d5db',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedCategory === category ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {category === 'all' ? 'All Items' : category}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '18px', fontWeight: '500' }}>No items found</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filter</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
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
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {item.image && (
        <div style={{
          height: '180px',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px'
        }}>
          {item.image}
        </div>
      )}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a', marginBottom: '12px' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', minHeight: '40px', lineHeight: '1.5' }}>
          {item.description || 'Delicious bakery item'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>
            ₹{item.price?.toFixed(2) || '0.00'}
          </div>
          {cartQuantity > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => onUpdateQuantity(cartQuantity - 1)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: '#f3f4f6',
                  color: '#0a0a0a',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#0a0a0a', minWidth: '28px', textAlign: 'center' }}>
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(cartQuantity + 1)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: '#0a0a0a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAddToCart}
              style={{
                padding: '12px 24px',
                background: '#0a0a0a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
      width: '450px',
      background: '#ffffff',
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>
          Your Cart ({cart.length})
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '10px',
            background: '#f9fafb',
            color: '#0a0a0a',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>Your cart is empty</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>Add some delicious items to get started</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '16px',
                paddingBottom: '20px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ₹{item.price?.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f3f4f6',
                        color: '#0a0a0a',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#0a0a0a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
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
        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>₹{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            style={{
              width: '100%',
              padding: '16px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

function CheckoutModal({ cart, cartTotal, customerInfo, setCustomerInfo, onClose, onSubmit }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '550px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0a0a0a' }}>
            Checkout
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              background: '#f9fafb',
              color: '#0a0a0a',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Order Summary */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a', marginBottom: '16px' }}>
            Order Summary
          </div>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: '600', color: '#0a0a0a' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a' }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>₹{cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Table Number (Optional)
            </label>
            <select
              value={customerInfo.tableId}
              onChange={(e) => setCustomerInfo({ ...customerInfo, tableId: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
            >
              <option value="">Select table (if dining in)</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="Enter your name"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="Enter email (optional)"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Delivery Address *
            </label>
            <textarea
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              rows={3}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Enter delivery address"
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
              Special Instructions
            </label>
            <textarea
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Any special requests or notes"
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '18px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            Place Order • ₹{cartTotal.toFixed(2)}
          </button>
        </form>
      </div>
    </div>
  );
}
