import React from 'react';
import { useMemo } from "react";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function KitchenIntelligence({ insights, kdsCards, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const kitchenInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.KITCHEN);
  }, [insights]);

  // Calculate kitchen metrics
  const metrics = useMemo(() => {
    if (!kdsCards || kdsCards.length === 0) {
      return {
        totalTickets: 0,
        completedTickets: 0,
        avgPrepTime: 0,
        cancellationRate: 0
      };
    }

    const completedCards = kdsCards.filter(c => c.completed);
    const cancelledCards = kdsCards.filter(c => c.cancelled);
    
    let avgPrepTime = 0;
    if (completedCards.length > 0) {
      const totalDuration = completedCards.reduce((sum, c) => {
        const duration = (c.completedAt || Date.now()) - (c.startedAt || c.createdAt);
        return sum + duration;
      }, 0);
      avgPrepTime = totalDuration / completedCards.length;
    }

    const cancellationRate = kdsCards.length > 0 
      ? (cancelledCards.length / kdsCards.length) * 100 
      : 0;

    return {
      totalTickets: kdsCards.length,
      completedTickets: completedCards.length,
      avgPrepTime: Math.floor(avgPrepTime / 60000), // Convert to minutes
      cancellationRate
    };
  }, [kdsCards]);

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
          Kitchen Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Tickets"
          value={metrics.totalTickets.toString()}
        />
        <MetricCard
          label="Completed"
          value={metrics.completedTickets.toString()}
        />
        <MetricCard
          label="Avg Prep Time"
          value={`${metrics.avgPrepTime}m`}
          alert={metrics.avgPrepTime > 15}
        />
        <MetricCard
          label="Cancellation Rate"
          value={`${metrics.cancellationRate.toFixed(1)}%`}
          alert={metrics.cancellationRate > 10}
        />
      </div>

      {/* Station Performance */}
      {kdsCards && kdsCards.length > 0 && (
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '24px',
          border: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Station Performance
          </div>
          <StationPerformance kdsCards={kdsCards} />
        </div>
      )}

      {/* Kitchen Insights */}
      {kitchenInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {kitchenInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--cafe-bg-elevated)',
          borderRadius: 'var(--cafe-radius-md)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>👨‍🍳</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more kitchen data before generating insights.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, alert }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: alert ? '1px solid #e74c3c' : '1px solid var(--cafe-border-light)',
      background: alert ? '#fee' : 'var(--cafe-bg-surface)'
    }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: alert ? '#e74c3c' : 'var(--cafe-text-primary)'
      }}>
        {value}
      </div>
    </div>
  );
}

function StationPerformance({ kdsCards }) {
  const stationStats = useMemo(() => {
    const stats = {};
    
    kdsCards.forEach(card => {
      const station = card.station || 'Unknown';
      if (!stats[station]) {
        stats[station] = {
          total: 0,
          completed: 0,
          cancelled: 0,
          avgTime: 0
        };
      }
      
      stats[station].total++;
      
      if (card.completed) {
        stats[station].completed++;
        const duration = (card.completedAt || Date.now()) - (card.startedAt || card.createdAt);
        stats[station].avgTime += duration;
      }
      
      if (card.cancelled) {
        stats[station].cancelled++;
      }
    });
    
    // Calculate averages
    Object.keys(stats).forEach(station => {
      if (stats[station].completed > 0) {
        stats[station].avgTime = Math.floor(stats[station].avgTime / stats[station].completed / 60000);
      }
    });
    
    return stats;
  }, [kdsCards]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {Object.entries(stationStats).map(([station, stats]) => (
        <div
          key={station}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: 'var(--cafe-bg-elevated)',
            borderRadius: 'var(--cafe-radius-md)'
          }}
        >
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '4px'
            }}>
              {station}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {stats.completed} / {stats.total} completed
            </div>
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: stats.avgTime > 15 ? '#e74c3c' : 'var(--cafe-text-primary)'
            }}>
              {stats.avgTime}m avg
            </div>
            {stats.cancelled > 0 && (
              <div style={{
                fontSize: '12px',
                color: '#e74c3c'
              }}>
                {stats.cancelled} cancelled
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight, onAction }) {
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
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-md)',
      border: '1px solid var(--cafe-border-light)',
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
            fontSize: '16px',
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

export default KitchenIntelligence;
