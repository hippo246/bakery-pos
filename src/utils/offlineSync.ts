// Offline mode support utilities for BrewCRM
import { useState, useEffect } from "react";

const STORAGE_PREFIX = "brewcrm_";
const SYNC_QUEUE_KEY = "brewcrm_sync_queue";

export interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  collection: string;
  data: any;
  timestamp: number;
}

export class OfflineSync {
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncOperation[] = [];

  constructor() {
    this.loadSyncQueue();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private loadSyncQueue() {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
    }
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }

  public saveToStorage<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Failed to save to storage:", error);
      return false;
    }
  }

  public loadFromStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error("Failed to load from storage:", error);
      return null;
    }
  }

  public removeFromStorage(key: string): boolean {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error("Failed to remove from storage:", error);
      return false;
    }
  }

  public queueOperation(operation: Omit<SyncOperation, "id" | "timestamp">): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    this.syncQueue.push(syncOp);
    this.saveSyncQueue();

    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  private async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const operationsToSync = [...this.syncQueue];
    const failedOperations: SyncOperation[] = [];

    for (const op of operationsToSync) {
      try {
        // In a real app, this would make API calls to sync with the server
        // For now, we'll simulate the sync by removing from queue
        console.log("Syncing operation:", op);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(o => o.id !== op.id);
      } catch (error) {
        console.error("Failed to sync operation:", op, error);
        failedOperations.push(op);
      }
    }

    this.syncQueue = failedOperations;
    this.saveSyncQueue();
  }

  public getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  public getSyncQueue(): SyncOperation[] {
    return [...this.syncQueue];
  }

  public clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }

  public getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
    
    // Approximate 5MB limit for localStorage
    const total = 5 * 1024 * 1024;
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  public clearAllStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.clearSyncQueue();
  }
}

// Singleton instance
export const offlineSync = new OfflineSync();

// React hook for offline status
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}
