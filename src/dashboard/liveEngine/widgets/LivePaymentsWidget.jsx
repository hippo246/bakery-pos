/**
 * Live Payments Widget
 * Displays real-time payment operations and status
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LivePaymentsWidget({ instance, settings }) {
  const [paymentsData, setPaymentsData] = useState({
    cash: 0,
    upi: 0,
    card: 0,
    split: 0,
    refunds: 0,
    pending: 0,
    failed: 0,
    avgProcessingTime: 0,
    totalToday: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('payments', (data) => {
      setPaymentsData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const issues = paymentsData.pending + paymentsData.failed;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Live Payments
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--cafe-success)'
        }}>
          ₹{paymentsData.totalToday.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Cash</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {paymentsData.cash}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>UPI</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {paymentsData.upi}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Card</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {paymentsData.card}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Split</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {paymentsData.split}
          </div>
        </div>
      </div>

      {/* Issues */}
      {issues > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {paymentsData.pending > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-warning-bg)', 
              border: '1px solid var(--cafe-warning-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Pending</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
                {paymentsData.pending}
              </div>
            </div>
          )}
          {paymentsData.failed > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Failed</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
                {paymentsData.failed}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refunds */}
      {paymentsData.refunds > 0 && (
        <div style={{ 
          padding: 8, 
          background: 'var(--cafe-danger-bg)', 
          border: '1px solid var(--cafe-danger-border)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--cafe-danger)',
          textAlign: 'center'
        }}>
          {paymentsData.refunds} Refund{paymentsData.refunds > 1 ? 's' : ''} Today
        </div>
      )}

      {/* Metrics */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Processing Time</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
          {paymentsData.avgProcessingTime}s
        </div>
      </div>
    </div>
  );
}

export default memo(LivePaymentsWidget);
