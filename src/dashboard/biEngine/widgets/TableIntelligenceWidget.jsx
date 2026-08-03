/**
 * Table Intelligence Widget
 * Displays table analytics and occupancy metrics
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function TableIntelligenceWidget({ instance, settings }) {
  const [tableData, setTableData] = useState({
    occupancyRate: 0,
    averageTableTime: 0,
    tableTurnover: 0,
    reservedTables: 0,
    availableTables: 0,
    cleaningQueue: 0,
    overstayedTables: 0,
    upcomingReservations: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchTableData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateTableAnalytics(liveData);

      setTableData(analytics);
      setLastUpdate(Date.now());
    };

    fetchTableData();
    const interval = setInterval(fetchTableData, 45000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Table Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: tableData.occupancyRate > 80 ? 'var(--cafe-warning-bg)' : 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: tableData.occupancyRate > 80 ? 'var(--cafe-warning)' : 'var(--cafe-success)'
        }}>
          {tableData.occupancyRate}% Occupancy
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Available</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {tableData.availableTables}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Reserved</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {tableData.reservedTables}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Cleaning</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {tableData.cleaningQueue}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Upcoming</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {tableData.upcomingReservations}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Table Time</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {tableData.averageTableTime}m
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Table Turnover</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {tableData.tableTurnover}%
          </div>
        </div>
      </div>

      {/* Overstayed Tables */}
      {tableData.overstayedTables > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-warning-bg)', 
          border: '1px solid var(--cafe-warning-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 4 }}>
            Overstayed Tables
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {tableData.overstayedTables}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
            Tables occupied longer than average
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TableIntelligenceWidget);
