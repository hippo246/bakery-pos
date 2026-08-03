/**
 * Live Reservations Widget
 * Displays real-time reservation status and upcoming reservations
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveReservationsWidget({ instance, settings }) {
  const [reservationsData, setReservationsData] = useState({
    upcoming: [],
    checkedIn: 0,
    late: 0,
    noShows: 0,
    completed: 0,
    walkIns: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('reservations', (data) => {
      setReservationsData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'var(--cafe-success)';
      case 'late': return 'var(--cafe-warning)';
      case 'no-show': return 'var(--cafe-danger)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Live Reservations
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: 'var(--cafe-accent-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--cafe-accent)'
        }}>
          {reservationsData.upcoming.length} Upcoming
        </div>
      </div>

      {/* Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Checked In</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {reservationsData.checkedIn}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Late</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {reservationsData.late}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>No Show</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
            {reservationsData.noShows}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Walk-ins</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {reservationsData.walkIns}
          </div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Upcoming Reservations
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {reservationsData.upcoming.length === 0 ? (
            <div style={{ 
              padding: 20, 
              textAlign: 'center', 
              color: 'var(--cafe-text-tertiary)',
              fontSize: 13
            }}>
              No upcoming reservations
            </div>
          ) : (
            reservationsData.upcoming.map(res => (
              <div key={res.id} style={{ 
                padding: 10, 
                background: 'var(--cafe-bg-surface)', 
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                    {res.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                    {res.guests} guest{res.guests > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
                    {formatTime(res.time)}
                  </div>
                  <div style={{ fontSize: 10, color: getStatusColor(res.status), textTransform: 'capitalize' }}>
                    {res.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed Today */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Completed Today</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
          {reservationsData.completed}
        </div>
      </div>
    </div>
  );
}

export default memo(LiveReservationsWidget);
