// App Mode System for CafeOS
// Handles Demo, Production, Setup, and Maintenance modes

const STORAGE_KEY = 'cafeos_app_mode';
const SETUP_STATE_KEY = 'cafeos_setup_state';

export const APP_MODES = {
  SETUP: 'setup',
  DEMO: 'demo',
  PRODUCTION: 'production',
  MAINTENANCE: 'maintenance'
};

export const SETUP_STEPS = [
  { id: 'welcome', name: 'Welcome', required: true, icon: '🚀' },
  { id: 'business', name: 'Business Details', required: true, icon: '🏢' },
  { id: 'branch', name: 'Branch Details', required: true, icon: '📍' },
  { id: 'theme', name: 'Theme Selection', required: true, icon: '🎨' },
  { id: 'storage', name: 'Storage Backend', required: true, icon: '💾' },
  { id: 'owner', name: 'Owner/Admin Access', required: true, icon: '👤' },
  { id: 'staff', name: 'Staff & Roles', required: false, icon: '👥' },
  { id: 'tables', name: 'Service Areas & Tables', required: false, icon: '🪑' },
  { id: 'kitchen', name: 'Kitchen Stations', required: false, icon: '👨‍🍳' },
  { id: 'menu', name: 'Menu Basics', required: false, icon: '📋' },
  { id: 'payments', name: 'Payment Methods', required: true, icon: '💳' },
  { id: 'payment-gateway', name: 'Payment Gateway', required: false, icon: '🔗' },
  { id: 'delivery', name: 'Delivery Integration', required: false, icon: '🛵' },
  { id: 'channels', name: 'Order Sources', required: false, icon: '📱' },
  { id: 'receipts', name: 'Receipts & Printers', required: true, icon: '🖨️' },
  { id: 'qr', name: 'QR Ordering', required: false, icon: '📷' },
  { id: 'stock', name: 'Stock Basics', required: false, icon: '📦' },
  { id: 'workflows', name: 'Workflows & Automation', required: false, icon: '⚙️' },
  { id: 'import', name: 'Data Import', required: false, icon: '📥' },
  { id: 'security', name: 'Security Review', required: true, icon: '🔒' },
  { id: 'self-healing', name: 'Self-Healing Config', required: false, icon: '🛡️' },
  { id: 'backup', name: 'Backup', required: true, icon: '💿' },
  { id: 'checklist', name: 'Launch Checklist', required: true, icon: '✅' }
];

/**
 * Get current app mode
 */
export function getAppMode() {
  try {
    const mode = localStorage.getItem(STORAGE_KEY);
    return mode || APP_MODES.SETUP;
  } catch {
    return APP_MODES.SETUP;
  }
}

/**
 * Set app mode
 */
export function setAppMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (err) {
    console.error('[AppMode] Failed to set app mode:', err);
  }
}

/**
 * Check if in demo mode
 */
export function isDemoMode() {
  return getAppMode() === APP_MODES.DEMO;
}

/**
 * Check if in production mode
 */
export function isProductionMode() {
  return getAppMode() === APP_MODES.PRODUCTION;
}

/**
 * Check if setup is incomplete
 */
export function isSetupIncomplete() {
  return getAppMode() === APP_MODES.SETUP;
}

/**
 * Get setup state
 */
export function getSetupState() {
  try {
    const state = localStorage.getItem(SETUP_STATE_KEY);
    if (!state) {
      return {
        currentStep: 'welcome',
        completedSteps: [],
        skippedSteps: [],
        startedAt: null,
        completedAt: null
      };
    }
    return JSON.parse(state);
  } catch {
    return {
      currentStep: 'welcome',
      completedSteps: [],
      skippedSteps: [],
      startedAt: null,
      completedAt: null
    };
  }
}

/**
 * Save setup state
 */
export function saveSetupState(state) {
  try {
    localStorage.setItem(SETUP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[AppMode] Failed to save setup state:', err);
  }
}

/**
 * Mark setup step as complete
 */
export function completeSetupStep(stepId) {
  const state = getSetupState();
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId);
  }
  state.currentStep = getNextStep(stepId);
  saveSetupState(state);
}

/**
 * Skip setup step
 */
export function skipSetupStep(stepId) {
  const state = getSetupState();
  if (!state.skippedSteps.includes(stepId)) {
    state.skippedSteps.push(stepId);
  }
  state.currentStep = getNextStep(stepId);
  saveSetupState(state);
}

/**
 * Get next step
 */
function getNextStep(currentStepId) {
  const currentIndex = SETUP_STEPS.findIndex(s => s.id === currentStepId);
  if (currentIndex < SETUP_STEPS.length - 1) {
    return SETUP_STEPS[currentIndex + 1].id;
  }
  return 'checklist';
}

/**
 * Mark setup as started
 */
export function startSetup() {
  const state = getSetupState();
  state.startedAt = new Date().toISOString();
  state.currentStep = 'welcome';
  saveSetupState(state);
}

/**
 * Mark setup as complete
 */
export function completeSetup() {
  const state = getSetupState();
  state.completedAt = new Date().toISOString();
  state.currentStep = 'complete';
  saveSetupState(state);
  setAppMode(APP_MODES.PRODUCTION);
}

/**
 * Reset setup state
 */
export function resetSetup() {
  try {
    localStorage.removeItem(SETUP_STATE_KEY);
    setAppMode(APP_MODES.SETUP);
  } catch (err) {
    console.error('[AppMode] Failed to reset setup:', err);
  }
}

/**
 * Get setup progress percentage
 */
export function getSetupProgress() {
  const state = getSetupState();
  const requiredSteps = SETUP_STEPS.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => state.completedSteps.includes(s.id)).length;
  return Math.round((completedRequired / requiredSteps.length) * 100);
}

/**
 * Check if setup step is complete
 */
export function isStepComplete(stepId) {
  const state = getSetupState();
  return state.completedSteps.includes(stepId);
}

/**
 * Check if setup step is skipped
 */
export function isStepSkipped(stepId) {
  const state = getSetupState();
  return state.skippedSteps.includes(stepId);
}

/**
 * Check if required steps are complete
 */
export function areRequiredStepsComplete() {
  const state = getSetupState();
  const requiredSteps = SETUP_STEPS.filter(s => s.required);
  return requiredSteps.every(s => state.completedSteps.includes(s.id));
}

/**
 * Get launch blockers
 */
export function getLaunchBlockers() {
  const state = getSetupState();
  const blockers = [];
  
  SETUP_STEPS.filter(s => s.required).forEach(step => {
    if (!state.completedSteps.includes(step.id)) {
      blockers.push({
        step: step.id,
        name: step.name,
        reason: 'Required step not completed'
      });
    }
  });
  
  return blockers;
}

/**
 * Exit demo mode and switch to production
 */
export function exitDemoMode() {
  try {
    setAppMode(APP_MODES.SETUP);
    // Clear visited flag so welcome screen shows again
    localStorage.removeItem('cafeos_visited');
    // Clear demo data if needed
    localStorage.removeItem('cafeos_demo_data');
  } catch (err) {
    console.error('[AppMode] Failed to exit demo mode:', err);
  }
}

export default {
  APP_MODES,
  SETUP_STEPS,
  getAppMode,
  setAppMode,
  isDemoMode,
  isProductionMode,
  isSetupIncomplete,
  getSetupState,
  saveSetupState,
  completeSetupStep,
  skipSetupStep,
  startSetup,
  completeSetup,
  resetSetup,
  getSetupProgress,
  isStepComplete,
  isStepSkipped,
  areRequiredStepsComplete,
  getLaunchBlockers,
  exitDemoMode
};
