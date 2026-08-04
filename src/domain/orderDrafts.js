// Order Drafts with Auto-Save
// Manages temporary draft orders with automatic saving

import { normalizeOrder, createOrder } from './orderModel.js';
import { now } from './dates.js';

const DRAFT_ORDERS_KEY = 'cafeos_draft_orders';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Order Draft Manager class
 * Manages draft orders with automatic saving
 */
export class OrderDraftManager {
  constructor() {
    this.drafts = new Map();
    this.currentDraft = null;
    this.autoSaveTimer = null;
    this.currentStaffId = null;
    this.loadDrafts();
  }

  /**
   * Set current staff ID
   * @param {string} staffId - Current staff ID
   */
  setCurrentStaff(staffId) {
    this.currentStaffId = staffId;
  }

  /**
   * Load drafts from localStorage
   */
  loadDrafts() {
    try {
      const stored = localStorage.getItem(DRAFT_ORDERS_KEY);
      if (stored) {
        const drafts = JSON.parse(stored);
        drafts.forEach(draft => {
          const normalized = normalizeOrder(draft);
          if (normalized) {
            this.drafts.set(normalized.id, normalized);
          }
        });
      }
    } catch (error) {
      console.error('[OrderDraftManager] Failed to load drafts:', error);
    }
  }

  /**
   * Save drafts to localStorage
   */
  saveDrafts() {
    try {
      const drafts = Array.from(this.drafts.values());
      localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('[OrderDraftManager] Failed to save drafts:', error);
    }
  }

  /**
   * Create a new draft
   * @param {Object} orderData - Initial order data
   * @returns {Order} Created draft order
   */
  createDraft(orderData = {}) {
    const draft = createOrder({
      ...orderData,
      lifecycleState: 'DRAFT',
      status: 'DRAFT',
      draftCreatedBy: this.currentStaffId,
      draftCreatedAt: now()
    });

    this.drafts.set(draft.id, draft);
    this.currentDraft = draft;
    this.saveDrafts();
    this.startAutoSave();

    return draft;
  }

  /**
   * Set current draft for auto-save
   * @param {Order} draft - Draft order
   */
  setCurrentDraft(draft) {
    this.currentDraft = draft;
    this.startAutoSave();
  }

  /**
   * Get current draft
   * @returns {Order|null} Current draft or null
   */
  getCurrentDraft() {
    return this.currentDraft;
  }

  /**
   * Update current draft
   * @param {Object} updates - Updates to apply
   * @returns {Order} Updated draft
   */
  updateCurrentDraft(updates = {}) {
    if (!this.currentDraft) {
      throw new Error('No current draft to update');
    }

    this.currentDraft = {
      ...this.currentDraft,
      ...updates,
      updatedAt: now(),
      draftLastModified: now(),
      draftModifiedBy: this.currentStaffId
    };

    this.drafts.set(this.currentDraft.id, this.currentDraft);
    this.saveDrafts();

    return this.currentDraft;
  }

  /**
   * Save current draft manually
   * @returns {Order} Saved draft
   */
  saveCurrentDraft() {
    if (!this.currentDraft) {
      throw new Error('No current draft to save');
    }

    this.currentDraft.updatedAt = now();
    this.currentDraft.draftLastModified = now();
    this.currentDraft.draftModifiedBy = this.currentStaffId;

    this.drafts.set(this.currentDraft.id, this.currentDraft);
    this.saveDrafts();

    return this.currentDraft;
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.autoSave();
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Auto-save current draft
   */
  autoSave() {
    if (this.currentDraft) {
      this.saveCurrentDraft();
      console.log('[OrderDraftManager] Auto-saved draft:', this.currentDraft.id);
    }
  }

  /**
   * Load a draft by ID
   * @param {string} draftId - Draft ID
   * @returns {Order|null} Draft or null
   */
  loadDraft(draftId) {
    const draft = this.drafts.get(draftId);
    if (draft) {
      this.currentDraft = draft;
      this.startAutoSave();
    }
    return draft || null;
  }

  /**
   * Delete a draft
   * @param {string} draftId - Draft ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteDraft(draftId) {
    const deleted = this.drafts.delete(draftId);
    
    if (this.currentDraft?.id === draftId) {
      this.currentDraft = null;
      this.stopAutoSave();
    }

    if (deleted) {
      this.saveDrafts();
    }

    return deleted;
  }

  /**
   * Convert draft to actual order
   * @param {string} draftId - Draft ID
   * @param {Object} finalData - Final order data
   * @returns {Order} Converted order
   */
  convertDraftToOrder(draftId, finalData = {}) {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const order = createOrder({
      ...draft,
      ...finalData,
      lifecycleState: 'PENDING',
      status: 'PENDING',
      draftConvertedAt: now(),
      draftConvertedBy: this.currentStaffId
    });

    // Remove from drafts
    this.drafts.delete(draftId);
    
    if (this.currentDraft?.id === draftId) {
      this.currentDraft = null;
      this.stopAutoSave();
    }

    this.saveDrafts();

    return order;
  }

  /**
   * Get all drafts
   * @returns {Order[]} Array of draft orders
   */
  getAllDrafts() {
    return Array.from(this.drafts.values());
  }

  /**
   * Get drafts by staff
   * @param {string} staffId - Staff ID
   * @returns {Order[]} Array of drafts by staff
   */
  getDraftsByStaff(staffId) {
    return this.getAllDrafts().filter(draft => draft.draftCreatedBy === staffId);
  }

  /**
   * Get drafts by customer
   * @param {string} customerId - Customer ID
   * @returns {Order[]} Array of drafts by customer
   */
  getDraftsByCustomer(customerId) {
    return this.getAllDrafts().filter(draft => draft.customerId === customerId);
  }

  /**
   * Get drafts by table
   * @param {string} tableId - Table ID
   * @returns {Order[]} Array of drafts by table
   */
  getDraftsByTable(tableId) {
    return this.getAllDrafts().filter(draft => draft.tableId === tableId);
  }

  /**
   * Search drafts
   * @param {Object} filters - Search filters
   * @returns {Order[]} Filtered drafts
   */
  searchDrafts(filters = {}) {
    let drafts = this.getAllDrafts();

    if (filters.query) {
      const query = filters.query.toLowerCase();
      drafts = drafts.filter(draft => {
        const customerName = (draft.customerName || '').toLowerCase();
        const notes = (draft.notes || '').toLowerCase();
        return customerName.includes(query) || notes.includes(query);
      });
    }

    if (filters.staffId) {
      drafts = drafts.filter(draft => draft.draftCreatedBy === filters.staffId);
    }

    if (filters.customerId) {
      drafts = drafts.filter(draft => draft.customerId === filters.customerId);
    }

    if (filters.tableId) {
      drafts = drafts.filter(draft => draft.tableId === filters.tableId);
    }

    if (filters.fromDate) {
      drafts = drafts.filter(draft => draft.draftCreatedAt >= filters.fromDate);
    }

    if (filters.toDate) {
      drafts = drafts.filter(draft => draft.draftCreatedAt <= filters.toDate);
    }

    return drafts;
  }

  /**
   * Get draft count
   * @returns {number} Number of drafts
   */
  getDraftCount() {
    return this.drafts.size;
  }

  /**
   * Clear current draft
   */
  clearCurrentDraft() {
    this.currentDraft = null;
    this.stopAutoSave();
  }

  /**
   * Clear all drafts
   */
  clearAllDrafts() {
    this.drafts.clear();
    this.currentDraft = null;
    this.stopAutoSave();
    this.saveDrafts();
  }

  /**
   * Remove old drafts (older than specified hours)
   * @param {number} hours - Age in hours
   * @returns {number} Number of drafts removed
   */
  removeOldDrafts(hours = 48) {
    const cutoff = now() - (hours * 60 * 60 * 1000);
    let removed = 0;

    for (const [draftId, draft] of this.drafts) {
      if (draft.draftCreatedAt < cutoff) {
        this.drafts.delete(draftId);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveDrafts();
    }

    return removed;
  }

  /**
   * Duplicate a draft
   * @param {string} draftId - Draft ID to duplicate
   * @returns {Order} New draft
   */
  duplicateDraft(draftId) {
    const original = this.drafts.get(draftId);
    if (!original) {
      throw new Error('Draft not found');
    }

    const duplicated = createOrder({
      ...original,
      id: undefined, // Generate new ID
      lifecycleState: 'DRAFT',
      status: 'DRAFT',
      draftCreatedBy: this.currentStaffId,
      draftCreatedAt: now(),
      draftDuplicatedFrom: draftId
    });

    this.drafts.set(duplicated.id, duplicated);
    this.saveDrafts();

    return duplicated;
  }

  /**
   * Get draft statistics
   * @returns {Object} Draft statistics
   */
  getStatistics() {
    const drafts = this.getAllDrafts();

    return {
      total: drafts.length,
      byStaff: this.groupByStaff(drafts),
      byCustomer: this.groupByCustomer(drafts),
      byTable: this.groupByTable(drafts),
      averageAge: this.calculateAverageAge(drafts),
      oldestDraft: this.getOldestDraft(drafts),
      newestDraft: this.getNewestDraft(drafts)
    };
  }

  /**
   * Group drafts by staff
   * @param {Array} drafts - Array of drafts
   * @returns {Object} Drafts grouped by staff
   */
  groupByStaff(drafts) {
    return drafts.reduce((acc, draft) => {
      const staffId = draft.draftCreatedBy || 'unknown';
      acc[staffId] = (acc[staffId] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group drafts by customer
   * @param {Array} drafts - Array of drafts
   * @returns {Object} Drafts grouped by customer
   */
  groupByCustomer(drafts) {
    return drafts.reduce((acc, draft) => {
      const customerId = draft.customerId || 'unknown';
      acc[customerId] = (acc[customerId] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group drafts by table
   * @param {Array} drafts - Array of drafts
   * @returns {Object} Drafts grouped by table
   */
  groupByTable(drafts) {
    return drafts.reduce((acc, draft) => {
      const tableId = draft.tableId || 'unknown';
      acc[tableId] = (acc[tableId] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate average draft age
   * @param {Array} drafts - Array of drafts
   * @returns {number} Average age in milliseconds
   */
  calculateAverageAge(drafts) {
    if (drafts.length === 0) return 0;

    const totalAge = drafts.reduce((sum, draft) => {
      return sum + (now() - draft.draftCreatedAt);
    }, 0);

    return totalAge / drafts.length;
  }

  /**
   * Get oldest draft
   * @param {Array} drafts - Array of drafts
   * @returns {Order|null} Oldest draft or null
   */
  getOldestDraft(drafts) {
    if (drafts.length === 0) return null;
    return drafts.reduce((oldest, draft) => {
      return draft.draftCreatedAt < oldest.draftCreatedAt ? draft : oldest;
    });
  }

  /**
   * Get newest draft
   * @param {Array} drafts - Array of drafts
   * @returns {Order|null} Newest draft or null
   */
  getNewestDraft(drafts) {
    if (drafts.length === 0) return null;
    return drafts.reduce((newest, draft) => {
      return draft.draftCreatedAt > newest.draftCreatedAt ? draft : newest;
    });
  }

  /**
   * Export drafts for backup
   * @returns {Object} Exported drafts
   */
  exportDrafts() {
    return {
      drafts: Array.from(this.drafts.values()),
      currentDraftId: this.currentDraft?.id || null,
      exportedAt: now()
    };
  }

  /**
   * Import drafts from backup
   * @param {Object} data - Imported drafts data
   * @returns {Object} Import result
   */
  importDrafts(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.drafts)) {
        data.drafts.forEach(draft => {
          const normalized = normalizeOrder(draft);
          if (normalized) {
            this.drafts.set(normalized.id, normalized);
          }
        });
      }

      if (data.currentDraftId) {
        this.currentDraft = this.drafts.get(data.currentDraftId) || null;
        if (this.currentDraft) {
          this.startAutoSave();
        }
      }

      this.saveDrafts();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let draftManagerInstance = null;

/**
 * Get the order draft manager singleton
 * @returns {OrderDraftManager} Draft manager instance
 */
export function getOrderDraftManager() {
  if (!draftManagerInstance) {
    draftManagerInstance = new OrderDraftManager();
  }
  return draftManagerInstance;
}

/**
 * Reset the draft manager (useful for testing)
 */
export function resetOrderDraftManager() {
  if (draftManagerInstance) {
    draftManagerInstance.stopAutoSave();
  }
  draftManagerInstance = null;
}

/**
 * Initialize draft manager with staff context
 * @param {string} staffId - Current staff ID
 * @returns {OrderDraftManager} Draft manager instance
 */
export function initializeOrderDrafts(staffId) {
  const manager = getOrderDraftManager();
  manager.setCurrentStaff(staffId);
  return manager;
}
