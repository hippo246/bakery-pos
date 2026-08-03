// Bandwidth Optimizer
// Optimizes data transfers for bandwidth efficiency

export class BandwidthOptimizer {
  constructor() {
    this.compressionEnabled = true;
    this.chunkSize = 1024 * 1024; // 1MB default
    this.deduplicationEnabled = true;
    this.deduplicationCache = new Map();
    this.maxCacheSize = 1000;
    this.storageKey = 'cafeos_bandwidth_optimizer';
    this.loadState();
  }

  /**
   * Compress data
   * @param {Blob|string} data - Data to compress
   * @returns {Promise<Blob>} Compressed data
   */
  async compress(data) {
    if (!this.compressionEnabled) {
      return data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
    }

    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
      const stream = blob.stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      
      return compressedBlob;
    } catch (error) {
      console.error('Compression failed:', error);
      return data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
    }
  }

  /**
   * Decompress data
   * @param {Blob} data - Data to decompress
   * @returns {Promise<Blob>} Decompressed data
   */
  async decompress(data) {
    try {
      const stream = data.stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      
      return decompressedBlob;
    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  /**
   * Calculate optimal chunk size based on data size and network conditions
   * @param {number} dataSize - Data size in bytes
   * @param {object} networkInfo - Network information
   * @returns {number} Optimal chunk size
   */
  calculateOptimalChunkSize(dataSize, networkInfo = {}) {
    const downlink = networkInfo.downlink || 10; // Mbps
    const rtt = networkInfo.rtt || 100; // ms

    // Adjust chunk size based on network quality
    let chunkSize = this.chunkSize;

    if (downlink < 1) {
      // Slow connection: smaller chunks
      chunkSize = 256 * 1024; // 256KB
    } else if (downlink < 5) {
      // Moderate connection: medium chunks
      chunkSize = 512 * 1024; // 512KB
    } else if (downlink > 50) {
      // Fast connection: larger chunks
      chunkSize = 2 * 1024 * 1024; // 2MB
    }

    // Adjust for latency
    if (rtt > 500) {
      chunkSize = Math.min(chunkSize, 256 * 1024);
    }

    // Ensure chunk size is reasonable for the data size
    chunkSize = Math.min(chunkSize, dataSize);
    chunkSize = Math.max(chunkSize, 64 * 1024); // Minimum 64KB

    return chunkSize;
  }

  /**
   * Split data into chunks
   * @param {Blob} data - Data to split
   * @param {number} chunkSize - Chunk size
   * @returns {Promise<Array>} Array of chunks
   */
  async splitIntoChunks(data, chunkSize) {
    const chunks = [];
    let offset = 0;

    while (offset < data.size) {
      const end = Math.min(offset + chunkSize, data.size);
      const chunk = data.slice(offset, end);
      chunks.push(chunk);
      offset = end;
    }

    return chunks;
  }

  /**
   * Combine chunks into single blob
   * @param {Array<Blob>} chunks - Array of chunks
   * @returns {Blob} Combined blob
   */
  combineChunks(chunks) {
    return new Blob(chunks);
  }

  /**
   * Calculate checksum for deduplication
   * @param {string} data - Data string
   * @returns {Promise<string>} Checksum
   */
  async calculateChecksum(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Check if data is duplicate using deduplication cache
   * @param {string} checksum - Data checksum
   * @returns {boolean} Whether data is duplicate
   */
  isDuplicate(checksum) {
    return this.deduplicationCache.has(checksum);
  }

  /**
   * Add to deduplication cache
   * @param {string} checksum - Data checksum
   * @param {object} metadata - Metadata about the data
   */
  addToDeduplicationCache(checksum, metadata = {}) {
    this.deduplicationCache.set(checksum, {
      checksum,
      addedAt: new Date().toISOString(),
      ...metadata
    });

    // Trim cache if it exceeds max size
    if (this.deduplicationCache.size > this.maxCacheSize) {
      const keys = Array.from(this.deduplicationCache.keys());
      const keysToDelete = keys.slice(0, keys.length - this.maxCacheSize);
      keysToDelete.forEach(key => this.deduplicationCache.delete(key));
    }
  }

  /**
   * Optimize data for transfer
   * @param {object} data - Data to optimize
   * @param {object} options - Optimization options
   * @returns {Promise<object>} Optimized data
   */
  async optimizeForTransfer(data, options = {}) {
    const compressionEnabled = options.compressionEnabled !== false && this.compressionEnabled;
    const chunkSize = options.chunkSize || this.chunkSize;
    const deduplicationEnabled = options.deduplicationEnabled !== false && this.deduplicationEnabled;

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = new Blob([dataString]).size;

    // Check for duplicates
    let isDuplicate = false;
    let checksum = null;

    if (deduplicationEnabled) {
      checksum = await this.calculateChecksum(dataString);
      isDuplicate = this.isDuplicate(checksum);
      
      if (!isDuplicate) {
        this.addToDeduplicationCache(checksum, { originalSize });
      }
    }

    // Compress data
    let compressedData = dataString;
    let compressedSize = originalSize;

    if (compressionEnabled && !isDuplicate) {
      const compressedBlob = await this.compress(dataString);
      compressedData = compressedBlob;
      compressedSize = compressedBlob.size;
    }

    return {
      data: compressedData,
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? (compressedSize / originalSize) * 100 : 100,
      compressed: compressionEnabled && !isDuplicate,
      isDuplicate,
      checksum,
      chunkSize
    };
  }

  /**
   * Estimate transfer time
   * @param {number} dataSize - Data size in bytes
   * @param {object} networkInfo - Network information
   * @returns {number} Estimated time in milliseconds
   */
  estimateTransferTime(dataSize, networkInfo = {}) {
    const downlink = networkInfo.downlink || 10; // Mbps
    const rtt = networkInfo.rtt || 100; // ms

    // Convert Mbps to bytes/ms
    const bytesPerMs = (downlink * 1024 * 1024) / 1000;
    
    // Calculate transfer time
    const transferTime = dataSize / bytesPerMs;
    
    // Add latency overhead
    const totalLatency = rtt * 2; // Round trip

    return transferTime + totalLatency;
  }

  /**
   * Get bandwidth statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const cacheEntries = Array.from(this.deduplicationCache.values());
    const totalOriginalSize = cacheEntries.reduce((sum, entry) => sum + (entry.originalSize || 0), 0);
    const duplicateCount = cacheEntries.length;

    return {
      compressionEnabled: this.compressionEnabled,
      chunkSize: this.chunkSize,
      deduplicationEnabled: this.deduplicationEnabled,
      cacheSize: this.deduplicationCache.size,
      duplicateCount,
      totalOriginalSize,
      estimatedSavings: totalOriginalSize // This would be actual savings in production
    };
  }

  /**
   * Set compression enabled
   * @param {boolean} enabled - Whether compression is enabled
   */
  setCompressionEnabled(enabled) {
    this.compressionEnabled = enabled;
    this.saveState();
  }

  /**
   * Set chunk size
   * @param {number} size - Chunk size in bytes
   */
  setChunkSize(size) {
    this.chunkSize = size;
    this.saveState();
  }

  /**
   * Set deduplication enabled
   * @param {boolean} enabled - Whether deduplication is enabled
   */
  setDeduplicationEnabled(enabled) {
    this.deduplicationEnabled = enabled;
    this.saveState();
  }

  /**
   * Clear deduplication cache
   */
  clearDeduplicationCache() {
    this.deduplicationCache.clear();
    this.saveState();
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        compressionEnabled: this.compressionEnabled,
        chunkSize: this.chunkSize,
        deduplicationEnabled: this.deduplicationEnabled
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save bandwidth optimizer state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.compressionEnabled = parsed.compressionEnabled !== false;
        this.chunkSize = parsed.chunkSize || 1024 * 1024;
        this.deduplicationEnabled = parsed.deduplicationEnabled !== false;
      }
    } catch (error) {
      console.error('Failed to load bandwidth optimizer state:', error);
    }
  }

  /**
   * Destroy the bandwidth optimizer
   */
  destroy() {
    this.deduplicationCache.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[BandwidthOptimizer] Destroyed');
  }
}

// Singleton instance
let bandwidthOptimizerInstance = null;

/**
 * Get the singleton bandwidth optimizer instance
 * @returns {BandwidthOptimizer} Bandwidth optimizer instance
 */
export function getBandwidthOptimizer() {
  if (!bandwidthOptimizerInstance) {
    bandwidthOptimizerInstance = new BandwidthOptimizer();
  }
  return bandwidthOptimizerInstance;
}

export default BandwidthOptimizer;
