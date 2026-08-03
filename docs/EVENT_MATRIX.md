# CafeOS Event Matrix

This document maps all events published by CafeOS modules to their Dashboard widget subscribers.

## Event Architecture

- **ModuleEventPublisher**: Modules publish events through this centralized publisher
- **EventBus**: Central event bus that routes events to subscribers
- **LiveOperationsEngine**: Dashboard subscribes to event categories and updates widgets
- **DataIntegrationLayer**: Processes raw platform data into widget-ready formats

## Event Categories

### Orders Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `order.created` | Orders.jsx | orderId, tableId, items, total, staffId | LiveOrderWidget |
| `order.updated` | Orders.jsx | orderId, status, previousStatus | LiveOrderWidget |
| `order.cancelled` | Orders.jsx | orderId, reason, staffId | LiveOrderWidget |
| `order.completed` | Orders.jsx | orderId, tableId, staffId | LiveOrderWidget |
| `order.ready` | Kitchen.jsx | orderId, tableId, station | LiveOrderWidget, LiveKitchenWidget |

### Kitchen Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `kitchen.started` | Kitchen.jsx | cardId, orderId, station, items | LiveKitchenWidget |
| `kitchen.ready` | Kitchen.jsx | orderId, cardId, station | LiveKitchenWidget |
| `kitchen.completed` | Kitchen.jsx | cardId, orderId, station, duration | LiveKitchenWidget |
| `kitchen.held` | Kitchen.jsx | cardId, orderId, station, reason | LiveKitchenWidget |
| `kitchen.released` | Kitchen.jsx | cardId, orderId, station | LiveKitchenWidget |

### Waiter Workspace

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `waiter.collected` | ReadyForPickup.jsx | orderId, cardId, staffId | LiveWaiterWidget |
| `waiter.serving` | ServingWorkflow.jsx | orderId, tableId, staffId | LiveWaiterWidget |
| `waiter.delivered` | ServingWorkflow.jsx | orderId, tableId, staffId | LiveWaiterWidget |
| `waiter.confirmed` | ServingWorkflow.jsx | orderId, tableId, staffId | LiveWaiterWidget |
| `waiter.completed` | ServingWorkflow.jsx | orderId, tableId, staffId | LiveWaiterWidget |

### Tables Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `table.reserved` | Tables.jsx | tableId, customerName, date, time, partySize | LiveTablesWidget |
| `table.occupied` | Tables.jsx | tableId, orderId, staffId | LiveTablesWidget |
| `table.cleaning` | Tables.jsx | tableId, previousStatus, previousOrderId | LiveTablesWidget |
| `table.available` | Tables.jsx | tableId, previousStatus | LiveTablesWidget |

### Payments Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `payment.collected` | Orders.jsx | orderId, paymentMethod, amount, staffId | LivePaymentsWidget |

### Inventory Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `inventory.restocked` | Inventory.jsx | itemId, itemName, previousQty, newQty, reason, staffId | LiveInventoryWidget |
| `inventory.wastage` | Inventory.jsx | itemId, itemName, previousQty, newQty, reason, staffId | LiveInventoryWidget |
| `inventory.correction` | Inventory.jsx | itemId, itemName, previousQty, newQty, reason, staffId | LiveInventoryWidget |
| `inventory.adjusted` | Inventory.jsx | itemId, itemName, previousQty, newQty, reason, staffId | LiveInventoryWidget |
| `inventory.low_stock` | Inventory.jsx | itemId, itemName, currentQty, minStock | LiveInventoryWidget |
| `inventory.out_of_stock` | Inventory.jsx | itemId, itemName | LiveInventoryWidget |

### Reservations Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `reservation.checked_in` | Reservations.jsx | reservationId, guestName, partySize, tableId | LiveReservationsWidget |
| `reservation.seated` | Reservations.jsx | reservationId, guestName, partySize, tableId, tableNumber | LiveReservationsWidget, LiveTablesWidget |
| `reservation.late` | Reservations.jsx | reservationId, guestName, lateMinutes | LiveReservationsWidget |
| `reservation.no_show` | Reservations.jsx | reservationId, guestName, partySize | LiveReservationsWidget |
| `reservation.cancelled` | Reservations.jsx | reservationId, guestName, partySize | LiveReservationsWidget |

### CRM Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `customer.created` | CRM.jsx | customerId, customerName, customerPhone, customerEmail, tier, customerType, staffId | (Future: LiveCRMWidget) |
| `customer.updated` | CRM.jsx | customerId, customerName, customerPhone, customerEmail, tier, staffId | (Future: LiveCRMWidget) |
| `customer.visit_completed` | CRM.jsx | customerId, customerName, amount, totalVisits, totalSpend, newTier | (Future: LiveCRMWidget) |
| `customer.loyalty_updated` | CRM.jsx | customerId, customerName, orderId, orderAmount, newTier, loyaltyPoints | (Future: LiveCRMWidget) |

### Staff Module

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `staff.created` | Staff.jsx | staffId, staffName, role, status, staffId (creator) | LiveStaffStatusWidget |
| `staff.updated` | Staff.jsx | staffId, staffName, role, status, staffId (updater) | LiveStaffStatusWidget |
| `staff.status_changed` | Staff.jsx | staffId, previousStatus, newStatus, staffId (changer) | LiveStaffStatusWidget |

### Health Engine

| Event Type | Published By | Payload | Dashboard Widget |
|-----------|--------------|---------|------------------|
| `health.checked` | HealthEngine.js | componentId, status, healthScore, latency, responseTime | LiveBusinessHealthWidget |
| `health.critical` | HealthEngine.js | componentId, status, healthScore, reason | LiveBusinessHealthWidget, LiveAlertCenterWidget |
| `health.warning` | HealthEngine.js | componentId, healthScore, reason | LiveBusinessHealthWidget |
| `health.recovered` | HealthEngine.js | componentId, previousStatus, healthScore | LiveBusinessHealthWidget |

## Dashboard Widget Subscriptions

### LiveOrderWidget
- Subscribes to: `orders` category
- Data source: `liveOperationsEngine.subscribe('orders')`
- Updates on: All order events

### LiveKitchenWidget
- Subscribes to: `kitchen` category
- Data source: `liveOperationsEngine.subscribe('kitchen')`
- Updates on: All kitchen events

### LiveTablesWidget
- Subscribes to: `tables` category
- Data source: `liveOperationsEngine.subscribe('tables')`
- Updates on: All table events

### LiveInventoryWidget
- Subscribes to: `inventory` category
- Data source: `liveOperationsEngine.subscribe('inventory')`
- Updates on: All inventory events

### LiveReservationsWidget
- Subscribes to: `reservations` category
- Data source: `liveOperationsEngine.subscribe('reservations')`
- Updates on: All reservation events

### LivePaymentsWidget
- Subscribes to: `payments` category
- Data source: `liveOperationsEngine.subscribe('payments')`
- Updates on: All payment events

### LiveStaffStatusWidget
- Subscribes to: `staff` category
- Data source: `liveOperationsEngine.subscribe('staff')`
- Updates on: All staff events

### LiveWaiterWidget
- Subscribes to: `waiters` category
- Data source: `liveOperationsEngine.subscribe('waiters')`
- Updates on: All waiter events

### LiveBusinessHealthWidget
- Subscribes to: `health` category
- Data source: `liveOperationsEngine.subscribe('health')`
- Updates on: All health events

### LiveAlertCenterWidget
- Subscribes to: `alerts` category
- Data source: `liveOperationsEngine.subscribe('alerts')`
- Updates on: Critical health events, system alerts

## Event Flow

1. **Module Action**: User performs action in a CafeOS module (e.g., creates order)
2. **Event Publishing**: Module calls `moduleEventPublisher.publishXxxEvent()`
3. **Event Bus Routing**: EventBus routes event to appropriate category
4. **Dashboard Subscription**: LiveOperationsEngine receives event via category subscription
5. **Data Update**: LiveOperationsEngine updates data store via `updateData()`
6. **Widget Notification**: Subscribed widgets are notified via `notifySubscribers()`
7. **UI Update**: Widget re-renders with new data

## Event Payload Standards

All events include:
- `timestamp`: ISO timestamp of event
- `module`: Source module name
- `entityId`: ID of the affected entity
- `action`: Type of action performed
- `userId`: ID of staff who performed action (when applicable)
- `metadata`: Additional context-specific data

## Notes

- Dashboard is a **read-only consumer** - it never initiates events
- All business logic remains in source modules
- Events are published synchronously with state changes
- Widgets update automatically via event subscriptions
- No polling mechanisms used for real-time updates
