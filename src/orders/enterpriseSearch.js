// Enterprise Search
// Search everything: Order, Customer, Table, Receipt, Staff, Shift, Terminal, Payment, Workflow, Incident, Reservation, Invoice

import { now } from '../domain/dates.js';

const SEARCH_INDEX_KEY = 'cafeos_search_index';

/**
 * Search Entity Types
 */
export const SEARCH_ENTITY_TYPES = {
  ORDER: 'ORDER',
  CUSTOMER: 'CUSTOMER',
  TABLE: 'TABLE',
  RECEIPT: 'RECEIPT',
  STAFF: 'STAFF',
  SHIFT: 'SHIFT',
  TERMINAL: 'TERMINAL',
  PAYMENT: 'PAYMENT',
  WORKFLOW: 'WORKFLOW',
  INCIDENT: 'INCIDENT',
  RESERVATION: 'RESERVATION',
  INVOICE: 'INVOICE',
  PRODUCT: 'PRODUCT',
  AUDIT_EVENT: 'AUDIT_EVENT'
};

/**
 * Enterprise Search class
 * Search everything: Order, Customer, Table, Receipt, Staff, Shift, Terminal, Payment, Workflow, Incident, Reservation, Invoice
 */
export class EnterpriseSearch {
  constructor() {
    this.index = new Map();
    this.loadIndex();
  }

  /**
   * Load search index from localStorage
   */
  loadIndex() {
    try {
      const stored = localStorage.getItem(SEARCH_INDEX_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.index) {
          data.index.forEach(item => {
            this.index.set(item.id, item);
          });
        }
      }
    } catch (error) {
      console.error('[EnterpriseSearch] Failed to load index:', error);
    }
  }

  /**
   * Save search index to localStorage
   */
  saveIndex() {
    try {
      const index = Array.from(this.index.values());
      localStorage.setItem(SEARCH_INDEX_KEY, JSON.stringify({ index }));
    } catch (error) {
      console.error('[EnterpriseSearch] Failed to save index:', error);
    }
  }

  /**
   * Index an entity
   * @param {Object} entityData - Entity data
   * @returns {Object} Indexed entity
   */
  indexEntity(entityData) {
    const entity = {
      id: `search_${entityData.entityType}_${entityData.entityId}`,
      
      // Entity info
      entityType: entityData.entityType,
      entityId: entityData.entityId,
      title: entityData.title || '',
      description: entityData.description || '',
      
      // Searchable fields
      searchableText: this.buildSearchableText(entityData),
      
      // Metadata
      metadata: entityData.metadata || {},
      
      // References
      branchId: entityData.branchId || null,
      terminalId: entityData.terminalId || null,
      staffId: entityData.staffId || null,
      customerId: entityData.customerId || null,
      
      // Timestamps
      indexedAt: now(),
      entityCreatedAt: entityData.entityCreatedAt || null,
      entityUpdatedAt: entityData.entityUpdatedAt || null
    };

    this.index.set(entity.id, entity);
    this.saveIndex();

    return entity;
  }

  /**
   * Build searchable text from entity data
   * @param {Object} entityData - Entity data
   * @returns {string} Searchable text
   */
  buildSearchableText(entityData) {
    const fields = [
      entityData.title,
      entityData.description,
      entityData.name,
      entityData.email,
      entityData.phone,
      entityData.orderNumber,
      entityData.receiptNumber,
      entityData.invoiceNumber,
      entityData.staffName,
      entityData.terminalName,
      entityData.tableNumber,
      entityData.customerName
    ];

    return fields.filter(f => f).join(' ').toLowerCase();
  }

  /**
   * Remove entity from index
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {boolean} Whether removal was successful
   */
  removeEntity(entityType, entityId) {
    const id = `search_${entityType}_${entityId}`;
    const deleted = this.index.delete(id);
    if (deleted) {
      this.saveIndex();
    }
    return deleted;
  }

  /**
   * Search entities
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Array} Array of search results
   */
  search(query, filters = {}) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    let results = Array.from(this.index.values());

    // Apply text search
    if (query) {
      results = results.filter(entity => {
        const searchableText = entity.searchableText;
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply filters
    if (filters.entityType) {
      results = results.filter(e => e.entityType === filters.entityType);
    }
    if (filters.branchId) {
      results = results.filter(e => e.branchId === filters.branchId);
    }
    if (filters.terminalId) {
      results = results.filter(e => e.terminalId === filters.terminalId);
    }
    if (filters.staffId) {
      results = results.filter(e => e.staffId === filters.staffId);
    }
    if (filters.customerId) {
      results = results.filter(e => e.customerId === filters.customerId);
    }
    if (filters.startTime) {
      results = results.filter(e => e.entityCreatedAt >= filters.startTime);
    }
    if (filters.endTime) {
      results = results.filter(e => e.entityCreatedAt <= filters.endTime);
    }

    // Sort by relevance (simple: number of matching terms)
    if (query) {
      results.sort((a, b) => {
        const aMatches = searchTerms.filter(term => a.searchableText.includes(term)).length;
        const bMatches = searchTerms.filter(term => b.searchableText.includes(term)).length;
        return bMatches - aMatches;
      });
    } else {
      // Sort by indexed time descending if no query
      results.sort((a, b) => b.indexedAt - a.indexedAt);
    }

    // Apply limit
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Search by entity type
   * @param {string} entityType - Entity type
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchByType(entityType, query, filters = {}) {
    return this.search(query, { ...filters, entityType });
  }

  /**
   * Search orders
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchOrders(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.ORDER, query, filters);
  }

  /**
   * Search customers
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchCustomers(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.CUSTOMER, query, filters);
  }

  /**
   * Search tables
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchTables(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.TABLE, query, filters);
  }

  /**
   * Search receipts
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchReceipts(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.RECEIPT, query, filters);
  }

  /**
   * Search staff
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchStaff(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.STAFF, query, filters);
  }

  /**
   * Search shifts
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchShifts(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.SHIFT, query, filters);
  }

  /**
   * Search terminals
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchTerminals(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.TERMINAL, query, filters);
  }

  /**
   * Search payments
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchPayments(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.PAYMENT, query, filters);
  }

  /**
   * Search workflows
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchWorkflows(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.WORKFLOW, query, filters);
  }

  /**
   * Search incidents
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchIncidents(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.INCIDENT, query, filters);
  }

  /**
   * Search reservations
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchReservations(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.RESERVATION, query, filters);
  }

  /**
   * Search invoices
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of search results
   */
  searchInvoices(query, filters = {}) {
    return this.searchByType(SEARCH_ENTITY_TYPES.INVOICE, query, filters);
  }

  /**
   * Get indexed entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Indexed entity or null
   */
  getIndexedEntity(entityType, entityId) {
    const id = `search_${entityType}_${entityId}`;
    return this.index.get(id) || null;
  }

  /**
   * Get all indexed entities
   * @returns {Array} Array of indexed entities
   */
  getAllIndexedEntities() {
    return Array.from(this.index.values());
  }

  /**
   * Get indexed entities by type
   * @param {string} entityType - Entity type
   * @returns {Array} Array of indexed entities
   */
  getIndexedEntitiesByType(entityType) {
    return this.getAllIndexedEntities().filter(e => e.entityType === entityType);
  }

  /**
   * Update indexed entity
   * @param {Object} entityData - Updated entity data
   * @returns {Object|null} Updated indexed entity or null
   */
  updateIndexedEntity(entityData) {
    const existing = this.getIndexedEntity(entityData.entityType, entityData.entityId);
    if (!existing) {
      return this.indexEntity(entityData);
    }

    const updated = {
      ...existing,
      ...entityData,
      searchableText: this.buildSearchableText(entityData),
      indexedAt: now()
    };

    this.index.set(updated.id, updated);
    this.saveIndex();

    return updated;
  }

  /**
   * Rebuild index for entity type
   * @param {string} entityType - Entity type
   * @param {Array} entities - Array of entities
   * @returns {Object} Rebuild result
   */
  rebuildIndexForType(entityType, entities) {
    // Remove existing entities of this type
    for (const [id, entity] of this.index) {
      if (entity.entityType === entityType) {
        this.index.delete(id);
      }
    }

    // Index new entities
    entities.forEach(entity => {
      this.indexEntity({
        entityType,
        ...entity
      });
    });

    this.saveIndex();

    return {
      success: true,
      entityType,
      indexedCount: entities.length
    };
  }

  /**
   * Clear index for entity type
   * @param {string} entityType - Entity type
   * @returns {number} Number of entities cleared
   */
  clearIndexForType(entityType) {
    let cleared = 0;

    for (const [id, entity] of this.index) {
      if (entity.entityType === entityType) {
        this.index.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveIndex();
    }

    return cleared;
  }

  /**
   * Get search statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const entities = this.getAllIndexedEntities();

    return {
      totalIndexed: entities.length,
      byType: entities.reduce((acc, e) => {
        acc[e.entityType] = (acc[e.entityType] || 0) + 1;
        return acc;
      }, {}),
      byBranch: entities.reduce((acc, e) => {
        if (e.branchId) {
          acc[e.branchId] = (acc[e.branchId] || 0) + 1;
        }
        return acc;
      }, {}),
      byTerminal: entities.reduce((acc, e) => {
        if (e.terminalId) {
          acc[e.terminalId] = (acc[e.terminalId] || 0) + 1;
        }
        return acc;
      }, {})
    };
  }

  /**
   * Export index
   * @param {Object} options - Export options
   * @returns {Object} Exported index
   */
  exportIndex(options = {}) {
    const { entityType, branchId } = options;
    
    let index = this.getAllIndexedEntities();
    
    if (entityType) {
      index = index.filter(e => e.entityType === entityType);
    }
    if (branchId) {
      index = index.filter(e => e.branchId === branchId);
    }

    return {
      index,
      exportedAt: now(),
      totalEntities: index.length
    };
  }

  /**
   * Import index
   * @param {Object} data - Imported index data
   * @returns {Object} Import result
   */
  importIndex(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.index)) {
        data.index.forEach(entity => {
          this.index.set(entity.id, entity);
        });
      }

      this.saveIndex();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let enterpriseSearchInstance = null;

/**
 * Get the enterprise search singleton
 * @returns {EnterpriseSearch} Enterprise search instance
 */
export function getEnterpriseSearch() {
  if (!enterpriseSearchInstance) {
    enterpriseSearchInstance = new EnterpriseSearch();
  }
  return enterpriseSearchInstance;
}

/**
 * Reset the enterprise search (useful for testing)
 */
export function resetEnterpriseSearch() {
  enterpriseSearchInstance = null;
}

/**
 * Convenience function to search
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @returns {Array} Array of search results
 */
export function searchEnterprise(query, filters = {}) {
  const search = getEnterpriseSearch();
  return search.search(query, filters);
}

/**
 * Convenience function to index an entity
 * @param {Object} entityData - Entity data
 * @returns {Object} Indexed entity
 */
export function indexEntity(entityData = {}) {
  const search = getEnterpriseSearch();
  return search.indexEntity(entityData);
}
