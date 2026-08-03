/**
 * Kitchen Intelligence Widget
 * Displays kitchen performance metrics and bottlenecks
 */

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

const EMPTY_ANALYTICS = {
  averageCookTime: 0,
  longestActiveTicket: 0,
  stationUtilization: {},
  kitchenQueue: 0,
  delayedOrders: 0,
  completedOrders: 0,
  currentCapacity: 0,
  bottlenecks: []
};

const cardStyle = {
  padding: 10,
  background: 'var(--cafe-bg-surface)',
  border: '1px solid var(--cafe-border)',
  borderRadius: 6
};

const sectionStyle = {
  padding: 12,
  background: 'var(--cafe-bg-surface)',
  border: '1px solid var(--cafe-border)',
  borderRadius: 8
};

const labelStyle = { fontSize: 9, color: 'var(--cafe-text-tertiary)' };
const valueStyle = { fontSize: 16, fontWeight: 600, fontFamily: 'monospace' };

// Formats an epoch ms timestamp as a short "time ago" string, falling back
// to a clock time once it's more than an hour stale.
function formatTimeAgo(timestamp, now) {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(timestamp).toLocaleTimeString();
}

function capacityTone(capacity) {
  if (capacity < 10) {
    return { bg: 'var(--cafe-danger-bg)', fg: 'var(--cafe-danger)' };
  }
  if (capacity < 20) {
    return { bg: 'var(--cafe-warning-bg)', fg: 'var(--cafe-warning)' };
  }
  return { bg: 'var(--cafe-success-bg)', fg: 'var(--cafe-success)' };
}

function utilizationColor(util) {
  if (util > 80) return 'var(--cafe-warning)';
  if (util > 60) return 'var(--cafe-info)';
  return 'var(--cafe-success)';
}

function KitchenIntelligenceWidget({ instance, settings }) {
  const [kitchenData, setKitchenData] = useState(EMPTY_ANALYTICS);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const prevAvgCookTime = useRef(null);
  const trendRef = useRef(null);

  const refreshIntervalMs = settings?.refreshIntervalMs ?? 30000;

  useEffect(() => {
    let isMounted = true;

    const fetchKitchenData = async () => {
      try {
        const liveData = liveOperationsEngine.getAllData();

        analyticsEngine.initialize();
        const analytics = analyticsEngine.calculateKitchenAnalytics(liveData);

        if (!isMounted) return;

        // Track trend for average cook time before overwriting the ref.
        if (prevAvgCookTime.current !== null && Number.isFinite(analytics.averageCookTime)) {
          if (analytics.averageCookTime > prevAvgCookTime.current) trendRef.current = 'up';
          else if (analytics.averageCookTime < prevAvgCookTime.current) trendRef.current = 'down';
          else trendRef.current = 'flat';
        }
        prevAvgCookTime.current = analytics.averageCookTime;

        setKitchenData({ ...EMPTY_ANALYTICS, ...analytics });
        setLastUpdate(Date.now());
        setStatus('ready');
        setErrorMessage(null);
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'Unable to load kitchen analytics');
      }
    };

    fetchKitchenData();
    const interval = setInterval(fetchKitchenData, refreshIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshIntervalMs]);

  // Keep the "Updated Xs ago" label ticking without waiting on the next fetch.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const sortedBottlenecks = useMemo(
    () => [...kitchenData.bottlenecks].sort((a, b) => b.utilization - a.utilization),
    [kitchenData.bottlenecks]
  );

  const stationEntries = Object.entries(kitchenData.stationUtilization);
  const capacity = capacityTone(kitchenData.currentCapacity);
  const trendSymbol = trendRef.current === 'up' ? '▲' : trendRef.current === 'down' ? '▼' : '';
  const trendColor = trendRef.current === 'up' ? 'var(--cafe-warning)' : trendRef.current === 'down' ? 'var(--cafe-success)' : 'var(--cafe-text-tertiary)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Kitchen Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }} aria-live="polite">
            {status === 'error' ? 'Update failed' : `Updated ${formatTimeAgo(lastUpdate, now)}`}
          </div>
        </div>
        <div
          role="status"
          aria-label={`Current capacity ${kitchenData.currentCapacity} percent`}
          style={{
            padding: '4px 12px',
            background: capacity.bg,
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: capacity.fg
          }}
        >
          {kitchenData.currentCapacity}% Capacity
        </div>
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <div
          role="alert"
          style={{
            padding: 8,
            background: 'var(--cafe-danger-bg)',
            border: '1px solid var(--cafe-danger-border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--cafe-danger)'
          }}
        >
          {errorMessage || 'Something went wrong loading kitchen data.'} Showing last known values.
        </div>
      )}

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Avg Cook</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <div style={{ ...valueStyle, color: 'var(--cafe-text-primary)' }}>
              {status === 'loading' ? '—' : `${kitchenData.averageCookTime}m`}
            </div>
            {trendSymbol && (
              <span style={{ fontSize: 10, color: trendColor }} aria-label={`trend ${trendRef.current}`}>
                {trendSymbol}
              </span>
            )}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Longest</div>
          <div style={{ ...valueStyle, color: kitchenData.longestActiveTicket > 15 ? 'var(--cafe-danger)' : 'var(--cafe-text-primary)' }}>
            {status === 'loading' ? '—' : `${kitchenData.longestActiveTicket}m`}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Queue</div>
          <div style={{ ...valueStyle, color: 'var(--cafe-info)' }}>
            {status === 'loading' ? '—' : kitchenData.kitchenQueue}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Delayed</div>
          <div style={{ ...valueStyle, color: kitchenData.delayedOrders > 0 ? 'var(--cafe-warning)' : 'var(--cafe-text-secondary)' }}>
            {status === 'loading' ? '—' : kitchenData.delayedOrders}
          </div>
        </div>
      </div>

      {/* Station Utilization */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Station Utilization
        </div>
        {stationEntries.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            No active stations right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {stationEntries.map(([station, util]) => (
              <div key={station}>
                <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', textTransform: 'capitalize' }}>
                  {station}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: utilizationColor(util),
                    fontFamily: 'monospace'
                  }}
                >
                  {util}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottlenecks */}
      {sortedBottlenecks.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 8 }}>
            Bottlenecks Detected ({sortedBottlenecks.length})
          </div>
          {sortedBottlenecks.map((bottleneck) => (
            <div
              key={bottleneck.station}
              style={{
                padding: 8,
                background: 'var(--cafe-warning-bg)',
                border: '1px solid var(--cafe-warning-border)',
                borderRadius: 6,
                marginBottom: 4,
                fontSize: 12,
                color: 'var(--cafe-warning)'
              }}
            >
              <span style={{ fontWeight: 600 }}>{bottleneck.station}</span>: {bottleneck.utilization}% utilization
            </div>
          ))}
        </div>
      )}

      {/* Completed Today */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Completed Today</div>
        <div style={{ ...valueStyle, color: 'var(--cafe-success)' }}>
          {status === 'loading' ? '—' : kitchenData.completedOrders}
        </div>
      </div>
    </div>
  );
}

export default memo(KitchenIntelligenceWidget);
