import React, { useState } from 'react';

export default function DriveThruQueueModal({ isOpen, onClose }) {
  const [vehicles, setVehicles] = useState([
    { id: 'DT-101', make: 'White Sedan (DL-01-AB)', stage: 'speaker', timerSec: 45, itemsCount: 4, total: '₹540.00' },
    { id: 'DT-102', make: 'Black SUV (MH-02-CD)', stage: 'payment', timerSec: 130, itemsCount: 2, total: '₹380.00' },
    { id: 'DT-103', make: 'Silver Hatchback (KA-03-EF)', stage: 'pickup', timerSec: 210, itemsCount: 6, total: '₹890.00' }
  ]);

  if (!isOpen) return null;

  const advanceStage = (vehId) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehId) {
        if (v.stage === 'speaker') return { ...v, stage: 'payment' };
        if (v.stage === 'payment') return { ...v, stage: 'pickup' };
        if (v.stage === 'pickup') return null; // Finished
      }
      return v;
    }).filter(Boolean));
  };

  const getStageColor = (stage) => {
    if (stage === 'speaker') return '#3b82f6';
    if (stage === 'payment') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1150
    }}>
      <div style={{
        width: '580px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>🚗 Drive-Thru Speed-of-Service Queue</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Live vehicle sensors & multi-window timers</span>
          </div>
          <button onClick={onClose} style={{ padding: '6px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕ Close</button>
        </div>

        {/* Speed Throughput Stats Banner */}
        <div style={{ display: 'flex', gap: '12px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Avg Speaker Timer</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>45s</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Avg Window Window</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>1m 20s</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cars Handled (Hr)</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>42 Cars</div>
          </div>
        </div>

        {/* Vehicle Queue Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              borderLeft: `5px solid ${getStageColor(v.stage)}`
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{v.id} - {v.make}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.itemsCount} items | {v.total}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{
                  backgroundColor: getStageColor(v.stage),
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  {v.stage} window
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: v.timerSec > 180 ? '#ef4444' : '#ffffff' }}>
                  🕒 {v.timerSec}s
                </span>
                <button
                  onClick={() => advanceStage(v.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Advance ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
