// Webhook Signature Verification
// Security utility for verifying webhook signatures from payment gateways

import { getEncryptionEngine } from '../security/EncryptionEngine.js';

/**
 * Webhook Verifier
 * Handles signature verification for different payment gateways
 */
export class WebhookVerifier {
  constructor() {
    this.encryptionEngine = getEncryptionEngine();
    this.verificationLog = [];
  }

  /**
   * Verify Razorpay webhook signature
   * Uses HMAC SHA256 to verify the signature
   */
  async verifyRazorpayWebhook(signature, body, secret) {
    try {
      const expectedSignature = await this.generateHMACSHA256(body, secret);
      const isValid = expectedSignature === signature;
      
      this.logVerification('razorpay', isValid, { signature, bodyLength: body.length });
      
      return {
        valid: isValid,
        gateway: 'razorpay',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[WebhookVerifier] Razorpay verification failed:', error);
      return {
        valid: false,
        gateway: 'razorpay',
        error: error.message
      };
    }
  }

  /**
   * Verify Paytm webhook signature
   * Uses Paytm's checksum algorithm
   */
  async verifyPaytmWebhook(checksum, data, secret) {
    try {
      const expectedChecksum = await this.generatePaytmChecksum(data, secret);
      const isValid = expectedChecksum === checksum;
      
      this.logVerification('paytm', isValid, { checksum, dataKeys: Object.keys(data) });
      
      return {
        valid: isValid,
        gateway: 'paytm',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[WebhookVerifier] Paytm verification failed:', error);
      return {
        valid: false,
        gateway: 'paytm',
        error: error.message
      };
    }
  }

  /**
   * Verify Stripe webhook signature
   * Uses Stripe's signature verification
   */
  async verifyStripeWebhook(signature, payload, secret) {
    try {
      // Stripe signature format: t=<timestamp>,v1=<signature>
      const [timestamp, signatureValue] = signature.split(',');
      
      if (!timestamp || !signatureValue) {
        return {
          valid: false,
          gateway: 'stripe',
          error: 'Invalid signature format'
        };
      }

      const timestampValue = timestamp.replace('t=', '');
      const signatureHex = signatureValue.replace('v1=', '');

      // Check timestamp is within tolerance (5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const timestampDiff = Math.abs(now - parseInt(timestampValue));
      
      if (timestampDiff > 300) {
        return {
          valid: false,
          gateway: 'stripe',
          error: 'Timestamp outside tolerance'
        };
      }

      // Generate expected signature
      const expectedPayload = `${timestampValue}.${payload}`;
      const expectedSignature = await this.generateHMACSHA256(expectedPayload, secret);
      const isValid = expectedSignature === signatureHex;
      
      this.logVerification('stripe', isValid, { timestamp: timestampValue });
      
      return {
        valid: isValid,
        gateway: 'stripe',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[WebhookVerifier] Stripe verification failed:', error);
      return {
        valid: false,
        gateway: 'stripe',
        error: error.message
      };
    }
  }

  /**
   * Generate HMAC SHA256 signature
   */
  async generateHMACSHA256(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      messageData
    );
    
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate Paytm checksum
   * Paytm uses a specific checksum algorithm
   */
  async generatePaytmChecksum(data, secret) {
    // Sort the data keys
    const sortedKeys = Object.keys(data).sort();
    
    // Create checksum string
    const checksumString = `${sortedKeys
      .map(key => `${data[key]}`)
      .join('|')  }|${  secret}`;
    
    // Generate SHA256 hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(checksumString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify webhook based on gateway type
   */
  async verifyWebhook(gatewayType, signature, data, secret) {
    switch (gatewayType) {
      case 'razorpay':
        return await this.verifyRazorpayWebhook(signature, data, secret);
      case 'paytm':
        return await this.verifyPaytmWebhook(signature, data, secret);
      case 'stripe':
        return await this.verifyStripeWebhook(signature, data, secret);
      default:
        return {
          valid: false,
          gateway: gatewayType,
          error: 'Unsupported gateway'
        };
    }
  }

  /**
   * Log verification attempt
   */
  logVerification(gateway, valid, metadata = {}) {
    this.verificationLog.push({
      gateway,
      valid,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    // Keep only last 1000 logs
    if (this.verificationLog.length > 1000) {
      this.verificationLog.shift();
    }
  }

  /**
   * Get verification statistics
   */
  getStatistics() {
    const stats = {
      total: this.verificationLog.length,
      byGateway: {},
      successRate: {},
      recentFailures: []
    };

    this.verificationLog.forEach(log => {
      // By gateway
      if (!stats.byGateway[log.gateway]) {
        stats.byGateway[log.gateway] = { total: 0, success: 0, failure: 0 };
      }
      stats.byGateway[log.gateway].total++;
      if (log.valid) {
        stats.byGateway[log.gateway].success++;
      } else {
        stats.byGateway[log.gateway].failure++;
      }

      // Success rate
      if (!stats.successRate[log.gateway]) {
        stats.successRate[log.gateway] = 0;
      }
      stats.successRate[log.gateway] = 
        stats.byGateway[log.gateway].success / stats.byGateway[log.gateway].total;
    });

    // Recent failures (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.recentFailures = this.verificationLog
      .filter(log => !log.valid && new Date(log.timestamp) > oneDayAgo)
      .slice(-50);

    return stats;
  }

  /**
   * Get recent verification logs
   */
  getRecentLogs(limit = 50) {
    return this.verificationLog.slice(-limit);
  }

  /**
   * Clear verification logs
   */
  clearLogs() {
    this.verificationLog = [];
  }

  /**
   * Security event logging
   */
  logSecurityEvent(eventType, details) {
    const event = {
      eventType,
      details,
      timestamp: new Date().toISOString(),
      severity: this.getEventSeverity(eventType)
    };

    // Store in localStorage for persistence
    try {
      const securityLog = JSON.parse(localStorage.getItem('cafeos_security_log') || '[]');
      securityLog.push(event);
      
      // Keep only last 500 events
      if (securityLog.length > 500) {
        securityLog.shift();
      }
      
      localStorage.setItem('cafeos_security_log', JSON.stringify(securityLog));
    } catch (error) {
      console.error('[WebhookVerifier] Failed to log security event:', error);
    }

    // Alert for critical events
    if (event.severity === 'critical') {
      console.error('[WebhookVerifier] CRITICAL SECURITY EVENT:', event);
      window.dispatchEvent(new CustomEvent('securityAlert', { detail: event }));
    }
  }

  /**
   * Get event severity
   */
  getEventSeverity(eventType) {
    const criticalEvents = [
      'signature_verification_failed',
      'duplicate_webhook',
      'timestamp_out_of_tolerance',
      'invalid_webhook_format'
    ];

    const warningEvents = [
      'webhook_retry',
      'webhook_delayed'
    ];

    if (criticalEvents.includes(eventType)) {
      return 'critical';
    }

    if (warningEvents.includes(eventType)) {
      return 'warning';
    }

    return 'info';
  }

  /**
   * Check for duplicate webhooks
   */
  checkDuplicateWebhook(webhookId) {
    try {
      const processedWebhooks = JSON.parse(localStorage.getItem('cafeos_processed_webhooks') || '[]');
      
      if (processedWebhooks.includes(webhookId)) {
        this.logSecurityEvent('duplicate_webhook', { webhookId });
        return true;
      }
      
      processedWebhooks.push(webhookId);
      
      // Keep only last 1000 processed webhooks
      if (processedWebhooks.length > 1000) {
        processedWebhooks.shift();
      }
      
      localStorage.setItem('cafeos_processed_webhooks', JSON.stringify(processedWebhooks));
      return false;
    } catch (error) {
      console.error('[WebhookVerifier] Failed to check duplicate webhook:', error);
      return false;
    }
  }

  /**
   * Mark webhook as processed
   */
  markWebhookProcessed(webhookId) {
    try {
      const processedWebhooks = JSON.parse(localStorage.getItem('cafeos_processed_webhooks') || '[]');
      
      if (!processedWebhooks.includes(webhookId)) {
        processedWebhooks.push(webhookId);
        localStorage.setItem('cafeos_processed_webhooks', JSON.stringify(processedWebhooks));
      }
    } catch (error) {
      console.error('[WebhookVerifier] Failed to mark webhook processed:', error);
    }
  }

  /**
   * Get security log
   */
  getSecurityLog(limit = 100) {
    try {
      const log = JSON.parse(localStorage.getItem('cafeos_security_log') || '[]');
      return log.slice(-limit);
    } catch (error) {
      console.error('[WebhookVerifier] Failed to get security log:', error);
      return [];
    }
  }

  /**
   * Clear security log
   */
  clearSecurityLog() {
    localStorage.removeItem('cafeos_security_log');
  }
}

// Singleton instance
let webhookVerifierInstance = null;

/**
 * Get the singleton webhook verifier instance
 */
export function getWebhookVerifier() {
  if (!webhookVerifierInstance) {
    webhookVerifierInstance = new WebhookVerifier();
  }
  return webhookVerifierInstance;
}

export default WebhookVerifier;
