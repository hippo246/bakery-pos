// Menu Synchronization
// Sync POS menu to Zomato and Swiggy platforms

import { getDeliveryPlatformFactory, PlatformType } from './DeliveryPlatformFactory.js';

export class MenuSync {
  constructor() {
    this.factory = getDeliveryPlatformFactory();
    this.syncHistory = [];
    this.loadSyncHistory();
  }

  /**
   * Load sync history from localStorage
   */
  loadSyncHistory() {
    try {
      const stored = localStorage.getItem('cafeos_menu_sync_history');
      if (stored) {
        this.syncHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[MenuSync] Failed to load sync history:', error);
    }
  }

  /**
   * Save sync history to localStorage
   */
  saveSyncHistory() {
    try {
      // Keep only last 100 syncs
      if (this.syncHistory.length > 100) {
        this.syncHistory.shift();
      }
      localStorage.setItem('cafeos_menu_sync_history', JSON.stringify(this.syncHistory));
    } catch (error) {
      console.error('[MenuSync] Failed to save sync history:', error);
    }
  }

  /**
   * Log sync event
   */
  logSync(platform, type, result, metadata = {}) {
    const logEntry = {
      platform,
      type,
      result,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.syncHistory.push(logEntry);
    this.saveSyncHistory();
  }

  /**
   * Transform POS menu to platform format
   */
  transformPOSMenuToPlatform(posMenu, platformType) {
    const platformMenu = {
      categories: posMenu.categories.map(category => ({
        category_id: category.id,
        category_name: category.name,
        sequence: category.sequence || 0,
        items: category.items.map(item => ({
          item_id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          is_veg: item.isVeg || false,
          is_available: item.available !== false,
          sequence: item.sequence || 0,
          variants: item.variants || [],
          addons: item.addons || [],
          images: item.images || [],
          preparation_time: item.preparationTime || 0,
          dietary_tags: item.dietaryTags || []
        }))
      }))
    };

    // Platform-specific adjustments
    if (platformType === PlatformType.SWIGGY) {
      // Swiggy requires store_id
      const config = this.factory.platformConfig.getConfig(platformType);
      if (config) {
        platformMenu.store_id = config.storeId;
        platformMenu.restaurant_id = config.restaurantId;
      }
    } else if (platformType === PlatformType.ZOMATO) {
      // Zomato requires restaurant_id
      const config = this.factory.platformConfig.getConfig(platformType);
      if (config) {
        platformMenu.restaurant_id = config.restaurantId;
      }
    }

    return platformMenu;
  }

  /**
   * Sync menu to specific platform
   */
  async syncMenuToPlatform(posMenu, platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      
      // Transform menu to platform format
      const platformMenu = this.transformPOSMenuToPlatform(posMenu, platformType);
      
      // Sync to platform
      const result = await platform.syncMenu(platformMenu);
      
      this.logSync(platformType, 'sync', result, {
        itemCount: posMenu.categories.reduce((sum, cat) => sum + cat.items.length, 0)
      });
      
      return result;
    } catch (error) {
      console.error(`[MenuSync] Failed to sync menu to ${platformType}:`, error);
      
      this.logSync(platformType, 'sync_failed', { success: false, error: error.message });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync menu to all active platforms
   */
  async syncMenuToAllPlatforms(posMenu) {
    const activePlatforms = this.factory.getActivePlatforms();
    const results = {};
    
    for (const platformType of activePlatforms) {
      results[platformType] = await this.syncMenuToPlatform(posMenu, platformType);
    }
    
    return results;
  }

  /**
   * Update item availability on platform
   */
  async updateItemAvailability(itemId, isAvailable, platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      
      const result = await platform.updateItemAvailability(itemId, isAvailable);
      
      this.logSync(platformType, 'availability_update', result, {
        itemId,
        isAvailable
      });
      
      return result;
    } catch (error) {
      console.error(`[MenuSync] Failed to update availability on ${platformType}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update item availability on all platforms
   */
  async updateItemAvailabilityOnAll(itemId, isAvailable) {
    const activePlatforms = this.factory.getActivePlatforms();
    const results = {};
    
    for (const platformType of activePlatforms) {
      results[platformType] = await this.updateItemAvailability(itemId, isAvailable, platformType);
    }
    
    return results;
  }

  /**
   * Map POS categories to platform categories
   */
  mapCategories(posCategories, platformType) {
    // Platform-specific category mappings
    const categoryMappings = {
      [PlatformType.ZOMATO]: {
        'Coffee': 'Beverages',
        'Food': 'Main Course',
        'Special': 'Specials',
        'Popular': 'Popular'
      },
      [PlatformType.SWIGGY]: {
        'Coffee': 'Beverages',
        'Food': 'Main Course',
        'Special': 'Specials',
        'Popular': 'Popular'
      }
    };

    const mapping = categoryMappings[platformType] || {};
    
    return posCategories.map(category => ({
      ...category,
      platformCategory: mapping[category.name] || category.name
    }));
  }

  /**
   * Validate menu for platform sync
   */
  validateMenuForPlatform(posMenu, platformType) {
    const errors = [];
    const warnings = [];

    // Check if platform is configured
    if (!this.factory.platformConfig.isConfigured(platformType)) {
      errors.push(`${platformType} is not configured`);
    }

    // Check menu structure
    if (!posMenu.categories || posMenu.categories.length === 0) {
      errors.push('Menu has no categories');
    }

    // Check items
    posMenu.categories.forEach(category => {
      if (!category.items || category.items.length === 0) {
        warnings.push(`Category "${category.name}" has no items`);
      }

      category.items.forEach(item => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item in category "${category.name}" has no name`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Item "${item.name}" has invalid price`);
        }
        if (!item.id || item.id.trim() === '') {
          errors.push(`Item "${item.name}" has no ID`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics() {
    const stats = {
      total: this.syncHistory.length,
      byPlatform: {},
      byType: {},
      byStatus: { success: 0, failure: 0 },
      recentSyncs: []
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.syncHistory.forEach(log => {
      // By platform
      if (!stats.byPlatform[log.platform]) {
        stats.byPlatform[log.platform] = 0;
      }
      stats.byPlatform[log.platform]++;

      // By type
      if (!stats.byType[log.type]) {
        stats.byType[log.type] = 0;
      }
      stats.byType[log.type]++;

      // By status
      if (log.result?.success) {
        stats.byStatus.success++;
      } else {
        stats.byStatus.failure++;
      }

      // Recent syncs (last 24 hours)
      if (new Date(log.timestamp) > oneDayAgo) {
        stats.recentSyncs.push(log);
      }
    });

    return stats;
  }

  /**
   * Get recent sync history
   */
  getRecentSyncs(limit = 20) {
    return this.syncHistory.slice(-limit);
  }

  /**
   * Clear sync history
   */
  clearSyncHistory() {
    this.syncHistory = [];
    this.saveSyncHistory();
  }

  /**
   * Get sync recommendations
   */
  getSyncRecommendations(posMenu) {
    const recommendations = [];

    // Check if menu has been synced recently
    const recentSyncs = this.syncHistory.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentSyncs.length === 0) {
      recommendations.push({
        type: 'sync_needed',
        message: 'Menu has not been synced in the last 7 days',
        priority: 'high'
      });
    }

    // Check for items without images
    posMenu.categories.forEach(category => {
      category.items.forEach(item => {
        if (!item.images || item.images.length === 0) {
          recommendations.push({
            type: 'missing_images',
            message: `Item "${item.name}" has no images`,
            priority: 'medium'
          });
        }
      });
    });

    // Check for items without descriptions
    posMenu.categories.forEach(category => {
      category.items.forEach(item => {
        if (!item.description || item.description.trim() === '') {
          recommendations.push({
            type: 'missing_description',
            message: `Item "${item.name}" has no description`,
            priority: 'low'
          });
        }
      });
    });

    return recommendations;
  }

  /**
   * Create sync schedule
   */
  createSyncSchedule(platformType, intervalMinutes = 60) {
    const schedule = {
      platformType,
      intervalMinutes,
      lastSync: null,
      nextSync: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
    };

    localStorage.setItem('cafeos_menu_sync_schedule', JSON.stringify(schedule));
    return schedule;
  }

  /**
   * Get sync schedule
   */
  getSyncSchedule() {
    try {
      const stored = localStorage.getItem('cafeos_menu_sync_schedule');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[MenuSync] Failed to get sync schedule:', error);
      return null;
    }
  }

  /**
   * Clear sync schedule
   */
  clearSyncSchedule() {
    localStorage.removeItem('cafeos_menu_sync_schedule');
  }

  /**
   * Destroy the menu sync
   */
  destroy() {
    console.log('[MenuSync] Destroyed');
  }
}

// Singleton instance
let menuSyncInstance = null;

/**
 * Get the singleton menu sync instance
 */
export function getMenuSync() {
  if (!menuSyncInstance) {
    menuSyncInstance = new MenuSync();
  }
  return menuSyncInstance;
}

export default MenuSync;
