/**
 * FastFoodOrdersComprehensive.jsx
 * Comprehensive Fast Food POS — fully dark, premium design
 * Inspired by real McDonald's/KFC/Taco Bell POS terminals
 */

import { useState, useMemo, useEffect } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import PaymentMethodSelector from '../payment/PaymentMethodSelector.jsx';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        'var(--theme-background, #09090d)',
  surface:   'var(--theme-background-elevated, #111116)',
  surface2:  'var(--theme-background-surface, #18181f)',
  surface3:  'var(--theme-background-card, #1e1e28)',
  border:    'var(--theme-border, rgba(255,255,255,0.07))',
  border2:   'var(--theme-border-light, rgba(255,255,255,0.12))',
  accent:    'var(--theme-primary, #E63946)',
  accentDim: 'var(--theme-primary-dim, rgba(230,57,70,0.15))',
  accentBrd: 'var(--theme-primary-border, rgba(230,57,70,0.35))',
  gold:      'var(--theme-warning, #f59e0b)',
  green:     'var(--theme-success, #10b981)',
  blue:      'var(--theme-info, #3b82f6)',
  purple:    'var(--theme-primary-dark, #8b5cf6)', // using primaryDark for purple accent in theme
  text:      'var(--theme-text-primary, #f1f1f4)',
  text2:     'var(--theme-text-secondary, rgba(255,255,255,0.55))',
  text3:     'var(--theme-text-muted, rgba(255,255,255,0.3))',
  font:      'var(--theme-font-family, Inter, system-ui, -apple-system, sans-serif)',
};

// ─── Order type tab ───────────────────────────────────────────────────────────
const ORDER_TYPES = [
  { id: 'DT1',      label: 'DRIVE-THRU 1', icon: '🚗', count: 8,  status: 'urgent' },
  { id: 'DT2',      label: 'DRIVE-THRU 2', icon: '🚗', count: 6,  status: 'normal' },
  { id: 'DINE',     label: 'DINE-IN',      icon: '🍽️', count: 12, status: 'normal' },
  { id: 'CARRY',    label: 'CARRYOUT',     icon: '🥡', count: 5,  status: 'normal' },
  { id: 'DELIVERY', label: 'DELIVERY',     icon: '🛵', count: 3,  status: 'normal' },
  { id: 'EXPRESS',  label: 'EXPRESS',      icon: '⚡', count: 7,  status: 'normal' },
  { id: 'CATERING', label: 'CATERING',     icon: '🎁', count: 2,  status: 'normal' },
  { id: 'ONLINE',   label: 'ONLINE',       icon: '📱', count: 4,  status: 'normal' },
];

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'BURGERS',   label: 'BURGERS',      icon: '🍔' },
  { id: 'CHICKEN',   label: 'CHICKEN',      icon: '🍗' },
  { id: 'PIZZA',     label: 'PIZZA',        icon: '🍕' },
  { id: 'DRINKS',    label: 'DRINKS',       icon: '🥤' },
  { id: 'SIDES',     label: 'SIDES',        icon: '🍟' },
  { id: 'DESSERT',   label: 'DESSERT',      icon: '🍦' },
  { id: 'COMBOS',    label: 'COMBOS',       icon: '🎁' },
  { id: 'WRAPS',     label: 'WRAPS',        icon: '🥪' },
  { id: 'BOWLS',     label: 'BOWLS',        icon: '🥗' },
  { id: 'COFFEE',    label: 'COFFEE',       icon: '☕' },
  { id: 'BREAKFAST', label: 'BREAKFAST',    icon: '🥞' },
  { id: 'SALADS',    label: 'SALADS',       icon: '🥗' },
  { id: 'COOKIES',   label: 'COOKIES',      icon: '🍪' },
  { id: 'BUILD',     label: 'BUILD YOUR OWN', icon: '📦' },
  { id: 'PROMOS',    label: 'PROMOS',       icon: '🧁' },
  { id: 'LOYALTY',   label: 'LOYALTY',      icon: '👤' },
];

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'BM001', name: 'BIG MAC MEAL',      category: 'BURGERS',   price: 599, icon: '🍔' },
  { id: 'QP001', name: 'QUARTER POUNDER',   category: 'BURGERS',   price: 449, icon: '🍔' },
  { id: 'CB001', name: 'CRISPY BURGER',     category: 'BURGERS',   price: 349, icon: '🍔' },
  { id: 'DB001', name: 'DOUBLE BEEF',       category: 'BURGERS',   price: 529, icon: '🍔' },
  { id: 'ZB001', name: 'ZINGER BURGER',     category: 'CHICKEN',   price: 399, icon: '🍗' },
  { id: 'HW001', name: 'HOT WINGS 8PC',     category: 'CHICKEN',   price: 599, icon: '🍗' },
  { id: 'PP001', name: 'PAN PIZZA',         category: 'PIZZA',     price: 849, icon: '🍕' },
  { id: 'SC001', name: 'STUFFED CRUST',     category: 'PIZZA',     price: 999, icon: '🍕' },
  { id: 'CK001', name: 'COKE',              category: 'DRINKS',    price: 129, icon: '🥤' },
  { id: 'PE001', name: 'PEPSI',             category: 'DRINKS',    price: 129, icon: '🥤' },
  { id: 'FR001', name: 'FRIES',             category: 'SIDES',     price: 199, icon: '🍟' },
  { id: 'OR001', name: 'ONION RINGS',       category: 'SIDES',     price: 179, icon: '🍟' },
  { id: 'MF001', name: 'MCFLURRY',          category: 'DESSERT',   price: 299, icon: '🍦' },
  { id: 'SD001', name: 'SUNDAE',            category: 'DESSERT',   price: 249, icon: '🍦' },
  { id: 'FB001', name: 'FAMILY BUCKET',     category: 'COMBOS',    price: 1649, icon: '🎁' },
  { id: 'CM001', name: 'COMBO MEAL',        category: 'COMBOS',    price: 849, icon: '🎁' },
];

// ─── Tile color per category ──────────────────────────────────────────────────
const CAT_COLORS = {
  BURGERS: '#E63946', CHICKEN: '#f97316', PIZZA: '#f59e0b',
  DRINKS: '#3b82f6', SIDES: '#10b981', DESSERT: '#ec4899',
  COMBOS: '#8b5cf6', WRAPS: '#06b6d4', BOWLS: '#84cc16',
  COFFEE: '#92400e', BREAKFAST: '#fb923c', SALADS: '#22c55e',
  COOKIES: '#d97706', BUILD: '#64748b', PROMOS: '#e879f9', LOYALTY: '#f59e0b',
};

// ─── Function keys ────────────────────────────────────────────────────────────
const FKEYS = [
  { key: 'F1',  label: 'HOLD',     icon: '⏸', color: C.gold },
  { key: 'F2',  label: 'CANCEL',   icon: '✕',  color: C.accent },
  { key: 'F3',  label: 'DISCOUNT', icon: '%',   color: C.purple },
  { key: 'F4',  label: 'CUSTOMER', icon: '👤', color: C.blue },
  { key: 'F5',  label: 'MODIFY',   icon: '✏️', color: '#06b6d4' },
  { key: 'F6',  label: 'PRINT',    icon: '🖨',  color: '#64748b' },
  { key: 'F7',  label: 'SPLIT',    icon: '⊣⊢', color: '#f97316' },
  { key: 'F8',  label: 'GIFT',     icon: '🎁', color: '#ec4899' },
  { key: 'F9',  label: 'VOID',     icon: '⊘',  color: '#dc2626' },
  { key: 'F10', label: 'COUPON',   icon: '🎟', color: '#d97706' },
  { key: 'F11', label: 'LOYALTY',  icon: '⭐', color: C.gold },
  { key: 'F12', label: 'CHECKOUT', icon: '⚡', color: C.green },
];

const MODIFIERS = {
  size:     ['Small', 'Medium', 'Large', 'X-Large'],
  spice:    ['Mild', 'Medium', 'Hot', 'Extra Hot'],
  toppings: ['Cheese', 'Bacon', 'Tomato', 'Lettuce', 'Onions', 'Pepperoni'],
  sauces:   ['Ketchup', 'BBQ', 'Ranch', 'Honey Mustard', 'Hot Sauce'],
  drinks:   ['Coke', 'Diet Coke', 'Pepsi', 'Sprite', 'Fanta'],
};

const COUPONS = [
  { id: 'BOGO',     label: 'BOGO FREE', discount: 0.5 },
  { id: '20OFF',    label: '20% OFF',   discount: 0.2 },
  { id: 'FREEDRINK',label: 'FREE DRINK',discount: 0.15 },
  { id: '5OFF',     label: '₹50 OFF',   discount: 0.08 },
];

const DEMO_CUSTOMER = {
  name: 'RAHUL SHARMA', phone: '+91 98765 43210',
  points: 1245, tier: 'GOLD', visits: 15, totalSpent: 12450,
};

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ children, color = C.accent, style = {} }) {
  return (
    <span style={{
      background: `${color}22`, color,
      border: `1px solid ${color}40`,
      borderRadius: 10, fontSize: 9, fontWeight: 800,
      padding: '2px 7px', letterSpacing: 0.5, ...style,
    }}>{children}</span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FastFoodOrdersComprehensive() {
  const [selectedOrderType, setSelectedOrderType] = useState('DT1');
  const [selectedCategory, setSelectedCategory]   = useState('BURGERS');
  const [currentOrder, setCurrentOrder]           = useState([]);
  const [selectedCustomer, setSelectedCustomer]   = useState(null);
  const [appliedCoupon, setAppliedCoupon]         = useState(null);
  const [showModifiers, setShowModifiers]         = useState(false);
  const [selectedItem, setSelectedItem]           = useState(null);
  const [paymentMethod, setPaymentMethod]         = useState('cash');
  const [orderNo, setOrderNo]                     = useState(2847);
  const [ripple, setRipple]                       = useState(null);
  const [pressedFKey, setPressedFKey]             = useState(null);
  const [time, setTime]                           = useState(new Date());
  const [alertDialog, setAlertDialog]             = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showAlert = (title, message, type = 'info') =>
    setAlertDialog({ isOpen: true, title, message, type });

  // ─── Totals ───────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal  = currentOrder.reduce((s, i) => s + i.price * i.qty, 0);
    const tax       = subtotal * 0.05;
    const discount  = appliedCoupon ? subtotal * appliedCoupon.discount : 0;
    const delivery  = selectedOrderType === 'DELIVERY' ? 50 : 0;
    const total     = subtotal + tax - discount + delivery;
    return { subtotal, tax, discount, delivery, total };
  }, [currentOrder, appliedCoupon, selectedOrderType]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const addToOrder = (product) => {
    setCurrentOrder(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1, modifiers: [] }];
    });
    setRipple(product.id);
    setTimeout(() => setRipple(null), 300);
    setSelectedItem(product);
    setShowModifiers(true);
  };

  const changeQty = (id, delta) => {
    setCurrentOrder(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
      return updated;
    });
  };

  const addModifier = (mod) => {
    if (!selectedItem) return;
    setCurrentOrder(prev => prev.map(i =>
      i.id === selectedItem.id ? { ...i, modifiers: [...(i.modifiers || []), mod] } : i
    ));
  };

  const handleFKey = (key) => {
    setPressedFKey(key);
    setTimeout(() => setPressedFKey(null), 150);
    switch (key) {
      case 'F2': setCurrentOrder([]); setAppliedCoupon(null); break;
      case 'F3': setAppliedCoupon(COUPONS[0]); showAlert('Coupon Applied', 'BOGO FREE applied!', 'success'); break;
      case 'F4': setSelectedCustomer(DEMO_CUSTOMER); showAlert('Customer Loaded', `${DEMO_CUSTOMER.name} — ${DEMO_CUSTOMER.points} pts`, 'info'); break;
      case 'F9': setCurrentOrder([]); break;
      case 'F10': setAppliedCoupon(COUPONS[1]); showAlert('Coupon Applied', '20% OFF applied!', 'success'); break;
      case 'F11': setSelectedCustomer(DEMO_CUSTOMER); break;
      case 'F12': handleCheckout(); break;
      default: break;
    }
  };

  const handleCheckout = () => {
    if (currentOrder.length === 0) { showAlert('Empty Order', 'Add items first.', 'warning'); return; }
    showAlert('Order Placed! 🎉', `₹${totals.total.toFixed(0)} via ${paymentMethod.toUpperCase()} • Order #${orderNo + 1}`, 'success');
    setCurrentOrder([]);
    setAppliedCoupon(null);
    setSelectedCustomer(null);
    setOrderNo(n => n + 1);
  };

  const filteredProducts = PRODUCTS.filter(p => p.category === selectedCategory);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100%',
      background: C.bg, color: C.text,
      fontFamily: C.font,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontSize: 13,
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(90deg, #0f0f14, #1a1a24, #0f0f14)`,
        borderBottom: `2px solid ${C.accent}`,
        padding: '0 16px', height: 46,
        display: 'flex', alignItems: 'center', gap: 16,
        flexShrink: 0,
        boxShadow: `0 2px 20px rgba(230,57,70,0.25)`,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg, ${C.accent}, #C1121F)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, boxShadow: `0 0 10px rgba(230,57,70,0.5)`,
          }}>🍔</div>
          <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>SUPER FAST FOOD POS</span>
          <Pill color={C.accent}>v8.0</Pill>
        </div>

        <div style={{ width: 1, height: 24, background: C.border2 }} />

        {/* Order type quick badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill color={C.gold}>ORDER #{orderNo}</Pill>
          <Pill color={ORDER_TYPES.find(t => t.id === selectedOrderType)?.status === 'urgent' ? C.accent : C.green}>
            {ORDER_TYPES.find(t => t.id === selectedOrderType)?.label}
          </Pill>
        </div>

        {selectedCustomer && (
          <>
            <div style={{ width: 1, height: 24, background: C.border2 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.text2 }}>👤</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{selectedCustomer.name}</span>
              <Pill color={C.gold}>⭐ {selectedCustomer.tier}</Pill>
              <Pill color={C.purple}>{selectedCustomer.points} PTS</Pill>
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
          <span style={{ fontSize: 11, color: C.text2 }}>ONLINE</span>
        </div>
        <div style={{ width: 1, height: 24, background: C.border2 }} />
        <span style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
        <div style={{ width: 1, height: 24, background: C.border2 }} />
        <Pill color={C.blue}>🏪 STORE #001</Pill>
      </div>

      {/* ── Order Type Tabs ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 10px',
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, overflowX: 'auto',
      }}>
        {ORDER_TYPES.map(ot => {
          const active = selectedOrderType === ot.id;
          return (
            <button key={ot.id} onClick={() => setSelectedOrderType(ot.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 1, padding: '6px 12px', borderRadius: 8, flexShrink: 0,
              background: active ? `linear-gradient(135deg, ${C.accent}, #C1121F)` : C.surface2,
              border: `1px solid ${active ? C.accent : C.border}`,
              color: active ? '#fff' : C.text2,
              cursor: 'pointer', transition: 'all 0.15s ease',
              boxShadow: active ? `0 2px 10px rgba(230,57,70,0.3)` : 'none',
            }}>
              <div style={{ fontSize: 16 }}>{ot.icon}</div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{ot.label}</div>
              {ot.count > 0 && (
                <div style={{
                  background: active ? 'rgba(255,255,255,0.25)' : (ot.status === 'urgent' ? C.accent : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 9, fontWeight: 900,
                  padding: '0 5px', borderRadius: 6, minWidth: 18, textAlign: 'center',
                }}>{ot.count}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Category Bar ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, padding: '5px 10px',
        background: C.surface2, borderBottom: `1px solid ${C.border}`,
        overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const active = selectedCategory === cat.id;
          const col = CAT_COLORS[cat.id] || C.accent;
          return (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
              padding: '5px 12px', borderRadius: 20, flexShrink: 0,
              background: active ? col : 'transparent',
              border: `1px solid ${active ? col : C.border}`,
              color: active ? '#fff' : C.text2,
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              letterSpacing: 0.3, whiteSpace: 'nowrap',
              boxShadow: active ? `0 2px 8px ${col}50` : 'none',
              transition: 'all 0.12s ease',
            }}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main 2-column ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Product grid ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10, minWidth: 0 }}>
          {filteredProducts.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.text3, fontSize: 14 }}>
              No items in this category
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}>
              {filteredProducts.map(product => {
                const col = CAT_COLORS[product.category] || C.accent;
                const inCart = currentOrder.find(i => i.id === product.id);
                const isRippling = ripple === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => addToOrder(product)}
                    style={{
                      height: 128, borderRadius: 12,
                      background: `linear-gradient(145deg, ${col}22, ${col}0a)`,
                      border: `1px solid ${inCart ? col : col + '30'}`,
                      padding: '10px 8px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      transition: 'all 0.12s ease',
                      transform: isRippling ? 'scale(0.94)' : 'scale(1)',
                      boxShadow: isRippling
                        ? `0 0 0 3px ${col}60`
                        : inCart ? `0 3px 12px ${col}40` : `0 2px 6px rgba(0,0,0,0.3)`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                      e.currentTarget.style.boxShadow = `0 8px 20px ${col}40, 0 0 0 1px ${col}50`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = inCart ? `0 3px 12px ${col}40` : '0 2px 6px rgba(0,0,0,0.3)';
                    }}
                  >
                    {/* Top accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: col, borderRadius: '12px 12px 0 0' }} />

                    {/* Cart badge */}
                    {inCart && (
                      <div style={{
                        position: 'absolute', top: 7, right: 7,
                        width: 18, height: 18, borderRadius: '50%',
                        background: col, color: '#fff',
                        fontSize: 10, fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 6px ${col}`,
                      }}>{inCart.qty}</div>
                    )}

                    <div style={{ fontSize: 30, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}>{product.icon}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: C.text,
                      textAlign: 'center', lineHeight: 1.25,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{product.name}</div>
                    <div style={{
                      background: col, color: '#fff',
                      fontSize: 12, fontWeight: 900,
                      padding: '3px 10px', borderRadius: 16,
                      boxShadow: `0 2px 6px ${col}60`,
                    }}>₹{product.price}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Order panel ─────────────────────────────────────────── */}
        <div style={{
          width: 280, minWidth: 260,
          background: C.surface,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Order header */}
          <div style={{
            padding: '10px 14px',
            background: `linear-gradient(90deg, ${C.accent}, #C1121F)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: 0.5 }}>
              ORDER #{orderNo}
            </div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              {ORDER_TYPES.find(t => t.id === selectedOrderType)?.label}
            </div>
            {currentOrder.length > 0 && (
              <button
                onClick={() => setCurrentOrder([])}
                style={{
                  fontSize: 9, fontWeight: 800, color: C.accent,
                  background: 'rgba(255,255,255,0.9)', border: 'none',
                  borderRadius: 4, padding: '2px 7px', cursor: 'pointer',
                }}
              >CLR</button>
            )}
          </div>

          {/* Customer strip */}
          {selectedCustomer && (
            <div style={{
              padding: '7px 14px',
              background: `${C.gold}15`,
              borderBottom: `1px solid ${C.gold}30`,
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontSize: 12 }}>⭐</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: 9, color: C.text2 }}>{selectedCustomer.points} pts · {selectedCustomer.tier}</div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 12 }}
              >✕</button>
            </div>
          )}

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 64px 56px',
            padding: '5px 14px', gap: 4,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            {['ITEM', 'QTY', 'AMT'].map(h => (
              <div key={h} style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {/* Order items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {currentOrder.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 8, color: C.text3,
              }}>
                <span style={{ fontSize: 32 }}>🛒</span>
                <span style={{ fontSize: 12 }}>Tap items to add</span>
              </div>
            ) : (
              currentOrder.map((item, idx) => (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '1fr 64px 56px',
                  alignItems: 'center', gap: 4,
                  padding: '7px 6px', borderRadius: 7, marginBottom: 3,
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.name}</div>
                    {item.modifiers?.length > 0 && (
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>
                        {item.modifiers.slice(0, 2).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: C.text3 }}>₹{item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >−</button>
                    <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10b981', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >+</button>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, textAlign: 'right', color: CAT_COLORS[item.category] || C.text }}>
                    ₹{(item.price * item.qty).toFixed(0)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modifiers panel */}
          {showModifiers && selectedItem && (
            <div style={{
              padding: '8px 10px',
              background: C.surface3,
              borderTop: `1px solid ${C.border}`,
              maxHeight: 140, overflowY: 'auto',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.text2 }}>MODIFIERS — {selectedItem.name}</span>
                <button
                  onClick={() => { setShowModifiers(false); setSelectedItem(null); }}
                  style={{
                    background: C.green, color: '#fff', border: 'none',
                    borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  }}
                >✓ DONE</button>
              </div>
              {Object.entries(MODIFIERS).map(([section, opts]) => (
                <div key={section} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
                    {section}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {opts.map(opt => (
                      <button key={opt} onClick={() => addModifier(opt)} style={{
                        padding: '3px 9px', fontSize: 9, fontWeight: 700,
                        background: C.surface2, border: `1px solid ${C.border2}`,
                        borderRadius: 4, color: C.text2, cursor: 'pointer',
                      }}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Function keys */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 3, padding: '5px 8px',
            background: C.surface2,
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            {FKEYS.map(fk => {
              const pressed = pressedFKey === fk.key;
              return (
                <button key={fk.key} onClick={() => handleFKey(fk.key)} style={{
                  padding: '5px 2px', borderRadius: 5,
                  background: pressed ? `${fk.color}40` : `${fk.color}12`,
                  border: `1px solid ${fk.color}30`,
                  color: fk.color, cursor: 'pointer',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  transition: 'all 0.1s', transform: pressed ? 'scale(0.92)' : 'scale(1)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: fk.color, borderRadius: '5px 5px 0 0' }} />
                  <span style={{ fontSize: 11 }}>{fk.icon}</span>
                  <span style={{ fontSize: 7, letterSpacing: 0.3, lineHeight: 1 }}>{fk.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coupon strip */}
          {appliedCoupon && (
            <div style={{
              padding: '5px 12px',
              background: `${C.gold}15`,
              borderTop: `1px solid ${C.gold}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>🎟 {appliedCoupon.label}</span>
              <button
                onClick={() => setAppliedCoupon(null)}
                style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 11 }}
              >✕</button>
            </div>
          )}

          {/* Totals */}
          <div style={{
            padding: '8px 14px',
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
            background: C.surface2,
          }}>
            {[
              { label: 'SUBTOTAL', val: totals.subtotal },
              { label: 'GST (5%)', val: totals.tax },
              totals.discount > 0 && { label: 'DISCOUNT', val: -totals.discount, color: C.green },
              totals.delivery > 0 && { label: 'DELIVERY', val: totals.delivery },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 3, fontSize: 10, fontWeight: 700,
                color: row.color || C.text2,
              }}>
                <span>{row.label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.val < 0 ? '-' : ''}₹{Math.abs(row.val).toFixed(0)}
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 6, marginTop: 4,
              borderTop: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900 }}>DUE</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
                ₹{totals.total.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{
            padding: '8px',
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            flexShrink: 0,
          }}>
            <PaymentMethodSelector
              methods={['cash', 'gpay', 'phonepay', 'upi', 'razorpay', 'paytm']}
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              size="compact"
              columns={3}
            />
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            style={{
              margin: '0 8px 8px',
              padding: '13px 0', borderRadius: 10,
              background: currentOrder.length > 0
                ? `linear-gradient(135deg, ${C.accent}, #C1121F)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${currentOrder.length > 0 ? C.accent : C.border}`,
              color: currentOrder.length > 0 ? '#fff' : C.text3,
              fontSize: 14, fontWeight: 900, cursor: currentOrder.length > 0 ? 'pointer' : 'default',
              letterSpacing: 1, transition: 'all 0.18s ease',
              boxShadow: currentOrder.length > 0 ? `0 4px 16px rgba(230,57,70,0.4)` : 'none',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (currentOrder.length > 0) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(230,57,70,0.5)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = currentOrder.length > 0 ? '0 4px 16px rgba(230,57,70,0.4)' : 'none'; }}
          >
            {currentOrder.length > 0 ? `⚡ CHARGE  ₹${totals.total.toFixed(0)}` : 'Add items to charge'}
          </button>
        </div>
      </div>

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
