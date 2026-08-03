import React from 'react';
import { useState, useMemo } from "react";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function ActionCenter({ insights, onAction }) {
  const [filter, setFilter] = useState('ALL');
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Group insights by category
  const groupedInsights = useMemo(() => {
    if (!insights) return {};
    
    const activeInsights = insights.filter(i => i.status === 'ACTIVE');
    
    const groups = {
      ALL: activeInsights,
      [INSIGHT_CATEGORIES.REVENUE]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.REVENUE),
      [INSIGHT_CATEGORIES.INVENTORY]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.INVENTORY),
      [INSIGHT_CATEGORIES.KITCHEN]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.KITCHEN),
      [INSIGHT_CATEGORIES.FLOOR]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.FLOOR),
      [INSIGHT_CATEGORIES.MENU]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.MENU),
      [INSIGHT_CATEGORIES.STAFF]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.STAFF),
      [INSIGHT_CATEGORIES.RESERVATION]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.RESERVATION),
      [INSIGHT_CATEGORIES.DELIVERY]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.DELIVERY),
      [INSIGHT_CATEGORIES.PURCHASING]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.PURCHASING),
      [INSIGHT_CATEGORIES.OPERATIONAL]: activeInsights.filter(i => i.category === INSIGHT_CATEGORIES.OPERATIONAL)
    };
    
    return groups;
  }, [insights]);

  const currentInsights = groupedInsights[filter] || [];

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
          Action Center
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {currentInsights.length} actions available
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {Object.keys(groupedInsights).map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              background: filter === category ? 'var(--cafe-primary)' : 'var(--cafe-bg-elevated)',
              color: filter === category ? 'white' : 'var(--cafe-text-primary)',
              border: filter === category ? 'none' : '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-sm)',
              cursor: 'pointer'
            }}
          >
            {category.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Action Cards */}
      {currentInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {currentInsights.map(insight => (
            <ActionCard key={insight.id} insight={insight} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✅</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            No actions needed
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ insight, onAction }) {
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

  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      borderLeft: `4px solid ${getPriorityColor(insight.priority)}`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '24px'
        }}>
          {getCategoryIcon(insight.category)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            marginBottom: '4px'
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            {insight.category.replace('_', ' ')} • {insight.priority}
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
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        {insight.description}
      </div>

      {/* Actions */}
      {insight.actions && insight.actions.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {insight.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onAction?.(action)}
              style={{
                padding: '10px 20px',
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
        </div>
      )}

      {/* Metadata */}
      {insight.metadata && Object.keys(insight.metadata).length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-sm)',
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          {Object.entries(insight.metadata).slice(0, 3).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '4px' }}>
              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionCenter;
