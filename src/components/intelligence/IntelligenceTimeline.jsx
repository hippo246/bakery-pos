import React from 'react';
import { useState, useMemo } from "react";
import { createTimelineEntry } from "../../domain/intelligenceModel.js";

function IntelligenceTimeline({ insights, onAction }) {
  const [filter, setFilter] = useState('ALL');
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Convert insights to timeline entries
  const timelineEntries = useMemo(() => {
    if (!insights) return [];
    
    return insights
      .filter(i => i.status === 'ACTIVE' || i.status === 'COMPLETED')
      .map(insight => ({
        id: insight.id,
        type: 'INSIGHT',
        title: insight.title,
        description: insight.description,
        timestamp: insight.createdAt,
        insightId: insight.id,
        actionTaken: insight.status === 'COMPLETED' ? 'Completed' : null,
        metadata: {
          category: insight.category,
          priority: insight.priority,
          value: insight.value
        }
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [insights]);

  // Filter by time period
  const filteredEntries = useMemo(() => {
    const now = new Date();
    
    return timelineEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      
      switch (filter) {
        case 'TODAY':
          return entryDate.toDateString() === now.toDateString();
        case 'YESTERDAY':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return entryDate.toDateString() === yesterday.toDateString();
        case 'WEEK':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return entryDate >= weekAgo;
        case 'MONTH':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return entryDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [timelineEntries, filter]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Intelligence Timeline
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {filteredEntries.length} events
        </div>
      </div>

      {/* Time Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH'].map(period => (
          <button
            key={period}
            onClick={() => setFilter(period)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              background: filter === period ? 'var(--cafe-primary)' : 'var(--cafe-bg-elevated)',
              color: filter === period ? 'white' : 'var(--cafe-text-primary)',
              border: filter === period ? 'none' : '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-sm)',
              cursor: 'pointer'
            }}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {Object.keys(groupedEntries).length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {Object.entries(groupedEntries).map(([date, entries]) => (
            <TimelineDay key={date} date={date} entries={entries} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📅</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            No timeline events
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineDay({ date, entries, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Date Header */}
      <div style={{
        fontSize: '16px',
        fontWeight: '700',
        color: 'var(--cafe-text-primary)',
        paddingBottom: '8px',
        borderBottom: '2px solid var(--cafe-border-light)'
      }}>
        {new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      {/* Entries */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingLeft: '20px',
        borderLeft: '2px solid var(--cafe-border-light)'
      }}>
        {entries.map((entry, idx) => (
          <TimelineEntry key={entry.id} entry={entry} isLast={idx === entries.length - 1} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ entry, isLast, onAction }) {
  const getCategoryIcon = (category) => {
    const icons = {
      REVENUE: '💰',
      INVENTORY: '📦',
      KITCHEN: '👨‍🍳',
      FLOOR: '🪑',
      MENU: '📜',
      STAFF: '👥',
      RESERVATION: '📅',
      DELIVERY: '🛵',
      PURCHASING: '🛒',
      OPERATIONAL: '⚙️'
    };
    return icons[category] || '📋';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#e74c3c';
      case 'HIGH': return '#f39c12';
      case 'MEDIUM': return '#3498db';
      case 'LOW': return '#95a5a6';
      case 'INFO': return '#7f8c8d';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      position: 'relative'
    }}>
      {/* Timeline Dot */}
      <div style={{
        position: 'absolute',
        left: '-26px',
        top: '8px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: getPriorityColor(entry.metadata?.priority || 'MEDIUM'),
        border: '2px solid white',
        boxShadow: '0 0 0 2px var(--cafe-border-light)'
      }} />

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '16px',
        background: entry.actionTaken ? '#d4edda' : 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-md)',
        border: entry.actionTaken ? '1px solid #28a745' : '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '20px' }}>
            {getCategoryIcon(entry.metadata?.category)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)'
            }}>
              {entry.title}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
          {entry.actionTaken && (
            <div style={{
              padding: '4px 8px',
              background: '#28a745',
              color: 'white',
              borderRadius: 'var(--cafe-radius-sm)',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {entry.actionTaken}
            </div>
          )}
        </div>

        <div style={{
          fontSize: '13px',
          color: 'var(--cafe-text-secondary)',
          marginBottom: '8px'
        }}>
          {entry.description}
        </div>

        {entry.metadata?.value && (
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: getPriorityColor(entry.metadata?.priority || 'MEDIUM')
          }}>
            {entry.metadata.value}
          </div>
        )}
      </div>
    </div>
  );
}

export default IntelligenceTimeline;
