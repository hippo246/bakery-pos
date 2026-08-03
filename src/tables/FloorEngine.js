/**
 * Floor Operations Engine
 * Manages floor layouts, sections, and spatial organization
 */

// Floor layer types
const FLOOR_LAYERS = {
  TABLES: 0,
  DECOR: 1,
  WALLS: 2,
  COUNTERS: 3,
  BAR: 4,
  KITCHEN: 5,
  MARKERS: 6
};

// Floor object types
const FLOOR_OBJECT_TYPES = {
  PLANT: 'plant',
  DECORATION: 'decoration',
  COUNTER: 'counter',
  HOST_DESK: 'host_desk',
  WAITING_AREA: 'waiting_area',
  BAR: 'bar',
  KITCHEN_PASS: 'kitchen_pass',
  CASHIER: 'cashier',
  WALL: 'wall',
  DOOR: 'door',
  ENTRANCE: 'entrance',
  RESTROOM: 'restroom',
  EMERGENCY_EXIT: 'emergency_exit'
};

class FloorEngine {
  constructor() {
    this.floors = new Map(); // floorId -> floor data
    this.sections = new Map(); // sectionId -> section data
    this.layouts = new Map(); // layoutId -> layout configuration
    this.floorObjects = new Map(); // objectId -> floor object data
    this.initialized = false;
  }

  /**
   * Initialize the floor engine
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Load saved floor configurations
    this.loadFloorConfigurations();
  }

  /**
   * Create a new floor
   * @param {Object} floorData - Floor configuration
   * @returns {Object} Created floor
   */
  createFloor(floorData) {
    const floor = {
      id: floorData.id || `floor-${Date.now()}`,
      name: floorData.name || 'Main Floor',
      level: floorData.level || 1,
      sections: floorData.sections || [],
      tables: floorData.tables || [],
      dimensions: floorData.dimensions || { width: 1000, height: 800 },
      enabled: true,
      createdAt: new Date().toISOString(),
      ...floorData
    };

    this.floors.set(floor.id, floor);
    this.saveFloorConfigurations();
    
    return floor;
  }

  /**
   * Update floor configuration
   * @param {string} floorId - Floor ID
   * @param {Object} updates - Updates to apply
   */
  updateFloor(floorId, updates) {
    const floor = this.floors.get(floorId);
    if (!floor) return null;

    const updated = { ...floor, ...updates, updatedAt: new Date().toISOString() };
    this.floors.set(floorId, updated);
    this.saveFloorConfigurations();
    
    return updated;
  }

  /**
   * Delete a floor
   * @param {string} floorId - Floor ID
   */
  deleteFloor(floorId) {
    this.floors.delete(floorId);
    this.saveFloorConfigurations();
  }

  /**
   * Create a section within a floor
   * @param {string} floorId - Floor ID
   * @param {Object} sectionData - Section configuration
   * @returns {Object} Created section
   */
  createSection(floorId, sectionData) {
    const section = {
      id: sectionData.id || `section-${Date.now()}`,
      name: sectionData.name || 'Main Area',
      type: sectionData.type || 'indoor', // indoor, outdoor, bar, terrace, vip, private
      floorId,
      position: sectionData.position || { x: 0, y: 0 },
      dimensions: sectionData.dimensions || { width: 400, height: 300 },
      color: sectionData.color || '#e8f5e9',
      enabled: true,
      createdAt: new Date().toISOString(),
      ...sectionData
    };

    this.sections.set(section.id, section);
    
    // Add section to floor
    const floor = this.floors.get(floorId);
    if (floor) {
      floor.sections = [...(floor.sections || []), section.id];
      this.floors.set(floorId, floor);
    }

    this.saveFloorConfigurations();
    return section;
  }

  /**
   * Update section configuration
   * @param {string} sectionId - Section ID
   * @param {Object} updates - Updates to apply
   */
  updateSection(sectionId, updates) {
    const section = this.sections.get(sectionId);
    if (!section) return null;

    const updated = { ...section, ...updates, updatedAt: new Date().toISOString() };
    this.sections.set(sectionId, updated);
    this.saveFloorConfigurations();
    
    return updated;
  }

  /**
   * Delete a section
   * @param {string} sectionId - Section ID
   */
  deleteSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section) return;

    // Remove section from floor
    const floor = this.floors.get(section.floorId);
    if (floor) {
      floor.sections = (floor.sections || []).filter(id => id !== sectionId);
      this.floors.set(section.floorId, floor);
    }

    this.sections.delete(sectionId);
    this.saveFloorConfigurations();
  }

  /**
   * Get floor by ID
   * @param {string} floorId - Floor ID
   * @returns {Object|null} Floor data
   */
  getFloor(floorId) {
    return this.floors.get(floorId) || null;
  }

  /**
   * Get section by ID
   * @param {string} sectionId - Section ID
   * @returns {Object|null} Section data
   */
  getSection(sectionId) {
    return this.sections.get(sectionId) || null;
  }

  /**
   * Get all floors
   * @returns {Array} All floors
   */
  getAllFloors() {
    return Array.from(this.floors.values());
  }

  /**
   * Get all sections for a floor
   * @param {string} floorId - Floor ID
   * @returns {Array} Sections for the floor
   */
  getFloorSections(floorId) {
    const floor = this.floors.get(floorId);
    if (!floor || !floor.sections) return [];

    return floor.sections
      .map(sectionId => this.sections.get(sectionId))
      .filter(section => section && section.enabled);
  }

  /**
   * Get sections by type
   * @param {string} type - Section type
   * @returns {Array} Sections of the specified type
   */
  getSectionsByType(type) {
    return Array.from(this.sections.values())
      .filter(section => section.type === type && section.enabled);
  }

  /**
   * Save floor configurations to storage
   */
  saveFloorConfigurations() {
    try {
      const config = {
        floors: Array.from(this.floors.entries()),
        sections: Array.from(this.sections.entries()),
        floorObjects: Array.from(this.floorObjects.entries())
      };
      localStorage.setItem('cafeos_floor_config', JSON.stringify(config));
    } catch (error) {
      console.error('[FloorEngine] Failed to save configurations:', error);
    }
  }

  /**
   * Load floor configurations from storage
   */
  loadFloorConfigurations() {
    try {
      const saved = localStorage.getItem('cafeos_floor_config');
      if (saved) {
        const config = JSON.parse(saved);
        
        if (config.floors) {
          this.floors = new Map(config.floors);
        }
        
        if (config.sections) {
          this.sections = new Map(config.sections);
        }

        if (config.floorObjects) {
          this.floorObjects = new Map(config.floorObjects);
        }
      } else {
        // Initialize with default floor
        this.createDefaultFloor();
      }
    } catch (error) {
      console.error('[FloorEngine] Failed to load configurations:', error);
      this.createDefaultFloor();
    }
  }

  /**
   * Create a floor object
   * @param {Object} objectData - Floor object configuration
   * @returns {Object} Created floor object
   */
  createFloorObject(objectData) {
    const floorObject = {
      id: objectData.id || `obj-${Date.now()}`,
      type: objectData.type || FLOOR_OBJECT_TYPES.PLANT,
      floorId: objectData.floorId || 'floor-main',
      sectionId: objectData.sectionId || null,
      position: objectData.position || { x: 0, y: 0 },
      dimensions: objectData.dimensions || { width: 40, height: 40 },
      rotation: objectData.rotation || 0,
      layer: objectData.layer || FLOOR_LAYERS.DECOR,
      visible: objectData.visible !== false,
      label: objectData.label || '',
      color: objectData.color || '#9e9e9e',
      createdAt: new Date().toISOString(),
      ...objectData
    };

    this.floorObjects.set(floorObject.id, floorObject);
    this.saveFloorConfigurations();
    
    return floorObject;
  }

  /**
   * Update floor object
   * @param {string} objectId - Object ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated floor object
   */
  updateFloorObject(objectId, updates) {
    const floorObject = this.floorObjects.get(objectId);
    if (!floorObject) return null;

    const updated = { ...floorObject, ...updates, updatedAt: new Date().toISOString() };
    this.floorObjects.set(objectId, updated);
    this.saveFloorConfigurations();
    
    return updated;
  }

  /**
   * Delete floor object
   * @param {string} objectId - Object ID
   */
  deleteFloorObject(objectId) {
    this.floorObjects.delete(objectId);
    this.saveFloorConfigurations();
  }

  /**
   * Get floor object by ID
   * @param {string} objectId - Object ID
   * @returns {Object|null} Floor object data
   */
  getFloorObject(objectId) {
    return this.floorObjects.get(objectId) || null;
  }

  /**
   * Get all floor objects for a floor
   * @param {string} floorId - Floor ID
   * @returns {Array} Floor objects for the floor
   */
  getFloorObjects(floorId) {
    return Array.from(this.floorObjects.values())
      .filter(obj => obj.floorId === floorId && obj.visible);
  }

  /**
   * Get floor objects by layer
   * @param {string} floorId - Floor ID
   * @param {number} layer - Layer number
   * @returns {Array} Floor objects on the specified layer
   */
  getFloorObjectsByLayer(floorId, layer) {
    return Array.from(this.floorObjects.values())
      .filter(obj => obj.floorId === floorId && obj.layer === layer && obj.visible);
  }

  /**
   * Get floor objects by type
   * @param {string} floorId - Floor ID
   * @param {string} type - Object type
   * @returns {Array} Floor objects of the specified type
   */
  getFloorObjectsByType(floorId, type) {
    return Array.from(this.floorObjects.values())
      .filter(obj => obj.floorId === floorId && obj.type === type && obj.visible);
  }

  /**
   * Create default floor configuration
   */
  createDefaultFloor() {
    this.createFloor({
      id: 'floor-main',
      name: 'Main Floor',
      level: 1,
      dimensions: { width: 1200, height: 900 }
    });

    this.createSection('floor-main', {
      id: 'section-main',
      name: 'Main Dining',
      type: 'indoor',
      position: { x: 0, y: 0 },
      dimensions: { width: 600, height: 450 },
      color: '#e8f5e9'
    });

    this.createSection('floor-main', {
      id: 'section-terrace',
      name: 'Terrace',
      type: 'outdoor',
      position: { x: 600, y: 0 },
      dimensions: { width: 400, height: 300 },
      color: '#fff3e0'
    });

    this.createSection('floor-main', {
      id: 'section-bar',
      name: 'Bar Area',
      type: 'bar',
      position: { x: 0, y: 450 },
      dimensions: { width: 300, height: 250 },
      color: '#e3f2fd'
    });

    this.createSection('floor-main', {
      id: 'section-vip',
      name: 'VIP Room',
      type: 'vip',
      position: { x: 300, y: 450 },
      dimensions: { width: 300, height: 250 },
      color: '#f3e5f5'
    });
  }

  /**
   * Calculate floor occupancy
   * @param {string} floorId - Floor ID
   * @param {Array} tables - All tables
   * @returns {Object} Occupancy statistics
   */
  calculateFloorOccupancy(floorId, tables) {
    const floor = this.floors.get(floorId);
    if (!floor) return null;

    const floorTables = tables.filter(t => t.floorId === floorId);
    const total = floorTables.length;
    const occupied = floorTables.filter(t => t.status === 'occupied').length;
    const reserved = floorTables.filter(t => t.status === 'reserved').length;
    const available = floorTables.filter(t => t.status === 'available').length;
    const cleaning = floorTables.filter(t => t.status === 'cleaning').length;

    return {
      total,
      occupied,
      reserved,
      available,
      cleaning,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
    };
  }

  /**
   * Get floor analytics
   * @param {string} floorId - Floor ID
   * @param {Array} tables - All tables
   * @param {Array} orders - All orders
   * @returns {Object} Floor analytics
   */
  getFloorAnalytics(floorId, tables, orders) {
    const floor = this.floors.get(floorId);
    if (!floor) return null;

    const floorTables = tables.filter(t => t.floorId === floorId);
    const floorTableIds = new Set(floorTables.map(t => t.id));
    const floorOrders = orders.filter(o => o.tableId && floorTableIds.has(o.tableId));

    // Calculate average dining time
    const completedOrders = floorOrders.filter(o => o.status === 'COMPLETED' && o.completedAt);
    const avgDiningTime = completedOrders.length > 0
      ? Math.round(completedOrders.reduce((sum, o) => {
          const duration = (new Date(o.completedAt) - new Date(o.createdAt)) / 60000;
          return sum + duration;
        }, 0) / completedOrders.length)
      : 0;

    // Calculate turnover (orders per table)
    const turnover = floorTables.length > 0
      ? Math.round(completedOrders.length / floorTables.length * 10) / 10
      : 0;

    // Calculate revenue by section
    const sectionRevenue = {};
    floorTables.forEach(table => {
      const section = this.sections.get(table.sectionId);
      if (section) {
        const tableOrders = floorOrders.filter(o => o.tableId === table.id);
        const revenue = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        sectionRevenue[section.name] = (sectionRevenue[section.name] || 0) + revenue;
      }
    });

    return {
      totalTables: floorTables.length,
      totalOrders: floorOrders.length,
      completedOrders: completedOrders.length,
      avgDiningTime,
      turnover,
      totalRevenue: floorOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      sectionRevenue,
      occupancy: this.calculateFloorOccupancy(floorId, tables)
    };
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.floors.clear();
    this.sections.clear();
    this.layouts.clear();
    this.floorObjects.clear();
    localStorage.removeItem('cafeos_floor_config');
  }
}

// Export constants
export { FLOOR_LAYERS, FLOOR_OBJECT_TYPES };

// Singleton instance
const floorEngine = new FloorEngine();

export default floorEngine;
