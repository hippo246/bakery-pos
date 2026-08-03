import React from 'react';
import { useState, useMemo } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { formatNotificationTimestamp } from "../../data/notificationConstants.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

// Activity event types
const ACTIVITY_ICONS = {
  order_created: '📋',
  order_completed: '✅',
  order_cancelled: '❌',
  payment_recorded: '💳',
  receipt_printed: '🧾',
  table_moved: '🪑',
  delivery_assigned: '🚚',
  batch_completed: '🏭',
  stock_received: '📦',
  expense_paid: '💰',
  shift_started: '⏰',
  shift_ended: '🏁',
  staff_clocked_in: '👤',
  staff_clocked_out: '👤',
  reservation_seated: '📅',
  reservation_created: '📝',
  qc_passed: '✓',
  qc_failed: '✗',
  notification_created: '🔔',
  notification_acknowledged: '👁',
  notification_resolved: '✅',
  notification_dismissed: '🗑'
};

// Seed activity data
const getSeedActivity = () => [
  {
    id: 'ACT-001',
    type: 'order_created',
    actor: 'System',
    actorId: 'SYSTEM',
    action: 'Order #184 created',
    recordType: 'order',
    recordId: 'ORD-184',
    recordName: 'Order #184',
    timestamp: Date.now() - 5 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      source: 'POS',
      customer: 'Rohan Mehta',
      amount: 340
    }
  },
  {
    id: 'ACT-002',
    type: 'payment_recorded',
    actor: 'Priya Sharma',
    actorId: 'STAFF-003',
    action: 'Payment received for Order #183',
    recordType: 'order',
    recordId: 'ORD-183',
    recordName: 'Order #183',
    timestamp: Date.now() - 12 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      method: 'CARD',
      amount: 280
    }
  },
  {
    id: 'ACT-003',
    type: 'receipt_printed',
    actor: 'Amit Kumar',
    actorId: 'STAFF-007',
    action: 'Receipt printed for Order #182',
    recordType: 'order',
    recordId: 'ORD-182',
    recordName: 'Order #182',
    timestamp: Date.now() - 18 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      printer: 'Thermal-01'
    }
  },
  {
    id: 'ACT-004',
    type: 'delivery_assigned',
    actor: 'System',
    actorId: 'SYSTEM',
    action: 'Delivery assigned to Amit Kumar',
    recordType: 'delivery',
    recordId: 'DEL-045',
    recordName: 'Delivery #045',
    timestamp: Date.now() - 25 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      driverId: 'DRV-007',
      driverName: 'Amit Kumar'
    }
  },
  {
    id: 'ACT-005',
    type: 'batch_completed',
    actor: 'Rohan Mehta',
    actorId: 'STAFF-001',
    action: 'Production batch BATCH-20260724-002 completed',
    recordType: 'production_batch',
    recordId: 'BATCH-20260724-002',
    recordName: 'Cold Brew Concentrate',
    timestamp: Date.now() - 45 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      quantity: 50,
      unit: 'L'
    }
  },
  {
    id: 'ACT-006',
    type: 'stock_received',
    actor: 'System',
    actorId: 'SYSTEM',
    action: 'Stock received: Oat Milk (20L)',
    recordType: 'inventory',
    recordId: 'INV-045',
    recordName: 'Oat Milk',
    timestamp: Date.now() - 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      supplier: 'Fresh Dairy Co.',
      quantity: 20,
      unit: 'L'
    }
  },
  {
    id: 'ACT-007',
    type: 'expense_paid',
    actor: 'System',
    actorId: 'SYSTEM',
    action: 'Expense paid: Rent - July 2024',
    recordType: 'expense',
    recordId: 'EXP-089',
    recordName: 'Rent',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      amount: 45000,
      category: 'RENT'
    }
  },
  {
    id: 'ACT-008',
    type: 'shift_started',
    actor: 'Priya Sharma',
    actorId: 'STAFF-003',
    action: 'Shift started',
    recordType: 'staff_shift',
    recordId: 'SHIFT-20260724-003',
    recordName: 'Morning Shift',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      shiftType: 'Morning',
      startTime: '09:00'
    }
  },
  {
    id: 'ACT-009',
    type: 'reservation_seated',
    actor: 'Amit Kumar',
    actorId: 'STAFF-007',
    action: 'Reservation seated: Table 4',
    recordType: 'reservation',
    recordId: 'RES-034',
    recordName: 'Reservation #034',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      customer: 'Sneha Kulkarni',
      partySize: 4,
      tableId: 'TABLE-004'
    }
  },
  {
    id: 'ACT-010',
    type: 'qc_passed',
    actor: 'Rohan Mehta',
    actorId: 'STAFF-001',
    action: 'QC passed for batch BATCH-20260724-001',
    recordType: 'production_batch',
    recordId: 'BATCH-20260724-001',
    recordName: 'Matcha Latte Mix',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      grade: 'A',
      quantity: 30,
      unit: 'kg'
    }
  },
  {
    id: 'ACT-011',
    type: 'notification_resolved',
    actor: 'Priya Sharma',
    actorId: 'STAFF-003',
    action: 'Resolved notification: Low stock alert for Oat Milk',
    recordType: 'notification',
    recordId: 'NOTIF-045',
    recordName: 'Low Stock Alert',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    branchId: 'BRANCH-001',
    branchName: 'Main Branch',
    metadata: {
      resolutionNote: 'Stock received from supplier'
    }
  }
];

export default function ActivityFeed({ 
  activity: externalActivity,
  currentBranch = { id: 'BRANCH-001', name: 'Main Branch' },
  onNavigateToRecord
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(30);

  // Reset pagination when filters change, so results don't start scrolled past empty
  React.useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, filterType, sortBy, currentBranch.id]);

  const activity = useMemo(() => {
    const initial = safeArr(externalActivity).length ? safeArr(externalActivity) : getSeedActivity();
    return initial;
  }, [externalActivity]);

  // Filter and sort activity
  const filteredActivity = useMemo(() => {
    let result = activity;

    // Apply branch filter
    result = result.filter(a => !a.branchId || a.branchId === currentBranch.id);

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => {
        const action = safeStr(a.action).toLowerCase();
        const actor = safeStr(a.actor).toLowerCase();
        const recordName = safeStr(a.recordName).toLowerCase();
        return action.includes(q) || actor.includes(q) || recordName.includes(q);
      });
    }

    // Apply type filter
    if (filterType !== "all") {
      result = result.filter(a => a.type === filterType);
    }

    // Sort
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (sortBy === "oldest") {
      result = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    return result;
  }, [activity, searchQuery, filterType, sortBy, currentBranch.id]);

  // Get unique activity types
  const activityTypes = useMemo(() => {
    const types = new Set(activity.map(a => a.type));
    return Array.from(types).sort();
  }, [activity]);

  // Group activity by date (paginated so large histories don't all render at once)
  const visibleActivity = useMemo(() => filteredActivity.slice(0, visibleCount), [filteredActivity, visibleCount]);

  const groupedActivity = useMemo(() => {
    const groups = {};
    visibleActivity.forEach(item => {
      const date = new Date(item.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return groups;
  }, [filteredActivity]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSortBy("newest");
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Activity Feed
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Operational history and recent events across all modules
        </p>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div>
          <label style={{ ...label, display: "block", marginBottom: 4 }}>Search</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...input, width: "100%", paddingRight: searchQuery ? 28 : undefined }}
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--cafe-text-tertiary)", fontSize: 16, padding: 4, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div>
          <label style={{ ...label, display: "block", marginBottom: 4 }}>Event Type</label>
          <select style={{ ...input, width: "100%" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Events</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>{(ACTIVITY_ICONS[type] || '📌')} {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ ...label, display: "block", marginBottom: 4 }}>Sort By</label>
          <select style={{ ...input, width: "100%" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button style={{ ...btn("ghost"), width: "100%" }} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Activity List */}
      {Object.keys(groupedActivity).length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
            No activity found
          </div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>
            {searchQuery || filterType !== "all" ? "Try adjusting your filters" : "No activity recorded yet"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(groupedActivity).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-primary)",
                marginBottom: 12,
                padding: "8px 0",
                borderBottom: "1px solid var(--cafe-border-light)",
                position: "sticky",
                top: 0,
                backgroundColor: "var(--cafe-bg-primary, var(--cafe-bg-elevated))",
                zIndex: 1
              }}>
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>

              {/* Activity Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map(item => {
                  const icon = ACTIVITY_ICONS[item.type] || '📌';
                  const time = formatNotificationTimestamp(item.timestamp);

                  return (
                    <div
                      key={item.id}
                      style={{
                        ...card,
                        padding: 16,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--cafe-radius-sm)",
                        backgroundColor: "var(--cafe-bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0
                      }}>
                        {icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                            {item.action}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", whiteSpace: "nowrap", marginLeft: 8 }}>
                            {time}
                          </div>
                        </div>

                        <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                          by {item.actor}
                          {item.branchName && item.branchName !== currentBranch.name && (
                            <span style={{ marginLeft: 8, color: "var(--cafe-text-tertiary)" }}>
                              ({item.branchName})
                            </span>
                          )}
                        </div>

                        {/* Record Link */}
                        {item.recordId && (
                          <div
                            role="button"
                            tabIndex={0}
                            style={{ fontSize: 12, color: "var(--cafe-accent)", cursor: "pointer", display: "inline-block" }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof onNavigateToRecord === 'function') {
                                onNavigateToRecord(item.recordType, item.recordId, item);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (typeof onNavigateToRecord === 'function') {
                                  onNavigateToRecord(item.recordType, item.recordId, item);
                                }
                              }
                            }}
                          >
                            {item.recordType}: {item.recordName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {filteredActivity.length > visibleCount && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button style={{ ...btn("ghost") }} onClick={() => setVisibleCount(c => c + 30)}>
            Load More ({filteredActivity.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
