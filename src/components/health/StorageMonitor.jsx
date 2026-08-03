import React from 'react';
import { useMemo } from "react";
import { estimateStorageUsage, getStorageBreakdown, formatBytes } from "../../utils/healthMonitoring.js";
import { HEALTH_STATUS, getHealthStatusColor } from "../../domain/healthModel.js";

function StorageMonitor() {
  const storageData = useMemo(() => {
    const totalUsage = estimateStorageUsage();
    const breakdown = getStorageBreakdown();
    const estimatedLimit = 5 * 1024 * 1024;
    const usagePercent = (totalUsage / estimatedLimit) * 100;

    return { totalUsage, breakdown, estimatedLimit, usagePercent };
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const getStatus = (percent) => {
    if (percent >= 90) return { status: HEALTH_STATUS.CRITICAL, color: '#e74c3c' };
    if (percent >= 75) return { status: HEALTH_STATUS.WARNING, color: '#f39c12' };
    return { status: HEALTH_STATUS.HEALTHY, color: '#27ae60' };
  };

  const { status, color } = getStatus(storageData.usagePercent);

  const categories = [
    { name: 'Database', value: storageData.breakdown.database, icon: '🗄️' },
    { name: 'Images', value: storageData.breakdown.images, icon: '🖼️' },
    { name: 'Receipts', value: storageData.breakdown.receipts, icon: '🧾' },
    { name: 'Logs', value: storageData.breakdown.logs, icon: '📝' },
    { name: 'Exports', value: storageData.breakdown.exports, icon: '📤' },
    { name: 'Temporary', value: storageData.breakdown.temporary, icon: '🗑️' },
    { name: 'Other', value: storageData.breakdown.other, icon: '📦' }
  ].sort((a, b) => b.value - a.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Storage Monitor</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        <MetricCard label="Total Usage" value={formatBytes(storageData.totalUsage)} />
        <MetricCard label="Estimated Limit" value={formatBytes(storageData.estimatedLimit)} />
        <MetricCard label="Usage %" value={`${storageData.usagePercent.toFixed(1)}%`} color={color} />
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Storage Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map(cat => (
            <StorageCategory key={cat.name} category={cat} total={storageData.totalUsage} />
          ))}
        </div>
      </div>

      {storageData.usagePercent >= 75 && (
        <div style={{ background: storageData.usagePercent >= 90 ? '#fee' : '#fff3cd', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: `2px solid ${color}` }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color, marginBottom: '8px' }}>
            {storageData.usagePercent >= 90 ? '🔴 Critical: Storage Nearly Full' : '🟡 Warning: Storage Running Low'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
            {storageData.usagePercent >= 90 
              ? 'Storage is critically low. Clear temporary files and consider exporting old data immediately.'
              : 'Storage is running low. Consider clearing cache and temporary files to free up space.'}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: color || 'var(--cafe-text-primary)' }}>{value}</div>
    </div>
  );
}

function StorageCategory({ category, total }) {
  const percent = total > 0 ? (category.value / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '20px' }}>{category.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{category.name}</span>
          <span style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>{formatBytes(category.value)}</span>
        </div>
        <div style={{ height: '8px', background: 'var(--cafe-bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--cafe-primary)', width: `${percent}%`, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
}

export default StorageMonitor;
