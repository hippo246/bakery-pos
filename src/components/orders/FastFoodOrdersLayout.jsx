/**
 * Fast Food Orders Layout — Comprehensive POS
 *
 * A real, professional-grade fast food POS:
 * - Full-dark chrome header with live clock + order counter
 * - Left: function key panel (MENU/MORE tabs)
 * - Center: category bar + product grid
 * - Right: order receipt panel + numeric keypad + payment buttons
 *
 * Every section uses a consistent dark design language.
 */

import React, { useState, useCallback } from 'react';
import AlertDialog  from '../common/AlertDialog.jsx';
import FunctionKeyPanel from '../fastfood-pos/FunctionKeyPanel';
import NumericKeypad    from '../fastfood-pos/NumericKeypad';
import CategoryBar      from '../fastfood-pos/CategoryBar';
import ProductGrid      from '../fastfood-pos/ProductGrid';
import TopChrome        from '../fastfood-pos/TopChrome';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import OrderHistoryModal from '../classic-pos/OrderHistoryModal';
import PaymentModal from '../payment/PaymentModal';
import CustomerModal from '../classic-pos/CustomerModal';
import HeldOrdersModal from '../classic-pos/HeldOrdersModal';

const SURFACE   = 'var(--pos-surface, #111116)';
const SURFACE2  = 'var(--pos-surface-2, #18181f)';
const BORDER    = 'var(--pos-border, rgba(255,255,255,0.07))';
const ACCENT    = 'var(--ff-cat-active-border, #E63946)';
const TEXT      = 'var(--pos-text, #f1f1f3)';
const MUTED     = 'var(--pos-text-muted, rgba(255,255,255,0.38))';
const CATEGORIES = ['All', 'Coffee', 'Food', 'Special', 'Popular', 'Drinks', 'Snacks', 'Dessert'];

export default function FastFoodOrdersLayout({ menuItems = [], onNavigate }) {
  const [cart, setCart]                     = useState({ items: [] });
  const [customerName, setCustomerName]     = useState('');
  const [selectedCategory, setCategory]    = useState('All');
  const [selectedCartIdx, setCartIdx]      = useState(null);
  const [keypadValue, setKeypadValue]       = useState('');
  const [orderCount, setOrderCount]         = useState(47);
  const [paymentMethod, setPaymentMethod]   = useState('cash');
  const [alertDialog, setAlertDialog]       = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory]     = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [heldOrders, setHeldOrders]         = useState([]);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [discountMode, setDiscountMode]     = useState(null);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const alert = (title, message, type = 'info') =>
    setAlertDialog({ isOpen: true, title, message, type });

  const handleFunctionKeyPress = useCallback((key, action) => {
    if (action === 'clear') { setCart({ items: [] }); setCartIdx(null); }
    else if (action === 'exit') onNavigate?.('dashboard');
    else if (action === 'checkout') handleCheckout();
    else if (action === 'history') setShowOrderHistory(true);
    else if (action === 'held') setShowHeldOrdersModal(true);
    else if (action === 'customer') setShowCustomerModal(true);
    else alert(action.replace(/_/g, ' ').toUpperCase(), `Action: ${action}`, 'info');
  }, [onNavigate, cart]);

  const handleProductClick = useCallback((item) => {
    setCart(prev => {
      const items = [...prev.items];
      const ex = items.find(i => i.id === item.id || i.name === item.name);
      if (ex) ex.quantity = (ex.quantity || 1) + 1;
      else items.push({ ...item, quantity: 1 });
      return { items };
    });
  }, []);

  const handleQtyChange = (idx, delta) => {
    setCart(prev => {
      const items = [...prev.items];
      items[idx].quantity = Math.max(0, (items[idx].quantity || 1) + delta);
      if (items[idx].quantity === 0) items.splice(idx, 1);
      return { items };
    });
    setCartIdx(null);
  };

  const handleCheckout = useCallback(() => {
    if (cart.items.length === 0) {
      alert('Empty Cart', 'Add items before checkout.', 'warning');
      return;
    }
    
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    setCurrentOrderId(orderId);
    setShowPaymentModal(true);
  }, [cart]);

  const handlePaymentSuccess = useCallback((paymentDetails) => {
    const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    
    const completedOrder = {
      id: currentOrderId,
      receiptNumber: `RCP${Date.now().toString().slice(-8)}`,
      orderNumber: currentOrderId,
      items: cart.items.map(i => ({ name: i.name, price: i.price, qty: i.quantity, amount: i.price * i.quantity })),
      total: total,
      customer: selectedCustomer || customerName,
      paymentMethod: paymentDetails.method,
      status: 'completed',
      timestamp: new Date().toLocaleString(),
      source: 'FAST_FOOD',
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
          qty: item.quantity, 
          mod: '' 
        })),
        note: customerName ? `Customer: ${customerName}` : '',
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
      console.error('[FastFoodOrdersLayout] Failed to add to KDS/orders:', error);
    }
    
    alert('Order Placed 🎉', `₹${total.toFixed(2)} via ${paymentDetails.method.toUpperCase()} — Order #${orderCount + 1}`, 'success');
    setCart({ items: [] });
    setCartIdx(null);
    setOrderCount(n => n + 1);
    setCustomerName('');
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setCurrentOrderId(null);
  }, [cart, orderCount, customerName, selectedCustomer, currentOrderId]);

  const handleHoldOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    
    const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    
    const heldOrder = {
      id: `HELD-${Date.now()}`,
      items: cart.items,
      total: total,
      customer: selectedCustomer || customerName,
      timestamp: new Date().toLocaleString(),
    };
    
    setHeldOrders(prev => [heldOrder, ...prev]);
    setCart({ items: [] });
    setCartIdx(null);
    setCustomerName('');
    setSelectedCustomer(null);
    alert('Order Held', 'Order has been held for later', 'info');
  }, [cart, customerName, selectedCustomer]);

  const handleRecallHeldOrder = useCallback((heldOrder) => {
    setCart({ items: heldOrder.items });
    setCustomerName(heldOrder.customer?.name || '');
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
            ? (item.price * item.quantity * discountValue) / 100 
            : discountValue;
          return { ...item, discount };
        }
        return item;
      })
    }));
  }, []);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax      = subtotal * 0.05;
  const total    = subtotal + tax;

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const panel = {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    overflow: 'hidden',
  };

  const sectionLabel = {
    fontSize: 9, fontWeight: 800, color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0a0a0f', fontFamily: 'system-ui, -apple-system, sans-serif',
      color: TEXT, overflow: 'hidden',
    }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
        orderCount={orderCount}
      />

      {/* ── Main 3-column layout ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 10, padding: 10,
        flex: 1, overflow: 'hidden', minHeight: 0,
      }}>

        {/* ── LEFT: Function keys ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
        </div>

        {/* ── CENTER: Categories + Products ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <CategoryBar
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setCategory}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
          <div style={{
            ...panel,
            flex: 1, overflowY: 'auto',
            background: SURFACE2,
          }}>
            <ProductGrid
              items={menuItems}
              onItemClick={handleProductClick}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>

        {/* ── RIGHT: Order panel ──────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          width: 320, overflow: 'hidden', minHeight: 0,
        }}>

          {/* Order receipt */}
          <div style={{ ...panel, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Receipt header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🧾</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: TEXT }}>Current Order</span>
                {cart.items.length > 0 && (
                  <span style={{
                    background: ACCENT, color: '#fff',
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
                  }}>{cart.items.reduce((s, i) => s + i.quantity, 0)}</span>
                )}
              </div>
              {cart.items.length > 0 && (
                <button
                  onClick={() => { setCart({ items: [] }); setCartIdx(null); }}
                  style={{
                    fontSize: 10, fontWeight: 700, color: '#ef4444',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                  }}
                >CLEAR</button>
              )}
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              padding: '6px 16px', gap: 8,
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}>
              {['ITEM', 'QTY', 'AMOUNT'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 800, color: MUTED, letterSpacing: 1 }}>{h}</div>
              ))}
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {cart.items.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', gap: 8,
                }}>
                  <span style={{ fontSize: 36, opacity: 0.3 }}>🛒</span>
                  <span style={{ fontSize: 12, color: MUTED }}>No items yet</span>
                </div>
              ) : (
                cart.items.map((item, idx) => {
                  const active = selectedCartIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setCartIdx(active ? null : idx)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr auto auto',
                        alignItems: 'center', gap: 8,
                        padding: '9px 8px',
                        borderRadius: 8, marginBottom: 4,
                        background: active ? `${ACCENT}18` : 'transparent',
                        border: `1px solid ${active ? `${ACCENT}40` : 'transparent'}`,
                        cursor: 'pointer', transition: 'all 0.12s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: MUTED }}>₹{item.price.toFixed(0)} each</div>
                      </div>
                      {/* Qty stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQtyChange(idx, -1); }}
                          style={{
                            width: 22, height: 22, borderRadius: 5, border: `1px solid ${BORDER}`,
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                            fontSize: 14, fontWeight: 900, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >−</button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQtyChange(idx, 1); }}
                          style={{
                            width: 22, height: 22, borderRadius: 5, border: `1px solid ${BORDER}`,
                            background: 'rgba(16,185,129,0.15)', color: '#10b981',
                            fontSize: 14, fontWeight: 900, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >+</button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: active ? ACCENT : TEXT, textAlign: 'right', minWidth: 50 }}>
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totals strip */}
            {cart.items.length > 0 && (
              <div style={{
                borderTop: `1px solid ${BORDER}`,
                padding: '10px 16px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>Subtotal</span>
                  <span style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>GST (5%)</span>
                  <span style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderTop: `1px solid ${BORDER}`,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>TOTAL</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: ACCENT }}>₹{total.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Keypad entry strip */}
          <div style={{ ...panel, padding: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={keypadValue}
                readOnly
                placeholder="Qty / Amount"
                style={{
                  flex: 1, padding: '8px 12px',
                  background: SURFACE2, border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: TEXT, fontSize: 16, fontWeight: 700,
                  outline: 'none', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <button
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#3b82f6', color: '#fff',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >QTY</button>
              <button
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#8b5cf6', color: '#fff',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >AMT</button>
            </div>
            <NumericKeypad
              onValueChange={(v) => setKeypadValue(p => p + v)}
              onClear={() => setKeypadValue('')}
              onEnter={() => setKeypadValue('')}
            />
          </div>

          {/* Payment method selector */}
          <div style={{ ...panel, padding: 12, flexShrink: 0 }}>
            <div style={sectionLabel}>Payment Method</div>
            <PaymentMethodSelector
              methods={['cash', 'gpay', 'phonepay', 'upi']}
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              size="compact"
              columns={4}
            />
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            style={{
              width: '100%', padding: '16px 0',
              background: cart.items.length > 0
                ? `linear-gradient(135deg, ${ACCENT}, #C1121F)`
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${cart.items.length > 0 ? ACCENT : BORDER}`,
              borderRadius: 14, color: cart.items.length > 0 ? '#fff' : MUTED,
              fontSize: 16, fontWeight: 900, cursor: cart.items.length > 0 ? 'pointer' : 'default',
              letterSpacing: 1, transition: 'all 0.18s ease', flexShrink: 0,
              boxShadow: cart.items.length > 0 ? `0 4px 20px rgba(230,57,70,0.4)` : 'none',
            }}
            onMouseEnter={(e) => {
              if (cart.items.length > 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(230,57,70,0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = cart.items.length > 0 ? `0 4px 20px rgba(230,57,70,0.4)` : 'none';
            }}
          >
            {cart.items.length > 0
              ? `⚡ CHARGE  ₹${total.toFixed(0)}`
              : 'Add items to order'}
          </button>
        </div>
      </div>

      {showOrderHistory && (
        <OrderHistoryModal
          orders={orderHistory}
          onRecallOrder={(order) => {
            setCart({ items: order.items || [] });
            setCustomerName(order.customer?.name || '');
            setShowOrderHistory(false);
          }}
          onPrintOrder={(order) => {
            alert('Print', `Printing order ${order.orderNumber}`, 'info');
          }}
          onClose={() => setShowOrderHistory(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={total}
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

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(p => ({ ...p, isOpen: false }))}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
