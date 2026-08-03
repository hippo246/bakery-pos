# Orders Module Architecture

## Folder Structure
```
orders/
├── hooks/              # Custom React hooks
│   └── useCart.js     # Cart operations (single source of truth)
├── utils/              # Pure utilities (NO React code)
│   ├── cartCalculations.js    # Cart totals, tax, discount
│   ├── currency.js            # Currency formatting
│   ├── itemHelpers.js         # Item validation, filtering
│   ├── modifierHelpers.js     # Modifier operations
│   ├── allergenHelpers.js     # Allergen checking
│   └── orderHelpers.js        # Order helper functions
├── validation/         # Validation logic
│   └── orderValidation.js     # Order validation rules
├── constants/          # Constants and enums
│   └── orderConstants.js      # Order types, statuses, etc.
├── types/              # Type definitions
│   └── cartTypes.js           # Cart type definitions
├── services/           # External service integrations (future)
├── reducers/           # State reducers (future)
└── components/        # UI components (future)
```

## Key Modules

### hooks/useCart.js
**Purpose**: Single source of truth for cart operations

**State**: items, discountInput, discountMode, packagingCharge, splitCount, splitMode, itemSplits, selectedModifiers

**Computed**: totals, changeDue, itemCount, uniqueItemCount, isEmpty

**Actions**: addItem, removeItem, updateQuantity, updateItemNotes, clearCart, setDiscount, setPackaging, toggleItemModifier, applyModifiers, validateCart, reorderItems

### utils/cartCalculations.js
**Functions**: calculateSubtotal, calculateTax, calculateCgst, calculateSgst, calculateDiscount, calculatePackaging, calculateTotal, calculateChangeDue, calculateSplitAmount, calculateCartTotals

### utils/currency.js
**Functions**: roundCurrency, formatCurrency, formatCurrencyDecimals, parseCurrency, safeMoney

### utils/itemHelpers.js
**Functions**: isItemAvailable, isItemPopular, validateCartItem, validateCartItems, itemMatchesSearch, itemMatchesCategory, filterMenuItems

### utils/modifierHelpers.js
**Functions**: toggleModifier, applyModifiersToItem, calculateModifierPriceForItem, getApplicableModifierCategories, hasModifiers

### utils/allergenHelpers.js
**Functions**: getAllergenSeverity, checkAllergenConflict, getAllergenDisplayName, formatAllergenList

### utils/orderHelpers.js
**Functions**: generateOrderId, getOrderAge, isOrderOld, isTerminalStatus, canAdvanceStatus, isValidStatusTransition, getCartItemCount, isCartEmpty, requiresTable, requiresPhone, isOffPremise

### validation/orderValidation.js
**Functions**: validateOrderForSubmit, isValidOrderType, isValidPaymentMethod, isValidSplitCount, isValidDiscount, isValidPhone, isValidScheduledDateTime

### constants/orderConstants.js
**Exports**: ORDER_TYPES, PAYMENT_METHODS, STATUS_FLOW, TAX_RATE, DEFAULT_PACKAGING_CHARGE, DEFAULT_SPLIT_COUNT, etc.

## Data Flow

**Cart Add Flow**: User → useCart.addItem → allergen check → validation → state update → totals recalc → callback → UI re-render

**Order Creation Flow**: Place Order → validateCart → validateOrderForSubmit → stock check → createOrder → inventory deduction → KDS tickets → table update → customer update → events → cart clear → receipt

## Integration Points

**External Props**: orders, setOrders, kdsCards, setKdsCards, menuItems, tables, setTables, inventory, setInventory, customers, setCustomers, staff, documents, setDocuments, notifications, setNotifications, shifts, setShifts, currentShift

**Domain Models**: orderModel, inventoryModel, kdsModel, customerModel, tableModel, shiftModel

**Services**: printEngine, notificationTriggers, notificationService, permissionService, authService

**Events**: ModuleEventPublisher (order.created, order.updated, order.completed, order.cancelled, table.occupied, table.available, kitchen.started, payment.collected)

## Future Extension Points

1. **services/** - External API integrations (cloud sync, payment gateways)
2. **reducers/** - Centralized state management (Redux/Zustand migration)
3. **components/** - UI component splits (OrderList, CartPanel, MenuItemCard, etc.)
4. Additional hooks: useOrderManagement, useInventory, usePayment, useCustomer, useKitchenIntegration, useTableManagement

## Design Principles

- Single Responsibility: Each file has one clear purpose
- Separation of Concerns: Business logic separated from UI
- Pure Functions: Utilities contain zero React code
- Testability: All business logic independently testable
- Performance: Memoization and efficient calculations
