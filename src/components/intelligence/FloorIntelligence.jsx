import React from 'react';
import { useMemo } from "react";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function FloorIntelligence({ insights, tables, orders, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const floorInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.FLOOR);
  }, [insights]);

  // Calculate floor metrics
  const metrics = useMemo(() => {
    if (!tables || tables.length === 0 || !orders || orders.length === 0) {
      return {
        totalTables: 0,
        occupiedTables: 0,
        avgTurnover: 0,
        highDemandTables: 0
      };
    }

    const occupiedTables = tables.filter(t => t.occupied).length;
    
    // Calculate table usage
    const tableUsage = {};
    orders.forEach(o => {
      if (o.tableId) {
        tableUsage[o.tableId] = (tableUsage[o.tableId] || 0) + 1;
      }
    });

    const avgUsage = Object.values(tableUsage).reduce((a, b) => a + b, 0) / (Object.keys(tableUsage).length || 1);
    const highDemandTables = Object.entries(tableUsage).filter(([_, count]) => count > avgUsage * 1.5).length;

    return {
      totalTables: tables.length,
      occupiedTables,
      avgTurnover: Math.floor(avgUsage),
      highDemandTables
    };
  }, [tables, orders]);

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
          Floor Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Tables"
          value={metrics.totalTables.toString()}
        />
        <MetricCard
          label="Occupied"
          value={metrics.occupiedTables.toString()}
        />
        <MetricCard
          label="Avg Turnover"
          value={metrics.avgTurnover.toString()}
        />
        <MetricCard
          label="High Demand"
          value={metrics.highDemandTables.toString()}
          alert={metrics.highDemandTables > 0}
        />
      </div>

      {/* Table Performance */}
      {tables && tables.length > 0 && orders && orders.length > 0 && (
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
            Table Performance
          </div>
          <TablePerformance tables={tables} orders={orders} />
        </div>
      )}

      {/* Floor Insights */}
      {floorInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {floorInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🪑</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more floor data before generating insights.
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

function TablePerformance({ tables, orders }) {
  const tableStats = useMemo(() => {
    const stats = {};
    
    tables.forEach(table => {
      stats[table.id] = {
        id: table.id,
        name: table.name || table.id,
        seats: table.seats || 4,
        occupied: table.occupied || false,
        usage: 0,
        revenue: 0
      };
    });
    
    orders.forEach(order => {
      if (order.tableId && stats[order.tableId]) {
        stats[order.tableId].usage++;
        stats[order.tableId].revenue += order.total || 0;
      }
    });
    
    return Object.values(stats).sort((a, b) => b.usage - a.usage);
  }, [tables, orders]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px'
    }}>
      {tableStats.map(table => (
        <div
          key={table.id}
          style={{
            padding: '16px',
            background: table.occupied ? '#d4edda' : 'var(--cafe-bg-elevated)',
            borderRadius: 'var(--cafe-radius-md)',
            border: table.occupied ? '1px solid #28a745' : '1px solid var(--cafe-border-light)'
          }}
        >
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            {table.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)',
            marginBottom: '4px'
          }}>
            {table.seats} seats
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            <span>{table.usage} orders</span>
            <span>${table.revenue.toFixed(0)}</span>
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

export default FloorIntelligence;
