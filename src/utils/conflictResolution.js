// Conflict resolution utilities for concurrent data edits

// Version-based conflict resolution
export const resolveConflict = (localData, remoteData, strategy = 'last-write-wins') => {
  switch (strategy) {
    case 'last-write-wins':
      return resolveLastWriteWins(localData, remoteData);
    case 'first-write-wins':
      return resolveFirstWriteWins(localData, remoteData);
    case 'merge':
      return resolveMerge(localData, remoteData);
    case 'timestamp':
      return resolveByTimestamp(localData, remoteData);
    default:
      return resolveLastWriteWins(localData, remoteData);
  }
};

// Last write wins strategy
const resolveLastWriteWins = (localData, remoteData) => {
  const localVersion = localData.version || 0;
  const remoteVersion = remoteData.version || 0;
  
  return remoteVersion > localVersion ? remoteData : localData;
};

// First write wins strategy
const resolveFirstWriteWins = (localData, remoteData) => {
  const localVersion = localData.version || 0;
  const remoteVersion = remoteData.version || 0;
  
  return localVersion > remoteVersion ? localData : remoteData;
};

// Merge strategy - try to merge changes
const resolveMerge = (localData, remoteData) => {
  const merged = { ...localData };
  
  Object.keys(remoteData).forEach(key => {
    if (!localData.hasOwnProperty(key)) {
      merged[key] = remoteData[key];
    } else if (typeof remoteData[key] === 'object' && typeof localData[key] === 'object') {
      merged[key] = resolveMerge(localData[key], remoteData[key]);
    }
  });
  
  merged.version = Math.max(localData.version || 0, remoteData.version || 0) + 1;
  return merged;
};

// Resolve by timestamp
const resolveByTimestamp = (localData, remoteData) => {
  const localTime = new Date(localData.updatedAt || 0).getTime();
  const remoteTime = new Date(remoteData.updatedAt || 0).getTime();
  
  return remoteTime > localTime ? remoteData : localData;
};

// Optimistic locking
export const withOptimisticLock = async (data, updateFn) => {
  const originalVersion = data.version || 0;
  
  try {
    const result = await updateFn(data);
    
    // Check if version changed during update
    if (result.version !== originalVersion) {
      throw new Error('Conflict detected: Data was modified by another user');
    }
    
    return result;
  } catch (error) {
    if (error.message.includes('Conflict')) {
      // Handle conflict
      console.error('Optimistic lock conflict:', error);
      throw error;
    }
    throw error;
  }
};

// Add version to data
export const addVersion = (data) => {
  return {
    ...data,
    version: (data.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };
};

// Check for conflicts between datasets
export const detectConflicts = (localData, remoteData) => {
  const conflicts = [];
  
  Object.keys(remoteData).forEach(key => {
    if (localData.hasOwnProperty(key)) {
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push({
          field: key,
          localValue,
          remoteValue
        });
      }
    }
  });
  
  return conflicts;
};

// Apply conflict resolution to specific fields
export const resolveFieldConflicts = (data, conflicts, resolutions) => {
  const resolved = { ...data };
  
  conflicts.forEach((conflict, index) => {
    const resolution = resolutions[index];
    if (resolution === 'local') {
      resolved[conflict.field] = conflict.localValue;
    } else if (resolution === 'remote') {
      resolved[conflict.field] = conflict.remoteValue;
    }
  });
  
  return resolved;
};
