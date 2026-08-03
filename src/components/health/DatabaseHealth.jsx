import React from 'react';
import { useMemo, useState } from "react";
import { checkDatabaseHealth } from "../../utils/healthMonitoring.js";
import { HEALTH_STATUS, getHealthStatusColor } from "../../domain/healthModel.js";

function DatabaseHealth() {
  const [isChecking, setIsChecking] = useState(false);
  const [dbHealth, setDbHealth] = useState(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const result = checkDatabaseHealth();
      setDbHealth(result);
    } catch (e) {
      console.error('Database health check failed:', e);
    } finally {
      setIsChecking(false);
    }
  };

  useMemo(() => {
    runCheck();
  }, []);

  const recordCounts = useMemo(() => {
    const counts = {};
    try {
      counts.orders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]').length;
      counts.customers = JSON.parse(localStorage.getItem('cafeos_customers') || '[]').length;
      counts.inventory = JSON.parse(localStorage.getItem('cafeos_inventory') || '[]').length;
      counts.menu = JSON.parse(localStorage.getItem('cafeos_menu') || '[]').length;
      counts.tables = JSON.parse(localStorage.getItem('cafeos_tables') || '[]').length;
      counts.staff = JSON.parse(localStorage.getItem('cafeos_staff') || '[]').length;
    } catch (e) {
      console.error('Failed to count records:', e);
    }
    return counts;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Database Health</div>
        <button onClick={runCheck} disabled={isChecking} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: isChecking ? 'not-allowed' : 'pointer' }}>
          {isChecking ? 'Checking...' : 'Run Check'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
        <RecordCountCard label="Orders" count={recordCounts.orders} icon="📋" />
        <RecordCountCard label="Customers" count={recordCounts.customers} icon="👥" />
        <RecordCountCard label="Inventory" count={recordCounts.inventory} icon="📦" />
        <RecordCountCard label="Menu Items" count={recordCounts.menu} icon="📜" />
      </div>

      {dbHealth && (
        <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Health Metrics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dbHealth.metrics.map(metric => (
              <HealthMetric key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {dbHealth?.alerts && dbHealth.alerts.length > 0 && (
        <div style={{ background: '#fee', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #e74c3c' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#e74c3c', marginBottom: '16px' }}>🔴 Database Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dbHealth.alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Record Counts</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          <RecordCountCard label="Tables" count={recordCounts.tables} icon="🪑" />
          <RecordCountCard label="Staff" count={recordCounts.staff} icon="👨‍🍳" />
          <RecordCountCard label="Reservations" count={JSON.parse(localStorage.getItem('cafeos_reservations') || '[]').length} icon="📅" />
        </div>
      </div>
    </div>
  );
}

function RecordCountCard({ label, count, icon }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{label}</div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{count}</div>
    </div>
  );
}

function HealthMetric({ metric }) {
  const color = getHealthStatusColor(metric.status);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{metric.metadata?.type || 'Metric'}</div>
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{metric.value} {metric.unit}</div>
      </div>
      <div style={{ padding: '4px 12px', background: `${color}20`, color, borderRadius: 'var(--cafe-radius-sm)', fontSize: '12px', fontWeight: '600' }}>
        {metric.status}
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  return (
    <div style={{ padding: '12px', background: 'white', borderRadius: 'var(--cafe-radius-md)', border: '1px solid #e74c3c' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '4px' }}>{alert.title}</div>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{alert.description}</div>
      <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: '600' }}>Action: {alert.suggestedAction}</div>
    </div>
  );
}

export default DatabaseHealth;
