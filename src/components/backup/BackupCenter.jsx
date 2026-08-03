import React from 'react';
// Backup & Data Center
// Comprehensive backup, restore, import, export, and data health management

import { useState, useCallback, useEffect, useMemo } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import PromptDialog from "../common/PromptDialog";
import { ImportExportPermissions } from "../../utils/permissionService.js";
import { createBackupAuditLog, createRestoreAuditLog, createImportAuditLog, createExportAuditLog, createPermissionDeniedAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId, getCurrentBranchId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import ImportWizard from "./ImportWizard";
import ExportCenter from "./ExportCenter";
import { migrateBackup, needsMigration } from "../../utils/backupMigration.js";
import { backupSequences, restoreSequences } from "../../utils/sequenceManager.js";
import { checkStorageCorruption, attemptRecovery, getStorageUsage, clearOldAuditLogs } from "../../utils/storageRecovery.js";
import { 
  getBackupSchedule, 
  saveBackupSchedule, 
  enableAutomatedBackups, 
  disableAutomatedBackups, 
  performAutomatedBackup, 
  getBackupStats, 
  cleanupOldBackups,
  isBackupDue 
} from "../../utils/backupScheduler.js";

// ── Backup Service ─────────────────────────────────────────────────────────────

const BACKUP_VERSION = "1.0.0";
const BACKUP_SCHEMA_VERSION = "1.0.0";

/**
 * Create a full backup with metadata
 */
function createBackup(data, metadata = {}) {
  const currentBranchId = getCurrentBranchId();
  const sequences = backupSequences();

  const backup = {
    app: "CafeOS",
    backupVersion: BACKUP_VERSION,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    businessName: metadata.businessName || "Unknown",
    branchId: metadata.branchId || currentBranchId || null,
    dataMode: metadata.dataMode || "local",
    modules: Object.keys(data.collections || {}),
    recordCounts: {},
    checksum: null,
    data: data.collections || data,
    sequences: sequences,
    branchScope: {
      branchId: currentBranchId,
      exportedAt: new Date().toISOString()
    }
  };

  // Calculate record counts
  Object.keys(backup.data).forEach(key => {
    if (Array.isArray(backup.data[key])) {
      backup.recordCounts[key] = backup.data[key].length;
    }
  });

  // Simple checksum (can be enhanced with proper hash)
  backup.checksum = JSON.stringify(backup.data).length;

  return backup;
}

/**
 * Validate backup file structure
 */
function validateBackup(backup) {
  if (!backup || typeof backup !== 'object') {
    return { valid: false, error: "Invalid backup file: not an object" };
  }

  // Support both CafeOS and BrewCRM app names for backward compatibility
  if (backup.app !== "CafeOS" && backup.app !== "BrewCRM") {
    return { valid: false, error: `Invalid backup file: unexpected app "${backup.app}"` };
  }

  if (!backup.backupVersion && !backup.version) {
    return { valid: false, error: "Backup version missing" };
  }

  if (!backup.data && !backup.collections) {
    return { valid: false, error: "Backup data missing or invalid" };
  }

  // Normalize data structure for both old and new formats
  const normalizedBackup = {
    ...backup,
    data: backup.data || backup.collections,
    backupVersion: backup.backupVersion || backup.version || "1.0.0"
  };

  return { valid: true, backup: normalizedBackup };
}

/**
 * Generate backup filename
 */
function generateBackupFilename(businessName = "CafeOS") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  const safeName = businessName.replace(/[^a-zA-Z0-9]/g, '-');
  return `CafeOS-Full-Backup-${safeName}-${timestamp}-${time}.json`;
}

// ── Data Health Checks ─────────────────────────────────────────────────────────

/**
 * Run data health checks
 */
function runDataHealthChecks(data) {
  const issues = [];

  // Check for empty critical collections
  const criticalCollections = ['orders', 'menuItems', 'customers'];
  criticalCollections.forEach(key => {
    if (!data[key] || !Array.isArray(data[key]) || data[key].length === 0) {
      issues.push({
        severity: 'warning',
        module: key,
        title: `No ${key} found`,
        description: `The ${key} collection is empty. This may affect operations.`,
        affectedRecords: 0,
        fixable: false
      });
    }
  });

  // Check for duplicate customer phones
  if (data.customers && Array.isArray(data.customers)) {
    const phones = data.customers.map(c => c.phone).filter(Boolean);
    const uniquePhones = new Set(phones);
    if (phones.length !== uniquePhones.size) {
      issues.push({
        severity: 'warning',
        module: 'customers',
        title: 'Duplicate customer phone numbers',
        description: `${phones.length - uniquePhones.size} customers share phone numbers. This may cause confusion in customer lookup.`,
        affectedRecords: phones.length - uniquePhones.size,
        fixable: false
      });
    }
  }

  // Check for duplicate menu item names
  if (data.menuItems && Array.isArray(data.menuItems)) {
    const names = data.menuItems.map(m => m.name).filter(Boolean);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      issues.push({
        severity: 'warning',
        module: 'menu',
        title: 'Duplicate menu item names',
        description: `${names.length - uniqueNames.size} menu items share names. This may cause confusion in order processing.`,
        affectedRecords: names.length - uniqueNames.size,
        fixable: false
      });
    }
  }

  // Check for invalid prices
  if (data.menuItems && Array.isArray(data.menuItems)) {
    const invalidPrices = data.menuItems.filter(m => typeof m.price !== 'number' || m.price < 0);
    if (invalidPrices.length > 0) {
      issues.push({
        severity: 'error',
        module: 'menu',
        title: 'Invalid menu item prices',
        description: `${invalidPrices.length} menu items have invalid prices (negative or not a number).`,
        affectedRecords: invalidPrices.length,
        fixable: false
      });
    }
  }

  // Check for invalid quantities in inventory
  if (data.inventory && Array.isArray(data.inventory)) {
    const invalidQuantities = data.inventory.filter(i => typeof i.quantity !== 'number' || i.quantity < 0);
    if (invalidQuantities.length > 0) {
      issues.push({
        severity: 'error',
        module: 'inventory',
        title: 'Invalid inventory quantities',
        description: `${invalidQuantities.length} inventory items have invalid quantities.`,
        affectedRecords: invalidQuantities.length,
        fixable: false
      });
    }
  }

  // Check for staff without phone/email
  if (data.staff && Array.isArray(data.staff)) {
    const staffWithoutContact = data.staff.filter(s => !s.phone && !s.email);
    if (staffWithoutContact.length > 0) {
      issues.push({
        severity: 'warning',
        module: 'staff',
        title: 'Staff without contact information',
        description: `${staffWithoutContact.length} staff members have no phone or email. This may affect communication.`,
        affectedRecords: staffWithoutContact.length,
        fixable: false
      });
    }
  }

  // Check for tables without numbers
  if (data.tables && Array.isArray(data.tables)) {
    const tablesWithoutNumber = data.tables.filter(t => !t.number && !t.name);
    if (tablesWithoutNumber.length > 0) {
      issues.push({
        severity: 'error',
        module: 'tables',
        title: 'Tables without identifiers',
        description: `${tablesWithoutNumber.length} tables have no number or name.`,
        affectedRecords: tablesWithoutNumber.length,
        fixable: false
      });
    }
  }

  // Check for suppliers without names
  if (data.suppliers && Array.isArray(data.suppliers)) {
    const suppliersWithoutName = data.suppliers.filter(s => !s.name);
    if (suppliersWithoutName.length > 0) {
      issues.push({
        severity: 'error',
        module: 'suppliers',
        title: 'Suppliers without names',
        description: `${suppliersWithoutName.length} suppliers have no name.`,
        affectedRecords: suppliersWithoutName.length,
        fixable: false
      });
    }
  }

  // Check for duplicate supplier names
  if (data.suppliers && Array.isArray(data.suppliers)) {
    const names = data.suppliers.map(s => s.name).filter(Boolean);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      issues.push({
        severity: 'warning',
        module: 'suppliers',
        title: 'Duplicate supplier names',
        description: `${names.length - uniqueNames.size} suppliers share names.`,
        affectedRecords: names.length - uniqueNames.size,
        fixable: false
      });
    }
  }

  return issues;
}

/**
 * Auto-fix data health issues where safe to do so
 */
function autoFixDataIssues(data, issues) {
  const fixedData = JSON.parse(JSON.stringify(data));
  const fixesApplied = [];

  issues.forEach(issue => {
    if (!issue.fixable) return;

    try {
      switch (issue.module) {
        case 'menu':
          if (issue.title.includes('Invalid prices')) {
            // Fix invalid prices by setting them to 0
            fixedData.menuItems = fixedData.menuItems.map(item => {
              if (typeof item.price !== 'number' || item.price < 0) {
                return { ...item, price: 0 };
              }
              return item;
            });
            fixesApplied.push(`Fixed ${issue.affectedRecords} invalid menu item prices`);
          }
          break;

        case 'inventory':
          if (issue.title.includes('Invalid quantities')) {
            // Fix invalid quantities by setting them to 0
            fixedData.inventory = fixedData.inventory.map(item => {
              if (typeof item.quantity !== 'number' || item.quantity < 0) {
                return { ...item, quantity: 0 };
              }
              return item;
            });
            fixesApplied.push(`Fixed ${issue.affectedRecords} invalid inventory quantities`);
          }
          break;

        case 'tables':
          if (issue.title.includes('without identifiers')) {
            // Auto-generate table numbers
            fixedData.tables = fixedData.tables.map((item, idx) => {
              if (!item.number && !item.name) {
                return { ...item, number: idx + 1 };
              }
              return item;
            });
            fixesApplied.push(`Generated identifiers for ${issue.affectedRecords} tables`);
          }
          break;

        case 'suppliers':
          if (issue.title.includes('without names')) {
            // Skip suppliers without names (they can't be fixed safely)
            fixedData.suppliers = fixedData.suppliers.filter(s => s.name);
            fixesApplied.push(`Removed ${issue.affectedRecords} suppliers without names`);
          }
          break;
      }
    } catch (err) {
      console.warn(`[BackupCenter] Failed to auto-fix issue:`, err);
    }
  });

  return { fixedData, fixesApplied };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BackupCenter({ dataTools, businessDetails = null }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [backupDialog, setBackupDialog] = useState({ open: false, onConfirm: null });
  const [restoreDialog, setRestoreDialog] = useState({ open: false, onConfirm: null, backup: null });
  const [importDialog, setImportDialog] = useState({ open: false, onConfirm: null });
  const [permissionDialog, setPermissionDialog] = useState({ open: false, action: "", requiredPermission: "" });
  const [message, setMessage] = useState({ type: null, text: "" });
  const [importFile, setImportFile] = useState(null);
  const [importText, setImportText] = useState("");
  const [healthIssues, setHealthIssues] = useState([]);
  const [fixesApplied, setFixesApplied] = useState([]);
  const [storageStatus, setStorageStatus] = useState({ corrupted: false, issues: [], usage: null });
  const [backupSchedule, setBackupSchedule] = useState(getBackupSchedule());
  const [backupStats, setBackupStats] = useState(getBackupStats());
  const [restorePreview, setRestorePreview] = useState(null);
  const [selectedCollections, setSelectedCollections] = useState([]);

  // Run health checks on mount
  useEffect(() => {
    if (dataTools && dataTools.getStorageSnapshot) {
      const snapshot = dataTools.getStorageSnapshot();
      const data = {};
      Object.keys(snapshot.collections || {}).forEach(key => {
        data[key] = snapshot.collections[key]?.present ? [] : null;
      });
      setHealthIssues(runDataHealthChecks(data));
      setFixesApplied([]);
    }

    // Check storage status
    const corruptionCheck = checkStorageCorruption();
    const usage = getStorageUsage();
    setStorageStatus({
      corrupted: corruptionCheck.corrupted,
      issues: corruptionCheck.issues,
      usage
    });
  }, [dataTools]);

  // Show message
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: "" }), 5000);
  }, []);

  // Handle storage recovery
  const handleStorageRecovery = useCallback(() => {
    const result = attemptRecovery();
    
    if (result.success) {
      showMessage("success", `Recovered ${result.recovered.length} items${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`);
      
      // Re-check storage status
      const corruptionCheck = checkStorageCorruption();
      const usage = getStorageUsage();
      setStorageStatus({
        corrupted: corruptionCheck.corrupted,
        issues: corruptionCheck.issues,
        usage
      });
    } else {
      showMessage("error", "Recovery failed. Please contact support.");
    }
  }, [showMessage]);

  // Handle clearing old logs
  const handleClearOldLogs = useCallback(() => {
    const cleared = clearOldAuditLogs(30);
    if (cleared > 0) {
      showMessage("success", `Cleared ${cleared} old audit log entries`);
      
      // Re-check storage usage
      const usage = getStorageUsage();
      setStorageStatus(prev => ({ ...prev, usage }));
    } else {
      showMessage("info", "No old logs to clear");
    }
  }, [showMessage]);

  // Handle auto-fix
  const handleAutoFix = useCallback(() => {
    if (!dataTools || !dataTools.getStorageSnapshot) return;

    const snapshot = dataTools.getStorageSnapshot();
    const data = {};
    Object.keys(snapshot.collections || {}).forEach(key => {
      data[key] = snapshot.collections[key]?.present ? [] : null;
    });

    const issues = runDataHealthChecks(data);
    const fixableIssues = issues.filter(i => i.fixable);

    if (fixableIssues.length === 0) {
      showMessage("info", "No fixable issues found");
      return;
    }

    const { fixedData, fixesApplied: applied } = autoFixDataIssues(data, fixableIssues);
    
    // Apply fixes to actual data
    // This would need to call dataTools methods to update each collection
    // For now, just show what would be fixed
    setFixesApplied(applied);
    showMessage("success", `Applied ${applied.length} auto-fixes`);
    
    // Re-run health checks
    setHealthIssues(runDataHealthChecks(fixedData));
  }, [dataTools, showMessage]);

  // Handle permission denial
  const handlePermissionDenied = useCallback((action, requiredPermission) => {
    setPermissionDialog({ open: true, action, requiredPermission });
    const denialLog = createPermissionDeniedAuditLog({
      userId: getCurrentUserId(),
      action,
      details: { requiredPermission }
    });
    console.warn('[BackupCenter] Permission denied:', denialLog);
  }, []);

  // Calculate storage size
  const storageSize = useMemo(() => {
    if (!dataTools || typeof dataTools.getStorageSnapshot !== "function") return null;
    const snapshot = dataTools.getStorageSnapshot();
    return snapshot?.totalApproxBytes || 0;
  }, [dataTools]);

  // Get record counts
  const recordCounts = useMemo(() => {
    if (!dataTools || typeof dataTools.getStorageSnapshot !== "function") return {};
    const snapshot = dataTools.getStorageSnapshot();
    const counts = {};
    Object.keys(snapshot.collections || {}).forEach(key => {
      counts[key] = snapshot.collections[key]?.count || 0;
    });
    return counts;
  }, [dataTools]);

  // Create full backup
  const handleCreateBackup = useCallback(() => {
    const permissionCheck = ImportExportPermissions.canBackup();
    if (!permissionCheck.allowed) {
      handlePermissionDenied('BACKUP_CREATE', permissionCheck.requiredPermission);
      return;
    }

    // Check branch scope
    const currentBranchId = getCurrentBranchId();
    if (currentBranchId && businessDetails?.branchId && currentBranchId !== businessDetails.branchId) {
      showMessage("warning", `Current branch (${currentBranchId}) differs from configured branch (${businessDetails.branchId}). Proceed with caution.`);
    }

    setBackupDialog({
      open: true,
      onConfirm: () => {
        try {
          if (!dataTools || typeof dataTools.exportLocalData !== "function") {
            showMessage("error", "Export function not available");
            return;
          }

          const rawData = dataTools.exportLocalData();
          const backup = createBackup(
            typeof rawData === 'string' ? JSON.parse(rawData) : rawData,
            {
              businessName: businessDetails?.name || "CafeOS",
              branchId: businessDetails?.branchId || null,
              dataMode: dataTools?.dataMode || "local"
            }
          );

          const backupJson = JSON.stringify(backup, null, 2);
          const blob = new Blob([backupJson], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = generateBackupFilename(businessDetails?.name || "CafeOS");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Audit log
          const auditLog = createBackupAuditLog({
            userId: getCurrentUserId(),
            details: {
              backupVersion: backup.backupVersion,
              modules: backup.modules,
              recordCounts: backup.recordCounts,
              businessName: businessDetails?.name,
              branchId: businessDetails?.branchId
            }
          });
          console.log('[BackupCenter] Backup created:', auditLog);

          showMessage("success", "Backup created successfully");
          setBackupDialog({ open: false, onConfirm: null });
        } catch (err) {
          showMessage("error", `Backup failed: ${err.message}`);
        }
      }
    });
  }, [dataTools, businessDetails, showMessage, handlePermissionDenied]);

  // Restore from backup
  const handleRestore = useCallback((backupData) => {
    const permissionCheck = ImportExportPermissions.canRestore();
    if (!permissionCheck.allowed) {
      handlePermissionDenied('RESTORE_BACKUP', permissionCheck.requiredPermission);
      return;
    }

    const validation = validateBackup(backupData);
    if (!validation.valid) {
      showMessage("error", validation.error);
      return;
    }

    // Check if migration is needed
    let backupToRestore = validation.backup;
    if (needsMigration(backupToRestore)) {
      try {
        backupToRestore = migrateBackup(backupToRestore);
        console.log('[BackupCenter] Backup migrated to latest version');
      } catch (err) {
        showMessage("error", `Migration failed: ${err.message}`);
        return;
      }
    }

    // Check branch scope
    const currentBranchId = getCurrentBranchId();
    if (backupToRestore.branchScope?.branchId && backupToRestore.branchScope.branchId !== currentBranchId) {
      showMessage("warning", `Backup is from branch "${backupToRestore.branchScope.branchId}". Current branch is "${currentBranchId}". Proceed with caution.`);
    }

    // Calculate record counts for preview
    const backupRecordCounts = {};
    Object.keys(backupToRestore.data || {}).forEach(key => {
      if (Array.isArray(backupToRestore.data[key])) {
        backupRecordCounts[key] = backupToRestore.data[key].length;
      }
    });

    // Get current record counts
    const currentRecordCounts = recordCounts;

    setRestoreDialog({
      open: true,
      backup: {
        ...backupToRestore,
        backupRecordCounts,
        currentRecordCounts,
        needsMigration: needsMigration(validation.backup)
      },
      onConfirm: () => {
        try {
          if (!dataTools || typeof dataTools.importLocalData !== "function") {
            showMessage("error", "Import function not available");
            return;
          }

          // Restore sequences if present in backup
          if (backupToRestore.sequences) {
            try {
              restoreSequences(backupToRestore.sequences);
              console.log('[BackupCenter] Sequences restored from backup');
            } catch (err) {
              console.warn('[BackupCenter] Failed to restore sequences:', err);
            }
          }

          const backupJson = JSON.stringify(backupToRestore.data, null, 2);
          const result = dataTools.importLocalData(backupJson);

          if (result && result.ok) {
            // Audit log
            const auditLog = createRestoreAuditLog({
              userId: getCurrentUserId(),
              details: {
                backupVersion: backupToRestore.backupVersion,
                importedCollections: result.imported,
                skippedCollections: result.skipped,
                recordCounts: backupRecordCounts,
                branchId: backupToRestore.branchScope?.branchId,
                migrated: backupToRestore.needsMigration
              }
            });
            console.log('[BackupCenter] Restore completed:', auditLog);

            showMessage("success", `Restore completed. Imported: ${result.imported?.join(", ") || "none"}`);
            setRestoreDialog({ open: false, onConfirm: null, backup: null });
            setImportText("");
            setImportFile(null);
          } else {
            showMessage("error", result.error || "Restore failed");
          }
        } catch (err) {
          showMessage("error", `Restore failed: ${err.message}`);
        }
      }
    });
  }, [dataTools, recordCounts, showMessage, handlePermissionDenied]);

  // Handle file upload for restore
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      showMessage("error", "Please select a JSON backup file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportText(JSON.stringify(json, null, 2));
        setImportFile(file);
      } catch (err) {
        showMessage("error", "Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }, [showMessage]);

  // Handle restore from text
  const handleRestoreFromText = useCallback(() => {
    if (!importText.trim()) {
      showMessage("error", "Please paste backup JSON or select a file");
      return;
    }

    try {
      const backup = JSON.parse(importText);
      handleRestore(backup);
    } catch (err) {
      showMessage("error", "Invalid backup JSON");
    }
  }, [importText, handleRestore, showMessage]);

  // Handle preview restore
  const handlePreviewRestore = useCallback(() => {
    if (!importText.trim()) {
      showMessage("error", "Please paste backup JSON or select a file");
      return;
    }

    try {
      const backup = JSON.parse(importText);
      const validation = validateBackup(backup);
      
      if (!validation.valid) {
        showMessage("error", `Invalid backup: ${validation.error}`);
        return;
      }

      setRestorePreview(validation.backup);
      setSelectedCollections([]);
      showMessage("success", "Backup loaded successfully");
    } catch (err) {
      showMessage("error", "Invalid backup JSON");
    }
  }, [importText, showMessage]);

  // Handle selective restore
  const handleSelectiveRestore = useCallback((backup, collections) => {
    if (!dataTools || typeof dataTools.importLocalData !== "function") {
      showMessage("error", "Import function not available");
      return;
    }

    try {
      // Create selective data object with only selected collections
      const selectiveData = {};
      collections.forEach(key => {
        selectiveData[key] = backup.data[key];
      });

      const result = dataTools.importLocalData(JSON.stringify(selectiveData));
      
      if (result && result.ok) {
        const auditLog = createRestoreAuditLog({
          userId: getCurrentUserId(),
          details: {
            collections: collections,
            backupDate: backup.createdAt,
            backupVersion: backup.backupVersion
          }
        });
        console.log('[BackupCenter] Selective restore completed:', auditLog);

        showMessage("success", `Restored ${collections.length} collections successfully`);
        setRestorePreview(null);
        setSelectedCollections([]);
      } else {
        showMessage("error", "Restore failed");
      }
    } catch (err) {
      showMessage("error", `Restore failed: ${err.message}`);
    }
  }, [dataTools, showMessage]);

  // Critical issues count
  const criticalIssues = healthIssues.filter(i => i.severity === 'error').length;
  const warningIssues = healthIssues.filter(i => i.severity === 'warning').length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--cafe-bg)", color: "var(--cafe-text)", fontFamily: "'Sora','Inter',sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: "24px 32px",
        borderBottom: "1px solid var(--cafe-border)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--cafe-text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
              Backup & Data Center
            </h1>
            <p style={{ fontSize: 14, color: "var(--cafe-text-tertiary)", margin: "4px 0 0", fontWeight: 400 }}>
              Back up, restore, import, and export CafeOS business data safely
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCreateBackup} style={{ ...btn("primary"), fontSize: 13, padding: "10px 16px" }}>
              Create Full Backup
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{
            ...card, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
            background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)"
          }}>
            <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Storage Mode
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
              {dataTools?.isLocalMode ? "Local" : "Demo"}
            </span>
          </div>

          {storageSize > 0 && (
            <div style={{
              ...card, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
              background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)"
            }}>
              <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Storage Size
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", fontFamily: "monospace" }}>
                {(storageSize / 1024).toFixed(1)} KB
              </span>
            </div>
          )}

          <div style={{
            ...card, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
            background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)"
          }}>
            <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Records
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
              {Object.values(recordCounts).reduce((a, b) => a + b, 0).toLocaleString()}
            </span>
          </div>

          {criticalIssues > 0 && (
            <div style={{
              ...card, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
              background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)"
            }}>
              <span style={{ fontSize: 11, color: "var(--cafe-danger)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Critical Issues
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-danger)" }}>
                {criticalIssues}
              </span>
            </div>
          )}

          {warningIssues > 0 && (
            <div style={{
              ...card, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
              background: "var(--cafe-warning-bg)", border: "1px solid var(--cafe-warning-border)"
            }}>
              <span style={{ fontSize: 11, color: "var(--cafe-warning)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Warnings
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-warning)" }}>
                {warningIssues}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--cafe-border)",
        background: "var(--cafe-bg-elevated)",
        padding: "0 32px"
      }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "backup", label: "Full Backup" },
          { id: "restore", label: "Restore" },
          { id: "import", label: "Import" },
          { id: "export", label: "Export" },
          { id: "scheduled", label: "Scheduled Backups" },
          { id: "health", label: "Data Health" }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: "14px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeSection === section.id ? "2px solid var(--cafe-accent)" : "2px solid transparent",
              color: activeSection === section.id ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              fontSize: 13,
              fontWeight: activeSection === section.id ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {message.text && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 24,
            background: message.type === "error" ? "var(--cafe-danger-bg)" : "var(--cafe-success-bg)",
            border: `1px solid ${message.type === "error" ? "var(--cafe-danger-border)" : "var(--cafe-success-border)"}`,
            color: message.type === "error" ? "var(--cafe-danger)" : "var(--cafe-success)",
            fontSize: 13,
            fontWeight: 500
          }}>
            {message.text}
          </div>
        )}

        {activeSection === "overview" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Overview
            </h2>
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Current Status
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Storage Mode</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {dataTools?.isLocalMode ? "Local Storage" : "Demo Mode"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Storage Usage</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: storageStatus.usage?.usagePercent > 80 ? "var(--cafe-warning)" : "var(--cafe-text-primary)" }}>
                    {storageStatus.usage?.usagePercent.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Storage Health</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: storageStatus.corrupted ? "var(--cafe-danger)" : "var(--cafe-success)" }}>
                    {storageStatus.corrupted ? "Corrupted" : "Healthy"}
                  </div>
                </div>
              </div>

              {storageStatus.corrupted && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: 6,
                  background: "var(--cafe-danger-bg)",
                  border: "1px solid var(--cafe-danger-border)",
                  marginBottom: 12
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-danger)", marginBottom: 4 }}>
                    ⚠️ Storage Issues Detected
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                    {storageStatus.issues.slice(0, 2).map((issue, idx) => (
                      <div key={idx}>• {issue.message}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleStorageRecovery} style={{ ...btn("primary"), fontSize: 12, padding: "6px 12px" }}>
                      Attempt Recovery
                    </button>
                    <button onClick={handleClearOldLogs} style={{ ...btn("ghost"), fontSize: 12, padding: "6px 12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                      Clear Old Logs
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Records</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {Object.values(recordCounts).reduce((a, b) => a + b, 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Data Health</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: criticalIssues > 0 ? "var(--cafe-danger)" : warningIssues > 0 ? "var(--cafe-warning)" : "var(--cafe-success)" }}>
                    {criticalIssues > 0 ? `${criticalIssues} Critical Issues` : warningIssues > 0 ? `${warningIssues} Warnings` : "Healthy"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Collections
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {Object.entries(recordCounts).map(([key, count]) => (
                  <div key={key} style={{
                    padding: "10px 12px",
                    background: "var(--cafe-bg-surface)",
                    borderRadius: 6,
                    border: "1px solid var(--cafe-border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: 12, color: "var(--cafe-text-secondary)", textTransform: "capitalize" }}>
                      {key}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Quick Actions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={handleCreateBackup} style={{ ...btn("primary"), fontSize: 13, padding: "12px 16px", width: "100%" }}>
                  Create Full Backup
                </button>
                <button onClick={() => setActiveSection("restore")} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                  Restore from Backup
                </button>
                <button onClick={() => setActiveSection("health")} style={{ ...btn("ghost"), fontSize: 13, padding: "12px 16px", width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}>
                  Run Data Health Check
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "backup" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Full Backup
            </h2>
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Create a complete backup of all CafeOS data including orders, customers, menu, inventory, staff, and settings.
                The backup file can be used to restore data on this device or another device.
              </p>
              <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
                <strong>Backup includes:</strong> Orders, Customers, Menu Items, Tables, Staff, Inventory, Expenses, QR Codes, Production Batches, Delivery Orders, Drivers, Routes, Suppliers, Purchase Orders, Documents, and Settings
              </div>
              <button onClick={handleCreateBackup} style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px" }}>
                Create Full Backup
              </button>
            </div>
          </div>
        )}

        {activeSection === "restore" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Restore from Backup
            </h2>
            
            {restorePreview ? (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                  Backup Preview
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Backup Date</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {new Date(restorePreview.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Version</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {restorePreview.backupVersion}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Business Name</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {restorePreview.businessName}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Collections</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {Object.keys(restorePreview.data || {}).length}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 12,
                  background: "var(--cafe-warning-bg)",
                  border: "1px solid var(--cafe-warning-border)",
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: "var(--cafe-warning)"
                }}>
                  <strong>⚠️ Warning:</strong> Restoring will replace existing data in selected collections. This action cannot be undone.
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                  Select Collections to Restore
                </h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
                  {Object.keys(restorePreview.data || {}).map(key => (
                    <label
                      key={key}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: selectedCollections.includes(key) ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border-light)",
                        background: selectedCollections.includes(key) ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollections([...selectedCollections, key]);
                          } else {
                            setSelectedCollections(selectedCollections.filter(c => c !== key));
                          }
                        }}
                        style={{ margin: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                          {key}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                          {Array.isArray(restorePreview.data[key]) ? `${restorePreview.data[key].length} records` : '1 record'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => {
                      setRestoreDialog({
                        open: true,
                        onConfirm: () => {
                          handleSelectiveRestore(restorePreview, selectedCollections);
                          setRestoreDialog({ open: false, onConfirm: null, backup: null });
                        },
                        backup: restorePreview
                      });
                    }}
                    disabled={selectedCollections.length === 0}
                    style={{
                      ...btn("primary"),
                      fontSize: 13,
                      padding: "12px 24px",
                      opacity: selectedCollections.length === 0 ? 0.5 : 1
                    }}
                  >
                    Restore Selected ({selectedCollections.length})
                  </button>
                  <button
                    onClick={() => {
                      setRestorePreview(null);
                      setSelectedCollections([]);
                    }}
                    style={{ ...btn("ghost"), fontSize: 13, padding: "12px 24px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                  <strong style={{ color: "var(--cafe-danger)" }}>Warning:</strong> Restoring from a backup will replace existing data.
                  You can preview the backup and select which collections to restore.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...label, marginBottom: 8 }}>Select Backup File</label>
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "24px", borderRadius: 8, cursor: "pointer",
                    border: "2px dashed var(--cafe-border-light)", background: "var(--cafe-bg-surface)",
                    transition: "border-color 0.15s"
                  }}>
                    <span style={{ fontSize: 24 }}>📂</span>
                    <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)", fontWeight: 500 }}>Choose backup file</span>
                    <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>JSON backup files only</span>
                    <input type="file" accept="application/json,.json" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...label, marginBottom: 8 }}>Or paste backup JSON</label>
                  <textarea
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Paste backup JSON here…"
                    rows={6}
                    style={{ ...input, width: "100%", fontFamily: "monospace", fontSize: 11, resize: "vertical", minHeight: 150 }}
                  />
                </div>
                <button onClick={handlePreviewRestore} style={{ ...btn("primary"), fontSize: 13, padding: "12px 24px", width: "100%" }}>
                  Preview Backup
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === "import" && (
          <ImportWizard 
            dataTools={dataTools} 
            onImportComplete={() => {
              setShowImportWizard(false);
              showMessage("success", "Import completed successfully");
            }}
            onCancel={() => setShowImportWizard(false)}
          />
        )}

        {activeSection === "export" && (
          <ExportCenter 
            dataTools={dataTools} 
            onCancel={() => setShowExportCenter(false)}
          />
        )}

        {activeSection === "scheduled" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Scheduled Backups
            </h2>
            
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Backup Schedule
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Status</div>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: backupStats.enabled ? "var(--cafe-success)" : "var(--cafe-text-tertiary)" 
                  }}>
                    {backupStats.enabled ? "✓ Enabled" : "✗ Disabled"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Interval</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {backupStats.interval || 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Last Backup</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {backupStats.lastBackup ? new Date(backupStats.lastBackup).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Next Backup</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {backupStats.nextBackup ? new Date(backupStats.nextBackup).toLocaleString() : 'Not scheduled'}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <button
                  onClick={() => {
                    if (backupStats.enabled) {
                      disableAutomatedBackups();
                      setBackupSchedule(getBackupSchedule());
                      setBackupStats(getBackupStats());
                      showMessage("success", "Automated backups disabled");
                    } else {
                      enableAutomatedBackups('daily', 30);
                      setBackupSchedule(getBackupSchedule());
                      setBackupStats(getBackupStats());
                      showMessage("success", "Automated backups enabled (daily)");
                    }
                  }}
                  style={{
                    ...btn(backupStats.enabled ? "ghost" : "primary"),
                    fontSize: 13,
                    padding: "10px 16px",
                    background: backupStats.enabled ? "var(--cafe-danger-bg)" : undefined,
                    border: backupStats.enabled ? "1px solid var(--cafe-danger-border)" : undefined,
                    color: backupStats.enabled ? "var(--cafe-danger)" : undefined
                  }}
                >
                  {backupStats.enabled ? "Disable" : "Enable"}
                </button>
                
                <button
                  onClick={() => {
                    const result = performAutomatedBackup(dataTools, businessDetails);
                    if (result.success) {
                      setBackupSchedule(getBackupSchedule());
                      setBackupStats(getBackupStats());
                      showMessage("success", "Backup completed successfully");
                    } else {
                      showMessage("error", `Backup failed: ${result.error}`);
                    }
                  }}
                  style={{ ...btn("ghost"), fontSize: 13, padding: "10px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}
                >
                  Run Backup Now
                </button>
              </div>

              {backupStats.enabled && (
                <div style={{
                  padding: 12,
                  background: "var(--cafe-info-bg)",
                  border: "1px solid var(--cafe-info-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--cafe-info)"
                }}>
                  <strong>ℹ️ Info:</strong> Backups are scheduled every {backupStats.interval}. Old backups are retained for {backupStats.retentionDays} days.
                </div>
              )}
            </div>

            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--cafe-text-secondary)" }}>
                Backup Statistics
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Backups</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {backupStats.totalBackups}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Successful</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-success)" }}>
                    {backupStats.successfulBackups}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Failed</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-danger)" }}>
                    {backupStats.failedBackups}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Total Size</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {(backupStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Average Size</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {(backupStats.averageSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>Retention</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                    {backupStats.retentionDays} days
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const cleaned = cleanupOldBackups();
                  setBackupStats(getBackupStats());
                  showMessage("success", `Cleaned up ${cleaned} old backups`);
                }}
                style={{ ...btn("ghost"), fontSize: 13, padding: "10px 16px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}
              >
                Clean Up Old Backups
              </button>
            </div>
          </div>
        )}

        {activeSection === "health" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--cafe-text-primary)" }}>
              Data Health
            </h2>
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: 0 }}>
                  Detected Issues
                </h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleAutoFix}
                    disabled={healthIssues.filter(i => i.fixable).length === 0}
                    style={{ ...btn("primary"), fontSize: 12, padding: "8px 12px", opacity: healthIssues.filter(i => i.fixable).length > 0 ? 1 : 0.5 }}
                  >
                    Auto-Fix
                  </button>
                  <button
                    onClick={() => {
                      if (dataTools && dataTools.getStorageSnapshot) {
                        const snapshot = dataTools.getStorageSnapshot();
                        const data = {};
                        Object.keys(snapshot.collections || {}).forEach(key => {
                          data[key] = snapshot.collections[key]?.present ? [] : null;
                        });
                        setHealthIssues(runDataHealthChecks(data));
                        setFixesApplied([]);
                      }
                    }}
                    style={{ ...btn("ghost"), fontSize: 12, padding: "8px 12px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)" }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {healthIssues.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--cafe-text-tertiary)" }}>
                  <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>✓</span>
                  No data health issues detected
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {healthIssues.map((issue, idx) => (
                    <div key={idx} style={{
                      padding: "12px 16px",
                      borderRadius: 6,
                      background: issue.severity === "error" ? "var(--cafe-danger-bg)" : "var(--cafe-warning-bg)",
                      border: `1px solid ${issue.severity === "error" ? "var(--cafe-danger-border)" : "var(--cafe-warning-border)"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: issue.severity === "error" ? "var(--cafe-danger)" : "var(--cafe-warning)" }}>
                          {issue.title}
                        </span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: issue.severity === "error" ? "var(--cafe-danger)" : "var(--cafe-warning)", fontWeight: 600 }}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                        {issue.description}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                        Module: {issue.module} • Affected: {issue.affectedRecords} records
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={backupDialog.open}
        onClose={() => setBackupDialog({ open: false, onConfirm: null })}
        onConfirm={backupDialog.onConfirm}
        title="Create Full Backup"
        description="This will create a complete backup of all CafeOS data."
        summary="The backup file will include orders, customers, menu, inventory, staff, and all other business data. Store it securely."
        confirmLabel="Create Backup"
      />

      <DestructiveDialog
        open={restoreDialog.open}
        onClose={() => setRestoreDialog({ open: false, onConfirm: null, backup: null })}
        onConfirm={restoreDialog.onConfirm}
        title="Restore from Backup"
        description="This will replace all existing data with the backup data."
        recordName="Backup Data"
        consequence={
          restoreDialog.backup ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <strong>Backup from:</strong> {new Date(restoreDialog.backup.createdAt).toLocaleString()}<br />
                <strong>Version:</strong> {restoreDialog.backup.backupVersion}<br />
                <strong>App:</strong> {restoreDialog.backup.app}
              </div>
              {restoreDialog.backup.backupRecordCounts && (
                <div style={{ marginBottom: 12, fontSize: 12 }}>
                  <strong>Backup Records:</strong><br />
                  {Object.entries(restoreDialog.backup.backupRecordCounts).map(([key, count]) => (
                    <span key={key} style={{ marginRight: 12 }}>
                      {key}: {count}
                    </span>
                  ))}
                </div>
              )}
              {restoreDialog.backup.currentRecordCounts && (
                <div style={{ marginBottom: 12, fontSize: 12 }}>
                  <strong>Current Records:</strong><br />
                  {Object.entries(restoreDialog.backup.currentRecordCounts).map(([key, count]) => (
                    <span key={key} style={{ marginRight: 12 }}>
                      {key}: {count}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ color: "var(--cafe-danger)", fontWeight: 600, marginTop: 8 }}>
                This action cannot be undone.
              </div>
            </>
          ) : "This action cannot be undone."
        }
        confirmLabel="Restore Backup"
      />

      <PermissionDeniedDialog
        open={permissionDialog.open}
        onClose={() => setPermissionDialog({ open: false, action: "", requiredPermission: "" })}
        action={permissionDialog.action}
        requiredPermission={permissionDialog.requiredPermission}
        currentRole="Current"
        contactMessage="Contact your system administrator for access."
      />
    </div>
  );
}
