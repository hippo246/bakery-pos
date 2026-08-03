// Import Engine
// Universal import engine with format detection

import { ImportInterface } from './ExportInterface.js';
import { ImportFormat, ImportStatus } from './ExportTypes.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';

export class ImportEngine extends ImportInterface {
  constructor(config = {}) {
    super(config);
    this.importers = new Map();
    this.initializeImporters();
  }

  /**
   * Initialize format-specific importers
   */
  initializeImporters() {
    this.importers.set(ImportFormat.CSV, new CSVImporter());
    this.importers.set(ImportFormat.JSON, new JSONImporter());
    this.importers.set(ImportFormat.EXCEL, new ExcelImporter());
    this.importers.set(ImportFormat.ZIP, new ZIPImporter());
    this.importers.set(ImportFormat.CAFEOS, new CafeOSImporter());
  }

  /**
   * Initialize the import
   */
  async initialize() {
    this.status = ImportStatus.PENDING;
    return { success: true };
  }

  /**
   * Detect format from file
   */
  async detectFormat(file) {
    this.status = ImportStatus.DETECTING;
    this.updateProgress(10, 'Detecting file format');

    const extension = file.name.split('.').pop().toLowerCase();
    
    // Detect by extension
    const formatMap = {
      'csv': ImportFormat.CSV,
      'json': ImportFormat.JSON,
      'xlsx': ImportFormat.EXCEL,
      'xls': ImportFormat.EXCEL,
      'zip': ImportFormat.ZIP,
      'cafeos': ImportFormat.CAFEOS
    };

    let detectedFormat = formatMap[extension];

    // If not detected by extension, try content detection
    if (!detectedFormat) {
      detectedFormat = await this.detectByContent(file);
    }

    this.updateProgress(30, `Format detected: ${detectedFormat}`);
    
    return {
      success: true,
      format: detectedFormat,
      filename: file.name,
      size: file.size
    };
  }

  /**
   * Detect format by content
   */
  async detectByContent(file) {
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const content = e.target.result;
        
        // Try JSON
        try {
          JSON.parse(content);
          resolve(ImportFormat.JSON);
          return;
        } catch {
          // Not JSON
        }

        // Try CSV (check for comma-separated values)
        if (content.includes(',') && content.includes('\n')) {
          resolve(ImportFormat.CSV);
          return;
        }

        // Default to CSV
        resolve(ImportFormat.CSV);
      };

      reader.onerror = () => {
        resolve(ImportFormat.CSV); // Default fallback
      };

      reader.readAsText(file.slice(0, 1000)); // Read first 1KB for detection
    });
  }

  /**
   * Parse file
   */
  async parseFile(file, format = null) {
    try {
      this.status = ImportStatus.PROCESSING;
      this.updateProgress(40, 'Parsing file');

      if (!format) {
        const detection = await this.detectFormat(file);
        format = detection.format;
      }

      const importer = this.importers.get(format);
      if (!importer) {
        throw new Error(`Unsupported import format: ${format}`);
      }

      this.updateProgress(50, `Parsing as ${format}`);
      
      const result = await importer.parse(file);
      
      this.updateProgress(70, 'File parsed successfully');

      return {
        success: true,
        format,
        data: result.data,
        headers: result.headers,
        recordCount: result.data.length
      };
    } catch (error) {
      this.status = ImportStatus.FAILED;
      console.error('File parsing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate data
   */
  async validateData(data, schema = null) {
    this.status = ImportStatus.VALIDATING;
    this.updateProgress(80, 'Validating data');

    const errors = [];
    const warnings = [];

    if (!Array.isArray(data) || data.length === 0) {
      errors.push({
        type: 'missing_data',
        message: 'No data found or invalid data format'
      });
    }

    // Basic validation
    if (Array.isArray(data)) {
      data.forEach((record, index) => {
        if (!record || typeof record !== 'object') {
          errors.push({
            type: 'invalid_record',
            row: index + 1,
            message: `Invalid record at row ${index + 1}`
          });
        }
      });
    }

    // Schema validation if provided
    if (schema && Array.isArray(data)) {
      data.forEach((record, index) => {
        schema.requiredFields?.forEach(field => {
          if (!record[field]) {
            errors.push({
              type: 'missing_required_field',
              row: index + 1,
              field,
              message: `Missing required field: ${field}`
            });
          }
        });
      });
    }

    this.updateProgress(90, 'Validation completed');

    return {
      success: errors.length === 0,
      valid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length
    };
  }

  /**
   * Import data
   */
  async import(data, _options = {}) {
    try {
      this.status = ImportStatus.IMPORTING;
      this.updateProgress(95, 'Importing data');

      // Placeholder for actual import logic
      // In production, this would integrate with the Storage Engine
      
      const result = {
        success: true,
        imported: data.length,
        skipped: 0,
        failed: 0,
        duration: 0
      };

      this.updateProgress(100, 'Import completed');
      this.status = ImportStatus.COMPLETED;

      return result;
    } catch (_error) {
      this.status = ImportStatus.FAILED;
      console.error('Import failed');
      return {
        success: false,
        error: 'Import failed'
      };
    }
  }

  /**
   * Validate import configuration
   */
  validate() {
    if (!this.format) {
      return { valid: false, reason: 'Import format not specified' };
    }

    if (!this.importers.has(this.format)) {
      return { valid: false, reason: `Unsupported import format: ${this.format}` };
    }

    return { valid: true };
  }
}

/**
 * CSV Importer
 */
class CSVImporter {
  async parse(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const lines = content.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('Empty CSV file'));
            return;
          }

          const headers = this.parseCSVLine(lines[0]);
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const record = {};
            
            headers.forEach((header, index) => {
              record[header] = values[index] || '';
            });
            
            data.push(record);
          }

          resolve({ data, headers });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

/**
 * JSON Importer
 */
class JSONImporter {
  async parse(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          
          let data = [];
          let headers = [];

          if (Array.isArray(content)) {
            data = content;
            if (data.length > 0) {
              headers = Object.keys(data[0]);
            }
          } else if (content.data && Array.isArray(content.data)) {
            data = content.data;
            if (data.length > 0) {
              headers = Object.keys(data[0]);
            }
          } else if (content.metadata && content.data) {
            data = content.data;
            if (data.length > 0) {
              headers = Object.keys(data[0]);
            }
          }

          resolve({ data, headers });
        } catch (error) {
          reject(new Error('Invalid JSON format'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

/**
 * Excel Importer (placeholder)
 */
class ExcelImporter {
  async parse(file) {
    // Placeholder for Excel parsing
    // In production would use a library like xlsx or exceljs
    const csvImporter = new CSVImporter();
    return await csvImporter.parse(file);
  }
}

/**
 * ZIP Importer (placeholder)
 */
class ZIPImporter {
  async parse(_file) {
    // Placeholder for ZIP parsing
    // In production would use a library like jszip
    throw new Error('ZIP import requires additional library');
  }
}

/**
 * CafeOS Importer
 */
class CafeOSImporter {
  async parse(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);
          
          // Check if encrypted
          if (content.encrypted) {
            const encryptionEngine = getEncryptionEngine();
            const decrypted = await encryptionEngine.decryptBlob(content.data);
            
            if (!decrypted.success) {
              reject(new Error('Failed to decrypt CafeOS package'));
              return;
            }

            const decryptedContent = JSON.parse(await decrypted.decryptedData.text());
            const data = decryptedContent.data || [];
            const headers = data.length > 0 ? Object.keys(data[0]) : [];
            
            resolve({ data, headers });
          } else {
            const data = content.data || [];
            const headers = data.length > 0 ? Object.keys(data[0]) : [];
            resolve({ data, headers });
          }
        } catch (_error) {
          reject(new Error('Invalid CafeOS package format'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export default ImportEngine;
