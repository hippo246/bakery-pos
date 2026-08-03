import React from 'react';
/**
 * BI Export Functionality
 * Allows exporting business intelligence reports in various formats
 */

import analyticsEngine from './AnalyticsEngine.js';
import businessIntelligenceEngine from './BusinessIntelligenceEngine.js';
import liveOperationsEngine from '../liveEngine/LiveOperationsEngine.js';

class BIExport {
  /**
   * Generate daily executive report
   * @returns {Object} Report data
   */
  generateDailyReport() {
    const liveData = liveOperationsEngine.getAllData();
    analyticsEngine.initialize();
    businessIntelligenceEngine.initialize();

    const revenueAnalytics = analyticsEngine.calculateRevenueAnalytics(liveData);
    const orderAnalytics = analyticsEngine.calculateOrderAnalytics(liveData);
    const kitchenAnalytics = analyticsEngine.calculateKitchenAnalytics(liveData);
    const tableAnalytics = analyticsEngine.calculateTableAnalytics(liveData);
    const paymentAnalytics = analyticsEngine.calculatePaymentAnalytics(liveData);
    const inventoryAnalytics = analyticsEngine.calculateInventoryAnalytics(liveData);
    const customerAnalytics = analyticsEngine.calculateCustomerAnalytics(liveData);
    const healthScore = businessIntelligenceEngine.calculateBusinessHealth(liveData);

    return {
      date: new Date().toISOString().split('T')[0],
      generated: new Date().toISOString(),
      summary: {
        revenue: revenueAnalytics.totalToday,
        orders: orderAnalytics.totalToday,
        customers: customerAnalytics.customersToday,
        averageOrderValue: revenueAnalytics.averageTicketSize,
        businessHealth: healthScore.overall,
        healthStatus: healthScore.status
      },
      revenue: revenueAnalytics,
      orders: orderAnalytics,
      kitchen: kitchenAnalytics,
      tables: tableAnalytics,
      payments: paymentAnalytics,
      inventory: inventoryAnalytics,
      customers: customerAnalytics,
      health: healthScore
    };
  }

  /**
   * Generate weekly summary
   * @returns {Object} Weekly report data
   */
  generateWeeklyReport() {
    const daily = this.generateDailyReport();
    
    return {
      weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weekEnd: new Date().toISOString().split('T')[0],
      generated: new Date().toISOString(),
      summary: daily.summary,
      // In production, this would aggregate actual weekly data
      weeklyTotal: daily.summary.revenue * 7,
      dailyAverage: daily.summary.revenue,
      trend: '+8%'
    };
  }

  /**
   * Generate monthly business report
   * @returns {Object} Monthly report data
   */
  generateMonthlyReport() {
    const daily = this.generateDailyReport();
    
    return {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      generated: new Date().toISOString(),
      summary: daily.summary,
      // In production, this would aggregate actual monthly data
      monthlyTotal: daily.summary.revenue * 30,
      dailyAverage: daily.summary.revenue,
      trend: '+12%'
    };
  }

  /**
   * Generate operational summary
   * @returns {Object} Operational report data
   */
  generateOperationalSummary() {
    const liveData = liveOperationsEngine.getAllData();
    analyticsEngine.initialize();

    const orderAnalytics = analyticsEngine.calculateOrderAnalytics(liveData);
    const kitchenAnalytics = analyticsEngine.calculateKitchenAnalytics(liveData);
    const tableAnalytics = analyticsEngine.calculateTableAnalytics(liveData);
    const paymentAnalytics = analyticsEngine.calculatePaymentAnalytics(liveData);

    return {
      date: new Date().toISOString().split('T')[0],
      generated: new Date().toISOString(),
      orders: orderAnalytics,
      kitchen: kitchenAnalytics,
      tables: tableAnalytics,
      payments: paymentAnalytics
    };
  }

  /**
   * Generate inventory summary
   * @returns {Object} Inventory report data
   */
  generateInventorySummary() {
    const liveData = liveOperationsEngine.getAllData();
    analyticsEngine.initialize();

    const inventoryAnalytics = analyticsEngine.calculateInventoryAnalytics(liveData);

    return {
      date: new Date().toISOString().split('T')[0],
      generated: new Date().toISOString(),
      inventory: inventoryAnalytics,
      rawData: liveData.inventory
    };
  }

  /**
   * Generate revenue summary
   * @returns {Object} Revenue report data
   */
  generateRevenueSummary() {
    const liveData = liveOperationsEngine.getAllData();
    analyticsEngine.initialize();

    const revenueAnalytics = analyticsEngine.calculateRevenueAnalytics(liveData);

    return {
      date: new Date().toISOString().split('T')[0],
      generated: new Date().toISOString(),
      revenue: revenueAnalytics,
      rawData: liveData.payments
    };
  }

  /**
   * Export as CSV
   * @param {Object} data - Data to export
   * @param {string} filename - Output filename
   */
  exportToCSV(data, filename) {
    const csv = this.convertToCSV(data);
    this.downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Export as JSON
   * @param {Object} data - Data to export
   * @param {string} filename - Output filename
   */
  exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Export as Excel (CSV format)
   * @param {Object} data - Data to export
   * @param {string} filename - Output filename
   */
  exportToExcel(data, filename) {
    const csv = this.convertToCSV(data);
    this.downloadFile(csv, filename, 'application/vnd.ms-excel');
  }

  /**
   * Export as PDF (text format)
   * @param {Object} data - Data to export
   * @param {string} filename - Output filename
   */
  exportToPDF(data, filename) {
    const text = this.convertToTextReport(data);
    this.downloadFile(text, filename, 'text/plain');
  }

  /**
   * Convert data to CSV format
   * @param {Object} data - Data to convert
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    const flatten = (obj, prefix = '') => {
      const result = {};
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flatten(value, newKey));
        } else {
          result[newKey] = Array.isArray(value) ? value.join('; ') : value;
        }
      }
      return result;
    };

    const flattened = flatten(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).join(',');

    return `${headers}\n${values}`;
  }

  /**
   * Convert data to text report
   * @param {Object} data - Data to convert
   * @returns {string} Text report
   */
  convertToTextReport(data) {
    let text = `CafeOS Business Intelligence Report\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `========================================\n\n`;

    const formatSection = (title, obj) => {
      let section = `${title}\n`;
      section += `${'='.repeat(title.length)}\n`;
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          section += formatSection(key, value);
        } else {
          section += `${key}: ${value}\n`;
        }
      }
      return section + '\n';
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        text += formatSection(key.toUpperCase(), value);
      }
    }

    return text;
  }

  /**
   * Download file
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
const biExport = new BIExport();

export default biExport;
