import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function RevenueInsights({ insights, orders, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const revenueInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.REVENUE);
  }, [insights]);

  // Calculate revenue metrics
  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        averageTicket: 0,
        orderCount: 0,
        hourlyRevenue: {}
      };
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageTicket = totalRevenue / orders.length;
    
    const hourlyRevenue = {};
    orders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + (o.total || 0);
    });

    return {
      totalRevenue,
      averageTicket,
      orderCount: orders.length,
      hourlyRevenue
    };
  }, [orders]);

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
          Revenue Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          trend={revenueInsights.find(i => i.type === 'REVENUE_TREND')?.comparison}
        />
        <MetricCard
          label="Average Ticket"
          value={formatCurrency(metrics.averageTicket)}
        />
        <MetricCard
          label="Total Orders"
          value={metrics.orderCount.toString()}
        />
      </div>

      {/* Hourly Revenue Chart */}
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
          Revenue by Hour
        </div>
        <HourlyRevenueChart hourlyRevenue={metrics.hourlyRevenue} />
      </div>

      {/* Revenue Insights */}
      {revenueInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {revenueInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more revenue data before generating insights.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)'
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
        color: 'var(--cafe-text-primary)',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      {trend && (
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: trend.startsWith('+') ? '#27ae60' : '#e74c3c'
        }}>
          {trend}
        </div>
      )}
    </div>
  );
}

function HourlyRevenueChart({ hourlyRevenue }) {
  const hours = Object.keys(hourlyRevenue).sort((a, b) => parseInt(a) - parseInt(b));
  const maxRevenue = Math.max(...Object.values(hourlyRevenue), 1);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      height: '120px',
      paddingTop: '16px'
    }}>
      {hours.map(hour => {
        const revenue = hourlyRevenue[hour];
        const height = (revenue / maxRevenue) * 100;
        return (
          <div
            key={hour}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <div style={{
              width: '100%',
              height: `${height}%`,
              background: 'var(--cafe-primary)',
              borderRadius: '4px 4px 0 0',
              minHeight: '4px'
            }} />
            <div style={{
              fontSize: '11px',
              color: 'var(--cafe-text-tertiary)'
            }}>
              {hour}h
            </div>
          </div>
        );
      })}
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

export default RevenueInsights;
