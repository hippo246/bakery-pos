import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function PurchasingIntelligence({ insights, purchases, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const purchasingInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.PURCHASING);
  }, [insights]);

  // Calculate purchasing metrics
  const metrics = useMemo(() => {
    if (!purchases || purchases.length === 0) {
      return {
        totalPurchases: 0,
        pendingPurchases: 0,
        delayedPurchases: 0,
        totalSpent: 0
      };
    }

    const pendingPurchases = purchases.filter(p => p.status === 'PENDING').length;
    const delayedPurchases = purchases.filter(p => p.status === 'DELAYED').length;
    const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

    return {
      totalPurchases: purchases.length,
      pendingPurchases,
      delayedPurchases,
      totalSpent
    };
  }, [purchases]);

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
          Purchasing Intelligence
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <MetricCard
          label="Total Purchases"
          value={metrics.totalPurchases.toString()}
        />
        <MetricCard
          label="Pending"
          value={metrics.pendingPurchases.toString()}
          alert={metrics.pendingPurchases > 0}
        />
        <MetricCard
          label="Delayed"
          value={metrics.delayedPurchases.toString()}
          alert={metrics.delayedPurchases > 0}
        />
        <MetricCard
          label="Total Spent"
          value={formatCurrency(metrics.totalSpent)}
        />
      </div>

      {/* Purchase Orders */}
      {purchases && purchases.length > 0 && (
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
            Recent Purchase Orders
          </div>
          <PurchaseOrders purchases={purchases} onAction={onAction} />
        </div>
      )}

      {/* Purchasing Insights */}
      {purchasingInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {purchasingInsights.map(insight => (
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
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📦</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            We need more purchasing data before generating insights.
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

function PurchaseOrders({ purchases, onAction }) {
  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [purchases]);

  if (recentPurchases.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--cafe-text-secondary)'
      }}>
        No purchase orders
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {recentPurchases.map(purchase => (
        <div
          key={purchase.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: purchase.status === 'DELAYED' ? '#fee' : 
                       purchase.status === 'PENDING' ? '#fff3cd' : 'var(--cafe-bg-elevated)',
            borderRadius: 'var(--cafe-radius-md)',
            border: purchase.status === 'DELAYED' ? '1px solid #e74c3c' : 
                   purchase.status === 'PENDING' ? '1px solid #ffc107' : '1px solid var(--cafe-border-light)'
          }}
        >
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '4px'
            }}>
              {purchase.supplierName || 'Unknown Supplier'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--cafe-text-secondary)'
            }}>
              {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.status}
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
              {formatCurrency(purchase.total || 0)}
            </div>
            <button
              onClick={() => onAction?.({ type: 'NAVIGATE', target: 'purchasing' })}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '600',
                background: 'var(--cafe-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--cafe-radius-sm)',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              View
            </button>
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

export default PurchasingIntelligence;
