# CafeOS Deployment Architecture

## NON-NEGOTIABLE DEPLOYMENT ARCHITECTURE

THIS IS CRITICAL. DO NOT DEVIATE FROM THIS MODEL.

CafeOS has a MASTER DEMO UNIT.

The master demo unit is the clean reference implementation.

When a client is acquired:

1. DUPLICATE the master CafeOS project/folder/repository.
2. The duplicated copy becomes the CLIENT-SPECIFIC CafeOS instance.
3. Configure that client instance against THEIR backend.
4. Configure that client instance against THEIR cloud/storage infrastructure.
5. Disable/remove DEMO-mode behavior from the client production instance through the existing runtime architecture.
6. Configure the client's production environment.
7. Integrate the separate license-gate system into the client instance.

The license-gate system is a SEPARATE PROJECT.

DO NOT redesign it.
DO NOT merge it into CafeOS.
DO NOT modify its architecture.
DO NOT treat it as part of the CafeOS demo.
Only provide the appropriate integration boundary/hooks required to connect it to a client deployment.

---

## MASTER/DEMO INSTANCE RULE

The master/demo instance must remain:

- frontend/demo-safe
- independent of client backends
- independent of client cloud storage
- independent of client credentials
- independent of client production data
- independent of client configuration
- independent of the license-gate implementation

NEVER introduce a specific client's:

- credentials
- API keys
- backend URLs
- database identifiers
- storage credentials
- tenant IDs
- production configuration
- production data
- license-gate credentials/configuration

into the master/demo instance.

---

## CLIENT INSTANCE RULE

Each duplicated client instance is isolated from every other client.

Client A's configuration must never be shared with Client B.

Each client gets its own:

- backend connection
- database/tenant configuration
- storage configuration
- production configuration
- credentials/secrets
- environment variables
- integrations
- deployment configuration
- license-gate integration

DO NOT create a shared client configuration layer unless explicitly requested.

---

## MASTER → CLIENT PROMOTION MODEL

The intended lifecycle is:

```
MASTER DEMO
    ↓
DUPLICATE
    ↓
CLIENT INSTANCE
    ↓
Configure backend
    ↓
Configure cloud/storage
    ↓
Configure business
    ↓
Configure integrations
    ↓
Configure production security
    ↓
Disable DEMO behavior
    ↓
Connect separate license-gate system
    ↓
Production validation
    ↓
CLIENT PRODUCTION
```

The master demo must remain untouched throughout this process.

---

## STRICT CHANGE CONTROL

When making changes during this task:

DO NOT:
- redesign the architecture unnecessarily
- rewrite working systems
- introduce a backend into the demo
- integrate client infrastructure into the demo
- modify the license-gate project
- create hidden dependencies between client instances
- hardcode client configuration
- remove demo functionality from the master
- make assumptions about a future client's backend/cloud provider

DO:
- create clean configuration boundaries
- make production integrations configurable
- make DEMO and PRODUCTION initialization clearly separated
- make client onboarding repeatable
- preserve existing functionality
- preserve the master/demo unit as the canonical source
- document exactly what changes during client onboarding

---

## CLIENT ONBOARDING OBJECTIVE

The ideal future client onboarding process should require:

```
DUPLICATE MASTER
+
CLIENT BACKEND CONFIGURATION
+
CLIENT CLOUD/STORAGE CONFIGURATION
+
CLIENT BUSINESS CONFIGURATION
+
CLIENT INTEGRATIONS
+
LICENSE-GATE INTEGRATION
=
PRODUCTION CLIENT
```

There should NOT be another CafeOS rewrite for every client.

Any finding that would currently require manually modifying core CafeOS source code for every client should be explicitly reported as:

**CLIENT-SPECIFIC CODE CHANGE**

and, where practical, redesigned into configuration/integration instead.

---

## FINAL SAFETY CHECK

Before completing this task, verify:

1. Master DEMO still works.
2. DEMO mode remains the default for the master.
3. No client-specific infrastructure was introduced.
4. No license-gate code was modified.
5. No backend was introduced into the master.
6. No production credentials were added.
7. Client configuration boundaries are clearly defined.
8. Production mode can be activated only through the intended production configuration path.
9. Demo data cannot accidentally become client production data.
10. A duplicated instance can be configured independently without modifying the master.

If any change could violate these rules, STOP and report it rather than making the change automatically.

These deployment boundaries are NON-NEGOTIABLE.

---

## Current Implementation Status

### Master Demo Unit (Current State)

✅ **Frontend-only architecture** - No backend dependencies
✅ **Demo mode default** - `getAppMode()` defaults to `APP_MODES.DEMO`
✅ **LocalStorage persistence** - No external storage dependencies
✅ **No client credentials** - No hardcoded API keys, URLs, or secrets
✅ **Setup blocked in demo** - SetupWizard explicitly blocks in DEMO mode
✅ **Clean reference implementation** - All core workflows functional

### Configuration Boundaries

The following configuration points are designed for client-specific configuration:

1. **Runtime Mode** (`src/utils/runtimeMode.js`, `src/utils/appMode.js`)
   - DEMO mode for master/demo unit
   - PRODUCTION mode for client instances
   - SETUP mode for initial client configuration
   - Mode transitions are controlled and audited

2. **Data Source** (`src/utils/runtimeMode.js`)
   - In-memory data for DEMO mode
   - LocalStorage for local development
   - Configurable for client backend integration

3. **Storage Providers** (`src/cloud/StorageEngine.js`)
   - Multiple provider implementations (AWS S3, GCS, Azure, etc.)
   - Configurable via environment variables or runtime configuration
   - No provider is hardcoded as default

4. **Payment Gateways** (`src/payment/PaymentGatewayFactory.js`)
   - Multiple gateway implementations (Razorpay, Stripe, etc.)
   - Configurable per client deployment
   - Demo mode uses simulated payments

5. **Delivery Platforms** (`src/delivery/DeliveryPlatformFactory.js`)
   - Multiple platform integrations (Zomato, Swiggy, etc.)
   - Configurable per client
   - Demo mode uses simulated delivery

### Client Onboarding Checklist

When duplicating master for a client:

- [ ] Duplicate entire project/repository
- [ ] Configure runtime mode to PRODUCTION
- [ ] Configure backend connection (if applicable)
- [ ] Configure storage provider credentials
- [ ] Configure payment gateway credentials
- [ ] Configure delivery platform credentials (if applicable)
- [ ] Configure business details (name, address, tax rates)
- [ ] Configure menu items and inventory
- [ ] Configure staff and roles
- [ ] Configure tables and floor plan
- [ ] Integrate license-gate system
- [ ] Test production workflows
- [ ] Validate security configuration
- [ ] Deploy to client infrastructure

### Integration Points for License-Gate System

The following integration points are available for connecting a separate license-gate system:

1. **Authentication Hook** (`src/utils/authService.js`)
   - `login()` function can be extended to validate license
   - Session management can include license validation

2. **Runtime Mode Hook** (`src/utils/runtimeMode.js`)
   - Mode transitions can require license validation
   - PRODUCTION mode activation can be gated by license

3. **Permission Service** (`src/utils/permissionService.js`)
   - Permission checks can include license-based restrictions
   - Feature flags can be controlled by license tier

4. **Security Event Logging** (`src/security/SecurityEventManager.js`)
   - License validation events can be logged
   - Audit trail can include license status

---

## Architecture Diagram

```
CAFEOS MASTER / DEMO
                           │
                           │ DUPLICATE
                           ▼
                  CLIENT-SPECIFIC COPY
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        Client Backend   Client Cloud   License Gate
              │            │            │
              └────────────┼────────────┘
                           ▼
                    CLIENT PRODUCTION
```

---

## Key Principle

**Master = sacred. Client copy = disposable/configurable.**

This gives you a clean golden image. If Client A gets heavily customized, you don't contaminate the thing you're going to duplicate for Client B.
