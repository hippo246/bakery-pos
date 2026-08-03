import React from 'react';
import { useMemo } from "react";
import { INSIGHT_PRIORITY } from "../../domain/intelligenceModel.js";

function TodayPriorities({ insights, onAction, onDismiss, onComplete }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const sortedInsights = useMemo(() => {
    if (!insights) return [];
    
    const priorityOrder = {
      [INSIGHT_PRIORITY.CRITICAL]: 0,
      [INSIGHT_PRIORITY.HIGH]: 1,
      [INSIGHT_PRIORITY.MEDIUM]: 2,
      [INSIGHT_PRIORITY.LOW]: 3,
      [INSIGHT_PRIORITY.INFO]: 4
    };
    
    return [...insights]
      .filter(i => i.status === 'ACTIVE')
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [insights]);

  if (!sortedInsights || sortedInsights.length === 0) {
    return (
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '32px',
        border: '1px solid var(--cafe-border-light)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✅</div>
        <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
          No active priorities
        </div>
        <div style={{ fontSize: '14px', color: 'var(--cafe-text-tertiary)', marginTop: '8px' }}>
          All caught up! Great job.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {sortedInsights.map((insight, idx) => (
        <PriorityCard
          key={insight.id}
          insight={insight}
          index={idx}
          onAction={onAction}
          onDismiss={onDismiss}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}

function PriorityCard({ insight, index, onAction, onDismiss, onComplete }) {
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

  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '⚠';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '•';
      case 'INFO': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      borderLeft: `4px solid ${getPriorityColor(insight.priority)}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          flexShrink: 0
        }}>
          {getPriorityEmoji(insight.priority)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            marginBottom: '4px'
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--cafe-text-secondary)'
          }}>
            {new Date(insight.createdAt).toLocaleString()}
          </div>
        </div>
        {insight.value && (
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: getPriorityColor(insight.priority)
          }}>
            {insight.value}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '14px',
        color: 'var(--cafe-text-primary)',
        lineHeight: '1.5'
      }}>
        {insight.description}
      </div>

      {/* Comparison/Trend */}
      {(insight.comparison || insight.trend) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-sm)'
        }}>
          {insight.trend === 'up' && (
            <span style={{ fontSize: '16px' }}>📈</span>
          )}
          {insight.trend === 'down' && (
            <span style={{ fontSize: '16px' }}>📉</span>
          )}
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: insight.trend === 'up' ? '#27ae60' : insight.trend === 'down' ? '#e74c3c' : 'var(--cafe-text-primary)'
          }}>
            {insight.comparison}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {insight.actions && insight.actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onAction?.(action)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              background: 'var(--cafe-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--cafe-radius-sm)',
              cursor: 'pointer'
            }}
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={() => onComplete?.(insight)}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer'
          }}
        >
          Complete
        </button>
        <button
          onClick={() => onDismiss?.(insight)}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default TodayPriorities;
