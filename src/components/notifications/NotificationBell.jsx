import React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { C, btn, pill } from "../../styles/theme";
import { 
  formatNotificationTimestamp,
  getCategoryConfig,
  getPriorityConfig
} from "../../data/notificationConstants.js";
import {
  markAsRead,
  isActionable,
  formatNotificationAge,
  sortNotifications
} from "../../domain/notificationModel.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

export default function NotificationBell({ 
  notifications, 
  setNotifications,
  onNavigateToInbox,
  onNavigateToSource,
  currentUser = { id: 'STAFF-001', name: 'Current User' }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBellHovered, setIsBellHovered] = useState(false);
  const [pulseBadge, setPulseBadge] = useState(false);
  const prevUnreadRef = useRef(0);
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);

  // Compute an on-screen position for the dropdown whenever it opens (and
  // keep it correct on resize/scroll). Using position: fixed + measured
  // coordinates means the panel is placed relative to the viewport, not the
  // bell's ancestor chain, so it can't get clipped by a parent's overflow
  // or pushed off-screen on narrow viewports.
  useEffect(() => {
    if (!isOpen) return;

    const PANEL_MARGIN = 12;
    const PANEL_MAX_WIDTH = 360;

    const updatePosition = () => {
      const btnEl = bellButtonRef.current;
      if (!btnEl || typeof window === "undefined") return;
      const rect = btnEl.getBoundingClientRect();
      const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - PANEL_MARGIN * 2);

      let left = rect.right - width;
      left = Math.max(PANEL_MARGIN, Math.min(left, window.innerWidth - width - PANEL_MARGIN));

      const maxHeight = 480;
      const spaceBelow = window.innerHeight - rect.bottom - PANEL_MARGIN;
      const spaceAbove = rect.top - PANEL_MARGIN;
      const openUpward = spaceBelow < 300 && spaceAbove > spaceBelow;

      const top = openUpward
        ? Math.max(PANEL_MARGIN, rect.top - Math.min(maxHeight, spaceAbove) - 8)
        : rect.bottom + 8;
      const height = Math.min(maxHeight, openUpward ? spaceAbove : Math.max(200, spaceBelow));

      setDropdownPos({ top, left, width, maxHeight: height });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return safeArr(notifications).filter(n => n.unread && !n.dismissed).length;
  }, [notifications]);

  // Briefly pulse the badge when new unread notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setPulseBadge(true);
      const t = setTimeout(() => setPulseBadge(false), 900);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Get recent notifications (limit to 5)
  const recentNotifications = useMemo(() => {
    const actionable = safeArr(notifications).filter(n => isActionable(n));
    return sortNotifications(actionable, 'priority').slice(0, 5);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    const updated = markAsRead(notification, currentUser.id);
    const updatedList = notifications.map(n => n.id === notification.id ? updated : n);
    setNotifications(updatedList);
    
    // Navigate to source record if available
    if (notification.sourceModule && notification.sourceRecordId) {
      if (typeof onNavigateToSource === 'function') {
        onNavigateToSource(notification.sourceModule, notification.sourceRecordId, notification);
      } else {
        console.log("Navigate to:", notification.sourceModule, notification.sourceRecordId);
      }
    }
    
    setIsOpen(false);
  }, [notifications, setNotifications, currentUser.id, onNavigateToSource]);

  // Handle mark all as read
  const handleMarkAllRead = useCallback(() => {
    const updatedList = notifications.map(n => n.unread ? markAsRead(n, currentUser.id) : n);
    setNotifications(updatedList);
  }, [notifications, setNotifications, currentUser.id]);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <style>{`
        @keyframes cafeos-badge-pulse {
          0% { transform: scale(1); }
          30% { transform: scale(1.35); }
          60% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes cafeos-dropdown-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsBellHovered(true)}
        onMouseLeave={() => setIsBellHovered(false)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        style={{
          background: isBellHovered || isOpen ? "var(--cafe-bg-surface)" : "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          borderRadius: "var(--cafe-radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: isBellHovered || isOpen ? "var(--cafe-text-primary)" : "var(--cafe-text-secondary)",
          transition: "all 0.2s ease"
        }}
      >
        {/* Bell Icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--cafe-danger)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            boxShadow: "0 0 6px rgba(231, 76, 60, 0.4)",
            animation: pulseBadge ? "cafeos-badge-pulse 0.9s ease" : "none"
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && dropdownPos && (
        <div style={{
          position: "fixed",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          maxHeight: dropdownPos.maxHeight,
          backgroundColor: "var(--cafe-bg-elevated)",
          border: "1px solid var(--cafe-border)",
          borderRadius: "var(--cafe-radius-md)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          zIndex: 1000,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "cafeos-dropdown-in 0.15s ease-out",
          transformOrigin: "top right"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px",
            borderBottom: "1px solid var(--cafe-border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                Notifications
              </div>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                {unreadCount} unread
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  ...btn("ghost"),
                  fontSize: 11,
                  padding: "4px 8px"
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  No notifications
                </div>
              </div>
            ) : (
              recentNotifications.map(notification => {
                const categoryConfig = getCategoryConfig(notification.category);
                const priorityConfig = getPriorityConfig(notification.priority);
                const age = formatNotificationAge(notification);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--cafe-border-light)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                      background: notification.unread ? "var(--cafe-accent-dim)" : "transparent",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--cafe-bg-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.unread ? "var(--cafe-accent-dim)" : "transparent";
                    }}
                  >
                    {/* Category Icon */}
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--cafe-radius-sm)",
                      backgroundColor: categoryConfig.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0
                    }}>
                      {categoryConfig.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", lineHeight: 1.3 }}>
                          {notification.title}
                        </div>
                        {notification.unread && (
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--cafe-accent)",
                            flexShrink: 0,
                            marginLeft: 8
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>
                        {notification.summary}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "var(--cafe-text-tertiary)" }}>
                        <span>{age}</span>
                        <span style={{ ...pill, backgroundColor: priorityConfig.bgColor, color: priorityConfig.color, fontSize: 9 }}>
                          {priorityConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--cafe-border-light)",
            backgroundColor: "var(--cafe-bg-surface)"
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                if (typeof onNavigateToInbox === 'function') {
                  onNavigateToInbox();
                }
              }}
              style={{
                ...btn("ghost"),
                width: "100%",
                fontSize: 12,
                padding: "8px",
                textAlign: "center"
              }}
            >
              View Operational Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
