// Search Engine for Cloud Storage Platform
// Handles search for backups, exports, and other cloud resources

import backupEngine from './BackupEngine.js';
import exportEngine from './ExportEngine.js';
import importEngine from './ImportEngine.js';

/**
 * Search Engine
 * Central search functionality for cloud resources
 * Supports full-text search, filtering, and sorting
 */
class SearchEngine {
  constructor() {
    this.initialized = false;
    this.searchIndex = new Map();
    this.indexingEnabled = true;
  }

  /**
   * Initialize the search engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize engines
    await backupEngine.initialize();
    await exportEngine.initialize();
    await importEngine.initialize();
    
    // Build search index
    if (this.indexingEnabled) {
      await this.buildSearchIndex();
    }
    
    this.initialized = true;
  }

  /**
   * Build search index
   */
  async buildSearchIndex() {
    this.searchIndex.clear();
    
    // Index backups
    const backups = backupEngine.getBackupHistory();
    backups.forEach(backup => {
      this.indexItem('backup', backup.backupId, backup);
    });
    
    // Index exports
    const exports = exportEngine.getExportHistory();
    exports.forEach(exp => {
      this.indexItem('export', exp.exportId, exp);
    });
    
    // Index imports
    const imports = importEngine.getImportHistory();
    imports.forEach(imp => {
      this.indexItem('import', imp.importId, imp);
    });
  }

  /**
   * Index an item
   * @param {string} type 
   * @param {string} id 
   * @param {object} data 
   */
  indexItem(type, id, data) {
    const searchableText = this.extractSearchableText(data);
    const tokens = this.tokenize(searchableText);
    
    this.searchIndex.set(`${type}:${id}`, {
      type,
      id,
      data,
      tokens,
      indexedAt: Date.now()
    });
  }

  /**
   * Extract searchable text from data
   * @param {object} data 
   * @returns {string}
   */
  extractSearchableText(data) {
    const fields = [
      data.description,
      data.createdBy,
      data.modules?.join(' '),
      data.format,
      data.destination,
      data.source,
      data.status
    ];
    
    return fields.filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Tokenize text
   * @param {string} text 
   * @returns {Set}
   */
  tokenize(text) {
    const tokens = new Set();
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 2) {
        tokens.add(word);
        // Add partial matches
        for (let i = 3; i <= word.length; i++) {
          tokens.add(word.substring(0, i));
        }
      }
    }
    
    return tokens;
  }

  /**
   * Search backups
   * @param {string} query 
   * @param {object} options 
   * @returns {Promise<Array>}
   */
  async searchBackups(query, options = {}) {
    const backups = backupEngine.getBackupHistory();
    
    let results = backups;
    
    if (query) {
      results = this.filterByQuery(results, query);
    }
    
    if (options.status) {
      results = results.filter(b => b.status === options.status);
    }
    
    if (options.createdBy) {
      results = results.filter(b => b.createdBy === options.createdBy);
    }
    
    if (options.dateFrom) {
      results = results.filter(b => new Date(b.createdAt) >= new Date(options.dateFrom));
    }
    
    if (options.dateTo) {
      results = results.filter(b => new Date(b.createdAt) <= new Date(options.dateTo));
    }
    
    if (options.modules) {
      results = results.filter(b => 
        options.modules.some(m => b.modules?.includes(m))
      );
    }
    
    // Sort
    if (options.sortBy === 'date') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (options.sortBy === 'size') {
      results.sort((a, b) => (b.size || 0) - (a.size || 0));
    }
    
    // Limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  /**
   * Search exports
   * @param {string} query 
   * @param {object} options 
   * @returns {Promise<Array>}
   */
  async searchExports(query, options = {}) {
    const exports = exportEngine.getExportHistory();
    
    let results = exports;
    
    if (query) {
      results = this.filterByQuery(results, query);
    }
    
    if (options.status) {
      results = results.filter(e => e.status === options.status);
    }
    
    if (options.format) {
      results = results.filter(e => e.format === options.format);
    }
    
    if (options.destination) {
      results = results.filter(e => e.destination === options.destination);
    }
    
    if (options.modules) {
      results = results.filter(e => 
        options.modules.some(m => e.modules?.includes(m))
      );
    }
    
    if (options.dateFrom) {
      results = results.filter(e => new Date(e.createdAt) >= new Date(options.dateFrom));
    }
    
    if (options.dateTo) {
      results = results.filter(e => new Date(e.createdAt) <= new Date(options.dateTo));
    }
    
    // Sort
    if (options.sortBy === 'date') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (options.sortBy === 'size') {
      results.sort((a, b) => (b.size || 0) - (a.size || 0));
    }
    
    // Limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  /**
   * Search imports
   * @param {string} query 
   * @param {object} options 
   * @returns {Promise<Array>}
   */
  async searchImports(query, options = {}) {
    const imports = importEngine.getImportHistory();
    
    let results = imports;
    
    if (query) {
      results = this.filterByQuery(results, query);
    }
    
    if (options.status) {
      results = results.filter(i => i.status === options.status);
    }
    
    if (options.source) {
      results = results.filter(i => i.source === options.source);
    }
    
    if (options.dateFrom) {
      results = results.filter(i => new Date(i.createdAt) >= new Date(options.dateFrom));
    }
    
    if (options.dateTo) {
      results = results.filter(i => new Date(i.createdAt) <= new Date(options.dateTo));
    }
    
    // Sort
    if (options.sortBy === 'date') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  /**
   * Search all resources
   * @param {string} query 
   * @param {object} options 
   * @returns {Promise<object>}
   */
  async searchAll(query, options = {}) {
    const [backups, exports, imports] = await Promise.all([
      this.searchBackups(query, options),
      this.searchExports(query, options),
      this.searchImports(query, options)
    ]);
    
    return {
      backups,
      exports,
      imports,
      total: backups.length + exports.length + imports.length
    };
  }

  /**
   * Filter by query
   * @param {Array} items 
   * @param {string} query 
   * @returns {Array}
   */
  filterByQuery(items, query) {
    const queryTokens = this.tokenize(query.toLowerCase());
    
    return items.filter(item => {
      const itemText = this.extractSearchableText(item);
      const itemTokens = this.tokenize(itemText);
      
      // Check if all query tokens are in item tokens
      for (const token of queryTokens) {
        if (!itemTokens.has(token)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get search suggestions
   * @param {string} query 
   * @param {string} type 
   * @returns {Array}
   */
  getSuggestions(query, type = 'all') {
    const suggestions = new Set();
    const queryLower = query.toLowerCase();
    
    const items = [];
    
    if (type === 'all' || type === 'backup') {
      items.push(...backupEngine.getBackupHistory());
    }
    
    if (type === 'all' || type === 'export') {
      items.push(...exportEngine.getExportHistory());
    }
    
    if (type === 'all' || type === 'import') {
      items.push(...importEngine.getImportHistory());
    }
    
    for (const item of items) {
      const text = this.extractSearchableText(item);
      const words = text.split(/\s+/);
      
      for (const word of words) {
        if (word.startsWith(queryLower) && word.length > 2) {
          suggestions.add(word);
        }
      }
    }
    
    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get recent searches
   * @returns {Array}
   */
  getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem('cafeos_recent_searches') || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Save search
   * @param {string} query 
   * @param {object} filters 
   */
  saveSearch(query, filters = {}) {
    try {
      const recent = this.getRecentSearches();
      
      // Remove if already exists
      const existingIndex = recent.findIndex(s => s.query === query);
      if (existingIndex >= 0) {
        recent.splice(existingIndex, 1);
      }
      
      // Add to front
      recent.unshift({
        query,
        filters,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 20
      if (recent.length > 20) {
        recent.splice(20);
      }
      
      localStorage.setItem('cafeos_recent_searches', JSON.stringify(recent));
    } catch (error) {
      console.error('[SearchEngine] Failed to save search:', error);
    }
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches() {
    localStorage.setItem('cafeos_recent_searches', '[]');
  }

  /**
   * Get search statistics
   * @returns {object}
   */
  getStatistics() {
    const backups = backupEngine.getBackupHistory();
    const exports = exportEngine.getExportHistory();
    const imports = importEngine.getImportHistory();
    
    return {
      totalBackups: backups.length,
      totalExports: exports.length,
      totalImports: imports.length,
      totalItems: backups.length + exports.length + imports.length,
      indexedItems: this.searchIndex.size,
      recentSearches: this.getRecentSearches().length
    };
  }

  /**
   * Rebuild search index
   */
  async rebuildIndex() {
    await this.buildSearchIndex();
  }

  /**
   * Enable/disable indexing
   * @param {boolean} enabled 
   */
  setIndexingEnabled(enabled) {
    this.indexingEnabled = enabled;
    if (enabled) {
      this.buildSearchIndex();
    } else {
      this.searchIndex.clear();
    }
  }
}

// Singleton instance
const searchEngine = new SearchEngine();

export default searchEngine;
