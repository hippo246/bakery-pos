// Low Data Mode Optimization
// Optimizes payment flows for slow 2G/3G connections in India

export class LowDataMode {
  constructor() {
    this.enabled = false;
    this.connectionSpeed = 'unknown';
    this.dataUsage = {
      total: 0,
      session: 0
    };
    this.compressionEnabled = true;
    this.imageQuality = 'low';
    this.loadSettings();
    this.detectConnectionSpeed();
    this.setupConnectionListeners();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_low_data_mode');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled || false;
        this.compressionEnabled = parsed.compressionEnabled !== false;
        this.imageQuality = parsed.imageQuality || 'low';
      }
    } catch (error) {
      console.error('[LowDataMode] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        compressionEnabled: this.compressionEnabled,
        imageQuality: this.imageQuality
      };
      localStorage.setItem('cafeos_low_data_mode', JSON.stringify(settings));
    } catch (error) {
      console.error('[LowDataMode] Failed to save settings:', error);
    }
  }

  /**
   * Detect connection speed
   */
  detectConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.connectionSpeed = this.categorizeConnection(connection);
      
      // Auto-enable low data mode for slow connections
      if (this.connectionSpeed === '2g' || this.connectionSpeed === '3g') {
        this.enabled = true;
        this.saveSettings();
      }
    }
  }

  /**
   * Categorize connection type
   */
  categorizeConnection(connection) {
    if (connection.effectiveType) {
      return connection.effectiveType;
    }
    
    if (connection.type === 'cellular') {
      return '3g'; // Default to 3g for cellular
    }
    
    if (connection.type === 'wifi') {
      return 'wifi';
    }
    
    return 'unknown';
  }

  /**
   * Setup connection event listeners
   */
  setupConnectionListeners() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      connection.addEventListener('change', () => {
        this.connectionSpeed = this.categorizeConnection(connection);
        
        if (this.connectionSpeed === '2g' || this.connectionSpeed === '3g') {
          this.enabled = true;
        }
        
        console.log('[LowDataMode] Connection changed:', this.connectionSpeed);
      });
    }
  }

  /**
   * Enable low data mode
   */
  enable() {
    this.enabled = true;
    this.saveSettings();
    console.log('[LowDataMode] Enabled');
  }

  /**
   * Disable low data mode
   */
  disable() {
    this.enabled = false;
    this.saveSettings();
    console.log('[LowDataMode] Disabled');
  }

  /**
   * Check if low data mode is active
   */
  isActive() {
    return this.enabled;
  }

  /**
   * Optimize payment request for low data
   */
  optimizePaymentRequest(paymentDetails) {
    if (!this.enabled) return paymentDetails;

    const optimized = { ...paymentDetails };

    // Remove unnecessary fields
    delete optimized.theme;
    delete optimized.redirectTarget;
    
    // Compress customer info
    if (optimized.customerInfo) {
      optimized.customerInfo = {
        n: optimized.customerInfo.name?.substring(0, 20), // Truncate name
        p: optimized.customerInfo.phone, // Keep phone
        e: optimized.customerInfo.email ? '1' : '0' // Just flag if email exists
      };
    }

    // Round amount to reduce precision
    if (optimized.amount) {
      optimized.amount = Math.round(optimized.amount);
    }

    return optimized;
  }

  /**
   * Optimize image URL for low data
   */
  optimizeImageURL(url, size = 150) {
    if (!this.enabled) return url;

    // Add size parameter to URL if supported
    if (url.includes('qrserver.com')) {
      return url.replace(/size=\d+x\d+/, `size=${size}x${size}`);
    }

    return url;
  }

  /**
   * Get optimized image quality
   */
  getImageQuality() {
    if (!this.enabled) return 'high';
    
    const qualityMap = {
      'low': 50,
      'medium': 70,
      'high': 90
    };

    return qualityMap[this.imageQuality] || 50;
  }

  /**
   * Compress data before sending
   */
  async compressData(data) {
    if (!this.enabled || !this.compressionEnabled) return data;

    try {
      const jsonString = JSON.stringify(data);
      const compressed = await this.gzipCompress(jsonString);
      
      this.trackDataUsage(jsonString.length, compressed.length);
      
      return {
        compressed: true,
        data: compressed,
        originalSize: jsonString.length,
        compressedSize: compressed.length
      };
    } catch (error) {
      console.error('[LowDataMode] Compression failed:', error);
      return data;
    }
  }

  /**
   * Simple gzip compression simulation
   * In production, use a proper compression library
   */
  async gzipCompress(string) {
    // This is a simplified version - in production use pako or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    
    // Simple RLE compression for demonstration
    const compressed = [];
    let count = 1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === data[i - 1] && count < 255) {
        count++;
      } else {
        compressed.push(data[i - 1], count);
        count = 1;
      }
    }
    compressed.push(data[data.length - 1], count);
    
    return btoa(String.fromCharCode(...compressed));
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData) {
    if (!compressedData.compressed) return compressedData;

    try {
      const decompressed = await this.gzipDecompress(compressedData.data);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('[LowDataMode] Decompression failed:', error);
      return compressedData;
    }
  }

  /**
   * Simple gzip decompression simulation
   */
  async gzipDecompress(compressed) {
    const data = atob(compressed);
    const decompressed = [];
    
    for (let i = 0; i < data.length; i += 2) {
      const char = data.charCodeAt(i);
      const count = data.charCodeAt(i + 1);
      
      for (let j = 0; j < count; j++) {
        decompressed.push(char);
      }
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(decompressed));
  }

  /**
   * Track data usage
   */
  trackDataUsage(originalSize, compressedSize) {
    this.dataUsage.total += originalSize;
    this.dataUsage.session += compressedSize;
  }

  /**
   * Get data usage statistics
   */
  getDataUsage() {
    const saved = this.dataUsage.total - this.dataUsage.session;
    const savedPercentage = this.dataUsage.total > 0 
      ? ((saved / this.dataUsage.total) * 100).toFixed(1) 
      : 0;

    return {
      total: this.formatBytes(this.dataUsage.total),
      session: this.formatBytes(this.dataUsage.session),
      saved: this.formatBytes(saved),
      savedPercentage
    };
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Reset session data usage
   */
  resetSessionUsage() {
    this.dataUsage.session = 0;
  }

  /**
   * Get optimized polling interval
   */
  getPollingInterval(defaultInterval = 5000) {
    if (!this.enabled) return defaultInterval;
    
    // Increase polling interval for slow connections
    const speedMultipliers = {
      '2g': 3,
      '3g': 2,
      'wifi': 1,
      'unknown': 1
    };

    const multiplier = speedMultipliers[this.connectionSpeed] || 1;
    return defaultInterval * multiplier;
  }

  /**
   * Get timeout for requests
   */
  getRequestTimeout(defaultTimeout = 30000) {
    if (!this.enabled) return defaultTimeout;
    
    // Increase timeout for slow connections
    const speedMultipliers = {
      '2g': 2,
      '3g': 1.5,
      'wifi': 1,
      'unknown': 1
    };

    const multiplier = speedMultipliers[this.connectionSpeed] || 1;
    return defaultTimeout * multiplier;
  }

  /**
   * Check if should use offline mode
   */
  shouldUseOfflineMode() {
    return this.enabled && this.connectionSpeed === '2g';
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      enabled: this.enabled,
      connectionSpeed: this.connectionSpeed,
      compressionEnabled: this.compressionEnabled,
      imageQuality: this.imageQuality,
      online: navigator.onLine
    };
  }

  /**
   * Set image quality
   */
  setImageQuality(quality) {
    const validQualities = ['low', 'medium', 'high'];
    if (validQualities.includes(quality)) {
      this.imageQuality = quality;
      this.saveSettings();
    }
  }

  /**
   * Toggle compression
   */
  toggleCompression() {
    this.compressionEnabled = !this.compressionEnabled;
    this.saveSettings();
  }

  /**
   * Destroy the low data mode
   */
  destroy() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      connection.removeEventListener('change', () => {});
    }
    console.log('[LowDataMode] Destroyed');
  }
}

// Singleton instance
let lowDataModeInstance = null;

/**
 * Get the singleton low data mode instance
 */
export function getLowDataMode() {
  if (!lowDataModeInstance) {
    lowDataModeInstance = new LowDataMode();
  }
  return lowDataModeInstance;
}

export default LowDataMode;
