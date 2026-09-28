// Add a single entry to the Update Tracker
// Run this in the browser console after loading the app

const STORAGE_KEY = 'bakerypos_update_tracker';

const addUpdateEntry = (updateData) => {
  const existing = localStorage.getItem(STORAGE_KEY);
  let tracker;

  if (existing) {
    tracker = JSON.parse(existing);
  } else {
    tracker = {
      currentVersion: 0,
      updates: [],
      lastUpdated: new Date().toISOString(),
      projectStarted: new Date().toISOString()
    };
  }

  const newUpdate = {
    version: tracker.currentVersion + 1,
    type: updateData.type || 'feature',
    category: updateData.category || 'general',
    description: updateData.description,
    agent: updateData.agent || 'Unknown',
    filesModified: updateData.filesModified || [],
    timestamp: new Date().toISOString()
  };

  tracker.updates.unshift(newUpdate);
  tracker.currentVersion += 1;
  tracker.lastUpdated = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));

  console.log(`✅ Added update v${newUpdate.version}: ${newUpdate.description}`);
  return newUpdate;
};

// Example usage:
// addUpdateEntry({
//   type: 'bugfix',
//   category: 'ui',
//   description: 'Fixed Settings component styling issues',
//   agent: 'Devin',
//   filesModified: ['src/components/settings/Settings.jsx']
// });

// Add the Settings fix entry
addUpdateEntry({
  type: 'bugfix',
  category: 'ui',
  description: 'Fixed Settings component styling - reduced padding, border radius, improved colors, fixed duplicate boxSizing property',
  agent: 'Devin',
  filesModified: ['src/components/settings/Settings.jsx']
});
