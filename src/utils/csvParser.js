// CSV Parser for CafeOS Import/Export
// Handles CSV parsing with proper validation, error handling, and type coercion

/**
 * Parse CSV string to array of objects
 * @param {string} csvContent - CSV string content
 * @param {object} options - Parsing options
 * @returns {object} { success: boolean, data: array, errors: array }
 */
export function parseCSV(csvContent, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true,
    skipEmptyRows = true,
    trimValues = true
  } = options;

  if (!csvContent || typeof csvContent !== 'string') {
    return { success: false, data: [], errors: ['Invalid CSV content'] };
  }

  try {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      return { success: false, data: [], errors: ['Empty CSV file'] };
    }

    // Parse header
    let headers = [];
    let startIndex = 0;

    if (hasHeader) {
      headers = parseCSVLine(lines[0], delimiter, trimValues);
      startIndex = 1;
    } else {
      // Generate column names if no header
      const firstLineCols = parseCSVLine(lines[0], delimiter, trimValues);
      headers = firstLineCols.map((_, i) => `column_${i}`);
    }

    const data = [];
    const errors = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (skipEmptyRows && !line) continue;

      try {
        const values = parseCSVLine(line, delimiter, trimValues);
        const row = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        data.push(row);
      } catch (err) {
        errors.push(`Error parsing line ${i + 1}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      headers
    };
  } catch (err) {
    return { success: false, data: [], errors: [err.message] };
  }
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line, delimiter, trimValues) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentValue += '"';
        i += 2;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      values.push(trimValues ? currentValue.trim() : currentValue);
      currentValue = '';
      i++;
    } else {
      currentValue += char;
      i++;
    }
  }

  values.push(trimValues ? currentValue.trim() : currentValue);
  return values;
}

/**
 * Convert array of objects to CSV string
 * @param {array} data - Array of objects
 * @param {array} headers - Optional custom headers
 * @returns {string} CSV string
 */
export function arrayToCSV(data, headers = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headersToUse = headers || Object.keys(data[0]);
  const csvLines = [];

  // Header row
  csvLines.push(headersToUse.map(escapeCSVField).join(','));

  // Data rows
  data.forEach(row => {
    const values = headersToUse.map(header => {
      const value = row[header];
      return escapeCSVField(value);
    });
    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  
  // If value contains comma, quote, newline, or leading/trailing spaces, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || 
      stringValue.includes('\n') || stringValue.includes('\r') ||
      stringValue.startsWith(' ') || stringValue.endsWith(' ')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Validate CSV data against schema
 * @param {array} data - Parsed CSV data
 * @param {object} schema - Validation schema
 * @returns {object} { valid: boolean, errors: array, warnings: array }
 */
export function validateCSVData(data, schema) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Data is not an array'], warnings: [] };
  }

  data.forEach((row, rowIndex) => {
    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = row[field];

      // Required check
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push(`Row ${rowIndex + 1}: Field '${field}' is required`);
      }

      // Type check
      if (value !== '' && value !== null && value !== undefined) {
        if (rules.type === 'number' && isNaN(Number(value))) {
          errors.push(`Row ${rowIndex + 1}: Field '${field}' must be a number`);
        }
        if (rules.type === 'integer' && !/^-?\d+$/.test(value)) {
          errors.push(`Row ${rowIndex + 1}: Field '${field}' must be an integer`);
        }
        if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`Row ${rowIndex + 1}: Field '${field}' must be a valid email`);
        }
        if (rules.type === 'phone' && !/^\+?[\d\s-()]+$/.test(value)) {
          warnings.push(`Row ${rowIndex + 1}: Field '${field}' may not be a valid phone number`);
        }
      }

      // Min/max check for numbers
      if (rules.type === 'number' || rules.type === 'integer') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`Row ${rowIndex + 1}: Field '${field}' must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && numValue > rules.max) {
            errors.push(`Row ${rowIndex + 1}: Field '${field}' must be at most ${rules.max}`);
          }
        }
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Row ${rowIndex + 1}: Field '${field}' must be one of: ${rules.enum.join(', ')}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Coerce CSV values to proper types
 * @param {array} data - Parsed CSV data
 * @param {object} schema - Type coercion schema
 * @returns {array} Coerced data
 */
export function coerceCSVTypes(data, schema) {
  return data.map(row => {
    const coercedRow = { ...row };

    Object.keys(schema).forEach(field => {
      const type = schema[field].type;
      const value = row[field];

      if (value === '' || value === null || value === undefined) {
        coercedRow[field] = null;
        return;
      }

      switch (type) {
        case 'number':
          coercedRow[field] = Number(value);
          break;
        case 'integer':
          coercedRow[field] = parseInt(value, 10);
          break;
        case 'boolean':
          coercedRow[field] = value.toLowerCase() === 'true' || value === '1';
          break;
        case 'array':
          coercedRow[field] = value.split(',').map(v => v.trim()).filter(Boolean);
          break;
        default:
          coercedRow[field] = value;
      }
    });

    return coercedRow;
  });
}

/**
 * Detect duplicates in CSV data
 * @param {array} data - CSV data
 * @param {string} keyField - Field to check for duplicates
 * @returns {array} Array of duplicate values
 */
export function detectCSVDuplicates(data, keyField) {
  const values = data.map(row => row[keyField]).filter(Boolean);
  const duplicates = [];

  values.forEach(value => {
    if (values.filter(v => v === value).length > 1 && !duplicates.includes(value)) {
      duplicates.push(value);
    }
  });

  return duplicates;
}

export default {
  parseCSV,
  arrayToCSV,
  validateCSVData,
  coerceCSVTypes,
  detectCSVDuplicates
};
