// Push notification utilities

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

// Schedule notification
export const scheduleNotification = (title, options, delay) => {
  setTimeout(() => {
    showNotification(title, options);
  }, delay);
};

// Notification types for different events
export const NOTIFICATION_TYPES = {
  ORDER_COMPLETED: {
    title: 'Order Completed',
    icon: '✅',
    sound: 'success'
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    icon: '💰',
    sound: 'success'
  },
  KITCHEN_DELAY: {
    title: 'Kitchen Delay',
    icon: '⏰',
    sound: 'warning'
  },
  LOW_STOCK: {
    title: 'Low Stock Alert',
    icon: '📦',
    sound: 'warning'
  },
  NEW_ORDER: {
    title: 'New Order',
    icon: '📝',
    sound: 'info'
  },
  REFUND_PROCESSED: {
    title: 'Refund Processed',
    icon: '💸',
    sound: 'info'
  },
  STAFF_CHECK_IN: {
    title: 'Staff Check-In',
    icon: '👤',
    sound: 'info'
  },
  STAFF_CHECK_OUT: {
    title: 'Staff Check-Out',
    icon: '👤',
    sound: 'info'
  }
};

// Show typed notification
export const showTypedNotification = (type, message, data = {}) => {
  const notificationType = NOTIFICATION_TYPES[type];
  if (!notificationType) {
    return showNotification(message, data);
  }

  return showNotification(
    `${notificationType.icon} ${notificationType.title}`,
    {
      body: message,
      ...data
    }
  );
};

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Get current permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Register service worker for push notifications
export const registerPushNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });
      
      return subscription;
    } catch (error) {
      console.error('Push notification registration failed:', error);
      return null;
    }
  }
  return null;
};

// Send push notification via service worker
export const sendPushNotification = async (subscription, payload) => {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        payload
      })
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

// Notification settings
export const getNotificationSettings = () => {
  return JSON.parse(localStorage.getItem('notification_settings') || '{}');
};

export const setNotificationSettings = (settings) => {
  localStorage.setItem('notification_settings', JSON.stringify(settings));
};

// Enable/disable specific notification types
export const setNotificationTypeEnabled = (type, enabled) => {
  const settings = getNotificationSettings();
  settings[type] = enabled;
  setNotificationSettings(settings);
};

// Check if notification type is enabled
export const isNotificationTypeEnabled = (type) => {
  const settings = getNotificationSettings();
  return settings[type] !== false; // Default to enabled
};

// Play notification sound
export const playNotificationSound = (soundType = 'info') => {
  const audio = new Audio(`/sounds/${soundType}.mp3`);
  audio.play().catch(error => {
    console.error('Failed to play notification sound:', error);
  });
};

// Vibrate device (if supported)
export const vibrateDevice = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Show notification with sound and vibration
export const showFullNotification = (type, message, data = {}) => {
  const notificationType = NOTIFICATION_TYPES[type];
  
  // Show visual notification
  showTypedNotification(type, message, data);
  
  // Play sound if enabled
  if (isNotificationTypeEnabled('sound')) {
    playNotificationSound(notificationType?.sound || 'info');
  }
  
  // Vibrate if enabled
  if (isNotificationTypeEnabled('vibration')) {
    vibrateDevice();
  }
};
