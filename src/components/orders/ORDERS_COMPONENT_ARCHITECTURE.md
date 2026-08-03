# CafeOS Orders Component Architecture

## Overview

The Orders module has been refactored to use `useCart()` as the single source of truth for all cart operations. This document describes the component architecture after Phase 4 extraction.

## Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Presentation Only**: Components render UI and delegate to callbacks
3. **No Business Logic**: All business logic resides in hooks and utilities
4. **Props-Driven**: Components receive data via props and emit events via callbacks
5. **No State Duplication**: Components never duplicate state managed by hooks

## Component Tree

```
Orders.jsx (Orchestrator)
├── OrderHeader.jsx
├── SearchBar.jsx
├── CategorySidebar.jsx
├── MenuGrid.jsx
├── CartPanel.jsx
│   ├── CartItem.jsx
│   └── CartControls.jsx
├── OrderTypePanel.jsx
├── CustomerPanel.jsx
├── DiscountPanel.jsx
├── TotalsPanel.jsx
├── PaymentPanel.jsx
├── SplitBillPanel.jsx
├── HoldBillPanel.jsx
├── ReceiptActions.jsx
├── KitchenStatusPanel.jsx
└── ModifierModal.jsx
```

## Component Responsibilities

### Orders.jsx (Orchestrator)

**Purpose**: Lightweight coordination layer

**Responsibilities**:
- Initialize hooks (`useCart`, custom hooks)
- Pass props to child components
- Coordinate module interactions
- Handle routing and navigation
- Manage dialog state
- Publish events to event bus
- Handle global keyboard shortcuts

**Does NOT**:
- Render complex UI
- Calculate business values
- Own cart state
- Implement business logic

---

### OrderHeader.jsx

**Purpose**: Display order metadata and navigation

**Props**:
- `mode`: 'active' | 'pos'
- `activeCount`: number
- `cartItemCount`: number
- `onModeChange`: (mode: string) => void

**Responsibilities**:
- Display mode tabs (Live Orders / Cash Desk)
- Show badges for counts
- Handle mode switching

---

### SearchBar.jsx

**Purpose**: Menu and order search input

**Props**:
- `value`: string
- `onChange`: (value: string) => void
- `placeholder`: string

**Responsibilities**:
- Render search input field
- Emit search changes
- Handle keyboard shortcuts

---

### CategorySidebar.jsx

**Purpose**: Menu category navigation

**Props**:
- `categories`: string[]
- `selectedCategory`: string
- `onCategorySelect`: (category: string) => void
- `showAvailableOnly`: boolean
- `onToggleAvailable`: () => void

**Responsibilities**:
- Render category buttons
- Highlight selected category
- Toggle availability filter

---

### MenuGrid.jsx

**Purpose**: Display menu items for selection

**Props**:
- `menuItems`: MenuItem[]
- `categoryFilter`: string
- `searchQuery`: string
- `showAvailableOnly`: boolean
- `cart`: Cart object (from useCart)
- `onAddItem`: (item: MenuItem) => void
- `isMobile`: boolean
- `kioskMode`: boolean

**Responsibilities**:
- Filter and render menu items
- Display item availability
- Show item quantity in cart
- Handle add-to-cart clicks
- Display allergen warnings

---

### CartPanel.jsx

**Purpose**: Display cart items and controls

**Props**:
- `cart`: Cart object (from useCart)
- `onUpdateQuantity`: (itemId: string, delta: number) => void
- `onRemoveItem`: (itemId: string) => void
- `onUpdateNotes`: (itemId: string, notes: string) => void
- `onOpenPriceOverride`: (itemId: string, price: number) => void
- `onHoldBill`: () => void
- `onClearCart`: () => void
- `isMobile`: boolean
- `splitMode`: boolean

**Responsibilities**:
- Render cart items
- Display quantity controls
- Show item notes
- Display modifier indicators
- Handle remove actions
- Display hold/clear buttons

---

### OrderTypePanel.jsx

**Purpose**: Order type selection

**Props**:
- `orderType`: string
- `onOrderTypeChange`: (type: string) => void
- `selectedTable`: string | null
- `onTableSelect`: (tableId: string) => void
- `tables`: Table[]

**Responsibilities**:
- Render order type buttons (Dine In, Takeaway, etc.)
- Display table selector for Dine In
- Handle type changes

---

### CustomerPanel.jsx

**Purpose**: Customer lookup and selection

**Props**:
- `customerPhone`: string
- `onPhoneChange`: (phone: string) => void
- `customerAddress`: string
- `onAddressChange`: (address: string) => void
- `customers`: Customer[]
- `onCustomerSelect`: (customer: Customer) => void
- `orderType`: string

**Responsibilities**:
- Render phone input
- Display customer lookup results
- Show order history
- Handle address input for delivery

---

### DiscountPanel.jsx

**Purpose**: Discount application UI

**Props**:
- `discountInput`: string
- `discountMode`: 'amount' | 'percent'
- `cartSubtotal`: number
- `onDiscountModeChange`: (mode: string) => void
- `onDiscountInputChange`: (value: string) => void

**Responsibilities**:
- Render discount mode toggle
- Display discount input field
- Validate discount values
- Show applied discount

---

### TotalsPanel.jsx

**Purpose**: Display order totals

**Props**:
- `cartSubtotal`: number
- `cartTax`: number
- `cartDiscount`: number
- `cartPackaging`: number
- `cartTotal`: number
- `formatCurrency`: (amount: number) => string

**Responsibilities**:
- Display subtotal
- Show tax breakdown
- Display discount
- Show packaging charge
- Display grand total

---

### PaymentPanel.jsx

**Purpose**: Payment method selection and cash handling

**Props**:
- `paymentMethod`: string
- `onPaymentMethodChange`: (method: string) => void
- `cashTendered`: string
- `onCashTenderedChange`: (amount: string) => void
- `cartTotal`: number
- `changeDue`: number | null
- `formatCurrency`: (amount: number) => string

**Responsibilities**:
- Render payment method buttons
- Display cash tendered input
- Show change due calculation
- Suggest round-up amounts

---

### SplitBillPanel.jsx

**Purpose**: Split bill configuration

**Props**:
- `splitMode`: boolean
- `splitCount`: number
- `onSplitModeToggle`: (enabled: boolean) => void
- `onSplitCountChange`: (count: number) => void
- `cartTotal`: number
- `itemSplits`: Record<string, number | null>
- `onItemSplitChange`: (itemId: string, splitIndex: number | null) => void
- `cart`: Cart object
- `formatCurrency`: (amount: number) => string

**Responsibilities**:
- Render split mode toggle
- Display split count selector
- Show per-person total
- Render item split controls
- Handle item assignment to splits

---

### HoldBillPanel.jsx

**Purpose**: Hold and resume bill functionality

**Props**:
- `heldOrders`: HeldOrder[]
- `onResumeBill`: (holdId: string) => void
- `onDiscardBill`: (holdId: string) => void

**Responsibilities**:
- Display list of held bills
- Show bill metadata (time, items, customer)
- Handle resume action
- Handle discard action

---

### ReceiptActions.jsx

**Purpose**: Receipt generation and delivery options

**Props**:
- `receiptOptions`: ReceiptOptions
- `onReceiptOptionsChange`: (options: ReceiptOptions) => void
- `onPrintReceipt`: () => void
- `onEmailReceipt`: () => void
- `onWhatsAppReceipt`: () => void

**Responsibilities**:
- Render receipt type selector
- Display email/phone inputs
- Handle print action
- Handle email action
- Handle WhatsApp action

---

### KitchenStatusPanel.jsx

**Purpose**: Display kitchen ticket status

**Props**:
- `kdsCards`: KDSCard[]
- `showKitchenStatus`: boolean
- `onToggleKitchenStatus`: () => void

**Responsibilities**:
- Render kitchen status toggle
- Display active tickets
- Show ticket progress
- Display ready items

---

### ModifierModal.jsx

**Purpose**: Item modifier selection modal

**Props**:
- `isOpen`: boolean
- `itemId`: string | null
- `menuItem`: MenuItem | null
- `selectedModifiers`: Record<string, string[]>
- `onModifierToggle`: (categoryId: string, optionId: string, isMultiSelect: boolean) => void
- `onApplyModifiers`: (itemId: string) => void
- `onClose`: () => void
- `modifierCategories`: ModifierCategories

**Responsibilities**:
- Render modifier groups
- Display modifier options
- Handle selection/deselection
- Validate modifier combinations
- Show allergen warnings

---

## Data Flow

### Props Flow (Down)

```
Orders.jsx
  ↓ (props)
Child Components
  ↓ (callbacks)
Orders.jsx
```

### Example: Adding an Item

```
MenuGrid.jsx
  → onAddItem callback
  → Orders.jsx
  → cart.addItem()
  → useCart hook
  → State update
  → Re-render
  → CartPanel.jsx receives updated cart
```

### Example: Payment Flow

```
PaymentPanel.jsx
  → onPaymentMethodChange callback
  → Orders.jsx
  → setPaymentMethod()
  → Re-render
  → TotalsPanel.jsx receives updated state
```

## Performance Considerations

- Components are memoized where beneficial
- Cart items use stable IDs to prevent unnecessary re-renders
- Callback functions are wrapped in `useCallback` in Orders.jsx
- Large lists (menu items, orders) use virtualization where appropriate

## Extension Points

### Adding a New Payment Method

1. Add to `paymentMethod` state in Orders.jsx
2. Update PaymentPanel.jsx to render new button
3. Add validation logic in Orders.jsx
4. Update receipt generation if needed

### Adding a New Order Type

1. Add to `orderType` enum
2. Update OrderTypePanel.jsx
3. Add type-specific logic in Orders.jsx
4. Update routing if needed

### Adding a New Modifier Category

1. Update MODIFIER_CATEGORIES constant
2. ModifierModal.jsx automatically adapts
3. Add validation in useCart hook if needed

## Migration Notes

This architecture was achieved through:

1. **Phase 1**: Foundation - Grouped related state
2. **Phase 2**: Hooks & Utilities - Created useCart hook
3. **Phase 3**: Single Source of Truth - Migrated to useCart
4. **Phase 4**: Component Extraction - Split into focused components

## Success Criteria

✅ Orders.jsx reduced by at least 50%
✅ Each component has single responsibility
✅ Business logic remains in hooks
✅ Zero duplicated logic
✅ UI identical to pre-refactor
✅ Build passes without errors
✅ All workflows preserved
✅ All integrations preserved
✅ No visual regressions

## Future Improvements

- Consider React.memo for frequently re-rendered components
- Evaluate Context API for deeply nested props
- Consider component lazy loading for large sections
- Add unit tests for individual components
- Add Storybook stories for component catalog
