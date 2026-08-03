import React from 'react';
import { useMemo } from "react";

function DailyBrief({ brief, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  if (!brief) {
    return (
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '32px',
        border: '1px solid var(--cafe-border-light)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
        <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
          Generating daily brief...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '32px',
      border: '1px solid var(--cafe-border-light)'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)',
          marginBottom: '8px'
        }}>
          {brief.greeting}
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {new Date(brief.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Highlights */}
      {brief.highlights && brief.highlights.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Today's Highlights
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {brief.highlights.map((insight, idx) => (
              <HighlightCard key={idx} insight={insight} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* Priorities */}
      {brief.priorities && brief.priorities.length > 0 && (
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Today's Priorities
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {brief.priorities.map((insight, idx) => (
              <PriorityCard key={idx} insight={insight} index={idx} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {(!brief.highlights || brief.highlights.length === 0) && 
       (!brief.priorities || brief.priorities.length === 0) && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✨</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more operational data before generating insights.
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-tertiary)', marginTop: '8px' }}>
            Continue using CafeOS to build your operational history.
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ insight, onAction }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#e74c3c';
      case 'HIGH': return '#f39c12';
      case 'MEDIUM': return '#3498db';
      case 'LOW': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{
      padding: '16px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      borderLeft: `4px solid ${getPriorityColor(insight.priority)}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)'
        }}>
          {insight.title}
        </div>
        {insight.value && (
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: getPriorityColor(insight.priority)
          }}>
            {insight.value}
          </div>
        )}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '12px'
      }}>
        {insight.description}
      </div>
      {insight.actions && insight.actions.length > 0 && (
        <button
          onClick={() => onAction?.(insight.actions[0])}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer'
          }}
        >
          {insight.actions[0].label}
        </button>
      )}
    </div>
  );
}

function PriorityCard({ insight, index, onAction }) {
  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '⚠';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '•';
      default: return '•';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onClick={() => onAction?.(insight.actions?.[0])}
    >
      <div style={{
        fontSize: '24px',
        flexShrink: 0
      }}>
        {getPriorityEmoji(insight.priority)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)',
          marginBottom: '4px'
        }}>
          {insight.title}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {insight.description}
        </div>
      </div>
      {insight.actions && insight.actions.length > 0 && (
        <div style={{
          fontSize: '20px',
          color: 'var(--cafe-text-tertiary)'
        }}>
          →
        </div>
      )}
    </div>
  );
}

export default DailyBrief;
