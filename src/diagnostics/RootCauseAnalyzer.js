// Root Cause Analyzer
// Analyzes incidents to determine likely root causes

import { RootCauseAnalysis, RootCauseCategory } from './DiagnosticsTypes.js';
import incidentManager from './IncidentManager.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Root Cause Analyzer - Determines likely causes of incidents
 */
class RootCauseAnalyzer {
  constructor() {
    this.isInitialized = false;
    this.analysisRules = this.initializeRules();
  }

  /**
   * Initialize the Root Cause Analyzer
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[RootCauseAnalyzer] Already initialized');
      return;
    }

    console.log('[RootCauseAnalyzer] Initializing...');
    this.isInitialized = true;
    console.log('[RootCauseAnalyzer] Initialized successfully');
  }

  /**
   * Initialize analysis rules
   */
  initializeRules() {
    return [
      // Storage-related rules
      {
        component: 'storage-engine',
        patterns: ['offline', 'unreachable', 'connection failed', 'timeout'],
        category: RootCauseCategory.NETWORK,
        likelyCause: 'Network connectivity issue to cloud storage',
        confidence: 70
      },
      {
        component: 'storage-engine',
        patterns: ['authentication failed', 'unauthorized', 'access denied', 'permission denied'],
        category: RootCauseCategory.AUTHENTICATION,
        likelyCause: 'Cloud authentication or permission issue',
        confidence: 85
      },
      {
        component: 'storage-engine',
        patterns: ['credential expired', 'token expired', 'invalid credentials'],
        category: RootCauseCategory.CREDENTIALS,
        likelyCause: 'Expired or invalid cloud credentials',
        confidence: 90
      },
      {
        component: 'storage-engine',
        patterns: ['quota exceeded', 'out of space', 'capacity limit'],
        category: RootCauseCategory.CAPACITY,
        likelyCause: 'Storage quota or capacity limit reached',
        confidence: 95
      },

      // Database-related rules
      {
        component: 'database',
        patterns: ['connection failed', 'unreachable', 'timeout'],
        category: RootCauseCategory.NETWORK,
        likelyCause: 'Database network connectivity issue',
        confidence: 75
      },
      {
        component: 'database',
        patterns: ['slow query', 'high latency', 'timeout'],
        category: RootCauseCategory.PERFORMANCE,
        likelyCause: 'Database performance degradation or slow queries',
        confidence: 70
      },
      {
        component: 'database',
        patterns: ['lock timeout', 'deadlock', 'concurrency'],
        category: RootCauseCategory.PERFORMANCE,
        likelyCause: 'Database locking or concurrency issue',
        confidence: 80
      },

      // Authentication-related rules
      {
        component: 'authentication',
        patterns: ['token expired', 'session expired', 'invalid token'],
        category: RootCauseCategory.CREDENTIALS,
        likelyCause: 'Authentication token or session expired',
        confidence: 90
      },
      {
        component: 'authentication',
        patterns: ['too many attempts', 'rate limit', 'throttled'],
        category: RootCauseCategory.CONFIGURATION,
        likelyCause: 'Rate limiting or too many authentication attempts',
        confidence: 85
      },

      // Backup-related rules
      {
        component: 'backup-engine',
        patterns: ['no destination', 'storage unavailable', 'bucket not found'],
        category: RootCauseCategory.CONFIGURATION,
        likelyCause: 'Backup destination not configured or unavailable',
        confidence: 85
      },
      {
        component: 'backup-engine',
        patterns: ['permission denied', 'access denied', 'write failed'],
        category: RootCauseCategory.AUTHENTICATION,
        likelyCause: 'Insufficient permissions for backup destination',
        confidence: 80
      },
      {
        component: 'backup-engine',
        patterns: ['timeout', 'slow', 'large file'],
        category: RootCauseCategory.PERFORMANCE,
        likelyCause: 'Backup operation taking too long due to size or network',
        confidence: 70
      },

      // Sync-related rules
      {
        component: 'sync-engine',
        patterns: ['queue growing', 'backlog', 'pending'],
        category: RootCauseCategory.PERFORMANCE,
        likelyCause: 'Sync queue growing faster than processing',
        confidence: 75
      },
      {
        component: 'sync-engine',
        patterns: ['conflict', 'version mismatch', 'concurrent modification'],
        category: RootCauseCategory.DEPENDENCY,
        likelyCause: 'Data conflict or version mismatch during sync',
        confidence: 80
      },

      // Payment-related rules
      {
        component: 'payments',
        patterns: ['gateway timeout', 'gateway unavailable', 'gateway error'],
        category: RootCauseCategory.EXTERNAL,
        likelyCause: 'Payment gateway service unavailable or experiencing issues',
        confidence: 85
      },
      {
        component: 'payments',
        patterns: ['invalid card', 'card declined', 'payment failed'],
        category: RootCauseCategory.EXTERNAL,
        likelyCause: 'Payment card declined or invalid',
        confidence: 90
      },

      // Notification-related rules
      {
        component: 'notifications',
        patterns: ['queue full', 'backlog', 'delivery failed'],
        category: RootCauseCategory.PERFORMANCE,
        likelyCause: 'Notification queue overwhelmed or delivery issues',
        confidence: 75
      },

      // Printer-related rules
      {
        component: 'printers',
        patterns: ['offline', 'disconnected', 'not found'],
        category: RootCauseCategory.NETWORK,
        likelyCause: 'Printer network connectivity issue',
        confidence: 80
      },
      {
        component: 'printers',
        patterns: ['paper jam', 'out of paper', 'printer error'],
        category: RootCauseCategory.EXTERNAL,
        likelyCause: 'Printer hardware issue (paper jam, out of paper, etc.)',
        confidence: 95
      }
    ];
  }

  /**
   * Analyze an incident to determine root cause
   */
  async analyze(component, issue, context = {}) {
    console.log(`[RootCauseAnalyzer] Analyzing ${component}: ${issue}`);

    // Find matching rules
    const matchingRules = this.analysisRules.filter(rule => {
      if (rule.component !== component) return false;
      
      return rule.patterns.some(pattern => 
        issue.toLowerCase().includes(pattern.toLowerCase())
      );
    });

    if (matchingRules.length === 0) {
      // No specific rule found, use generic analysis
      return this.performGenericAnalysis(component, issue, context);
    }

    // Use the highest confidence matching rule
    const bestRule = matchingRules.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Gather evidence
    const evidence = await this.gatherEvidence(component, issue, context);

    // Find related incidents
    const relatedIncidents = await this.findRelatedIncidents(component, issue);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(bestRule, evidence);

    return new RootCauseAnalysis({
      component,
      issue,
      category: bestRule.category,
      likelyCause: bestRule.likelyCause,
      confidence: bestRule.confidence,
      evidence,
      relatedIncidents,
      recommendedActions
    });
  }

  /**
   * Perform generic analysis when no specific rule matches
   */
  async performGenericAnalysis(component, issue, context) {
    const evidence = await this.gatherEvidence(component, issue, context);
    const relatedIncidents = await this.findRelatedIncidents(component, issue);

    // Try to infer category from issue keywords
    let category = RootCauseCategory.UNKNOWN;
    if (issue.toLowerCase().includes('network') || issue.toLowerCase().includes('connection')) {
      category = RootCauseCategory.NETWORK;
    } else if (issue.toLowerCase().includes('auth') || issue.toLowerCase().includes('credential')) {
      category = RootCauseCategory.AUTHENTICATION;
    } else if (issue.toLowerCase().includes('slow') || issue.toLowerCase().includes('timeout')) {
      category = RootCauseCategory.PERFORMANCE;
    }

    return new RootCauseAnalysis({
      component,
      issue,
      category,
      likelyCause: 'Issue requires further investigation',
      confidence: 50,
      evidence,
      relatedIncidents,
      recommendedActions: ['Investigate component logs', 'Check component configuration', 'Review recent changes']
    });
  }

  /**
   * Gather evidence for the analysis
   */
  async gatherEvidence(component, issue, context) {
    const evidence = [];

    // Get health check result
    try {
      const healthResult = await healthEngine.checkComponent(component);
      evidence.push({
        type: 'health_status',
        value: healthResult.status,
        reason: healthResult.reason,
        timestamp: healthResult.timestamp
      });
    } catch (error) {
      evidence.push({
        type: 'health_check_error',
        value: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Add context evidence
    if (context.metadata) {
      Object.entries(context.metadata).forEach(([key, value]) => {
        evidence.push({
          type: 'context',
          key,
          value,
          timestamp: new Date().toISOString()
        });
      });
    }

    return evidence;
  }

  /**
   * Find related incidents
   */
  async findRelatedIncidents(component, issue) {
    const allIncidents = await incidentManager.getAllIncidents({ component });
    
    // Filter for incidents with similar issues in the last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return allIncidents
      .filter(incident => {
        const incidentTime = new Date(incident.started).getTime();
        return incidentTime > sevenDaysAgo;
      })
      .filter(incident => {
        // Check for similar issue keywords
        const issueWords = issue.toLowerCase().split(' ');
        const incidentWords = incident.metadata?.issue?.toLowerCase().split(' ') || [];
        
        return issueWords.some(word => 
          word.length > 3 && incidentWords.some(iw => iw.includes(word))
        );
      })
      .map(incident => ({
        id: incident.id,
        started: incident.started,
        resolved: incident.resolved,
        issue: incident.metadata?.issue || 'Unknown'
      }));
  }

  /**
   * Generate recommended actions based on root cause
   */
  generateRecommendedActions(rule, evidence) {
    const actions = [];

    switch (rule.category) {
      case RootCauseCategory.NETWORK:
        actions.push('Check network connectivity');
        actions.push('Verify firewall settings');
        actions.push('Test DNS resolution');
        actions.push('Check for network outages');
        break;

      case RootCauseCategory.AUTHENTICATION:
        actions.push('Verify authentication credentials');
        actions.push('Check permission settings');
        actions.push('Review access control policies');
        actions.push('Test authentication flow');
        break;

      case RootCauseCategory.CREDENTIALS:
        actions.push('Rotate expired credentials');
        actions.push('Update authentication tokens');
        actions.push('Review credential expiration policy');
        actions.push('Set up credential rotation automation');
        break;

      case RootCauseCategory.CAPACITY:
        actions.push('Review storage usage');
        actions.push('Clean up unnecessary data');
        actions.push('Increase storage quota');
        actions.push('Implement data retention policy');
        break;

      case RootCauseCategory.PERFORMANCE:
        actions.push('Review performance metrics');
        actions.push('Check for resource bottlenecks');
        actions.push('Optimize queries or operations');
        actions.push('Consider scaling resources');
        break;

      case RootCauseCategory.CONFIGURATION:
        actions.push('Review component configuration');
        actions.push('Verify settings are correct');
        actions.push('Check for recent configuration changes');
        actions.push('Validate configuration against requirements');
        break;

      case RootCauseCategory.DEPENDENCY:
        actions.push('Check dependency health');
        actions.push('Verify dependency versions');
        actions.push('Review dependency configuration');
        actions.push('Test dependency connectivity');
        break;

      case RootCauseCategory.EXTERNAL:
        actions.push('Check external service status');
        actions.push('Review external service documentation');
        actions.push('Contact external service support if needed');
        actions.push('Implement fallback mechanisms');
        break;

      default:
        actions.push('Investigate component logs');
        actions.push('Review recent changes');
        actions.push('Check system resources');
        actions.push('Consult support documentation');
    }

    return actions;
  }

  /**
   * Batch analyze multiple incidents
   */
  async analyzeBatch(incidents) {
    const analyses = [];
    
    for (const incident of incidents) {
      const analysis = await this.analyze(
        incident.component,
        incident.metadata?.issue || incident.rootCause || 'Unknown issue',
        incident.metadata || {}
      );
      analyses.push({
        incidentId: incident.id,
        analysis
      });
    }

    return analyses;
  }
}

// Singleton instance
const rootCauseAnalyzer = new RootCauseAnalyzer();

export default rootCauseAnalyzer;
export { RootCauseAnalyzer };
