/**
 * Live Waiter Widget
 * Displays real-time waiter operations and assignments
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveWaiterWidget({ instance, settings }) {
  const [waiterData, setWaiterData] = useState({
    ordersAssigned: 0,
    ordersReady: 0,
    ordersServing: 0,
    billRequests: 0,
    assistanceRequests: 0,
    assignedTables: 0,
    completedDeliveries: 0,
    avgServiceTime: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('waiters', (data) => {
      setWaiterData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const urgentActions = waiterData.ordersReady + waiterData.billRequests + waiterData.assistanceRequests;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Waiter Operations
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {urgentActions > 0 && (
          <div style={{ 
            padding: '4px 12px', 
            background: 'var(--cafe-warning-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cafe-warning)'
          }}>
            {urgentActions} Actions
          </div>
        )}
      </div>

      {/* Action Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: waiterData.ordersReady > 0 ? 'var(--cafe-success-bg)' : 'var(--cafe-bg-surface)',
          border: waiterData.ordersReady > 0 ? '1px solid var(--cafe-success-border)' : '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Ready for Pickup</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {waiterData.ordersReady}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: waiterData.billRequests > 0 ? 'var(--cafe-warning-bg)' : 'var(--cafe-bg-surface)',
          border: waiterData.billRequests > 0 ? '1px solid var(--cafe-warning-border)' : '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Bill Requests</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {waiterData.billRequests}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: waiterData.assistanceRequests > 0 ? 'var(--cafe-danger-bg)' : 'var(--cafe-bg-surface)',
          border: waiterData.assistanceRequests > 0 ? '1px solid var(--cafe-danger-border)' : '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Assistance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
            {waiterData.assistanceRequests}
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Assigned</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {waiterData.ordersAssigned}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Serving</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {waiterData.ordersServing}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Tables</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {waiterData.assignedTables}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Completed</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {waiterData.completedDeliveries}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Service Time</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {waiterData.avgServiceTime}m
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LiveWaiterWidget);
