# CafeOS Pricing Engine Architecture

## Overview

The CafeOS Pricing Engine is a centralized, enterprise-grade system for managing pricing, discounts, promotions, coupons, taxes, and business rules. It serves as the single source of truth for all pricing decisions across the CafeOS platform.

## Design Principles

1. **Single Source of Truth**: All pricing calculations go through this engine
2. **No Duplicated Logic**: Pricing logic exists only in the pricing engine
3. **Deterministic Calculations**: Same inputs always produce same outputs
4. **Event-Driven**: All pricing decisions are auditing events
5. **Performance-Optimized**: Caching and memoization for fast calculations
6. **Commercial-Ready**: Production-ready with approval workflows and audit trails

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Pricing Engine Core                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Pricing      │  │ Discount     │  │ Promotion    │      │
│  │ Engine       │  │ Engine       │  │ Engine       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Coupon       │  │ Tax          │  │ Approval     │      │
│  │ Engine       │  │ Engine       │  │ Engine       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Conflict     │  │ Audit        │  │ Performance  │      │
│  │ Resolution   │  │ Trail        │  │ Optimizer    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Pricing Engine (`pricingEngine.js`)

**Purpose**: Calculate base prices with multiple pricing strategies

**Features**:
- 14 pricing strategies (Base, Branch, Time-based, Day-based, Happy Hour, Weekend, Holiday, Customer Group, VIP, Corporate, Membership, Bulk, Manual Override, Emergency Override)
- Configurable priority order
- Schedule-based pricing
- Customer group targeting
- Condition-based rules
- Memoized calculations

**Key Functions**:
- `calculatePrice(basePrice, context)` - Calculate final price
- `getApplicableRules(context)` - Get applicable pricing rules
- `addPricingRule(ruleData)` - Add pricing rule
- `updateRule(ruleId, updates)` - Update pricing rule

**Pricing Priority** (lower = higher priority):
1. Emergency Override
2. Manual Override
3. VIP
4. Corporate
5. Membership
6. Happy Hour
7. Holiday
8. Weekend
9. Time-based
10. Day-based
11. Customer Group
12. Bulk
13. Branch Price
14. Base Price

#### 2. Discount Engine (`discountEngine.js`)

**Purpose**: Apply various discount types to orders

**Features**:
- 13 discount types (Percentage, Fixed Amount, Buy X Get Y, Free Item, Combo, Bundle, Category, Item, Table, Customer, Staff, Manual, Automatic)
- Maximum discount limits
- Approval rules
- Usage tracking
- Condition-based discounts

**Key Functions**:
- `calculateDiscount(baseAmount, context)` - Calculate discount
- `getApplicableRules(context)` - Get applicable discount rules
- `addDiscountRule(ruleData)` - Add discount rule
- `trackUsage(ruleId, customerId)` - Track discount usage

**Discount Priority** (lower = higher priority):
1. Manual Discount
2. Staff Discount
3. Customer Discount
4. Buy X Get Y
5. Free Item
6. Combo Discount
7. Bundle Discount
8. Category Discount
9. Item Discount
10. Table Discount
11. Automatic Discount
12. Percentage
13. Fixed Amount

#### 3. Promotion Engine (`promotionEngine.js`)

**Purpose**: Manage reusable promotions with scheduling and targeting

**Features**:
- 13 promotion types (Happy Hour, Lunch Combo, Weekend Offer, Birthday Offer, First Visit, Student Discount, Corporate Discount, Festival Offer, Loyalty Reward, Referral Reward, Seasonal Offer, Flash Sale, Bundle Offer)
- Scheduling with auto activation/deactivation
- Branch, item, category, customer targeting
- Usage limits (total and per customer)
- Daily limits
- Campaign tracking

**Key Functions**:
- `addPromotion(promotionData)` - Create promotion
- `getApplicablePromotions(context)` - Get applicable promotions
- `applyPromotion(promotionId, baseAmount, context)` - Apply promotion
- `updatePromotionStatus(promotionId, status)` - Update status

**Promotion Status**: Draft, Scheduled, Active, Paused, Expired, Cancelled

#### 4. Coupon Engine (`couponEngine.js`)

**Purpose**: Manage unique and reusable coupons with QR/barcode support

**Features**:
- 5 coupon types (Unique, Reusable, QR Code, Barcode, Promo Code)
- QR code generation
- Barcode generation
- Campaign tracking
- Expiry management
- Usage limits
- Customer-specific coupons
- Branch-specific coupons

**Key Functions**:
- `createCoupon(couponData)` - Create coupon
- `validateCoupon(code, context)` - Validate coupon
- `redeemCoupon(code, context)` - Redeem coupon
- `createBulkCoupons(template, count)` - Bulk create coupons

**Coupon Status**: Active, Used, Expired, Disabled, Pending

#### 5. Tax Engine (`taxEngine.js`)

**Purpose**: Calculate taxes with multiple tax types and rounding modes

**Features**:
- 8 tax types (GST, VAT, Service Charge, Sales Tax, Excise Tax, Luxury Tax, Tourism Tax, Custom Tax)
- 3 calculation methods (Inclusive, Exclusive, Compound)
- 4 rounding modes (Normal, Up, Down, Nearest Even)
- Branch-specific tax
- Category-specific tax
- Item-specific tax
- Tax exemptions
- Compound tax support

**Key Functions**:
- `calculateTax(amount, context)` - Calculate tax
- `getTaxSummary(subtotal, context)` - Get tax summary
- `reverseCalculateTax(inclusiveAmount, taxRate)` - Reverse calculation
- `addTaxRule(ruleData)` - Add tax rule

**Tax Calculation Methods**:
- **Inclusive**: Tax included in price (price = base + tax, tax = price * rate / (100 + rate))
- **Exclusive**: Tax added to price (tax = base * rate / 100)
- **Compound**: Tax calculated on tax (tax compounds on previous taxes)

**Tax Rounding Modes**:
- **Normal**: Round to nearest
- **Up**: Always round up
- **Down**: Always round down
- **Nearest Even**: Banker's rounding

#### 6. Approval Engine (`approvalEngine.js`)

**Purpose**: Require manager approval for pricing overrides

**Features**:
- 8 approval types (Large Discount, Price Override, Refund, Void, Tax Override, Promotion Override, Manual Discount, Emergency Override)
- Configurable thresholds
- Digital approval history
- Auto-expiration (30 minutes)
- Approval workflow
- Rejection with reason

**Key Functions**:
- `checkApprovalRequired(approvalType, context)` - Check if approval needed
- `createApprovalRequest(requestData)` - Create approval request
- `approveRequest(requestId, approvalData)` - Approve request
- `rejectRequest(requestId, rejectionData)` - Reject request

**Default Thresholds**:
- Large Discount: 20%
- Price Override: 10%
- Refund: 100
- Void: 50
- Tax Override: 5%
- Promotion Override: Always requires approval
- Manual Discount: 15%
- Emergency Override: Always requires approval

**Approval Status**: Pending, Approved, Rejected, Cancelled, Expired

#### 7. Conflict Resolution Engine (`conflictResolution.js`)

**Purpose**: Resolve conflicts when multiple promotions/discounts apply

**Features**:
- 7 resolution strategies (Highest Priority, Best Customer Value, Highest Profit, Manual Priority, Stackable, First Applicable, Last Applicable)
- Configurable per-type strategies
- Stackable combo/bundle discounts
- Manual discount priority

**Key Functions**:
- `resolveConflicts(applicableRules, context)` - Resolve conflicts
- `setResolutionStrategy(approvalType, strategy)` - Set strategy
- `addResolutionRule(ruleData)` - Add resolution rule

**Resolution Strategies**:
- **Highest Priority**: Apply highest priority rule
- **Best Customer Value**: Best discount for customer
- **Highest Profit**: Best for business profit
- **Manual Priority**: Manual discounts override automatic
- **Stackable**: Apply all compatible rules
- **First Applicable**: Apply first matching rule
- **Last Applicable**: Apply last matching rule

#### 8. Audit Trail (`auditTrail.js`)

**Purpose**: Record every pricing decision with immutable history

**Features**:
- 12 audit event types
- Complete pricing history per order
- Immutable records
- Pagination support
- Filtering by type, order, branch, user, date range
- Event descriptions
- Statistics and reporting

**Key Functions**:
- `recordPriceCalculation(calculationData)` - Record price calculation
- `recordDiscountApplied(discountData)` - Record discount
- `recordPromotionApplied(promotionData)` - Record promotion
- `recordCouponRedeemed(couponData)` - Record coupon redemption
- `recordTaxCalculated(taxData)` - Record tax calculation
- `recordApprovalGranted(approvalData)` - Record approval
- `recordApprovalDenied(approvalData)` - Record denial
- `getOrderPricingHistory(orderId)` - Get order pricing history

**Audit Event Types**:
- Price Calculation
- Discount Applied
- Promotion Applied
- Coupon Redeemed
- Tax Calculated
- Approval Granted
- Approval Denied
- Rule Modified
- Rule Created
- Rule Deleted
- Conflict Resolved
- Override Applied
- Pricing Error

#### 9. Performance Optimizer (`performanceOptimizer.js`)

**Purpose**: Optimize performance with caching and memoization

**Features**:
- LRU cache with TTL support
- Separate caches for pricing, discount, tax, promotion, rules
- Batch processing
- Calculation queue
- Debounce and throttle utilities
- Memoization helpers
- Cache statistics
- Auto cleanup of expired entries

**Key Functions**:
- `cachePricing(key, value, ttl)` - Cache pricing calculation
- `getCachedPricing(key)` - Get cached pricing
- `batchCache(items, cacheType, ttl)` - Batch cache
- `queueCalculation(fn, args)` - Queue calculation
- `batchProcess(items, processor, batchSize)` - Batch process
- `getStatistics()` - Get performance statistics

**Cache Configuration**:
- Pricing Cache: 500 items, 30s TTL
- Discount Cache: 500 items, 30s TTL
- Tax Cache: 500 items, 60s TTL
- Promotion Cache: 200 items, 60s TTL
- Rule Cache: 1000 items, 120s TTL

## Integration Points

### Order Integration

```javascript
import { getPricingEngine } from './pricing/pricingEngine.js';
import { getDiscountEngine } from './pricing/discountEngine.js';
import { getTaxEngine } from './pricing/taxEngine.js';
import { getPricingAuditTrail } from './pricing/auditTrail.js';

// Calculate final order price
function calculateOrderPrice(order) {
  const pricingEngine = getPricingEngine();
  const discountEngine = getDiscountEngine();
  const taxEngine = getTaxEngine();
  const auditTrail = getPricingAuditTrail();

  let subtotal = 0;

  // Calculate item prices
  order.items.forEach(item => {
    const pricing = pricingEngine.calculatePrice(item.basePrice, {
      menuItemId: item.menuItemId,
      categoryId: item.categoryId,
      branchId: order.branchId,
      customerGroup: order.customerGroup,
      quantity: item.quantity
    });

    item.finalPrice = pricing.finalPrice;
    subtotal += item.finalPrice * item.quantity;

    // Audit
    auditTrail.recordPriceCalculation({
      orderId: order.id,
      menuItemId: item.menuItemId,
      basePrice: item.basePrice,
      finalPrice: item.finalPrice,
      appliedRules: pricing.appliedRules
    });
  });

  // Apply discounts
  const discount = discountEngine.calculateDiscount(subtotal, {
    orderId: order.id,
    branchId: order.branchId,
    customerGroup: order.customerGroup,
    orderTotal: subtotal
  });

  subtotal = discount.finalAmount;

  // Audit discount
  auditTrail.recordDiscountApplied({
    orderId: order.id,
    discountAmount: discount.totalDiscount,
    appliedRules: discount.appliedRules
  });

  // Calculate tax
  const tax = taxEngine.calculateTax(subtotal, {
    branchId: order.branchId,
    categoryId: order.categoryId
  });

  // Audit tax
  auditTrail.recordTaxCalculated({
    orderId: order.id,
    taxAmount: tax.totalTax,
    taxCalculations: tax.taxCalculations
  });

  return {
    subtotal: discount.baseAmount,
    discount: discount.totalDiscount,
    tax: tax.totalTax,
    total: tax.finalAmount
  };
}
```

### POS Integration

```javascript
import { getPromotionEngine } from './pricing/promotionEngine.js';
import { getCouponEngine } from './pricing/couponEngine.js';
import { getApprovalEngine } from './pricing/approvalEngine.js';
import { getConflictResolutionEngine } from './pricing/conflictResolution.js';

// Apply promotion at POS
async function applyPromotionAtPOS(order, promotionId) {
  const promotionEngine = getPromotionEngine();
  const approvalEngine = getApprovalEngine();

  const promotion = promotionEngine.getPromotion(promotionId);
  if (!promotion) {
    return { success: false, reason: 'Promotion not found' };
  }

  // Check if approval required
  const approvalCheck = approvalEngine.checkApprovalRequired(
    'PROMOTION_OVERRIDE',
    { value: promotion.discountValue }
  );

  if (approvalCheck.required) {
    const request = approvalEngine.createApprovalRequest({
      type: 'PROMOTION_OVERRIDE',
      orderId: order.id,
      value: promotion.discountValue,
      requestedBy: getCurrentUserId()
    });

    if (request.approvalRequired) {
      return { 
        success: false, 
        requiresApproval: true,
        approvalRequestId: request.request.id 
      };
    }
  }

  // Apply promotion
  const result = promotionEngine.applyPromotion(promotionId, order.total, {
    orderId: order.id,
    customerId: order.customerId
  });

  return result;
}

// Redeem coupon at POS
async function redeemCouponAtPOS(order, couponCode) {
  const couponEngine = getCouponEngine();
  const auditTrail = getPricingAuditTrail();

  // Validate coupon
  const validation = couponEngine.validateCoupon(couponCode, {
    branchId: order.branchId,
    customerId: order.customerId,
    orderTotal: order.total
  });

  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  // Redeem coupon
  const redemption = couponEngine.redeemCoupon(couponCode, {
    orderId: order.id,
    customerId: order.customerId,
    orderTotal: order.total
  });

  // Audit
  auditTrail.recordCouponRedeemed({
    orderId: order.id,
    couponCode: couponCode,
    discountAmount: redemption.discountAmount
  });

  return redemption;
}
```

## Data Flow

### Price Calculation Flow

```
1. Order Created
   ↓
2. Get Applicable Pricing Rules
   ↓
3. Calculate Base Price (Pricing Engine)
   ↓
4. Get Applicable Discount Rules
   ↓
5. Calculate Discount (Discount Engine)
   ↓
6. Resolve Conflicts (Conflict Resolution)
   ↓
7. Check Approval Required (Approval Engine)
   ↓
8. Calculate Tax (Tax Engine)
   ↓
9. Audit All Calculations (Audit Trail)
   ↓
10. Return Final Price
```

### Promotion Application Flow

```
1. User Selects Promotion
   ↓
2. Validate Promotion (Promotion Engine)
   ↓
3. Check Schedule and Targeting
   ↓
4. Check Usage Limits
   ↓
5. Check Approval Required (Approval Engine)
   ↓
6. If Required: Request Approval
   ↓
7. Apply Promotion
   ↓
8. Track Usage
   ↓
9. Audit Application (Audit Trail)
   ↓
10. Update Order Total
```

## Configuration

### Default Settings

**Pricing Priority**: Emergency > Manual > VIP > Corporate > Membership > Happy Hour > Holiday > Weekend > Time > Day > Customer Group > Bulk > Branch > Base

**Discount Priority**: Manual > Staff > Customer > Buy X Get Y > Free Item > Combo > Bundle > Category > Item > Table > Automatic > Percentage > Fixed

**Conflict Resolution**: Highest Priority (default)

**Approval Thresholds**:
- Large Discount: 20%
- Price Override: 10%
- Refund: 100
- Void: 50
- Tax Override: 5%
- Promotion Override: Always
- Manual Discount: 15%
- Emergency Override: Always

**Cache TTL**:
- Pricing: 30s
- Discount: 30s
- Tax: 60s
- Promotion: 60s
- Rules: 120s

## Persistence

All pricing data is persisted in localStorage with the following keys:

- `cafeos_pricing_rules` - Pricing rules
- `cafeos_discount_rules` - Discount rules
- `cafeos_promotions` - Promotions
- `cafeos_coupons` - Coupons
- `cafeos_coupon_campaigns` - Coupon campaigns
- `cafeos_tax_rules` - Tax rules
- `cafeos_approval_requests` - Approval requests
- `cafeos_approval_thresholds` - Approval thresholds
- `cafeos_conflict_resolution` - Conflict resolution rules
- `cafeos_pricing_audit` - Audit trail

## Performance Considerations

### Caching Strategy

1. **LRU Cache**: Least recently used items are evicted first
2. **TTL-based Expiration**: Cache entries expire after configured time
3. **Separate Caches**: Different caches for different calculation types
4. **Batch Processing**: Process multiple calculations in batches
5. **Memoization**: Memoize expensive function calls

### Optimization Tips

1. Use batch processing for multiple items
2. Leverage caching for repeated calculations
3. Clean up expired cache entries periodically
4. Use appropriate TTL values based on data volatility
5. Monitor cache hit rates for optimization opportunities

## Security Considerations

1. **Approval Workflows**: Sensitive operations require manager approval
2. **Audit Trail**: All pricing decisions are recorded
3. **Immutable History**: Audit records cannot be modified
4. **Role-based Access**: Different roles have different permissions
5. **Threshold Enforcement**: Configurable limits prevent abuse

## Testing

### Unit Testing

Each engine should have unit tests covering:

- Rule creation and management
- Calculation accuracy
- Condition evaluation
- Cache behavior
- Edge cases

### Integration Testing

Test the full pricing flow:

1. Create order with items
2. Apply pricing rules
3. Apply discounts
4. Apply promotions
5. Calculate tax
6. Verify audit trail
7. Check approval requirements

### Performance Testing

Test with:

- 1000+ pricing rules
- 100+ active promotions
- 10000+ coupon redemptions
- Large order batches

## Future Enhancements

1. **Combo Engine**: Meal combos and bundles
2. **Visual Rule Builder**: No-code rule creation
3. **Loyalty Integration**: Points and rewards
4. **Pricing Simulator**: What-if analysis
5. **Scheduling System**: Advanced scheduling
6. **Analytics**: Promotion performance metrics
7. **Multi-currency Support**: Currency conversion
8. **Dynamic Pricing**: Real-time price adjustments
9. **AI Recommendations**: Smart pricing suggestions
10. **External Integrations**: Third-party pricing services

## API Reference

### Pricing Engine

```javascript
import { getPricingEngine, calculatePrice } from './pricing/pricingEngine.js';

const engine = getPricingEngine();
const result = calculatePrice(100, { menuItemId: 'item1', branchId: 'branch1' });
```

### Discount Engine

```javascript
import { getDiscountEngine, calculateDiscount } from './pricing/discountEngine.js';

const engine = getDiscountEngine();
const result = calculateDiscount(100, { orderId: 'order1', branchId: 'branch1' });
```

### Promotion Engine

```javascript
import { getPromotionEngine, getApplicablePromotions } from './pricing/promotionEngine.js';

const engine = getPromotionEngine();
const promotions = getApplicablePromotions({ customerId: 'cust1', branchId: 'branch1' });
```

### Coupon Engine

```javascript
import { getCouponEngine, validateCoupon, redeemCoupon } from './pricing/couponEngine.js';

const engine = getCouponEngine();
const validation = validateCoupon('CODE123', { customerId: 'cust1' });
const redemption = redeemCoupon('CODE123', { orderId: 'order1' });
```

### Tax Engine

```javascript
import { getTaxEngine, calculateTax } from './pricing/taxEngine.js';

const engine = getTaxEngine();
const result = calculateTax(100, { branchId: 'branch1', categoryId: 'cat1' });
```

### Approval Engine

```javascript
import { getApprovalEngine, checkApprovalRequired, createApprovalRequest } from './pricing/approvalEngine.js';

const engine = getApprovalEngine();
const check = checkApprovalRequired('LARGE_DISCOUNT', { value: 25 });
const request = createApprovalRequest({ type: 'LARGE_DISCOUNT', value: 25 });
```

### Conflict Resolution

```javascript
import { getConflictResolutionEngine, resolveConflicts } from './pricing/conflictResolution.js';

const engine = getConflictResolutionEngine();
const result = resolveConflicts([rule1, rule2], { baseAmount: 100 });
```

### Audit Trail

```javascript
import { getPricingAuditTrail, recordPriceCalculation } from './pricing/auditTrail.js';

const trail = getPricingAuditTrail();
trail.recordPriceCalculation({ orderId: 'order1', basePrice: 100, finalPrice: 90 });
const history = trail.getOrderPricingHistory('order1');
```

### Performance Optimizer

```javascript
import { getPricingPerformanceOptimizer } from './pricing/performanceOptimizer.js';

const optimizer = getPricingPerformanceOptimizer();
optimizer.cachePricing('key1', { price: 90 }, 30000);
const cached = optimizer.getCachedPricing('key1');
const stats = optimizer.getStatistics();
```

## Conclusion

The CafeOS Pricing Engine provides a comprehensive, enterprise-grade solution for managing all pricing-related operations. With its modular architecture, performance optimizations, and complete audit trail, it ensures accurate, efficient, and accountable pricing decisions across the entire platform.
