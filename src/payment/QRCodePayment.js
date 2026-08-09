// QR Code Payment System
// Handles static and dynamic QR code payments for UPI

import { getPaymentGatewayFactory, GatewayType } from './PaymentGatewayFactory.js';
import { getPaymentStorage, PaymentRecord, PaymentStatus } from './PaymentGateway.js';

export class QRCodePayment {
  constructor() {
    this.factory = getPaymentGatewayFactory();
    this.paymentStorage = getPaymentStorage();
    this.staticQRCode = null;
    this.dynamicQRCodes = new Map();
    this.loadStaticQR();
  }

  /**
   * Load static QR code from localStorage
   */
  loadStaticQR() {
    try {
      const stored = localStorage.getItem('cafeos_static_qr');
      if (stored) {
        this.staticQRCode = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[QRCodePayment] Failed to load static QR:', error);
    }
  }

  /**
   * Save static QR code to localStorage
   */
  saveStaticQR() {
    try {
      localStorage.setItem('cafeos_static_qr', JSON.stringify(this.staticQRCode));
    } catch (error) {
      console.error('[QRCodePayment] Failed to save static QR:', error);
    }
  }

  /**
   * Generate static QR code for counter
   * This QR code can be used for multiple payments
   */
  generateStaticQR(vpa, amount = null, merchantName = 'Cafe OS') {
    const upiString = this.buildUPIString({
      pa: vpa,
      pn: merchantName,
      am: amount,
      cu: 'INR'
    });

    this.staticQRCode = {
      vpa,
      amount,
      merchantName,
      upiString,
      qrCode: this.generateQRCodeURL(upiString),
      createdAt: new Date().toISOString()
    };

    this.saveStaticQR();
    return this.staticQRCode;
  }

  /**
   * Generate dynamic QR code for specific order
   * This QR code is tied to a specific order amount
   */
  generateDynamicQR(orderId, amount, vpa, merchantName = 'Cafe OS', customerInfo = {}) {
    const upiString = this.buildUPIString({
      pa: vpa,
      pn: merchantName,
      am: amount,
      cu: 'INR',
      tr: orderId,
      tn: `Order ${orderId}`,
      mc: merchantName
    });

    const dynamicQR = {
      orderId,
      amount,
      vpa,
      merchantName,
      customerInfo,
      upiString,
      qrCode: this.generateQRCodeURL(upiString),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes expiry
    };

    this.dynamicQRCodes.set(orderId, dynamicQR);
    return dynamicQR;
  }

  /**
   * Build UPI string for QR code
   */
  buildUPIString(params) {
    const upiParams = {
      pa: params.pa, // Payee address (VPA)
      pn: params.pn, // Payee name
      am: params.am, // Amount
      cu: params.cu || 'INR', // Currency
      tr: params.tr, // Transaction ID
      tn: params.tn, // Transaction note
      mc: params.mc, // Merchant code
      ref: params.ref, // Reference URL
      refUrl: params.refUrl // Reference URL
    };

    // Filter out null/undefined values
    const filteredParams = Object.entries(upiParams)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);

    return `upi://pay?${filteredParams.join('&')}`;
  }

  /**
   * Generate QR code URL using QR code API
   */
  generateQRCodeURL(upiString, size = 300) {
    // Using a public QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiString)}`;
  }

  /**
   * Get static QR code
   */
  getStaticQR() {
    return this.staticQRCode;
  }

  /**
   * Get dynamic QR code for order
   */
  getDynamicQR(orderId) {
    return this.dynamicQRCodes.get(orderId);
  }

  /**
   * Check if dynamic QR is expired
   */
  isQREpired(orderId) {
    const qr = this.dynamicQRCodes.get(orderId);
    if (!qr) return true;
    
    return new Date() > new Date(qr.expiresAt);
  }

  /**
   * Refresh dynamic QR code
   */
  refreshDynamicQR(orderId, amount, vpa, merchantName, customerInfo) {
    if (this.isQREpired(orderId)) {
      return this.generateDynamicQR(orderId, amount, vpa, merchantName, customerInfo);
    }
    return this.dynamicQRCodes.get(orderId);
  }

  /**
   * Delete dynamic QR code
   */
  deleteDynamicQR(orderId) {
    this.dynamicQRCodes.delete(orderId);
  }

  /**
   * Clear expired dynamic QR codes
   */
  clearExpiredQRCodes() {
    const now = new Date();
    
    for (const [orderId, qr] of this.dynamicQRCodes.entries()) {
      if (now > new Date(qr.expiresAt)) {
        this.dynamicQRCodes.delete(orderId);
      }
    }
  }

  /**
   * Monitor QR code payment status
   * Poll for payment completion when using QR code
   */
  async monitorQRPayment(orderId, onPaymentComplete, onPaymentFailed, maxAttempts = 30) {
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        onPaymentFailed?.({ reason: 'Payment timeout' });
        return;
      }

      try {
        // Check payment status from payment storage
        const payments = this.paymentStorage.getByOrderId(orderId);
        const completedPayment = payments.find(p => p.status === PaymentStatus.COMPLETED);
        
        if (completedPayment) {
          clearInterval(pollInterval);
          onPaymentComplete?.(completedPayment);
          return;
        }

        // Check with gateway for status
        const gateway = await this.factory.getGateway();
        const status = await gateway.getPaymentStatus(orderId);
        
        if (status.success && (status.status === 'completed' || status.status === 'succeeded')) {
          clearInterval(pollInterval);
          
          // Update payment record
          const payment = this.paymentStorage.getByOrderId(orderId)[0];
          if (payment) {
            payment.updateStatus(PaymentStatus.COMPLETED, {
              gatewayResponse: status
            });
            this.paymentStorage.save(payment);
          }
          
          onPaymentComplete?.(payment);
        }
      } catch (error) {
        console.error('[QRCodePayment] Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return pollInterval;
  }

  /**
   * Get QR code statistics
   */
  getStatistics() {
    return {
      staticQR: this.staticQRCode ? {
        exists: true,
        vpa: this.staticQRCode.vpa,
        amount: this.staticQRCode.amount,
        createdAt: this.staticQRCode.createdAt
      } : { exists: false },
      dynamicQRCodes: {
        total: this.dynamicQRCodes.size,
        expired: Array.from(this.dynamicQRCodes.values()).filter(qr => 
          new Date() > new Date(qr.expiresAt)
        ).length
      }
    };
  }

  /**
   * Export QR code for printing
   */
  exportQRCodeForPrinting(orderId, format = 'png') {
    const qr = orderId ? this.getDynamicQR(orderId) : this.getStaticQR();
    
    if (!qr) {
      throw new Error('QR code not found');
    }

    return {
      qrCode: qr.qrCode,
      amount: qr.amount,
      merchantName: qr.merchantName,
      orderId: qr.orderId,
      format
    };
  }

  /**
   * Validate VPA (Virtual Payment Address)
   */
  validateVPA(vpa) {
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return vpaRegex.test(vpa);
  }

  /**
   * Get supported UPI apps for deep linking
   */
  getUPIDeepLinks(upiString) {
    return {
      phonepe: `phonepe://upi/pay?${upiString.replace('upi://pay?', '')}`,
      gpay: `tez://upi/pay?${upiString.replace('upi://pay?', '')}`,
      paytm: `paytmmp://pay?${upiString.replace('upi://pay?', '')}`,
      bhim: `upi://pay?${upiString.replace('upi://pay?', '')}`,
      default: upiString
    };
  }

  /**
   * Destroy the QR code payment system
   */
  destroy() {
    this.dynamicQRCodes.clear();
    console.log('[QRCodePayment] Destroyed');
  }
}

// Singleton instance
let qrCodePaymentInstance = null;

/**
 * Get the singleton QR code payment instance
 */
export function getQRCodePayment() {
  if (!qrCodePaymentInstance) {
    qrCodePaymentInstance = new QRCodePayment();
  }
  return qrCodePaymentInstance;
}

export default QRCodePayment;
