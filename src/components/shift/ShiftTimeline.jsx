import React from 'react';
import { useMemo } from "react";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function ShiftTimeline({ shift }) {
  const isMobile = useIsMobile();

  const sortedTimeline = useMemo(() => {
    if (!shift || !shift.timeline) return [];
    return [...shift.timeline].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [shift]);

  const getEventIcon = (type) => {
    const icons = {
      'SHIFT_OPENED': '🚀',
      'SHIFT_CLOSED': '🏁',
      'LARGE_ORDER': '📦',
      'REFUND': '↩️',
      'VOID': '❌',
      'PAID_OUT': '💸',
      'CASH_DROP': '💰',
      'MANAGER_OVERRIDE': '👑',
      'ORDER_COMPLETED': '✅',
      'PAYMENT_RECEIVED': '💳'
    };
    return icons[type] || '📝';
  };

  const getEventColor = (type) => {
    const colors = {
      'SHIFT_OPENED': '#27ae60',
      'SHIFT_CLOSED': '#27ae60',
      'LARGE_ORDER': '#3498db',
      'REFUND': '#f39c12',
      'VOID': '#e74c3c',
      'PAID_OUT': '#e67e22',
      'CASH_DROP': '#27ae60',
      'MANAGER_OVERRIDE': '#9b59b6',
      'ORDER_COMPLETED': '#27ae60',
      'PAYMENT_RECEIVED': '#27ae60'
    };
    return colors[type] || '#95a5a6';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--cafe-text-primary)'
      }}>
        Shift Timeline
      </div>

      {/* Timeline */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        {sortedTimeline.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--cafe-text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: '14px' }}>No events recorded yet</div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {sortedTimeline.map((event, idx) => (
              <TimelineEvent
                key={event.id || idx}
                event={event}
                icon={getEventIcon(event.type)}
                color={getEventColor(event.type)}
                isLast={idx === sortedTimeline.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEvent({ event, icon, color, isLast }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      position: 'relative'
    }}>
      {/* Timeline Line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '19px',
          top: '40px',
          bottom: '-16px',
          width: '2px',
          background: 'var(--cafe-border-light)'
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `${color}20`,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
        zIndex: 1
      }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        paddingBottom: isLast ? 0 : '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '4px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)'
          }}>
            {event.type.replace(/_/g, ' ')}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            {formatTime(event.timestamp)}
          </div>
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--cafe-text-secondary)',
          marginBottom: '4px'
        }}>
          {event.description}
        </div>
        {event.userName && (
          <div style={{
            fontSize: '12px',
            color: 'var(--cafe-text-tertiary)'
          }}>
            by {event.userName}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default ShiftTimeline;
