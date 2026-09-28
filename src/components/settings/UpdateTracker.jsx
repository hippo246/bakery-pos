import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'bakerypos_update_tracker';

// Initialize tracker if it doesn't exist
const initializeTracker = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const initialTracker = {
        currentVersion: 0,
        updates: [],
        lastUpdated: new Date().toISOString(),
        projectStarted: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTracker));
      return initialTracker;
    }
    return JSON.parse(existing);
  } catch (error) {
    console.error('Failed to initialize update tracker:', error);
    return {
      currentVersion: 0,
      updates: [],
      lastUpdated: new Date().toISOString(),
      projectStarted: new Date().toISOString()
    };
  }
};

// Add initial project updates if tracker is empty
const addInitialUpdates = (tracker) => {
  if (tracker.updates.length > 0) return tracker;

  const initialUpdates = [
    {
      version: 1,
      type: 'feature',
      category: 'integration',
      description: 'Implemented complete real-time workflow system with OrderEventManager and OrderWorkflowService for cross-tab synchronization between orders, tables, kitchen, tokens, and waiters',
      agent: 'Devin',
      filesModified: ['src/services/OrderEventManager.js', 'src/services/OrderWorkflowService.js', 'src/components/tables/ToastTables.jsx', 'src/components/kitchen/Kitchen.jsx', 'src/components/waiters/Waiters.jsx', 'src/components/tokens/TokenManagement.jsx', 'src/components/orders/ToastOrders.jsx'],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 2,
      type: 'feature',
      category: 'ui',
      description: 'Improved ToastTables visual differentiation with better borders, spacing, table status indicators, and added "being cleaned" status with cyan visual treatment',
      agent: 'Devin',
      filesModified: ['src/components/tables/ToastTables.jsx'],
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 3,
      type: 'feature',
      category: 'general',
      description: 'Created UpdateTracker component with version management, statistics, and change history tracking integrated into Settings',
      agent: 'Devin',
      filesModified: ['src/components/settings/UpdateTracker.jsx', 'src/components/settings/Settings.jsx', 'UPDATE_TRACKER_GUIDE.md', 'ORDER_WORKFLOW_INTEGRATION.md'],
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 4,
      type: 'bugfix',
      category: 'ui',
      description: 'Fixed Settings component styling - reduced padding, border radius, improved colors, fixed duplicate boxSizing property',
      agent: 'Devin',
      filesModified: ['src/components/settings/Settings.jsx'],
      timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 5,
      type: 'bugfix',
      category: 'ui',
      description: 'Fixed React controlled checkbox warnings - added readOnly to disabled checkboxes and corrected cursor styles in SplitKDS and RoleSecurityPanel',
      agent: 'Devin',
      filesModified: ['src/components/kitchen/SplitKDS.jsx', 'src/components/settings/panels/RoleSecurityPanel.jsx'],
      timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 6,
      type: 'documentation',
      category: 'documentation',
      description: 'Comprehensive audit of Orders and ToastOrders components - identified 26 issues including 8 critical bugs (stale state, duplicate KOT creation, table status not updated after payment, duplicate token generation, missing specialRequest/orderType, empty useEffect deps, missing customerName)',
      agent: 'Devin',
      filesModified: ['ORDERS_AUDIT_REPORT.md'],
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      version: 7,
      type: 'bugfix',
      category: 'backend',
      description: 'Fixed all 8 critical and 11 high-priority issues from audit: stale state management, duplicate KOT creation, table status after payment, duplicate token generation, missing fields, useEffect deps, error handling, payment validation, inventory atomicity, email errors, workflow persistence, order:cancelled event, multiple held orders, removed history/token limits, kitchen delay, magic numbers extracted to config',
      agent: 'Devin',
      filesModified: ['src/components/orders/ToastOrders.jsx', 'src/services/OrderWorkflowService.js', 'src/services/OrderEventManager.js', 'src/config/orderConfig.js'],
      timestamp: new Date().toISOString()
    },
    {
      version: 8,
      type: 'feature',
      category: 'ui',
      description: 'Created new dashboard layout matching reference design with summary cards, revenue chart, top selling items, category statistics, active orders, and sales performance widgets. Added toggle in Settings to switch between standard and new dashboard layouts.',
      agent: 'Devin',
      filesModified: ['src/components/dashboard/NewDashboard.jsx', 'src/components/BakeryPOS.jsx', 'src/components/settings/Settings.jsx'],
      timestamp: new Date().toISOString()
    }
  ];

  const updatedTracker = {
    ...tracker,
    currentVersion: 8,
    updates: initialUpdates.reverse(),
    lastUpdated: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracker));
  return updatedTracker;
};

export default function UpdateTracker({ darkMode = false }) {
  const [tracker, setTracker] = useState(() => addInitialUpdates(initializeTracker()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    type: 'feature',
    category: 'general',
    description: '',
    agent: 'Unknown',
    filesModified: []
  });

  const theme = darkMode ? {
    bg: '#0f0f0f',
    card: '#1a1a1a',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textSecondary: '#64748b',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const typeColors = {
    feature: theme.success,
    bugfix: theme.danger,
    improvement: theme.accent,
    refactor: theme.warning,
    documentation: theme.textSecondary
  };

  const categoryIcons = {
    ui: '🎨',
    backend: '⚙️',
    database: '🗄️',
    api: '🔌',
    integration: '🔗',
    performance: '⚡',
    security: '🔒',
    testing: '🧪',
    documentation: '📝',
    general: '📦'
  };

  const loadTracker = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setTracker(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load tracker:', error);
    }
  };

  const saveTracker = (updatedTracker) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTracker));
      setTracker(updatedTracker);
    } catch (error) {
      console.error('Failed to save tracker:', error);
    }
  };

  const addUpdate = () => {
    if (!newUpdate.description.trim()) {
      alert('Please provide a description');
      return;
    }

    const updatedTracker = {
      ...tracker,
      currentVersion: tracker.currentVersion + 1,
      updates: [
        {
          version: tracker.currentVersion + 1,
          type: newUpdate.type,
          category: newUpdate.category,
          description: newUpdate.description,
          agent: newUpdate.agent,
          filesModified: newUpdate.filesModified,
          timestamp: new Date().toISOString()
        },
        ...tracker.updates
      ],
      lastUpdated: new Date().toISOString()
    };

    saveTracker(updatedTracker);
    setShowAddModal(false);
    setNewUpdate({
      type: 'feature',
      category: 'general',
      description: '',
      agent: 'Unknown',
      filesModified: []
    });
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionStats = () => {
    const stats = {
      total: tracker.updates.length,
      features: tracker.updates.filter(u => u.type === 'feature').length,
      bugfixes: tracker.updates.filter(u => u.type === 'bugfix').length,
      improvements: tracker.updates.filter(u => u.type === 'improvement').length,
      refactors: tracker.updates.filter(u => u.type === 'refactor').length,
      documentation: tracker.updates.filter(u => u.type === 'documentation').length
    };
    return stats;
  };

  const stats = getVersionStats();

  return (
    <div style={{
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: theme.bg,
      minHeight: '100vh',
      color: theme.text
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${theme.border}`
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          📋 Update Tracker
        </h1>
        <p style={{
          margin: 0,
          color: theme.textSecondary,
          fontSize: '14px'
        }}>
          Track all project changes. Current Version: <strong>v{tracker.currentVersion}</strong>
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: theme.accent }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
            Total Updates
          </div>
        </div>
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: theme.success }}>
            {stats.features}
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
            Features
          </div>
        </div>
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: theme.danger }}>
            {stats.bugfixes}
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
            Bug Fixes
          </div>
        </div>
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: theme.accent }}>
            {stats.improvements}
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
            Improvements
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', color: theme.textSecondary }}>
          Project started: {formatTimestamp(tracker.projectStarted)}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: theme.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Add Update
        </button>
      </div>

      {/* Updates List */}
      <div style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {tracker.updates.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: theme.textSecondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No updates yet
            </div>
            <div style={{ fontSize: '14px' }}>
              Start tracking your project changes by adding the first update
            </div>
          </div>
        ) : (
          tracker.updates.map((update, index) => (
            <div
              key={update.version}
              style={{
                padding: '16px',
                borderBottom: index < tracker.updates.length - 1 ? `1px solid ${theme.border}` : 'none',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              {/* Version Badge */}
              <div style={{
                minWidth: '60px',
                padding: '8px 12px',
                background: typeColors[update.type] || theme.textSecondary,
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                v{update.version}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>
                    {update.description}
                  </span>
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {categoryIcons[update.category] || '📦'} {update.category}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>
                  By {update.agent} • {formatTimestamp(update.timestamp)}
                </div>
                {update.filesModified && update.filesModified.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {update.filesModified.map((file, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: theme.bg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '4px',
                          color: theme.textSecondary,
                          fontFamily: 'monospace'
                        }}
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Type Badge */}
              <div style={{
                padding: '4px 8px',
                background: `${typeColors[update.type]}22`,
                color: typeColors[update.type],
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                {update.type}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Update Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '20px'
            }}>
              Add Update Entry
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Type *
                </label>
                <select
                  value={newUpdate.type}
                  onChange={(e) => setNewUpdate({ ...newUpdate, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px'
                  }}
                >
                  <option value="feature">Feature</option>
                  <option value="bugfix">Bug Fix</option>
                  <option value="improvement">Improvement</option>
                  <option value="refactor">Refactor</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Category *
                </label>
                <select
                  value={newUpdate.category}
                  onChange={(e) => setNewUpdate({ ...newUpdate, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px'
                  }}
                >
                  <option value="general">General</option>
                  <option value="ui">UI/UX</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="api">API</option>
                  <option value="integration">Integration</option>
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="testing">Testing</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Description *
                </label>
                <textarea
                  value={newUpdate.description}
                  onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                  placeholder="Describe what was changed..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={newUpdate.agent}
                  onChange={(e) => setNewUpdate({ ...newUpdate, agent: e.target.value })}
                  placeholder="e.g., Devin, Claude, Human"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Files Modified (optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={newUpdate.filesModified.join(', ')}
                  onChange={(e) => setNewUpdate({ 
                    ...newUpdate, 
                    filesModified: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                  })}
                  placeholder="e.g., src/components/Tables.jsx, src/services/OrderService.js"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.text,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addUpdate}
                  style={{
                    padding: '10px 20px',
                    background: theme.accent,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}