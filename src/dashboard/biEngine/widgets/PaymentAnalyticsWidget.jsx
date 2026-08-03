/**
 * Payment Analytics Widget
 * Displays payment breakdown and performance metrics
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function PaymentAnalyticsWidget({ instance, settings }) {
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    upi: 0,
    card: 0,
    split: 0,
    refunds: 0,
    failed: 0,
    averageTransactionTime: 0,
    successRate: 0,
    distribution: { cash: 0, upi: 0, card: 0 }
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchPaymentData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculatePaymentAnalytics(liveData);

      setPaymentData(analytics);
      setLastUpdate(Date.now());
    };

    fetchPaymentData();
    const interval = setInterval(fetchPaymentData, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Payment Analytics
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: paymentData.successRate > 95 ? 'var(--cafe-success-bg)' : 'var(--cafe-warning-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: paymentData.successRate > 95 ? 'var(--cafe-success)' : 'var(--cafe-warning)'
        }}>
          {paymentData.successRate}% Success
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
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {paymentData.cash}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>UPI</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {paymentData.upi}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Card</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {paymentData.card}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Split</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {paymentData.split}
          </div>
        </div>
      </div>

      {/* Issues */}
      {(paymentData.refunds > 0 || paymentData.failed > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {paymentData.refunds > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-warning-bg)', 
              border: '1px solid var(--cafe-warning-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Refunds</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
                {paymentData.refunds}
              </div>
            </div>
          )}
          {paymentData.failed > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Failed</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
                {paymentData.failed}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Transaction Time</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {paymentData.averageTransactionTime}s
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Success Rate</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: paymentData.successRate > 95 ? 'var(--cafe-success)' : 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {paymentData.successRate}%
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Payment Distribution
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
              {paymentData.distribution.cash}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Cash</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
              {paymentData.distribution.upi}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>UPI</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
              {paymentData.distribution.card}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Card</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PaymentAnalyticsWidget);
