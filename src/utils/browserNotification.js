// Browser Notification Service
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

// Check if browser notifications are supported
export const isBrowserNotificationSupported = () => {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
};

// Get current permission status
export const getNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) {
    console.warn('[BrowserNotification] Notifications not supported in this browser');
    return 'unsupported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    console.warn('[BrowserNotification] Notification permission denied');
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[BrowserNotification] Error requesting permission:', error);
    return 'default';
  }
};

// Show browser notification
export const showBrowserNotification = (title, options = {}) => {
  if (typeof window === "undefined") return;
  
  const config = localStorage.getItem('cafeos_notification_settings');
  const settings = config ? JSON.parse(config) : null;
  
  // Check if browser notifications are enabled
  if (settings && !settings.browser.enabled) return;
  
  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('[BrowserNotification] Permission not granted');
    return;
  }
  
  // Check quiet hours
  if (settings?.quietHours?.enabled) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Check if current time is within quiet hours
    const inQuietHours = startTime < endTime
      ? currentTime >= startTime && currentTime < endTime
      : currentTime >= startTime || currentTime < endTime;

    if (inQuietHours && settings.quietHours.suppressBrowser) {
      console.log('[BrowserNotification] Suppressed due to quiet hours');
      return;
    }
  }
  
  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/badge-icon.png',
      ...options
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to the source if provided
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
    };
    
    return notification;
  } catch (error) {
    console.error('[BrowserNotification] Error showing notification:', error);
  }
};

// Show notification for a specific type
export const showNotificationForType = (notification) => {
  const title = safeStr(notification.title);
  const body = safeStr(notification.summary);
  const category = safeStr(notification.category);
  const priority = safeStr(notification.priority);
  
  // Determine icon based on category
  const categoryIcons = {
    ORDERS: '📋',
    KITCHEN: '👨‍🍳',
    TABLES: '🪑',
    RESERVATIONS: '📅',
    DELIVERY: '🚚',
    QR_ORDERING: '📱',
    STOCK: '📦',
    PURCHASING: '🛒',
    PRODUCTION: '🏭',
    EXPENSES: '💰',
    PAYMENTS: '💳',
    DOCUMENTS: '📄',
    STAFF: '👥',
    SECURITY: '🔒',
    SYSTEM: '⚙️'
  };
  
  const icon = categoryIcons[category] || '🔔';
  
  // Add priority indicator
  let tag = 'normal';
  if (priority === 'URGENT') tag = 'urgent';
  else if (priority === 'IMPORTANT') tag = 'important';
  
  showBrowserNotification(`${icon} ${title}`, {
    body,
    tag: `${tag}-${notification.id}`,
    requireInteraction: priority === 'URGENT',
    data: {
      notificationId: notification.id,
      sourceModule: notification.sourceModule,
      sourceRecordId: notification.sourceRecordId,
      url: notification.sourceModule ? `/${notification.sourceModule}` : '/'
    }
  });
};

// Close all notifications
export const closeAllNotifications = () => {
  if (!isBrowserNotificationSupported()) return;
  
  // Close all currently visible notifications
  Notification.getNotifications?.()?.forEach(notification => {
    notification.close();
  });
};
