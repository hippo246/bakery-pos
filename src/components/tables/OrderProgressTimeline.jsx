import React, { useState, useEffect, useMemo } from 'react';
/**
 * Order Progress Timeline
 * Visual timeline showing order journey from creation to completion
 */


function OrderProgressTimeline({ order, kitchenStatus = null }) {
  // Tick every 30s so elapsed/duration values stay live without needing new props
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!order || order.status?.toUpperCase() === 'CANCELLED' || order.status?.toUpperCase() === 'COMPLETED') {
      return; // no need to keep ticking once the order is done
    }
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [order?.status]);

  if (!order) {
    return (
      <div style={{
        padding: 16,
        textAlign: 'center',
        color: 'var(--cafe-text-tertiary)',
        fontSize: 13
      }}>
        No active order
      </div>
    );
  }

  // Timeline stages
  const stages = [
    { key: 'created', label: 'Order Taken', icon: '📝' },
    { key: 'accepted', label: 'Kitchen Accepted', icon: '👨‍🍳' },
    { key: 'cooking', label: 'Cooking', icon: '🍳' },
    { key: 'ready', label: 'Ready', icon: '✅' },
    { key: 'collected', label: 'Collected', icon: '🧺' },
    { key: 'served', label: 'Served', icon: '🍽️' },
    { key: 'dining', label: 'Dining', icon: '🍴' },
    { key: 'bill', label: 'Bill Requested', icon: '🧾' },
    { key: 'paid', label: 'Paid', icon: '💳' },
    { key: 'cleaning', label: 'Cleaning', icon: '🧹' }
  ];

  const isCancelled = order.status?.toUpperCase() === 'CANCELLED';

  // Determine current stage based on order status.
  // order.statusHistory (if present) is an array of { status, at } entries logged
  // by the backend as the order actually moves through each stage - when it's
  // available we trust it completely instead of guessing from a single status field.
  const statusToStageKey = {
    'NEW': 'created',
    'PENDING': 'created',
    'ACCEPTED': 'accepted',
    'CONFIRMED': 'accepted',
    'PREPARING': 'cooking',
    'COOKING': 'cooking',
    'READY': 'ready',
    'COLLECTED': 'collected',
    'SERVED': 'served',
    'DINING': 'dining',
    'BILL_REQUESTED': 'bill',
    'PAID': 'paid',
    'COMPLETED': 'paid',
    'CLEANING': 'cleaning',
    'CANCELLED': null
  };

  const stageTimestamps = useMemo(() => {
    const map = {};
    if (Array.isArray(order.statusHistory)) {
      order.statusHistory.forEach(entry => {
        const key = statusToStageKey[entry.status?.toUpperCase()];
        if (key && entry.at) map[key] = entry.at;
      });
    }
    // Always anchor the first stage to when the order was actually created
    if (!map.created && order.createdAt) map.created = order.createdAt;
    return map;
  }, [order.statusHistory, order.createdAt]);

  const getCurrentStage = () => {
    const status = order.status?.toUpperCase();
    if (status && status in statusToStageKey) return statusToStageKey[status];
    return 'created';
  };

  const currentStage = getCurrentStage();
  const currentStageIndex = stages.findIndex(s => s.key === currentStage);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // How long a stage took (or has been running, for the current stage).
  // Prefers real timestamps from statusHistory; falls back to a rough estimate
  // split from total elapsed time only when no history is available at all.
  const getStageDuration = (stageKey, index) => {
    const hasRealTimestamps = Object.keys(stageTimestamps).length > 0;

    if (hasRealTimestamps) {
      const start = stageTimestamps[stageKey];
      if (!start) return null;
      const nextStage = stages[index + 1];
      const end = nextStage && stageTimestamps[nextStage.key] ? new Date(stageTimestamps[nextStage.key]).getTime() : now;
      const minutes = Math.max(0, Math.floor((end - new Date(start).getTime()) / 60000));
      return minutes;
    }

    // Fallback: no per-stage data at all, just estimate from total elapsed time
    if (!order.createdAt) return null;
    const created = new Date(order.createdAt).getTime();
    const elapsed = Math.max(0, Math.floor((now - created) / 60000)); // minutes

    const stageDurations = {
      created: Math.min(elapsed, 2),
      accepted: elapsed > 2 ? Math.min(elapsed - 2, 3) : 0,
      cooking: elapsed > 5 ? Math.min(elapsed - 5, 15) : 0,
      ready: elapsed > 20 ? Math.min(elapsed - 20, 5) : 0,
      collected: elapsed > 25 ? Math.min(elapsed - 25, 2) : 0,
      served: elapsed > 27 ? Math.min(elapsed - 27, 1) : 0,
      dining: elapsed > 28 ? elapsed - 28 : 0,
      bill: elapsed > 60 ? Math.min(elapsed - 60, 5) : 0,
      paid: elapsed > 65 ? elapsed - 65 : 0,
      cleaning: elapsed > 70 ? elapsed - 70 : 0
    };

    return stageDurations[stageKey];
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
        Order Progress
      </div>

      {isCancelled && (
        <div style={{
          marginBottom: 16,
          padding: 12,
          background: 'var(--cafe-danger-bg, rgba(220,53,69,0.1))',
          border: '1px solid var(--cafe-danger-border, var(--cafe-danger))',
          borderRadius: 'var(--cafe-radius-sm)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--cafe-danger, #dc3545)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>❌</span>
          <span>This order was cancelled{order.cancelledAt ? ` at ${formatTime(order.cancelledAt)}` : ''}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: isCancelled ? 0.5 : 1 }}>
        {stages.map((stage, index) => {
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const duration = getStageDuration(stage.key, index);
          const stageTime = stageTimestamps[stage.key];

          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                background: isCurrent 
                  ? 'var(--cafe-accent-bg)' 
                  : isCompleted 
                    ? 'var(--cafe-success-bg)' 
                    : 'var(--cafe-bg-surface)',
                border: isCurrent 
                  ? '1px solid var(--cafe-accent-border)' 
                  : isCompleted 
                    ? '1px solid var(--cafe-success-border)' 
                    : '1px solid var(--cafe-border-light)',
                opacity: isCompleted || isCurrent ? 1 : 0.4
              }}
            >
              {/* Icon */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isCurrent 
                  ? 'var(--cafe-accent)' 
                  : isCompleted 
                    ? 'var(--cafe-success)' 
                    : 'var(--cafe-bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}>
                {isCompleted ? '✓' : stage.icon}
              </div>

              {/* Stage Info */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: isCurrent 
                    ? 'var(--cafe-accent)' 
                    : isCompleted 
                      ? 'var(--cafe-success)' 
                      : 'var(--cafe-text-secondary)' 
                }}>
                  {stage.label}
                </div>
                {duration !== null && duration > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                    {duration}m
                  </div>
                )}
              </div>

              {/* Timestamp */}
              {isCompleted && stageTime && (
                <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                  {formatTime(stageTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kitchen Status */}
      {kitchenStatus && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-sm)',
          border: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>
            Kitchen Status
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            {kitchenStatus}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div style={{
        marginTop: 16,
        padding: 12,
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-sm)',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>
          Order Total
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(order.total || 0)}
        </div>
      </div>
    </div>
  );
}

export default OrderProgressTimeline;
