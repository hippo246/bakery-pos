/**
 * Live Tables Widget
 * Displays real-time table status and occupancy
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveTablesWidget({ instance, settings }) {
  const [tablesData, setTablesData] = useState({
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
    billRequested: 0,
    avgOccupancyTime: 0,
    overstayed: 0,
    upcomingReservations: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('tables', (data) => {
      setTablesData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const totalTables = tablesData.available + tablesData.occupied + tablesData.reserved + tablesData.cleaning;
  const occupancyRate = totalTables > 0 ? Math.round((tablesData.occupied / totalTables) * 100) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Table Status
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: occupancyRate > 80 ? 'var(--cafe-warning-bg)' : 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: occupancyRate > 80 ? 'var(--cafe-warning)' : 'var(--cafe-success)'
        }}>
          {occupancyRate}% Full
        </div>
      </div>

      {/* Table Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-success-bg)', 
          border: '1px solid var(--cafe-success-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Available</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {tablesData.available}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-info-bg)', 
          border: '1px solid var(--cafe-info-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Occupied</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {tablesData.occupied}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-accent-bg)', 
          border: '1px solid var(--cafe-accent-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Reserved</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {tablesData.reserved}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Cleaning</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {tablesData.cleaning}
          </div>
        </div>
      </div>

      {/* Action Items */}
      {(tablesData.billRequested > 0 || tablesData.overstayed > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {tablesData.billRequested > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-warning-bg)', 
              border: '1px solid var(--cafe-warning-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Bill Requested</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
                {tablesData.billRequested}
              </div>
            </div>
          )}
          {tablesData.overstayed > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Overstayed</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
                {tablesData.overstayed}
              </div>
            </div>
          )}
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
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Occupancy</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {tablesData.avgOccupancyTime}m
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Upcoming Res</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {tablesData.upcomingReservations}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LiveTablesWidget);
