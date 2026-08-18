# LocalStorage Usage Audit

**Date:** 2026-08-12  
**Phase:** Phase 4 - Canonical Persistence Architecture  
**Scope:** All localStorage/sessionStorage usage in CafeOS

---

## Summary

- **Total localStorage references:** 1,028 matches across 264 files
- **Total sessionStorage references:** 13 matches across 3 files
- **Classification:** See below

---

## Classification Categories

- **A. UI Preference** - User interface choices (theme, layout, tab selection)
- **B. Temporary Client State** - Ephemeral state that doesn't need persistence
- **C. Legitimate Offline Cache** - Cached data for offline functionality
- **D. Business Data** - Core business records (orders, customers, etc.)
- **E. Credential/Secret** - Encryption keys, passwords, tokens
- **F. Security-Sensitive Data** - Security logs, audit trails, compliance data
- **G. Unknown** - Usage requiring further investigation

---

## Classified Usage

### A. UI Preferences (Legitimate - Retain)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `BrewCRM.jsx` | `brewcrm_tab` | Active tab selection | UI state, user convenience |
| `BrewCRM.jsx` | `brew-theme` | Theme selection | UI preference |
| `ThemeProvider.jsx` | `brew-theme` | Theme selection | UI preference |
| `ThemePersistence.js` | `brew-theme-{businessId}` | Per-business theme | UI preference |

### B. Temporary Client State (Legitimate - Retain)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `BrewCRM.jsx` | `cafeos_visited` | First visit flag | One-time UX state |
| `GuestOrder.jsx` | `guest_order_{code}` | Temporary guest session | Ephemeral session data |

### C. Legitimate Offline Cache (Legitimate - Retain)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `utils/offlineSync.ts` | Various | Offline sync queue | Offline functionality |
| `payment/OfflinePaymentQueue.js` | `cafeos_offline_payments` | Offline payment queue | Offline functionality |

### D. Business Data (CRITICAL - Must Migrate to Repository)

| File | Keys | Domain | Current Storage | Target Storage |
|------|------|--------|-----------------|----------------|
| `BrewCRM.jsx` | `brewcrm_local_orders` | Orders | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_customers` | Customers | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_kdsCards` | KDS | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_menuItems` | Menu | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_tables` | Tables | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_staff` | Staff | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_inventory` | Inventory | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_expenses` | Expenses | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_qrCodes` | QR Codes | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_productionBatches` | Production | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_drivers` | Delivery | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_routes` | Routes | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_guestSessions` | Guest Sessions | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_waiterCalls` | Waiter Calls | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_suppliers` | Suppliers | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_purchaseOrders` | Purchasing | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_documents` | Documents | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_workflows` | Workflows | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_workflowExecutions` | Workflow Executions | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_workflowTemplates` | Workflow Templates | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_workflowVersions` | Workflow Versions | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_incidents` | Incidents | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_approvals` | Approvals | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_timelineEvents` | Timeline Events | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_automationRules` | Automation Rules | localStorage | Supabase Repository |
| `BrewCRM.jsx` | `brewcrm_local_deliveryOrders` | Delivery Orders | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_orders` | Orders | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_customers` | Customers | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_staff` | Staff | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_tables` | Tables | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_inventory` | Inventory | localStorage | Supabase Repository |
| `AppContext.jsx` | `cafeos_menu` | Menu | localStorage | Supabase Repository |

### E. Credentials/Secrets (CRITICAL - Must Use Secure Storage)

| File | Keys | Purpose | Current Storage | Target Storage |
|------|------|---------|-----------------|----------------|
| `security/CredentialVault.js` | `cafeos_credential_vault` | Credential storage | localStorage | Secure Vault |
| `security/CredentialVault.js` | `cafeos_vault_key` | Encryption key | localStorage | Secure Vault |
| `security/SecretVault.js` | `cafeos_secret_vault` | Secret storage | localStorage | Secure Vault |
| `security/SecretVault.js` | `cafeos_vault_key` | Encryption key | localStorage | Secure Vault |
| `security/EncryptionEngine.js` | `cafeos_encryption_key` | Encryption key | localStorage | Secure Vault |

### F. Security-Sensitive Data (CRITICAL - Must Use Secure Storage)

| File | Keys | Purpose | Current Storage | Target Storage |
|------|------|---------|-----------------|----------------|
| `payment/RegulatoryCompliance.js` | `cafeos_card_tokens` | Card token mappings | localStorage | Secure Storage |
| `payment/RegulatoryCompliance.js` | `cafeos_compliance_log` | Compliance events | localStorage | Audit Log Repository |
| `payment/DataLocalization.js` | `cafeos_data_migration_log` | Migration log | localStorage | Audit Log Repository |
| `payment/SMSReceipt.js` | `cafeos_sms_receipt_log` | SMS receipt log | localStorage | Audit Log Repository |
| `security/SecurityEventManager.js` | `cafeos_security_events` | Security events | localStorage | Audit Log Repository |
| `security/PermissionEngine.js` | `cafeos_permission_engine` | Permission state | localStorage | Secure Storage |
| `security/DataLossPrevention.js` | `cafeos_dlp_state` | DLP state | localStorage | Secure Storage |
| `security/IntegrityVerifier.js` | `cafeos_integrity_verifier` | Integrity records | localStorage | Audit Log Repository |
| `security/OwnerVerification.js` | `cafeos_owner_verification` | Verification history | localStorage | Audit Log Repository |

### G. Configuration/Settings (Mixed - Evaluate Per Case)

| File | Keys | Purpose | Classification | Action |
|------|------|---------|---------------|--------|
| `utils/appMode.js` | `cafeos_app_mode` | Runtime mode | Configuration | Retain (runtime mode service) |
| `utils/runtimeMode.js` | `cafeos_production_config` | Production config | Configuration | Retain (runtime mode service) |
| `utils/appMode.js` | `cafeos_setup_state` | Setup state | Configuration | Retain (setup service) |
| `BrewCRM.jsx` | `brewcrm_settings` | App settings | Configuration | Migrate to Settings Repository |
| `payment/PaymentGatewayFactory.js` | `cafeos_gateway_configs` | Gateway configs | Configuration | Migrate to Settings Repository |
| `payment/PaymentGatewayFactory.js` | `cafeos_payment_settings` | Payment settings | Configuration | Migrate to Settings Repository |
| `payment/RegulatoryCompliance.js` | `cafeos_compliance_settings` | Compliance settings | Configuration | Migrate to Settings Repository |
| `payment/DataLocalization.js` | `cafeos_data_localization` | Localization settings | Configuration | Migrate to Settings Repository |
| `payment/LowDataMode.js` | `cafeos_low_data_mode` | Low data mode settings | Configuration | Migrate to Settings Repository |
| `payment/SMSReceipt.js` | `cafeos_sms_receipt` | SMS settings | Configuration | Migrate to Settings Repository |
| `payment/PaymentI18n.js` | `cafeos_payment_language` | Language preference | UI Preference | Retain |
| `payment/QRCodePayment.js` | `cafeos_static_qr` | Static QR code | Configuration | Migrate to Settings Repository |
| `utils/featureConfig.js` | `cafeos_feature_config` | Feature flags | Configuration | Migrate to Settings Repository |
| `utils/shiftManagement.js` | Various | Shift state | Configuration | Migrate to Settings Repository |
| `backup/BackupManager.js` | `cafeos_backup_manager` | Backup state | Configuration | Migrate to Settings Repository |
| `backup/BackupNotificationManager.js` | `cafeos_backup_notifications` | Notification history | Configuration | Migrate to Settings Repository |

### H. Backup/Restore/Export (Special Case - Keep as Is)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `backup/BackupEngine.js` | `cafeos_*` | Backup extraction | Backup system uses localStorage as source |
| `cloud/BackupEngine.js` | Various | Cloud backup state | Backup system state |
| `cloud/ImportEngine.js` | Various | Import state | Import/export system |
| `export/DestinationManager.js` | Various | Export destinations | Import/export system |

### I. Cloud/Storage Providers (Special Case - Keep as Is)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `cloud/providers/LocalStorageProvider.js` | Various | LocalStorage provider | Provider implementation |
| `cloud/StorageEngine.js` | Various | Storage engine state | Storage system |
| `cloud/AttachmentStorage.js` | Various | Attachment metadata | Storage system |

### J. Health/Diagnostics (Special Case - Keep as Is)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `health/providers/DatabaseHealthCheck.js` | Various | Health check state | Diagnostics |
| `utils/healthMonitoring.js` | Various | Health monitoring | Diagnostics |

### K. Operations/Sync (Special Case - Keep as Is)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `operations/SelfHealingEngine.js` | Various | Self-healing state | Operations system |
| `operations/WebSocketManager.js` | Various | WebSocket state | Operations system |
| `operations/StatePersistence.js` | Various | State persistence | Operations system |
| `sync/SyncEngine.js` | Various | Sync state | Sync system |

### L. Utility/Helper (Special Case - Keep as Is)

| File | Keys | Purpose | Justification |
|------|------|---------|---------------|
| `operations/LocalStorageManager.js` | Various | Storage management | Storage utility |
| `utils/storageHelper.js` | Various | Storage helpers | Storage utility |
| `utils/storageRecovery.js` | Various | Storage recovery | Storage utility |
| `utils/DailyArchive.js` | Various | Daily archive | Archive utility |
| `utils/backupScheduler.js` | Various | Backup scheduling | Backup utility |
| `utils/backupManager.js` | Various | Backup management | Backup utility |
| `utils/sequenceManager.js` | Various | Sequence management | Utility |
| `utils/notificationService.js` | Various | Notification state | Notification system |

---

## Migration Priority

### Priority 1: Core Business Data (Highest Value)

1. **Orders** - `brewcrm_local_orders`, `cafeos_orders`
2. **Customers** - `brewcrm_local_customers`, `cafeos_customers`
3. **Menu** - `brewcrm_local_menuItems`, `cafeos_menu`
4. **Inventory** - `brewcrm_local_inventory`, `cafeos_inventory`
5. **Staff** - `brewcrm_local_staff`, `cafeos_staff`
6. **Tables** - `brewcrm_local_tables`, `cafeos_tables`

### Priority 2: Secondary Business Data

7. **Expenses** - `brewcrm_local_expenses`
8. **Production** - `brewcrm_local_productionBatches`
9. **Delivery** - `brewcrm_local_drivers`, `brewcrm_local_routes`, `brewcrm_local_deliveryOrders`
10. **Purchasing** - `brewcrm_local_suppliers`, `brewcrm_local_purchaseOrders`
11. **Documents** - `brewcrm_local_documents`
12. **Workflows** - `brewcrm_local_workflows`, `brewcrm_local_workflowExecutions`, etc.

### Priority 3: Settings/Configuration

13. **Settings** - `brewcrm_settings`, gateway configs, payment settings, etc.

### Priority 4: Security/Audit

14. **Audit Logs** - Compliance logs, security events, migration logs
15. **Credentials** - Move to secure vault

---

## Files Requiring Direct Changes

### Core Components (Direct localStorage access)

1. `src/components/BrewCRM.jsx` - All business data collections
2. `src/context/AppContext.jsx` - All business data collections

### Security Components (Credential storage)

3. `src/security/CredentialVault.js`
4. `src/security/SecretVault.js`
5. `src/security/EncryptionEngine.js`
6. `src/security/PermissionEngine.js`
7. `src/security/DataLossPrevention.js`
8. `src/security/IntegrityVerifier.js`
9. `src/security/OwnerVerification.js`
10. `src/security/SecurityEventManager.js`

### Payment Components (Settings and logs)

11. `src/payment/PaymentGatewayFactory.js`
12. `src/payment/PaymentGateway.js`
13. `src/payment/RegulatoryCompliance.js`
14. `src/payment/DataLocalization.js`
15. `src/payment/SMSReceipt.js`
16. `src/payment/LowDataMode.js`
17. `src/payment/QRCodePayment.js`
18. `src/payment/PaymentI18n.js`
19. `src/payment/OfflinePaymentQueue.js`

### Settings Components

20. `src/utils/featureConfig.js`
21. `src/utils/shiftManagement.js`

---

## Retention Policy

### Keep in localStorage (Justified)

- UI preferences (theme, tab selection)
- Runtime mode configuration
- Setup state
- First visit flag
- Offline sync queue
- Backup/restore system state
- Cloud provider state
- Health/diagnostics state
- Operations/sync state
- Storage utility state

### Migrate to Repository (Business Data)

- All business collections (orders, customers, menu, etc.)
- Settings and configuration
- Audit logs

### Migrate to Secure Storage (Security)

- Encryption keys
- Credentials
- Secrets
- Security-sensitive state

---

## SessionStorage Usage

| File | Keys | Purpose | Classification |
|------|------|---------|---------------|
| `export/DestinationManager.js` | Various | Export temporary state | Temporary Client State |
| `utils/setupSecurity.js` | Various | Setup temporary state | Temporary Client State |
| `pages/GuestOrder.jsx` | Various | Guest session state | Temporary Client State |

**Status:** SessionStorage usage is minimal and appropriate for temporary state. No changes required.

---

## Summary Statistics

- **Total localStorage keys identified:** ~100+
- **Business data keys:** 26 (Priority 1-2)
- **Settings/configuration keys:** ~15 (Priority 3)
- **Security/credential keys:** ~10 (Priority 4)
- **UI preference keys:** 4 (Retain)
- **System state keys:** ~50+ (Retain - special systems)
- **Files requiring direct changes:** ~20+

---

## Next Steps

1. Design repository interfaces for Priority 1 domains
2. Create base repository and Supabase provider
3. Migrate Orders domain first
4. Add tests proving no localStorage dependency
5. Repeat for remaining Priority 1 domains
6. Create LOCAL_STORAGE_POLICY.md
7. Create PERSISTENCE_ARCHITECTURE.md
