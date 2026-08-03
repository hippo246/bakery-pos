# Event Validation Test Plan

This document outlines the testing procedures for validating real-time event-driven integration between CafeOS modules and the Dashboard.

## Testing Prerequisites

1. Start the development server: `npm run dev`
2. Open Dashboard in browser
3. Open browser DevTools Console to monitor event bus activity
4. Have multiple browser tabs open for different modules (Orders, Kitchen, Tables, etc.)

## Test Procedures

### 1. Order Event Validation

**Test Case 1.1: Order Creation**
- Navigate to Orders module
- Create a new order with items
- **Expected Event**: `order.created` published with orderId, tableId, items, total, staffId
- **Dashboard Verification**: LiveOrderWidget should increment "new" count immediately

**Test Case 1.2: Order Status Updates**
- Change order status from NEW → ACCEPTED → PREPARING → READY
- **Expected Events**: `order.updated` published for each status change
- **Dashboard Verification**: LiveOrderWidget status breakdown should update in real-time

**Test Case 1.3: Order Completion**
- Mark order as COMPLETED
- **Expected Event**: `order.completed` published with orderId, tableId, staffId
- **Dashboard Verification**: LiveOrderWidget "completed" count increments

**Test Case 1.4: Order Cancellation**
- Cancel an active order
- **Expected Event**: `order.cancelled` published with orderId, reason, staffId
- **Dashboard Verification**: LiveOrderWidget "cancelled" count increments

**Test Case 1.5: Payment Collection**
- Complete a COD order and click "Collect Cash"
- **Expected Event**: `payment.collected` published with orderId, paymentMethod, amount, staffId
- **Dashboard Verification**: LivePaymentsWidget should reflect the payment

### 2. Kitchen Event Validation

**Test Case 2.1: Kitchen Ticket Started**
- Navigate to Kitchen module
- Start preparing a ticket
- **Expected Event**: `kitchen.started` published with cardId, orderId, station, items
- **Dashboard Verification**: LiveKitchenWidget "waiting" decreases, "cooking" increases

**Test Case 2.2: Kitchen Ticket Ready**
- Mark ticket as ready
- **Expected Event**: `kitchen.ready` published with orderId, cardId, station
- **Dashboard Verification**: LiveKitchenWidget "ready" count increments

**Test Case 2.3: Kitchen Ticket Completed**
- Complete a kitchen ticket
- **Expected Event**: `kitchen.completed` published with cardId, orderId, station, duration
- **Dashboard Verification**: LiveKitchenWidget "collected" count increments

**Test Case 2.4: Kitchen Ticket Hold**
- Put a ticket on hold
- **Expected Event**: `kitchen.held` published with cardId, orderId, station, reason
- **Dashboard Verification**: Ticket status reflects hold state

**Test Case 2.5: Kitchen Ticket Release**
- Release a held ticket
- **Expected Event**: `kitchen.released` published with cardId, orderId, station
- **Dashboard Verification**: Ticket returns to active state

### 3. Table Event Validation

**Test Case 3.1: Table Reservation**
- Navigate to Tables module
- Reserve a table for a future time
- **Expected Event**: `table.reserved` published with tableId, customerName, date, time, partySize
- **Dashboard Verification**: LiveTablesWidget "reserved" count increments

**Test Case 3.2: Table Occupation**
- Occupy a table with an order
- **Expected Event**: `table.occupied` published with tableId, orderId, staffId
- **Dashboard Verification**: LiveTablesWidget "occupied" count increments, occupancy rate updates

**Test Case 3.3: Table Cleaning**
- Mark a table as cleaning after guest leaves
- **Expected Event**: `table.cleaning` published with tableId, previousStatus, previousOrderId
- **Dashboard Verification**: LiveTablesWidget "cleaning" count increments

**Test Case 3.4: Table Available**
- Mark a table as available
- **Expected Event**: `table.available` published with tableId, previousStatus
- **Dashboard Verification**: LiveTablesWidget "available" count increments

### 4. Inventory Event Validation

**Test Case 4.1: Inventory Restock**
- Navigate to Inventory module
- Restock an item
- **Expected Event**: `inventory.restocked` published with itemId, itemName, previousQty, newQty, reason, staffId
- **Dashboard Verification**: LiveInventoryWidget should clear critical/low stock alert for that item

**Test Case 4.2: Inventory Wastage**
- Record wastage for an item
- **Expected Event**: `inventory.wastage` published with itemId, itemName, previousQty, newQty, reason, staffId
- **Dashboard Verification**: LiveInventoryWidget should show alert if stock drops below threshold

**Test Case 4.3: Inventory Correction**
- Apply a correction to inventory
- **Expected Event**: `inventory.correction` published with itemId, itemName, previousQty, newQty, reason, staffId
- **Dashboard Verification**: LiveInventoryWidget reflects corrected quantity

**Test Case 4.4: Low Stock Alert**
- Reduce an item to below minimum stock level
- **Expected Event**: `inventory.low_stock` published with itemId, itemName, currentQty, minStock
- **Dashboard Verification**: LiveInventoryWidget shows item in "low" section

**Test Case 4.5: Out of Stock Alert**
- Reduce an item to zero quantity
- **Expected Event**: `inventory.out_of_stock` published with itemId, itemName
- **Dashboard Verification**: LiveInventoryWidget shows item in "out of stock" section

### 5. Reservation Event Validation

**Test Case 5.1: Reservation Check-in**
- Navigate to Reservations module
- Check in a reservation
- **Expected Event**: `reservation.checked_in` published with reservationId, guestName, partySize, tableId
- **Dashboard Verification**: LiveReservationsWidget "checked in" count increments

**Test Case 5.2: Reservation Seated**
- Seat a checked-in reservation at a table
- **Expected Event**: `reservation.seated` published with reservationId, guestName, partySize, tableId, tableNumber
- **Dashboard Verification**: LiveReservationsWidget shows seated status, LiveTablesWidget updates

**Test Case 5.3: Reservation Late**
- Mark a reservation as late
- **Expected Event**: `reservation.late` published with reservationId, guestName, lateMinutes
- **Dashboard Verification**: LiveReservationsWidget shows late status

**Test Case 5.4: Reservation No Show**
- Mark a reservation as no show
- **Expected Event**: `reservation.no_show` published with reservationId, guestName, partySize
- **Dashboard Verification**: LiveReservationsWidget "no shows" count increments

**Test Case 5.5: Reservation Cancellation**
- Cancel a reservation
- **Expected Event**: `reservation.cancelled` published with reservationId, guestName, partySize
- **Dashboard Verification**: LiveReservationsWidget removes reservation from upcoming

### 6. Staff Event Validation

**Test Case 6.1: Staff Creation**
- Navigate to Staff module
- Add a new staff member
- **Expected Event**: `staff.created` published with staffId, staffName, role, status, staffId (creator)
- **Dashboard Verification**: LiveStaffStatusWidget shows new staff member

**Test Case 6.2: Staff Update**
- Update staff member details
- **Expected Event**: `staff.updated` published with staffId, staffName, role, status, staffId (updater)
- **Dashboard Verification**: LiveStaffStatusWidget reflects updated information

**Test Case 6.3: Staff Status Change**
- Change staff status (active → on break → offline)
- **Expected Event**: `staff.status_changed` published with staffId, previousStatus, newStatus, staffId (changer)
- **Dashboard Verification**: LiveStaffStatusWidget status counts update immediately

### 7. CRM Event Validation

**Test Case 7.1: Customer Creation**
- Navigate to CRM module
- Create a new customer
- **Expected Event**: `customer.created` published with customerId, customerName, customerPhone, customerEmail, tier, customerType, staffId
- **Dashboard Verification**: Customer appears in customer list (if CRM widget exists)

**Test Case 7.2: Customer Update**
- Update customer information
- **Expected Event**: `customer.updated` published with customerId, customerName, customerPhone, customerEmail, tier, staffId
- **Dashboard Verification**: Customer information updates in real-time

**Test Case 7.3: Visit Logging**
- Log a visit for a customer
- **Expected Event**: `customer.visit_completed` published with customerId, customerName, amount, totalVisits, totalSpend, newTier
- **Dashboard Verification**: Customer visit count and spend update

**Test Case 7.4: Loyalty Update**
- Complete an order for a customer
- **Expected Event**: `customer.loyalty_updated` published with customerId, customerName, orderId, orderAmount, newTier, loyaltyPoints
- **Dashboard Verification**: Customer tier and loyalty points update

### 8. Health Event Validation

**Test Case 8.1: Health Check**
- Navigate to Health Engine
- Trigger a health check on any component
- **Expected Event**: `health.checked` published with componentId, status, healthScore, latency, responseTime
- **Dashboard Verification**: LiveBusinessHealthWidget shows updated component status

**Test Case 8.2: Critical Health State**
- Simulate a critical health issue (e.g., database connection failure)
- **Expected Event**: `health.critical` published with componentId, status, healthScore, reason
- **Dashboard Verification**: LiveBusinessHealthWidget shows critical status, LiveAlertCenterWidget shows alert

**Test Case 8.3: Warning Health State**
- Simulate a warning condition (e.g., high latency)
- **Expected Event**: `health.warning` published with componentId, healthScore, reason
- **Dashboard Verification**: LiveBusinessHealthWidget shows warning status

**Test Case 8.4: Health Recovery**
- Resolve a critical/warning condition
- **Expected Event**: `health.recovered` published with componentId, previousStatus, healthScore
- **Dashboard Verification**: LiveBusinessHealthWidget shows healthy status

## Event Bus Monitoring

To monitor events in real-time during testing, add this to browser console:

```javascript
// Monitor all events
eventBus.subscribeToAll((event) => {
  console.log(`[${event.category}] ${event.type}:`, event.data);
});

// Monitor specific category
eventBus.subscribeToCategory('orders', (event) => {
  console.log('Order event:', event);
});

// Get event statistics
console.log(eventBus.getStats());
```

## Success Criteria

Each test case is considered successful if:
1. The expected event is published to the EventBus
2. The event payload contains all required fields
3. The Dashboard widget updates within 100ms of event publication
4. No console errors occur during the event flow
5. The widget state matches the expected state after event processing

## Performance Validation

- Event publishing should complete within 10ms
- Widget updates should complete within 100ms
- No memory leaks should occur after 100+ events
- Event history should not exceed configured max size (1000 events)

## Notes

- All tests should be performed with the application in development mode
- Browser DevTools Network tab can be used to verify no unnecessary API calls are made
- Event throttling should be tested by rapidly triggering high-frequency events (kitchen.started, order.updated)
- Event history can be inspected using `eventBus.getHistory()` to verify event sequence
