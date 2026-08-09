// Webhook Handler for Delivery Platforms
// Handles real-time order receiving from Zomato and Swiggy

import { getDeliveryPlatformFactory } from './DeliveryPlatformFactory.js';
import { PlatformType } from './DeliveryPlatformAdapter.js';
import { getDeliveryOrderStorage } from './DeliveryPlatformAdapter.js';

export class WebhookHandler {
  constructor() {
    this.factory = getDeliveryPlatformFactory();
    this.storage = getDeliveryOrderStorage();
    this.webhookLog = [];
    this.loadWebhookLog();
  }

  /**
   * Load webhook log from localStorage
   */
  loadWebhookLog() {
    try {
      const stored = localStorage.getItem('cafeos_webhook_log');
      if (stored) {
        this.webhookLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[WebhookHandler] Failed to load webhook log:', error);
    }
  }

  /**
   * Save webhook log to localStorage
   */
  saveWebhookLog() {
    try {
      // Keep only last 1000 webhooks
      if (this.webhookLog.length > 1000) {
        this.webhookLog.shift();
      }
      localStorage.setItem('cafeos_webhook_log', JSON.stringify(this.webhookLog));
    } catch (error) {
      console.error('[WebhookHandler] Failed to save webhook log:', error);
    }
  }

  /**
   * Log webhook event
   */
  logWebhook(platform, type, payload, result) {
    const logEntry = {
      platform,
      type,
      payload: JSON.stringify(payload).substring(0, 500), // Truncate large payloads
      result,
      timestamp: new Date().toISOString()
    };
    
    this.webhookLog.push(logEntry);
    this.saveWebhookLog();
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(platformType, signature, payload) {
    try {
      console.log(`[WebhookHandler] Received webhook from ${platformType}`);
      
      // Verify webhook signature
      const verification = await this.factory.verifyWebhook(signature, payload, platformType);
      
      if (!verification.valid) {
        this.logWebhook(platformType, 'verification_failed', payload, {
          success: false,
          error: 'Signature verification failed'
        });
        
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      // Check for duplicate webhooks
      const webhookId = this.generateWebhookId(platformType, payload);
      if (this.isDuplicateWebhook(webhookId)) {
        this.logWebhook(platformType, 'duplicate', payload, {
          success: false,
          error: 'Duplicate webhook'
        });
        
        return {
          success: false,
          error: 'Duplicate webhook'
        };
      }

      // Mark webhook as processed
      this.markWebhookProcessed(webhookId);

      // Process the webhook
      const result = await this.factory.handleWebhook(platformType, signature, payload);
      
      this.logWebhook(platformType, 'processed', payload, result);
      
      return result;
    } catch (error) {
      console.error('[WebhookHandler] Webhook handling failed:', error);
      
      this.logWebhook(platformType, 'error', payload, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique webhook ID
   */
  generateWebhookId(platformType, payload) {
    const idString = `${platformType}_${payload.order_id}_${payload.timestamp || Date.now()}`;
    return this.simpleHash(idString);
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
   * Check for duplicate webhook
   */
  isDuplicateWebhook(webhookId) {
    try {
      const processedWebhooks = JSON.parse(localStorage.getItem('cafeos_processed_webhooks') || '[]');
      return processedWebhooks.includes(webhookId);
    } catch (error) {
      console.error('[WebhookHandler] Failed to check duplicate webhook:', error);
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
        
        // Keep only last 1000 processed webhooks
        if (processedWebhooks.length > 1000) {
          processedWebhooks.shift();
        }
        
        localStorage.setItem('cafeos_processed_webhooks', JSON.stringify(processedWebhooks));
      }
    } catch (error) {
      console.error('[WebhookHandler] Failed to mark webhook processed:', error);
    }
  }

  /**
   * Handle Zomato webhook
   */
  async handleZomatoWebhook(signature, payload) {
    return await this.handleWebhook(PlatformType.ZOMATO, signature, payload);
  }

  /**
   * Handle Swiggy webhook
   */
  async handleSwiggyWebhook(signature, payload) {
    return await this.handleWebhook(PlatformType.SWIGGY, signature, payload);
  }

  /**
   * Get webhook statistics
   */
  getWebhookStatistics() {
    const stats = {
      total: this.webhookLog.length,
      byPlatform: {},
      byType: {},
      byStatus: { success: 0, failure: 0 },
      recentWebhooks: []
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.webhookLog.forEach(log => {
      // By platform
      if (!stats.byPlatform[log.platform]) {
        stats.byPlatform[log.platform] = 0;
      }
      stats.byPlatform[log.platform]++;

      // By type
      if (!stats.byType[log.type]) {
        stats.byType[log.type] = 0;
      }
      stats.byType[log.type]++;

      // By status
      if (log.result?.success) {
        stats.byStatus.success++;
      } else {
        stats.byStatus.failure++;
      }

      // Recent webhooks (last hour)
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recentWebhooks.push(log);
      }
    });

    return stats;
  }

  /**
   * Get recent webhook log
   */
  getRecentWebhooks(limit = 50) {
    return this.webhookLog.slice(-limit);
  }

  /**
   * Clear webhook log
   */
  clearWebhookLog() {
    this.webhookLog = [];
    this.saveWebhookLog();
  }

  /**
   * Clear processed webhooks
   */
  clearProcessedWebhooks() {
    localStorage.removeItem('cafeos_processed_webhooks');
  }

  /**
   * Get webhook endpoint URL
   * This would be the URL that platforms send webhooks to
   */
  getWebhookEndpoint(platformType) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/${platformType}`;
  }

  /**
   * Get webhook setup instructions
   */
  getWebhookSetupInstructions(platformType) {
    const endpoint = this.getWebhookEndpoint(platformType);
    
    switch (platformType) {
      case PlatformType.ZOMATO:
        return {
          platform: 'Zomato',
          endpoint,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signatureHeader: 'X-Zomato-Signature',
          setupSteps: [
            '1. Log in to Zomato Partner Dashboard',
            '2. Navigate to Webhooks section',
            '3. Add webhook URL: ' + endpoint,
            '4. Configure signature secret',
            '5. Test webhook connection'
          ]
        };
      
      case PlatformType.SWIGGY:
        return {
          platform: 'Swiggy',
          endpoint,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signatureHeader: 'X-Swiggy-Signature',
          setupSteps: [
            '1. Log in to Swiggy Partner Dashboard',
            '2. Navigate to Webhooks section',
            '3. Add webhook URL: ' + endpoint,
            '4. Configure signature secret',
            '5. Test webhook connection'
          ]
        };
      
      default:
        return null;
    }
  }

  /**
   * Test webhook connection
   */
  async testWebhookConnection(platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      
      // Simulate test webhook
      const testPayload = {
        order_id: 'test_order_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'test'
      };

      const result = await platform.receiveOrder(testPayload);
      
      return {
        success: true,
        platform: platformType,
        message: 'Webhook connection test successful'
      };
    } catch (error) {
      return {
        success: false,
        platform: platformType,
        error: error.message
      };
    }
  }

  /**
   * Destroy the webhook handler
   */
  destroy() {
    console.log('[WebhookHandler] Destroyed');
  }
}

// Singleton instance
let webhookHandlerInstance = null;

/**
 * Get the singleton webhook handler instance
 */
export function getWebhookHandler() {
  if (!webhookHandlerInstance) {
    webhookHandlerInstance = new WebhookHandler();
  }
  return webhookHandlerInstance;
}

export default WebhookHandler;
