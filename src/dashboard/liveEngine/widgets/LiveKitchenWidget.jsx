/**
 * Live Kitchen Widget
 * Displays real-time kitchen operations and status
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveKitchenWidget({ instance, settings }) {
  const [kitchenData, setKitchenData] = useState({
    waiting: 0,
    cooking: 0,
    ready: 0,
    collected: 0,
    delayed: 0,
    criticalDelays: 0,
    longestWaiting: 0,
    avgCookTime: 0,
    kitchenLoad: 0,
    stationUtilization: {}
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('kitchen', (data) => {
      setKitchenData(prev => {
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

  const getLoadColor = (load) => {
    if (load > 80) return 'var(--cafe-danger)';
    if (load > 60) return 'var(--cafe-warning)';
    return 'var(--cafe-success)';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Kitchen Operations
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: kitchenData.kitchenLoad > 70 ? 'var(--cafe-warning-bg)' : 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: kitchenData.kitchenLoad > 70 ? 'var(--cafe-warning)' : 'var(--cafe-success)'
        }}>
          {kitchenData.kitchenLoad}% Load
        </div>
      </div>

      {/* Queue Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Waiting</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {kitchenData.waiting}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Cooking</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {kitchenData.cooking}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Ready</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {kitchenData.ready}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Collected</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {kitchenData.collected}
          </div>
        </div>
      </div>

      {/* Delays */}
      {(kitchenData.delayed > 0 || kitchenData.criticalDelays > 0) && (
        <div style={{ 
          padding: 12, 
          background: kitchenData.criticalDelays > 0 ? 'var(--cafe-danger-bg)' : 'var(--cafe-warning-bg)',
          border: kitchenData.criticalDelays > 0 ? '1px solid var(--cafe-danger-border)' : '1px solid var(--cafe-warning-border)',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Delayed</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: kitchenData.criticalDelays > 0 ? 'var(--cafe-danger)' : 'var(--cafe-warning)', fontFamily: 'monospace' }}>
              {kitchenData.delayed}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Critical</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
              {kitchenData.criticalDelays}
            </div>
          </div>
        </div>
      )}

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
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Longest Waiting</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: kitchenData.longestWaiting > 20 ? 'var(--cafe-danger)' : 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {kitchenData.longestWaiting}m
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Cook Time</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {kitchenData.avgCookTime}m
          </div>
        </div>
      </div>

      {/* Station Utilization */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
          Station Utilization
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Object.entries(kitchenData.stationUtilization).map(([station, util]) => (
            <div key={station}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-secondary)', textTransform: 'capitalize' }}>
                {station}
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: getLoadColor(util),
                fontFamily: 'monospace' 
              }}>
                {util}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(LiveKitchenWidget);
