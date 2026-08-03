/**
 * Live Order Widget
 * Displays real-time order statistics and status
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';
import { OrderEvents } from '../EventTypes.js';

function LiveOrderWidget({ instance, settings }) {
  const [orderData, setOrderData] = useState({
    new: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0,
    delayed: 0,
    avgPrepTime: 0,
    avgDeliveryTime: 0,
    peakQueueSize: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Subscribe to order data updates
    const unsubscribe = liveOperationsEngine.subscribe('orders', (data) => {
      setOrderData(prev => {
        // Check if data changed to trigger animation
        const changed = JSON.stringify(prev) !== JSON.stringify(data);
        if (changed) {
          setAnimate(true);
          setTimeout(() => setAnimate(false), 500);
        }
        return data;
      });
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const StatCard = ({ label, value, color, onClick }) => (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        background: 'var(--cafe-bg-surface)',
        border: '1px solid var(--cafe-border)',
        borderRadius: 8,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...(onClick ? { ':hover': { borderColor: 'var(--cafe-accent)' } } : {})
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        color: color || 'var(--cafe-text-primary)',
        fontFamily: 'monospace',
        marginTop: 4,
        transition: animate ? 'transform 0.2s' : 'none',
        transform: animate ? 'scale(1.1)' : 'scale(1)'
      }}>
        {value}
      </div>
    </div>
  );

  const totalActive = orderData.new + orderData.accepted + orderData.preparing + orderData.ready;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Live Orders
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: totalActive > 20 ? 'var(--cafe-warning-bg)' : 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: totalActive > 20 ? 'var(--cafe-warning)' : 'var(--cafe-success)'
        }}>
          {totalActive} Active
        </div>
      </div>

      {/* Active Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatCard label="New" value={orderData.new} color="var(--cafe-info)" />
        <StatCard label="Accepted" value={orderData.accepted} color="var(--cafe-accent)" />
        <StatCard label="Preparing" value={orderData.preparing} color="var(--cafe-warning)" />
        <StatCard label="Ready" value={orderData.ready} color="var(--cafe-success)" />
      </div>

      {/* Completed & Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatCard label="Served" value={orderData.served} color="var(--cafe-success)" />
        <StatCard label="Completed" value={orderData.completed} color="var(--cafe-text-secondary)" />
        <StatCard label="Delayed" value={orderData.delayed} color="var(--cafe-danger)" />
      </div>

      {/* Metrics */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Prep Time</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.avgPrepTime}m
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Delivery</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.avgDeliveryTime}m
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Peak Queue</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.peakQueueSize}
          </div>
        </div>
      </div>

      {/* Cancelled */}
      {orderData.cancelled > 0 && (
        <div style={{ 
          padding: 8, 
          background: 'var(--cafe-danger-bg)', 
          border: '1px solid var(--cafe-danger-border)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--ca-danger)',
          textAlign: 'center'
        }}>
          {orderData.cancelled} Cancelled
        </div>
      )}
    </div>
  );
}

export default memo(LiveOrderWidget);
