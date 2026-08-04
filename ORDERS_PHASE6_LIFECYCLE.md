# CafeOS Orders Phase 6 — Order Lifecycle, Recovery & Operational Resilience

## Overview

This document describes the Order Lifecycle Engine and operational resilience features implemented in CafeOS Phase 6. These systems provide enterprise-grade order management with crash recovery, offline support, locking, audit trails, and incident handling.

## Architecture

### Core Components

1. **Order Lifecycle Engine** (`orderModel.js`)
   - Extended lifecycle states (DRAFT, HELD, PENDING, CONFIRMED, PREPARING, READY, SERVING, COMPLETED, CANCELLED, REFUNDED, VOIDED, ARCHIVED)
   - Validated state transitions
   - State transition audit trail
   - Helper functions for common operations

2. **Order Lifecycle Manager** (`orderLifecycle.js`)
   - Hold & resume functionality
   - Draft order management
   - Search and filter capabilities
   - Auto-cleanup of old orders

3. **Order Recovery Manager** (`orderRecovery.js`)
   - Crash recovery
   - Offline operation queuing
   - Auto-save with configurable interval
   - Online/offline detection

4. **Order Lock Manager** (`orderLocking.js`)
   - Concurrent edit prevention
   - Lock timeout management
   - Takeover requests
   - Manager override functionality

5. **Order History Manager** (`orderHistory.js`)
   - Complete audit trail
   - Event timeline
   - Statistics and reporting
   - Export capabilities

6. **Order References Manager** (`orderReferences.js`)
   - Sequential numbering
   - Branch and terminal sequences
   - Immutable references
   - Display-friendly order numbers

7. **Order Incident Manager** (`orderIncidents.js`)
   - Operational incident tracking
   - Priority-based handling
   - Assignment and escalation
   - Resolution tracking

8. **Order Offline Queue Manager** (`orderOfflineQueue.js`)
   - Offline operation queuing
   - Automatic synchronization
   - Conflict resolution
   - Retry logic

## Lifecycle States

### State Definitions

```javascript
ORDER_LIFECYCLE_STATES = {
  DRAFT: 'DRAFT',           // Order being created, not yet submitted
  HELD: 'HELD',             // Order held for later
  PENDING: 'PENDING',       // Order submitted, awaiting confirmation
  CONFIRMED: 'CONFIRMED',   // Order confirmed, ready for preparation
  PREPARING: 'PREPARING',   // Order being prepared
  READY: 'READY',           // Order ready for service
  SERVING: 'SERVING',       // Order being served
  COMPLETED: 'COMPLETED',   // Order completed
  CANCELLED: 'CANCELLED',   // Order cancelled
  REFUNDED: 'REFUNDED',     // Order refunded
  VOIDED: 'VOIDED',         // Order voided
  ARCHIVED: 'ARCHIVED'      // Order archived
}
```

### Valid State Transitions

```javascript
LIFECYCLE_TRANSITIONS = {
  DRAFT: ['HELD', 'PENDING', 'CANCELLED'],
  HELD: ['DRAFT', 'PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVING', 'COMPLETED'],
  SERVING: ['COMPLETED'],
  COMPLETED: ['REFUNDED', 'ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  REFUNDED: ['ARCHIVED'],
  VOIDED: ['ARCHIVED'],
  ARCHIVED: [] // Terminal state
}
```

### State Transition Flow

```
DRAFT → HELD → PENDING → CONFIRMED → PREPARING → READY → SERVING → COMPLETED → REFUNDED → ARCHIVED
  ↓       ↓         ↓           ↓           ↓        ↓         ↓          ↓
  └───────┴─────────┴───────────┴───────────┴────────┴─────────┴──────────┴→ CANCELLED → ARCHIVED
                                                                              ↓
                                                                          VOIDED → ARCHIVED
```

## Order Recovery

### Crash Recovery

The Order Recovery Manager automatically saves the current order state every 5 seconds (configurable). On app restart:

1. Check for recovery data in localStorage
2. Verify data age (reject if older than 24 hours)
3. Present recovery option to user
4. Restore order state if user accepts

### Offline Recovery

When the app goes offline:

1. All operations are queued automatically
2. Queue persists in localStorage
3. On reconnection, operations sync automatically
4. Conflicts are detected and presented for resolution

### Recovery API

```javascript
// Initialize recovery on app startup
const status = initializeOrderRecovery();

// Set current order for recovery
recoveryManager.setCurrentOrder(order);

// Check for recoverable data
if (recoveryManager.hasRecoveryData()) {
  const recovery = recoveryManager.recoverOrder();
  // Present to user
}

// Discard recovery data
recoveryManager.discardRecovery();
```

## Order Locking

### Lock Mechanism

- Locks are stored in localStorage with 30-minute timeout
- Each lock includes: orderId, staffId, terminalId, lockedAt, reason
- Locks are automatically cleaned up when expired

### Lock Operations

```javascript
// Lock an order
const result = lockManager.lockOrder(orderId, 'Editing order');

// Check if order is locked
const status = lockManager.isOrderLocked(orderId);

// Unlock an order
const result = lockManager.unlockOrder(orderId);

// Request takeover
const result = lockManager.requestTakeover(orderId, 'Need to edit urgent order');

// Manager override
const result = lockManager.forceUnlock(orderId, managerId, 'Manager override');
```

### Lock States

1. **Unlocked** - No lock exists, anyone can edit
2. **Locked by self** - Current staff has lock, can edit
3. **Locked by other** - Another staff has lock, must request takeover or use manager override

## Order History

### Event Types

The history system tracks all order-related events:

- **Lifecycle events**: ORDER_CREATED, ORDER_MODIFIED, ORDER_HELD, ORDER_RESUMED, ORDER_CANCELLED, ORDER_REFUNDED, ORDER_VOIDED, ORDER_ARCHIVED
- **Item events**: ITEM_ADDED, ITEM_REMOVED, ITEM_MODIFIED, ITEM_QUANTITY_CHANGED
- **Pricing events**: DISCOUNT_APPLIED, DISCOUNT_REMOVED, PRICE_OVERRIDE
- **Kitchen events**: SENT_TO_KITCHEN, KITCHEN_ACCEPTED, KITCHEN_STARTED, KITCHEN_COMPLETED
- **Service events**: SERVED, TABLE_CLEARED
- **Payment events**: PAYMENT_ADDED, PAYMENT_MODIFIED, PAYMENT_REFUNDED
- **Customer events**: CUSTOMER_LINKED, CUSTOMER_UNLINKED, CUSTOMER_MODIFIED
- **Table events**: TABLE_ASSIGNED, TABLE_CHANGED, TABLE_RELEASED
- **Staff events**: STAFF_ASSIGNED, STAFF_CHANGED
- **Note events**: NOTE_ADDED, NOTE_MODIFIED, NOTE_REMOVED

### History API

```javascript
// Add event to history
historyManager.addEvent(orderId, 'ITEM_ADDED', { itemName: 'Cappuccino', qty: 2 }, staffId);

// Get order timeline
const timeline = historyManager.getOrderTimeline(orderId);

// Get events by type
const itemEvents = historyManager.getEventsByType(orderId, 'ITEM_ADDED');

// Get statistics
const stats = historyManager.getOrderStatistics(orderId);

// Export history
const export = historyManager.exportOrderHistory(orderId);
```

## Order References

### Reference Structure

Each order gets:

- **orderId**: Unique UUID
- **globalSequence**: Global sequential number
- **branchSequence**: Branch-specific sequential number
- **terminalSequence**: Terminal-specific sequential number
- **orderNumber**: Display-friendly number (e.g., "ORD-0001" or "ABC-0001")
- **auditId**: Audit trail identifier
- **branchId**: Branch reference
- **terminalId**: Terminal reference
- **shiftId**: Shift reference
- **staffId**: Staff reference

### Reference API

```javascript
// Set current context
referencesManager.setCurrentContext(branchId, terminalId, shiftId);

// Generate references for new order
const refs = referencesManager.generateOrderReferences({ staffId });

// Parse order number
const parsed = referencesManager.parseOrderNumber('ABC-0001');

// Get sequence status
const status = referencesManager.getSequenceStatus();
```

## Order Incidents

### Incident Types

- KITCHEN_REJECTION - Kitchen rejected order/item
- INVENTORY_UNAVAILABLE - Item out of stock
- TABLE_UNAVAILABLE - Table not available
- CUSTOMER_LEFT - Customer left before completion
- PAYMENT_FAILED - Payment processing failed
- EQUIPMENT_FAILURE - Equipment malfunction
- DELAYED_ORDER - Order delayed beyond SLA
- WRONG_ORDER - Wrong order delivered
- QUALITY_ISSUE - Quality complaint
- STAFF_SHORTAGE - Insufficient staff
- SYSTEM_ERROR - System malfunction
- OTHER - Other incidents

### Incident Priority

- CRITICAL - Immediate attention required
- HIGH - Urgent attention required
- MEDIUM - Normal attention required
- LOW - Can be addressed later

### Incident API

```javascript
// Create incident
const incident = incidentManager.createIncident({
  orderId,
  type: INCIDENT_TYPES.KITCHEN_REJECTION,
  priority: INCIDENT_PRIORITY.HIGH,
  title: 'Kitchen rejected order',
  description: 'Item out of stock',
  reportedBy: staffId
});

// Update status
incidentManager.updateIncidentStatus(incidentId, INCIDENT_STATUS.IN_PROGRESS, staffId);

// Assign to staff
incidentManager.assignIncident(incidentId, assigneeId, assignedBy);

// Resolve incident
incidentManager.resolveIncident(incidentId, 'Restocked item', resolvedBy);

// Escalate incident
incidentManager.escalateIncident(incidentId, managerId, escalatedBy, 'Requires manager attention');
```

## Offline Queue

### Operation Types

- CREATE_ORDER - Create new order
- UPDATE_ORDER - Update existing order
- DELETE_ORDER - Delete order
- ADD_ITEM - Add item to order
- REMOVE_ITEM - Remove item from order
- MODIFY_ITEM - Modify item in order
- ADD_PAYMENT - Add payment to order
- REFUND_PAYMENT - Refund payment
- UPDATE_STATUS - Update order status
- HOLD_ORDER - Hold order
- RESUME_ORDER - Resume held order
- CANCEL_ORDER - Cancel order
- VOID_ORDER - Void order

### Sync Status

- PENDING - Waiting to sync
- SYNCING - Currently syncing
- SYNCED - Successfully synced
- FAILED - Sync failed, will retry
- CONFLICT - Sync conflict detected

### Offline Queue API

```javascript
// Add operation to queue
queueManager.addOperation('UPDATE_ORDER', { orderId, changes }, orderId);

// Get queue status
const status = queueManager.getQueueStatus();

// Retry failed operations
queueManager.retryFailedOperations();

// Resolve conflict
queueManager.resolveConflict(conflictId, 'retry');

// Clear old synced operations
queueManager.clearSyncedOperations(24 * 60 * 60 * 1000); // 24 hours
```

## Integration Points

### Event System

All managers publish events for integration with other CafeOS systems:

```javascript
// Order lifecycle events
window.addEventListener('orderLifecycle', (e) => {
  console.log('Order lifecycle event:', e.detail);
});

// Order lock events
window.addEventListener('orderLock', (e) => {
  console.log('Order lock event:', e.detail);
});

// Order incident events
window.addEventListener('orderIncident', (e) => {
  console.log('Order incident event:', e.detail);
});

// Sync conflict events
window.addEventListener('syncConflict', (e) => {
  console.log('Sync conflict:', e.detail);
});
```

### Integration with Existing Systems

1. **useCart() Hook** - Integrate with existing cart management
2. **Kitchen Display System** - Use order history for KDS
3. **Payment System** - Track payment events in history
4. **Dashboard** - Use incident statistics for operational insights
5. **Audit Logs** - Export order history for compliance
6. **Workflow Engine** - Trigger workflows based on incidents

## Performance Considerations

### Large-Scale Operations

- Use pagination for history retrieval
- Implement virtual scrolling for large lists
- Cache frequently accessed data
- Lazy load incident details
- Debounce search operations

### Memory Management

- Clear old history (configurable, default 90 days)
- Archive completed incidents
- Clean up synced queue operations
- Remove expired locks automatically

### Storage Optimization

- Compress large history exports
- Use indexed storage for frequent lookups
- Implement data retention policies
- Batch localStorage writes

## Security Considerations

### Data Protection

- All sensitive operations are logged
- Manager overrides require audit trail
- Lock takeovers are tracked
- Incident resolution is recorded

### Access Control

- Lock enforcement prevents unauthorized edits
- Manager override requires explicit authorization
- Incident assignment respects staff permissions
- History export respects data access policies

## Testing

### Unit Tests

Test each manager independently:

```javascript
// Test lifecycle transitions
test('valid state transition', () => {
  const order = createOrder({ status: 'DRAFT' });
  const updated = transitionOrderState(order, 'PENDING');
  expect(updated.lifecycleState).toBe('PENDING');
});

// Test lock mechanism
test('order locking', () => {
  const result = lockManager.lockOrder(orderId);
  expect(result.success).toBe(true);
});

// Test recovery
test('crash recovery', () => {
  recoveryManager.setCurrentOrder(order);
  const recovered = recoveryManager.recoverOrder();
  expect(recovered.success).toBe(true);
});
```

### Integration Tests

Test manager interactions:

```javascript
// Test hold → resume flow
test('hold and resume order', () => {
  lifecycleManager.holdOrder(order);
  const resumed = lifecycleManager.resumeOrder(orderId);
  expect(resumed.lifecycleState).toBe('PENDING');
});

// Test offline → online sync
test('offline operation sync', () => {
  queueManager.addOperation('UPDATE_ORDER', data, orderId);
  // Simulate going online
  await queueManager.startSync();
  expect(queueManager.getQueueStatus().pending).toBe(0);
});
```

## Future Extensions

### Planned Enhancements

1. **Real-time sync** - WebSocket-based real-time synchronization
2. **Multi-branch support** - Cross-branch order tracking
3. **Advanced conflict resolution** - Automatic conflict detection and resolution
4. **Machine learning** - Predictive incident detection
5. **Mobile app** - Native mobile app with full offline support
6. **Analytics** - Advanced operational analytics dashboard
7. **API** - REST API for external integrations
8. **Webhooks** - Webhook notifications for external systems

### Extension Points

- Custom incident types
- Custom event types in history
- Custom operation types in queue
- Custom lock policies
- Custom reference formats
- Custom conflict resolution strategies

## Migration Guide

### From Legacy Order System

1. **Update order model** - Add lifecycleState field
2. **Migrate existing orders** - Set appropriate lifecycle state based on current status
3. **Update UI** - Integrate lifecycle manager
4. **Train staff** - New hold/resume workflow
5. **Configure thresholds** - Set operational warning thresholds
6. **Test recovery** - Verify crash recovery in staging

### Data Migration

```javascript
// Migrate existing orders
existingOrders.forEach(order => {
  const lifecycleState = mapLegacyStatus(order.status);
  order.lifecycleState = lifecycleState;
  saveOrder(order);
});

function mapLegacyStatus(legacyStatus) {
  const mapping = {
    'NEW': 'DRAFT',
    'ACCEPTED': 'CONFIRMED',
    'PREPARING': 'PREPARING',
    'READY': 'READY',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED'
  };
  return mapping[legacyStatus] || 'DRAFT';
}
```

## Troubleshooting

### Common Issues

**Issue**: Orders not recovering after crash
- **Solution**: Check localStorage quota, verify recovery data exists, check data age

**Issue**: Locks not releasing
- **Solution**: Check lock timeout, use manager override, clear expired locks manually

**Issue**: Offline operations not syncing
- **Solution**: Check network status, verify API endpoints, check conflict queue

**Issue**: History not recording events
- **Solution**: Verify event types are valid, check localStorage quota, verify staff ID

**Issue**: Incidents not escalating
- **Solution**: Check escalation rules, verify staff assignments, check notification system

## Support

For issues or questions:

1. Check this documentation
2. Review code comments in source files
3. Check browser console for errors
4. Verify localStorage contents
5. Test in isolation (single manager)

## Version History

- **v1.0.0** - Initial implementation of Order Lifecycle Engine
  - Lifecycle states and transitions
  - Hold & resume functionality
  - Order recovery system
  - Order locking mechanism
  - Order history timeline
  - Order references system
  - Order incident handling
  - Offline queue management
