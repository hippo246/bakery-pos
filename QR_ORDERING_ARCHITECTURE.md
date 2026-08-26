# QR Ordering Architecture & Limitations

## Overview
The QR ordering system uses a **client-side architecture** with localStorage and BroadcastChannel for data persistence and real-time updates. This architecture works well for single-domain deployments but has specific limitations for multi-device scenarios.

## Current Architecture

### Data Storage
- **localStorage**: All order data, settings, and menu items are stored in the browser's localStorage
- **Keys used**:
  - `qr_settings` - POS configuration
  - `qr_orders` - Pending and completed orders
  - `qr_order_statuses` - Order status tracking
  - `qr_placed_order_ids` - Customer's placed order history
  - `qr_cart` - Shopping cart
  - `qr_table_sessions` - Table session tokens
  - `waiter_calls` - Assistance requests
  - `bakery_menu` / `brewcrm_local_menuItems` - Menu data

### Real-Time Updates
- **BroadcastChannel API**: Used for real-time status updates across browser tabs
- **Fallback**: Polling every 3 seconds if BroadcastChannel is not supported
- **Channel name**: `qr_order_status`

### Session Management
- **Session timeout**: Configurable (default 30 minutes)
- **Activity tracking**: Click, scroll, keypress, touch events
- **Warning modal**: 2 minutes before timeout
- **Session tokens**: 24-hour expiry for table sessions

## Deployment Compatibility

### ✅ Works On
- **Vercel deployment** (same domain)
- **Local development** (same domain)
- **Single browser instance** (POS + QR ordering in same browser)
- **Multiple tabs** (via BroadcastChannel)

### ⚠️ Limitations

#### 1. Same-Domain Requirement
**Issue**: localStorage is domain-specific and does not share data across different domains or subdomains.

**Impact**:
- POS at `pos.example.com` cannot read orders from QR ordering at `order.example.com`
- Must deploy both POS and QR ordering on the same domain (e.g., `example.com/pos` and `example.com/qr-ordering.html`)

**Solution**: Use a single domain with path-based routing.

#### 2. Multi-Device Scenarios
**Issue**: localStorage is device-specific. Data does not sync across different devices.

**Impact**:
- Customer orders from their phone are NOT visible on POS tablet unless:
  - Both devices use the same browser instance (impossible)
  - Data is synced via a backend service

**Current Workaround**: The system assumes POS and QR ordering are accessed from the same device/browser. For actual production use with multiple devices, a backend service is required.

#### 3. Private Browsing / Incognito Mode
**Issue**: localStorage may be disabled or cleared when browser closes in private mode.

**Mitigation**: 
- Safe storage wrapper with error handling
- Graceful degradation with user alerts
- Session data persists only during the session

#### 4. Storage Quota Limits
**Issue**: localStorage has a quota limit (typically 5-10MB per domain).

**Mitigation**:
- Safe storage wrapper detects quota exceeded errors
- User alert when storage is full
- Automatic cleanup of stale orders (1-hour timeout)

#### 5. No Backend Persistence
**Issue**: All data is lost if browser cache is cleared.

**Impact**:
- No permanent order history
- Settings must be reconfigured
- Menu must be reloaded

## Production Deployment Recommendations

### For Single-Device / Kiosk Mode
**Current architecture is suitable** when:
- POS and QR ordering run on the same device
- Used as a self-service kiosk
- No need for multi-device synchronization

**Deployment**: Deploy to Vercel with single domain (e.g., `your-app.vercel.app`)

### For Multi-Device / Production Use
**Backend service is required** for:
- Order synchronization across devices
- Permanent order history
- Real-time kitchen display system
- Multi-location support

**Recommended Architecture**:
```
Customer Phone → Backend API → POS Tablet
                    ↓
                Database (PostgreSQL/Supabase)
                    ↓
                Kitchen Display
```

**Required Components**:
1. **Backend API** (Node.js/Express or similar)
   - REST endpoints for orders, menu, settings
   - WebSocket/SSE for real-time updates
   - Authentication for staff access

2. **Database** (PostgreSQL via Supabase)
   - Orders table
   - Menu items table
   - Settings table
   - Tables/sessions table

3. **Real-time Service**
   - WebSocket server for live order updates
   - Push notifications for status changes

## Migration Path to Backend

### Phase 1: Add Backend API
- Create API endpoints for:
  - `POST /api/orders` - Create order
  - `GET /api/orders` - List orders
  - `PATCH /api/orders/:id/status` - Update status
  - `GET /api/menu` - Get menu
  - `GET /api/settings` - Get settings

### Phase 2: Replace localStorage with API Calls
- Modify QR ordering to use API instead of localStorage
- Keep localStorage as fallback for offline mode
- Implement sync queue for offline orders

### Phase 3: Add Real-time Updates
- Replace BroadcastChannel with WebSocket
- Implement reconnection logic
- Add push notifications

### Phase 4: Add Authentication
- Staff login for POS
- Session management
- Role-based access control

## Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Session Timeout | ✅ Works | Configurable, device-specific |
| Business Hours Check | ✅ Works | Time-based validation |
| GST Rounding | ✅ Works | Multiple rounding modes |
| Sequential Invoices | ✅ Works | Device-specific numbering |
| Thermal Printer | ✅ Works | Requires network printer |
| Real-time Updates | ✅ Works | Same-device only |
| Multi-Device Sync | ❌ Limited | Requires backend |
| Offline Support | ⚠️ Partial | localStorage only |

## Security Considerations

### Current Implementation
- **Session tokens**: Basic validation, 24-hour expiry
- **Order integrity**: Hash-based tampering detection
- **No authentication**: Open access to QR ordering

### Recommendations for Production
- Add staff authentication for POS
- Implement rate limiting for order placement
- Add CSRF protection
- Encrypt sensitive data in localStorage
- Implement proper session management

## Testing Checklist

### Pre-Deployment
- [ ] Test on Vercel staging environment
- [ ] Verify localStorage works in production
- [ ] Test BroadcastChannel across tabs
- [ ] Test session timeout functionality
- [ ] Test business hours validation
- [ ] Test thermal printer integration
- [ ] Test in private browsing mode
- [ ] Test with storage quota limits

### Post-Deployment
- [ ] Monitor localStorage usage
- [ ] Check for quota exceeded errors
- [ ] Verify order flow end-to-end
- [ ] Test with multiple customers
- [ ] Validate GST calculations

## Conclusion

The current QR ordering architecture is **suitable for single-device/kiosk deployments** on Vercel. For multi-device production use, a backend service with database persistence is required. The codebase includes safe storage wrappers and error handling to gracefully handle localStorage limitations.

All features implemented (session timeout, business hours, GST rounding, sequential invoices, thermal printing, real-time updates) will work correctly on Vercel deployment as long as both POS and QR ordering are on the same domain.
