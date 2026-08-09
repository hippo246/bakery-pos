import React from 'react';
import { useMemo, useState } from "react";
import { checkBackupHealth, getHealthData } from "../../utils/healthMonitoring.js";
import { HEALTH_STATUS, getHealthStatusColor } from "../../domain/healthModel.js";

function BackupHealth() {
  const [backupData, setBackupData] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useMemo(() => {
    const healthData = getHealthData();
    const backupCheck = checkBackupHealth();
    setBackupData({
      lastBackup: healthData?.lastBackup,
      ...backupCheck
    });
  }, []);

  if (!backupData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
        Loading backup information...
      </div>
    );
  }

  const lastBackup = backupData.lastBackup ? new Date(backupData.lastBackup) : null;
  const daysSinceBackup = lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const backupStatus = daysSinceBackup === null ? HEALTH_STATUS.CRITICAL :
                       daysSinceBackup <= 1 ? HEALTH_STATUS.HEALTHY :
                       daysSinceBackup <= 7 ? HEALTH_STATUS.WARNING : HEALTH_STATUS.CRITICAL;

  const backupMetrics = [
    { label: 'Last Backup', value: lastBackup ? lastBackup.toLocaleDateString() : 'Never', status: backupStatus },
    { label: 'Days Since Backup', value: daysSinceBackup ?? 'N/A', unit: 'days', status: backupStatus },
    { label: 'Backup Status', value: backupStatus, status: backupStatus },
    { label: 'Restore Test', value: 'Not Tested', status: HEALTH_STATUS.WARNING }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Backup Health</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
        {backupMetrics.map(metric => (
          <BackupMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {!lastBackup && (
        <div style={{ background: '#fee', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #e74c3c' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px' }}>
            🔴 No Backup Found
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)', marginBottom: '16px' }}>
            Your data is at risk. Create a backup immediately to protect against data loss.
          </div>
          <button style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', background: '#e74c3c', color: 'var(--cafe-text-primary)', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Create Backup Now
          </button>
        </div>
      )}

      {daysSinceBackup > 7 && (
        <div style={{ background: '#fff3cd', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #f39c12' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>
            🟡 Backup Outdated
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)', marginBottom: '16px' }}>
            Last backup was {daysSinceBackup} days ago. Regular backups are essential for data protection.
          </div>
          <button style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', background: '#f39c12', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
            Create New Backup
          </button>
        </div>
      )}

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Backup Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ScheduleRow day="Monday" status="COMPLETED" time="02:00 AM" />
          <ScheduleRow day="Tuesday" status="COMPLETED" time="02:00 AM" />
          <ScheduleRow day="Wednesday" status="PENDING" time="02:00 AM" />
          <ScheduleRow day="Thursday" status="SCHEDULED" time="02:00 AM" />
          <ScheduleRow day="Friday" status="SCHEDULED" time="02:00 AM" />
          <ScheduleRow day="Saturday" status="SCHEDULED" time="02:00 AM" />
          <ScheduleRow day="Sunday" status="SCHEDULED" time="02:00 AM" />
        </div>
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Backup Best Practices</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <TipCard title="Daily Backups" description="Schedule automatic daily backups for maximum protection" />
          <TipCard title="Off-site Storage" description="Store backups in a separate location for disaster recovery" />
          <TipCard title="Test Restores" description="Regularly test backup restoration to ensure data integrity" />
          <TipCard title="Retention Policy" description="Keep backups for at least 30 days for recovery options" />
        </div>
      </div>
    </div>
  );
}

function BackupMetricCard({ metric }) {
  const color = getHealthStatusColor(metric.status);
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: `1px solid ${color}` }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{metric.label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color }}>{metric.value} {metric.unit && <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--cafe-text-secondary)' }}>{metric.unit}</span>}</div>
    </div>
  );
}

function ScheduleRow({ day, status, time }) {
  const statusColors = {
    COMPLETED: '#27ae60',
    PENDING: '#f39c12',
    SCHEDULED: '#95a5a6',
    FAILED: '#e74c3c'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div style={{ fontSize: '14px', color: 'var(--cafe-text-primary)' }}>{day}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{time}</div>
        <div style={{ padding: '4px 12px', background: `${statusColors[status]}20`, color: statusColors[status], borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
          {status}
        </div>
      </div>
    </div>
  );
}

function TipCard({ title, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div style={{ fontSize: '20px' }}>💡</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{description}</div>
      </div>
    </div>
  );
}

export default BackupHealth;
