// Field Mapper
// Intelligent field mapping with suggestions

export class FieldMapper {
  constructor() {
    this.commonMappings = new Map();
    this.templates = new Map();
    this.storageKey = 'cafeos_field_mapper';
    this.loadState();
    this.initializeCommonMappings();
  }

  /**
   * Initialize common field mappings
   */
  initializeCommonMappings() {
    // Customer mappings
    this.addCommonMapping('customer', [
      { source: 'customer_name', target: 'name' },
      { source: 'customer_name', target: 'fullName' },
      { source: 'name', target: 'fullName' },
      { source: 'mobile', target: 'phone' },
      { source: 'phone', target: 'mobile' },
      { source: 'telephone', target: 'phone' },
      { source: 'email', target: 'emailAddress' },
      { source: 'email_address', target: 'email' },
      { source: 'address', target: 'streetAddress' },
      { source: 'street', target: 'streetAddress' },
      { source: 'city', target: 'city' },
      { source: 'state', target: 'region' },
      { source: 'province', target: 'region' },
      { source: 'zip', target: 'postalCode' },
      { source: 'postal_code', target: 'zip' },
      { source: 'postcode', target: 'postalCode' },
      { source: 'gst', target: 'taxId' },
      { source: 'tax_id', target: 'gst' },
      { source: 'vat', target: 'taxId' }
    ]);

    // Product mappings
    this.addCommonMapping('product', [
      { source: 'product_name', target: 'name' },
      { source: 'item_name', target: 'name' },
      { source: 'sku', target: 'code' },
      { source: 'code', target: 'sku' },
      { source: 'barcode', target: 'upc' },
      { source: 'upc', target: 'barcode' },
      { source: 'price', target: 'unitPrice' },
      { source: 'unit_price', target: 'price' },
      { source: 'cost', target: 'unitCost' },
      { source: 'unit_cost', target: 'cost' },
      { source: 'quantity', target: 'qty' },
      { source: 'qty', target: 'quantity' },
      { source: 'stock', target: 'quantity' },
      { source: 'category', target: 'category' },
      { source: 'tax_rate', target: 'taxRate' },
      { source: 'taxrate', target: 'taxRate' }
    ]);

    // Order mappings
    this.addCommonMapping('order', [
      { source: 'order_id', target: 'id' },
      { source: 'order_number', target: 'orderNumber' },
      { source: 'order_no', target: 'orderNumber' },
      { source: 'customer_id', target: 'customerId' },
      { source: 'customer', target: 'customerId' },
      { source: 'table_id', target: 'tableId' },
      { source: 'table', target: 'tableId' },
      { source: 'table_no', target: 'tableNumber' },
      { source: 'table_number', target: 'tableNumber' },
      { source: 'total', target: 'totalAmount' },
      { source: 'total_amount', target: 'total' },
      { source: 'subtotal', target: 'subTotal' },
      { source: 'sub_total', target: 'subtotal' },
      { source: 'tax', target: 'taxAmount' },
      { source: 'tax_amount', target: 'tax' },
      { source: 'discount', target: 'discountAmount' },
      { source: 'discount_amount', target: 'discount' },
      { source: 'created_at', target: 'createdAt' },
      { source: 'date', target: 'createdAt' },
      { source: 'order_date', target: 'createdAt' }
    ]);

    // Staff mappings
    this.addCommonMapping('staff', [
      { source: 'staff_name', target: 'name' },
      { source: 'employee_name', target: 'name' },
      { source: 'employee_id', target: 'id' },
      { source: 'staff_id', target: 'id' },
      { source: 'role', target: 'position' },
      { source: 'position', target: 'role' },
      { source: 'department', target: 'section' },
      { source: 'section', target: 'department' }
    ]);

    // Table mappings
    this.addCommonMapping('table', [
      { source: 'table_id', target: 'id' },
      { source: 'table_no', target: 'number' },
      { source: 'table_number', target: 'number' },
      { source: 'capacity', target: 'seats' },
      { source: 'seats', target: 'capacity' },
      { source: 'section', target: 'area' },
      { source: 'area', target: 'section' }
    ]);
  }

  /**
   * Add common mapping
   * @param {string} type - Mapping type
   * @param {Array} mappings - Array of mappings
   */
  addCommonMapping(type, mappings) {
    this.commonMappings.set(type, mappings);
  }

  /**
   * Suggest field mappings
   * @param {Array} sourceFields - Source field names
   * @param {Array} targetFields - Target field names
   * @param {string} type - Mapping type (optional)
   * @returns {object} Suggested mappings
   */
  suggestMappings(sourceFields, targetFields, type = null) {
    const suggestions = {};
    const unmapped = [...sourceFields];

    // Use type-specific mappings if available
    if (type && this.commonMappings.has(type)) {
      const typeMappings = this.commonMappings.get(type);
      
      typeMappings.forEach(mapping => {
        if (sourceFields.includes(mapping.source) && targetFields.includes(mapping.target)) {
          suggestions[mapping.source] = mapping.target;
          const index = unmapped.indexOf(mapping.source);
          if (index > -1) unmapped.splice(index, 1);
        }
      });
    }

    // Fuzzy matching for remaining fields
    unmapped.forEach(sourceField => {
      const bestMatch = this.findBestMatch(sourceField, targetFields);
      if (bestMatch) {
        suggestions[sourceField] = bestMatch;
      }
    });

    return {
      mappings: suggestions,
      unmapped: unmapped.filter(f => !suggestions[f]),
      confidence: this.calculateConfidence(suggestions, sourceFields.length)
    };
  }

  /**
   * Find best match for a field
   * @param {string} sourceField - Source field name
   * @param {Array} targetFields - Target field names
   * @returns {string|null} Best match
   */
  findBestMatch(sourceField, targetFields) {
    const sourceLower = sourceField.toLowerCase().replace(/[_\s-]/g, '');
    
    let bestMatch = null;
    let bestScore = 0;

    targetFields.forEach(targetField => {
      const targetLower = targetField.toLowerCase().replace(/[_\s-]/g, '');
      
      // Exact match
      if (sourceLower === targetLower) {
        return targetField;
      }

      // Contains match
      if (sourceLower.includes(targetLower) || targetLower.includes(sourceLower)) {
        const score = Math.max(sourceLower.length, targetLower.length) / 
                      Math.min(sourceLower.length, targetLower.length);
        if (score > bestScore && score > 0.7) {
          bestScore = score;
          bestMatch = targetField;
        }
      }

      // Levenshtein distance (simplified)
      const distance = this.calculateLevenshteinDistance(sourceLower, targetLower);
      const maxLength = Math.max(sourceLower.length, targetLower.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.8 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = targetField;
      }
    });

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Distance
   */
  calculateLevenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Calculate mapping confidence
   * @param {object} mappings - Mappings
   * @param {number} totalFields - Total number of fields
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidence(mappings, totalFields) {
    const mappedCount = Object.keys(mappings).length;
    return Math.round((mappedCount / totalFields) * 100);
  }

  /**
   * Apply field mapping to data
   * @param {Array} data - Data to map
   * @param {object} fieldMapping - Field mapping
   * @returns {Array} Mapped data
   */
  applyMapping(data, fieldMapping) {
    return data.map(record => {
      const mappedRecord = {};
      
      Object.keys(fieldMapping).forEach(sourceField => {
        const targetField = fieldMapping[sourceField];
        mappedRecord[targetField] = record[sourceField];
      });

      // Include unmapped fields as-is
      Object.keys(record).forEach(field => {
        if (!fieldMapping[field]) {
          mappedRecord[field] = record[field];
        }
      });

      return mappedRecord;
    });
  }

  /**
   * Save mapping template
   * @param {string} name - Template name
   * @param {string} type - Mapping type
   * @param {object} mappings - Field mappings
   * @returns {object} Save result
   */
  saveTemplate(name, type, mappings) {
    const template = {
      name,
      type,
      mappings,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    this.templates.set(name, template);
    this.saveState();

    return { success: true, name };
  }

  /**
   * Load mapping template
   * @param {string} name - Template name
   * @returns {object|null} Template
   */
  loadTemplate(name) {
    const template = this.templates.get(name);
    
    if (template) {
      template.lastUsed = new Date().toISOString();
      this.saveState();
    }

    return template || null;
  }

  /**
   * Get all templates
   * @param {string} type - Filter by type (optional)
   * @returns {Array} Templates
   */
  getTemplates(type = null) {
    const templates = Array.from(this.templates.values());
    
    if (type) {
      return templates.filter(t => t.type === type);
    }

    return templates;
  }

  /**
   * Delete template
   * @param {string} name - Template name
   * @returns {object} Delete result
   */
  deleteTemplate(name) {
    const deleted = this.templates.delete(name);
    this.saveState();
    return { success: deleted, name };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        templates: Array.from(this.templates.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save field mapper state:', error);
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
        this.templates = new Map(parsed.templates || []);
      }
    } catch (error) {
      console.error('Failed to load field mapper state:', error);
      this.templates = new Map();
    }
  }

  /**
   * Destroy the field mapper
   */
  destroy() {
    this.commonMappings.clear();
    this.templates.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[FieldMapper] Destroyed');
  }
}

// Singleton instance
let fieldMapperInstance = null;

/**
 * Get the singleton field mapper instance
 * @returns {FieldMapper} Field mapper instance
 */
export function getFieldMapper() {
  if (!fieldMapperInstance) {
    fieldMapperInstance = new FieldMapper();
  }
  return fieldMapperInstance;
}

export default FieldMapper;
