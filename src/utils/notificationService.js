// Notification Service for persistence and management
import { getSeedNotifications } from '../data/notificationConstants.js';
import { normalizeNotification } from '../domain/notificationModel.js';

const STORAGE_KEY = 'cafeos_notifications';
const STORAGE_VERSION = 1;

const safeArr = (v) => (Array.isArray(v) ? v : []);

// Load notifications from localStorage
export const loadNotifications = () => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getSeedNotifications();
    
    const data = JSON.parse(stored);
    
    // Check version and migrate if needed
    if (data.version !== STORAGE_VERSION) {
      console.log('[NotificationService] Migrating notification storage from version', data.version, 'to', STORAGE_VERSION);
      // Migration logic would go here
      return getSeedNotifications();
    }
    
    // Normalize each notification to ensure data integrity
    const normalized = safeArr(data.notifications).map(n => normalizeNotification(n));
    
    return normalized;
  } catch (error) {
    console.error('[NotificationService] Error loading notifications:', error);
    return getSeedNotifications();
  }
};

// Save notifications to localStorage
export const saveNotifications = (notifications) => {
  if (typeof window === "undefined") return;
  
  try {
    const data = {
      version: STORAGE_VERSION,
      notifications: safeArr(notifications),
      lastSaved: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[NotificationService] Error saving notifications:', error);
  }
};

// Clear notifications from localStorage
export const clearNotifications = () => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[NotificationService] Error clearing notifications:', error);
  }
};

// Export notifications to JSON
export const exportNotifications = (notifications) => {
  const data = {
    version: STORAGE_VERSION,
    exportedAt: Date.now(),
    notifications: safeArr(notifications)
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cafeos-notifications-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Import notifications from JSON
export const importNotifications = (file, callback) => {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (!data.notifications || !Array.isArray(data.notifications)) {
        throw new Error('Invalid notification data format');
      }
      
      // Normalize imported notifications
      const normalized = data.notifications.map(n => normalizeNotification(n));
      
      callback(normalized);
    } catch (error) {
      console.error('[NotificationService] Error importing notifications:', error);
      callback(null, error);
    }
  };
  
  reader.readAsText(file);
};

// Get storage info
export const getStorageInfo = () => {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    const sizeInBytes = new Blob([stored]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return {
      version: data.version,
      count: safeArr(data.notifications).length,
      lastSaved: data.lastSaved,
      sizeInBytes,
      sizeInKB
    };
  } catch (error) {
    console.error('[NotificationService] Error getting storage info:', error);
    return null;
  }
};

// Check if storage is available
export const isStorageAvailable = () => {
  if (typeof window === "undefined") return false;
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};
