// Diagnostics Report Generator
// Generates comprehensive diagnostics reports

import { DiagnosticsReport } from './DiagnosticsTypes.js';
import diagnosticsEngine from './DiagnosticsEngine.js';
import incidentManager from './IncidentManager.js';
import systemScoreCalculator from './SystemScoreCalculator.js';
import performanceAnalyzer from './PerformanceAnalyzer.js';
import recommendationEngine from './RecommendationEngine.js';
import predictionEngine from './PredictionEngine.js';
import healthEngine from '../health/HealthEngine.js';

/**
 * Diagnostics Report Generator - Generates comprehensive reports
 */
class DiagnosticsReportGenerator {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the Report Generator
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[DiagnosticsReportGenerator] Already initialized');
      return;
    }

    console.log('[DiagnosticsReportGenerator] Initializing...');
    this.isInitialized = true;
    console.log('[DiagnosticsReportGenerator] Initialized successfully');
  }

  /**
   * Generate a comprehensive diagnostics report
   */
  async generate() {
    console.log('[DiagnosticsReportGenerator] Generating diagnostics report...');

    const generatedAt = new Date().toISOString();

    // System Summary
    const systemSummary = await this.generateSystemSummary();

    // Incident Summary
    const incidentSummary = await this.generateIncidentSummary();

    // Performance Summary
    const performanceSummary = await this.generatePerformanceSummary();

    // Health Summary
    const healthSummary = await this.generateHealthSummary();

    // Recommendations
    const recommendations = await recommendationEngine.getRecommendations({ acknowledged: false });

    // Warnings (from predictions)
    const predictions = await predictionEngine.getActivePredictions();
    const warnings = predictions.map(p => ({
      type: p.type,
      component: p.component,
      severity: p.severity,
      message: p.predictedIssue,
      confidence: p.confidence,
      timeToIssue: p.timeToIssue
    }));

    // Resolved Issues
    const resolvedIssues = await this.generateResolvedIssues();

    // Outstanding Issues
    const outstandingIssues = await this.generateOutstandingIssues();

    const report = new DiagnosticsReport({
      generatedAt,
      systemSummary,
      incidentSummary,
      performanceSummary,
      healthSummary,
      recommendations,
      warnings,
      resolvedIssues,
      outstandingIssues
    });

    console.log('[DiagnosticsReportGenerator] Report generated successfully');
    return report;
  }

  /**
   * Generate system summary
   */
  async generateSystemSummary() {
    const systemScore = await systemScoreCalculator.calculate();
    const dashboardData = await diagnosticsEngine.getDashboardData();

    return {
      overallScore: systemScore.overall,
      categoryScores: systemScore.categories,
      activeIncidents: dashboardData.incidents.active.length,
      totalIncidents: dashboardData.incidents.total,
      criticalIncidents: dashboardData.incidents.critical,
      activePredictions: dashboardData.predictions.length,
      pendingRecommendations: dashboardData.recommendations.length
    };
  }

  /**
   * Generate incident summary
   */
  async generateIncidentSummary() {
    const stats = incidentManager.getIncidentStatistics();
    const activeIncidents = await incidentManager.getActiveIncidents();

    return {
      total: stats.total,
      active: stats.active,
      resolved: stats.resolved,
      bySeverity: stats.bySeverity,
      byStatus: stats.byStatus,
      byComponent: stats.byComponent,
      averageResolutionTime: stats.averageResolutionTime,
      recentIncidents: activeIncidents.slice(0, 10).map(incident => ({
        id: incident.id,
        severity: incident.severity,
        component: incident.component,
        status: incident.status,
        started: incident.started,
        rootCause: incident.rootCause?.likelyCause
      }))
    };
  }

  /**
   * Generate performance summary
   */
  async generatePerformanceSummary() {
    const summary = performanceAnalyzer.getPerformanceSummary();
    const allMetrics = performanceAnalyzer.getAllMetrics();

    return {
      totalMetrics: summary.totalMetrics,
      totalDataPoints: summary.totalDataPoints,
      alerts: summary.alerts,
      metrics: allMetrics
    };
  }

  /**
   * Generate health summary
   */
  async generateHealthSummary() {
    const systemSummary = await healthEngine.getSystemSummary();

    return {
      overallStatus: systemSummary.overallStatus,
      totalComponents: systemSummary.totalComponents,
      healthyComponents: systemSummary.healthyComponents,
      warningComponents: systemSummary.warningComponents,
      criticalComponents: systemSummary.criticalComponents,
      averageHealthScore: systemSummary.averageHealthScore,
      components: systemSummary.components
    };
  }

  /**
   * Generate resolved issues
   */
  async generateResolvedIssues() {
    const allIncidents = await incidentManager.getAllIncidents({
      status: ['resolved', 'closed']
    });

    const resolvedRecs = await recommendationEngine.getRecommendations({ implemented: true });

    return {
      incidents: allIncidents.slice(0, 20).map(incident => ({
        id: incident.id,
        component: incident.component,
        severity: incident.severity,
        resolved: incident.resolved,
        resolutionNotes: incident.resolutionNotes,
        duration: incident.getDuration()
      })),
      recommendations: resolvedRecs.slice(0, 10).map(rec => ({
        id: rec.id,
        title: rec.title,
        component: rec.component,
        implementedAt: rec.implemented ? rec.createdAt : null
      }))
    };
  }

  /**
   * Generate outstanding issues
   */
  async generateOutstandingIssues() {
    const activeIncidents = await incidentManager.getActiveIncidents();
    const pendingRecs = await recommendationEngine.getRecommendations({ acknowledged: false });
    const predictions = await predictionEngine.getActivePredictions();

    return {
      incidents: activeIncidents.map(incident => ({
        id: incident.id,
        component: incident.component,
        severity: incident.severity,
        status: incident.status,
        started: incident.started,
        rootCause: incident.rootCause?.likelyCause
      })),
      recommendations: pendingRecs.map(rec => ({
        id: rec.id,
        title: rec.title,
        component: rec.component,
        priority: rec.priority,
        createdAt: rec.createdAt
      })),
      predictions: predictions.map(pred => ({
        id: pred.id,
        type: pred.type,
        component: pred.component,
        severity: pred.severity,
        predictedIssue: pred.predictedIssue,
        confidence: pred.confidence
      }))
    };
  }

  /**
   * Export report as JSON
   */
  async exportAsJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as text
   */
  async exportAsText(report) {
    const lines = [];

    lines.push('=== CAFEOS DIAGNOSTICS REPORT ===');
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push('');

    lines.push('--- SYSTEM SUMMARY ---');
    lines.push(`Overall Score: ${report.systemSummary.overallScore}/100`);
    lines.push(`Active Incidents: ${report.systemSummary.activeIncidents}`);
    lines.push(`Critical Incidents: ${report.systemSummary.criticalIncidents}`);
    lines.push(`Pending Recommendations: ${report.systemSummary.pendingRecommendations}`);
    lines.push('');

    lines.push('--- INCIDENT SUMMARY ---');
    lines.push(`Total Incidents: ${report.incidentSummary.total}`);
    lines.push(`Active Incidents: ${report.incidentSummary.active}`);
    lines.push(`Resolved Incidents: ${report.incidentSummary.resolved}`);
    lines.push(`Average Resolution Time: ${Math.round(report.incidentSummary.averageResolutionTime / 1000)}s`);
    lines.push('');

    lines.push('--- HEALTH SUMMARY ---');
    lines.push(`Overall Status: ${report.healthSummary.overallStatus}`);
    lines.push(`Healthy Components: ${report.healthSummary.healthyComponents}`);
    lines.push(`Warning Components: ${report.healthSummary.warningComponents}`);
    lines.push(`Critical Components: ${report.healthSummary.criticalComponents}`);
    lines.push('');

    lines.push('--- RECOMMENDATIONS ---');
    report.recommendations.slice(0, 10).forEach(rec => {
      lines.push(`[${rec.priority.toUpperCase()}] ${rec.title}`);
      lines.push(`  Component: ${rec.component}`);
      lines.push(`  ${rec.description}`);
      lines.push('');
    });

    lines.push('--- WARNINGS ---');
    report.warnings.slice(0, 10).forEach(warning => {
      lines.push(`[${warning.severity.toUpperCase()}] ${warning.message}`);
      lines.push(`  Component: ${warning.component}`);
      lines.push(`  Confidence: ${warning.confidence}%`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Download report
   */
  async downloadReport(format = 'json') {
    const report = await this.generate();
    
    let content, filename, mimeType;

    if (format === 'json') {
      content = await this.exportAsJSON(report);
      filename = `cafeos-diagnostics-report-${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (format === 'txt') {
      content = await this.exportAsText(report);
      filename = `cafeos-diagnostics-report-${Date.now()}.txt`;
      mimeType = 'text/plain';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return report;
  }
}

// Singleton instance
const diagnosticsReportGenerator = new DiagnosticsReportGenerator();

export default diagnosticsReportGenerator;
export { DiagnosticsReportGenerator };
