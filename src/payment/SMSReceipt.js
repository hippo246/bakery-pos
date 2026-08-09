// SMS Receipt Service
// Sends payment confirmations via SMS (WhatsApp optional)

import { getPaymentStorage, PaymentRecord, PaymentStatus } from './PaymentGateway.js';
import { getPaymentI18n } from './PaymentI18n.js';

export class SMSReceipt {
  constructor() {
    this.enabled = false;
    this.whatsappEnabled = false;
    this.smsProvider = null;
    this.smsApiKey = null;
    this.smsSenderId = null;
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_sms_receipt');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled || false;
        this.whatsappEnabled = parsed.whatsappEnabled || false;
        this.smsProvider = parsed.smsProvider || null;
        this.smsApiKey = parsed.smsApiKey || null;
        this.smsSenderId = parsed.smsSenderId || null;
      }
    } catch (error) {
      console.error('[SMSReceipt] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        whatsappEnabled: this.whatsappEnabled,
        smsProvider: this.smsProvider,
        smsApiKey: this.smsApiKey,
        smsSenderId: this.smsSenderId
      };
      localStorage.setItem('cafeos_sms_receipt', JSON.stringify(settings));
    } catch (error) {
      console.error('[SMSReceipt] Failed to save settings:', error);
    }
  }

  /**
   * Configure SMS provider
   */
  configure(provider, apiKey, senderId) {
    this.smsProvider = provider;
    this.smsApiKey = apiKey;
    this.smsSenderId = senderId;
    this.saveSettings();
  }

  /**
   * Enable SMS receipts
   */
  enable() {
    this.enabled = true;
    this.saveSettings();
  }

  /**
   * Disable SMS receipts
   */
  disable() {
    this.enabled = false;
    this.saveSettings();
  }

  /**
   * Enable WhatsApp receipts
   */
  enableWhatsApp() {
    this.whatsappEnabled = true;
    this.saveSettings();
  }

  /**
   * Disable WhatsApp receipts
   */
  disableWhatsApp() {
    this.whatsappEnabled = false;
    this.saveSettings();
  }

  /**
   * Send SMS receipt for payment
   */
  async sendReceipt(paymentId, customerPhone, options = {}) {
    if (!this.enabled) {
      return { success: false, reason: 'SMS receipts disabled' };
    }

    if (!customerPhone) {
      return { success: false, reason: 'Customer phone not provided' };
    }

    const paymentStorage = getPaymentStorage();
    const payment = paymentStorage.getById(paymentId);

    if (!payment) {
      return { success: false, reason: 'Payment not found' };
    }

    const i18n = getPaymentI18n();
    const message = this.generateReceiptMessage(payment, i18n, options);

    try {
      // In production, this would call SMS provider API
      // For now, we'll simulate the send
      const result = await this.sendSMS(customerPhone, message);

      if (result.success) {
        // Log the sent receipt
        this.logSentReceipt(paymentId, customerPhone, message);
      }

      return result;
    } catch (error) {
      console.error('[SMSReceipt] Failed to send receipt:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Generate receipt message
   */
  generateReceiptMessage(payment, i18n, options = {}) {
    const amount = i18n.formatCurrency(payment.amount);
    const date = i18n.formatDate(new Date(payment.completedAt || payment.createdAt), {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    let message = `${i18n.translate('paymentSuccess')}!\n`;
    message += `${i18n.translate('amount')}: ${amount}\n`;
    message += `${i18n.translate('orderNumber')}: ${payment.orderId}\n`;
    message += `Date: ${date}\n`;

    if (options.includeItems && payment.gatewayResponse?.items) {
      message += '\nItems:\n';
      payment.gatewayResponse.items.forEach(item => {
        message += `- ${item.name} x${item.qty}: ${i18n.formatCurrency(item.price)}\n`;
      });
    }

    if (options.includeTax) {
      message += `\n${i18n.translate('tax')}: ${i18n.formatCurrency(payment.gatewayResponse?.tax || 0)}\n`;
    }

    message += `\n${i18n.translate('thankYou')}!`;

    return message;
  }

  /**
   * Send SMS via provider
   */
  async sendSMS(phone, message) {
    // In production, this would call actual SMS provider API
    // Examples: Twilio, MSG91, Exotel, etc.

    if (!this.smsProvider || !this.smsApiKey) {
      // Simulate send for demo
      console.log(`[SMSReceipt] SMS to ${phone}: ${message}`);
      return { success: true, provider: 'demo' };
    }

    // Production implementation would be:
    // switch (this.smsProvider) {
    //   case 'twilio':
    //     return await this.sendViaTwilio(phone, message);
    //   case 'msg91':
    //     return await this.sendViaMSG91(phone, message);
    //   case 'exotel':
    //     return await this.sendViaExotel(phone, message);
    //   default:
    //     return { success: false, reason: 'Unknown provider' };
    // }

    return { success: true, provider: this.smsProvider };
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(phone, message) {
    if (!this.whatsappEnabled) {
      return { success: false, reason: 'WhatsApp disabled' };
    }

    // In production, this would use WhatsApp Business API
    console.log(`[SMSReceipt] WhatsApp to ${phone}: ${message}`);

    return { success: true, provider: 'whatsapp' };
  }

  /**
   * Log sent receipt
   */
  logSentReceipt(paymentId, phone, message) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_sms_receipt_log') || '[]');
      log.push({
        paymentId,
        phone,
        message,
        timestamp: new Date().toISOString(),
        provider: this.smsProvider
      });

      // Keep only last 1000 logs
      if (log.length > 1000) {
        log.shift();
      }

      localStorage.setItem('cafeos_sms_receipt_log', JSON.stringify(log));
    } catch (error) {
      console.error('[SMSReceipt] Failed to log receipt:', error);
    }
  }

  /**
   * Get receipt log
   */
  getReceiptLog(limit = 50) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_sms_receipt_log') || '[]');
      return log.slice(-limit);
    } catch (error) {
      console.error('[SMSReceipt] Failed to get receipt log:', error);
      return [];
    }
  }

  /**
   * Get receipt statistics
   */
  getStatistics() {
    const log = this.getReceiptLog(1000);
    
    const stats = {
      total: log.length,
      byProvider: {},
      byStatus: { success: 0, failed: 0 },
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    log.forEach(entry => {
      // By provider
      if (!stats.byProvider[entry.provider]) {
        stats.byProvider[entry.provider] = 0;
      }
      stats.byProvider[entry.provider]++;

      // By status (assuming all logged are successful)
      stats.byStatus.success++;

      // By time period
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= today) {
        stats.today++;
      }
      if (entryDate >= weekAgo) {
        stats.thisWeek++;
      }
      if (entryDate >= monthAgo) {
        stats.thisMonth++;
      }
    });

    return stats;
  }

  /**
   * Validate phone number for SMS
   */
  validatePhone(phone) {
    // Indian phone number format: +91XXXXXXXXXX or 10 digits
    const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return indianPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number for SMS
   */
  formatPhone(phone) {
    // Ensure Indian format with +91
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }
    
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    }
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
      return cleanPhone;
    }
    
    return phone;
  }

  /**
   * Get SMS provider configuration
   */
  getConfiguration() {
    return {
      enabled: this.enabled,
      whatsappEnabled: this.whatsappEnabled,
      provider: this.smsProvider,
      senderId: this.smsSenderId,
      hasApiKey: !!this.smsApiKey
    };
  }

  /**
   * Clear receipt log
   */
  clearLog() {
    localStorage.removeItem('cafeos_sms_receipt_log');
  }

  /**
   * Destroy the SMS receipt service
   */
  destroy() {
    console.log('[SMSReceipt] Destroyed');
  }
}

// Singleton instance
let smsReceiptInstance = null;

/**
 * Get the singleton SMS receipt instance
 */
export function getSMSReceipt() {
  if (!smsReceiptInstance) {
    smsReceiptInstance = new SMSReceipt();
  }
  return smsReceiptInstance;
}

export default SMSReceipt;
