# CafeOS Runtime Modes Documentation

## Overview

CafeOS operates in four distinct runtime modes that determine data access, persistence, and operational behavior. This document defines the authoritative runtime mode system that replaces scattered environment checks and mode determinations.

## Canonical Runtime Mode Service

**Location:** `src/utils/runtimeMode.js`

This is the SINGLE AUTHORITY for runtime mode determination. All mode checks must use this service - no scattered environment checks or direct localStorage access.

### Import

```javascript
import {
  getRuntimeMode,
  isSetupMode,
  isDemoMode,
  isProductionMode,
  isMaintenanceMode,
  isDatasetAllowed,
  getDataSource,
  isProductionBackendConfigured,
  areOperationalWritesAllowed,
  isPersistenceEnabled,
  validateModeTransition,
  transitionMode,
  clearDemoData,
  getProductionBackendError,
  DATASET_CLASSIFICATION,
  INIT_DATASET_CLASSIFICATION,
  APP_MODES
} from '../utils/runtimeMode.js';
```

## Runtime States

### SETUP

**Purpose:** Initial configuration wizard for new installations

**Data Access:**
- Source: `empty` (no data loaded)
- Persistence: `false` (no data persistence)
- Operational Writes: `true` (configuration writes allowed)

**Allowed Datasets:**
- Only `LEGITIMATE_DEFAULT` datasets (configuration constants, empty arrays)
- All `DEMO_ONLY`, `TEST_ONLY`, and `PRODUCTION_FORBIDDEN` datasets are blocked

**Behavior:**
- User completes setup wizard to configure business details
- No operational data (orders, customers, etc.) can be created
- Configuration is persisted to localStorage
- On completion, transitions to PRODUCTION mode

**Entry:** Fresh installation or explicit reset
**Exit:** Setup wizard completion → PRODUCTION, or user choice → DEMO

---

### DEMO

**Purpose:** Demonstration mode with sample data for exploration and testing

**Data Access:**
- Source: `demo` (in-file demo constants)
- Persistence: `false` (data never persisted)
- Operational Writes: `true` (writes allowed but ephemeral)

**Allowed Datasets:**
- All datasets allowed (including demo data)
- `INIT_ORDERS`, `INIT_CUSTOMERS`, `INIT_KDS`, `INIT_STAFF`, `INIT_TABLES`, `INIT_INVENTORY`, etc.

**Behavior:**
- Pre-populated with sample orders, customers, staff, tables, inventory
- All operations work normally but data is lost on refresh
- No backend configuration required
- Ideal for product demos, training, and feature exploration

**Entry:** User selection from welcome screen
**Exit:** User choice → SETUP or PRODUCTION (with backend configuration)

---

### PRODUCTION

**Purpose:** Production mode with real business data and backend persistence

**Data Access:**
- Source: `backend` (configured storage backend)
- Persistence: `true` (all data persisted)
- Operational Writes: `true` (writes allowed and persisted)

**Allowed Datasets:**
- Only `LEGITIMATE_DEFAULT` and `PRODUCTION_SAFE` datasets
- All `DEMO_ONLY`, `TEST_ONLY`, and `PRODUCTION_FORBIDDEN` datasets are **BLOCKED**
- Demo data cannot be loaded under any circumstances

**Behavior:**
- Requires backend configuration (storage backend, business ID)
- All data persisted to configured backend
- Real orders, customers, inventory, staff records
- Analytics and reports reflect actual business data

**Critical Safety Rule:** PRODUCTION MUST NEVER silently fall back to demo data. If backend configuration is missing or unavailable, an explicit error is shown.

**Entry:** Setup wizard completion with backend configuration
**Exit:** User choice → MAINTENANCE or SETUP (reset)

---

### MAINTENANCE

**Purpose:** Maintenance mode for repairs, diagnostics, and read-only access

**Data Access:**
- Source: `backend` (read-only access)
- Persistence: `false` (read-only mode)
- Operational Writes: `false` (no operational writes allowed)

**Allowed Datasets:**
- No new data loading (read-only mode)
- Existing data can be viewed but not modified

**Behavior:**
- Read-only access to production data
- Used for diagnostics, data exports, repairs
- No new orders, customers, or operational changes
- System maintenance and troubleshooting

**Entry:** Explicit transition from PRODUCTION
**Exit:** Return to PRODUCTION or reset to SETUP

## Mode Transitions

### Valid Transitions

| From | To | Condition |
|------|-----|-----------|
| SETUP | DEMO | User selects demo mode |
| SETUP | PRODUCTION | Backend must be configured |
| DEMO | SETUP | User exits demo mode |
| DEMO | PRODUCTION | Backend must be configured, demo data cleared |
| PRODUCTION | MAINTENANCE | Explicit maintenance request |
| MAINTENANCE | PRODUCTION | Maintenance complete |
| PRODUCTION | SETUP | System reset (clears data) |
| MAINTENANCE | SETUP | System reset (clears data) |

### Invalid Transitions

- PRODUCTION → DEMO (cannot downgrade to demo with production data)
- MAINTENANCE → DEMO (cannot downgrade to demo with production data)
- Any transition without required backend configuration for PRODUCTION

### Transition Validation

```javascript
import { validateModeTransition, transitionMode } from '../utils/runtimeMode.js';

// Check if transition is allowed
const validation = validateModeTransition('PRODUCTION');
if (!validation.allowed) {
  console.error('Cannot transition:', validation.reason);
}

// Perform transition with validation
const result = transitionMode('PRODUCTION');
if (!result.success) {
  console.error('Transition failed:', result.reason);
}
```

## Dataset Classification

### Classification Types

| Classification | Description | Production Allowed |
|----------------|-------------|-------------------|
| `DEMO_ONLY` | Sample data for demo mode only | ❌ NO |
| `TEST_ONLY` | Test data for development/testing | ❌ NO |
| `PRODUCTION_FORBIDDEN` | Never allowed in production | ❌ NO |
| `LEGITIMATE_DEFAULT` | Safe default configuration (empty arrays, constants) | ✅ YES |
| `PRODUCTION_SAFE` | User-created or imported data | ✅ YES |

### INIT_* Dataset Classification

| Dataset | Classification | Production Allowed |
|---------|---------------|-------------------|
| `INIT_ORDERS` | DEMO_ONLY | ❌ NO |
| `INIT_CUSTOMERS` | DEMO_ONLY | ❌ NO |
| `INIT_KDS` | DEMO_ONLY | ❌ NO |
| `INIT_STAFF` | DEMO_ONLY | ❌ NO |
| `INIT_TABLES` | DEMO_ONLY | ❌ NO |
| `INIT_INVENTORY` | DEMO_ONLY | ❌ NO |
| `INIT_EXPENSES` | DEMO_ONLY | ❌ NO |
| `INIT_QR_CODES` | DEMO_ONLY | ❌ NO |
| `INIT_PRODUCTION_BATCHES` | DEMO_ONLY | ❌ NO |
| `INIT_DRIVERS` | DEMO_ONLY | ❌ NO |
| `INIT_DELIVERY_ORDERS` | DEMO_ONLY | ❌ NO |
| `INIT_ROUTES` | DEMO_ONLY | ❌ NO |
| `INIT_SUPPLIERS` | DEMO_ONLY | ❌ NO |
| `INIT_PURCHASE_ORDERS` | DEMO_ONLY | ❌ NO |
| `MENU_ITEMS` | LEGITIMATE_DEFAULT | ✅ YES |
| Configuration constants | LEGITIMATE_DEFAULT | ✅ YES |

### Production Safety Guards

All `INIT_*` datasets are wrapped with runtime mode checks:

```javascript
export const INIT_ORDERS = (() => {
  if (!isDatasetAllowed('INIT_ORDERS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeOrders(LEGACY_INIT_ORDERS);
})();
```

If production mode attempts to load demo data, an explicit error is thrown:
```
Production mode requires a configured backend. Please complete the setup wizard to configure your storage backend, or switch to DEMO mode to explore the system without configuration.
```

## Production Backend Configuration

### Required Configuration

Production mode requires backend configuration stored in `localStorage` under `cafeos_production_config`:

```javascript
{
  "storageBackend": "localStorage|firebase|supabase|custom",
  "businessId": "unique-business-identifier",
  "backendUrl": "https://api.example.com", // optional
  "apiKey": "api-key-if-needed" // optional
}
```

### Configuration Check

```javascript
import { isProductionBackendConfigured, getProductionConfig } from '../utils/runtimeMode.js';

if (!isProductionBackendConfigured()) {
  // Show configuration error or setup wizard
  console.error(getProductionBackendError());
}

const config = getProductionConfig();
if (config) {
  console.log('Backend:', config.storageBackend);
  console.log('Business ID:', config.businessId);
}
```

## Data Access Patterns

### Reading Data

```javascript
import { getRuntimeMode, isDemoMode, isProductionMode } from '../utils/runtimeMode.js';

const mode = getRuntimeMode();

if (isDemoMode()) {
  // Load demo data from constants
  orders = INIT_ORDERS;
} else if (isProductionMode()) {
  // Load from backend
  orders = await fetchFromBackend('/orders');
}
```

### Writing Data

```javascript
import { areOperationalWritesAllowed, isPersistenceEnabled } from '../utils/runtimeMode.js';

if (!areOperationalWritesAllowed()) {
  throw new Error('Operational writes not allowed in current mode');
}

const newOrder = createOrder(orderData);

if (isPersistenceEnabled()) {
  await saveToBackend(newOrder);
}
// In demo mode, writes are allowed but not persisted
```

### Dataset Loading

```javascript
import { isDatasetAllowed } from '../utils/runtimeMode.js';

if (isDatasetAllowed('INIT_ORDERS')) {
  orders = INIT_ORDERS;
} else {
  orders = []; // Empty array for production
}
```

## Prohibited Behavior

### PRODUCTION Mode Restrictions

1. **No Demo Data Loading**
   - Cannot load `INIT_ORDERS`, `INIT_CUSTOMERS`, or any `DEMO_ONLY` datasets
   - Throws explicit error if attempted

2. **No Silent Fallback**
   - If backend is unavailable, show explicit error
   - Never fall back to demo data or empty state silently

3. **No Mode Downgrade**
   - Cannot transition from PRODUCTION to DEMO
   - Prevents accidental data loss

### MAINTENANCE Mode Restrictions

1. **No Operational Writes**
   - Cannot create new orders, customers, inventory
   - Cannot modify existing operational data
   - Read-only access for diagnostics only

2. **No Data Loading**
   - Cannot load new datasets
   - Cannot import data

## Failure Behavior

### Missing Backend Configuration

When PRODUCTION mode is entered without backend configuration:

1. **Explicit Error Message**
   ```
   Production mode requires a configured backend. 
   Please complete the setup wizard to configure your storage backend, 
   or switch to DEMO mode to explore the system without configuration.
   ```

2. **UI Response**
   - Show error banner or modal
   - Offer option to complete setup wizard
   - Offer option to switch to DEMO mode

3. **No Silent Fallback**
   - Do not load demo data
   - Do not proceed with empty state
   - Block all operations until configured

### Backend Unavailable

When configured backend is unreachable:

1. **Explicit Error Message**
   - Show backend connection error
   - Display last known state if available
   - Offer retry option

2. **No Silent Fallback**
   - Do not switch to demo mode
   - Do not load local cache as production data
   - Maintain production mode with error state

## Testing Requirements

### Test Coverage

1. **Demo Mode Tests**
   - DEMO loads demo data
   - DEMO does not persist data on refresh
   - DEMO allows all operational writes

2. **Production Mode Tests**
   - PRODUCTION does not load demo data
   - PRODUCTION with missing backend configuration fails explicitly
   - PRODUCTION with configured backend loads real data
   - PRODUCTION persists data to backend

3. **Setup Mode Tests**
   - SETUP does not load demo data
   - SETUP only allows legitimate default datasets
   - SETUP allows configuration writes
   - SETUP transitions to PRODUCTION after configuration

4. **Maintenance Mode Tests**
   - MAINTENANCE blocks normal operational writes
   - MAINTENANCE allows read-only access
   - MAINTENANCE transitions back to PRODUCTION

5. **Mode Transition Tests**
   - Invalid transitions are blocked
   - Valid transitions require proper configuration
   - Switching modes cannot leak demo records into production state
   - Demo data is cleared when transitioning to PRODUCTION

## Migration from Old System

### Removed Environment Variables

- `VITE_BREWCRM_MODE` - Replaced by canonical runtime mode service
- Direct `DATA_MODE` checks - Use `getDataSource()` instead
- Direct `isLocalMode` checks - Use `isPersistenceEnabled()` instead

### Updated Imports

**Old:**
```javascript
import { isDemoMode, isProductionMode } from '../utils/appMode.js';
const DATA_MODE = import.meta.env?.VITE_BREWCRM_MODE === "local" ? "local" : "demo";
```

**New:**
```javascript
import { 
  getRuntimeMode, 
  isDemoMode, 
  isProductionMode,
  getDataSource,
  isPersistenceEnabled 
} from '../utils/runtimeMode.js';
```

### Updated Data Loading

**Old:**
```javascript
const orders = isLocalMode 
  ? loadLocalCollection("orders", []) 
  : INIT_ORDERS;
```

**New:**
```javascript
const dataSource = getDataSource();
const orders = dataSource.source === 'demo' 
  ? INIT_ORDERS 
  : loadFromBackend('orders');
```

## Best Practices

1. **Always Use Canonical Service**
   - Never check environment variables directly
   - Never access localStorage for mode determination
   - Always import from `runtimeMode.js`

2. **Validate Before Transitions**
   - Always call `validateModeTransition()` before `transitionMode()`
   - Show user-friendly error messages for invalid transitions
   - Clear demo data when transitioning to PRODUCTION

3. **Check Dataset Permissions**
   - Always use `isDatasetAllowed()` before loading INIT_* data
   - Handle production safety errors gracefully
   - Show explicit error messages for blocked datasets

4. **Respect Write Permissions**
   - Always check `areOperationalWritesAllowed()` before writes
   - Respect `isPersistenceEnabled()` for data persistence
   - Block operations in MAINTENANCE mode

5. **Never Silent Fallback**
   - Always show explicit errors for missing configuration
   - Never fall back to demo data in production
   - Never proceed with degraded state without user awareness

## Troubleshooting

### Issue: "Production mode requires a configured backend"

**Cause:** Attempting to use PRODUCTION mode without completing setup wizard or configuring backend.

**Solution:**
1. Complete setup wizard to configure backend
2. Or switch to DEMO mode for exploration
3. Check `cafeos_production_config` in localStorage

### Issue: Demo data loading in production

**Cause:** Direct import of INIT_* datasets without mode check.

**Solution:**
1. Wrap dataset imports with `isDatasetAllowed()` check
2. Use canonical runtime mode service for all mode checks
3. Remove direct environment variable checks

### Issue: Mode transition blocked

**Cause:** Attempting invalid transition or missing required configuration.

**Solution:**
1. Check `validateModeTransition()` result for reason
2. Ensure backend is configured for PRODUCTION transitions
3. Clear demo data before transitioning to PRODUCTION

## Summary

The canonical runtime mode service provides:

- **Single Authority:** One source of truth for mode determination
- **Production Safety:** Explicit blocking of demo data in production
- **Clear Transitions:** Validated mode transitions with proper guards
- **Dataset Classification:** Clear rules for what data can load in each mode
- **No Silent Fallbacks:** Explicit errors for missing configuration
- **Comprehensive Testing:** Test coverage for all mode behaviors

This ensures deterministic and safe behavior across SETUP, DEMO, PRODUCTION, and MAINTENANCE modes.
