import React from 'react';
// Premium Cafe Setup & Launch Wizard
// Guided setup with modern UX, progress tracking, auto-save, and validation

import { useState, useCallback, useEffect, useMemo, useRef, startTransition } from "react";
import { getSetupState, completeSetupStep, skipSetupStep, getSetupProgress, SETUP_STEPS, completeSetup } from "../../utils/appMode.js";
import { createSecurityAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import { validateSettings, getFirstErrorSection } from "../../utils/setupValidation.js";
import { saveSetupProgress, loadSetupProgress, clearSetupProgress, isOnboardingCompleted, markOnboardingCompleted } from "../../utils/setupSecurity.js";
import ConfirmDialog from "../common/ConfirmDialog";

// Animation keyframes
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const slideIn = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const slideOut = `
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-30px); }
  }
`;

const scaleIn = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const progressPulse = `
  @keyframes progressPulse {
    0% { box-shadow: 0 0 0 0 rgba(139, 69, 19, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(139, 69, 19, 0); }
    100% { box-shadow: 0 0 0 0 rgba(139, 69, 19, 0); }
  }
`;

const checkmark = `
  @keyframes checkmark {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }
`;

// Step Components
import WelcomeStep from "./steps/WelcomeStep";
import BusinessDetailsStep from "./steps/BusinessDetailsStep";
import BranchDetailsStep from "./steps/BranchDetailsStep";
import StorageSelectionStep from "./steps/StorageSelectionStep";
import OwnerAccessStep from "./steps/OwnerAccessStep";
import StaffRolesStep from "./steps/StaffRolesStep";
import TablesStep from "./steps/TablesStep";
import MenuBasicsStep from "./steps/MenuBasicsStep";
import PaymentMethodsStep from "./steps/PaymentMethodsStep";
import ReceiptsPrintersStep from "./steps/ReceiptsPrintersStep";
import QROrderingStep from "./steps/QROrderingStep";
import StockBasicsStep from "./steps/StockBasicsStep";
import DataImportStep from "./steps/DataImportStep";
import SecurityReviewStep from "./steps/SecurityReviewStep";
import BackupStep from "./steps/BackupStep";
import LaunchChecklistStep from "./steps/LaunchChecklistStep";
import KitchenStationsStep from "./steps/KitchenStationsStep";
import OrderSourcesStep from "./steps/OrderSourcesStep";

export default function SetupWizard({ settings, onSetupComplete, onCancel, onSettingsChange }) {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [setupState, setSetupState] = useState(getSetupState());
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null });
  const [goLiveDialog, setGoLiveDialog] = useState({ open: false });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Local, accumulated copy of settings. The `settings` prop is treated as the
  // initial value only - each step's submitted data (stepData passed to onNext)
  // is merged in here so it isn't silently dropped between steps.
  const [localSettings, setLocalSettings] = useState(settings || {});

  // Tracks whether the parent-provided settings object has actually changed
  // (by reference) so we don't clobber in-progress local edits on re-render.
  const lastSyncedSettingsRef = useRef(settings);
  useEffect(() => {
    if (settings && settings !== lastSyncedSettingsRef.current) {
      lastSyncedSettingsRef.current = settings;
      setLocalSettings(prev => ({ ...settings, ...prev }));
    }
  }, [settings]);

  // Mount tracking + pending timeout registry so async transitions can't set
  // state after unmount and don't stack up if the user clicks rapidly.
  const isMountedRef = useRef(true);
  const pendingTimeoutsRef = useRef(new Set());
  const scheduleTimeout = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current.delete(id);
      if (isMountedRef.current) fn();
    }, delay);
    pendingTimeoutsRef.current.add(id);
    return id;
  }, []);
  useEffect(() => {
    isMountedRef.current = true;
    const pendingTimeouts = pendingTimeoutsRef.current;
    return () => {
      isMountedRef.current = false;
      pendingTimeouts.forEach(id => clearTimeout(id));
      pendingTimeouts.clear();
    };
  }, []);

  // Responsive detection
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  // Load setup state on mount with crash recovery
  useEffect(() => {
    try {
      // Check if onboarding is already completed
      if (isOnboardingCompleted()) {
        // Redirect to dashboard - onboarding already done
        if (onSetupComplete) {
          onSetupComplete();
        }
        return;
      }

      // Check for crash recovery
      const savedProgress = loadSetupProgress();
      if (savedProgress && savedProgress.currentStep) {
        const currentState = getSetupState();
        startTransition(() => {
          setSetupState({ ...currentState, ...savedProgress });
          setCurrentStep(savedProgress.currentStep);
          if (savedProgress.settings) {
            setLocalSettings(prev => ({ ...prev, ...savedProgress.settings }));
          }
          if (savedProgress.lastSaved) {
            setLastSaved(savedProgress.lastSaved);
          }
        });
        // Show recovery notification (could be a toast in production)
        console.log('[SetupWizard] Recovered setup progress from:', savedProgress.lastSaved);
      } else {
        const state = getSetupState();
        startTransition(() => {
          setSetupState(state);
          if (state.currentStep && state.currentStep !== 'complete') {
            setCurrentStep(state.currentStep);
          }
          if (state.lastSaved) {
            setLastSaved(state.lastSaved);
          }
        });
      }
    } catch (err) {
      // Storage can throw (corrupted data, blocked/private-mode storage, etc).
      // Fall back to a clean setup instead of crashing the whole wizard.
      console.error('[SetupWizard] Failed to load saved progress, starting fresh:', err);
      startTransition(() => {
        setError({
          title: 'Could not restore previous progress',
          message: "We couldn't load your saved setup progress, so we're starting fresh. Your previous data may still be recoverable from a backup.",
          retry: null
        });
      });
    }
  }, [onSetupComplete]);

  // Escape closes whichever modal/dialog is open, matching what the Help
  // modal itself tells users to expect (previously unimplemented).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showHelpModal) setShowHelpModal(false);
      else if (showExitDialog) setShowExitDialog(false);
      else if (goLiveDialog.open) setGoLiveDialog({ open: false });
      else if (confirmDialog.open) setConfirmDialog({ open: false });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal, showExitDialog, goLiveDialog.open, confirmDialog.open]);

  const stepIndex = useMemo(() => {
    return SETUP_STEPS.findIndex(s => s.id === currentStep);
  }, [currentStep]);

  // NOTE: previously memoized with an empty dependency array, which froze the
  // displayed progress at whatever it was on first mount. It now recomputes
  // whenever the underlying setup state changes.
  const progress = useMemo(() => {
    return getSetupProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupState]);

  const estimatedTimeRemaining = useMemo(() => {
    const remainingSteps = SETUP_STEPS.length - stepIndex - 1;
    const avgTimePerStep = 2; // minutes
    return `${remainingSteps * avgTimePerStep} min`;
  }, [stepIndex]);

  // Auto-save effect with visual feedback using secure storage
  useEffect(() => {
    if (hasUnsavedChanges) {
      const saveTimeout = setTimeout(() => {
        setSaveStatus('saving');
        // Save to secure storage
        saveSetupProgress(currentStep, localSettings);
        if (isMountedRef.current) {
          setLastSaved(new Date().toISOString());
          setHasUnsavedChanges(false);
          setSaveStatus('saved');
        }

        // Reset saved status after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) setSaveStatus('idle');
        }, 2000);
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [hasUnsavedChanges, currentStep, localSettings]);

  // Exit protection on beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNext = useCallback((stepData = {}) => {
    if (isLoading || isTransitioning) return; // guard against double-submits
    setIsLoading(true);
    setIsTransitioning(true);
    setError(null);

    // Merge whatever the step collected into our running settings object so
    // it isn't lost when we move to the next step. Previously stepData was
    // accepted as a parameter but never used anywhere.
    if (stepData && Object.keys(stepData).length > 0) {
      setLocalSettings(prev => {
        const merged = { ...prev, ...stepData };
        if (onSettingsChange) onSettingsChange(merged);
        return merged;
      });
    }

    try {
      const step = SETUP_STEPS[stepIndex];
      if (step) {
        completeSetupStep(step.id);
        setSetupState(getSetupState());

        const auditLog = createSecurityAuditLog({
          userId: getCurrentUserId(),
          details: {
            action: 'SETUP_STEP_COMPLETED',
            step: step.id,
            stepName: step.name
          }
        });
        console.log('[SetupWizard] Step completed:', auditLog);
      }

      scheduleTimeout(() => {
        if (stepIndex < SETUP_STEPS.length - 1) {
          setCurrentStep(SETUP_STEPS[stepIndex + 1].id);
        }
        setHasUnsavedChanges(true);
        setIsTransitioning(false);
      }, 400);
    } catch (_err) {
      setError({
        title: 'Failed to complete step',
        message: 'Something went wrong while saving your progress. Please try again.',
        retry: () => handleNext(stepData)
      });
      setIsTransitioning(false);
    } finally {
      scheduleTimeout(() => setIsLoading(false), 400);
    }
  }, [stepIndex, isLoading, isTransitioning, onSettingsChange, scheduleTimeout]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      scheduleTimeout(() => {
        setCurrentStep(SETUP_STEPS[stepIndex - 1].id);
        setIsTransitioning(false);
      }, 400);
    }
  }, [stepIndex, isTransitioning, scheduleTimeout]);

  const handleStepClick = useCallback((stepId, idx) => {
    // Only allow clicking completed steps or current step, and never while
    // a transition/save is already in flight (previously this could stack
    // multiple pending step changes if clicked rapidly).
    if ((idx < stepIndex || idx === stepIndex) && !isTransitioning && !isLoading) {
      setIsTransitioning(true);
      scheduleTimeout(() => {
        setCurrentStep(stepId);
        setIsTransitioning(false);
      }, 400);
    }
  }, [stepIndex, isTransitioning, isLoading, scheduleTimeout]);

  const handleSkip = useCallback(() => {
    const step = SETUP_STEPS[stepIndex];
    if (step && !step.required) {
      skipSetupStep(step.id);
      
      const auditLog = createSecurityAuditLog({
        userId: getCurrentUserId(),
        details: {
          action: 'SETUP_STEP_SKIPPED',
          step: step.id,
          stepName: step.name
        }
      });
      console.log('[SetupWizard] Step skipped:', auditLog);
    }

    if (stepIndex < SETUP_STEPS.length - 1) {
      setCurrentStep(SETUP_STEPS[stepIndex + 1].id);
    }
  }, [stepIndex]);

  const handleSaveAndContinueLater = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Save Progress & Exit',
      description: 'Your progress will be saved. You can continue setup later from the welcome screen.',
      onConfirm: () => {
        setLastSaved(new Date().toISOString());
        setHasUnsavedChanges(false);
        if (onCancel) onCancel();
      }
    });
  }, [onCancel]);

  const handleExitSetup = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      if (onCancel) onCancel();
    }
  }, [hasUnsavedChanges, onCancel]);

  const handleExitAnyway = useCallback(() => {
    setShowExitDialog(false);
    if (onCancel) onCancel();
  }, [onCancel]);

  const handleSaveAndExit = useCallback(() => {
    saveSetupProgress(currentStep, localSettings);
    setLastSaved(new Date().toISOString());
    setHasUnsavedChanges(false);
    setShowExitDialog(false);
    if (onCancel) onCancel();
  }, [currentStep, localSettings, onCancel]);

  const handleGoLive = useCallback(() => {
    setGoLiveDialog({ open: true });
  }, []);

  const confirmGoLive = useCallback(() => {
    // Validate all settings before completion
    const validation = validateSettings(localSettings);
    
    if (validation.errors.length > 0) {
      // Cannot complete - show errors
      setError({
        title: 'Setup Incomplete',
        message: `Please fix the following issues before launching:`,
        errors: validation.errors,
        firstErrorSection: getFirstErrorSection(localSettings)
      });
      setGoLiveDialog({ open: false });
      return;
    }
    
    // All validations passed - complete setup
    completeSetup();
    markOnboardingCompleted();
    if (onSettingsChange) onSettingsChange(localSettings);
    
    const auditLog = createSecurityAuditLog({
      userId: getCurrentUserId(),
      details: {
        action: 'SETUP_COMPLETED',
        description: 'Cafe setup completed and went live'
      }
    });
    console.log('[SetupWizard] Setup completed:', auditLog);

    setGoLiveDialog({ open: false });
    clearSetupProgress(); // Clear progress after successful completion
    if (onSetupComplete) onSetupComplete(localSettings);
  }, [localSettings, onSetupComplete, onSettingsChange]);

  const renderStep = () => {
    const stepProps = {
      settings: localSettings,
      onSettingsChange: (partial) => setLocalSettings(prev => ({ ...prev, ...partial })),
      onNext: handleNext,
      // eslint-disable-next-line react-hooks/refs
      onBack: handleBack,
      onSkip: handleSkip,
      stepIndex,
      totalSteps: SETUP_STEPS.length,
      isMobile,
      isTablet,
      isLoading,
      error,
      setError,
      showContextPanel,
      setShowContextPanel
    };

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'business':
        return <BusinessDetailsStep {...stepProps} />;
      case 'branch':
        return <BranchDetailsStep {...stepProps} />;
      case 'storage':
        return <StorageSelectionStep {...stepProps} />;
      case 'owner':
        return <OwnerAccessStep {...stepProps} />;
      case 'staff':
        return <StaffRolesStep {...stepProps} />;
      case 'tables':
        return <TablesStep {...stepProps} />;
      case 'menu':
        return <MenuBasicsStep {...stepProps} />;
      case 'kitchen':
        return <KitchenStationsStep {...stepProps} />;
      case 'channels':
        return <OrderSourcesStep {...stepProps} />;
      case 'payments':
        return <PaymentMethodsStep {...stepProps} />;
      case 'receipts':
        return <ReceiptsPrintersStep {...stepProps} />;
      case 'qr':
        return <QROrderingStep {...stepProps} />;
      case 'stock':
        return <StockBasicsStep {...stepProps} />;
      case 'import':
        return <DataImportStep {...stepProps} />;
      case 'security':
        return <SecurityReviewStep {...stepProps} />;
      case 'backup':
        return <BackupStep {...stepProps} />;
      case 'checklist':
        return <LaunchChecklistStep {...stepProps} onGoLive={handleGoLive} />;
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  const stepInfo = SETUP_STEPS[stepIndex] || SETUP_STEPS[0];

  // Context panel content based on current step
  const getContextContent = () => {
    const contextMap = {
      welcome: {
        title: "Getting Started",
        tip: "Welcome to CafeOS! This wizard will guide you through setting up your cafe for production use. Each step is designed to be quick and easy, with helpful tips along the way.",
        warning: null,
        preview: null,
        details: [
          "Setup typically takes 5-10 minutes",
          "Your progress is auto-saved",
          "You can exit and resume anytime",
          "All settings can be changed later"
        ]
      },
      business: {
        title: "Business Information",
        tip: "Enter your cafe's basic details like name, address, and contact info. This information will appear on receipts, invoices, and official documents.",
        warning: "Make sure the business name matches your legal registration for tax and compliance purposes.",
        preview: "Business card preview",
        details: [
          "Business name appears on all receipts",
          "Address used for delivery and tax calculations",
          "Contact info for customer communications",
          "Logo can be added later in Settings"
        ]
      },
      branch: {
        title: "Branch Details",
        tip: "Configure your specific branch location and operational settings. If you have multiple locations, each will have its own branch configuration.",
        warning: "Branch ID is used for data separation - choose carefully as it cannot be changed easily later.",
        preview: null,
        details: [
          "Branch ID uniquely identifies this location",
          "Operating hours affect order availability",
          "Time zone ensures accurate timestamps",
          "Multiple branches can be managed from one account"
        ]
      },
      storage: {
        title: "Storage Backend",
        tip: "Choose where your cafe data will be stored. This affects data persistence, backup options, and multi-device synchronization.",
        warning: "Local storage is limited to browser capacity. Cloud storage requires internet connection but offers better reliability.",
        preview: null,
        details: [
          "Local Storage: Free, works offline, single device",
          "AWS S3: Cloud storage, multi-device sync, requires AWS account",
          "Mock Storage: For testing only, data not persisted",
          "Storage provider can be changed later in Settings"
        ]
      },
      owner: {
        title: "Owner Access",
        tip: "Set up the primary owner account with full administrative access. This account will have complete control over all cafe operations.",
        warning: "Keep your credentials secure. You can add more staff with limited permissions later.",
        preview: null,
        details: [
          "Owner account has full system access",
          "Email used for password recovery",
          "Set a strong, memorable password",
          "Additional staff can be added in Staff step"
        ]
      },
      staff: {
        title: "Staff Roles",
        tip: "Define roles and permissions for your team members. Roles determine what each staff member can access and modify in the system.",
        warning: "Only give necessary permissions to each role for security.",
        preview: "Role permissions matrix",
        details: [
          "Roles: Owner, Manager, Staff, Kitchen, Cashier",
          "Each role has specific permissions",
          "Staff can be assigned to multiple roles",
          "Roles can be modified later in Settings"
        ]
      },
      tables: {
        title: "Table Configuration",
        tip: "Set up your floor plan with table numbers and seating capacity. This affects order routing and table management.",
        warning: "Table numbers should match your physical floor plan for smooth operations.",
        preview: "Floor plan preview",
        details: [
          "Table numbers must be unique",
          "Seating capacity affects order limits",
          "Floor plan visualizes your layout",
          "Tables can be added/removed anytime"
        ]
      },
      kitchen: {
        title: "Kitchen Stations",
        tip: "Define your kitchen zones (e.g., Grill, Bakery, Cold) to route orders intelligently. You can skip this and add stations later in Settings.",
        warning: null,
        preview: null,
        details: [
          "Each station routes specific menu categories",
          "KDS (Kitchen Display) is grouped by station",
          "Add colours to differentiate stations quickly",
          "You can add unlimited stations anytime"
        ]
      },
      menu: {
        title: "Menu Setup",
        tip: "Add your menu items, categories, and pricing. This is the core of your ordering system.",
        warning: "Prices can be updated anytime from the Menu section. Start with your most popular items.",
        preview: "Menu card preview",
        details: [
          "Categories organize your menu",
          "Prices include or exclude tax based on settings",
          "Modifiers for customizations (extra cheese, etc.)",
          "Items can be marked as unavailable (86'd)"
        ]
      },
      payments: {
        title: "Payment Methods",
        tip: "Configure which payment methods you accept and how they're processed.",
        warning: "Test payment integrations before going live to avoid issues at checkout.",
        preview: null,
        details: [
          "Cash, Card, UPI, and other methods",
          "Tip handling configuration",
          "Change rounding settings",
          "Payment gateway setup (if applicable)"
        ]
      },
      channels: {
        title: "Order Sources",
        tip: "Choose how customers can place orders — dine-in walk-in, takeaway, or delivery. You can enable all three or just the ones you operate.",
        warning: null,
        preview: null,
        details: [
          "Walk-in: table-side ordering",
          "Takeaway: counter pickup orders",
          "Delivery: home delivery orders",
          "All channels can be toggled anytime"
        ]
      },
      receipts: {
        title: "Receipts & Printers",
        tip: "Set up receipt formatting and printer connections for kitchen and customer receipts.",
        warning: "Test your printer configuration before going live. Ensure printers are connected and have paper.",
        preview: "Receipt preview",
        details: [
          "Kitchen printer for order tickets",
          "Customer receipt printer",
          "Custom receipt headers/footers",
          "Printer types: thermal, inkjet, etc."
        ]
      },
      qr: {
        title: "QR Ordering",
        tip: "Enable customers to order from their tables using QR codes. Great for self-service and reducing staff workload.",
        warning: "Requires stable internet connection. Test QR codes before deploying to tables.",
        preview: "QR code preview",
        details: [
          "Customers scan QR to view menu and order",
          "Orders go directly to kitchen",
          "Payment integration available",
          "Customizable QR code design"
        ]
      },
      stock: {
        title: "Inventory Basics",
        tip: "Set up initial inventory items and suppliers. Track stock levels and get alerts when items run low.",
        warning: "Accurate initial stock ensures proper tracking. Update regularly for best results.",
        preview: null,
        details: [
          "Track ingredients and finished goods",
          "Set low stock alert thresholds",
          "Manage supplier information",
          "Stock deducted automatically from orders"
        ]
      },
      import: {
        title: "Data Import",
        tip: "Import existing data from other systems like POS software, spreadsheets, or previous CafeOS backups.",
        warning: "This step is optional. You can start fresh and import data later if needed.",
        preview: null,
        details: [
          "Import from CSV or JSON files",
          "Map fields to CafeOS format",
          "Preview before importing",
          "Backup current data before import"
        ]
      },
      security: {
        title: "Security Review",
        tip: "Review your security settings and access controls to ensure your cafe data is protected.",
        warning: "Ensure proper security measures are in place before going live.",
        preview: null,
        details: [
          "Review staff permissions",
          "Check password requirements",
          "Enable two-factor authentication",
          "Review audit logs if needed"
        ]
      },
      backup: {
        title: "Backup Setup",
        tip: "Configure automatic backups to protect your data. Regular backups are essential for data protection.",
        warning: "Regular backups are essential for data protection. Test restore process periodically.",
        preview: null,
        details: [
          "Automatic daily/weekly backups",
          "Manual backup anytime",
          "Export to cloud storage",
          "Restore from backup when needed"
        ]
      },
      checklist: {
        title: "Launch Checklist",
        tip: "Review everything before going live. This checklist ensures you're ready for production use.",
        warning: "Complete all required items before launching to avoid issues during operations.",
        preview: null,
        details: [
          "Verify all settings are correct",
          "Test payment processing",
          "Test printer connections",
          "Train staff on the system"
        ]
      }
    };
    return contextMap[currentStep] || contextMap.welcome;
  };

  const contextContent = getContextContent();

  if (isMobile) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100vh", 
        background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
        color: "var(--cafe-text)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background decorations */}
        <div style={{
          position: "absolute",
          top: "5%",
          right: "10%",
          width: 200,
          height: 200,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "5%",
          width: 150,
          height: 150,
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "50%",
          filter: "blur(40px)"
        }} />

        {/* Mobile Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: "#fff", 
                margin: 0,
                letterSpacing: "-0.5px" 
              }}>
                Cafe Setup
              </h1>
              <p style={{ 
                fontSize: 13, 
                color: "rgba(255, 255, 255, 0.7)", 
                margin: "2px 0 0" 
              }}>
                Step {stepIndex + 1} of {SETUP_STEPS.length}
              </p>
            </div>
            <div style={{
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              borderRadius: 20,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.15)"
            }}>
              {progress}%
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: "rgba(255, 255, 255, 0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #8B4513 0%, #A0522D 100%)",
              borderRadius: 2,
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: progress < 100 ? "progressPulse 2s ease-in-out infinite" : "none"
            }} />
          </div>
        </div>

        <style>{fadeIn}{slideIn}{slideOut}{scaleIn}{progressPulse}{checkmark}</style>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "20px",
          background: "var(--cafe-bg)",
          position: "relative",
          zIndex: 1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: 8
        }}>
          {/* Collapsible Context Card */}
          {showContextPanel && (
            <div style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              borderRadius: 12,
              border: "1px solid var(--cafe-border-light)",
              marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  margin: 0
                }}>
                  {contextContent.title}
                </h3>
                <button
                  onClick={() => setShowContextPanel(false)}
                  style={{
                    padding: "6px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 14,
                    color: "var(--cafe-text-tertiary)",
                    cursor: "pointer"
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{
                fontSize: 13,
                color: "var(--cafe-text-secondary)",
                margin: 0,
                lineHeight: 1.5
              }}>
                {contextContent.tip}
              </p>
              {contextContent.warning && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(255, 193, 7, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 193, 7, 0.2)"
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>⚠️</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255, 193, 7, 0.9)"
                    }}>
                      Important
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12,
                    color: "rgba(255, 193, 7, 0.8)",
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {contextContent.warning}
                  </p>
                </div>
              )}
            </div>
          )}

          {!showContextPanel && (
            <button
              onClick={() => setShowContextPanel(true)}
              style={{
                padding: "12px 16px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border-light)",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                marginBottom: 20,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>💡</span>
              <span>Show Tips</span>
            </button>
          )}

          {error && (
            <div style={{
              padding: 16,
              background: "var(--cafe-danger-bg)",
              border: "1px solid var(--cafe-danger-border)",
              borderRadius: 12,
              marginBottom: 20
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-danger)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true">⚠️</span>
                {error.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--cafe-text-secondary)", margin: "0 0 12px" }}>
                {error.message}
              </p>
              <button
                onClick={error.retry}
                style={{
                  padding: "10px 16px",
                  background: "var(--cafe-danger)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            </div>
          )}
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{
                width: 40,
                height: 40,
                border: "3px solid var(--cafe-border)",
                borderTopColor: "var(--cafe-accent)",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite"
              }} />
              <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", margin: 0 }}>
                Saving...
              </p>
            </div>
          ) : (
            <div style={{ opacity: isTransitioning ? 0.5 : 1, transition: "opacity 0.3s ease" }}>
              {renderStep()}
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          display: "flex",
          gap: 10,
          position: "relative",
          zIndex: 1
        }}>
          {stepIndex > 0 && (
            <button
              onClick={handleBack}
              disabled={isLoading || isTransitioning}
              aria-label="Go to previous step"
              style={{
                flex: 1,
                padding: "14px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isTransitioning) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ← Back
            </button>
          )}
          {stepInfo && !stepInfo.required && (
            <button
              onClick={handleSkip}
              disabled={isLoading || isTransitioning}
              aria-label="Skip this step"
              style={{
                flex: 1,
                padding: "14px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.7)",
                cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isTransitioning) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Skip
            </button>
          )}
          <button
            onClick={handleSaveAndContinueLater}
            disabled={isLoading || isTransitioning}
            aria-label="Save progress and exit"
            style={{
              flex: 1,
              padding: "14px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isTransitioning) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            Save & Exit
          </button>
          {onCancel && (
            <button
              onClick={handleExitSetup}
              style={{
                padding: "14px",
                background: "transparent",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.6)",
                cursor: "pointer"
              }}
            >
              Exit
            </button>
          )}
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel="Confirm"
        />
        <ConfirmDialog
          open={goLiveDialog.open}
          onClose={() => setGoLiveDialog({ open: false })}
          onConfirm={confirmGoLive}
          title="Go Live with CafeOS"
          description="You're about to activate production mode for your cafe."
          summary="This will disable demo data generation and mark your setup as complete. You can always return to settings to make changes."
          confirmLabel="Go Live"
        />
        {/* Exit Protection Dialog */}
        {showExitDialog && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}>
            <div style={{
              background: "var(--cafe-bg-card)",
              borderRadius: 20,
              padding: 24,
              maxWidth: 340,
              width: "90%",
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)"
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--cafe-text-primary)",
                margin: "0 0 12px"
              }}>
                Unsaved Progress
              </h3>
              <p style={{
                fontSize: 14,
                color: "var(--cafe-text-secondary)",
                margin: "0 0 20px",
                lineHeight: 1.5
              }}>
                You have unsaved changes. What would you like to do?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleSaveAndExit}
                  style={{
                    padding: "14px 20px",
                    background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(139, 69, 19, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Save & Exit
                </button>
                <button
                  onClick={handleExitAnyway}
                  style={{
                    padding: "14px 20px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-danger)";
                    e.currentTarget.style.color = "var(--cafe-danger)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--cafe-border)";
                    e.currentTarget.style.color = "var(--cafe-text-secondary)";
                  }}
                >
                  Exit Anyway
                </button>
                <button
                  onClick={() => setShowExitDialog(false)}
                  style={{
                    padding: "14px 20px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--cafe-text-tertiary)",
                    cursor: "pointer"
                  }}
                >
                  Continue Setup
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      background: "linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #3d2817 100%)",
      color: "var(--cafe-text)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background decorations */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "20%",
        width: 400,
        height: 400,
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "50%",
        filter: "blur(100px)"
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%",
        left: "10%",
        width: 300,
        height: 300,
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "50%",
        filter: "blur(80px)"
      }} />

      {/* Left Panel - Progress & Branding (35%) */}
      <div style={{
        width: "35%",
        padding: "48px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
          fontSize: 36,
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
        }}>
          ☕
        </div>

        {/* Progress Card */}
        <div style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: 28,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-2px"
            }}>
              {progress}
            </span>
            <span style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.8)",
              fontWeight: 600
            }}>
              %
            </span>
          </div>
          <p style={{
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.85)",
            margin: "0 0 20px",
            fontWeight: 500
          }}>
            Step {stepIndex + 1} of {SETUP_STEPS.length}: {stepInfo.name}
          </p>

          {/* Progress Bar */}
          <div style={{ 
            height: 8, 
            background: "rgba(255, 255, 255, 0.15)", 
            borderRadius: 4, 
            overflow: "hidden",
            marginBottom: 16
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #8B4513 0%, #A0522D 100%)",
              borderRadius: 4,
              transition: "width 0.5s ease",
              position: "relative"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                animation: "shimmer 2s infinite"
              }} />
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: 8
          }}>
            <span>{stepIndex + 1} completed</span>
            <span>~{estimatedTimeRemaining} left</span>
          </div>
          
          <div style={{
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.5)",
            textAlign: "center"
          }}>
            {SETUP_STEPS.length - stepIndex - 1} steps remaining
          </div>
        </div>

        {/* Step List */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 24 }}>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.6)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}>
            Setup Steps
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SETUP_STEPS.map((step, idx) => {
              const isReachable = idx < stepIndex || idx === stepIndex;
              return (
              <div
                key={step.id}
                role="button"
                tabIndex={isReachable ? 0 : -1}
                aria-current={idx === stepIndex ? "step" : undefined}
                aria-disabled={!isReachable}
                onClick={() => handleStepClick(step.id, idx)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && isReachable) {
                    e.preventDefault();
                    handleStepClick(step.id, idx);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: idx === stepIndex 
                    ? "rgba(255, 255, 255, 0.12)" 
                    : idx < stepIndex 
                      ? "rgba(255, 255, 255, 0.04)" 
                      : "transparent",
                  border: idx === stepIndex 
                    ? "1px solid rgba(255, 255, 255, 0.2)" 
                    : "none",
                  cursor: isReachable ? "pointer" : "default",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  if (isReachable) {
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255, 255, 255, 0.4)";
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
                onMouseEnter={(e) => {
                  if (idx < stepIndex || idx === stepIndex) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (idx === stepIndex) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                  } else if (idx < stepIndex) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: idx < stepIndex 
                    ? "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)"
                    : idx === stepIndex 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: idx < stepIndex 
                    ? "#fff" 
                    : "rgba(255, 255, 255, 0.7)",
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {idx < stepIndex ? "✓" : idx + 1}
                </div>
                <span style={{
                  fontSize: 14,
                  color: isReachable ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.45)",
                  fontWeight: idx === stepIndex ? 600 : 400,
                  flex: 1
                }}>
                  {step.name}
                </span>
              </div>
            );
            })}
          </div>
        </div>

        {/* Save Status */}
        <div style={{
          padding: 16,
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(20px)",
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: 13,
          color: "rgba(255, 255, 255, 0.85)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          {saveStatus === 'saving' && (
            <>
              <div style={{
                width: 14,
                height: 14,
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <span style={{ color: "#8B4513" }}>✓</span>
              <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
            </>
          )}
          {saveStatus === 'idle' && lastSaved && (
            <>
              <span style={{ color: "#8B4513" }}>✓</span>
              <span>Last saved {new Date(lastSaved).toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Content (65%) */}
      <div style={{
        width: "65%",
        display: "flex",
        flexDirection: "column",
        background: "var(--cafe-bg)",
        position: "relative",
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          padding: "28px 40px",
          borderBottom: "1px solid var(--cafe-border-light)",
          background: "var(--cafe-bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cafe-text-primary)",
                margin: 0,
                letterSpacing: "-0.5px"
              }}>
                {stepInfo.name}
              </h2>
              {stepInfo.required && (
                <span style={{
                  padding: "4px 10px",
                  background: "var(--cafe-accent-bg)",
                  color: "var(--cafe-accent)",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Required
                </span>
              )}
              {!stepInfo.required && (
                <span style={{
                  padding: "4px 10px",
                  background: "var(--cafe-bg-surface)",
                  color: "var(--cafe-text-tertiary)",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  border: "1px solid var(--cafe-border-light)"
                }}>
                  Optional
                </span>
              )}
            </div>
            <p style={{
              fontSize: 14,
              color: "var(--cafe-text-secondary)",
              margin: 0,
              lineHeight: 1.5
            }}>
              {stepInfo.description}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              padding: "8px 16px",
              background: "var(--cafe-bg-surface)",
              borderRadius: 8,
              border: "1px solid var(--cafe-border-light)",
              fontSize: 12,
              color: "var(--cafe-text-tertiary)",
              textAlign: "center"
            }}>
              <div style={{ fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                {stepIndex + 1}
              </div>
              <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)" }}>
                of {SETUP_STEPS.length}
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              aria-label="Get help"
              style={{
                padding: "12px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                fontSize: 18,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-accent)";
                e.currentTarget.style.background = "var(--cafe-accent-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.background = "var(--cafe-bg-surface)";
              }}
            >
              ?
            </button>
            {onCancel && (
              <button
                onClick={handleExitSetup}
                style={{
                  padding: "12px 20px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-danger)";
                  e.currentTarget.style.color = "var(--cafe-danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.color = "var(--cafe-text-secondary)";
                }}
              >
                Exit Setup
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          flex: 1, 
          display: "flex",
          overflow: "hidden"
        }}>
          {/* Step Content */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "40px",
            opacity: isTransitioning ? 0.5 : 1,
            transition: "opacity 0.3s ease"
          }}>
            {error && (
              <div style={{
                padding: 20,
                background: "var(--cafe-danger-bg)",
                border: "1px solid var(--cafe-danger-border)",
                borderRadius: 12,
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-danger)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden="true">⚠️</span>
                  {error.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)", margin: "0 0 16px" }}>
                  {error.message}
                </p>
                {error.errors && error.errors.length > 0 && (
                  <ul style={{ margin: "0 0 16px", paddingLeft: 20, color: "var(--cafe-text-secondary)" }}>
                    {error.errors.map((err, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <strong>{err.section}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                )}
                {error.retry && (
                  <button
                    onClick={error.retry}
                    style={{
                      padding: "10px 20px",
                      background: "var(--cafe-danger)",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {isLoading ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: "4px solid var(--cafe-border)",
                  borderTopColor: "var(--cafe-accent)",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  animation: "spin 1s linear infinite"
                }} />
                <p style={{ fontSize: 16, color: "var(--cafe-text-secondary)", margin: 0 }}>
                  Saving your progress...
                </p>
              </div>
            ) : (
              renderStep()
            )}
          </div>

          {/* Context Panel */}
          {!isMobile && showContextPanel && (
            <div style={{
              width: 320,
              padding: "32px 24px",
              background: "var(--cafe-bg-surface)",
              borderLeft: "1px solid var(--cafe-border-light)",
              overflowY: "auto"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-primary)",
                  margin: 0
                }}>
                  {contextContent.title}
                </h3>
                <button
                  onClick={() => setShowContextPanel(false)}
                  style={{
                    padding: "8px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 16,
                    color: "var(--cafe-text-tertiary)",
                    cursor: "pointer"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                padding: 16,
                background: "var(--cafe-bg-elevated)",
                borderRadius: 10,
                border: "1px solid var(--cafe-border-light)",
                marginBottom: 16
              }}>
                <p style={{
                  fontSize: 13,
                  color: "var(--cafe-text-secondary)",
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  {contextContent.tip}
                </p>
              </div>

              {contextContent.warning && (
                <div style={{
                  padding: 16,
                  background: "rgba(255, 193, 7, 0.1)",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                  marginBottom: 16
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(255, 193, 7, 0.9)"
                    }}>
                      Important
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: "rgba(255, 193, 7, 0.8)",
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {contextContent.warning}
                  </p>
                </div>
              )}

              {contextContent.details && contextContent.details.length > 0 && (
                <div style={{
                  padding: 16,
                  background: "var(--cafe-bg-elevated)",
                  borderRadius: 10,
                  border: "1px solid var(--cafe-border-light)",
                  marginBottom: 16
                }}>
                  <h4 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--cafe-text-tertiary)",
                    margin: "0 0 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Key Points
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: 16,
                    color: "var(--cafe-text-secondary)",
                    fontSize: 13,
                    lineHeight: 1.6
                  }}>
                    {contextContent.details.map((detail, idx) => (
                      <li key={idx} style={{ marginBottom: idx < contextContent.details.length - 1 ? 8 : 0 }}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {contextContent.preview && (
                <div style={{
                  padding: 16,
                  background: "var(--cafe-bg-elevated)",
                  borderRadius: 10,
                  border: "1px solid var(--cafe-border-light)",
                  textAlign: "center"
                }}>
                  <p style={{
                    fontSize: 12,
                    color: "var(--cafe-text-tertiary)",
                    margin: "0 0 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Preview
                  </p>
                  <div style={{
                    padding: 20,
                    background: "#fff",
                    borderRadius: 8,
                    color: "#000",
                    fontSize: 12
                  }}>
                    {contextContent.preview}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid var(--cafe-border-light)"
              }}>
                <p style={{
                  fontSize: 12,
                  color: "var(--cafe-text-tertiary)",
                  margin: "0 0 8px"
                }}>
                  Next: {SETUP_STEPS[stepIndex + 1]?.name || "Complete Setup"}
                </p>
                <p style={{
                  fontSize: 12,
                  color: "var(--cafe-text-tertiary)",
                  margin: 0
                }}>
                  Estimated: ~2 min
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          padding: "24px 40px",
          borderTop: "1px solid var(--cafe-border-light)",
          background: "var(--cafe-bg-elevated)",
          display: "flex",
          gap: 12,
          alignItems: "center"
        }}>
          {stepIndex > 0 && (
            <button
              onClick={handleBack}
              disabled={isLoading || isTransitioning}
              aria-label="Go to previous step"
              style={{
                padding: "14px 28px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isTransitioning) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.background = "var(--cafe-accent-bg)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.background = "var(--cafe-bg-surface)";
              }}
            >
              ← Back
            </button>
          )}
          {stepInfo && !stepInfo.required && (
            <button
              onClick={handleSkip}
              disabled={isLoading || isTransitioning}
              aria-label="Skip this step"
              style={{
                padding: "14px 20px",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isTransitioning) {
                  e.currentTarget.style.color = "var(--cafe-text-secondary)";
                  e.currentTarget.style.background = "var(--cafe-bg-surface)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--cafe-text-tertiary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Skip Step
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!isMobile && !showContextPanel && (
            <button
              onClick={() => setShowContextPanel(true)}
              style={{
                padding: "14px 20px",
                background: "transparent",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-accent)";
                e.currentTarget.style.background = "var(--cafe-accent-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--cafe-border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Show Context
            </button>
          )}
          <button
            onClick={handleSaveAndContinueLater}
            disabled={isLoading || isTransitioning}
            aria-label="Save progress and exit"
            style={{
              padding: "14px 28px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              cursor: (isLoading || isTransitioning) ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isTransitioning) {
                e.currentTarget.style.borderColor = "var(--cafe-accent)";
                e.currentTarget.style.background = "var(--cafe-accent-bg)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--cafe-border)";
              e.currentTarget.style.background = "var(--cafe-bg-surface)";
            }}
          >
            Save & Exit
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 20,
            padding: 40,
            maxWidth: 650,
            width: "90%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)"
          }}>
            <h2 style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              margin: "0 0 8px"
            }}>
              Setup Guide
            </h2>
            <p style={{
              fontSize: 15,
              color: "var(--cafe-text-secondary)",
              margin: "0 0 28px",
              lineHeight: 1.6
            }}>
              Everything you need to know about setting up CafeOS for your cafe.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Auto-Save Progress
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    Your setup progress is saved automatically after each step. You can exit anytime and resume from where you left off. Look for the "Saved" indicator in the left panel.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>⌨️</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Navigation Tips
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    Use Tab to move between form fields, Enter to submit forms, and Escape to close modals. Click on completed steps in the left panel to go back and review or change your answers.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>⏭️</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Skip Optional Steps
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    Some steps are optional and can be skipped. You can always configure these later from the Settings section. Required steps are marked and must be completed.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Change Later
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    Don't worry about getting everything perfect. You can modify all settings, menu items, staff roles, and other configurations after setup from the respective sections in the app.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Mobile Support
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    CafeOS works on desktop, tablet, and mobile devices. The setup wizard adapts to your screen size. For the best experience, we recommend using a desktop or tablet for initial setup.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>💾</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Data Storage
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    Your data is stored locally on this device. We recommend setting up regular backups (covered in the Backup step) to protect your business data. You can also export backups anytime.
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>❓</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    Need More Help?
                  </div>
                  <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.5 }}>
                    If you're stuck on a specific step, check the context panel on the right for step-specific tips and warnings. For additional support, contact our team from the welcome screen.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                marginTop: 28,
                padding: "16px 32px",
                background: "var(--cafe-accent)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                width: "100%",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 69, 19, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Confirm"
      />
      <ConfirmDialog
        open={goLiveDialog.open}
        onClose={() => setGoLiveDialog({ open: false })}
        onConfirm={confirmGoLive}
        title="Go Live with CafeOS"
        description="You're about to activate production mode for your cafe."
        summary="This will disable demo data generation and mark your setup as complete. You can always return to settings to make changes."
        confirmLabel="Go Live"
      />
      {/* Exit Protection Dialog */}
      {showExitDialog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: "var(--cafe-bg-card)",
            borderRadius: 20,
            padding: 32,
            maxWidth: 420,
            width: "90%",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)"
          }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cafe-text-primary)",
              margin: "0 0 12px"
            }}>
              Unsaved Progress Detected
            </h3>
            <p style={{
              fontSize: 15,
              color: "var(--cafe-text-secondary)",
              margin: "0 0 24px",
              lineHeight: 1.6
            }}>
              You have unsaved changes. What would you like to do?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={handleSaveAndExit}
                style={{
                  padding: "16px 24px",
                  background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(139, 69, 19, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Save & Exit
              </button>
              <button
                onClick={handleExitAnyway}
                style={{
                  padding: "16px 24px",
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-danger)";
                  e.currentTarget.style.color = "var(--cafe-danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.color = "var(--cafe-text-secondary)";
                }}
              >
                Exit Anyway
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                style={{
                  padding: "16px 24px",
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--cafe-text-tertiary)",
                  cursor: "pointer"
                }}
              >
                Continue Setup
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
