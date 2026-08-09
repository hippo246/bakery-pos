// Swiggy Delivery Platform Adapter
// API integration for Swiggy orders, menu sync, and status updates

import { DeliveryPlatformAdapter, DeliveryOrderStatus, PlatformType, DeliveryOrderRecord } from './DeliveryPlatformAdapter.js';

export class SwiggyAdapter extends DeliveryPlatformAdapter {
  constructor(config = {}) {
    super(config);
    this.platformName = PlatformType.SWIGGY;
    this.apiBaseUrl = config.apiBaseUrl || 'https://partner.swiggy.com/v1';
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Validate Swiggy-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.restaurantId) {
      errors.push('Swiggy Restaurant ID is required');
    }
    
    if (!this.config.partnerId) {
      errors.push('Swiggy Partner ID is required');
    }
    
    if (!this.config.storeId) {
      errors.push('Swiggy Store ID is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse Swiggy order format to standard format
   */
  parseOrder(swiggyOrder) {
    return {
      platformOrderId: swiggyOrder.order_id,
      customerInfo: {
        name: swiggyOrder.customer_name,
        phone: swiggyOrder.customer_phone,
        email: swiggyOrder.customer_email
      },
      items: swiggyOrder.items.map(item => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant || null,
        addons: item.addons || [],
        isVeg: item.is_veg || false
      })),
      totalAmount: swiggyOrder.total_amount,
      deliveryAddress: {
        address: swiggyOrder.delivery_address,
        landmark: swiggyOrder.landmark || '',
        pincode: swiggyOrder.pincode,
        city: swiggyOrder.city,
        coordinates: swiggyOrder.coordinates || null,
        addressType: swiggyOrder.address_type || 'home'
      },
      specialInstructions: swiggyOrder.special_instructions || '',
      orderType: swiggyOrder.order_type || 'DELIVERY',
      estimatedDeliveryTime: swiggyOrder.estimated_delivery_time,
      paymentMethod: swiggyOrder.payment_method,
      paymentStatus: swiggyOrder.payment_status,
      metadata: {
        swiggyOrder: swiggyOrder
      }
    };
  }

  /**
   * Send status to Swiggy platform
   */
  async sendStatusToPlatform(platformOrderId, status, metadata = {}) {
    try {
      const swiggyStatus = this.mapToSwiggyStatus(status);
      
      const payload = {
        order_id: platformOrderId,
        status: swiggyStatus,
        timestamp: new Date().toISOString(),
        store_id: this.config.storeId,
        ...metadata
      };

      // In production, this would call Swiggy API
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
        console.log(`[SwiggyAdapter] Status update (test):`, payload);
        return { success: true, status: swiggyStatus };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[SwiggyAdapter] Failed to send status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map internal status to Swiggy status
   */
  mapToSwiggyStatus(status) {
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
   * Map Swiggy status to internal status
   */
  mapFromSwiggyStatus(swiggyStatus) {
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
    
    return statusMap[swiggyStatus] || DeliveryOrderStatus.RECEIVED;
  }

  /**
   * Transform menu to Swiggy format
   */
  transformMenu(menuData) {
    return {
      store_id: this.config.storeId,
      restaurant_id: this.config.restaurantId,
      categories: menuData.categories.map(category => ({
        category_id: category.id,
        category_name: category.name,
        sequence: category.sequence || 0,
        items: category.items.map(item => ({
          item_id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          is_veg: item.isVeg || false,
          is_available: item.available !== false,
          sequence: item.sequence || 0,
          variants: item.variants || [],
          addons: item.addons || [],
          images: item.images || [],
          preparation_time: item.preparationTime || 0
        }))
      }))
    };
  }

  /**
   * Send menu to Swiggy platform
   */
  async sendMenuToPlatform(platformMenu) {
    try {
      // In production, this would call Swiggy API
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
        console.log(`[SwiggyAdapter] Menu sync (test):`, platformMenu);
        return { success: true, menuId: `menu_${Date.now()}` };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[SwiggyAdapter] Failed to sync menu:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch order status from Swiggy
   */
  async fetchOrderStatusFromPlatform(platformOrderId) {
    try {
      // In production, this would call Swiggy API
      // const response = await fetch(`${this.apiBaseUrl}/orders/${platformOrderId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`
      //   }
      // });
      // const data = await response.json();
      // return {
      //   success: true,
      //   status: this.mapFromSwiggyStatus(data.status),
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
      console.error('[SwiggyAdapter] Failed to fetch status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify Swiggy webhook signature
   */
  async verifyWebhook(signature, payload) {
    try {
      if (!this.webhookSecret) {
        // If no secret configured, accept all (not recommended for production)
        return { valid: true, warning: 'No webhook secret configured' };
      }

      // Swiggy uses HMAC SHA256 for webhook signature verification
      const expectedSignature = await this.generateHMACSHA256(payload, this.webhookSecret);
      const isValid = expectedSignature === signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[SwiggyAdapter] Webhook verification failed:', error);
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
   * Get Swiggy-specific order requirements
   */
  getOrderRequirements() {
    return {
      ...super.getOrderRequirements(),
      requiresPackaging: true,
      requiresDeliveryPartner: true,
      supportsSpecialInstructions: true,
      supportsContactlessDelivery: true,
      supportsOrderCancellation: true,
      supportsOrderModification: true,
      maxItemsPerOrder: 100,
      maxAddonsPerItem: 15
    };
  }

  /**
   * Get Swiggy commission rate
   */
  calculateCommission(totalAmount) {
    // Swiggy commission varies by restaurant (typically 15-25%)
    return this.config.commissionRate 
      ? totalAmount * this.config.commissionRate
      : totalAmount * 0.22; // Default 22%
  }

  /**
   * Accept order on Swiggy
   */
  async acceptOrder(platformOrderId, estimatedTime) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.ACCEPTED, {
      estimated_preparation_time: estimatedTime
    });
  }

  /**
   * Reject order on Swiggy
   */
  async rejectOrder(platformOrderId, reason) {
    return await this.sendStatusToPlatform(platformOrderId, DeliveryOrderStatus.REJECTED, {
      rejection_reason: reason
    });
  }

  /**
   * Cancel order on Swiggy
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
   * Update item availability
   */
  async updateItemAvailability(itemId, isAvailable) {
    try {
      const payload = {
        item_id: itemId,
        is_available: isAvailable,
        store_id: this.config.storeId
      };

      // In production, this would call Swiggy API
      if (this.config.testMode) {
        console.log(`[SwiggyAdapter] Item availability update (test):`, payload);
        return { success: true };
      }

      throw new Error('Production mode requires backend implementation');
    } catch (error) {
      console.error('[SwiggyAdapter] Failed to update item availability:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Swiggy platform info
   */
  getPlatformInfo() {
    return {
      name: 'Swiggy',
      platformType: PlatformType.SWIGGY,
      website: 'https://www.swiggy.com',
      commissionRate: this.config.commissionRate || 0.22,
      supportedOrderTypes: ['DELIVERY', 'TAKEAWAY'],
      features: [
        'Real-time order sync',
        'Menu synchronization',
        'Status updates',
        'Commission tracking',
        'Delivery partner tracking',
        'Item availability sync',
        'Order modification support'
      ]
    };
  }
}

export default SwiggyAdapter;
