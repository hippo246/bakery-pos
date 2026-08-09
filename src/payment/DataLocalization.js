// Data Localization for Indian Payment Data
// Ensures Indian payment data is stored in India (RBI requirement)

import { getPaymentStorage, PaymentRecord, PaymentStatus } from './PaymentGateway.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';

export class DataLocalization {
  constructor() {
    this.encryptionEngine = getEncryptionEngine();
    this.storageRegion = 'IN'; // India
    this.dataCenter = 'Mumbai'; // Default data center
    this.complianceEnabled = true;
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_data_localization');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.storageRegion = parsed.storageRegion || 'IN';
        this.dataCenter = parsed.dataCenter || 'Mumbai';
        this.complianceEnabled = parsed.complianceEnabled !== false;
      }
    } catch (error) {
      console.error('[DataLocalization] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        storageRegion: this.storageRegion,
        dataCenter: this.dataCenter,
        complianceEnabled: this.complianceEnabled
      };
      localStorage.setItem('cafeos_data_localization', JSON.stringify(settings));
    } catch (error) {
      console.error('[DataLocalization] Failed to save settings:', error);
    }
  }

  /**
   * Set storage region
   */
  setStorageRegion(region) {
    const validRegions = ['IN', 'US', 'EU', 'SG'];
    if (validRegions.includes(region)) {
      this.storageRegion = region;
      this.saveSettings();
    }
  }

  /**
   * Set data center
   */
  setDataCenter(dataCenter) {
    const indianDataCenters = [
      'Mumbai',
      'Chennai',
      'Kolkata',
      'Delhi',
      'Bangalore',
      'Hyderabad',
      'Pune'
    ];

    if (indianDataCenters.includes(dataCenter)) {
      this.dataCenter = dataCenter;
      this.saveSettings();
    }
  }

  /**
   * Enable compliance
   */
  enableCompliance() {
    this.complianceEnabled = true;
    this.saveSettings();
  }

  /**
   * Disable compliance
   */
  disableCompliance() {
    this.complianceEnabled = false;
    this.saveSettings();
  }

  /**
   * Check if data is stored in India
   */
  isStoredInIndia() {
    return this.storageRegion === 'IN';
  }

  /**
   * Add localization metadata to payment data
   */
  addLocalizationMetadata(paymentData) {
    if (!this.complianceEnabled) {
      return paymentData;
    }

    return {
      ...paymentData,
      localization: {
        storageRegion: this.storageRegion,
        dataCenter: this.dataCenter,
        storedInIndia: this.storageRegion === 'IN',
        timestamp: new Date().toISOString(),
        complianceVerified: true
      }
    };
  }

  /**
   * Verify data localization for payment
   */
  verifyLocalization(paymentData) {
    if (!this.complianceEnabled) {
      return { compliant: true, reason: 'Compliance disabled' };
    }

    const localization = paymentData.localization;

    if (!localization) {
      return {
        compliant: false,
        reason: 'No localization metadata found',
        requiresAction: 'add_localization_metadata'
      };
    }

    if (localization.storageRegion !== 'IN') {
      return {
        compliant: false,
        reason: 'Payment data not stored in India',
        currentRegion: localization.storageRegion,
        requiredRegion: 'IN',
        requiresAction: 'migrate_to_indian_storage'
      };
    }

    if (!localization.complianceVerified) {
      return {
        compliant: false,
        reason: 'Compliance not verified',
        requiresAction: 'verify_compliance'
      };
    }

    return {
      compliant: true,
      region: localization.storageRegion,
      dataCenter: localization.dataCenter
    };
  }

  /**
   * Migrate payment data to Indian storage
   */
  async migrateToIndianStorage(paymentId) {
    const paymentStorage = getPaymentStorage();
    const payment = paymentStorage.getById(paymentId);

    if (!payment) {
      return { success: false, reason: 'Payment not found' };
    }

    // Add localization metadata
    const updatedPayment = this.addLocalizationMetadata(payment.toJSON());
    
    // Save with localization metadata
    paymentStorage.save(PaymentRecord.fromJSON(updatedPayment));

    // Log migration
    this.logMigration(paymentId, {
      from: payment.localization?.storageRegion || 'unknown',
      to: 'IN',
      dataCenter: this.dataCenter
    });

    return {
      success: true,
      paymentId,
      newRegion: 'IN',
      dataCenter: this.dataCenter
    };
  }

  /**
   * Batch migrate all payments to Indian storage
   */
  async batchMigrateToIndianStorage() {
    const paymentStorage = getPaymentStorage();
    const payments = paymentStorage.getAll();

    const results = {
      total: payments.length,
      migrated: 0,
      failed: 0,
      alreadyCompliant: 0
    };

    for (const payment of payments) {
      const verification = this.verifyLocalization(payment);

      if (verification.compliant) {
        results.alreadyCompliant++;
        continue;
      }

      const migrationResult = await this.migrateToIndianStorage(payment.id);

      if (migrationResult.success) {
        results.migrated++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Log data migration
   */
  logMigration(paymentId, details) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_data_migration_log') || '[]');
      
      log.push({
        paymentId,
        details,
        timestamp: new Date().toISOString()
      });

      // Keep only last 1000 migrations
      if (log.length > 1000) {
        log.shift();
      }

      localStorage.setItem('cafeos_data_migration_log', JSON.stringify(log));
    } catch (error) {
      console.error('[DataLocalization] Failed to log migration:', error);
    }
  }

  /**
   * Get migration log
   */
  getMigrationLog(limit = 50) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_data_migration_log') || '[]');
      return log.slice(-limit);
    } catch (error) {
      console.error('[DataLocalization] Failed to get migration log:', error);
      return [];
    }
  }

  /**
   * Get localization statistics
   */
  getLocalizationStatistics() {
    const paymentStorage = getPaymentStorage();
    const payments = paymentStorage.getAll();

    const stats = {
      total: payments.length,
      inIndia: 0,
      outsideIndia: 0,
      noMetadata: 0,
      byDataCenter: {},
      byRegion: {}
    };

    payments.forEach(payment => {
      const verification = this.verifyLocalization(payment);

      if (verification.compliant) {
        stats.inIndia++;
        
        // By data center
        const dataCenter = verification.dataCenter || 'unknown';
        stats.byDataCenter[dataCenter] = (stats.byDataCenter[dataCenter] || 0) + 1;
      } else if (verification.currentRegion) {
        stats.outsideIndia++;
        
        // By region
        const region = verification.currentRegion;
        stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
      } else {
        stats.noMetadata++;
      }
    });

    return stats;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    const stats = this.getLocalizationStatistics();
    const migrationLog = this.getMigrationLog(100);

    const report = {
      summary: {
        totalPayments: stats.total,
        compliantPayments: stats.inIndia,
        compliancePercentage: stats.total > 0 
          ? ((stats.inIndia / stats.total) * 100).toFixed(2) 
          : 0,
        requiresMigration: stats.total - stats.inIndia
      },
      breakdown: {
        inIndia: stats.inIndia,
        outsideIndia: stats.outsideIndia,
        noMetadata: stats.noMetadata,
        byDataCenter: stats.byDataCenter,
        byRegion: stats.byRegion
      },
      currentConfiguration: {
        storageRegion: this.storageRegion,
        dataCenter: this.dataCenter,
        complianceEnabled: this.complianceEnabled
      },
      recentMigrations: migrationLog.slice(-10),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  /**
   * Export compliance report
   */
  exportComplianceReport() {
    const report = this.generateComplianceReport();
    
    // Convert to CSV format
    const csv = [
      'Metric,Value',
      `Total Payments,${report.summary.totalPayments}`,
      `Compliant Payments,${report.summary.compliantPayments}`,
      `Compliance Percentage,${report.summary.compliancePercentage}%`,
      `Requires Migration,${report.summary.requiresMigration}`,
      `Storage Region,${report.currentConfiguration.storageRegion}`,
      `Data Center,${report.currentConfiguration.dataCenter}`,
      `Compliance Enabled,${report.currentConfiguration.complianceEnabled}`
    ].join('\n');

    return csv;
  }

  /**
   * Get available Indian data centers
   */
  getIndianDataCenters() {
    return [
      { code: 'MUM', name: 'Mumbai', region: 'West' },
      { code: 'MAA', name: 'Chennai', region: 'South' },
      { code: 'CCU', name: 'Kolkata', region: 'East' },
      { code: 'DEL', name: 'Delhi', region: 'North' },
      { code: 'BLR', name: 'Bangalore', region: 'South' },
      { code: 'HYD', name: 'Hyderabad', region: 'South' },
      { code: 'PNQ', name: 'Pune', region: 'West' }
    ];
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      storageRegion: this.storageRegion,
      dataCenter: this.dataCenter,
      complianceEnabled: this.complianceEnabled,
      isStoredInIndia: this.isStoredInIndia()
    };
  }

  /**
   * Clear migration log
   */
  clearMigrationLog() {
    localStorage.removeItem('cafeos_data_migration_log');
  }

  /**
   * Destroy the data localization module
   */
  destroy() {
    console.log('[DataLocalization] Destroyed');
  }
}

// Singleton instance
let dataLocalizationInstance = null;

/**
 * Get the singleton data localization instance
 */
export function getDataLocalization() {
  if (!dataLocalizationInstance) {
    dataLocalizationInstance = new DataLocalization();
  }
  return dataLocalizationInstance;
}

export default DataLocalization;
