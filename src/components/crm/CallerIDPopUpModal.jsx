import React from 'react';

export default function CallerIDPopUpModal({ caller, isOpen, onClose, onAcceptCall }) {
  if (!isOpen || !caller) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '360px',
      backgroundColor: '#0f172a',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      padding: '16px',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 1300,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📞</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>Incoming Call (PBX Line 1)</span>
        </div>
        <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>✕</button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>{caller.name || 'Unknown Customer'}</h4>
        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{caller.phone || '+91 9876543210'}</div>
        {caller.address && <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>📍 {caller.address}</div>}
      </div>

      {/* Past Order History snippet */}
      <div style={{ backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', marginBottom: '12px' }}>
        <div style={{ color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>LAST RECENT ORDER:</div>
        <div style={{ color: '#e2e8f0' }}>2x Tiramisu, 1x Cappuccino (₹680.00)</div>
        <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>Ordered 3 days ago</div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Ignore</button>
        <button onClick={() => { onAcceptCall(caller); onClose(); }} style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Accept & Create Order</button>
      </div>
    </div>
  );
}
