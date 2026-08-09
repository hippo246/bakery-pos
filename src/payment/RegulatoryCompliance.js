// Regulatory Compliance
// PCI-DSS, RBI Guidelines, GST compliance for Indian payments

import { getPaymentStorage, PaymentRecord, PaymentStatus } from './PaymentGateway.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';
import { getWebhookVerifier } from './WebhookVerifier.js';

export class RegulatoryCompliance {
  constructor() {
    this.encryptionEngine = getEncryptionEngine();
    this.webhookVerifier = getWebhookVerifier();
    this.complianceSettings = {
      pciDSS: {
        enabled: true,
        encryptionRequired: true,
        tokenizationRequired: true
      },
      rbi: {
        enabled: true,
        dataLocalizationRequired: true,
        upiCompliance: true,
        walletCompliance: true
      },
      gst: {
        enabled: true,
        gstin: '',
        gstRate: 18,
        inclusive: false
      }
    };
    this.loadSettings();
  }

  /**
   * Load compliance settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_compliance_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.complianceSettings = { ...this.complianceSettings, ...parsed };
      }
    } catch (error) {
      console.error('[RegulatoryCompliance] Failed to load settings:', error);
    }
  }

  /**
   * Save compliance settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('cafeos_compliance_settings', JSON.stringify(this.complianceSettings));
    } catch (error) {
      console.error('[RegulatoryCompliance] Failed to save settings:', error);
    }
  }

  /**
   * PCI-DSS Compliance
   * Payment Card Industry Data Security Standard
   */
  async pciDSSCompliance(paymentData) {
    if (!this.complianceSettings.pciDSS.enabled) {
      return { compliant: true, reason: 'PCI-DSS disabled' };
    }

    const violations = [];

    // Check for encryption
    if (this.complianceSettings.pciDSS.encryptionRequired) {
      if (!paymentData.encrypted) {
        violations.push('Card data not encrypted');
      }
    }

    // Check for tokenization
    if (this.complianceSettings.pciDSS.tokenizationRequired) {
      if (!paymentData.tokenized && paymentData.cardNumber) {
        violations.push('Card data not tokenized');
      }
    }

    // Check for sensitive data in logs
    if (this.containsSensitiveData(paymentData)) {
      violations.push('Sensitive data in logs');
    }

    return {
      compliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData(data) {
    const sensitivePatterns = [
      /\b\d{16}\b/, // Credit card number
      /\b\d{3,4}\b/, // CVV
      /\b\d{2}\/\d{2,4}\b/, // Expiry date
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/ // Formatted card number
    ];

    const dataString = JSON.stringify(data);
    
    return sensitivePatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Tokenize card data
   * Replace actual card data with token
   */
  async tokenizeCard(cardData) {
    if (!this.complianceSettings.pciDSS.tokenizationRequired) {
      return cardData;
    }

    const token = this.generateCardToken();
    
    // Store encrypted mapping in secure storage
    const encryptedCard = await this.encryptionEngine.encrypt(JSON.stringify(cardData));
    
    this.storeTokenMapping(token, encryptedCard);
    
    // Return token instead of actual data
    return {
      token,
      last4: cardData.cardNumber?.slice(-4),
      expiry: cardData.expiry,
      cardType: this.detectCardType(cardData.cardNumber)
    };
  }

  /**
   * Generate card token
   */
  generateCardToken() {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store token mapping
   */
  storeTokenMapping(token, encryptedCard) {
    try {
      const mappings = JSON.parse(localStorage.getItem('cafeos_card_tokens') || '{}');
      mappings[token] = {
        encryptedCard,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('cafeos_card_tokens', JSON.stringify(mappings));
    } catch (error) {
      console.error('[RegulatoryCompliance] Failed to store token mapping:', error);
    }
  }

  /**
   * Detect card type
   */
  detectCardType(cardNumber) {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      rupay: /^6/,
      amex: /^3[47]/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type;
      }
    }

    return 'unknown';
  }

  /**
   * RBI Compliance
   * Reserve Bank of India guidelines for digital payments
   */
  async rbiCompliance(paymentData) {
    if (!this.complianceSettings.rbi.enabled) {
      return { compliant: true, reason: 'RBI compliance disabled' };
    }

    const violations = [];

    // Check data localization
    if (this.complianceSettings.rbi.dataLocalizationRequired) {
      if (!paymentData.storedInIndia) {
        violations.push('Payment data not stored in India');
      }
    }

    // Check UPI compliance
    if (this.complianceSettings.rbi.upiCompliance && paymentData.paymentMethod === 'UPI') {
      if (!paymentData.vpa || !this.validateVPA(paymentData.vpa)) {
        violations.push('Invalid UPI VPA format');
      }
    }

    // Check wallet compliance
    if (this.complianceSettings.rbi.walletCompliance && paymentData.paymentMethod === 'wallet') {
      if (!paymentData.walletProvider) {
        violations.push('Wallet provider not specified');
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate UPI VPA format
   */
  validateVPA(vpa) {
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return vpaRegex.test(vpa);
  }

  /**
   * GST Compliance
   * Goods and Services Tax compliance
   */
  async gstCompliance(paymentData) {
    if (!this.complianceSettings.gst.enabled) {
      return { compliant: true, reason: 'GST disabled' };
    }

    const violations = [];

    // Check GSTIN if applicable
    if (paymentData.amount >= 500000 && !this.complianceSettings.gst.gstin) {
      violations.push('GSTIN required for transactions above ₹5,00,000');
    }

    // Validate GSTIN format
    if (this.complianceSettings.gst.gstin && !this.validateGSTIN(this.complianceSettings.gst.gstin)) {
      violations.push('Invalid GSTIN format');
    }

    return {
      compliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate GSTIN format
   */
  validateGSTIN(gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Calculate GST
   */
  calculateGST(amount, gstRate = null) {
    const rate = gstRate || this.complianceSettings.gst.gstRate;
    
    if (this.complianceSettings.gst.inclusive) {
      // GST is inclusive in amount
      const baseAmount = (amount * 100) / (100 + rate);
      const gstAmount = amount - baseAmount;
      return {
        baseAmount,
        gstAmount,
        totalAmount: amount,
        rate
      };
    } else {
      // GST is exclusive
      const gstAmount = (amount * rate) / 100;
      return {
        baseAmount: amount,
        gstAmount,
        totalAmount: amount + gstAmount,
        rate
      };
    }
  }

  /**
   * Generate GST invoice
   */
  generateGSTInvoice(paymentData) {
    const gstCalculation = this.calculateGST(paymentData.amount);
    
    return {
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date().toISOString(),
      gstin: this.complianceSettings.gst.gstin,
      customerDetails: {
        name: paymentData.customerInfo?.name || '',
        phone: paymentData.customerInfo?.phone || '',
        address: paymentData.customerInfo?.address || ''
      },
      items: paymentData.items || [],
      amountBreakdown: gstCalculation,
      paymentMethod: paymentData.paymentMethod,
      paymentId: paymentData.paymentId,
      signature: this.generateInvoiceSignature(gstCalculation)
    };
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `INV${year}${month}${random}`;
  }

  /**
   * Generate invoice signature
   */
  generateInvoiceSignature(invoiceData) {
    const dataString = JSON.stringify(invoiceData);
    const hash = this.simpleHash(dataString);
    return hash.substring(0, 16);
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Run full compliance check
   */
  async runComplianceCheck(paymentData) {
    const results = {
      pciDSS: await this.pciDSSCompliance(paymentData),
      rbi: await this.rbiCompliance(paymentData),
      gst: await this.gstCompliance(paymentData),
      overallCompliant: true,
      timestamp: new Date().toISOString()
    };

    results.overallCompliant = 
      results.pciDSS.compliant && 
      results.rbi.compliant && 
      results.gst.compliant;

    return results;
  }

  /**
   * Log compliance event
   */
  logComplianceEvent(eventType, details) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_compliance_log') || '[]');
      
      log.push({
        eventType,
        details,
        timestamp: new Date().toISOString()
      });

      // Keep only last 1000 events
      if (log.length > 1000) {
        log.shift();
      }

      localStorage.setItem('cafeos_compliance_log', JSON.stringify(log));
    } catch (error) {
      console.error('[RegulatoryCompliance] Failed to log event:', error);
    }
  }

  /**
   * Get compliance log
   */
  getComplianceLog(limit = 50) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_compliance_log') || '[]');
      return log.slice(-limit);
    } catch (error) {
      console.error('[RegulatoryCompliance] Failed to get log:', error);
      return [];
    }
  }

  /**
   * Get compliance statistics
   */
  getComplianceStatistics() {
    const log = this.getComplianceLog(1000);
    
    const stats = {
      total: log.length,
      byEventType: {},
      byComplianceStatus: { compliant: 0, nonCompliant: 0 },
      recentViolations: []
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    log.forEach(entry => {
      // By event type
      if (!stats.byEventType[entry.eventType]) {
        stats.byEventType[entry.eventType] = 0;
      }
      stats.byEventType[entry.eventType]++;

      // By compliance status
      if (entry.details.compliant === false) {
        stats.byComplianceStatus.nonCompliant++;
        
        // Recent violations
        if (new Date(entry.timestamp) > oneDayAgo) {
          stats.recentViolations.push(entry);
        }
      } else {
        stats.byComplianceStatus.compliant++;
      }
    });

    return stats;
  }

  /**
   * Update compliance settings
   */
  updateSettings(settings) {
    this.complianceSettings = { ...this.complianceSettings, ...settings };
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.complianceSettings;
  }

  /**
   * Clear compliance log
   */
  clearLog() {
    localStorage.removeItem('cafeos_compliance_log');
  }

  /**
   * Destroy the compliance module
   */
  destroy() {
    console.log('[RegulatoryCompliance] Destroyed');
  }
}

// Singleton instance
let regulatoryComplianceInstance = null;

/**
 * Get the singleton regulatory compliance instance
 */
export function getRegulatoryCompliance() {
  if (!regulatoryComplianceInstance) {
    regulatoryComplianceInstance = new RegulatoryCompliance();
  }
  return regulatoryComplianceInstance;
}

export default RegulatoryCompliance;
