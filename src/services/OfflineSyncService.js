// OfflineSyncService.js - Offline Queue & Automatic Cloud Reconnection Sync

class OfflineSyncService {
  constructor() {
    this.queueKey = 'toast_offline_order_queue';
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  handleOnlineStatusChange(status) {
    this.isOnline = status;
    console.log(`[Offline Sync] Network status changed: ${status ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`);
    if (status) {
      this.syncPendingQueue();
    }
  }

  getPendingQueue() {
    try {
      const saved = localStorage.getItem(this.queueKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  enqueueOrder(order) {
    const queue = this.getPendingQueue();
    const offlineRecord = {
      ...order,
      offlineTimestamp: Date.now(),
      synced: false
    };
    queue.push(offlineRecord);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    console.log(`[Offline Sync] Order queued offline: #${order.id || order.tableNumber}`);

    if (this.isOnline) {
      this.syncPendingQueue();
    }
    return offlineRecord;
  }

  syncPendingQueue() {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    console.log(`[Offline Sync] 🔄 Syncing ${queue.length} pending offline tickets to cloud...`);
    
    // Simulate cloud sync processing
    setTimeout(() => {
      localStorage.removeItem(this.queueKey);
      console.log('[Offline Sync] ✅ All offline tickets synced successfully to cloud server!');
    }, 1500);
  }
}

export const offlineSync = new OfflineSyncService();
export default offlineSync;
