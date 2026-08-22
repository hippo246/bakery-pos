# Aggregator Integration Architecture

Complete architecture for integrating Zomato and Swiggy food delivery platforms with the Bakery POS system.

## Overview

The aggregator integration provides:
- **Real-time order reception** via webhooks and polling
- **Order management** (accept, reject, status updates)
- **Menu synchronization** between POS and platforms
- **Commission tracking** and analytics
- **Dual-mode operation** (webhook + polling fallback)

## Architecture Components

### 1. API Clients (`src/services/aggregators/`)

#### ZomatoClient.js
- Handles all Zomato Partner API interactions
- Methods: `getActiveOrders()`, `acceptOrder()`, `rejectOrder()`, `updateOrderStatus()`, `syncMenu()`
- Includes retry logic and timeout handling
- Supports production and sandbox environments

#### SwiggyClient.js
- Handles all Swiggy Partner API interactions
- Same interface as ZomatoClient for consistency
- Platform-specific status mapping

### 2. Order Management (`AggregatorOrderManager.js`)

Central order lifecycle manager:
- Stores orders in memory and localStorage
- Event-driven architecture with listeners
- Order statistics and filtering
- Automatic cleanup of old orders

**Key Methods:**
```javascript
addOrder(order)           // Add new order
updateOrderStatus(id, status)  // Update status
getPendingOrders()       // Get pending orders
getOrdersByPlatform(platform)  // Filter by platform
getStatistics()          // Get order stats
```

### 3. Webhook Handler (`AggregatorWebhookHandler.js`)

Processes incoming webhooks:
- Signature verification
- Event routing to handlers
- Order transformation to internal format
- Platform-specific event mapping

**Supported Events:**
- Zomato: `order_created`, `order_accepted`, `order_rejected`, `order_cancelled`, `order_status_updated`
- Swiggy: `order_placed`, `order_accepted`, `order_rejected`, `order_cancelled`, `order_status_updated`

### 4. Polling Service (`AggregatorPollingService.js`)

Fallback for real-time updates:
- Polls both platforms at configurable intervals (default: 30s)
- Detects new orders and status changes
- Exponential backoff on errors
- Can be enabled/disabled independently

### 5. Unified Service (`AggregatorService.js`)

Orchestrates all components:
```javascript
// Initialize with credentials
await aggregatorService.initialize({
  zomato: { enabled: true, apiKey: 'xxx', restaurantId: 'yyy' },
  swiggy: { enabled: true, apiKey: 'xxx', restaurantId: 'yyy' },
  polling: { enabled: true, interval: 30000 }
});

// Get pending orders
const pendingOrders = aggregatorService.getPendingOrders();

// Accept order
await aggregatorService.acceptOrder(orderId, 30); // 30 min prep time

// Update status
await aggregatorService.updateOrderStatus(orderId, 'ready');

// Sync menu
await aggregatorService.syncMenu('Zomato', menuItems);
```

## Setup Instructions

### Step 1: Get API Credentials

**Zomato:**
1. Register at [Zomato Partner Portal](https://www.zomato.com/partners)
2. Get API Key and Restaurant ID
3. Configure webhook URL: `https://yourdomain.com/api/webhooks/zomato/:event`

**Swiggy:**
1. Register at [Swiggy Partner Portal](https://partners.swiggy.com)
2. Get API Key and Restaurant ID
3. Configure webhook URL: `https://yourdomain.com/api/webhooks/swiggy/:event`

### Step 2: Configure Backend (Required for Webhooks)

For webhooks, you need a Node.js/Express backend:

```javascript
// server.js
import express from 'express';
import { handleAggregatorWebhook } from './api/webhooks/aggregatorWebhook.js';

const app = express();
app.use(express.json());

// Zomato webhooks
app.post('/api/webhooks/zomato/:event', handleAggregatorWebhook);

// Swiggy webhooks
app.post('/api/webhooks/swiggy/:event', handleAggregatorWebhook);

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Step 3: Configure POS Settings

Add to your settings object:
```javascript
const settings = {
  // Aggregator credentials
  zomatoApiKey: 'your_zomato_api_key',
  zomatoRestaurantId: 'your_restaurant_id',
  swiggyApiKey: 'your_swiggy_api_key',
  swiggyRestaurantId: 'your_restaurant_id',
  aggregatorEnvironment: 'production', // or 'sandbox' for testing
  
  // Other POS settings...
};
```

### Step 4: Menu Mapping

Map your POS menu items to aggregator menu items:

```javascript
const menuMapping = {
  'pos_item_id_1': {
    zomatoId: 'zomato_item_id_1',
    swiggyId: 'swiggy_item_id_1'
  }
};
```

## Order Flow

### 1. Order Reception

**Via Webhook (Preferred):**
```
Customer places order on Zomato/Swiggy
→ Webhook sent to your server
→ AggregatorWebhookHandler processes event
→ Order added to AggregatorOrderManager
→ POS component receives real-time update
→ Dropdown shows pending order
```

**Via Polling (Fallback):**
```
Customer places order on Zomato/Swiggy
→ AggregatorPollingService polls API every 30s
→ Detects new order
→ Order added to AggregatorOrderManager
→ POS component receives update
```

### 2. Order Acceptance

```
Staff clicks "Accept" in POS dropdown
→ handleAcceptAggregatorOrder() called
→ AggregatorService.acceptOrder() calls platform API
→ Platform API confirms acceptance
→ Order status updated to "preparing"
→ Items added to POS cart
→ KOT sent to kitchen
```

### 3. Order Preparation

```
Kitchen prepares order
→ Staff updates status in POS
→ AggregatorService.updateOrderStatus() called
→ Platform API notified
→ Customer sees status update in app
```

## API Endpoints

### Zomato Partner API

```
GET  /restaurants/{id}/orders
GET  /restaurants/{id}/orders/{order_id}
POST /restaurants/{id}/orders/{order_id}/accept
POST /restaurants/{id}/orders/{order_id}/reject
PUT  /restaurants/{id}/orders/{order_id}/status
GET  /restaurants/{id}/menu
PUT  /restaurants/{id}/menu/{item_id}
POST /restaurants/{id}/menu/bulk
```

### Swiggy Partner API

```
GET  /restaurants/{id}/orders
GET  /restaurants/{id}/orders/{order_id}
POST /restaurants/{id}/orders/{order_id}/accept
POST /restaurants/{id}/orders/{order_id}/reject
PUT  /restaurants/{id}/orders/{order_id}/status
GET  /restaurants/{id}/menu
PUT  /restaurants/{id}/menu/{item_id}
POST /restaurants/{id}/menu/bulk
```

## Commission Structure

Typical commission rates:
- **Zomato:** 10-25% of order value
- **Swiggy:** 15-30% of order value

Commission is automatically calculated and tracked:
```javascript
{
  total: 850,
  commission: 85,  // 10%
  netRevenue: 765
}
```

## Error Handling

All API calls include:
- Automatic retry (3 attempts with exponential backoff)
- Timeout handling (30 seconds)
- Graceful degradation to polling if webhooks fail
- User-friendly error messages in POS

## Testing

### Without Real APIs

The system automatically falls back to mock data if:
- API credentials are not configured
- API validation fails
- Network errors occur

### With Sandbox APIs

Both platforms offer sandbox environments:
```javascript
const config = {
  zomato: { environment: 'sandbox' },
  swiggy: { environment: 'sandbox' }
};
```

## Security

- API keys stored in settings (not hardcoded)
- Webhook signature verification
- HTTPS required for production webhooks
- Rate limiting on API calls
- No sensitive data in localStorage

## Monitoring

Track aggregator performance:
```javascript
const stats = aggregatorService.getStatistics();
console.log({
  totalOrders: stats.total,
  pendingOrders: stats.pending,
  zomatoOrders: stats.zomato,
  swiggyOrders: stats.swiggy,
  totalRevenue: stats.totalRevenue,
  totalCommission: stats.totalCommission
});
```

## Troubleshooting

**Orders not appearing:**
1. Check API credentials are correct
2. Verify webhook URL is accessible
3. Check polling service is running
4. Review browser console for errors

**Status updates not syncing:**
1. Check API rate limits
2. Verify network connectivity
3. Check platform API status

**Menu sync issues:**
1. Verify menu item IDs match
2. Check item availability flags
3. Review API response for errors

## File Structure

```
src/
├── services/aggregators/
│   ├── ZomatoClient.js
│   ├── SwiggyClient.js
│   ├── AggregatorWebhookHandler.js
│   ├── AggregatorOrderManager.js
│   ├── AggregatorPollingService.js
│   └── AggregatorService.js
├── api/webhooks/
│   └── aggregatorWebhook.js
└── components/
    └── SimplePOS.jsx (updated with aggregator integration)
```

## Next Steps

1. **Deploy webhook server** (Node.js/Express)
2. **Configure platform webhooks** with your server URL
3. **Add API credentials** to POS settings
4. **Test with sandbox APIs** first
5. **Map menu items** between POS and platforms
6. **Monitor order flow** in production

## Support

For platform-specific issues:
- Zomato Partner Support: partners@zomato.com
- Swiggy Partner Support: restaurant-partners@swiggy.com
