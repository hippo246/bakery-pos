import React from 'react';
import { useMemo, useState } from "react";
import { getHealthData, acknowledgeAlert, resolveAlert } from "../../utils/healthMonitoring.js";
import { HEALTH_STATUS, getHealthStatusColor, getHealthStatusEmoji } from "../../domain/healthModel.js";

function OperationalAlerts() {
  const [filter, setFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useMemo(() => {
    const healthData = getHealthData();
    setAlerts(healthData?.alerts || []);
  }, []);

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'CRITICAL':
        return alerts.filter(a => a.severity === HEALTH_STATUS.CRITICAL && !a.resolved);
      case 'WARNING':
        return alerts.filter(a => a.severity === HEALTH_STATUS.WARNING && !a.resolved);
      case 'RESOLVED':
        return alerts.filter(a => a.resolved);
      case 'ALL':
      default:
        return alerts.filter(a => !a.resolved);
    }
  }, [alerts, filter]);

  const handleAcknowledge = (alert) => {
    const updated = acknowledgeAlert(alert, 'current-user');
    setAlerts(alerts.map(a => a.id === alert.id ? updated : a));
  };

  const handleResolve = (alert) => {
    const updated = resolveAlert(alert);
    setAlerts(alerts.map(a => a.id === alert.id ? updated : a));
  };

  const criticalCount = alerts.filter(a => a.severity === HEALTH_STATUS.CRITICAL && !a.resolved).length;
  const warningCount = alerts.filter(a => a.severity === HEALTH_STATUS.WARNING && !a.resolved).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Operational Alerts</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All</FilterButton>
          <FilterButton active={filter === 'CRITICAL'} onClick={() => setFilter('CRITICAL')}>Critical</FilterButton>
          <FilterButton active={filter === 'WARNING'} onClick={() => setFilter('WARNING')}>Warning</FilterButton>
          <FilterButton active={filter === 'RESOLVED'} onClick={() => setFilter('RESOLVED')}>Resolved</FilterButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        <AlertSummaryCard label="Critical" count={criticalCount} color="#e74c3c" />
        <AlertSummaryCard label="Warning" count={warningCount} color="#f39c12" />
        <AlertSummaryCard label="Resolved" count={alerts.filter(a => a.resolved).length} color="#27ae60" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', color: 'var(--cafe-text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✅</div>
            <div>No alerts found</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: active ? 'var(--cafe-primary)' : 'var(--cafe-bg-elevated)', color: active ? 'white' : 'var(--cafe-text-primary)', border: active ? 'none' : '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
      {children}
    </button>
  );
}

function AlertSummaryCard({ label, count, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: `1px solid ${color}` }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color }}>{count}</div>
    </div>
  );
}

function AlertCard({ alert, onAcknowledge, onResolve }) {
  const color = getHealthStatusColor(alert.severity);
  const emoji = getHealthStatusEmoji(alert.severity);

  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: `2px solid ${color}`, borderLeft: `6px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{emoji}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{alert.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{alert.category} • {new Date(alert.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div style={{ padding: '4px 12px', background: `${color}20`, color, borderRadius: 'var(--cafe-radius-sm)', fontSize: '12px', fontWeight: '600' }}>
          {alert.severity}
        </div>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--cafe-text-primary)', marginBottom: '8px' }}>
        {alert.description}
      </div>

      {alert.impact && (
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>
          <strong>Impact:</strong> {alert.impact}
        </div>
      )}

      {alert.suggestedAction && (
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '12px' }}>
          <strong>Action:</strong> {alert.suggestedAction}
        </div>
      )}

      {!alert.resolved && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {!alert.acknowledged && (
            <button onClick={() => onAcknowledge(alert)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
              Acknowledge
            </button>
          )}
          <button onClick={() => onResolve(alert)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: '#27ae60', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
            Resolve
          </button>
        </div>
      )}

      {alert.resolved && (
        <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>
          ✓ Resolved on {new Date(alert.resolvedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default OperationalAlerts;
