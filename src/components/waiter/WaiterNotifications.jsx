/**
 * Waiter Notifications Center
 * Displays relevant notifications for waiters without spam
 * Shows: Kitchen Ready, Customer Requests, Manager Messages, Reservation Arrivals, Priority Orders, Table Transfers
 */

import React, { useState, useCallback, useMemo } from 'react';

function WaiterNotifications({
  notifications,
  setNotifications,
  currentShift,
  tables,
  orders,
  kdsCards
}) {
  const [filter, setFilter] = useState('all'); // all, kitchen, requests, manager, reservations

  // Filter notifications for this waiter
  const waiterNotifications = useMemo(() => {
    if (!notifications || !currentShift) return [];
    
    const waiterTables = tables?.filter(table => table.assignedStaffId === currentShift.staffId) || [];
    const waiterTableIds = waiterTables.map(table => table.id);
    
    return notifications.filter(notif => {
      // Filter by category
      if (filter === 'kitchen' && notif.category !== 'kitchen') return false;
      if (filter === 'requests' && notif.category !== 'requests') return false;
      if (filter === 'manager' && notif.category !== 'manager') return false;
      if (filter === 'reservations' && notif.category !== 'reservations') return false;
      
      // Filter by relevance to this waiter
      if (notif.tableId && !waiterTableIds.includes(notif.tableId)) return false;
      if (notif.staffId && notif.staffId !== currentShift.staffId) return false;
      
      return true;
    });
  }, [notifications, currentShift, tables, filter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return waiterNotifications.filter(n => !n.read).length;
  }, [waiterNotifications]);

  // Handle notification read
  const handleMarkRead = useCallback((notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true, readAt: Date.now() } : notif
    ));
  }, [setNotifications]);

  // Handle notification dismiss
  const handleDismiss = useCallback((notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, dismissed: true, dismissedAt: Date.now() } : notif
    ));
  }, [setNotifications]);

  // Handle notification action
  const handleAction = useCallback((notification) => {
    // Handle different notification types
    switch (notification.type) {
      case 'KITCHEN_READY':
        // Navigate to ready for pickup
        break;
      case 'CUSTOMER_REQUEST':
        // Navigate to customer requests
        break;
      case 'MANAGER_MESSAGE':
        // Show manager message
        break;
      case 'RESERVATION_ARRIVAL':
        // Navigate to table
        break;
      case 'PRIORITY_ORDER':
        // Navigate to order
        break;
      case 'TABLE_TRANSFER':
        // Accept or decline transfer
        break;
      default:
        break;
    }
    
    handleMarkRead(notification.id);
  }, [handleMarkRead]);

  // Get notification icon
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'KITCHEN_READY': return '👨‍🍳';
      case 'CUSTOMER_REQUEST': return '🔔';
      case 'MANAGER_MESSAGE': return '👤';
      case 'RESERVATION_ARRIVAL': return '📅';
      case 'PRIORITY_ORDER': return '⚡';
      case 'TABLE_TRANSFER': return '🪑';
      default: return '📋';
    }
  }, []);

  // Get notification color
  const getNotificationColor = useCallback((type) => {
    switch (type) {
      case 'KITCHEN_READY': return 'var(--cafe-success)';
      case 'CUSTOMER_REQUEST': return 'var(--cafe-warning)';
      case 'MANAGER_MESSAGE': return 'var(--cafe-info)';
      case 'RESERVATION_ARRIVAL': return 'var(--cafe-accent)';
      case 'PRIORITY_ORDER': return 'var(--cafe-danger)';
      case 'TABLE_TRANSFER': return 'var(--cafe-info)';
      default: return 'var(--cafe-text-secondary)';
    }
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--cafe-border)',
        background: 'var(--cafe-bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
              Notifications
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
              {unreadCount} unread
            </div>
          </div>
          
          {unreadCount > 0 && (
            <div style={{
              padding: '4px 12px',
              background: 'var(--cafe-accent-bg)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cafe-accent)'
            }}>
              {unreadCount}
            </div>
          )}
        </div>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['all', 'kitchen', 'requests', 'manager', 'reservations'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                background: filter === f ? 'var(--cafe-accent-bg)' : 'transparent',
                border: filter === f ? '1px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                borderRadius: 16,
                color: filter === f ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {waiterNotifications.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--cafe-text-tertiary)',
            fontSize: 14
          }}>
            No notifications
          </div>
        ) : (
          waiterNotifications.map(notif => (
            <div
              key={notif.id}
              style={{
                padding: 12,
                marginBottom: 8,
                background: notif.read 
                  ? 'var(--cafe-bg-primary)' 
                  : 'var(--cafe-bg-surface)',
                border: notif.read 
                  ? '1px solid var(--cafe-border)' 
                  : '1px solid var(--cafe-accent)',
                borderRadius: 8,
                cursor: 'pointer',
                opacity: notif.dismissed ? 0.5 : 1
              }}
              onClick={() => handleAction(notif)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  fontSize: 24,
                  flexShrink: 0
                }}>
                  {getNotificationIcon(notif.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                      {notif.title}
                    </div>
                    {!notif.read && (
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--cafe-accent)',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  
                  <div style={{ fontSize: 13, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
                    {notif.message}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                      {formatTimeAgo(notif.createdAt)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notif.id);
                          }}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--cafe-bg-tertiary)',
                            border: '1px solid var(--cafe-border)',
                            borderRadius: 4,
                            color: 'var(--cafe-text-secondary)',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notif.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--cafe-danger-bg)',
                          border: '1px solid var(--cafe-danger-border)',
                          borderRadius: 4,
                          color: 'var(--cafe-danger)',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                          Dismiss
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WaiterNotifications;
