import React from 'react';
import { useMemo } from "react";
import { INSIGHT_CATEGORIES } from "../../domain/intelligenceModel.js";

function InventoryIntelligence({ insights, inventory, onAction }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const inventoryInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => i.category === INSIGHT_CATEGORIES.INVENTORY);
  }, [insights]);

  // Calculate inventory metrics
  const metrics = useMemo(() => {
    if (!inventory || inventory.length === 0) {
      return {
        totalItems: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
        totalValue: 0
      };
    }

    const lowStockCount = inventory.filter(item => {
      const threshold = item.minStock || 10;
      return item.quantity <= threshold;
    }).length;

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringSoonCount = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      return expiry <= threeDaysFromNow && expiry >= now;
    }).length;

    const totalValue = inventory.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.cost || 0);
    }, 0);

    return {
      totalItems: inventory.length,
      lowStockCount,
      expiringSoonCount,
      totalValue
    };
  }, [inventory]);

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
          Inventory Intelligence
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
          label="Low Stock"
          value={metrics.lowStockCount.toString()}
          alert={metrics.lowStockCount > 0}
        />
        <MetricCard
          label="Expiring Soon"
          value={metrics.expiringSoonCount.toString()}
          alert={metrics.expiringSoonCount > 0}
        />
        <MetricCard
          label="Total Value"
          value={`$${metrics.totalValue.toFixed(2)}`}
        />
      </div>

      {/* Low Stock Items */}
      {metrics.lowStockCount > 0 && (
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
            Low Stock Items
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {inventory
              .filter(item => {
                const threshold = item.minStock || 10;
                return item.quantity <= threshold;
              })
              .slice(0, 5)
              .map(item => (
                <LowStockItem key={item.id} item={item} onAction={onAction} />
              ))}
          </div>
        </div>
      )}

      {/* Expiring Items */}
      {metrics.expiringSoonCount > 0 && (
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
            Items Expiring Soon
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {inventory
              .filter(item => {
                if (!item.expiryDate) return false;
                const now = new Date();
                const threeDaysFromNow = new Date(now);
                threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                const expiry = new Date(item.expiryDate);
                return expiry <= threeDaysFromNow && expiry >= now;
              })
              .slice(0, 5)
              .map(item => (
                <ExpiringItem key={item.id} item={item} onAction={onAction} />
              ))}
          </div>
        </div>
      )}

      {/* Inventory Insights */}
      {inventoryInsights.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {inventoryInsights.map(insight => (
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
            We need more inventory data before generating insights.
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

function LowStockItem({ item, onAction }) {
  const threshold = item.minStock || 10;
  const percentage = (item.quantity / threshold) * 100;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)'
    }}>
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
          {item.quantity} / {threshold} units
        </div>
      </div>
      <div style={{
        textAlign: 'right'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          color: percentage < 50 ? '#e74c3c' : '#f39c12'
        }}>
          {percentage.toFixed(0)}%
        </div>
        <button
          onClick={() => onAction?.({ type: 'NAVIGATE', target: 'inventory' })}
          style={{
            padding: '6px 12px',
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
          Order
        </button>
      </div>
    </div>
  );
}

function ExpiringItem({ item, onAction }) {
  const now = new Date();
  const expiry = new Date(item.expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      background: daysUntilExpiry <= 1 ? '#fee' : 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      border: daysUntilExpiry <= 1 ? '1px solid #e74c3c' : 'none'
    }}>
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
          Expires: {expiry.toLocaleDateString()}
        </div>
      </div>
      <div style={{
        textAlign: 'right'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          color: daysUntilExpiry <= 1 ? '#e74c3c' : '#f39c12'
        }}>
          {daysUntilExpiry}d
        </div>
        <button
          onClick={() => onAction?.({ type: 'NAVIGATE', target: 'inventory' })}
          style={{
            padding: '6px 12px',
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

export default InventoryIntelligence;
