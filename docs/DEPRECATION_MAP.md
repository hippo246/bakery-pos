# CafeOS Deprecation Map

**Branch:** recovery-audit-baseline  
**Date:** 2026-08-11  
**Phase:** Phase 2 - Canonical Architecture Consolidation  
**Purpose:** Track deprecated files and their migration status

---

## Deprecated Files

### None

**Note:** No files were deprecated in Phase 2. All duplicate implementations are intentional and serve different architectural concerns.

---

## Preserved Duplicates (Not Deprecated)

The following duplicate implementations are **intentionally preserved** as they serve different architectural concerns:

### Backup Engines
- `src/backup/BackupEngine.js` - Backup-specific operations (7 consumers)
- `src/cloud/BackupEngine.js` - Cloud-specific operations (3 consumers)
- **Reason:** Different concerns - backup orchestration vs cloud storage operations

### Import Engines
- `src/export/ImportEngine.js` - Format-specific import (2 consumers)
- `src/cloud/ImportEngine.js` - Cloud orchestration import (3 consumers)
- **Reason:** Different concerns - format handling vs cloud storage orchestration

### Export Engines
- `src/export/ExportEngine.js` - Format-specific export (2 consumers)
- `src/cloud/ExportEngine.js` - Cloud orchestration export (3 consumers)
- **Reason:** Different concerns - format handling vs cloud storage orchestration

### Storage Engines
- `src/cloud/StorageEngine.js` - Cloud storage (8 consumers)
- `src/operations/LocalStorageManager.js` - Local storage
- `src/operations/StatePersistence.js` - State persistence
- **Reason:** Different backends - cloud vs local vs state

### Session Managers
- `src/operations/SessionManager.js` - Session timeout handling (1 consumer)
- `src/security/SessionManager.js` - Security session management (2 consumers)
- `src/terminal/TerminalSessionManager.js` - Terminal-specific sessions (1 consumer)
- **Reason:** Different concerns - timeout vs security vs terminal

### Notification Managers
- `src/cloud/NotificationManager.js` - Cloud notifications (3 consumers)
- `src/backup/BackupNotificationManager.js` - Backup-specific notifications
- `src/restore/RestoreNotificationManager.js` - Restore-specific notifications
- `src/sync/SyncNotificationManager.js` - Sync-specific notifications
- `src/export/ExportImportNotifications.js` - Export/import notifications
- `src/operations/OperationsNotifications.js` - Operations notifications
- **Reason:** Domain-specific notification handlers

### Permission Systems
- `src/utils/permissionService.js` - Action-layer permission enforcement (11 consumers)
- `src/security/PermissionEngine.js` - Security-layer permission management (7 consumers)
- `src/utils/shiftPermissions.js` - Shift-specific permissions
- **Reason:** Different layers - action vs security vs shift

### Theme Variants
All theme-specific component variants are preserved for runtime theme switching:
- `src/components/themed/` - Theme router components (9 files)
- `src/components/classic-pos/` - Classic POS theme (21 files)
- `src/components/fast-food/` - Fast food theme (21 files)
- `src/components/accessibility/` - Accessibility theme (3 files)
- `src/components/bakery/` - Bakery theme (3 files)
- `src/components/bar/` - Bar theme (3 files)
- `src/components/cafe/` - Cafe theme (3 files)
- `src/components/fine-dining/` - Fine dining theme (3 files)
- `src/components/classic/` - Classic theme (6 files)
- `src/components/fastfood-pos/` - Shared UI components for fast-food (6 files, 17 references)
- **Reason:** Intentional architecture for runtime theme switching

---

## Summary

### Deleted Files
- 1 file deleted: `src/utils/permissions.js`

### Preserved Duplicates
- 7 capability groups with intentional duplicates
- 50+ theme variant files (intentional architecture)
- All duplicates serve different architectural concerns

### Migration Required
- None (all duplicates are intentional)

### Next Steps
- No further deprecation planned for Phase 2
- All duplicates documented as intentional
- Future phases may address inconsistent patterns (ID generation, localStorage usage)
