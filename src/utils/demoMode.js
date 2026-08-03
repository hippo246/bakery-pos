// Demo Mode Utilities for CafeOS
// Handles safe demo data management

import { APP_MODES, setAppMode, getAppMode } from './appMode.js';

const _DEMO_PREFIX = 'demo_';

/**
 * Check if data is demo data
 */
export function isDemoData(data) {
  if (!data) return false;
  if (data.isDemo === true) return true;
  if (data._demo === true) return true;
  return false;
}

/**
 * Mark data as demo data
 */
export function markAsDemo(data) {
  if (Array.isArray(data)) {
    return data.map(item => ({ ...item, _demo: true }));
  }
  return { ...data, _demo: true };
}

/**
 * Remove demo marker from data
 */
export function removeDemoMarker(data) {
  if (Array.isArray(data)) {
    return data.map(item => {
      const { _demo, ...rest } = item;
      return rest;
    });
  }
  const { _demo, ...rest } = data;
  return rest;
}

/**
 * Filter out demo data from mixed dataset
 */
export function filterDemoData(data) {
  if (Array.isArray(data)) {
    return data.filter(item => !isDemoData(item));
  }
  return data;
}

/**
 * Get demo data statistics
 */
export function getDemoStats(dataTools) {
  if (!dataTools || !dataTools.getStorageSnapshot) {
    return { total: 0, demo: 0, production: 0 };
  }

  const snapshot = dataTools.getStorageSnapshot();
  let total = 0;
  let demo = 0;
  let production = 0;

  Object.values(snapshot.collections || {}).forEach(collection => {
    if (collection.present && Array.isArray(collection.present)) {
      collection.present.forEach(item => {
        total++;
        if (isDemoData(item)) {
          demo++;
        } else {
          production++;
        }
      });
    }
  });

  return { total, demo, production };
}

/**
 * Clear demo data from all collections
 */
export function clearDemoData(dataTools) {
  if (!dataTools || !dataTools.resetLocalDataToEmpty) {
    return { ok: false, error: 'Data tools not available' };
  }

  try {
    const stats = getDemoStats(dataTools);
    
    // Reset to empty state
    const result = dataTools.resetLocalDataToEmpty();
    
    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      cleared: stats.demo,
      message: `Cleared ${stats.demo} demo records`
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Failed to clear demo data' };
  }
}

/**
 * Convert demo to production
 */
export function convertDemoToProduction(dataTools, options = {}) {
  const { keepSettings = true, keepMenu = false } = options;

  if (!dataTools || !dataTools.getStorageSnapshot) {
    return { ok: false, error: 'Data tools not available' };
  }

  try {
    const stats = getDemoStats(dataTools);
    
    if (stats.demo === 0) {
      return { ok: false, error: 'No demo data found' };
    }

    // Clear all demo data
    const clearResult = clearDemoData(dataTools);
    
    if (!clearResult.ok) {
      return clearResult;
    }

    // Set production mode
    setAppMode(APP_MODES.PRODUCTION);

    return {
      ok: true,
      cleared: stats.demo,
      kept: {
        settings: keepSettings,
        menu: keepMenu
      },
      message: `Converted to production mode. Cleared ${stats.demo} demo records.`
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Failed to convert demo to production' };
  }
}

/**
 * Export demo data for backup before conversion
 */
export function exportDemoData(dataTools) {
  if (!dataTools || !dataTools.getStorageSnapshot) {
    return { ok: false, error: 'Data tools not available' };
  }

  try {
    const snapshot = dataTools.getStorageSnapshot();
    const demoData = {};

    Object.entries(snapshot.collections || {}).forEach(([key, collection]) => {
      if (collection.present && Array.isArray(collection.present)) {
        demoData[key] = collection.present.filter(isDemoData);
      }
    });

    return {
      ok: true,
      data: JSON.stringify(demoData, null, 2),
      stats: getDemoStats(dataTools)
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Failed to export demo data' };
  }
}

/**
 * Check if app is in demo mode
 */
export function isCurrentlyDemoMode() {
  return getAppMode() === APP_MODES.DEMO;
}

/**
 * Enable demo mode
 */
export function enableDemoMode() {
  setAppMode(APP_MODES.DEMO);
}

/**
 * Disable demo mode (switch to production)
 */
export function disableDemoMode() {
  setAppMode(APP_MODES.PRODUCTION);
}

export default {
  isDemoData,
  markAsDemo,
  removeDemoMarker,
  filterDemoData,
  getDemoStats,
  clearDemoData,
  convertDemoToProduction,
  exportDemoData,
  isCurrentlyDemoMode,
  enableDemoMode,
  disableDemoMode
};
