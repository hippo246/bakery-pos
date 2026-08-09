/**
 * OrderTypePanel.jsx
 * Order type selector + table picker / customer details / platform ID.
 *
 * UX improvements over the original:
 * - Order type buttons are larger with icons and clearer active state
 * - Table picker is now visual chips grouped by status, not a plain <select>
 * - Available tables are shown first with green badges; occupied tables are
 *   dimmed so staff immediately know what's free
 * - Delivery / platform fields have better labels and inline validation hints
 */
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C, input } from '../../styles/theme';

const ORDER_TYPE_OPTIONS = [
  { id: 'DINE_IN',          icon: '🪑', label: 'Dine In',    short: 'Dine'     },
  { id: 'TAKEAWAY',         icon: '🥡', label: 'Takeaway',   short: 'Take'     },
  { id: 'DIRECT_DELIVERY',  icon: '🛵', label: 'Delivery',   short: 'Delivery' },
  { id: 'SWIGGY',           icon: '🟠', label: 'Swiggy',     short: 'Swiggy'   },
  { id: 'ZOMATO',           icon: '🔴', label: 'Zomato',     short: 'Zomato'   },
];

// Status → display properties for table chips
const TABLE_STATUS_META = {
  available:          { label: 'Free',    color: '#22c55e', bg: '#052e16', border: '#16a34a', priority: 0 },
  reserved:           { label: 'Rsvd',   color: '#f59e0b', bg: '#1c0a00', border: '#92400e', priority: 1 },
  occupied:           { label: 'In use', color: '#ef4444', bg: '#1c0606', border: '#991b1b', priority: 2 },
  ordering:           { label: 'Order',  color: '#8b5cf6', bg: '#1e1030', border: '#6d28d9', priority: 2 },
  dining:             { label: 'Dining', color: '#64748b', bg: '#0f172a', border: '#334155', priority: 2 },
  bill_requested:     { label: 'Bill!',  color: '#ec4899', bg: '#1c0614', border: '#9d174d', priority: 1 },
  cleaning:           { label: 'Clean',  color: '#6366f1', bg: '#10102a', border: '#4338ca', priority: 1 },
  billed:             { label: 'Billed', color: '#3b82f6', bg: '#0c1929', border: '#1d4ed8', priority: 1 },
};

function getTableMeta(status = '') {
  const key = status.toLowerCase().replace(/ /g, '_');
  return TABLE_STATUS_META[key] || { label: status || '?', color: '#94a3b8', bg: '#0f172a', border: '#334155', priority: 3 };
}

const OrderTypePanel = ({
  orderType,
  onOrderTypeChange,
  selectedTable,
  onTableSelect,
  availableTables,
  customerPhone,
  onCustomerPhoneChange,
  customerAddress,
  onCustomerAddressChange,
  platformOrderId,
  onPlatformOrderIdChange,
}) => {
  // Sort tables: free first, then by number
  const sortedTables = [...(availableTables || [])].sort((a, b) => {
    const pa = getTableMeta(a.status).priority;
    const pb = getTableMeta(b.status).priority;
    if (pa !== pb) return pa - pb;
    return (a.number || 0) - (b.number || 0);
  });

  const freeCount = sortedTables.filter(t => {
    const status = (t.status || '').toLowerCase();
    return status === 'available' || status === 'vacant';
  }).length;

  return (
    <div>
      {/* ── Order type row ─────────────────────────────────────────────── */}
      <div className="pos-order-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {ORDER_TYPE_OPTIONS.map(({ id, icon, label }) => {
          const active = orderType === id;
          return (
            <button
              key={id}
              className="pos-order-type-btn"
              onClick={() => onOrderTypeChange(id)}
              style={{
                padding: '12px 6px',
                borderRadius: 12,
                border: `2px solid ${active ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`,
                background: active ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                color: active ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'all .2s',
                boxShadow: active ? `0 4px 16px rgba(99,102,241,0.3)` : 'none',
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
            >
              <span className="pos-order-type-icon" style={{ fontSize: 20 }}>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Dine-in: visual table chips ────────────────────────────────── */}
      {orderType === 'DINE_IN' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cafe-text-tertiary)' }}>
              Select Table
            </span>
            <span style={{ fontSize: 12, color: freeCount > 0 ? '#22c55e' : 'var(--cafe-text-tertiary)', fontWeight: 700 }}>
              {freeCount} free
            </span>
          </div>

          {sortedTables.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--cafe-text-tertiary)', fontSize: 13, background: 'var(--cafe-bg-surface)', borderRadius: 12 }}>
              No tables configured yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sortedTables.map(table => {
                const meta = getTableMeta(table.status);
                const isSelected = selectedTable === table.id;
                const status = (table.status || '').toLowerCase();
                const isFree = status === 'available' || status === 'vacant';

                return (
                  <button
                    key={table.id}
                    className="pos-table-chip"
                    onClick={() => onTableSelect(isSelected ? null : table.id)}
                    title={`Table ${table.number} · ${table.capacity || table.seats || 4} seats · ${table.status || 'available'}`}
                    style={{
                      minWidth: 56,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `2px solid ${isSelected ? 'var(--cafe-accent)' : meta.border}`,
                      background: isSelected ? 'var(--cafe-accent-bg)' : meta.bg,
                      color: isSelected ? 'var(--cafe-accent)' : meta.color,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all .2s',
                      boxShadow: isSelected ? `0 4px 16px rgba(99,102,241,0.3)` : 'none',
                      opacity: (!isFree && !isSelected) ? 0.65 : 1,
                    }}
                    onMouseOver={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; } }}
                    onMouseOut={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                      {table.number}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
                      {isSelected ? '✓ Sel' : meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: isSelected ? 'var(--cafe-accent)' : meta.color, opacity: 0.7 }}>
                      {table.capacity || table.seats || 4}p
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTable && (() => {
            const t = sortedTables.find(t => t.id === selectedTable);
            return t ? (
              <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--cafe-accent-bg)', border: `1px solid var(--cafe-accent)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--cafe-accent)', fontWeight: 700 }}>
                  🪑 Table {t.number} · {t.capacity || t.seats || 4} seats
                </span>
                <button
                  onClick={() => onTableSelect(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--cafe-accent)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                >×</button>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Delivery: phone + address ──────────────────────────────────── */}
      {orderType === 'DIRECT_DELIVERY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
              Customer Phone <span style={{ color: 'var(--cafe-danger)' }}>*</span>
            </div>
            <input
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 14, outline: 'none', transition: 'all 0.2s' }}
              type="tel"
              inputMode="numeric"
              value={customerPhone}
              onChange={e => onCustomerPhoneChange(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
              Delivery Address <span style={{ color: 'var(--cafe-danger)' }}>*</span>
            </div>
            <input
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 14, outline: 'none', transition: 'all 0.2s' }}
              value={customerAddress}
              onChange={e => onCustomerAddressChange(e.target.value)}
              placeholder="Street, area, landmark…"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
            />
          </div>
        </div>
      )}

      {/* ── Swiggy / Zomato: platform order ID ────────────────────────── */}
      {(orderType === 'SWIGGY' || orderType === 'ZOMATO') && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
            {orderType === 'SWIGGY' ? '🟠 Swiggy' : '🔴 Zomato'} Order ID <span style={{ color: 'var(--cafe-danger)' }}>*</span>
          </div>
          <input
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 14, outline: 'none', transition: 'all 0.2s' }}
            value={platformOrderId}
            onChange={e => onPlatformOrderIdChange(e.target.value)}
            placeholder={`Paste the ${orderType === 'SWIGGY' ? 'Swiggy' : 'Zomato'} order number`}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
          />
        </div>
      )}
    </div>
  );
};

export default OrderTypePanel;
