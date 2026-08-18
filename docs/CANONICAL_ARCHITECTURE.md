# CafeOS Canonical Architecture

**Branch:** recovery-audit-baseline  
**Date:** 2026-08-11  
**Phase:** Phase 2 - Canonical Architecture Consolidation  
**Purpose:** Document canonical implementations for all capabilities

---

## Application Structure

### Entry Points
- **CANONICAL:** `src/main.jsx` → `src/App.jsx` → `src/components/BrewCRM.jsx`
- **CANONICAL:** `src/App.jsx` → `src/pages/GuestOrder.jsx` (guest ordering)

### Routing
- **CANONICAL:** Path-based detection in App.jsx (no react-router)
- **Pattern:** `/guest/<code>` triggers GuestOrder component
- **Status:** Simple but functional

### Lazy Loading
- **CANONICAL:** 20+ components lazy-loaded in BrewCRM.jsx
- **Pattern:** `lazy(() => import("./path/Component"))`
- **Status:** Properly implemented

---

## Component Architecture

### Theme System
- **CANONICAL:** `src/theme/` - Theme provider and styles
- **CANONICAL:** `src/components/themed/` - Theme wrapper components (9 files)
- **CANONICAL:** `src/components/classic-pos/` - Classic POS theme (7 files)
- **CANONICAL:** `src/components/fast-food/` - Fast food theme (21 files)
- **CANONICAL:** `src/components/accessibility/` - Accessibility theme (3 files)
- **CANONICAL:** `src/components/bakery/` - Bakery theme (3 files)
- **CANONICAL:** `src/components/bar/` - Bar theme (3 files)
- **CANONICAL:** `src/components/cafe/` - Cafe theme (3 files)
- **CANONICAL:** `src/components/fine-dining/` - Fine dining theme (3 files)
- **CANONICAL:** `src/components/classic/` - Classic theme (6 files)

### Feature Components
- **CANONICAL:** `src/components/dashboard/` - Dashboard components
- **CANONICAL:** `src/components/orders/` - Order management
- **CANONICAL:** `src/components/kitchen/` - Kitchen display system
- **CANONICAL:** `src/components/crm/` - Customer relationship management
- **CANONICAL:** `src/components/analytics/` - Analytics and reports
- **CANONICAL:** `src/components/menu/` - Menu management
- **CANONICAL:** `src/components/inventory/` - Inventory management
- **CANONICAL:** `src/components/staff/` - Staff management
- **CANONICAL:** `src/components/tables/` - Table management (includes TableEngine.js, FloorEngine.js)
- **CANONICAL:** `src/components/settings/` - Settings management
- **CANONICAL:** `src/components/payment/` - Payment processing
- **CANONICAL:** `src/components/backup/` - Backup and restore
- **CANONICAL:** `src/components/cloud/` - Cloud integration
- **CANONICAL:** `src/components/security/` - Security features
- **CANONICAL:** `src/components/delivery/` - Delivery management
- **CANONICAL:** `src/components/expenses/` - Expense tracking
- **CANONICAL:** `src/components/qr/` - QR code ordering
- **CANONICAL:** `src/components/production/` - Production management
- **CANONICAL:** `src/components/tracking/` - Route tracking
- **CANONICAL:** `src/components/purchasing/` - Purchasing desk
- **CANONICAL:** `src/components/documents/` - Document management
- **CANONICAL:** `src/components/operations/` - Operations dashboard
- **CANONICAL:** `src/components/workflows/` - Workflow management
- **CANONICAL:** `src/components/notifications/` - Notifications
- **CANONICAL:** `src/components/intelligence/` - Intelligence dashboard
- **CANONICAL:** `src/components/health/` - System health
- **CANONICAL:** `src/components/permissions/` - Permission management
- **CANONICAL:** `src/components/setup/` - Setup wizard
- **CANONICAL:** `src/components/layout/` - Layout components
- **CANONICAL:** `src/components/common/` - Common components
- **CANONICAL:** `src/components/waiter/` - Waiter operations
- **CANONICAL:** `src/components/guest/` - Guest ordering
- **CANONICAL:** `src/components/reservations/` - Reservations
- **CANONICAL:** `src/components/remote/` - Remote assistance
- **CANONICAL:** `src/components/export/` - Export functionality
- **CANONICAL:** `src/components/terminal/` - Terminal management

### Legacy Components
- **LEGACY:** `src/components/fastfood-pos/` - May be superseded by fast-food folder
- **UNKNOWN:** Status needs verification

---

## Domain Layer

### Domain Models
- **CANONICAL:** `src/domain/orderModel.js` - Order data model
- **CANONICAL:** `src/domain/customerModel.js` - Customer data model
- **CANONICAL:** `src/domain/staffModel.js` - Staff data model
- **CANONICAL:** `src/domain/tableModel.js` - Table data model
- **CANONICAL:** `src/domain/inventoryModel.js` - Inventory data model
- **CANONICAL:** `src/domain/kdsModel.js` - Kitchen display system model
- **CANONICAL:** `src/domain/permissionModel.js` - Permission data model
- **CANONICAL:** `src/domain/roleModel.js` - Role data model
- **CANONICAL:** `src/domain/auditLogModel.js` - Audit logging model
- **CANONICAL:** `src/domain/operationLogModel.js` - Operation logging model
- **CANONICAL:** `src/domain/lockModel.js` - Distributed locking model
- **CANONICAL:** `src/domain/heartbeatModel.js` - Heartbeat model
- **CANONICAL:** `src/domain/crashRecoveryModel.js` - Crash recovery model
- **CANONICAL:** `src/domain/ids.js` - ID generation utilities
- **CANONICAL:** `src/domain/dates.js` - Date utilities
- **CANONICAL:** `src/domain/normalize.js` - Data normalization
- **CANONICAL:** `src/domain/qrModel.js` - QR code model
- **CANONICAL:** `src/domain/documentModel.js` - Document model
- **CANONICAL:** `src/domain/expenseModel.js` - Expense model
- **CANONICAL:** `src/domain/productionModel.js` - Production model
- **CANONICAL:** `src/domain/purchasingModel.js` - Purchasing model
- **CANONICAL:** `src/domain/workflowModel.js` - Workflow model
- **CANONICAL:** `src/domain/orderDuplicate.js` - Order duplicate detection
- **CANONICAL:** `src/domain/orderLifecycle.js` - Order lifecycle management
- **CANONICAL:** `src/domain/orderOfflineQueue.js` - Order offline queue
- **CANONICAL:** `src/domain/orderReferences.js` - Order references
- **CANONICAL:** `src/domain/orderWarnings.js` - Order warnings
- **CANONICAL:** `src/domain/orderPerformance.js` - Order performance
- **CANONICAL:** `src/domain/operationsModel.js` - Operations model
- **CANONICAL:** `src/domain/healthModel.js` - Health model
- **CANONICAL:** `src/domain/intelligenceModel.js` - Intelligence model
- **CANONICAL:** `src/domain/notificationModel.js` - Notification model
- **CANONICAL:** `src/domain/tenantModel.js` - Tenant model

---

## Security Architecture

### Authentication
- **CANONICAL:** `src/utils/authService.js` - Authentication service (36 matches)
- **CANONICAL:** `src/security/SessionManager.js` - Session management
- **CANONICAL:** `src/security/CredentialManager.js` - Credential management
- **CANONICAL:** `src/security/CredentialVault.js` - Credential vault
- **CANONICAL:** `src/security/SecretVault.js` - Secret vault
- **CANONICAL:** `src/security/EncryptionEngine.js` - Encryption engine (62 matches)

### Authorization/RBAC
- **CANONICAL:** `src/domain/permissionModel.js` - Permission data structure (161 matches)
- **CANONICAL:** `src/domain/roleModel.js` - Role data structure (133 matches)
- **CANONICAL:** `src/utils/permissionService.js` - Permission service (171 matches, 34 files)
- **DUPLICATE:** `src/security/PermissionEngine.js` - Permission engine (128 matches)
- **DUPLICATE:** `src/utils/permissions.js` - Legacy permissions (58 matches)
- **DUPLICATE:** `src/utils/shiftPermissions.js` - Shift-specific permissions (96 matches)
- **CANONICAL:** `src/hooks/useSecurity.js` - Security hook
- **CANONICAL:** `src/components/permissions/` - Permission UI components

### Security Monitoring
- **CANONICAL:** `src/security/SecurityMonitor.js` - Security monitoring
- **CANONICAL:** `src/security/SecuritySelfHealing.js` - Security self-healing
- **CANONICAL:** `src/hooks/useSecurity.js` - Security hook

---

## Payment Architecture

### Payment Gateway Factory
- **CANONICAL:** `src/payment/PaymentGatewayFactory.js` - Factory pattern (75 matches)

### Payment Adapters
- **CANONICAL:** `src/payment/StripeAdapter.js` - Stripe (104 matches)
- **CANONICAL:** `src/payment/RazorpayAdapter.js` - Razorpay (217 matches)
- **CANONICAL:** `src/payment/CashfreeAdapter.js` - Cashfree (78 matches)
- **CANONICAL:** `src/payment/PaytmAdapter.js` - Paytm
- **CANONICAL:** `src/payment/PhonePeAdapter.js` - PhonePe
- **CANONICAL:** `src/payment/PaymentGateway.js` - Base gateway

### Payment Security
- **CANONICAL:** `src/payment/WebhookVerifier.js` - Webhook verification
- **CANONICAL:** `src/payment/RegulatoryCompliance.js` - Regulatory compliance
- **CANONICAL:** `src/payment/DataLocalization.js` - Data localization
- **CANONICAL:** `src/payment/SMSReceipt.js` - SMS receipts
- **CANONICAL:** `src/payment/OfflinePaymentQueue.js` - Offline payment queue
- **CANONICAL:** `src/payment/PaymentSelfHealing.js` - Payment self-healing
- **CANONICAL:** `src/payment/QRCodePayment.js` - QR code payments
- **CANONICAL:** `src/payment/LowDataMode.js` - Low data mode

---

## Backup/Restore Architecture

### Backup Engines
- **CANONICAL:** `src/backup/BackupEngine.js` - Primary backup engine (7 matches)
- **DUPLICATE:** `src/cloud/BackupEngine.js` - Cloud backup engine (3 matches)
- **CANONICAL:** `src/backup/BackupManager.js` - Backup manager (33 matches)
- **CANONICAL:** `src/backup/BackupTypesImplementations.js` - Backup type implementations
- **CANONICAL:** `src/backup/BackupExporter.js` - Backup exporter
- **CANONICAL:** `src/backup/BackupSecurityManager.js` - Backup security
- **CANONICAL:** `src/backup/BackupNotificationManager.js` - Backup notifications
- **CANONICAL:** `src/cloud/BackupScheduler.js` - Backup scheduler

### Restore
- **CANONICAL:** `src/restore/RestoreEngine.js` - Restore engine
- **CANONICAL:** `src/restore/RestoreManager.js` - Restore manager
- **CANONICAL:** `src/restore/RestoreSecurityManager.js` - Restore security

### Backup Utilities
- **CANONICAL:** `src/utils/backupManager.js` - Backup manager utility
- **CANONICAL:** `src/utils/backupScheduler.js` - Backup scheduler utility
- **CANONICAL:** `src/utils/DailyArchive.js` - Daily archive utility
- **CANONICAL:** `src/operations/BackupVerifier.js` - Backup verifier

---

## Import/Export Architecture

### Import Engines
- **DUPLICATE:** `src/cloud/ImportEngine.js` - Cloud import (3 matches)
- **DUPLICATE:** `src/export/ImportEngine.js` - Export import (2 matches)

### Export Engines
- **DUPLICATE:** `src/cloud/ExportEngine.js` - Cloud export (3 matches)
- **DUPLICATE:** `src/export/ExportEngine.js` - Export export (2 matches)

### Import/Export Security
- **CANONICAL:** `src/export/ExportImportSecurity.js` - Security
- **CANONICAL:** `src/export/DestinationManager.js` - Destination manager
- **CANONICAL:** `src/export/HistoryTracker.js` - History tracking

---

## Cloud Storage Architecture

### Storage Engine
- **CANONICAL:** `src/cloud/StorageEngine.js` - Primary storage engine (105 matches)
- **CANONICAL:** `src/cloud/ProviderRegistry.js` - Provider registry
- **CANONICAL:** `src/cloud/AttachmentStorage.js` - Attachment storage

### Cloud Providers (11)
- **CANONICAL:** `src/cloud/providers/AWSS3Provider.js` - AWS S3
- **CANONICAL:** `src/cloud/providers/AzureBlobProvider.js` - Azure Blob
- **CANONICAL:** `src/cloud/providers/GCSProvider.js` - Google Cloud Storage
- **CANONICAL:** `src/cloud/providers/FirebaseStorageProvider.js` - Firebase Storage
- **CANONICAL:** `src/cloud/providers/CloudflareR2Provider.js` - Cloudflare R2
- **CANONICAL:** `src/cloud/providers/BackblazeB2Provider.js` - Backblaze B2
- **CANONICAL:** `src/cloud/providers/SupabaseStorageProvider.js` - Supabase Storage
- **CANONICAL:** `src/cloud/providers/MinIOProvider.js` - MinIO
- **CANONICAL:** `src/cloud/providers/WebDAVProvider.js` - WebDAV
- **CANONICAL:** `src/cloud/providers/SMBProvider.js` - SMB
- **CANONICAL:** `src/cloud/providers/LocalStorageProvider.js` - LocalStorage

### Cloud Services
- **CANONICAL:** `src/cloud/SecurityManager.js` - Cloud security
- **CANONICAL:** `src/cloud/NotificationManager.js` - Cloud notifications
- **CANONICAL:** `src/cloud/MigrationEngine.js` - Migration engine
- **CANONICAL:** `src/cloud/SearchEngine.js` - Search engine
- **CANONICAL:** `src/cloud/RestoreEngine.js` - Cloud restore

---

## Data Persistence Architecture

### Storage Managers
- **CANONICAL:** `src/operations/LocalStorageManager.js` - Local storage (43 matches)
- **DUPLICATE:** `src/operations/StatePersistence.js` - State persistence (10 matches)
- **CANONICAL:** `src/utils/storageHelper.js` - Storage helper
- **CANONICAL:** `src/utils/storageRecovery.js` - Storage recovery

### Persistence
- **CANONICAL:** `src/context/AppContext.jsx` - App context (20 matches)
- **CANONICAL:** `src/theme/ThemePersistence.js` - Theme persistence

---

## ID Generation Architecture

### Canonical ID Generator
- **CANONICAL:** `src/domain/ids.js` - ID generation utilities (6 crypto.randomUUID calls)

### Scattered ID Generation
- **INCONSISTENT:** Date.now() in 299 files
- **INCONSISTENT:** Math.random() in 149 files
- **INCONSISTENT:** createId() in 26 files

---

## Testing Architecture

### Test Configuration
- **CANONICAL:** `src/test/setup.js` - Test setup
- **CANONICAL:** `src/test/example.test.jsx` - Example test
- **CANONICAL:** `src/test/themeVariants.test.jsx` - Theme variant tests

### Test Coverage
- **CRITICAL:** Only 2 test files exist for 727 modules
- **STATUS:** Minimal test coverage

---

## Utility Architecture

### Core Utilities
- **CANONICAL:** `src/utils/logger.js` - Logging utility
- **CANONICAL:** `src/utils/authService.js` - Authentication
- **CANONICAL:** `src/utils/permissionService.js` - Permissions
- **CANONICAL:** `src/utils/appMode.js` - Application modes
- **CANONICAL:** `src/utils/demoMode.js` - Demo mode
- **CANONICAL:** `src/utils/featureConfig.js` - Feature configuration
- **CANONICAL:** `src/utils/setupSecurity.js` - Setup security
- **CANONICAL:** `src/utils/sanitize.js` - Sanitization
- **CANONICAL:** `src/utils/healthMonitoring.js` - Health monitoring
- **CANONICAL:** `src/utils/notificationService.js` - Notifications
- **CANONICAL:** `src/utils/shiftManagement.js` - Shift management
- **CANONICAL:** `src/utils/shiftAuditLog.js` - Shift audit logging
- **CANONICAL:** `src/utils/shiftPermissions.js` - Shift permissions
- **CANONICAL:** `src/utils/clientTemplates.js` - Client templates
- **CANONICAL:** `src/utils/browserNotification.js` - Browser notifications
- **CANONICAL:** `src/utils/operationsManager.js` - Operations manager
- **CANONICAL:** `src/utils/operationsNotifications.js` - Operations notifications
- **CANONICAL:** `src/utils/healthNotifications.js` - Health notifications
- **CANONICAL:** `src/utils/permissions.js` - Legacy permissions (DUPLICATE)

### Operations
- **CANONICAL:** `src/operations/SelfHealingEngine.js` - Self-healing (35 matches)
- **CANONICAL:** `src/operations/StatePersistence.js` - State persistence
- **CANONICAL:** `src/operations/CacheManager.js` - Cache manager
- **CANONICAL:** `src/operations/WebSocketManager.js` - WebSocket manager
- **CANONICAL:** `src/operations/SessionManager.js` - Session manager
- **CANONICAL:** `src/operations/CrossTabSync.js` - Cross-tab sync
- **CANONICAL:** `src/operations/DataConflictResolver.js` - Conflict resolver
- **CANONICAL:** `src/operations/DataValidator.js` - Data validator
- **CANONICAL:** `src/operations/DiagnosticsGenerator.js` - Diagnostics generator
- **CANONICAL:** `src/operations/ServiceHealthMonitor.js` - Service health monitor
- **CANONICAL:** `src/operations/SecuritySelfHealing.js` - Security self-healing
- **CANONICAL:** `src/operations/BackupVerifier.js` - Backup verifier

### Sync
- **CANONICAL:** `src/sync/SyncEngine.js` - Sync engine
- **CANONICAL:** `src/sync/SyncManager.js` - Sync manager
- **CANONICAL:** `src/sync/SyncSecurityManager.js` - Sync security
- **CANONICAL:** `src/sync/RetryManager.js` - Retry manager
- **CANONICAL:** `src/sync/AttachmentSync.js` - Attachment sync
- **CANONICAL:** `src/utils/offlineSync.ts` - Offline sync

### Tenant
- **CANONICAL:** `src/tenant/TenantModel.js` - Tenant model
- **CANONICAL:** `src/tenant/TenantSecurity.js` - Tenant security
- **CANONICAL:** `src/tenant/PermissionIsolation.js` - Permission isolation
- **CANONICAL:** `src/tenant/WorkspaceProvisioner.js` - Workspace provisioner

---

## Dashboard Architecture

### Dashboard Components
- **CANONICAL:** `src/dashboard/Dashboard.jsx` - Main dashboard
- **CANONICAL:** `src/dashboard/widgetEngine/` - Widget engine
- **CANONICAL:** `src/dashboard/biEngine/` - BI engine
- **CANONICAL:** `src/dashboard/liveEngine/` - Live engine
- **CANONICAL:** `src/dashboard/widgets/` - Dashboard widgets

### Intelligence
- **CANONICAL:** `src/components/intelligence/` - Intelligence components
- **CANONICAL:** `src/domain/intelligenceModel.js` - Intelligence model

---

## Health Architecture

### Health Components
- **CANONICAL:** `src/components/health/` - Health components
- **CANONICAL:** `src/health/initializeHealthChecks.js` - Health check initialization
- **CANONICAL:** `src/health/providers/` - Health check providers
- **CANONICAL:** `src/domain/healthModel.js` - Health model

### Diagnostics
- **CANONICAL:** `src/diagnostics/` - Diagnostics components
- **CANONICAL:** `src/diagnostics/DiagnosticsTypes.js` - Diagnostics types
- **CANONICAL:** `src/diagnostics/SmartNotifications.js` - Smart notifications
- **CANONICAL:** `src/diagnostics/PerformanceAnalyzer.js` - Performance analyzer

---

## Data Architecture

### Data Constants
- **CANONICAL:** `src/data/constants.js` - General constants
- **CANONICAL:** `src/data/staffConstants.js` - Staff constants
- **CANONICAL:** `src/data/tableConstants.js` - Table constants
- **CANONICAL:** `src/data/inventoryConstants.js` - Inventory constants
- **CANONICAL:** `src/data/expenseConstants.js` - Expense constants
- **CANONICAL:** `src/data/qrConstants.js` - QR constants
- **CANONICAL:** `src/data/productionConstants.js` - Production constants
- **CANONICAL:** `src/data/deliveryConstants.js` - Delivery constants
- **CANONICAL:** `src/data/notificationConstants.js` - Notification constants

---

## Hooks Architecture

### Custom Hooks
- **CANONICAL:** `src/hooks/useSecurity.js` - Security hook
- **CANONICAL:** `src/hooks/useKeyboardShortcuts.js` - Keyboard shortcuts
- **CANONICAL:** `src/hooks/useThemeColors.js` - Theme colors
- **CANONICAL:** `src/hooks/useThemeSpacing.js` - Theme spacing
- **CANONICAL:** `src/hooks/useThemeTypography.js` - Theme typography
- **CANONICAL:** `src/hooks/useThemeBorderRadius.js` - Theme border radius

---

## Context Architecture

### Context Providers
- **CANONICAL:** `src/context/AppContext.jsx` - App context
- **CANONICAL:** `src/terminal/TerminalContext.jsx` - Terminal context
- **CANONICAL:** `src/theme/` - Theme context

---

## Print Architecture

### Print Components
- **CANONICAL:** `src/print/printEngine.js` - Print engine
- **CANONICAL:** `src/print/printService.js` - Print service

---

## Realtime Architecture

### Realtime Components
- **CANONICAL:** `src/realtime/RealtimeSyncServer.js` - Sync server
- **CANONICAL:** `src/realtime/RealtimeSyncClient.js` - Sync client

---

## Pricing Architecture

### Pricing Components
- **CANONICAL:** `src/pricing/` - Pricing components
- **CANONICAL:** `src/pricing/approvalEngine.js` - Approval engine
- **CANONICAL:** `src/pricing/couponEngine.js` - Coupon engine
- **CANONICAL:** `src/pricing/loyaltyEngine.js` - Loyalty engine
- **CANONICAL:** `src/pricing/schedulingSystem.js` - Scheduling system
- **CANONICAL:** `src/pricing/analyticsEngine.js` - Analytics engine
- **CANONICAL:** `src/pricing/ruleBuilder.js` - Rule builder

---

## Orders Architecture

### Orders Components
- **CANONICAL:** `src/orders/` - Orders components
- **CANONICAL:** `src/orders/broadcastSystem.js` - Broadcast system
- **CANONICAL:** `src/orders/commandPalette.js` - Command palette
- **CANONICAL:** `src/orders/operationalMonitor.js` - Operational monitor
- **CANONICAL:** `src/orders/shiftOperations.js` - Shift operations
- **CANONICAL:** `src/orders/terminalManager.js` - Terminal manager
- **CANONICAL:** `src/orders/performanceOptimizer.js` - Performance optimizer
- **CANONICAL:** `src/orders/auditStream.js` - Audit stream
- **CANONICAL:** `src/orders/enterpriseNotifications.js` - Enterprise notifications
- **CANONICAL:** `src/orders/incidentDashboard.js` - Incident dashboard
- **CANONICAL:** `src/orders/operationsWorkspace.js` - Operations workspace
- **CANONICAL:** `src/orders/terminalHealth.js` - Terminal health

---

## Delivery Architecture

### Delivery Components
- **CANONICAL:** `src/delivery/DeliveryPlatformFactory.js` - Platform factory
- **CANONICAL:** `src/delivery/DeliveryPlatformAdapter.js` - Platform adapter
- **CANONICAL:** `src/delivery/WebhookHandler.js` - Webhook handler

---

## Broken/Unknown Status

### Broken Imports (FIXED)
- **FIXED:** All import path issues from file reorganization resolved

### Unknown Status
- **UNKNOWN:** `src/components/fastfood-pos/` - May be legacy, needs verification
- **UNKNOWN:** Some utility files may be unused (156 lint warnings)
- **UNKNOWN:** Some domain models may be obsolete

---

## Canonical Implementation Table

| Capability | Canonical Implementation | Legacy Implementations | Status |
|------------|------------------------|----------------------|---------|
| **POS** | `src/components/themed/ThemedOrders.jsx` (router) | `src/components/classic/ClassicOrdersLayout.jsx`, `src/components/fast-food/FastFoodOrdersLayout.jsx`, `src/components/fast-food/FastFoodOrdersComprehensive.jsx`, `src/components/fast-food/FastFoodOrdersSimple.jsx`, `src/components/classic-pos/` (21 files) | ✅ PRESERVED - Theme variants are intentional |
| **Dashboard** | `src/components/themed/ThemedDashboard.jsx` (router) | `src/components/dashboard/Dashboard.jsx`, `src/components/classic/ClassicDashboard.jsx`, `src/components/fast-food/FastFoodDashboard.jsx`, `src/components/fast-food/FastFoodDashboardComprehensive.jsx`, `src/components/fast-food/FastFoodDashboardSimple.jsx` | ✅ PRESERVED - Theme variants are intentional |
| **Orders** | `src/components/orders/Orders.jsx` | Theme-specific layouts routed through ThemedOrders | ✅ PRESERVED - Theme variants are intentional |
| **Kitchen/KDS** | `src/components/themed/ThemedKitchen.jsx` (router) | `src/components/kitchen/Kitchen.jsx`, `src/components/classic-pos/ClassicPosKDS.jsx`, `src/components/fast-food/FastFoodKitchen.jsx`, `src/components/fast-food/FastFoodKitchenComprehensive.jsx`, `src/components/fast-food/FastFoodKitchenSimple.jsx`, theme-specific kitchens | ✅ PRESERVED - Theme variants are intentional |
| **Menu** | `src/components/themed/ThemedMenu.jsx` (router) | `src/components/menu/Menu.jsx`, `src/components/classic-pos/ClassicPosMenu.jsx`, `src/components/fast-food/FastFoodMenuComprehensive.jsx` | ✅ PRESERVED - Theme variants are intentional |
| **Inventory** | `src/components/themed/ThemedInventory.jsx` (router) | `src/components/inventory/Inventory.jsx`, `src/components/classic-pos/ClassicPosInventory.jsx`, `src/components/fast-food/FastFoodInventoryComprehensive.jsx` | ✅ PRESERVED - Theme variants are intentional |
| **Staff** | `src/components/themed/ThemedStaff.jsx` (router) | `src/components/staff/Staff.jsx`, `src/components/classic-pos/ClassicPosStaff.jsx`, `src/components/fast-food/FastFoodStaff.jsx`, `src/components/fast-food/FastFoodStaffComprehensive.jsx` | ✅ PRESERVED - Theme variants are intentional |
| **Tables** | `src/components/themed/ThemedTables.jsx` (router) | `src/components/tables/Tables.jsx`, `src/components/classic-pos/ClassicPosTable.jsx`, `src/components/fast-food/FastFoodTables.jsx`, `src/components/fast-food/FastFoodTablesComprehensive.jsx`, `src/components/fast-food/FastFoodTablesSimple.jsx`, theme-specific tables | ✅ PRESERVED - Theme variants are intentional |
| **Reports/Analytics** | `src/components/themed/ThemedReports.jsx` (router) | `src/components/analytics/AnalyticsReports.jsx`, `src/components/classic-pos/ClassicPosReports.jsx`, `src/components/fast-food/FastFoodReports.jsx`, `src/components/fast-food/FastFoodReportsComprehensive.jsx` | ✅ PRESERVED - Theme variants are intentional |
| **Backup** | `src/backup/BackupEngine.js` (backup-specific) | `src/cloud/BackupEngine.js` (cloud-specific) | ✅ PRESERVED - Different concerns (backup vs cloud operations) |
| **Restore** | `src/restore/RestoreEngine.js` | `src/cloud/RestoreEngine.js` | ✅ PRESERVED - Different concerns (restore vs cloud operations) |
| **Import** | `src/export/ImportEngine.js` (format-specific) | `src/cloud/ImportEngine.js` (cloud orchestration) | ✅ PRESERVED - Different concerns (format vs cloud) |
| **Export** | `src/export/ExportEngine.js` (format-specific) | `src/cloud/ExportEngine.js` (cloud orchestration) | ✅ PRESERVED - Different concerns (format vs cloud) |
| **Provider Registry** | `src/cloud/ProviderRegistry.js` | None | ✅ CANONICAL - Single implementation |
| **Session Manager** | `src/operations/SessionManager.js` (session timeout) | `src/security/SessionManager.js` (security session), `src/terminal/TerminalSessionManager.js` (terminal-specific) | ✅ PRESERVED - Different concerns (timeout vs security vs terminal) |
| **Notification System** | `src/cloud/NotificationManager.js` (cloud) | `src/backup/BackupNotificationManager.js`, `src/restore/RestoreNotificationManager.js`, `src/sync/SyncNotificationManager.js`, `src/export/ExportImportNotifications.js`, `src/operations/OperationsNotifications.js` | ✅ PRESERVED - Domain-specific notification managers |
| **Theme System** | `src/theme/useTheme.js` + `src/components/themed/` | None | ✅ CANONICAL - Single implementation |
| **Permission System** | `src/utils/permissionService.js` (action-layer) | `src/security/PermissionEngine.js` (security-layer), `src/utils/shiftPermissions.js` (shift-specific) | ✅ PRESERVED - Different layers (action vs security vs shift) |
| **Storage** | `src/cloud/StorageEngine.js` (cloud) | `src/operations/LocalStorageManager.js` (local), `src/operations/StatePersistence.js` (state) | ✅ PRESERVED - Different backends (cloud vs local vs state) |
| **Shared UI Components** | `src/components/fastfood-pos/` (6 files) | None | ✅ CANONICAL - Shared components for fast-food theme |

---

## Summary

### Canonical Implementations
- Theme system with 9 themed wrapper components acting as routers
- 8+ theme variant folders (classic-pos, fast-food, accessibility, bakery, cafe, bar, fine-dining, classic)
- Domain models for all major entities
- Payment gateway factory with 5 adapters
- 11 cloud storage providers
- Comprehensive security architecture
- Backup/restore system with domain-specific engines
- Extensive utility library

### Intentional Duplicates (Preserved)
- **Theme variants:** Multiple implementations per feature are intentional for runtime theme switching
- **Backup engines:** Backup-specific vs cloud-specific operations
- **Import/Export engines:** Format-specific vs cloud orchestration
- **Storage engines:** Cloud vs local vs state persistence
- **Session managers:** Timeout handling vs security sessions vs terminal sessions
- **Notification managers:** Domain-specific (backup, restore, sync, export, operations)
- **Permission systems:** Action-layer vs security-layer vs shift-specific

### Deleted Obsolete Implementations
- `src/utils/permissions.js` - No consumers found, deleted

### Legacy Implementations (Preserved)
- `src/components/fastfood-pos/` - Shared UI components for fast-food theme (6 files, 17 references)
- Webpack chunk comments (Vite ignores these but harmless)
- Prototype method access (Object.prototype.hasOwnProperty)

### Inconsistent Patterns (Not Addressed in Phase 2)
- ID generation (crypto.randomUUID, Date.now, Math.random mixed)
- localStorage usage (256 files, no centralized manager)
- React Hooks violations in theme/styled.js

### Critical Gaps (Not Addressed in Phase 2)
- No TypeScript configuration
- Minimal test coverage (2 test files)
- No centralized error handling
- No monitoring/alerting
- No production readiness checks
