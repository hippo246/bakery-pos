import React, { useState } from 'react';

const UPDATES = [
  {
    version: 'v1.1.0',
    date: '2025-01-23',
    label: 'Latest',
    changes: [
      { type: 'improvement', text: 'Implemented checkout mode in ToastOrders - clicking checkout now replaces the entire menu view with a dedicated checkout screen showing order summary, item breakdown, and payment details. Added back button to return to menu. Checkout mode hides the menu categories and replaces the right panel with order summary and total breakdown including subtotal, discount, service charge, GST, and tip.' },
    ]
  },
  {
    version: 'v1.0.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'improvement', text: 'Rewrote UpdateTracker to match reference design - removed user add capability, using static updates array, added timeline UI with expandable cards, type filter pills, and tab navigation (Changelog, Roadmap, Feature Requests, Beta Program, Feedback). No Firebase integration - uses local state only.' },
    ]
  },
  {
    version: 'v0.14.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'fix', text: 'Fixed ReferenceError: tokens is not defined. Added tokens state and prop to BrewCRM, BakeryPOS, and LOCAL_COLLECTION_KEYS.' },
    ]
  },
  {
    version: 'v0.13.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'Full workflow integration for both dashboards - paired with all tabs (Orders, Tables, Kitchen, Waiters, Tokens, Customers). Subscribed to all 15 event types from OrderEventManager.' },
    ]
  },
  {
    version: 'v0.12.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'Integrated OrderEventManager real-time workflow into NewDashboard and RestaurantDashboard. Both dashboards now subscribe to order events for real-time updates.' },
    ]
  },
  {
    version: 'v0.11.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'Restaurant Management Dashboard layout with overview cards, monthly income chart, top categories, POS overview with payment breakdown, recent orders table, and staff on duty section.' },
    ]
  },
  {
    version: 'v0.10.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'New dashboard layout matching reference design with summary cards, revenue chart, top selling items, category statistics, active orders, and sales performance widgets.' },
    ]
  },
  {
    version: 'v0.9.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'fix', text: 'Fixed all 8 critical and 11 high-priority issues from audit: stale state management, duplicate KOT creation, table status after payment, duplicate token generation, missing fields, useEffect deps, error handling, payment validation, inventory atomicity, email errors, workflow persistence, order:cancelled event, multiple held orders, removed history/token limits, kitchen delay, magic numbers extracted to config.' },
    ]
  },
  {
    version: 'v0.8.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'documentation', text: 'Comprehensive audit of Orders and ToastOrders components - identified 26 issues including 8 critical bugs.' },
    ]
  },
  {
    version: 'v0.7.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'fix', text: 'React controlled checkbox warnings - added readOnly to disabled checkboxes and corrected cursor styles in SplitKDS and RoleSecurityPanel.' },
    ]
  },
  {
    version: 'v0.6.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'fix', text: 'Settings component styling - reduced padding, border radius, improved colors, fixed duplicate boxSizing property.' },
    ]
  },
  {
    version: 'v0.5.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'UpdateTracker component with version management, statistics, and change history tracking integrated into Settings.' },
    ]
  },
  {
    version: 'v0.4.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'ToastTables visual differentiation with better borders, spacing, table status indicators, and "being cleaned" status with cyan visual treatment.' },
    ]
  },
  {
    version: 'v0.3.0',
    date: '2025-01-23',
    label: null,
    changes: [
      { type: 'feature', text: 'Real-time workflow system with OrderEventManager and OrderWorkflowService for cross-tab synchronization between orders, tables, kitchen, tokens, and waiters.' },
    ]
  },
];

const TYPE_CONFIG = {
  feature:     { label: 'Feature',     color: '#0284c7', bg: '#e0f2fe',  icon: '✦' },
  fix:         { label: 'Fix',         color: '#dc2626', bg: '#fee2e2',  icon: '⚙' },
  improvement: { label: 'Improvement', color: '#8b5cf6', bg: '#f3e8ff',  icon: '▲' },
  integration: { label: 'Integration', color: '#059669', bg: '#dcfce7',  icon: '⇄' },
  security:    { label: 'Security',    color: '#d97706', bg: '#fef3c7',  icon: '⚑' },
  restructure: { label: 'Restructure', color: '#7c3aed', bg: '#ede9fe',  icon: '◈' },
  deployment:  { label: 'Deployment',  color: '#0891b2', bg: '#cffafe',  icon: '▲' },
  design:      { label: 'Design',      color: '#db2777', bg: '#fce7f3',  icon: '◐' },
  documentation: { label: 'Documentation', color: '#64748b', bg: '#f1f5f9', icon: '📝' },
};

const ALL_TYPES = ['all', 'feature', 'fix', 'improvement', 'integration', 'security', 'restructure', 'deployment', 'design', 'documentation'];

export default function UpdateTracker({ darkMode = false }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({ 'v1.0.0': true });
  const [activeTab, setActiveTab] = useState('changelog');

  const theme = darkMode ? {
    bg: '#0f0f0f',
    card: '#1a1a1a',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#6366f1'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textSecondary: '#64748b',
    accent: '#6366f1'
  };

  const toggleExpand = (version) => setExpanded((prev) => ({ ...prev, [version]: !prev[version] }));

  const filteredUpdates = UPDATES.map((u) => ({
    ...u,
    changes: filter === 'all' ? u.changes : u.changes.filter((c) => c.type === filter),
  })).filter((u) => u.changes.length > 0);

  const totalChanges = UPDATES.reduce((sum, u) => sum + u.changes.length, 0);

  const tabs = [
    { id: 'changelog', label: 'Changelog' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'features', label: 'Feature Requests' },
    { id: 'beta', label: 'Beta Program' },
    { id: 'feedback', label: 'Feedback' }
  ];

  return (
    <div style={{
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: theme.bg,
      minHeight: '100vh',
      color: theme.text
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.1rem'
              }}>▲</span>
              Update Tracker
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
              Full changelog of all platform improvements, fixes, and features
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0284c7', lineHeight: 1 }}>{UPDATES.length}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0369a1', marginTop: '0.1rem' }}>VERSIONS</div>
            </div>
            <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#8b5cf6', lineHeight: 1 }}>{totalChanges}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6d28d9', marginTop: '0.1rem' }}>CHANGES</div>
            </div>
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', lineHeight: 1 }}>{UPDATES[0].version}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#15803d', marginTop: '0.1rem' }}>CURRENT</div>
            </div>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {ALL_TYPES.map((t) => {
            const cfg = t === 'all' ? { label: 'All Changes', color: '#334155', bg: '#f1f5f9' } : TYPE_CONFIG[t];
            const isActive = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: `1.5px solid ${isActive ? cfg.color : theme.border}`,
                  background: isActive ? cfg.bg : theme.card,
                  color: isActive ? cfg.color : theme.textSecondary,
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t !== 'all' && <span style={{ marginRight: '0.25rem' }}>{cfg.icon}</span>}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.2rem', borderBottom: '1px solid ' + theme.border, margin: '1rem 0 1.5rem 0', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.3rem 0.6rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0f172a' : '2px solid transparent',
              color: activeTab === tab.id ? theme.text : theme.textSecondary,
              fontWeight: activeTab === tab.id ? '700' : '500',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'changelog' && (
        <>
        {/* Timeline */}
        <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: '11px', top: '24px', bottom: 0,
          width: '2px', background: 'linear-gradient(180deg, #0284c7 0%, ' + theme.border + ' 100%)',
          borderRadius: '2px'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredUpdates.map((update) => {
            const isExpanded = !!expanded[update.version];
            return (
              <div key={update.version} style={{ paddingLeft: '2.25rem', position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: 0, top: '18px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: update.label === 'Latest'
                    ? 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)'
                    : theme.card,
                  border: update.label === 'Latest' ? 'none' : '2px solid #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: update.label === 'Latest' ? '0 0 0 4px #e0f2fe' : 'none'
                }}>
                  {update.label === 'Latest' && (
                    <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: '800' }}>●</span>
                  )}
                </div>

                {/* Card */}
                <div style={{
                  background: theme.card,
                  border: `1px solid ${update.label === 'Latest' ? '#bae6fd' : theme.border}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: update.label === 'Latest' ? '0 4px 12px rgba(2, 132, 199, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {/* Card Header */}
                  <button
                    onClick={() => toggleExpand(update.version)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'transparent',
                      border: 'none', cursor: 'pointer', padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontSize: '1.05rem', fontWeight: '800', color: theme.text,
                        fontFamily: 'monospace', letterSpacing: '-0.02em'
                      }}>{update.version}</span>

                      {update.label && (
                        <span style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)',
                          color: '#fff', fontSize: '0.65rem', fontWeight: '800',
                          padding: '0.15rem 0.55rem', borderRadius: '16px',
                          letterSpacing: '0.08em', textTransform: 'uppercase'
                        }}>{update.label}</span>
                      )}

                      <span style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: '500' }}>
                        {new Date(update.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[...new Set(update.changes.map((c) => c.type))].map((t) => {
                          const cfg = TYPE_CONFIG[t] || { label: t, color: '#64748b', bg: '#f1f5f9', icon: '•' };
                          return (
                            <span key={t} style={{
                              fontSize: '0.65rem', fontWeight: '700',
                              padding: '0.1rem 0.4rem', borderRadius: '8px',
                              background: cfg.bg, color: cfg.color
                            }}>{cfg.icon} {cfg.label}</span>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: theme.textSecondary, fontWeight: '600' }}>
                        {update.changes.length} change{update.changes.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        fontSize: '1rem', color: theme.textSecondary,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease', display: 'inline-block'
                      }}>›</span>
                    </div>
                  </button>

                  {/* Change list */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid ' + theme.border, padding: '0.75rem 1.25rem 1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {update.changes.map((change, i) => {
                          const cfg = TYPE_CONFIG[change.type] || TYPE_CONFIG.feature;
                          return (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                              <span style={{
                                flexShrink: 0,
                                marginTop: '0.05rem',
                                width: '20px', height: '20px',
                                borderRadius: '6px',
                                background: cfg.bg,
                                color: cfg.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: '800'
                              }}>{cfg.icon}</span>
                              <div>
                                <span style={{
                                  fontSize: '0.67rem', fontWeight: '700',
                                  color: cfg.color, marginRight: '0.4rem',
                                  textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>{cfg.label}</span>
                                <span style={{ fontSize: '0.85rem', color: theme.text, lineHeight: 1.5 }}>{change.text}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredUpdates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text }}>No changes matching this filter</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try selecting "All Changes"</div>
        </div>
      )}
        </>
      )}

      {activeTab === 'roadmap' && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text }}>Roadmap coming soon</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Check back later for upcoming features</div>
        </div>
      )}

      {activeTab === 'features' && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💡</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text }}>Feature requests coming soon</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>You'll be able to request features here soon</div>
        </div>
      )}

      {activeTab === 'beta' && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧪</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text }}>Beta program coming soon</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Join the beta program to get early access to new features</div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text }}>Feedback coming soon</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Share your feedback on new features and help us improve</div>
        </div>
      )}
    </div>
  );
}
