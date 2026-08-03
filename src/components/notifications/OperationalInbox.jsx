import React from 'react';
import { useState, useMemo, useEffect, useCallback } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { 
  getSeedNotifications, 
  NOTIFICATION_CATEGORY_CONFIG, 
  NOTIFICATION_PRIORITY_CONFIG, 
  NOTIFICATION_STATUS_CONFIG,
  formatNotificationTimestamp,
  getCategoryConfig,
  getPriorityConfig,
  getStatusConfig,
  DEFAULT_NOTIFICATION_SETTINGS
} from "../../data/notificationConstants.js";
import {
  calculateNotificationStats,
  markAsRead,
  acknowledgeNotification,
  resolveNotification,
  dismissNotification,
  assignNotification,
  reopenNotification,
  isActionable,
  isOverdue,
  formatNotificationAge,
  filterByCategory,
  filterByPriority,
  filterByStatus,
  filterByAssignee,
  searchNotifications,
  sortNotifications,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS
} from "../../domain/notificationModel.js";
import NotificationSettings from "./NotificationSettings.jsx";

const genId = () => "ACT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

export default function OperationalInbox({ 
  notifications: externalNotifications, 
  setNotifications: externalSetNotifications,
  currentUser = { id: 'STAFF-001', name: 'Current User', role: 'MANAGER' },
  currentBranch = { id: 'BRANCH-001', name: 'Main Branch' },
  onNavigateToSource,
  onRefresh
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const [notifications, setNotifications] = useState(() => {
    const initial = safeArr(externalNotifications).length ? safeArr(externalNotifications) : getSeedNotifications();
    return initial;
  });

  const [viewMode, setViewMode] = useState("inbox");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [showFilters, setShowFilters] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [toast, setToast] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
    const saved = window.localStorage.getItem('cafeos_notification_settings');
    if (saved) {
      try {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_NOTIFICATION_SETTINGS;
      }
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  const handleSetNotifications = externalSetNotifications || setNotifications;

  // Persist settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem('cafeos_notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Reset pagination whenever the active view/filters change so users
  // don't end up scrolled past an empty page after narrowing results
  useEffect(() => {
    setVisibleCount(20);
  }, [viewMode, searchQuery, filterCategory, filterPriority, filterStatus, sortBy]);

  // Close open overlays with Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (showSettingsModal) setShowSettingsModal(false);
      else if (showDetailPanel) setShowDetailPanel(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettingsModal, showDetailPanel]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Calculate stats
  const stats = useMemo(() => calculateNotificationStats(notifications), [notifications]);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Apply view mode filter
    if (viewMode === "needs_attention") {
      result = result.filter(n => isActionable(n) && n.priority !== NOTIFICATION_PRIORITY.INFORMATIONAL);
    } else if (viewMode === "assigned_to_me") {
      result = result.filter(n => n.assignedTo === currentUser.id && !n.resolved && !n.dismissed);
    } else if (viewMode === "updates") {
      result = result.filter(n => n.priority === NOTIFICATION_PRIORITY.INFORMATIONAL);
    } else if (viewMode === "resolved") {
      result = result.filter(n => n.resolved);
    }

    // Apply search
    if (searchQuery.trim()) {
      result = searchNotifications(result, searchQuery);
    }

    // Apply category filter
    if (filterCategory !== "all") {
      result = filterByCategory(result, filterCategory);
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      result = filterByPriority(result, filterPriority);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = filterByStatus(result, filterStatus);
    }

    // Apply branch filter
    result = result.filter(n => !n.branchId || n.branchId === currentBranch.id);

    // Sort
    result = sortNotifications(result, sortBy);

    return result;
  }, [notifications, viewMode, searchQuery, filterCategory, filterPriority, filterStatus, sortBy, currentBranch.id]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    const updated = markAsRead(notification, currentUser.id);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    
    setSelectedNotification(updated);
    setShowDetailPanel(true);
  }, [notifications, handleSetNotifications, currentUser.id]);

  // Handle acknowledge
  const handleAcknowledge = useCallback((notification) => {
    const updated = acknowledgeNotification(notification, currentUser.id);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(updated);
    }
    setToast({ message: "Acknowledged", tone: "info" });
  }, [notifications, handleSetNotifications, selectedNotification, currentUser.id]);

  // Handle resolve
  const handleResolve = useCallback((notification, note = null) => {
    const updated = resolveNotification(notification, currentUser.id, note);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(updated);
    }
    setToast({ message: "Marked as resolved", tone: "success" });
  }, [notifications, handleSetNotifications, selectedNotification, currentUser.id]);

  // Handle dismiss
  const handleDismiss = useCallback((notification, reason = null) => {
    const updated = dismissNotification(notification, currentUser.id, reason);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(updated);
    }
    setToast({ message: "Notification dismissed", tone: "info" });
  }, [notifications, handleSetNotifications, selectedNotification, currentUser.id]);

  // Handle assign
  const handleAssign = useCallback((notification, assignee) => {
    const updated = assignNotification(notification, assignee, currentUser.id);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(updated);
    }
  }, [notifications, handleSetNotifications, selectedNotification, currentUser.id]);

  // Handle reopen
  const handleReopen = useCallback((notification, reason = null) => {
    const updated = reopenNotification(notification, currentUser.id, reason);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    handleSetNotifications(updatedList);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(updated);
    }
    setToast({ message: "Notification reopened", tone: "info" });
  }, [notifications, handleSetNotifications, selectedNotification, currentUser.id]);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    const updatedList = notifications.map(n => n.unread ? markAsRead(n, currentUser.id) : n);
    handleSetNotifications(updatedList);
    setToast({ message: "All notifications marked read", tone: "success" });
  }, [notifications, handleSetNotifications, currentUser.id]);

  // Clear resolved
  const handleClearResolved = useCallback(() => {
    const updatedList = notifications.filter(n => !n.resolved);
    handleSetNotifications(updatedList);
    setToast({ message: "Resolved notifications cleared", tone: "success" });
  }, [notifications, handleSetNotifications]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterPriority("all");
    setFilterStatus("all");
    setSortBy("priority");
  }, []);

  // Navigate to source record
  const handleNavigateToSource = useCallback((notification) => {
    setShowDetailPanel(false);
    if (typeof onNavigateToSource === 'function') {
      onNavigateToSource(notification.sourceModule, notification.sourceRecordId, notification);
    } else {
      console.log("Navigate to:", notification.sourceModule, notification.sourceRecordId);
    }
  }, [onNavigateToSource]);

  // Refresh: re-pull from the external source of truth when available,
  // otherwise re-seed so "Refresh" is never a dead button
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      } else if (!externalSetNotifications) {
        setNotifications(safeArr(externalNotifications).length ? safeArr(externalNotifications) : getSeedNotifications());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, externalSetNotifications, externalNotifications]);

  const hasUnread = useMemo(() => notifications.some(n => n.unread && !n.dismissed), [notifications]);
  const hasResolved = useMemo(() => notifications.some(n => n.resolved), [notifications]);
  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    filterCategory !== "all" ? 1 : 0,
    filterPriority !== "all" ? 1 : 0,
    filterStatus !== "all" ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Operational Inbox
        </h1>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Review service alerts, assigned actions, and recent operational updates
        </p>
      </div>

      {/* Stat Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {[
          { key: "needsAttention", label: "Needs Attention", color: "var(--cafe-accent)", onClick: () => { setViewMode("needs_attention"); setFilterPriority("all"); } },
          { key: "urgent", label: "Urgent", color: "#e74c3c", onClick: () => { setViewMode("inbox"); setFilterPriority(NOTIFICATION_PRIORITY.URGENT || "all"); } },
          { key: "assignedToMe", label: "Assigned to Me", color: "#3498db", onClick: () => { setViewMode("assigned_to_me"); setFilterPriority("all"); } },
          { key: "unread", label: "Unread", color: "#f39c12", onClick: () => { setViewMode("inbox"); setFilterPriority("all"); setSortBy("unread_first"); } },
          { key: "overdue", label: "Overdue", color: "#e67e22", onClick: () => { setViewMode("inbox"); setFilterPriority("all"); setSortBy("overdue_first"); } },
          { key: "resolvedToday", label: "Resolved Today", color: "#27ae60", onClick: () => { setViewMode("resolved"); setFilterPriority("all"); } },
          { key: "systemIssues", label: "System Issues", color: "#9b59b6", onClick: () => { setViewMode("inbox"); setShowFilters(true); } }
        ].map(chip => (
          <div
            key={chip.key}
            role="button"
            tabIndex={0}
            onClick={chip.onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.onClick(); } }}
            style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <span style={{ fontSize: 24, fontWeight: 700, color: chip.color }}>{stats[chip.key]}</span>
            <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Header Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <button style={{ ...btn("ghost"), opacity: hasUnread ? 1 : 0.5 }} onClick={handleMarkAllRead} disabled={!hasUnread}>
          Mark All Read
        </button>
        <button style={{ ...btn("ghost"), position: "relative" }} onClick={() => setShowFilters(!showFilters)}>
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              marginLeft: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--cafe-accent)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "0 4px"
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <button style={{ ...btn("ghost") }} onClick={() => setShowSettingsModal(true)}>
          Settings
        </button>
        <button style={{ ...btn("ghost"), opacity: isRefreshing ? 0.6 : 1 }} onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button style={{ ...btn("ghost"), opacity: hasResolved ? 1 : 0.5 }} onClick={handleClearResolved} disabled={!hasResolved}>
          Clear Resolved
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ ...card, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Search</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...input, width: "100%", paddingRight: searchQuery ? 28 : undefined }}
                placeholder="Search notifications..."
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
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Category</label>
            <select style={{ ...input, width: "100%" }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {Object.entries(NOTIFICATION_CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Priority</label>
            <select style={{ ...input, width: "100%" }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              {Object.entries(NOTIFICATION_PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Status</label>
            <select style={{ ...input, width: "100%" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              {Object.entries(NOTIFICATION_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...label, display: "block", marginBottom: 4 }}>Sort By</label>
            <select style={{ ...input, width: "100%" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="unread_first">Unread First</option>
              <option value="overdue_first">Overdue First</option>
              <option value="recently_updated">Recently Updated</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button style={{ ...btn("ghost"), width: "100%" }} onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--cafe-border-light)", paddingBottom: 12 }}>
        <button
          style={{ ...btn(viewMode === "inbox" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "inbox" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("inbox")}
        >
          Inbox
        </button>
        <button
          style={{ ...btn(viewMode === "needs_attention" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "needs_attention" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("needs_attention")}
        >
          Needs Attention
        </button>
        <button
          style={{ ...btn(viewMode === "assigned_to_me" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "assigned_to_me" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("assigned_to_me")}
        >
          Assigned to Me
        </button>
        <button
          style={{ ...btn(viewMode === "updates" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "updates" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("updates")}
        >
          Updates
        </button>
        <button
          style={{ ...btn(viewMode === "resolved" ? "primary" : "ghost"), padding: "8px 16px", borderBottom: viewMode === "resolved" ? "2px solid var(--cafe-accent)" : "none" }}
          onClick={() => setViewMode("resolved")}
        >
          Resolved
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
            {viewMode === "inbox" ? "No notifications" : 
             viewMode === "needs_attention" ? "Nothing needs your attention" :
             viewMode === "assigned_to_me" ? "No notifications assigned to you" :
             viewMode === "updates" ? "No informational updates" :
             viewMode === "resolved" ? "No resolved notifications" : "No notifications found"}
          </div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>
            {searchQuery || filterCategory !== "all" || filterPriority !== "all" || filterStatus !== "all" 
              ? "Try adjusting your filters" 
              : "You're all caught up"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
          {filteredNotifications.slice(0, visibleCount).map(notification => {
            const categoryConfig = getCategoryConfig(notification.category);
            const priorityConfig = getPriorityConfig(notification.priority);
            const statusConfig = getStatusConfig(notification.status);
            const isOverdueNotif = isOverdue(notification);
            const age = formatNotificationAge(notification);

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  ...card,
                  cursor: "pointer",
                  borderLeft: `4px solid ${isOverdueNotif ? "#e74c3c" : priorityConfig.color}`,
                  opacity: notification.resolved || notification.dismissed ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Unread indicator */}
                {notification.unread && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--cafe-accent)",
                    boxShadow: "0 0 6px var(--cafe-accent)"
                  }} />
                )}

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{categoryConfig.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {notification.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                        {categoryConfig.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ ...pill, backgroundColor: priorityConfig.bgColor, color: priorityConfig.color, fontSize: 10 }}>
                    {priorityConfig.label}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
                  {notification.summary}
                </div>

                {/* Metadata */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span>{age}</span>
                    {notification.assignedTo && (
                      <span>→ {notification.assignedTo}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {notification.acknowledged && (
                      <span style={{ color: "#f39c12" }}>✓ Acknowledged</span>
                    )}
                    {isOverdueNotif && (
                      <span style={{ color: "#e74c3c" }}>⚠ Overdue</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {filteredNotifications.length > visibleCount && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button style={{ ...btn("ghost") }} onClick={() => setVisibleCount(c => c + 20)}>
            Load More ({filteredNotifications.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
        >
          <div style={{
            ...card,
            width: isMobile ? "100%" : 700,
            maxHeight: isMobile ? "90vh" : "85vh",
            backgroundColor: "var(--cafe-bg-elevated)",
            borderRadius: isMobile ? "20px 20px 0 0" : 12,
            overflowY: "auto",
            padding: 0
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
              <button style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }} onClick={() => setShowSettingsModal(false)}>
                ×
              </button>
            </div>
            <NotificationSettings
              settings={notificationSettings}
              setSettings={setNotificationSettings}
              onSave={() => setShowSettingsModal(false)}
            />
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {showDetailPanel && selectedNotification && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDetailPanel(false); }}
        >
          <div style={{
            ...card,
            width: isMobile ? "100%" : 600,
            maxHeight: isMobile ? "90vh" : "85vh",
            backgroundColor: "var(--cafe-bg-elevated)",
            borderRadius: isMobile ? "20px 20px 0 0" : 12,
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{ padding: 20, borderBottom: "1px solid var(--cafe-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                  {getCategoryConfig(selectedNotification.category).label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                  {selectedNotification.title}
                </div>
              </div>
              <button style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }} onClick={() => setShowDetailPanel(false)}>
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {/* Priority & Status */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Priority</div>
                  <div style={{ ...pill, backgroundColor: getPriorityConfig(selectedNotification.priority).bgColor, color: getPriorityConfig(selectedNotification.priority).color }}>
                    {getPriorityConfig(selectedNotification.priority).label}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Status</div>
                  <div style={{ ...pill, backgroundColor: getStatusConfig(selectedNotification.status).bgColor, color: getStatusConfig(selectedNotification.status).color }}>
                    {getStatusConfig(selectedNotification.status).label}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>Summary</div>
                <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
                  {selectedNotification.summary}
                </div>
              </div>

              {/* Source Record */}
              {selectedNotification.sourceRecordId && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>Source Record</div>
                  <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-surface)" }}>
                    <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                      {selectedNotification.sourceRecordType}: {selectedNotification.sourceRecordId}
                    </div>
                    <button
                      style={{ ...btn("primary"), fontSize: 12, padding: "6px 12px", marginTop: 8 }}
                      onClick={() => handleNavigateToSource(selectedNotification)}
                    >
                      Open Record
                    </button>
                  </div>
                </div>
              )}

              {/* Assignment */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                  {selectedNotification.assignedTo ? `Assigned to: ${selectedNotification.assignedTo}` : "Unassigned"}
                </div>
                {selectedNotification.assignedAt && (
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                    Assigned {formatNotificationTimestamp(selectedNotification.assignedAt)} by {selectedNotification.assignedBy}
                  </div>
                )}
              </div>

              {/* Activity */}
              {selectedNotification.activity && selectedNotification.activity.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>Activity</div>
                  <div style={{ ...card, padding: 12, backgroundColor: "var(--cafe-bg-surface)" }}>
                    {selectedNotification.activity.slice(-5).map((act, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4, paddingBottom: 4, borderBottom: idx < Math.min(4, selectedNotification.activity.length - 1) ? "1px solid var(--cafe-border-light)" : "none" }}>
                        <span style={{ fontWeight: 600 }}>{act.action}</span>
                        <span style={{ marginLeft: 8 }}>{formatNotificationTimestamp(act.timestamp)}</span>
                        {act.actor && <span style={{ marginLeft: 8 }}>by {act.actor}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: 20, borderTop: "1px solid var(--cafe-border-light)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!selectedNotification.acknowledged && (
                <button style={{ ...btn("primary"), flex: 1 }} onClick={() => handleAcknowledge(selectedNotification)}>
                  Acknowledge
                </button>
              )}
              {!selectedNotification.resolved && !selectedNotification.dismissed && (
                <button style={{ ...btn("primary"), flex: 1 }} onClick={() => handleResolve(selectedNotification)}>
                  Resolve
                </button>
              )}
              {selectedNotification.resolved && (
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => handleReopen(selectedNotification)}>
                  Reopen
                </button>
              )}
              {!selectedNotification.resolved && !selectedNotification.dismissed && (
                <button style={{ ...btn("ghost"), color: "#95a5a6", flex: 1 }} onClick={() => handleDismiss(selectedNotification)}>
                  Dismiss
                </button>
              )}
              <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => setShowDetailPanel(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: toast.tone === "success" ? "#27ae60" : "var(--cafe-text-primary)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "var(--cafe-radius-md)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          fontSize: 13,
          fontWeight: 600,
          zIndex: 2000
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
