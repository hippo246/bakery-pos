// Data management utilities for backup, restore, and migration

export const backupData = () => {
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      orders: localStorage.getItem('order_history'),
      customers: localStorage.getItem('customers'),
      inventory: localStorage.getItem('inventory'),
      tables: localStorage.getItem('bakerypos_tables'),
      settings: localStorage.getItem('cafeos_settings'),
      tokens: localStorage.getItem('tokens'),
      qr_orders: localStorage.getItem('qr_orders'),
      held_orders: localStorage.getItem('held_orders'),
      loyalty_points: localStorage.getItem('loyalty_points'),
      staff: localStorage.getItem('staff'),
      cash_drawer: localStorage.getItem('cash_drawer'),
      audit_log: localStorage.getItem('audit_log')
    }
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bakerypos_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return backup;
};

export const restoreData = (backupData) => {
  try {
    const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
    
    if (!backup.data || !backup.timestamp) {
      throw new Error('Invalid backup format');
    }
    
    // Restore each data key
    Object.keys(backup.data).forEach(key => {
      if (backup.data[key]) {
        localStorage.setItem(key, backup.data[key]);
      }
    });
    
    return { success: true, message: 'Data restored successfully' };
  } catch (error) {
    return { success: false, message: `Failed to restore data: ${error.message}` };
  }
};

export const clearOldData = () => {
  const keysToKeep = [
    'cafeos_settings',
    'customers',
    'bakerypos_tables',
    'inventory',
    'loyalty_points',
    'staff'
  ];
  
  const allKeys = Object.keys(localStorage);
  const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  return { removed: keysToRemove.length, total: allKeys.length };
};

export const getDataSize = () => {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
};

export const migrateData = (currentVersion, targetVersion) => {
  const migrations = {
    '1.0': {
      '1.1': (data) => {
        // Migration from 1.0 to 1.1
        if (data.orders) {
          data.orders = data.orders.map(order => ({
            ...order,
            version: '1.1',
            migratedAt: new Date().toISOString()
          }));
        }
        return data;
      }
    }
  };
  
  const migration = migrations[currentVersion]?.[targetVersion];
  if (migration) {
    return migration();
  }
  
  return null;
};
