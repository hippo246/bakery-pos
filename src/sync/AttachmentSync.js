// Attachment Sync
// Handles synchronization of file attachments

import { SyncEngine } from './SyncEngine.js';
import { SyncDirection, _SyncStatus } from './SyncTypes.js';
import _storageEngine from '../cloud/StorageEngine.js';

export class AttachmentSync extends SyncEngine {
  constructor(config = {}) {
    super(config);
    this.attachmentType = config.attachmentType || 'generic';
    this.chunkSize = config.chunkSize || 1024 * 1024; // 1MB chunks
    this.resumeSupported = config.resumeSupported !== false;
  }

  /**
   * Prepare attachment for upload
   */
  async prepareData() {
    if (this.direction === SyncDirection.DOWNLOAD) {
      return null;
    }

    const file = this.data;
    
    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new Error('Data must be a File or Blob for attachment sync');
    }

    // Calculate checksum
    this.checksum = await this.calculateChecksum();
    this.size = file.size;

    // Prepare metadata
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      attachmentType: this.attachmentType,
      checksum: this.checksum,
      deviceId: this.deviceId,
      operator: this.operator,
      createdAt: new Date().toISOString()
    };

    return {
      data: file,
      metadata,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  /**
   * Upload attachment with chunking support
   */
  async upload(preparedData) {
    try {
      const file = preparedData.data;
      const metadata = preparedData.metadata;
      const storageKey = this.getStorageKey();

      // If file is small, upload directly
      if (file.size <= this.chunkSize) {
        const uploadResult = await this.storageProvider.upload(storageKey, file, {
          contentType: file.type,
          metadata
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        return { success: true, storageKey, chunks: 1 };
      }

      // Large file: upload in chunks
      return await this.uploadInChunks(file, storageKey, metadata);
    } catch (error) {
      console.error('Attachment upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload file in chunks
   */
  async uploadInChunks(file, storageKey, metadata) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    const uploadedChunks = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);

      const chunkKey = `${storageKey}.chunk${i}`;
      
      const uploadResult = await this.storageProvider.upload(chunkKey, chunk, {
        contentType: file.type,
        metadata: {
          ...metadata,
          chunkIndex: i,
          totalChunks,
          chunkSize: chunk.size
        }
      });

      if (!uploadResult.success) {
        throw new Error(`Chunk ${i} upload failed: ${uploadResult.error}`);
      }

      uploadedChunks.push(i);
      this.updateProgress('uploading', Math.round((i + 1) / totalChunks * 100), `Uploading chunk ${i + 1}/${totalChunks}`);
    }

    // Upload manifest
    const manifest = {
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      totalChunks,
      uploadedChunks,
      checksum: metadata.checksum
    };

    const manifestKey = `${storageKey}.manifest`;
    await this.storageProvider.upload(manifestKey, new Blob([JSON.stringify(manifest)], { type: 'application/json' }), {
      contentType: 'application/json',
      metadata
    });

    return { success: true, storageKey, chunks: totalChunks };
  }

  /**
   * Download attachment with chunking support
   */
  async download() {
    try {
      const storageKey = this.getStorageKey();
      
      // Try to download as single file first
      const downloadResult = await this.storageProvider.download(storageKey);

      if (downloadResult.success) {
        this.data = downloadResult.data;
        return { success: true, data: this.data, chunks: 1 };
      }

      // If single file failed, try chunked download
      return await this.downloadInChunks(storageKey);
    } catch (error) {
      console.error('Attachment download failed:', error);
      throw error;
    }
  }

  /**
   * Download file in chunks
   */
  async downloadInChunks(storageKey) {
    const manifestKey = `${storageKey}.manifest`;
    const manifestResult = await this.storageProvider.download(manifestKey);

    if (!manifestResult.success) {
      throw new Error('Failed to download manifest');
    }

    const manifest = JSON.parse(await manifestResult.data.text());
    const chunks = [];

    for (let i = 0; i < manifest.totalChunks; i++) {
      const chunkKey = `${storageKey}.chunk${i}`;
      const chunkResult = await this.storageProvider.download(chunkKey);

      if (!chunkResult.success) {
        throw new Error(`Chunk ${i} download failed`);
      }

      chunks.push(chunkResult.data);
      this.updateProgress('downloading', Math.round((i + 1) / manifest.totalChunks * 100), `Downloading chunk ${i + 1}/${manifest.totalChunks}`);
    }

    // Combine chunks
    const combinedBlob = new Blob(chunks, { type: manifest.fileType });
    this.data = combinedBlob;

    // Verify checksum
    const downloadedChecksum = await this.calculateChecksum();
    if (downloadedChecksum !== manifest.checksum) {
      throw new Error('Checksum verification failed');
    }

    return { success: true, data: this.data, chunks: manifest.totalChunks };
  }

  /**
   * Calculate checksum for file
   */
  async calculateChecksum() {
    try {
      const file = this.data;
      
      if (!(file instanceof File) && !(file instanceof Blob)) {
        return null;
      }

      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Get storage key for attachment
   */
  getStorageKey() {
    const fileName = this.data?.name || 'unnamed';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `attachments/${this.attachmentType}/${this.itemId}/${sanitizedFileName}`;
  }

  /**
   * Get attachment metadata
   */
  getAttachmentMetadata() {
    return {
      attachmentType: this.attachmentType,
      fileName: this.data?.name,
      fileSize: this.data?.size,
      fileType: this.data?.type,
      checksum: this.checksum,
      chunkSize: this.chunkSize,
      resumeSupported: this.resumeSupported
    };
  }
}

export default AttachmentSync;
