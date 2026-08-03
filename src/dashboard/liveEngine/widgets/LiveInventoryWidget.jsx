/**
 * Live Inventory Widget
 * Displays actionable inventory alerts and status
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveInventoryWidget({ instance, settings }) {
  const [inventoryData, setInventoryData] = useState({
    critical: [],
    low: [],
    out: [],
    expiring: [],
    recentDeliveries: 0,
    supplierDelays: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('inventory', (data) => {
      setInventoryData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const totalAlerts = inventoryData.critical.length + inventoryData.low.length + inventoryData.out.length + inventoryData.expiring.length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Inventory Alerts
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {totalAlerts > 0 && (
          <div style={{ 
            padding: '4px 12px', 
            background: inventoryData.critical.length > 0 ? 'var(--cafe-danger-bg)' : 'var(--cafe-warning-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: inventoryData.critical.length > 0 ? 'var(--cafe-danger)' : 'var(--cafe-warning)'
          }}>
            {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Critical Items */}
      {inventoryData.critical.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-danger)', fontWeight: 600, marginBottom: 8 }}>
            CRITICAL
          </div>
          {inventoryData.critical.map(item => (
            <div key={item.id} style={{ 
              padding: 8, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 6,
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13
            }}>
              <span style={{ color: 'var(--cafe-danger)' }}>{item.name}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Out of Stock */}
      {inventoryData.out.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-danger)', fontWeight: 600, marginBottom: 8 }}>
            OUT OF STOCK
          </div>
          {inventoryData.out.map(item => (
            <div key={item.id} style={{ 
              padding: 8, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 6,
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13
            }}>
              <span style={{ color: 'var(--cafe-danger)' }}>{item.name}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                0 {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expiring Soon */}
      {inventoryData.expiring.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 8 }}>
            EXPIRING SOON
          </div>
          {inventoryData.expiring.map(item => (
            <div key={item.id} style={{ 
              padding: 8, 
              background: 'var(--cafe-warning-bg)', 
              border: '1px solid var(--cafe-warning-border)',
              borderRadius: 6,
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13
            }}>
              <span style={{ color: 'var(--cafe-warning)' }}>{item.name}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {item.expiresIn}d
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Low Stock */}
      {inventoryData.low.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
            LOW STOCK
          </div>
          {inventoryData.low.map(item => (
            <div key={item.id} style={{ 
              padding: 8, 
              background: 'var(--cafe-bg-surface)', 
              border: '1px solid var(--cafe-border)',
              borderRadius: 6,
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13
            }}>
              <span style={{ color: 'var(--cafe-text-secondary)' }}>{item.name}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* No Alerts */}
      {totalAlerts === 0 && (
        <div style={{ 
          padding: 20, 
          textAlign: 'center', 
          color: 'var(--cafe-success)',
          fontSize: 14
        }}>
          ✓ All inventory levels normal
        </div>
      )}

      {/* Supplier Info */}
      {(inventoryData.recentDeliveries > 0 || inventoryData.supplierDelays > 0) && (
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
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Recent Deliveries</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
              {inventoryData.recentDeliveries}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Supplier Delays</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: inventoryData.supplierDelays > 0 ? 'var(--cafe-warning)' : 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
              {inventoryData.supplierDelays}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LiveInventoryWidget);
