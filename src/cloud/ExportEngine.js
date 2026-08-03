// Universal Export Engine
// Central engine for all data export operations
// All CafeOS modules use this engine for exports

import storageEngine from './StorageEngine.js';

/**
 * Export Engine
 * Universal orchestration layer for all export operations
 * Supports multiple formats and destinations
 */
class ExportEngine {
  constructor() {
    this.initialized = false;
    this.exportQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the export engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize storage engine
    await storageEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Export data to specified format and destination
   * @param {object} data - Data to export
   * @param {string} format - Format: csv, json, pdf, zip
   * @param {string} destination - Destination: download, local, cloud
   * @param {object} options - Export options
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async export(data, format, destination, options = {}) {
    try {
      // Validate inputs
      if (!data) {
        return { success: false, error: 'No data provided for export' };
      }

      if (!['csv', 'json', 'pdf', 'zip'].includes(format)) {
        return { success: false, error: 'Unsupported format' };
      }

      if (!['download', 'local', 'cloud'].includes(destination)) {
        return { success: false, error: 'Unsupported destination' };
      }

      // Convert data to specified format
      const formattedData = await this.convertToFormat(data, format, options);
      
      if (!formattedData.success) {
        return formattedData;
      }

      // Generate filename
      const filename = this.generateFilename(format, options);

      // Handle based on destination
      switch (destination) {
        case 'download':
          return await this.exportToDownload(formattedData.data, filename, format);
        case 'local':
          return await this.exportToLocalStorage(formattedData.data, filename, format);
        case 'cloud':
          return await this.exportToCloud(formattedData.data, filename, format, options);
        default:
          return { success: false, error: 'Invalid destination' };
      }
    } catch (error) {
      console.error('[ExportEngine] Export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to specified format
   * @param {object} data 
   * @param {string} format 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async convertToFormat(data, format, options) {
    try {
      switch (format) {
        case 'csv':
          return this.convertToCSV(data, options);
        case 'json':
          return this.convertToJSON(data, options);
        case 'pdf':
          return await this.convertToPDF(data, options);
        case 'zip':
          return await this.convertToZIP(data, options);
        default:
          return { success: false, error: 'Unsupported format' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to CSV format
   * @param {object} data 
   * @param {object} options 
   * @returns {{success: boolean, data?: string, error?: string}}
   */
  convertToCSV(data, options = {}) {
    try {
      if (!Array.isArray(data)) {
        // If data is an object, convert to array
        if (typeof data === 'object' && data !== null) {
          data = [data];
        } else {
          return { success: false, error: 'Data must be an array or object' };
        }
      }

      if (data.length === 0) {
        return { success: false, error: 'No data to export' };
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Build CSV string
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.join(','));
      
      // Add data rows
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) {
            return '';
          }
          // Handle objects/arrays
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          // Escape quotes and commas
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      
      return { success: true, data: csvString };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to JSON format
   * @param {object} data 
   * @param {object} options 
   * @returns {{success: boolean, data?: string, error?: string}}
   */
  convertToJSON(data, options = {}) {
    try {
      const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
      return { success: true, data: jsonString };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to PDF format
   * @param {object} data 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async convertToPDF(data, options = {}) {
    try {
      // Stub for PDF generation
      // In production, this would use a library like jsPDF or react-pdf
      // For now, we'll return a placeholder
      const pdfContent = JSON.stringify(data, null, 2);
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to ZIP format
   * @param {object} data 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async convertToZIP(data, options = {}) {
    try {
      // Stub for ZIP generation
      // In production, this would use a library like JSZip
      // For now, we'll return a placeholder
      const zipContent = JSON.stringify(data, null, 2);
      const blob = new Blob([zipContent], { type: 'application/zip' });
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export to browser download
   * @param {string|Blob} data 
   * @param {string} filename 
   * @param {string} format 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async exportToDownload(data, filename, format) {
    try {
      const mimeType = this.getMimeType(format);
      const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      // Log export
      await this.logExport('download', format, filename);
      
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export to local storage
   * @param {string|Blob} data 
   * @param {string} filename 
   * @param {string} format 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async exportToLocalStorage(data, filename, format) {
    try {
      const key = `exports/${filename}`;
      const blob = data instanceof Blob ? data : new Blob([data]);
      
      const result = await storageEngine.upload(blob, key);
      
      if (result.success) {
        // Log export
        await this.logExport('local', format, filename);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export to cloud storage
   * @param {string|Blob} data 
   * @param {string} filename 
   * @param {string} format 
   * @param {object} options 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async exportToCloud(data, filename, format, options = {}) {
    try {
      const key = `exports/${Date.now()}/${filename}`;
      const blob = data instanceof Blob ? data : new Blob([data]);
      
      const result = await storageEngine.upload(blob, key, {
        metadata: {
          format,
          module: options.module || 'unknown',
          exportedBy: options.exportedBy || 'system'
        }
      });
      
      if (result.success) {
        // Log export
        await this.logExport('cloud', format, filename);
      } else {
        // Queue for retry
        this.exportQueue.push({ data, filename, format, options, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      // Queue for retry
      this.exportQueue.push({ data, filename, format, options, timestamp: Date.now() });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate filename for export
   * @param {string} format 
   * @param {object} options 
   * @returns {string}
   */
  generateFilename(format, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = options.prefix || 'cafeos-export';
    const module = options.module ? `-${options.module}` : '';
    return `${prefix}${module}-${timestamp}.${format}`;
  }

  /**
   * Get MIME type for format
   * @param {string} format 
   * @returns {string}
   */
  getMimeType(format) {
    const mimeTypes = {
      csv: 'text/csv',
      json: 'application/json',
      pdf: 'application/pdf',
      zip: 'application/zip'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Process export queue (retry failed exports)
   */
  async processExportQueue() {
    if (this.isProcessingQueue || this.exportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    for (const item of this.exportQueue) {
      try {
        await this.exportToCloud(item.data, item.filename, item.format, item.options);
        // Remove from queue on success
        this.exportQueue = this.exportQueue.filter(i => i !== item);
      } catch (error) {
        // Keep in queue for retry
        console.error('[ExportEngine] Queue export failed:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Log export operation
   * @param {string} destination 
   * @param {string} format 
   * @param {string} filename 
   */
  async logExport(destination, format, filename) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_export_logs') || '[]');
      logs.push({
        destination,
        format,
        filename,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_export_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[ExportEngine] Failed to log export:', error);
    }
  }

  /**
   * Get export logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_export_logs') || '[]');
      
      let filtered = logs;
      
      if (options.destination) {
        filtered = filtered.filter(log => log.destination === options.destination);
      }
      
      if (options.format) {
        filtered = filtered.filter(log => log.format === options.format);
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
   * Get export statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_export_logs') || '[]');
      
      const stats = {
        total: logs.length,
        byDestination: {},
        byFormat: {},
        recent: logs.slice(-10)
      };
      
      for (const log of logs) {
        stats.byDestination[log.destination] = (stats.byDestination[log.destination] || 0) + 1;
        stats.byFormat[log.format] = (stats.byFormat[log.format] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        total: 0,
        byDestination: {},
        byFormat: {},
        recent: []
      };
    }
  }
}

// Singleton instance
const exportEngine = new ExportEngine();

export default exportEngine;
