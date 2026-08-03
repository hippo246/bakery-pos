import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function MenuIntelligence({ insights, orders, menuItems, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const menuInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.MENU);
  }, [insights]);

  // Calculate menu metrics
  const metrics = useMemo(() => {
    if (!orders || orders.length === 0 || !menuItems || menuItems.length === 0) {
      return {
        totalItems: 0,
        bestSeller: null,
        worstSeller: null,
        avgMargin: 0
      };
    }

    // Item sales count
    const itemSales = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        itemSales[item.id] = (itemSales[item.id] || 0) + (item.quantity || 1);
      });
    });

    const totalSales = Object.values(itemSales).reduce((a, b) => a + b, 0);
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);

    const bestSeller = sortedItems.length > 0 ? menuItems.find(m => m.id === sortedItems[0][0]) : null;
    const worstSeller = sortedItems.length > 0 ? menuItems.find(m => m.id === sortedItems[sortedItems.length - 1][0]) : null;

    // Calculate average margin
    let totalMargin = 0;
    let marginCount = 0;
    menuItems.forEach(item => {
      if (item.cost && item.price) {
        totalMargin += (item.price - item.cost);
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? totalMargin / marginCount : 0;

    return {
      totalItems: menuItems.length,
      bestSeller,
      worstSeller,
      avgMargin
    };
  }, [orders, menuItems]);

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
          Menu Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Items"
          value={metrics.totalItems.toString()}
        />
        <MetricCard
          label="Best Seller"
          value={metrics.bestSeller?.name || 'N/A'}
        />
        <MetricCard
          label="Avg Margin"
          value={formatCurrency(metrics.avgMargin)}
        />
        <MetricCard
          label="Menu Performance"
          value="View Details"
        />
      </div>

      {/* Item Performance */}
      {orders && orders.length > 0 && menuItems && menuItems.length > 0 && (
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
            Item Performance
          </div>
          <ItemPerformance orders={orders} menuItems={menuItems} />
        </div>
      )}

      {/* Menu Insights */}
      {menuInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {menuInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📜</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more menu data before generating insights.
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

function ItemPerformance({ orders, menuItems }) {
  const itemStats = useMemo(() => {
    const stats = {};
    
    menuItems.forEach(item => {
      stats[item.id] = {
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost,
        margin: item.price - item.cost,
        sales: 0,
        revenue: 0
      };
    });
    
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (stats[item.id]) {
          stats[item.id].sales += item.quantity || 1;
          stats[item.id].revenue += (item.price || 0) * (item.quantity || 1);
        }
      });
    });
    
    return Object.values(stats).sort((a, b) => b.sales - a.sales);
  }, [orders, menuItems]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {itemStats.slice(0, 10).map(item => (
        <div
          key={item.id}
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
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {formatCurrency(item.price)} • {formatCurrency(item.margin)} margin
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
              {item.sales}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              sold
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

export default MenuIntelligence;
