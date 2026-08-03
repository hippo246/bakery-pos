import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function StaffIntelligence({ insights, shifts, staff, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const staffInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.STAFF);
  }, [insights]);

  // Calculate staff metrics
  const metrics = useMemo(() => {
    if (!shifts || shifts.length === 0) {
      return {
        totalShifts: 0,
        activeShifts: 0,
        managerOverrides: 0,
        avgShiftRevenue: 0
      };
    }

    const activeShifts = shifts.filter(s => s.status === 'OPEN').length;
    const totalOverrides = shifts.reduce((sum, s) => sum + (s.managerOverrides || 0), 0);
    const totalRevenue = shifts.reduce((sum, s) => sum + (s.netSales || 0), 0);
    const avgShiftRevenue = shifts.length > 0 ? totalRevenue / shifts.length : 0;

    return {
      totalShifts: shifts.length,
      activeShifts,
      managerOverrides: totalOverrides,
      avgShiftRevenue
    };
  }, [shifts]);

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
          Staff Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Shifts"
          value={metrics.totalShifts.toString()}
        />
        <MetricCard
          label="Active Shifts"
          value={metrics.activeShifts.toString()}
          alert={metrics.activeShifts > 0}
        />
        <MetricCard
          label="Manager Overrides"
          value={metrics.managerOverrides.toString()}
          alert={metrics.managerOverrides > 0}
        />
        <MetricCard
          label="Avg Shift Revenue"
          value={formatCurrency(metrics.avgShiftRevenue)}
        />
      </div>

      {/* Shift Performance */}
      {shifts && shifts.length > 0 && (
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
            Shift Performance
          </div>
          <ShiftPerformance shifts={shifts} />
        </div>
      )}

      {/* Staff Insights */}
      {staffInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {staffInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>👥</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more staff data before generating insights.
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

function ShiftPerformance({ shifts }) {
  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => (b.netSales || 0) - (a.netSales || 0));
  }, [shifts]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {sortedShifts.slice(0, 10).map(shift => (
        <div
          key={shift.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: shift.status === 'OPEN' ? '#d4edda' : 'var(--cafe-bg-elevated)',
            borderRadius: 'var(--cafe-radius-md)',
            border: shift.status === 'OPEN' ? '1px solid #28a745' : '1px solid var(--cafe-border-light)'
          }}
        >
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '4px'
            }}>
              {shift.managerName || 'Unknown Manager'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {shift.cashierName || 'Unknown Cashier'} • {shift.status}
            </div>
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--cafe-text-primary)'
            }}>
              {formatCurrency(shift.netSales || 0)}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {shift.orderCount || 0} orders
            </div>
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

export default StaffIntelligence;
