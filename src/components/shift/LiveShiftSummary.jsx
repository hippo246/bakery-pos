import React from 'react';
import { useMemo } from "react";
import { PAYMENT_TYPES } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function LiveShiftSummary({ shift, orders }) {
  const isMobile = useIsMobile();

  // Calculate live payment breakdown
  const paymentBreakdown = useMemo(() => {
    if (!shift) return {};

    const breakdown = {};
    Object.values(PAYMENT_TYPES).forEach(type => {
      breakdown[type] = {
        expected: shift.payments?.[type]?.expected || 0,
        actual: shift.payments?.[type]?.actual || 0,
        difference: shift.payments?.[type]?.difference || 0
      };
    });
    return breakdown;
  }, [shift]);

  // Calculate order statistics
  const orderStats = useMemo(() => {
    if (!shift || !orders) return null;

    const shiftOrders = orders.filter(o => {
      const orderTime = new Date(o.createdAt);
      const shiftStart = new Date(shift.openedAt);
      return orderTime >= shiftStart;
    });

    return {
      total: shiftOrders.length,
      completed: shiftOrders.filter(o => o.status === 'COMPLETED').length,
      cancelled: shiftOrders.filter(o => o.status === 'CANCELLED').length,
      refunds: shiftOrders.filter(o => o.refunded).length
    };
  }, [shift, orders]);

  if (!shift) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--cafe-text-primary)'
      }}>
        Live Shift Summary
      </div>

      {/* Sales Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <SummaryCard
          label="Gross Sales"
          value={formatCurrency(shift.grossSales)}
          icon="💰"
          trend="+12%"
        />
        <SummaryCard
          label="Net Sales"
          value={formatCurrency(shift.netSales)}
          icon="📊"
          trend="+10%"
        />
        <SummaryCard
          label="Average Order"
          value={formatCurrency(shift.averageOrderValue)}
          icon="📈"
          trend="+5%"
        />
      </div>

      {/* Order Statistics */}
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
          Order Statistics
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <StatItem label="Total Orders" value={shift.orderCount} color="#3498db" />
          <StatItem label="Completed" value={orderStats?.completed || 0} color="#27ae60" />
          <StatItem label="Cancelled" value={shift.cancelledOrders} color="#e74c3c" />
          <StatItem label="Refunds" value={shift.refunds} color="#f39c12" />
        </div>
      </div>

      {/* Payment Breakdown */}
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
          Payment Breakdown
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          <PaymentCard
            type="Cash"
            expected={paymentBreakdown[PAYMENT_TYPES.CASH]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.CASH]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.CASH]?.difference}
            icon="💵"
          />
          <PaymentCard
            type="UPI"
            expected={paymentBreakdown[PAYMENT_TYPES.UPI]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.UPI]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.UPI]?.difference}
            icon="📱"
          />
          <PaymentCard
            type="Card"
            expected={paymentBreakdown[PAYMENT_TYPES.CARD]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.CARD]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.CARD]?.difference}
            icon="💳"
          />
          <PaymentCard
            type="Online"
            expected={paymentBreakdown[PAYMENT_TYPES.ONLINE]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.ONLINE]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.ONLINE]?.difference}
            icon="🌐"
          />
          <PaymentCard
            type="Gift Card"
            expected={paymentBreakdown[PAYMENT_TYPES.GIFT_CARD]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.GIFT_CARD]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.GIFT_CARD]?.difference}
            icon="🎁"
          />
          <PaymentCard
            type="Split"
            expected={paymentBreakdown[PAYMENT_TYPES.SPLIT]?.expected}
            actual={paymentBreakdown[PAYMENT_TYPES.SPLIT]?.actual}
            difference={paymentBreakdown[PAYMENT_TYPES.SPLIT]?.difference}
            icon="🔀"
          />
        </div>
      </div>

      {/* Adjustments */}
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
          Adjustments
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <AdjustmentItem label="Discounts" value={formatCurrency(shift.discounts)} type="negative" />
          <AdjustmentItem label="Voids" value={formatCurrency(shift.voids)} type="negative" />
          <AdjustmentItem label="Refunds" value={formatCurrency(shift.refunds)} type="negative" />
          <AdjustmentItem label="Cancelled" value={shift.cancelledOrders} type="count" />
        </div>
      </div>

      {/* Operational Metrics */}
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
          Operational Metrics
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <MetricItem label="Customers Served" value={shift.customersServed} icon="👥" />
          <MetricItem label="Kitchen Tickets" value={shift.kitchenTickets} icon="👨‍🍳" />
          <MetricItem label="Reservations" value={shift.reservations} icon="📅" />
          <MetricItem label="Voids" value={shift.voids} icon="❌" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, trend }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '32px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--cafe-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px'
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
        {trend && (
          <div style={{
            fontSize: '12px',
            color: '#27ae60',
            marginTop: '4px'
          }}>
            {trend} vs last shift
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
    </div>
  );
}

function PaymentCard({ type, expected, actual, difference, icon }) {
  const hasDifference = Math.abs(difference) > 0.01;
  const isPositive = difference > 0;

  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      padding: '16px',
      border: hasDifference ? '1px solid #f39c12' : '1px solid var(--cafe-border-light)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--cafe-text-primary)'
        }}>
          {type}
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          Expected
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--cafe-text-primary)'
        }}>
          {formatCurrency(expected)}
        </span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--cafe-text-secondary)'
        }}>
          Actual
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--cafe-text-primary)'
        }}>
          {formatCurrency(actual)}
        </span>
      </div>
      {hasDifference && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--cafe-border-light)'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--cafe-text-secondary)'
          }}>
            Difference
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: isPositive ? '#27ae60' : '#e74c3c'
          }}>
            {isPositive ? '+' : ''}{formatCurrency(difference)}
          </span>
        </div>
      )}
    </div>
  );
}

function AdjustmentItem({ label, value, type }) {
  const isNegative = type === 'negative';
  
  return (
    <div style={{
      padding: '16px',
      background: isNegative ? '#fee' : 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      textAlign: 'center',
      border: isNegative ? '1px solid #fcc' : '1px solid var(--cafe-border-light)'
    }}>
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: isNegative ? '#e74c3c' : 'var(--cafe-text-primary)',
        marginBottom: '4px'
      }}>
        {isNegative ? '-' : ''}{value}
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
    </div>
  );
}

function MetricItem({ label, value, icon }) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--cafe-text-secondary)',
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default LiveShiftSummary;
