/**
 * Live Staff Status Widget
 * Displays real-time staff status and activity
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveStaffStatusWidget({ instance, settings }) {
  const [staffData, setStaffData] = useState({
    clockedIn: 0,
    active: 0,
    idle: 0,
    onBreak: 0,
    offline: 0,
    shiftEnding: 0,
    staffList: []
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('staff', (data) => {
      setStaffData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--cafe-success)';
      case 'idle': return 'var(--cafe-warning)';
      case 'break': return 'var(--cafe-info)';
      case 'offline': return 'var(--cafe-text-tertiary)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getStatusDot = (status) => {
    return (
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: getStatusColor(status),
        marginRight: 8
      }} />
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Staff Status
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: 'var(--cafe-success-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--cafe-success)'
        }}>
          {staffData.clockedIn} On Shift
        </div>
      </div>

      {/* Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {staffData.active}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Active</div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
            {staffData.idle}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Idle</div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {staffData.onBreak}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Break</div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {staffData.offline}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Offline</div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {staffData.shiftEnding}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Ending</div>
        </div>
      </div>

      {/* Staff List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          On Shift
        </div>
        {staffData.staffList.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: 'var(--cafe-text-tertiary)',
            fontSize: 13
          }}>
            No staff on shift
          </div>
        ) : (
          staffData.staffList.map(staff => (
            <div key={staff.id} style={{ 
              padding: 10, 
              background: 'var(--cafe-bg-surface)', 
              border: '1px solid var(--cafe-border)',
              borderRadius: 6,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getStatusDot(staff.status)}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                    {staff.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                    {staff.role}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 500, 
                color: getStatusColor(staff.status),
                textTransform: 'capitalize'
              }}>
                {staff.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(LiveStaffStatusWidget);
