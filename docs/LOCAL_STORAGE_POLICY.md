# LocalStorage Policy

**Date:** 2026-08-12  
**Phase:** Phase 4 - Canonical Persistence Architecture  
**Purpose:** Define allowed and prohibited uses of localStorage in CafeOS

---

## Policy Statement

localStorage must only be used for specific, justified purposes. Business data, credentials, and security-sensitive information must use the canonical repository pattern with appropriate storage providers (Supabase for production, secure vault for credentials).

---

## Classification Categories

### A. UI Preferences (ALLOWED)

**Definition:** User interface choices that enhance user experience but are not business-critical.

**Allowed Uses:**
- Theme selection
- Tab selection
- Layout preferences
- UI state that improves user convenience

**Examples:**
- `brewcrm_tab` - Active tab in main UI
- `brew-theme` - Selected theme
- `brew-theme-{businessId}` - Per-business theme selection

**Justification:** These are purely UI preferences that improve user experience. Losing them does not affect business operations.

**Storage Duration:** Persistent (until user clears browser data)

**Security Impact:** Low

---

### B. Temporary Client State (ALLOWED)

**Definition:** Ephemeral state that exists only for the current session or one-time UX flow.

**Allowed Uses:**
- First visit flag
- Temporary session data
- One-time UX state

**Examples:**
- `cafeos_visited` - First visit flag for welcome screen
- `guest_order_{code}` - Temporary guest order session

**Justification:** These are temporary flags that control UX flows. They are not business data.

**Storage Duration:** Session-based or one-time

**Security Impact:** Low

---

### C. Legitimate Offline Cache (ALLOWED)

**Definition:** Cached data specifically for offline functionality.

**Allowed Uses:**
- Offline sync queue
- Offline payment queue
- Cached data for offline access

**Examples:**
- `cafeos_offline_payments` - Offline payment queue
- Various sync queue keys in `src/utils/offlineSync.ts`

**Justification:** These are explicitly for offline functionality. They are temporary caches that sync to the backend when online.

**Storage Duration:** Temporary (synced when online)

**Security Impact:** Medium (may contain business data temporarily)

**Requirements:**
- Must sync to backend when online
- Must be encrypted if sensitive
- Must have conflict resolution
- Must be cleared after successful sync

---

### D. Business Data (PROHIBITED)

**Definition:** Core business records that are the authoritative data for the application.

**Prohibited Uses:**
- Orders
- Customers
- Menu items
- Inventory
- Staff
- Tables
- Expenses
- Production batches
- Delivery data
- Purchasing data
- Documents
- Workflows
- Any other business-critical data

**Examples:**
- `brewcrm_local_orders` - ❌ PROHIBITED
- `brewcrm_local_customers` - ❌ PROHIBITED
- `brewcrm_local_menuItems` - ❌ PROHIBITED
- `brewcrm_local_inventory` - ❌ PROHIBITED
- `brewcrm_local_staff` - ❌ PROHIBITED
- `brewcrm_local_tables` - ❌ PROHIBITED
- `cafeos_orders` - ❌ PROHIBITED
- `cafeos_customers` - ❌ PROHIBITED
- All other business collections - ❌ PROHIBITED

**Justification:** Business data must use the canonical repository pattern with Supabase (or appropriate backend) for production. localStorage is not a reliable or secure storage for business data.

**Required Action:** Migrate to repository pattern

**Target Storage:** Supabase (production), LocalStorage provider (demo/offline only)

---

### E. Credentials/Secrets (PROHIBITED)

**Definition:** Encryption keys, passwords, tokens, and other sensitive credentials.

**Prohibited Uses:**
- Encryption keys
- API keys
- Passwords
- Access tokens
- Secret keys

**Examples:**
- `cafeos_encryption_key` - ❌ PROHIBITED
- `cafeos_vault_key` - ❌ PROHIBITED
- `cafeos_credential_vault` - ❌ PROHIBITED
- `cafeos_secret_vault` - ❌ PROHIBITED

**Justification:** Credentials must be stored in a secure vault with proper encryption and access controls. localStorage is not secure for credentials.

**Required Action:** Migrate to secure vault

**Target Storage:** Secure vault (CredentialVault, SecretVault)

---

### F. Security-Sensitive Data (PROHIBITED)

**Definition:** Security logs, audit trails, compliance data, and other security-sensitive information.

**Prohibited Uses:**
- Security event logs
- Audit trails
- Compliance logs
- Security state
- Permission state

**Examples:**
- `cafeos_security_events` - ❌ PROHIBITED
- `cafeos_compliance_log` - ❌ PROHIBITED
- `cafeos_data_migration_log` - ❌ PROHIBITED
- `cafeos_sms_receipt_log` - ❌ PROHIBITED
- `cafeos_permission_engine` - ❌ PROHIBITED
- `cafeos_dlp_state` - ❌ PROHIBITED
- `cafeos_integrity_verifier` - ❌ PROHIBITED
- `cafeos_owner_verification` - ❌ PROHIBITED

**Justification:** Security-sensitive data must be stored in secure storage or audit log repository with proper access controls and immutability.

**Required Action:** Migrate to secure storage or audit log repository

**Target Storage:** Secure storage, Audit log repository

---

### G. Configuration/Settings (MIXED)

**Definition:** Application configuration and settings. Some are allowed, some must migrate.

**Allowed (Runtime Mode Service):**
- `cafeos_app_mode` - Runtime mode (SETUP, DEMO, PRODUCTION, MAINTENANCE)
- `cafeos_production_config` - Production backend configuration
- `cafeos_setup_state` - Setup wizard state

**Justification:** These are part of the runtime mode service and control application behavior. They are not business data.

**Must Migrate (Settings Repository):**
- `brewcrm_settings` - App settings
- `cafeos_gateway_configs` - Payment gateway configs
- `cafeos_payment_settings` - Payment settings
- `cafeos_compliance_settings` - Compliance settings
- `cafeos_data_localization` - Localization settings
- `cafeos_low_data_mode` - Low data mode settings
- `cafeos_sms_receipt` - SMS settings
- `cafeos_static_qr` - Static QR code
- `cafeos_feature_config` - Feature flags
- Various shift management state
- `cafeos_backup_manager` - Backup manager state
- `cafeos_backup_notifications` - Notification history

**Justification:** These are business settings that should be persisted to the backend for consistency across devices and users.

**Required Action:** Migrate to Settings Repository

**Target Storage:** Supabase settings table

---

### H. Backup/Restore/Export (SPECIAL CASE)

**Definition:** Backup, restore, and export system state.

**Allowed Uses:**
- Backup engine state
- Cloud backup state
- Import/export state
- Export destination settings

**Examples:**
- Various keys in `src/backup/BackupEngine.js`
- Various keys in `src/cloud/BackupEngine.js`
- Various keys in `src/cloud/ImportEngine.js`
- Various keys in `src/export/DestinationManager.js`

**Justification:** These are system state for backup/restore functionality. The backup system itself uses localStorage as a source for extraction, but this is a special case.

**Storage Duration:** Temporary (during backup/restore operations)

**Security Impact:** Medium (may contain business data temporarily)

**Requirements:**
- Must be cleared after backup/restore
- Must be encrypted if sensitive
- Must not persist business data long-term

---

### I. Cloud/Storage Providers (SPECIAL CASE)

**Definition:** Cloud storage provider implementations and state.

**Allowed Uses:**
- LocalStorage provider state
- Storage engine state
- Attachment metadata
- Provider-specific state

**Examples:**
- Various keys in `src/cloud/providers/LocalStorageProvider.js`
- Various keys in `src/cloud/StorageEngine.js`
- Various keys in `src/cloud/AttachmentStorage.js`

**Justification:** These are provider implementations that may use localStorage as a storage backend. This is a legitimate use case for the provider pattern.

**Storage Duration:** Depends on provider

**Security Impact:** Varies by provider

**Requirements:**
- Must follow provider security guidelines
- Must be documented
- Must be optional (can use other providers)

---

### J. Health/Diagnostics (SPECIAL CASE)

**Definition:** Health check and diagnostics system state.

**Allowed Uses:**
- Health check state
- Diagnostics data
- Monitoring state

**Examples:**
- Various keys in `src/health/providers/DatabaseHealthCheck.js`
- Various keys in `src/utils/healthMonitoring.js`

**Justification:** These are for system health monitoring and diagnostics. They are not business data.

**Storage Duration:** Temporary (for monitoring)

**Security Impact:** Low

---

### K. Operations/Sync (SPECIAL CASE)

**Definition:** Operations system and sync engine state.

**Allowed Uses:**
- Self-healing engine state
- WebSocket state
- State persistence
- Sync engine state

**Examples:**
- Various keys in `src/operations/SelfHealingEngine.js`
- Various keys in `src/operations/WebSocketManager.js`
- Various keys in `src/operations/StatePersistence.js`
- Various keys in `src/sync/SyncEngine.js`

**Justification:** These are operational state for system functionality. They are not business data.

**Storage Duration:** Temporary (for operations)

**Security Impact:** Low

---

### L. Utility/Helper (SPECIAL CASE)

**Definition:** Storage utilities and helper functions.

**Allowed Uses:**
- Storage management state
- Storage helpers
- Storage recovery state
- Archive state
- Backup scheduling state
- Backup management state
- Sequence management state
- Notification state

**Examples:**
- Various keys in `src/operations/LocalStorageManager.js`
- Various keys in `src/utils/storageHelper.js`
- Various keys in `src/utils/storageRecovery.js`
- Various keys in `src/utils/DailyArchive.js`
- Various keys in `src/utils/backupScheduler.js`
- Various keys in `src/utils/backupManager.js`
- Various keys in `src/utils/sequenceManager.js`
- Various keys in `src/utils/notificationService.js`

**Justification:** These are utility functions that manage storage. They are system utilities, not business data.

**Storage Duration:** Varies by utility

**Security Impact:** Low

---

## SessionStorage Policy

### Allowed Uses

sessionStorage is allowed for:
- Temporary session data
- Export temporary state
- Setup temporary state
- Guest session state

**Examples:**
- Various keys in `src/export/DestinationManager.js`
- Various keys in `src/utils/setupSecurity.js`
- Various keys in `src/pages/GuestOrder.jsx`

**Justification:** sessionStorage is appropriate for truly temporary state that should not persist across sessions.

**Storage Duration:** Session only (cleared when tab closes)

**Security Impact:** Low

**Status:** Current usage is minimal and appropriate. No changes required.

---

## Migration Requirements

### Business Data (Category D)

**Action Required:** Migrate all business data to repository pattern

**Steps:**
1. Create repository interface (if not exists)
2. Implement Supabase provider
3. Create domain service
4. Create React hook
5. Migrate component to use hook
6. Remove direct localStorage access
7. Add tests proving no localStorage dependency

**Priority:** High (Priority 1: Orders, Customers, Menu, Inventory, Staff, Tables)

### Credentials/Secrets (Category E)

**Action Required:** Migrate to secure vault

**Steps:**
1. Use CredentialVault for credential storage
2. Use SecretVault for secret storage
3. Remove direct localStorage access
4. Ensure encryption at rest
5. Add access controls

**Priority:** Critical (security risk)

### Security-Sensitive Data (Category F)

**Action Required:** Migrate to secure storage or audit log repository

**Steps:**
1. Create audit log repository interface
2. Implement Supabase provider for audit logs
3. Migrate security event logging
4. Migrate compliance logging
5. Ensure immutability
6. Add access controls

**Priority:** High (security/compliance)

### Settings/Configuration (Category G)

**Action Required:** Migrate business settings to Settings Repository

**Steps:**
1. Create Settings repository interface
2. Implement Supabase provider
3. Create Settings service
4. Create React hook
5. Migrate components to use hook
6. Remove direct localStorage access

**Priority:** Medium (Priority 3)

---

## Enforcement

### Code Review

All code changes must be reviewed for localStorage usage:
- New localStorage usage must be justified
- Existing localStorage usage must be classified
- Prohibited usage must be rejected

### Linting

Consider adding ESLint rules to:
- Warn on direct localStorage access in business logic
- Enforce use of repository pattern for business data
- Enforce use of secure vault for credentials

### Testing

Tests must verify:
- Repository implementations do not use localStorage
- Components use repository pattern, not direct localStorage
- Secure vault is used for credentials
- Audit logs use repository pattern

---

## Exceptions

### Demo Mode

In DEMO mode, localStorage may be used for:
- Demo data (ephemeral)
- Demo settings (ephemeral)

**Justification:** Demo mode is intentionally ephemeral. Data is not persisted.

**Requirements:**
- Must be clearly marked as demo-only
- Must not persist to production
- Must be cleared when exiting demo mode

### Offline Mode

In offline mode, localStorage may be used for:
- Offline sync queue
- Offline payment queue
- Cached data for offline access

**Justification:** Offline functionality requires local caching.

**Requirements:**
- Must sync to backend when online
- Must be encrypted if sensitive
- Must have conflict resolution
- Must be cleared after successful sync

### Testing

In tests, localStorage may be used for:
- Test fixtures
- Test state
- Mocking localStorage

**Justification:** Tests may need to mock localStorage for testing legacy code.

**Requirements:**
- Must be clearly marked as test-only
- Must not affect production code
- Must be cleaned up after tests

---

## Compliance

### Data Protection

- Personal data must not be stored in localStorage
- Sensitive data must be encrypted
- Access must be controlled
- Data must be deletable on request

### Audit Trail

- All localStorage usage must be documented
- Changes to localStorage policy must be reviewed
- Exceptions must be approved and documented

### Security

- Credentials must be in secure vault
- Security-sensitive data must be in secure storage
- Business data must be in repository pattern
- Regular security audits required

---

## Summary

### Allowed localStorage Uses

1. **UI Preferences** (Category A) - Theme, tab selection
2. **Temporary Client State** (Category B) - First visit flag, temporary sessions
3. **Legitimate Offline Cache** (Category C) - Offline sync queue, offline payment queue
4. **Runtime Mode Configuration** (Category G subset) - App mode, production config, setup state
5. **Special Systems** (Categories H-L) - Backup, cloud providers, health, operations, utilities

### Prohibited localStorage Uses

1. **Business Data** (Category D) - Orders, customers, menu, inventory, staff, tables, etc.
2. **Credentials/Secrets** (Category E) - Encryption keys, API keys, passwords, tokens
3. **Security-Sensitive Data** (Category F) - Security logs, audit trails, compliance data
4. **Business Settings** (Category G subset) - App settings, payment settings, feature flags, etc.

### Migration Priority

1. **Critical:** Credentials/Secrets (Category E) - Security risk
2. **High:** Business Data (Category D, Priority 1) - Orders, Customers, Menu, Inventory, Staff, Tables
3. **High:** Security-Sensitive Data (Category F) - Audit logs, compliance logs
4. **Medium:** Business Settings (Category G) - Settings repository

### Documentation

Every remaining localStorage usage must be explainable by this policy. If a usage doesn't fit these categories, it must be either:
- Migrated to appropriate storage
- Justified as a new category (requires approval)
- Marked as temporary with clear removal plan

---

## References

- `docs/LOCAL_STORAGE_AUDIT.md` - Detailed audit of all localStorage usage
- `docs/PERSISTENCE_ARCHITECTURE.md` - Canonical persistence architecture
- `docs/RUNTIME_MODES.md` - Runtime mode documentation
- `src/repository/` - Repository pattern implementation
