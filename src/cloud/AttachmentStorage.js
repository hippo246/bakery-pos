// Attachment Storage for Cloud Storage Platform
// Handles all file uploads and storage for attachments

import storageEngine from './StorageEngine.js';

/**
 * Attachment Storage
 * Central attachment management for all file uploads
 * Supports cloud storage integration with fallback to local
 */
class AttachmentStorage {
  constructor() {
    this.initialized = false;
    this.uploadQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the attachment storage
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize storage engine
    await storageEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Upload attachment
   * @param {File|Blob} file 
   * @param {object} options 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadAttachment(file, options = {}) {
    try {
      await this.initialize();
      
      const { category = 'general', filename = file.name, metadata = {} } = options;
      
      // Generate unique key
      const key = this.generateAttachmentKey(category, filename);
      
      // Prepare metadata
      const attachmentMetadata = {
        ...metadata,
        originalName: file.name,
        size: file.size,
        type: file.type,
        category,
        uploadedAt: new Date().toISOString()
      };

      // Try cloud upload first
      const activeProvider = storageEngine.getActiveProvider();
      
      if (activeProvider && activeProvider.connected) {
        const uploadResult = await storageEngine.upload(file, key, {
          metadata: attachmentMetadata
        });
        
        if (uploadResult.success) {
          await this.logAttachmentEvent('upload', key, attachmentMetadata);
          return { success: true, url: key, provider: 'cloud' };
        }
      }

      // Fallback to local storage
      const localResult = await this.uploadToLocal(file, key, attachmentMetadata);
      
      if (localResult.success) {
        await this.logAttachmentEvent('upload', key, { ...attachmentMetadata, provider: 'local' });
        return { success: true, url: localResult.url, provider: 'local' };
      }

      return { success: false, error: 'Failed to upload attachment' };
    } catch (error) {
      console.error('[AttachmentStorage] Upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload to local storage
   * @param {File|Blob} file 
   * @param {string} key 
   * @param {object} metadata 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadToLocal(file, key, metadata) {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Store in localStorage
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      attachments[key] = {
        data: base64,
        metadata,
        storedAt: new Date().toISOString()
      };
      
      localStorage.setItem('cafeos_attachments', JSON.stringify(attachments));
      
      return { success: true, url: key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download attachment
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async downloadAttachment(key) {
    try {
      await this.initialize();
      
      // Try cloud first
      const activeProvider = storageEngine.getActiveProvider();
      
      if (activeProvider && activeProvider.connected) {
        const downloadResult = await storageEngine.download(key);
        
        if (downloadResult.success) {
          await this.logAttachmentEvent('download', key);
          return { success: true, data: downloadResult.data, provider: 'cloud' };
        }
      }

      // Fallback to local storage
      const localResult = await this.downloadFromLocal(key);
      
      if (localResult.success) {
        await this.logAttachmentEvent('download', key, { provider: 'local' });
        return { success: true, data: localResult.data, provider: 'local' };
      }

      return { success: false, error: 'Attachment not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download from local storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async downloadFromLocal(key) {
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      const attachment = attachments[key];
      
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Convert base64 to blob
      const dataUrl = attachment.data;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete attachment
   * @param {string} key 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteAttachment(key) {
    try {
      await this.initialize();
      
      // Try cloud first
      const activeProvider = storageEngine.getActiveProvider();
      
      if (activeProvider && activeProvider.connected) {
        const deleteResult = await storageEngine.delete(key);
        
        if (deleteResult.success) {
          await this.logAttachmentEvent('delete', key);
          return { success: true };
        }
      }

      // Fallback to local storage
      const localResult = await this.deleteFromLocal(key);
      
      if (localResult.success) {
        await this.logAttachmentEvent('delete', key, { provider: 'local' });
        return { success: true };
      }

      return { success: false, error: 'Failed to delete attachment' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete from local storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteFromLocal(key) {
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      delete attachments[key];
      localStorage.setItem('cafeos_attachments', JSON.stringify(attachments));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get attachment metadata
   * @param {string} key 
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getAttachmentMetadata(key) {
    try {
      await this.initialize();
      
      // Try cloud first
      const activeProvider = storageEngine.getActiveProvider();
      
      if (activeProvider && activeProvider.connected) {
        const metaResult = await storageEngine.getMetadata(key);
        
        if (metaResult.success) {
          return { success: true, metadata: metaResult.metadata, provider: 'cloud' };
        }
      }

      // Fallback to local storage
      const localResult = await this.getLocalMetadata(key);
      
      if (localResult.success) {
        return { success: true, metadata: localResult.metadata, provider: 'local' };
      }

      return { success: false, error: 'Attachment not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get local metadata
   * @param {string} key 
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getLocalMetadata(key) {
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      const attachment = attachments[key];
      
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      return { success: true, metadata: attachment.metadata };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List attachments
   * @param {object} options 
   * @returns {Promise<{success: boolean, attachments?: Array, error?: string}>}
   */
  async listAttachments(options = {}) {
    try {
      await this.initialize();
      
      const { category, limit = 100 } = options;
      
      // Try cloud first
      const activeProvider = storageEngine.getActiveProvider();
      let cloudAttachments = [];
      
      if (activeProvider && activeProvider.connected) {
        const listResult = await storageEngine.list('attachments/', { limit });
        
        if (listResult.success) {
          cloudAttachments = listResult.files.filter(f => {
            if (category) {
              return f.metadata?.category === category;
            }
            return true;
          });
        }
      }

      // Get local attachments
      const localAttachments = this.listLocalAttachments(category);

      // Merge results (deduplicate by key)
      const allAttachments = new Map();
      
      for (const att of cloudAttachments) {
        allAttachments.set(att.key, { ...att, provider: 'cloud' });
      }
      
      for (const att of localAttachments) {
        if (!allAttachments.has(att.key)) {
          allAttachments.set(att.key, { ...att, provider: 'local' });
        }
      }

      return { 
        success: true, 
        attachments: Array.from(allAttachments.values()).slice(0, limit) 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List local attachments
   * @param {string} category 
   * @returns {Array}
   */
  listLocalAttachments(category) {
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      
      return Object.entries(attachments).map(([key, value]) => ({
        key,
        metadata: value.metadata,
        storedAt: value.storedAt,
        provider: 'local'
      })).filter(att => {
        if (category) {
          return att.metadata?.category === category;
        }
        return true;
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate attachment key
   * @param {string} category 
   * @param {string} filename 
   * @returns {string}
   */
  generateAttachmentKey(category, filename) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `attachments/${category}/${timestamp}_${random}_${safeFilename}`;
  }

  /**
   * Queue attachment upload
   * @param {File|Blob} file 
   * @param {object} options 
   * @returns {string}
   */
  queueUpload(file, options = {}) {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    this.uploadQueue.push({
      uploadId,
      file,
      options,
      status: 'pending',
      addedAt: new Date().toISOString()
    });

    this.processQueue();

    return uploadId;
  }

  /**
   * Process upload queue
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.uploadQueue.length > 0) {
      const upload = this.uploadQueue.shift();
      
      try {
        upload.status = 'uploading';
        upload.startedAt = new Date().toISOString();
        
        const result = await this.uploadAttachment(upload.file, upload.options);
        
        if (result.success) {
          upload.status = 'completed';
          upload.completedAt = new Date().toISOString();
          upload.url = result.url;
          upload.provider = result.provider;
        } else {
          upload.status = 'failed';
          upload.completedAt = new Date().toISOString();
          upload.error = result.error;
        }
      } catch (error) {
        upload.status = 'failed';
        upload.completedAt = new Date().toISOString();
        upload.error = error.message;
      }
      
      // Store upload history
      await this.logUploadHistory(upload);
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Get upload status
   * @param {string} uploadId 
   * @returns {object|null}
   */
  getUploadStatus(uploadId) {
    // Check queue
    const queued = this.uploadQueue.find(u => u.uploadId === uploadId);
    if (queued) return queued;
    
    // Check history
    const history = this.getUploadHistory();
    return history.find(u => u.uploadId === uploadId) || null;
  }

  /**
   * Log upload history
   * @param {object} upload 
   */
  async logUploadHistory(upload) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_upload_history') || '[]');
      history.push(upload);
      
      // Keep only last 1000 uploads
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      localStorage.setItem('cafeos_upload_history', JSON.stringify(history));
    } catch (error) {
      console.error('[AttachmentStorage] Failed to log upload history:', error);
    }
  }

  /**
   * Get upload history
   * @returns {Array}
   */
  getUploadHistory() {
    try {
      return JSON.parse(localStorage.getItem('cafeos_upload_history') || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Log attachment event
   * @param {string} eventType 
   * @param {string} key 
   * @param {object} details 
   */
  async logAttachmentEvent(eventType, key, details = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_attachment_logs') || '[]');
      logs.push({
        eventType,
        key,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_attachment_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[AttachmentStorage] Failed to log attachment event:', error);
    }
  }

  /**
   * Get attachment logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_attachment_logs') || '[]');
      
      let filtered = logs;
      
      if (options.eventType) {
        filtered = filtered.filter(log => log.eventType === options.eventType);
      }
      
      if (options.key) {
        filtered = filtered.filter(log => log.key === options.key);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get attachment statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      const uploadHistory = this.getUploadHistory();
      const logs = this.getLogs();
      
      const stats = {
        totalAttachments: Object.keys(attachments).length,
        totalSize: Object.values(attachments).reduce((sum, att) => sum + (att.metadata?.size || 0), 0),
        byCategory: {},
        totalUploads: uploadHistory.length,
        successfulUploads: uploadHistory.filter(u => u.status === 'completed').length,
        failedUploads: uploadHistory.filter(u => u.status === 'failed').length,
        recentUploads: uploadHistory.slice(-10),
        recentLogs: logs.slice(-10)
      };
      
      // Group by category
      for (const att of Object.values(attachments)) {
        const category = att.metadata?.category || 'general';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        totalAttachments: 0,
        totalSize: 0,
        byCategory: {},
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        recentUploads: [],
        recentLogs: []
      };
    }
  }

  /**
   * Clean up old attachments
   * @param {number} daysOld 
   * @returns {Promise<{deleted: number, errors: number}>}
   */
  async cleanupOldAttachments(daysOld = 30) {
    let deleted = 0;
    let errors = 0;
    
    try {
      const attachments = JSON.parse(localStorage.getItem('cafeos_attachments') || '{}');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      for (const [key, value] of Object.entries(attachments)) {
        const storedDate = new Date(value.storedAt);
        
        if (storedDate < cutoffDate) {
          const deleteResult = await this.deleteAttachment(key);
          
          if (deleteResult.success) {
            deleted++;
          } else {
            errors++;
          }
        }
      }
      
      return { deleted, errors };
    } catch (error) {
      console.error('[AttachmentStorage] Cleanup failed:', error);
      return { deleted, errors: errors + 1 };
    }
  }
}

// Singleton instance
const attachmentStorage = new AttachmentStorage();

export default attachmentStorage;
