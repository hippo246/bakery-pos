# CafeOS Persistence Architecture

**Date:** 2026-08-12  
**Phase:** Phase 4 - Canonical Persistence Architecture  
**Purpose:** Document the canonical data flow and repository pattern for CafeOS

---

## Overview

CafeOS uses a layered persistence architecture that separates UI concerns from data access. The architecture follows the canonical pattern:

```
UI Components
↓
Hooks / Controllers
↓
Domain Services
↓
Repositories
↓
Storage Providers (Supabase, localStorage, etc.)
```

This ensures:
- UI components never directly access storage
- Repositories are provider-independent
- Storage can be swapped without changing business logic
- Clear separation of concerns

---

## Canonical Data Flow

### Read Flow

```
UI Component
  ↓ (requests data)
React Hook / Controller
  ↓ (calls service)
Domain Service
  ↓ (calls repository)
Repository Interface
  ↓ (delegates to provider)
Storage Provider (Supabase/Local)
  ↓ (returns data)
Repository Interface
  ↓ (returns result)
Domain Service
  ↓ (returns processed data)
React Hook / Controller
  ↓ (exposes state)
UI Component
```

### Write Flow

```
UI Component
  ↓ (dispatches action)
React Hook / Controller
  ↓ (validates input)
Domain Service
  ↓ (applies business logic)
Repository Interface
  ↓ (delegates to provider)
Storage Provider (Supabase/Local)
  ↓ (persists data)
Repository Interface
  ↓ (returns result)
Domain Service
  ↓ (returns success/error)
React Hook / Controller
  ↓ (updates state)
UI Component
```

---

## Repository Layer

### Base Repository Interface

**Location:** `src/repository/BaseRepository.js`

All repositories extend the `BaseRepository` class which provides:
- Standard CRUD operations (`findById`, `findAll`, `create`, `update`, `delete`)
- Query options (filters, sorting, pagination)
- Error handling wrapper (`_execute`)
- Validation helpers (`_validateRequired`)
- Filter/sort/pagination helpers

**Key Methods:**
```javascript
async findById(id, options)
async findAll(options)
async findBy(field, value, options)
async create(data)
async update(id, data)
async delete(id)
async upsert(data, id)
async count(options)
async exists(id)
```

### Domain Repository Interfaces

Each business domain has its own repository interface:

| Domain | Repository | Location |
|--------|-----------|----------|
| Orders | `OrderRepository` | `src/repository/OrderRepository.js` |
| Customers | `CustomerRepository` | `src/repository/CustomerRepository.js` |
| Menu | `MenuRepository` | `src/repository/MenuRepository.js` |
| Inventory | `InventoryRepository` | `src/repository/InventoryRepository.js` |
| Staff | `StaffRepository` | `src/repository/StaffRepository.js` |
| Tables/Branches | `TableRepository` | `src/repository/TableRepository.js` |

### Repository Factory

**Location:** `src/repository/RepositoryFactory.js`

The `RepositoryFactory` creates repository instances based on the configured storage provider:

```javascript
import { getRepositoryFactory } from './repository/RepositoryFactory.js';

const factory = getRepositoryFactory({
  provider: 'supabase',
  supabase: supabaseClient,
  tenantId: 'tenant-123',
  businessId: 'business-456'
});

const orderRepo = factory.createOrderRepository();
const customerRepo = factory.createCustomerRepository();
```

---

## Storage Provider Layer

### Provider Pattern

Each storage provider implements the repository interfaces:

```
Repository Interface (abstract)
  ↓
Provider Implementation (concrete)
  ↓
Storage Backend (Supabase, localStorage, etc.)
```

### Supabase Provider

**Location:** `src/repository/providers/SupabaseOrderRepository.js`

The Supabase provider implements repository interfaces using Supabase as the backend:

**Key Characteristics:**
- Uses public (anon) client credentials
- Relies on Row Level Security (RLS) for data isolation
- Supports tenant/business filtering
- Provider-independent (implements repository interface)

**Security Note:**
- Browser-side access uses public client credentials with RLS
- Service-role credentials remain server-side only (Edge Functions, server infrastructure)
- Never expose service-role key in browser code

### LocalStorage Provider (TODO)

A localStorage provider implementation is planned for:
- DEMO mode (ephemeral data)
- Offline fallback
- Testing

**Status:** Not yet implemented

---

## Repository Interface Examples

### Order Repository

```javascript
import { getRepositoryFactory } from './repository/RepositoryFactory.js';

const factory = getRepositoryFactory();
const orderRepo = factory.createOrderRepository();

// Find by ID
const result = await orderRepo.findById('order-123');
if (result.success) {
  console.log(result.data);
}

// Find by status
const activeOrders = await orderRepo.findByStatus('NEW');

// Find by table
const tableOrders = await orderRepo.findByTable('table-5');

// Create order
const newOrder = await orderRepo.create({
  id: 'order-456',
  source: 'WALK_IN',
  customer: { name: 'John Doe' },
  items: [{ id: 'item-1', name: 'Coffee', price: 5 }],
  amount: 5
});

// Update status
await orderRepo.updateStatus('order-456', 'PREPARING');

// Get statistics
const stats = await orderRepo.getStatistics();
```

### Customer Repository

```javascript
const customerRepo = factory.createCustomerRepository();

// Find by phone
const customer = await customerRepo.findByPhone('+1234567890');

// Search customers
const results = await customerRepo.search('John');

// Update tier
await customerRepo.updateTier('customer-123', 'GOLD');

// Add visit
await customerRepo.addVisit('customer-123', {
  date: new Date().toISOString(),
  amount: 50
});
```

---

## Provider Responsibilities

### Repository Interface

- Define domain-specific operations
- Provide type safety (when TypeScript is added)
- Abstract storage implementation details
- Handle validation and business rules
- Return consistent result format

### Storage Provider

- Implement repository interface for specific backend
- Handle backend-specific query syntax
- Map data structures between repository and backend
- Handle connection management
- Implement retry logic for transient failures

### Storage Backend

- Supabase: PostgreSQL database with RLS
- localStorage: Browser local storage (for demo/offline)
- Future: Other backends (Firebase, MongoDB, etc.)

---

## LocalStorage Policy

### Allowed Uses

localStorage is allowed only for:

1. **UI Preferences** (Category A)
   - Theme selection
   - Tab selection
   - Layout preferences

2. **Temporary Client State** (Category B)
   - First visit flag
   - Temporary session data

3. **Legitimate Offline Cache** (Category C)
   - Offline sync queue
   - Offline payment queue

4. **Configuration** (Runtime Mode Service)
   - Runtime mode (SETUP, DEMO, PRODUCTION, MAINTENANCE)
   - Production backend configuration
   - Setup state

5. **System State** (Special Systems)
   - Backup/restore system state
   - Cloud provider state
   - Health/diagnostics state
   - Operations/sync state

### Prohibited Uses

localStorage is **NOT** allowed for:

1. **Business Data** (Category D)
   - Orders, customers, menu, inventory, staff, tables
   - Must use repository pattern with Supabase in production

2. **Credentials/Secrets** (Category E)
   - Encryption keys, passwords, tokens
   - Must use secure vault

3. **Security-Sensitive Data** (Category F)
   - Security logs, audit trails, compliance data
   - Must use secure storage or audit log repository

See `docs/LOCAL_STORAGE_POLICY.md` for detailed policy.

---

## Offline Policy

### Offline Mode

CafeOS supports offline operation through:

1. **Offline Sync Queue** (`src/utils/offlineSync.ts`)
   - Queues operations when offline
   - Syncs when connection restored
   - Stored in localStorage (legitimate use)

2. **Offline Payment Queue** (`src/payment/OfflinePaymentQueue.js`)
   - Queues payments when offline
   - Processes when connection restored
   - Stored in localStorage (legitimate use)

3. **Repository Layer** (Future)
   - LocalStorage provider for offline fallback
   - Automatic sync when online
   - Conflict resolution

### Offline Data Access

When offline:
- Read from local cache (if available)
- Queue writes for later sync
- Show offline status in UI
- Limit functionality to offline-capable features

---

## Migration Status

### Priority 1: Core Business Data (Highest Value)

| Domain | Repository Interface | Supabase Provider | LocalStorage Provider | Component Migration | Status |
|--------|---------------------|-------------------|----------------------|---------------------|--------|
| Orders | ✅ Complete | ✅ Complete | ❌ TODO | ❌ TODO | Interface Ready |
| Customers | ✅ Complete | ❌ TODO | ❌ TODO | ❌ TODO | Interface Ready |
| Menu | ✅ Complete | ❌ TODO | ❌ TODO | ❌ TODO | Interface Ready |
| Inventory | ✅ Complete | ❌ TODO | ❌ TODO | ❌ TODO | Interface Ready |
| Staff | ✅ Complete | ❌ TODO | ❌ TODO | ❌ TODO | Interface Ready |
| Tables | ✅ Complete | ❌ TODO | ❌ TODO | ❌ TODO | Interface Ready |

### Priority 2: Secondary Business Data

| Domain | Repository Interface | Supabase Provider | LocalStorage Provider | Component Migration | Status |
|--------|---------------------|-------------------|----------------------|---------------------|--------|
| Expenses | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Production | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Delivery | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Purchasing | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Documents | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Workflows | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |

### Priority 3: Settings/Configuration

| Domain | Repository Interface | Supabase Provider | LocalStorage Provider | Component Migration | Status |
|--------|---------------------|-------------------|----------------------|---------------------|--------|
| Settings | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |

### Priority 4: Security/Audit

| Domain | Repository Interface | Supabase Provider | LocalStorage Provider | Component Migration | Status |
|--------|---------------------|-------------------|----------------------|---------------------|--------|
| Audit Logs | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |
| Credentials | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | Not Started |

---

## Component Migration Strategy

### Migration Steps

1. **Create Repository Interface** (if not exists)
   - Define domain-specific methods
   - Extend BaseRepository
   - Add JSDoc documentation

2. **Implement Supabase Provider** (if not exists)
   - Implement repository interface
   - Use public client credentials with RLS
   - Add tenant/business filtering

3. **Create Domain Service** (if not exists)
   - Business logic layer
   - Uses repository for persistence
   - React-free

4. **Create React Hook** (if not exists)
   - Wraps domain service
   - Exposes React state
   - Handles loading/error states

5. **Migrate Component**
   - Remove direct localStorage access
   - Use React hook for data access
   - Preserve existing behavior
   - Add tests

6. **Remove Obsolete Code**
   - Remove direct localStorage calls
   - Remove old data loading logic
   - Clean up unused imports

### Example Migration

**Before (Direct localStorage):**
```javascript
const [orders, setOrders] = useState(() => {
  const saved = localStorage.getItem('cafeos_orders');
  return saved ? JSON.parse(saved) : [];
});

const saveOrder = (order) => {
  setOrders(prev => [...prev, order]);
  localStorage.setItem('cafeos_orders', JSON.stringify([...orders, order]));
};
```

**After (Repository Pattern):**
```javascript
import { useOrders } from '../hooks/useOrders.js';

const { orders, loading, error, createOrder } = useOrders();

const handleSaveOrder = async (order) => {
  const result = await createOrder(order);
  if (result.success) {
    // Order saved successfully
  }
};
```

---

## Security Considerations

### Supabase Security

1. **Public Client Credentials**
   - Used for browser-side access
   - Limited permissions via RLS
   - Never expose service-role key

2. **Row Level Security (RLS)**
   - Enforces tenant isolation
   - Enforces business isolation
   - Enforces user permissions
   - Critical for multi-tenancy

3. **Service-Role Credentials**
   - Server-side only (Edge Functions, server infrastructure)
   - Full admin access
   - Never in browser code

### Data Encryption

1. **Sensitive Data**
   - Credentials stored in secure vault
   - Encryption keys managed by vault
   - Never in plain localStorage

2. **Transit Encryption**
   - HTTPS for all Supabase connections
   - TLS 1.2+ required
   - Certificate validation

### Audit Logging

1. **Security Events**
   - All security-sensitive operations logged
   - Stored in audit log repository
   - Immutable records

2. **Compliance**
   - Regulatory compliance events logged
   - Data migration events tracked
   - Payment compliance events recorded

---

## Testing Strategy

### Repository Tests

Test repository implementations without localStorage dependency:

```javascript
// Example test for SupabaseOrderRepository
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SupabaseOrderRepository } from '../repository/providers/SupabaseOrderRepository.js';

describe('SupabaseOrderRepository', () => {
  let repository;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new SupabaseOrderRepository(mockSupabase, {
      tenantId: 'test-tenant',
      businessId: 'test-business'
    });
  });

  it('should find order by ID', async () => {
    const result = await repository.findById('order-123');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('order-123');
  });

  it('should create order', async () => {
    const result = await repository.create({
      id: 'order-456',
      source: 'WALK_IN',
      customer: { name: 'Test' },
      items: [],
      amount: 0
    });
    expect(result.success).toBe(true);
  });

  it('should not use localStorage', () => {
    // Verify no localStorage calls
    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

Test full data flow from UI to repository:

```javascript
describe('Order Data Flow', () => {
  it('should load orders from repository', async () => {
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toBeDefined();
  });

  it('should create order via repository', async () => {
    const { result } = renderHook(() => useOrders());
    const order = await result.current.createOrder(testOrder);
    expect(order.success).toBe(true);
  });
});
```

---

## Remaining Work

### Immediate Next Steps

1. **Complete Supabase Providers**
   - Implement SupabaseCustomerRepository
   - Implement SupabaseMenuRepository
   - Implement SupabaseInventoryRepository
   - Implement SupabaseStaffRepository
   - Implement SupabaseTableRepository

2. **Create Domain Services**
   - OrderService (business logic)
   - CustomerService
   - MenuService
   - InventoryService
   - StaffService
   - TableService

3. **Create React Hooks**
   - useOrders
   - useCustomers
   - useMenu
   - useInventory
   - useStaff
   - useTables

4. **Migrate Components**
   - Start with Orders component
   - Then Customers
   - Then Menu
   - Then Inventory
   - Then Staff
   - Then Tables

5. **Add Tests**
   - Repository tests (prove no localStorage dependency)
   - Service tests
   - Hook tests
   - Integration tests

### Future Work

1. **LocalStorage Provider**
   - Implement for demo/offline mode
   - Add sync with Supabase
   - Conflict resolution

2. **Additional Domains**
   - Expenses, Production, Delivery
   - Purchasing, Documents, Workflows
   - Settings, Audit Logs

3. **TypeScript Migration**
   - Add type definitions
   - Type-safe repositories
   - Type-safe services

4. **Performance Optimization**
   - Query optimization
   - Caching strategy
   - Batch operations

---

## Summary

The canonical persistence architecture provides:

- **Clear Separation:** UI never directly accesses storage
- **Provider Independence:** Storage can be swapped without changing business logic
- **Type Safety:** Repository interfaces define clear contracts
- **Security:** RLS enforces data isolation, service-role keys server-side only
- **Testability:** Repositories can be tested without UI or storage
- **Scalability:** Easy to add new domains and providers

**Current Status:**
- Repository interfaces: ✅ Complete for Priority 1 domains
- Supabase providers: ✅ Orders, ❌ Others TODO
- Component migration: ❌ Not started
- Tests: ❌ Not started

**Next Priority:** Complete Supabase providers for remaining Priority 1 domains, then begin component migration starting with Orders.
