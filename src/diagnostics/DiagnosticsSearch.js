// Diagnostics Search
// Search functionality for incidents, warnings, failures, recommendations, performance, and health data

import incidentManager from './IncidentManager.js';
import recommendationEngine from './RecommendationEngine.js';
import predictionEngine from './PredictionEngine.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import historyTracker from './HistoryTracker.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Diagnostics Search - Search across all diagnostics data
 */
class DiagnosticsSearch {
  constructor() {
    this.isInitialized = false;
    this.searchIndex = new Map(); // For indexed search
  }

  /**
   * Initialize the Search system
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[DiagnosticsSearch] Already initialized');
      return;
    }

    console.log('[DiagnosticsSearch] Initializing...');
    await this.buildSearchIndex();
    this.isInitialized = true;
    console.log('[DiagnosticsSearch] Initialized successfully');
  }

  /**
   * Build search index
   */
  async buildSearchIndex() {
    // Index incidents
    const incidents = await incidentManager.getAllIncidents();
    incidents.forEach(incident => {
      this.indexItem('incident', incident.id, {
        type: 'incident',
        id: incident.id,
        component: incident.component,
        severity: incident.severity,
        status: incident.status,
        started: incident.started,
        rootCause: incident.rootCause?.likelyCause,
        searchableText: this.extractSearchableText(incident)
      });
    });

    // Index recommendations
    const recommendations = recommendationEngine.getRecommendations();
    recommendations.forEach(rec => {
      this.indexItem('recommendation', rec.id, {
        type: 'recommendation',
        id: rec.id,
        component: rec.component,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        searchableText: this.extractSearchableText(rec)
      });
    });

    // Index predictions
    const predictions = predictionEngine.getActivePredictions();
    predictions.forEach(pred => {
      this.indexItem('prediction', pred.id, {
        type: 'prediction',
        id: pred.id,
        component: pred.component,
        severity: pred.severity,
        predictedIssue: pred.predictedIssue,
        searchableText: this.extractSearchableText(pred)
      });
    });

    console.log(`[DiagnosticsSearch] Indexed ${this.searchIndex.size} items`);
  }

  /**
   * Index an item for search
   */
  indexItem(type, id, data) {
    const key = `${type}:${id}`;
    this.searchIndex.set(key, data);
  }

  /**
   * Extract searchable text from an object
   */
  extractSearchableText(obj) {
    const text = [];
    
    const extract = (value) => {
      if (typeof value === 'string') {
        text.push(value.toLowerCase());
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(extract);
      }
    };

    extract(obj);
    return text.join(' ');
  }

  /**
   * Search across all diagnostics data
   */
  async search(query, filters = {}) {
    const searchResults = {
      incidents: [],
      recommendations: [],
      predictions: [],
      performance: [],
      health: [],
      total: 0
    };

    const lowerQuery = query.toLowerCase();

    // Search incidents
    if (!filters.type || filters.type === 'incident') {
      const incidents = await incidentManager.getAllIncidents(filters);
      searchResults.incidents = this.filterByQuery(incidents, lowerQuery, [
        'component', 'rootCause', 'resolutionNotes', 'metadata.issue'
      ]);
    }

    // Search recommendations
    if (!filters.type || filters.type === 'recommendation') {
      const recommendations = recommendationEngine.getRecommendations(filters);
      searchResults.recommendations = this.filterByQuery(recommendations, lowerQuery, [
        'component', 'title', 'description'
      ]);
    }

    // Search predictions
    if (!filters.type || filters.type === 'prediction') {
      const predictions = predictionEngine.getActivePredictions();
      searchResults.predictions = this.filterByQuery(predictions, lowerQuery, [
        'component', 'predictedIssue'
      ]);
    }

    // Search performance data
    if (!filters.type || filters.type === 'performance') {
      const performanceData = performanceAnalyzer.getAllMetrics();
      searchResults.performance = this.searchPerformance(performanceData, lowerQuery);
    }

    // Search health data
    if (!filters.type || filters.type === 'health') {
      const healthData = await healthEngine.getAllReports();
      searchResults.health = this.filterByQuery(healthData, lowerQuery, [
        'componentId', 'componentName', 'result.reason'
      ]);
    }

    searchResults.total = 
      searchResults.incidents.length +
      searchResults.recommendations.length +
      searchResults.predictions.length +
      searchResults.performance.length +
      searchResults.health.length;

    return searchResults;
  }

  /**
   * Filter array by query
   */
  filterByQuery(items, query, fields) {
    return items.filter(item => {
      return fields.some(field => {
        const value = this.getNestedValue(item, field);
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Search performance data
   */
  searchPerformance(performanceData, query) {
    const results = [];
    
    Object.entries(performanceData).forEach(([metric, data]) => {
      if (metric.toLowerCase().includes(query)) {
        results.push({
          metric,
          ...data
        });
      }
    });

    return results;
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(searchParams) {
    const {
      query,
      type,
      severity,
      component,
      status,
      priority,
      startDate,
      endDate,
      limit = 50
    } = searchParams;

    const filters = {};
    if (severity) filters.severity = severity;
    if (component) filters.component = component;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;

    let results = await this.search(query || '', filters);

    // Apply limit
    if (results.incidents.length > limit) results.incidents = results.incidents.slice(0, limit);
    if (results.recommendations.length > limit) results.recommendations = results.recommendations.slice(0, limit);
    if (results.predictions.length > limit) results.predictions = results.predictions.slice(0, limit);

    return results;
  }

  /**
   * Search history
   */
  async searchHistory(query, type = null, filters = {}) {
    const historyTypes = type ? [type] : historyTracker.getAllHistoryTypes();
    const results = [];

    for (const historyType of historyTypes) {
      const historyData = historyTracker.getHistory(historyType, filters);
      const filtered = this.filterByQuery(historyData, query.toLowerCase(), [
        'component', 'error', 'message', 'title', 'metric'
      ]);
      
      results.push(...filtered.map(item => ({
        ...item,
        historyType
      })));
    }

    return results;
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query, limit = 10) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Component suggestions
    const components = new Set();
    const incidents = await incidentManager.getAllIncidents();
    incidents.forEach(inc => components.add(inc.component));
    
    components.forEach(comp => {
      if (comp.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'component',
          value: comp,
          label: comp
        });
      }
    });

    // Severity suggestions
    const severities = ['information', 'low', 'medium', 'high', 'critical', 'emergency'];
    severities.forEach(sev => {
      if (sev.includes(lowerQuery)) {
        suggestions.push({
          type: 'severity',
          value: sev,
          label: sev
        });
      }
    });

    // Type suggestions
    const types = ['incident', 'recommendation', 'prediction', 'performance', 'health'];
    types.forEach(t => {
      if (t.includes(lowerQuery)) {
        suggestions.push({
          type: 'type',
          value: t,
          label: t
        });
      }
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Rebuild search index
   */
  async rebuildIndex() {
    this.searchIndex.clear();
    await this.buildSearchIndex();
  }

  /**
   * Get search statistics
   */
  getSearchStatistics() {
    const byType = {
      incident: 0,
      recommendation: 0,
      prediction: 0,
      performance: 0,
      health: 0
    };

    for (const [key, data] of this.searchIndex.entries()) {
      const type = key.split(':')[0];
      if (byType[type] !== undefined) {
        byType[type]++;
      }
    }

    return {
      total: this.searchIndex.size,
      byType
    };
  }
}

// Singleton instance
const diagnosticsSearch = new DiagnosticsSearch();

export default diagnosticsSearch;
export { DiagnosticsSearch };
