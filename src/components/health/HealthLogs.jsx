import React from 'react';
import { useState, useMemo } from "react";
import { getHealthLogs } from "../../utils/healthMonitoring.js";
import { LOG_LEVELS } from "../../domain/healthModel.js";

function HealthLogs() {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const logs = useMemo(() => getHealthLogs(), []);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (filter !== 'ALL') {
      filtered = filtered.filter(log => {
        if (filter === 'TODAY') {
          return new Date(log.startedAt).toDateString() === new Date().toDateString();
        }
        if (filter === 'WEEK') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(log.startedAt) >= weekAgo;
        }
        if (filter === 'CRITICAL') {
          return log.status === 'FAILED';
        }
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.operation?.toLowerCase().includes(query) ||
        log.error?.toLowerCase().includes(query) ||
        log.result?.toString().toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [logs, filter, searchQuery]);

  const logCounts = useMemo(() => ({
    total: logs.length,
    today: logs.filter(l => new Date(l.startedAt).toDateString() === new Date().toDateString()).length,
    critical: logs.filter(l => l.status === 'FAILED').length
  }), [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Health Logs</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        <LogCountCard label="Total Logs" count={logCounts.total} />
        <LogCountCard label="Today" count={logCounts.today} />
        <LogCountCard label="Critical" count={logCounts.critical} color="#e74c3c" />
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All</FilterButton>
        <FilterButton active={filter === 'TODAY'} onClick={() => setFilter('TODAY')}>Today</FilterButton>
        <FilterButton active={filter === 'WEEK'} onClick={() => setFilter('WEEK')}>This Week</FilterButton>
        <FilterButton active={filter === 'CRITICAL'} onClick={() => setFilter('CRITICAL')}>Critical</FilterButton>
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search logs..."
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '14px',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 'var(--cafe-radius-md)',
          background: 'var(--cafe-bg-elevated)',
          color: 'var(--cafe-text-primary)'
        }}
      />

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>
          Log Entries ({filteredLogs.length})
        </div>
        {filteredLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredLogs.map(log => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
            No logs found matching your filters
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

function LogCountCard({ label, count, color }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: color ? `1px solid ${color}` : '1px solid var(--cafe-border-light)' }}>
      <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: color || 'var(--cafe-text-primary)' }}>{count}</div>
    </div>
  );
}

function LogEntry({ log }) {
  const statusColors = {
    COMPLETED: '#27ae60',
    FAILED: '#e74c3c',
    PENDING: '#f39c12'
  };

  return (
    <div style={{ padding: '16px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)', borderLeft: `4px solid ${statusColors[log.status]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{log.operation.replace('_', ' ')}</div>
          <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{new Date(log.startedAt).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {log.duration && <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{log.duration}ms</div>}
          <div style={{ padding: '4px 12px', background: `${statusColors[log.status]}20`, color: statusColors[log.status], borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
            {log.status}
          </div>
        </div>
      </div>
      {log.initiatedBy && (
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '4px' }}>
          Initiated by: {log.initiatedBy}
        </div>
      )}
      {log.error && (
        <div style={{ fontSize: '13px', color: '#e74c3c', marginTop: '8px', padding: '8px', background: '#fee', borderRadius: 'var(--cafe-radius-sm)' }}>
          Error: {log.error}
        </div>
      )}
      {log.result && typeof log.result === 'object' && (
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginTop: '8px' }}>
          Result: {JSON.stringify(log.result)}
        </div>
      )}
    </div>
  );
}

export default HealthLogs;
