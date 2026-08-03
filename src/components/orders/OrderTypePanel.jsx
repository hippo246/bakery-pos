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

  const freeCount = sortedTables.filter(t => (t.status || '').toLowerCase() === 'available').length;

  return (
    <div>
      {/* ── Order type row ─────────────────────────────────────────────── */}
      <div className="pos-order-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
        {ORDER_TYPE_OPTIONS.map(({ id, icon, label }) => {
          const active = orderType === id;
          return (
            <button
              key={id}
              className="pos-order-type-btn"
              onClick={() => onOrderTypeChange(id)}
              style={{
                padding: '10px 4px',
                borderRadius: 10,
                border: `2px solid ${active ? C.amber : C.border}`,
                background: active ? C.amberDim : C.bg3,
                color: active ? C.amber2 : C.text3,
                fontSize: 11,
                fontWeight: active ? 800 : 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all .14s',
                boxShadow: active ? `0 0 0 1px ${C.amber3}` : 'none',
              }}
            >
              <span className="pos-order-type-icon" style={{ fontSize: 18 }}>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Dine-in: visual table chips ────────────────────────────────── */}
      {orderType === 'DINE_IN' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3 }}>
              Select Table
            </span>
            <span style={{ fontSize: 11, color: freeCount > 0 ? '#22c55e' : C.text3, fontWeight: 600 }}>
              {freeCount} free
            </span>
          </div>

          {sortedTables.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: C.text3, fontSize: 12, background: C.bg3, borderRadius: 10 }}>
              No tables configured yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sortedTables.map(table => {
                const meta = getTableMeta(table.status);
                const isSelected = selectedTable === table.id;
                const isFree = (table.status || '').toLowerCase() === 'available';

                return (
                  <button
                    key={table.id}
                    className="pos-table-chip"
                    onClick={() => onTableSelect(isSelected ? null : table.id)}
                    title={`Table ${table.number} · ${table.capacity} seats · ${table.status || 'available'}`}
                    style={{
                      minWidth: 52,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? C.amber : meta.border}`,
                      background: isSelected ? C.amberDim : meta.bg,
                      color: isSelected ? C.amber2 : meta.color,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all .12s',
                      boxShadow: isSelected ? `0 0 0 1px ${C.amber3}` : 'none',
                      opacity: (!isFree && !isSelected) ? 0.65 : 1,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>
                      {table.number}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>
                      {isSelected ? '✓ Sel' : meta.label}
                    </span>
                    <span style={{ fontSize: 9, color: isSelected ? C.amber2 : meta.color, opacity: 0.7 }}>
                      {table.capacity}p
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTable && (() => {
            const t = sortedTables.find(t => t.id === selectedTable);
            return t ? (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: C.amberDim, border: `1px solid ${C.amber3}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.amber2, fontWeight: 700 }}>
                  🪑 Table {t.number} · {t.capacity} seats
                </span>
                <button
                  onClick={() => onTableSelect(null)}
                  style={{ background: 'none', border: 'none', color: C.amber2, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
                >×</button>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Delivery: phone + address ──────────────────────────────────── */}
      {orderType === 'DIRECT_DELIVERY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, marginBottom: 6 }}>
              Customer Phone <span style={{ color: C.red }}>*</span>
            </div>
            <input
              style={{ ...input, width: '100%' }}
              type="tel"
              inputMode="numeric"
              value={customerPhone}
              onChange={e => onCustomerPhoneChange(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, marginBottom: 6 }}>
              Delivery Address <span style={{ color: C.red }}>*</span>
            </div>
            <input
              style={{ ...input, width: '100%' }}
              value={customerAddress}
              onChange={e => onCustomerAddressChange(e.target.value)}
              placeholder="Street, area, landmark…"
            />
          </div>
        </div>
      )}

      {/* ── Swiggy / Zomato: platform order ID ────────────────────────── */}
      {(orderType === 'SWIGGY' || orderType === 'ZOMATO') && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, marginBottom: 6 }}>
            {orderType === 'SWIGGY' ? '🟠 Swiggy' : '🔴 Zomato'} Order ID <span style={{ color: C.red }}>*</span>
          </div>
          <input
            style={{ ...input, width: '100%' }}
            value={platformOrderId}
            onChange={e => onPlatformOrderIdChange(e.target.value)}
            placeholder={`Paste the ${orderType === 'SWIGGY' ? 'Swiggy' : 'Zomato'} order number`}
          />
        </div>
      )}
    </div>
  );
};

export default OrderTypePanel;
