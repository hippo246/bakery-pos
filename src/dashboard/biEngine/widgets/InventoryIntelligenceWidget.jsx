/**
 * Inventory Intelligence Widget
 * Displays inventory analytics and stock insights
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function InventoryIntelligenceWidget({ instance, settings }) {
  const [inventoryData, setInventoryData] = useState({
    criticalItems: 0,
    lowItems: 0,
    outOfStock: 0,
    fastMovingItems: [],
    slowMovingItems: [],
    todayConsumption: 0,
    estimatedRemaining: 0,
    upcomingRestocking: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchInventoryData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateInventoryAnalytics(liveData);

      setInventoryData(analytics);
      setLastUpdate(Date.now());
    };

    fetchInventoryData();
    const interval = setInterval(fetchInventoryData, 60000);

    return () => clearInterval(interval);
  }, []);

  const hasIssues = inventoryData.criticalItems > 0 || inventoryData.outOfStock > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Inventory Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {hasIssues && (
          <div style={{ 
            padding: '4px 12px', 
            background: 'var(--cafe-danger-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cafe-danger)'
          }}>
            Action Required
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: inventoryData.outOfStock > 0 ? 'var(--cafe-danger-bg)' : 'var(--cafe-bg-surface)', 
          border: inventoryData.outOfStock > 0 ? '1px solid var(--cafe-danger-border)' : '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Out of Stock</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
            {inventoryData.outOfStock}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: inventoryData.criticalItems > 0 ? 'var(--cafe-warning-bg)' : 'var(--cafe-bg-surface)', 
          border: inventoryData.criticalItems > 0 ? '1px solid var(--cafe-warning-border)' : '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Critical</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {inventoryData.criticalItems}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Low</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {inventoryData.lowItems}
          </div>
        </div>
      </div>

      {/* Consumption Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Today's Use</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {inventoryData.todayConsumption}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Est. Days</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: inventoryData.estimatedRemaining < 3 ? 'var(--cafe-warning)' : 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {inventoryData.estimatedRemaining}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Restocking</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {inventoryData.upcomingRestocking}
          </div>
        </div>
      </div>

      {/* Fast Moving Items */}
      {inventoryData.fastMovingItems.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-success)', fontWeight: 600, marginBottom: 8 }}>
            Fast Moving Items
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {inventoryData.fastMovingItems.map((item, index) => (
              <span key={index} style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-success-bg)', 
                border: '1px solid var(--cafe-success-border)',
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--cafe-success)'
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slow Moving Items */}
      {inventoryData.slowMovingItems.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 8 }}>
            Slow Moving Items
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {inventoryData.slowMovingItems.map((item, index) => (
              <span key={index} style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-warning-bg)', 
                border: '1px solid var(--cafe-warning-border)',
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--cafe-warning)'
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(InventoryIntelligenceWidget);
