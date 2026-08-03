import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function DeliveryIntelligence({ insights, orders, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const deliveryInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.DELIVERY);
  }, [insights]);

  // Calculate delivery metrics
  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalDeliveryOrders: 0,
        swiggyOrders: 0,
        zomatoOrders: 0,
        directDelivery: 0
      };
    }

    const deliveryOrders = orders.filter(o => 
      o.source === 'SWIGGY' || o.source === 'ZOMATO' || o.orderType === 'DIRECT_DELIVERY'
    );

    const swiggyOrders = deliveryOrders.filter(o => o.source === 'SWIGGY').length;
    const zomatoOrders = deliveryOrders.filter(o => o.source === 'ZOMATO').length;
    const directDelivery = deliveryOrders.filter(o => o.orderType === 'DIRECT_DELIVERY').length;

    return {
      totalDeliveryOrders: deliveryOrders.length,
      swiggyOrders,
      zomatoOrders,
      directDelivery
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
          Delivery Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Delivery"
          value={metrics.totalDeliveryOrders.toString()}
        />
        <MetricCard
          label="Swiggy"
          value={metrics.swiggyOrders.toString()}
        />
        <MetricCard
          label="Zomato"
          value={metrics.zomatoOrders.toString()}
        />
        <MetricCard
          label="Direct"
          value={metrics.directDelivery.toString()}
        />
      </div>

      {/* Platform Performance */}
      {orders && orders.length > 0 && (
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
            Platform Performance
          </div>
          <PlatformPerformance orders={orders} />
        </div>
      )}

      {/* Delivery Insights */}
      {deliveryInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {deliveryInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🛵</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more delivery data before generating insights.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
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
        color: 'var(--cafe-text-primary)'
      }}>
        {value}
      </div>
    </div>
  );
}

function PlatformPerformance({ orders }) {
  const platformStats = useMemo(() => {
    const stats = {
      SWIGGY: { orders: 0, revenue: 0, cancelled: 0 },
      ZOMATO: { orders: 0, revenue: 0, cancelled: 0 },
      DIRECT_DELIVERY: { orders: 0, revenue: 0, cancelled: 0 }
    };
    
    orders.forEach(order => {
      const platform = order.source === 'SWIGGY' ? 'SWIGGY' : 
                       order.source === 'ZOMATO' ? 'ZOMATO' : 
                       order.orderType === 'DIRECT_DELIVERY' ? 'DIRECT_DELIVERY' : null;
      
      if (platform && stats[platform]) {
        stats[platform].orders++;
        stats[platform].revenue += order.total || 0;
        if (order.status === 'CANCELLED') {
          stats[platform].cancelled++;
        }
      }
    });
    
    return stats;
  }, [orders]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {Object.entries(platformStats).map(([platform, stats]) => (
        stats.orders > 0 && (
          <div
            key={platform}
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
                {platform.replace('_', ' ')}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--cafe-text-secondary)'
              }}>
                {stats.orders} orders
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
                {formatCurrency(stats.revenue)}
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
        )
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

export default DeliveryIntelligence;
