// Order Attachments Support
// Manages photos, notes, documents, and voice notes attached to orders

import { now } from './dates.js';

const ATTACHMENTS_KEY = 'cafeos_order_attachments';

/**
 * Attachment Types
 */
export const ATTACHMENT_TYPES = {
  PHOTO: 'PHOTO',
  DOCUMENT: 'DOCUMENT',
  NOTE: 'NOTE',
  VOICE_NOTE: 'VOICE_NOTE',
  RECEIPT: 'RECEIPT',
  SIGNATURE: 'SIGNATURE',
  OTHER: 'OTHER'
};

/**
 * Attachment Status
 */
export const ATTACHMENT_STATUS = {
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  FAILED: 'FAILED',
  DELETED: 'DELETED'
};

/**
 * Order Attachments Manager class
 * Manages order attachments
 */
export class OrderAttachmentsManager {
  constructor() {
    this.attachments = new Map(); // orderId -> array of attachments
    this.loadAttachments();
  }

  /**
   * Load attachments from localStorage
   */
  loadAttachments() {
    try {
      const stored = localStorage.getItem(ATTACHMENTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([orderId, attachments]) => {
          this.attachments.set(orderId, attachments);
        });
      }
    } catch (error) {
      console.error('[OrderAttachmentsManager] Failed to load attachments:', error);
    }
  }

  /**
   * Save attachments to localStorage
   */
  saveAttachments() {
    try {
      const data = Object.fromEntries(this.attachments);
      localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[OrderAttachmentsManager] Failed to save attachments:', error);
    }
  }

  /**
   * Add an attachment to an order
   * @param {string} orderId - Order ID
   * @param {Object} attachmentData - Attachment data
   * @returns {Object} Attachment result
   */
  addAttachment(orderId, attachmentData = {}) {
    const attachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type: attachmentData.type || ATTACHMENT_TYPES.OTHER,
      name: attachmentData.name || 'Untitled Attachment',
      description: attachmentData.description || '',
      url: attachmentData.url || null,
      data: attachmentData.data || null, // For small data stored directly
      mimeType: attachmentData.mimeType || null,
      fileSize: attachmentData.fileSize || 0,
      status: ATTACHMENT_STATUS.UPLOADED,
      uploadedBy: attachmentData.uploadedBy || null,
      uploadedAt: now(),
      metadata: attachmentData.metadata || {}
    };

    if (!this.attachments.has(orderId)) {
      this.attachments.set(orderId, []);
    }

    this.attachments.get(orderId).push(attachment);
    this.saveAttachments();

    return {
      success: true,
      attachment
    };
  }

  /**
   * Add a photo attachment
   * @param {string} orderId - Order ID
   * @param {Object} photoData - Photo data
   * @returns {Object} Attachment result
   */
  addPhoto(orderId, photoData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.PHOTO,
      name: photoData.name || 'Photo',
      url: photoData.url,
      data: photoData.data,
      mimeType: photoData.mimeType || 'image/jpeg',
      fileSize: photoData.fileSize || 0,
      uploadedBy: photoData.uploadedBy,
      metadata: {
        width: photoData.width,
        height: photoData.height,
        thumbnail: photoData.thumbnail
      }
    });
  }

  /**
   * Add a document attachment
   * @param {string} orderId - Order ID
   * @param {Object} documentData - Document data
   * @returns {Object} Attachment result
   */
  addDocument(orderId, documentData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.DOCUMENT,
      name: documentData.name || 'Document',
      url: documentData.url,
      data: documentData.data,
      mimeType: documentData.mimeType || 'application/pdf',
      fileSize: documentData.fileSize || 0,
      uploadedBy: documentData.uploadedBy,
      metadata: {
        pageCount: documentData.pageCount
      }
    });
  }

  /**
   * Add a note attachment
   * @param {string} orderId - Order ID
   * @param {Object} noteData - Note data
   * @returns {Object} Attachment result
   */
  addNote(orderId, noteData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.NOTE,
      name: noteData.name || 'Note',
      description: noteData.content || '',
      uploadedBy: noteData.uploadedBy,
      metadata: {
        isRichText: noteData.isRichText || false
      }
    });
  }

  /**
   * Add a voice note attachment
   * @param {string} orderId - Order ID
   * @param {Object} voiceData - Voice note data
   * @returns {Object} Attachment result
   */
  addVoiceNote(orderId, voiceData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.VOICE_NOTE,
      name: voiceData.name || 'Voice Note',
      url: voiceData.url,
      data: voiceData.data,
      mimeType: voiceData.mimeType || 'audio/mpeg',
      fileSize: voiceData.fileSize || 0,
      uploadedBy: voiceData.uploadedBy,
      metadata: {
        duration: voiceData.duration,
        transcription: voiceData.transcription
      }
    });
  }

  /**
   * Add a receipt attachment
   * @param {string} orderId - Order ID
   * @param {Object} receiptData - Receipt data
   * @returns {Object} Attachment result
   */
  addReceipt(orderId, receiptData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.RECEIPT,
      name: receiptData.name || 'Receipt',
      url: receiptData.url,
      data: receiptData.data,
      mimeType: receiptData.mimeType || 'image/jpeg',
      fileSize: receiptData.fileSize || 0,
      uploadedBy: receiptData.uploadedBy,
      metadata: {
        receiptNumber: receiptData.receiptNumber,
        receiptDate: receiptData.receiptDate
      }
    });
  }

  /**
   * Add a signature attachment
   * @param {string} orderId - Order ID
   * @param {Object} signatureData - Signature data
   * @returns {Object} Attachment result
   */
  addSignature(orderId, signatureData = {}) {
    return this.addAttachment(orderId, {
      type: ATTACHMENT_TYPES.SIGNATURE,
      name: signatureData.name || 'Signature',
      url: signatureData.url,
      data: signatureData.data,
      mimeType: signatureData.mimeType || 'image/png',
      fileSize: signatureData.fileSize || 0,
      uploadedBy: signatureData.uploadedBy,
      metadata: {
        signedBy: signatureData.signedBy,
        signedAt: signatureData.signedAt || now()
      }
    });
  }

  /**
   * Get attachments for an order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of attachments
   */
  getAttachments(orderId) {
    return this.attachments.get(orderId) || [];
  }

  /**
   * Get attachment by ID
   * @param {string} attachmentId - Attachment ID
   * @returns {Object|null} Attachment or null
   */
  getAttachment(attachmentId) {
    for (const attachments of this.attachments.values()) {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (attachment) return attachment;
    }
    return null;
  }

  /**
   * Get attachments by type
   * @param {string} orderId - Order ID
   * @param {string} type - Attachment type
   * @returns {Array} Array of attachments
   */
  getAttachmentsByType(orderId, type) {
    const attachments = this.getAttachments(orderId);
    return attachments.filter(a => a.type === type);
  }

  /**
   * Update attachment
   * @param {string} attachmentId - Attachment ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Update result
   */
  updateAttachment(attachmentId, updates = {}) {
    for (const [orderId, attachments] of this.attachments) {
      const index = attachments.findIndex(a => a.id === attachmentId);
      if (index !== -1) {
        attachments[index] = {
          ...attachments[index],
          ...updates,
          updatedAt: now()
        };
        this.saveAttachments();
        return {
          success: true,
          attachment: attachments[index]
        };
      }
    }

    return {
      success: false,
      reason: 'Attachment not found'
    };
  }

  /**
   * Delete attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {Object} Delete result
   */
  deleteAttachment(attachmentId) {
    for (const [orderId, attachments] of this.attachments) {
      const index = attachments.findIndex(a => a.id === attachmentId);
      if (index !== -1) {
        attachments[index].status = ATTACHMENT_STATUS.DELETED;
        attachments[index].deletedAt = now();
        this.saveAttachments();
        return {
          success: true,
          attachmentId
        };
      }
    }

    return {
      success: false,
      reason: 'Attachment not found'
    };
  }

  /**
   * Permanently remove attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {Object} Remove result
   */
  removeAttachment(attachmentId) {
    for (const [orderId, attachments] of this.attachments) {
      const index = attachments.findIndex(a => a.id === attachmentId);
      if (index !== -1) {
        attachments.splice(index, 1);
        this.saveAttachments();
        return {
          success: true,
          attachmentId
        };
      }
    }

    return {
      success: false,
      reason: 'Attachment not found'
    };
  }

  /**
   * Delete all attachments for an order
   * @param {string} orderId - Order ID
   * @returns {Object} Delete result
   */
  deleteOrderAttachments(orderId) {
    const attachments = this.attachments.get(orderId);
    if (!attachments) {
      return {
        success: true,
        deleted: 0
      };
    }

    attachments.forEach(a => {
      a.status = ATTACHMENT_STATUS.DELETED;
      a.deletedAt = now();
    });

    this.saveAttachments();

    return {
      success: true,
      deleted: attachments.length
    };
  }

  /**
   * Get attachment count for order
   * @param {string} orderId - Order ID
   * @returns {number} Attachment count
   */
  getAttachmentCount(orderId) {
    const attachments = this.getAttachments(orderId);
    return attachments.filter(a => a.status !== ATTACHMENT_STATUS.DELETED).length;
  }

  /**
   * Get total storage used
   * @returns {number} Total storage in bytes
   */
  getTotalStorageUsed() {
    let total = 0;

    for (const attachments of this.attachments.values()) {
      attachments.forEach(a => {
        if (a.status !== ATTACHMENT_STATUS.DELETED) {
          total += a.fileSize || 0;
        }
      });
    }

    return total;
  }

  /**
   * Get storage used by order
   * @param {string} orderId - Order ID
   * @returns {number} Storage in bytes
   */
  getOrderStorageUsed(orderId) {
    const attachments = this.getAttachments(orderId);
    return attachments
      .filter(a => a.status !== ATTACHMENT_STATUS.DELETED)
      .reduce((sum, a) => sum + (a.fileSize || 0), 0);
  }

  /**
   * Search attachments
   * @param {Object} filters - Search filters
   * @returns {Array} Filtered attachments
   */
  searchAttachments(filters = {}) {
    const results = [];

    for (const [orderId, attachments] of this.attachments) {
      attachments.forEach(attachment => {
        if (attachment.status === ATTACHMENT_STATUS.DELETED) return;

        let matches = true;

        if (filters.orderId && orderId !== filters.orderId) {
          matches = false;
        }

        if (filters.type && attachment.type !== filters.type) {
          matches = false;
        }

        if (filters.query) {
          const query = filters.query.toLowerCase();
          const name = (attachment.name || '').toLowerCase();
          const description = (attachment.description || '').toLowerCase();
          if (!name.includes(query) && !description.includes(query)) {
            matches = false;
          }
        }

        if (filters.fromDate && attachment.uploadedAt < filters.fromDate) {
          matches = false;
        }

        if (filters.toDate && attachment.uploadedAt > filters.toDate) {
          matches = false;
        }

        if (filters.uploadedBy && attachment.uploadedBy !== filters.uploadedBy) {
          matches = false;
        }

        if (matches) {
          results.push({ ...attachment, orderId });
        }
      });
    }

    return results.sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  /**
   * Get attachment statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    let totalAttachments = 0;
    const byType = {};
    let totalStorage = 0;

    for (const attachments of this.attachments.values()) {
      attachments.forEach(a => {
        if (a.status !== ATTACHMENT_STATUS.DELETED) {
          totalAttachments++;
          byType[a.type] = (byType[a.type] || 0) + 1;
          totalStorage += a.fileSize || 0;
        }
      });
    }

    return {
      totalAttachments,
      totalOrders: this.attachments.size,
      byType,
      totalStorage,
      averageStoragePerAttachment: totalAttachments > 0 ? totalStorage / totalAttachments : 0
    };
  }

  /**
   * Clean up old deleted attachments
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of attachments cleaned up
   */
  cleanupDeletedAttachments(olderThan = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleaned = 0;

    for (const [orderId, attachments] of this.attachments) {
      const initialLength = attachments.length;
      
      // Remove permanently deleted attachments older than cutoff
      const filtered = attachments.filter(a => {
        if (a.status === ATTACHMENT_STATUS.DELETED && a.deletedAt < cutoff) {
          return false;
        }
        return true;
      });

      if (filtered.length < initialLength) {
        this.attachments.set(orderId, filtered);
        cleaned += initialLength - filtered.length;
      }
    }

    if (cleaned > 0) {
      this.saveAttachments();
    }

    return cleaned;
  }

  /**
   * Export attachments for backup
   * @returns {Object} Exported attachments
   */
  exportAttachments() {
    return {
      attachments: Object.fromEntries(this.attachments),
      exportedAt: now()
    };
  }

  /**
   * Import attachments from backup
   * @param {Object} data - Imported attachments data
   * @returns {Object} Import result
   */
  importAttachments(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (data.attachments && typeof data.attachments === 'object') {
        Object.entries(data.attachments).forEach(([orderId, attachments]) => {
          this.attachments.set(orderId, attachments);
        });
      }

      this.saveAttachments();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let attachmentsManagerInstance = null;

/**
 * Get the order attachments manager singleton
 * @returns {OrderAttachmentsManager} Attachments manager instance
 */
export function getOrderAttachmentsManager() {
  if (!attachmentsManagerInstance) {
    attachmentsManagerInstance = new OrderAttachmentsManager();
  }
  return attachmentsManagerInstance;
}

/**
 * Reset the attachments manager (useful for testing)
 */
export function resetOrderAttachmentsManager() {
  attachmentsManagerInstance = null;
}

/**
 * Convenience function to add an attachment
 * @param {string} orderId - Order ID
 * @param {Object} attachmentData - Attachment data
 * @returns {Object} Attachment result
 */
export function addAttachment(orderId, attachmentData = {}) {
  const manager = getOrderAttachmentsManager();
  return manager.addAttachment(orderId, attachmentData);
}
