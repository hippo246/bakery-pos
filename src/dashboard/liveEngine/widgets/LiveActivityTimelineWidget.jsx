/**
 * Live Activity Timeline Widget
 * Displays real-time operational events and activity
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';
import eventBus from '../EventBus.js';

function LiveActivityTimelineWidget({ instance, settings }) {
  const [activities, setActivities] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Subscribe to event bus for real-time activities
    const unsubscribe = eventBus.subscribeToCategory('activity', (event) => {
      addActivity(event);
    });

    // Also subscribe to all events to create activity entries
    const unsubscribeAll = eventBus.subscribeToAll((event) => {
      // Convert events to activity entries
      const activity = {
        id: event.id,
        type: event.type,
        message: getActivityMessage(event),
        timestamp: event.timestamp,
        category: event.category
      };
      addActivity(activity);
    });

    const addActivity = (activity) => {
      setActivities(prev => {
        const newActivities = [activity, ...prev].slice(0, 20); // Keep last 20
        return newActivities;
      });
      setLastUpdate(Date.now());
    };

    const getActivityMessage = (event) => {
      switch (event.type) {
        case 'order.created': return `Order #${event.data.orderId} created`;
        case 'order.ready': return `Order #${event.data.orderId} ready`;
        case 'order.served': return `Order #${event.data.orderId} served`;
        case 'kitchen.started': return `Kitchen started order #${event.data.orderId}`;
        case 'table.occupied': return `Table ${event.data.tableId} occupied`;
        case 'reservation.checked_in': return `Reservation for ${event.data.name} checked in`;
        case 'payment.completed': return `Payment of ₹${event.data.amount} completed`;
        case 'inventory.critical': return `${event.data.item} is critically low`;
        default: return `${event.category} event`;
      }
    };

    // Load initial activities from real audit/event system
    const loadInitialActivities = () => {
      // Activities will be populated by real events from the event bus
      // No mock data - dashboard is read-only consumer
      setActivities([]);
    };

    loadInitialActivities();

    return () => {
      unsubscribe();
      unsubscribeAll();
    };
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'orders': return '📋';
      case 'kitchen': return '👨‍🍳';
      case 'tables': return '🪑';
      case 'payments': return '💳';
      case 'reservations': return '📅';
      case 'inventory': return '📦';
      case 'staff': return '👤';
      case 'health': return '❤️';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Activity Timeline
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: 'var(--cafe-accent-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--cafe-accent)'
        }}>
          Live
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activities.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: 'var(--cafe-text-tertiary)',
            fontSize: 13
          }}>
            No recent activity
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'var(--cafe-border-light)'
            }} />

            {activities.map((activity, index) => (
              <div key={activity.id} style={{ 
                position: 'relative',
                paddingLeft: 48,
                paddingBottom: 16
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: 12,
                  top: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--cafe-bg-card)',
                  border: '2px solid var(--cafe-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10
                }}>
                  {getCategoryIcon(activity.category)}
                </div>

                {/* Activity content */}
                <div>
                  <div style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>
                    {activity.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(LiveActivityTimelineWidget);
