# CafeOS Deferred Features

This document lists features that are intentionally deferred for future production implementation. These features are not required for the demo unit and should only be implemented when a real client deployment requires them.

## Production-Only Features

### 1. Shift Tracking Integration
**Status:** UI exists in ClassicOrdersLayout but not integrated into main order flow  
**Location:** `src/components/ClassicOrdersLayout.jsx` (shifts state management)  
**Current State:** 
- Shift management modal exists in ClassicOrdersLayout
- Main Orders component receives `shifts={[]}` and `currentShift={null}` as hardcoded values
- No actual shift-to-order association in domain layer
- No cash reconciliation based on shift transactions

**Future Implementation:**
- Connect shift state from BrewCRM to Orders component
- Implement shift-based order tracking
- Add cash reconciliation matching shift transactions
- Implement shift handoff between terminals

**Demo Impact:** None - demo doesn't require staff shift management

---

### 2. Full Split-Payment Domain Logic
**Status:** UI exists but no domain validation  
**Location:** `src/components/orders/Orders.jsx` (splitBillCount, splitBillMode)  
**Current State:**
- Split bill UI shows split count selector
- Payment breakdown is stored but not validated
- No enforcement that splits sum to total
- No tracking of which items belong to which split

**Future Implementation:**
- Add domain-level split payment validation
- Create multiple payment records per split
- Track item-to-split assignment
- Implement split receipt generation

**Demo Impact:** None - full payment works fine for demo

---

### 3. True Order-Level Merge Logic
**Status:** Cart-level merge only, no domain support  
**Location:** `src/components/orders/ClassicOrdersLayout.jsx` (handleOrderMerge)  
**Current State:**
- Merge combines cart items with target order items
- No proper merged order record creation
- No payment reconciliation
- No audit trail for merged orders

**Future Implementation:**
- Implement order merge at domain model level
- Create new order referencing original orders
- Handle payment reconciliation
- Maintain audit trail

**Demo Impact:** None - basic order operations work fine

---

### 4. Contextual Refund UX
**Status:** Refund requires modal navigation  
**Location:** `src/components/orders/ClassicOrdersLayout.jsx` (refund modal)  
**Current State:**
- Refund requires manual order selection from dropdown
- Not directly accessible from order list
- Extra friction for refund workflow

**Future Implementation:**
- Add refund button directly to completed orders
- Contextual refund from order list
- Streamlined refund flow

**Demo Impact:** None - refund functionality works, just UX friction

---

### 5. Production Cloud Backup Integrations
**Status:** Local storage only  
**Location:** `src/cloud/BackupEngine.js`, `src/cloud/StorageEngine.js`  
**Current State:**
- BackupEngine supports cloud upload but no providers configured
- StorageEngine has placeholder cloud provider methods
- Demo uses localStorage only

**Future Implementation:**
- Configure actual cloud providers (AWS S3, Google Cloud Storage, Azure Blob)
- Implement proper cloud authentication
- Add cloud backup scheduling
- Implement multi-region redundancy

**Demo Impact:** None - localStorage backup works for demo

---

### 6. Advanced Delivery Platform Integrations
**Status:** Simulated delivery orders  
**Location:** `src/delivery/DeliveryPlatformFactory.js`  
**Current State:**
- Delivery platform factory exists but uses simulated data
- No actual Zomato/Swiggy API integration
- No real-time delivery tracking

**Future Implementation:**
- Integrate actual Zomato/Swiggy APIs
- Implement real-time order status sync
- Add delivery rider tracking
- Handle platform-specific order formats

**Demo Impact:** None - simulated delivery works for demo

---

### 7. Production Backend Security
**Status:** Client-side only  
**Location:** N/A (no backend exists)  
**Current State:**
- No server-side authentication
- No server-side RBAC
- No tenant isolation
- No server-side audit trail
- No secrets management
- No cloud storage security

**Future Implementation:**
- Implement server-side authentication (JWT, OAuth)
- Add server-side role-based access control
- Implement multi-tenant data isolation
- Add server-side audit logging
- Implement secrets management (HashiCorp Vault, AWS Secrets Manager)
- Add cloud storage security policies

**Demo Impact:** None - demo is client-side only by design

---

### 8. PDF/ZIP Export Formats
**Status:** Not exposed in UI  
**Location:** `src/cloud/ExportEngine.js`, `src/export/ExportEngine.js`  
**Current State:**
- ExportEngine has PDF/ZIP stub methods
- These formats are NOT exposed in the main UI
- Main ExportCenter component only offers CSV and JSON
- ExportImportCenter with PDF/ZIP support exists but is not integrated

**Future Implementation:**
- Implement actual PDF generation using jsPDF (already a dependency)
- Implement ZIP bundling using JSZip
- Integrate ExportImportCenter into main app if needed

**Demo Impact:** None - CSV and JSON exports work and are sufficient

---

## Implementation Priority

When implementing these features for production:

1. **High Priority** (required for first client):
   - Production backend security
   - Production cloud backup integrations
   - Advanced delivery platform integrations

2. **Medium Priority** (nice-to-have for operations):
   - Shift tracking integration
   - Contextual refund UX

3. **Low Priority** (can be deferred):
   - Full split-payment domain logic
   - True order-level merge logic
   - PDF/ZIP export formats

---

## Notes

- All deferred features are intentionally not blocking the demo
- Core POS functionality (orders, payments, inventory, KDS, tables, customers) is complete
- CSV and JSON export work correctly and are sufficient for demo
- No architectural changes are needed to implement these features later
- The demo unit is production-ready for demonstration purposes
