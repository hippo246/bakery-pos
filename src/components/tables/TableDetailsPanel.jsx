import React, { useMemo, useEffect, useState } from 'react';
import { C, btn } from "../../styles/theme";

export default function TableDetailsPanel({ 
  isOpen, 
  onClose, 
  table, 
  orders = [], 
  kdsCards = [], 
  staff = [], 
  history = [],
  onOpenPOS,
  onViewKitchen
}) {

  // Close on Escape, and lock background scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  // Keep "Duration" ticking live while the panel is open
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const activeOrder = useMemo(() => {
    const orderId = table?.currentOrderId || table?.currentOrder;
    if (!table || !orderId) return null;
    return orders.find(o => o.id === orderId) || null;
  }, [table, orders]);

  const activeKdsCards = useMemo(() => {
    if (!activeOrder) return [];
    return kdsCards.filter(c => c.orderId === activeOrder.id);
  }, [activeOrder, kdsCards]);

  const tableHistory = useMemo(() => {
    if (!table) return [];
    return history
      .filter(h => h.tableId === table.id)
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [table, history]);

  const assignedWaiter = useMemo(() => {
    if (!table || !table.waiterId) return null;
    return staff.find(s => s.id === table.waiterId) || table.waiter;
  }, [table, staff]);

  if (!isOpen || !table) return null;

  const isOccupied = table.status === 'occupied' || table.status === 'reserved';
  const tableColor = table.status === 'occupied' ? 'var(--cafe-accent)' : table.status === 'reserved' ? 'var(--cafe-info)' : table.status === 'cleaning' ? 'var(--cafe-purple)' : 'var(--cafe-success)';

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOccupancyDuration = () => {
    if (!table.occupiedAt && !table.occupiedSince) return '-';
    const start = new Date(table.occupiedAt || table.occupiedSince).getTime();
    if (isNaN(start)) return '-';
    const diff = Math.max(0, Math.floor((now - start) / 60000));
    return `${diff} Min`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Centered Modal */}
        <div 
          onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-details-heading"
          style={{
          width: '500px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          background: 'var(--cafe-bg-surface)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          borderRadius: 20,
          zIndex: 10000,
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          opacity: isOpen ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>

        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-card)', position: 'relative' }}>
          <button 
            onClick={onClose}
            aria-label="Close table details"
            style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', fontSize: 24, color: 'var(--cafe-text-tertiary)', cursor: 'pointer' }}
          >×</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#fff',
              background: `linear-gradient(135deg, ${tableColor} 0%, #222 100%)`
            }}>
              {table.number}
            </div>
            <div>
              <div id="table-details-heading" style={{ fontSize: 'var(--cafe-font-xl)', fontWeight: 800, color: 'var(--cafe-text-primary)' }}>Table {table.number}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--cafe-font-xs)', textTransform: 'uppercase', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: tableColor, color: '#fff' }}>
                  {table.status}
                </span>
                <span style={{ fontSize: 'var(--cafe-font-sm)', color: 'var(--cafe-text-secondary)' }}>
                  {activeOrder?.partySize ? `${activeOrder.partySize} Guests` : `${table.capacity} Seats`}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', marginTop: 20, gap: 16, paddingTop: 16, borderTop: '1px solid var(--cafe-border-light)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Waiter</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
                {assignedWaiter ? assignedWaiter.name : 'None'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
                {isOccupied ? getOccupancyDuration() : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Active Order Section */}
          {activeOrder ? (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 'var(--cafe-font-md)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Order</span>
                <span style={{ color: 'var(--cafe-accent)' }}>₹{activeOrder.total?.toFixed(2) || '0.00'}</span>
              </h3>
              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Invoice: {activeOrder.invoiceNo || activeOrder.id?.slice(-6) || '—'}</span>
                  <span>{activeOrder.items?.length || 0} Items</span>
                </div>
                
                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeOrder.items?.slice(0, 4).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--cafe-text-secondary)' }}>{item.qty}x {item.name}</span>
                      <span style={{ fontWeight: 600 }}>₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  {activeOrder.items?.length > 4 && (
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', textAlign: 'center', marginTop: 4 }}>
                      + {activeOrder.items.length - 4} more items
                    </div>
                  )}
                </div>
                
                {/* Kitchen Status */}
                {activeKdsCards.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--cafe-border-light)' }}>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 8, fontWeight: 600 }}>KITCHEN STATUS</div>
                    {activeKdsCards.map(kds => (
                      <div key={kds.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>Ticket #{kds.id?.slice(-4) || '—'}</span>
                        <span style={{ 
                          color: kds.status === 'READY' ? 'var(--cafe-success)' : kds.status === 'PREPARING' ? 'var(--cafe-accent)' : 'var(--cafe-text-tertiary)',
                          fontWeight: 600 
                        }}>
                          {kds.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            isOccupied && (
              <div style={{ marginBottom: 32, padding: 16, background: 'var(--cafe-bg-card)', borderRadius: 12, border: '1px dashed var(--cafe-border-light)', textAlign: 'center', color: 'var(--cafe-text-tertiary)' }}>
                No active order linked to this table yet.
              </div>
            )
          )}

          {/* History Timeline */}
          <div>
            <h3 style={{ fontSize: 'var(--cafe-font-md)', marginBottom: 16 }}>Today's History</h3>
            {tableHistory.length === 0 ? (
              <div style={{ color: 'var(--cafe-text-tertiary)', fontSize: 14, fontStyle: 'italic' }}>No activity today.</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 16 }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 2, background: 'var(--cafe-border-light)' }} />
                
                {tableHistory.map((h, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                    {/* Dot */}
                    <div style={{ 
                      position: 'absolute', left: -21, top: 4, width: 12, height: 12, borderRadius: '50%',
                      background: 'var(--cafe-bg-surface)', border: '2px solid var(--cafe-border)',
                      zIndex: 2
                    }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-secondary)' }}>{h.event}</div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>{formatTime(h.at)}</div>
                    {h.detail && (
                      <div style={{ fontSize: 13, color: 'var(--cafe-text-secondary)', marginTop: 4, background: 'var(--cafe-bg-card)', padding: '6px 10px', borderRadius: 6 }}>
                        {h.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-card)', display: 'flex', gap: 12 }}>
          {isOccupied && (
            <>
              <button
                style={{ ...btn('primary'), flex: 1 }}
                onClick={() => onOpenPOS?.(table, activeOrder)}
                disabled={!onOpenPOS}
              >
                Open POS
              </button>
              <button
                style={{ ...btn('ghost'), flex: 1, border: '1px solid var(--cafe-border)', opacity: activeKdsCards.length ? 1 : 0.5 }}
                onClick={() => onViewKitchen?.(table, activeOrder)}
                disabled={!onViewKitchen || activeKdsCards.length === 0}
              >
                View in Kitchen
              </button>
            </>
          )}
          {!isOccupied && (
            <button style={{ ...btn('primary'), flex: 1 }} onClick={onClose}>Done</button>
          )}
        </div>

      </div>
      </div>
    </>
  );
}
