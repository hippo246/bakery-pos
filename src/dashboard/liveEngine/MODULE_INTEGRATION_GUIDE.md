# CafeOS Dashboard Module Integration Guide

## Architecture Principle

**The Dashboard is a READ-ONLY presentation layer.**
- Dashboard never owns business data
- Dashboard never initiates business actions
- Dashboard only subscribes to events from modules
- Modules publish events when actions occur
- Single source of truth: CafeOS modules

## Event Integration Points

### Orders Module (`src/components/orders/Orders.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When order is created
moduleEventPublisher.publishOrderEvent('order.created', {
  orderId: order.id,
  tableId: order.tableId,
  amount: order.total,
  status: order.status
});

// When order status changes
moduleEventPublisher.publishOrderEvent('order.updated', {
  orderId: order.id,
  oldStatus: oldStatus,
  newStatus: newStatus
});

// When order is ready
moduleEventPublisher.publishOrderEvent('order.ready', {
  orderId: order.id
});

// When order is served
moduleEventPublisher.publishOrderEvent('order.served', {
  orderId: order.id
});

// When order is cancelled
moduleEventPublisher.publishOrderEvent('order.cancelled', {
  orderId: order.id,
  reason: reason
});
```

### Kitchen Module (`src/components/kitchen/Kitchen.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When KDS ticket starts
moduleEventPublisher.publishKitchenEvent('kitchen.started', {
  ticketId: ticket.id,
  orderId: ticket.orderId,
  station: ticket.station
});

// When KDS ticket completes
moduleEventPublisher.publishKitchenEvent('kitchen.ready', {
  ticketId: ticket.id,
  orderId: ticket.orderId,
  cookTime: cookTime
});

// When KDS ticket is collected
moduleEventPublisher.publishKitchenEvent('kitchen.collected', {
  ticketId: ticket.id,
  orderId: ticket.orderId
});

// When station utilization changes
moduleEventPublisher.publishKitchenEvent('kitchen.utilization', {
  station: stationName,
  utilization: utilizationPercent
});
```

### Tables Module (`src/components/Tables/Tables.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When table is occupied
moduleEventPublisher.publishTableEvent('table.occupied', {
  tableId: table.id,
  orderId: orderId,
  occupiedAt: timestamp
});

// When table is available
moduleEventPublisher.publishTableEvent('table.available', {
  tableId: table.id,
  occupiedTime: duration
});

// When table is reserved
moduleEventPublisher.publishTableEvent('table.reserved', {
  tableId: table.id,
  reservationId: reservationId
});

// When table needs cleaning
moduleEventPublisher.publishTableEvent('table.cleaning', {
  tableId: table.id
});
```

### Payments Module (in Orders.jsx)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When payment starts
moduleEventPublisher.publishPaymentEvent('payment.started', {
  orderId: order.id,
  amount: order.total,
  method: order.paymentMethod
});

// When payment completes
moduleEventPublisher.publishPaymentEvent('payment.completed', {
  orderId: order.id,
  amount: order.total,
  method: order.paymentMethod,
  processingTime: duration
});

// When payment fails
moduleEventPublisher.publishPaymentEvent('payment.failed', {
  orderId: order.id,
  amount: order.total,
  reason: error
});

// When refund is processed
moduleEventPublisher.publishPaymentEvent('payment.refunded', {
  orderId: order.id,
  amount: refundAmount
});
```

### Inventory Module (`src/components/inventory/Inventory.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When inventory item becomes critical
moduleEventPublisher.publishInventoryEvent('inventory.critical', {
  itemId: item.id,
  itemName: item.name,
  currentQuantity: item.quantity
});

// When inventory item is out of stock
moduleEventPublisher.publishInventoryEvent('inventory.out_of_stock', {
  itemId: item.id,
  itemName: item.name
});

// When inventory item is expiring
moduleEventPublisher.publishInventoryEvent('inventory.expiring', {
  itemId: item.id,
  itemName: item.name,
  expiryDate: item.expiryDate
});

// When inventory is restocked
moduleEventPublisher.publishInventoryEvent('inventory.restocked', {
  itemId: item.id,
  itemName: item.name,
  quantity: quantity
});
```

### Reservations Module (`src/components/Reservations/Reservations.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When reservation is created
moduleEventPublisher.publishReservationEvent('reservation.created', {
  reservationId: reservation.id,
  customerName: reservation.name,
  time: reservation.time
});

// When reservation is checked in
moduleEventPublisher.publishReservationEvent('reservation.checked_in', {
  reservationId: reservation.id,
  customerName: reservation.name,
  tableId: tableId
});

// When reservation is no-show
moduleEventPublisher.publishReservationEvent('reservation.no_show', {
  reservationId: reservation.id,
  customerName: reservation.name
});

// When reservation is completed
moduleEventPublisher.publishReservationEvent('reservation.completed', {
  reservationId: reservation.id
});
```

### CRM Module (`src/components/BrewCRM.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When customer is added
moduleEventPublisher.publishStaffEvent('customer.added', {
  customerId: customer.id,
  customerName: customer.name
});

// When customer visits
moduleEventPublisher.publishStaffEvent('customer.visit', {
  customerId: customer.id,
  visitCount: customer.visitCount
});
```

### Staff Module (`src/components/Staff/Staff.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When staff clocks in
moduleEventPublisher.publishStaffEvent('staff.clock_in', {
  staffId: staff.id,
  staffName: staff.name,
  role: staff.role
});

// When staff clocks out
moduleEventPublisher.publishStaffEvent('staff.clock_out', {
  staffId: staff.id,
  staffName: staff.name
});

// When staff goes on break
moduleEventPublisher.publishStaffEvent('staff.break_start', {
  staffId: staff.id,
  staffName: staff.name
});

// When staff returns from break
moduleEventPublisher.publishStaffEvent('staff.break_end', {
  staffId: staff.id,
  staffName: staff.name
});
```

### Health Engine (`src/components/health/Health.jsx`)

**Events to Publish:**
```javascript
import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// When health status changes
moduleEventPublisher.publishHealthEvent('health.changed', {
  component: componentName,
  oldStatus: oldStatus,
  newStatus: newStatus,
  reason: reason
});

// When overall health changes
moduleEventPublisher.publishHealthEvent('health.overall', {
  overallStatus: overallStatus,
  score: healthScore
});
```

## Dashboard Data Flow

```
CafeOS Modules (Orders, Kitchen, Tables, Payments, Inventory, Reservations, CRM, Staff, Health)
    ↓ (publish events)
ModuleEventPublisher
    ↓ (publish to event bus)
EventBus
    ↓ (subscribers receive events)
LiveOperationsEngine
    ↓ (processes events)
DataIntegrationLayer
    ↓ (transforms data)
Dashboard Widgets
```

## Dashboard Initialization

In the main Dashboard component, initialize with real platform data:

```javascript
import liveOperationsEngine from './dashboard/liveEngine/LiveOperationsEngine.js';

function Dashboard({ orders, kdsCards, tables, inventory, reservations, customers, healthData, staff, shifts, notifications }) {
  useEffect(() => {
    liveOperationsEngine.initialize();
    
    // Set platform data reference
    liveOperationsEngine.setPlatformData({
      orders,
      kdsCards,
      tables,
      inventory,
      reservations,
      customers,
      healthData,
      staff,
      shifts,
      notifications
    });
  }, [orders, kdsCards, tables, inventory, reservations, customers, healthData, staff, shifts, notifications]);

  // ... rest of dashboard component
}
```

## Integration Status

**Completed:**
- ✅ Data Integration Layer created
- ✅ Live Operations Engine updated to use real data
- ✅ Business Intelligence Engine updated to use real data
- ✅ Business Health connected to Health Engine
- ✅ Activity Timeline connected to Event Bus
- ✅ Notifications connected to Notification Center
- ✅ Module Event Publisher created

**Requires Module Integration:**
- ⏳ Orders module event publishing
- ⏳ Kitchen module event publishing
- ⏳ Tables module event publishing
- ⏳ Payments module event publishing
- ⏳ Inventory module event publishing
- ⏳ Reservations module event publishing
- ⏳ CRM module event publishing
- ⏳ Staff module event publishing
- ⏳ Health Engine event publishing

## Testing Checklist

After event integration is complete:

1. **Order Flow Test:**
   - Create order → Dashboard shows order created
   - Kitchen starts → Dashboard shows kitchen started
   - Kitchen ready → Dashboard shows order ready
   - Waiter serves → Dashboard shows order served
   - Payment completes → Dashboard shows payment completed

2. **Inventory Flow Test:**
   - Item goes critical → Dashboard shows critical alert
   - Item goes out of stock → Dashboard shows out of stock alert
   - Item restocked → Dashboard alert clears

3. **Table Flow Test:**
   - Table occupied → Dashboard shows occupied
   - Table available → Dashboard shows available
   - Table overstayed → Dashboard shows overstayed

4. **Health Flow Test:**
   - Health changes → Dashboard health widget updates
   - Component fails → Dashboard shows deduction

## Important Notes

- **Never modify dashboard data from dashboard widgets** - Dashboard is read-only
- **All business logic remains in modules** - Dashboard only displays
- **Single source of truth** - Modules own the data
- **Event-driven updates** - Modules publish, Dashboard subscribes
- **No duplicate state** - Dashboard never stores business state
