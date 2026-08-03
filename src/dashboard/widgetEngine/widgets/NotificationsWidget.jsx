/**
 * Notifications Widget
 * Displays recent notifications
 */

import React, { memo } from 'react';

function NotificationsWidget({ instance, settings }) {
  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    const fetchNotifications = () => {
      const mockNotifications = [
        { id: 1, message: 'Order #1234 is ready', time: '2 min ago' },
        { id: 2, message: 'Table 5 bill requested', time: '5 min ago' },
        { id: 3, message: 'Low stock: Coffee beans', time: '10 min ago' }
      ];
      setNotifications(mockNotifications);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
        Recent Notifications
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--cafe-text-tertiary)', padding: 20 }}>
            No notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} style={{ 
              padding: '8px 12px', 
              borderBottom: '1px solid var(--cafe-border-light)',
              fontSize: 13,
              color: 'var(--cafe-text-secondary)'
            }}>
              <div>{notif.message}</div>
              <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                {notif.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(NotificationsWidget);
