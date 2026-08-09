// Zomato Delivery Platform Adapter
// API integration for Zomato orders, menu sync, and status updates

import { DeliveryPlatformAdapter, DeliveryOrderStatus, PlatformType, DeliveryOrderRecord } from './DeliveryPlatformAdapter.js';

export class ZomatoAdapter extends DeliveryPlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = PlatformType.ZOMATO;
    this.apiBaseUrl = config.apiBaseUrl || 'https://api.zomato.com/v2.1';
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Validate Zomato-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.restaurantId) {
      errors.push('Zomato Restaurant ID is required');
    }
    
    if (!this.config.partnerId) {
      errors.push('Zomato Partner ID is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse Zomato order format to standard format
   */
  parseOrder(zomatoOrder) {
    return {
      platformOrderId: zomatoOrder.order_id,
      customerInfo: {
        name: zomatoOrder.customer_name,
        phone: zomatoOrder.customer_phone,
        email: zomatoOrder.customer_email
      },
      items: zomatoOrder.items.map(item => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant || null,
        addons: item.addons || []
      })),
      totalAmount: zomatoOrder.total_amount,
      deliveryAddress: {
        address: zomatoOrder.delivery_address,
        landmark: zomatoOrder.landmark || '',
        pincode: zomatoOrder.pincode,
        city: zomatoOrder.city,
        coordinates: zomatoOrder.coordinates || null
      },
      specialInstructions: zomatoOrder.special_instructions || '',
      orderType: zomatoOrder.order_type || 'DELIVERY',
      estimatedDeliveryTime: zomatoOrder.estimated_delivery_time,
      paymentMethod: zomatoOrder.payment_method,
      paymentStatus: zomatoOrder.payment_status,
      metadata: {
        zomatoOrder: zomatoOrder
      }
    };
  }

  /**
   * Send status to Zomato platform
   */
  async sendStatusToPlatform(platformOrderId, status, metadata = {}) {
    try {
      const zomatoStatus = this.mapToZomatoStatus(status);
      
      const payload = {
        order_id: platformOrderId,
        status: zomatoStatus,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // In production, this would call Zomato API
      // const response = await fetch(`${this.apiBaseUrl}/orders/${platformOrderId}/status`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.config.apiKey}`
      //   },
      //   body: JSON.stringify(payload)
      // });
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        console.log(`[ZomatoAdapter] Status update (test):`, payload);
        return { success: true, status: zomatoStatus };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[ZomatoAdapter] Failed to send status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map internal status to Zomato status
   */
  mapToZomatoStatus(status) {
    const statusMap = {
      [DeliveryOrderStatus.RECEIVED]: 'received',
      [DeliveryOrderStatus.ACCEPTED]: 'confirmed',
      [DeliveryOrderStatus.PREPARING]: 'preparing',
      [DeliveryOrderStatus.READY]: 'ready_for_pickup',
      [DeliveryOrderStatus.PICKED_UP]: 'picked_up',
      [DeliveryOrderStatus.DELIVERED]: 'delivered',
      [DeliveryOrderStatus.CANCELLED]: 'cancelled',
      [DeliveryOrderStatus.REJECTED]: 'rejected'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Map Zomato status to internal status
   */
  mapFromZomatoStatus(zomatoStatus) {
    const statusMap = {
      'received': DeliveryOrderStatus.RECEIVED,
      'confirmed': DeliveryOrderStatus.ACCEPTED,
      'preparing': DeliveryOrderStatus.PREPARING,
      'ready_for_pickup': DeliveryOrderStatus.READY,
      'picked_up': DeliveryOrderStatus.PICKED_UP,
      'delivered': DeliveryOrderStatus.DELIVERED,
      'cancelled': DeliveryOrderStatus.CANCELLED,
      'rejected': DeliveryOrderStatus.REJECTED
    };
    
    return statusMap[zomatoStatus] || DeliveryOrderStatus.RECEIVED;
  }

  /**
   * Transform menu to Zomato format
   */
  transformMenu(menuData) {
    return {
      restaurant_id: this.config.restaurantId,
      categories: menuData.categories.map(category => ({
        category_id: category.id,
        category_name: category.name,
        items: category.items.map(item => ({
          item_id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          is_veg: item.isVeg || false,
          is_available: item.available !== false,
          variants: item.variants || [],
          addons: item.addons || [],
          images: item.images || []
        }))
      }))
    };
  }

  /**
   * Send menu to Zomato platform
   */
  async sendMenuToPlatform(platformMenu) {
    try {
      // In production, this would call Zomato API
      // const response = await fetch(`${this.apiBaseUrl}/menu/sync`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.config.apiKey}`
      //   },
      //   body: JSON.stringify(platformMenu)
      // });
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        console.log(`[ZomatoAdapter] Menu sync (test):`, platformMenu);
        return { success: true, menuId: `menu_${Date.now()}` };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[ZomatoAdapter] Failed to sync menu:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch order status from Zomato
   */
  async fetchOrderStatusFromPlatform(platformOrderId) {
    try {
      // In production, this would call Zomato API
      // const response = await fetch(`${this.apiBaseUrl}/orders/${platformOrderId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`
      //   }
      // });
      // const data = await response.json();
      // return {
      //   success: true,
      //   status: this.mapFromZomatoStatus(data.status),
      //   data
      // };

      if (this.config.testMode) {
        return {
          success: true,
          status: DeliveryOrderStatus.ACCEPTED,
          data: { order_id: platformOrderId, status: 'confirmed' }
        };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[ZomatoAdapter] Failed to fetch status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify Zomato webhook signature
   */
  async verifyWebhook(signature, payload) {
    try {
      if (!this.webhookSecret) {
        // If no secret configured, accept all (not recommended for production)
        return { valid: true, warning: 'No webhook secret configured' };
      }

      // Zomato uses HMAC SHA256 for webhook signature verification
      const expectedSignature = await this.generateHMACSHA256(payload, this.webhookSecret);
      const isValid = expectedSignature === signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[ZomatoAdapter] Webhook verification failed:', error);
      return { valid: false, error: error.message };
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
   * Get Zomato-specific order requirements
   */
  getOrderRequirements() {
    return {
      ...super.getOrderRequirements(),
      requiresPackaging: true,
      requiresDeliveryPartner: true,
      supportsSpecialInstructions: true,
      supportsContactlessDelivery: true,
      supportsOrderCancellation: true,
      supportsOrderModification: false,
      maxItemsPerOrder: 50,
      maxAddonsPerItem: 10
    };
  }

  /**
   * Get Zomato commission rate
   */
  calculateCommission(totalAmount) {
    // Zomato commission varies by restaurant (typically 15-25%)
    return this.config.commissionRate 
      ? totalAmount * this.config.commissionRate
      : totalAmount * 0.20; // Default 20%
  }

  /**
   * Accept order on Zomato
   */
  async acceptOrder(platformOrderId, estimatedTime) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.ACCEPTED, {
      estimated_preparation_time: estimatedTime
    });
  }

  /**
   * Reject order on Zomato
   */
  async rejectOrder(platformOrderId, reason) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.REJECTED, {
      rejection_reason: reason
    });
  }

  /**
   * Cancel order on Zomato
   */
  async cancelOrder(platformOrderId, reason) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.CANCELLED, {
      cancellation_reason: reason
    });
  }

  /**
   * Mark order as ready for pickup
   */
  async markReadyForPickup(platformOrderId) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.READY);
  }

  /**
   * Get Zomato platform info
   */
  getPlatformInfo() {
    return {
      name: 'Zomato',
      platformType: PlatformType.ZOMATO,
      website: 'https://www.zomato.com',
      commissionRate: this.config.commissionRate || 0.20,
      supportedOrderTypes: ['DELIVERY', 'TAKEAWAY'],
      features: [
        'Real-time order sync',
        'Menu synchronization',
        'Status updates',
        'Commission tracking',
        'Delivery partner tracking'
      ]
    };
  }
}

export default ZomatoAdapter;
