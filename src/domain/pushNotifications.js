// Push Notification System

export const NotificationType = {
  ORDER_RECEIVED: 'order_received',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_READY: 'order_ready',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  LOW_STOCK: 'low_stock',
  EXPIRY_WARNING: 'expiry_warning',
  STAFF_MESSAGE: 'staff_message',
  SYSTEM_ALERT: 'system_alert',
  DELIVERY_UPDATE: 'delivery_update',
  KITCHEN_TICKET: 'kitchen_ticket'
};

export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

class PushNotificationManager {
  constructor() {
    this.notifications = [];
    this.notificationSettings = {};
    this.deviceTokens = [];
    this.loadFromStorage();
    this.requestNotificationPermission();
  }

  // Load notifications from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedNotifications = localStorage.getItem('push_notifications');
        const storedSettings = localStorage.getItem('notification_settings');
        const storedTokens = localStorage.getItem('device_tokens');
        
        if (storedNotifications) {
          this.notifications = JSON.parse(storedNotifications);
        }
        if (storedSettings) {
          this.notificationSettings = JSON.parse(storedSettings);
        }
        if (storedTokens) {
          this.deviceTokens = JSON.parse(storedTokens);
        }
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
    }
  }

  // Save notifications to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('push_notifications', JSON.stringify(this.notifications));
        localStorage.setItem('notification_settings', JSON.stringify(this.notificationSettings));
        localStorage.setItem('device_tokens', JSON.stringify(this.deviceTokens));
      }
    } catch (error) {
      console.error('Error saving notification data:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Check if notifications are enabled
  areNotificationsEnabled() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // Register device token
  registerDeviceToken(userId, token, deviceInfo) {
    const deviceToken = {
      id: this.generateId(),
      userId,
      token,
      deviceInfo,
      registeredAt: new Date().toISOString(),
      isActive: true
    };

    // Remove existing token for same device
    this.deviceTokens = this.deviceTokens.filter(t => 
      !(t.userId === userId && t.deviceInfo.deviceId === deviceInfo.deviceId)
    );

    this.deviceTokens.push(deviceToken);
    this.saveToStorage();
    
    return deviceToken;
  }

  // Unregister device token
  unregisterDeviceToken(tokenId) {
    const index = this.deviceTokens.findIndex(t => t.id === tokenId);
    if (index === -1) {
      throw new Error('Device token not found');
    }

    this.deviceTokens[index].isActive = false;
    this.deviceTokens[index].unregisteredAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // Send notification
  async sendNotification(notificationData) {
    const notification = {
      id: this.generateId(),
      ...notificationData,
      type: notificationData.type || NotificationType.SYSTEM_ALERT,
      priority: notificationData.priority || NotificationPriority.NORMAL,
      createdAt: new Date().toISOString(),
      read: false,
      delivered: false
    };

    this.notifications.push(notification);

    // Try to send browser notification if enabled
    if (this.areNotificationsEnabled() && this.isTypeEnabled(notification.type)) {
      this.sendBrowserNotification(notification);
    }

    // Try to send push notification to registered devices
    if (notificationData.userId) {
      await this.sendPushNotification(notification);
    }

    this.saveToStorage();
    return notification;
  }

  // Send browser notification
  sendBrowserNotification(notification) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge || '/badge-72.png',
        tag: notification.id,
        data: notification.data,
        requireInteraction: notification.priority === NotificationPriority.URGENT
      });
    }
  }

  // Send push notification to registered devices
  async sendPushNotification(notification) {
    // This would integrate with a push notification service like Firebase Cloud Messaging
    // For now, we'll simulate the push notification
    console.log('Sending push notification:', notification);
    
    // In production, this would:
    // 1. Get device tokens for the user
    // 2. Send to FCM/APNs service
    // 3. Handle delivery status
    
    notification.delivered = true;
    notification.deliveredAt = new Date().toISOString();
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      throw new Error('Notification not found');
    }

    this.notifications[index].read = true;
    this.notifications[index].readAt = new Date().toISOString();
    this.saveToStorage();
    return this.notifications[index];
  }

  // Mark all notifications as read for user
  markAllAsRead(userId) {
    this.notifications.forEach(notification => {
      if (notification.userId === userId) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    });
    this.saveToStorage();
  }

  // Delete notification
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      throw new Error('Notification not found');
    }

    this.notifications.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get notification by ID
  getNotification(notificationId) {
    return this.notifications.find(n => n.id === notificationId);
  }

  // Get all notifications for user
  getUserNotifications(userId, filters = {}) {
    let filtered = this.notifications.filter(n => n.userId === userId);

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get unread count for user
  getUnreadCount(userId) {
    return this.notifications.filter(n => 
      n.userId === userId && !n.read
    ).length;
  }

  // Update notification settings for user
  updateNotificationSettings(userId, settings) {
    this.notificationSettings[userId] = {
      ...this.notificationSettings[userId],
      ...settings,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return this.notificationSettings[userId];
  }

  // Check if notification type is enabled for user
  isTypeEnabled(type) {
    // Default to enabled if no settings
    if (!this.notificationSettings || Object.keys(this.notificationSettings).length === 0) {
      return true;
    }

    // Check if type is enabled in settings
    const enabledTypes = this.notificationSettings.enabledTypes || [];
    return enabledTypes.includes(type);
  }

  // Get notification settings for user
  getNotificationSettings(userId) {
    return this.notificationSettings[userId] || {
      enabled: true,
      enabledTypes: Object.values(NotificationType),
      soundEnabled: true,
      desktopEnabled: true
    };
  }

  // Send order notification
  async sendOrderNotification(orderData, type) {
    const typeMessages = {
      [NotificationType.ORDER_RECEIVED]: {
        title: 'New Order Received',
        body: `Order #${orderData.id} received from ${orderData.customerName || 'customer'}`
      },
      [NotificationType.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        body: `Order #${orderData.id} has been confirmed`
      },
      [NotificationType.ORDER_READY]: {
        title: 'Order Ready',
        body: `Order #${orderData.id} is ready for pickup/delivery`
      },
      [NotificationType.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        body: `Order #${orderData.id} has been delivered successfully`
      },
      [NotificationType.ORDER_CANCELLED]: {
        title: 'Order Cancelled',
        body: `Order #${orderData.id} has been cancelled`
      }
    };

    const message = typeMessages[type] || typeMessages[NotificationType.ORDER_RECEIVED];

    return this.sendNotification({
      userId: orderData.staffId,
      title: message.title,
      body: message.body,
      type,
      priority: type === NotificationType.ORDER_CANCELLED ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      data: {
        orderId: orderData.id,
        orderType: type
      }
    });
  }

  // Send low stock notification
  async sendLowStockNotification(itemData) {
    return this.sendNotification({
      userId: itemData.managerId,
      title: 'Low Stock Alert',
      body: `${itemData.name} is running low (${itemData.quantity} remaining)`,
      type: NotificationType.LOW_STOCK,
      priority: NotificationPriority.HIGH,
      data: {
        itemId: itemData.id,
        itemName: itemData.name,
        currentQuantity: itemData.quantity
      }
    });
  }

  // Send expiry warning notification
  async sendExpiryWarningNotification(itemData) {
    return this.sendNotification({
      userId: itemData.managerId,
      title: 'Expiry Warning',
      body: `${itemData.name} expires on ${itemData.expiryDate}`,
      type: NotificationType.EXPIRY_WARNING,
      priority: NotificationPriority.HIGH,
      data: {
        itemId: itemData.id,
        itemName: itemData.name,
        expiryDate: itemData.expiryDate
      }
    });
  }

  // Send kitchen ticket notification
  async sendKitchenTicketNotification(orderData) {
    return this.sendNotification({
      userId: orderData.kitchenStaffId,
      title: 'New Kitchen Ticket',
      body: `Order #${orderData.id} - ${orderData.items?.map(i => i.name).join(', ')}`,
      type: NotificationType.KITCHEN_TICKET,
      priority: NotificationPriority.URGENT,
      data: {
        orderId: orderData.id,
        items: orderData.items
      }
    });
  }

  // Get notification statistics
  getStatistics(userId, startDate, endDate) {
    const notifications = this.getUserNotifications(userId);
    const filtered = notifications.filter(n => {
      const notificationDate = new Date(n.createdAt);
      return notificationDate >= new Date(startDate) && notificationDate <= new Date(endDate);
    });

    const byType = {};
    filtered.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: filtered.length,
      unread: filtered.filter(n => !n.read).length,
      read: filtered.filter(n => n.read).length,
      byType
    };
  }

  // Clear old notifications
  clearOldNotifications(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const beforeCount = this.notifications.length;
    this.notifications = this.notifications.filter(n => 
      new Date(n.createdAt) >= cutoffDate || !n.read
    );
    const cleared = beforeCount - this.notifications.length;

    this.saveToStorage();
    return cleared;
  }

  // Generate unique ID
  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export notifications as CSV
  exportToCSV(userId, startDate, endDate) {
    const notifications = this.getUserNotifications(userId, { startDate, endDate });
    const headers = ['ID', 'Type', 'Title', 'Priority', 'Read', 'Created At'];
    const rows = notifications.map(n => [
      n.id,
      n.type,
      n.title,
      n.priority,
      n.read ? 'Yes' : 'No',
      n.createdAt
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let pushNotificationManager = null;

export const getPushNotificationManager = () => {
  if (!pushNotificationManager) {
    pushNotificationManager = new PushNotificationManager();
  }
  return pushNotificationManager;
};

// React hook for push notifications
export const usePushNotifications = (userId) => {
  const manager = getPushNotificationManager();

  return {
    sendNotification: (data) => manager.sendNotification({ ...data, userId }),
    getNotifications: (filters) => manager.getUserNotifications(userId, filters),
    markAsRead: (notificationId) => manager.markAsRead(notificationId),
    markAllAsRead: () => manager.markAllAsRead(userId),
    deleteNotification: (notificationId) => manager.deleteNotification(notificationId),
    getUnreadCount: () => manager.getUnreadCount(userId),
    updateSettings: (settings) => manager.updateNotificationSettings(userId, settings),
    getSettings: () => manager.getNotificationSettings(userId),
    sendOrderNotification: (orderData, type) => manager.sendOrderNotification({ ...orderData, userId }, type),
    areEnabled: () => manager.areNotificationsEnabled(),
    requestPermission: () => manager.requestNotificationPermission()
  };
};
