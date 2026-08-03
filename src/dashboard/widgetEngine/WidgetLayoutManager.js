/**
 * Widget Layout Manager
 * Manages widget positioning, grid system, and collision detection
 */

import { GridConfig, WidgetSizes } from './WidgetTypes.js';

class WidgetLayoutManager {
  constructor() {
    this.currentScreenSize = 'desktop';
    this.gridConfig = GridConfig.desktop;
    this.occupiedCells = new Map(); // "x,y" -> instanceId
  }

  /**
   * Set screen size and update grid configuration
   * @param {string} screenSize - Screen size (desktop, tablet, mobile, tv)
   */
  setScreenSize(screenSize) {
    if (GridConfig[screenSize]) {
      this.currentScreenSize = screenSize;
      this.gridConfig = GridConfig[screenSize];
      this.recalculateOccupiedCells();
    }
  }

  /**
   * Get current grid configuration
   * @returns {Object}
   */
  getGridConfig() {
    return this.gridConfig;
  }

  /**
   * Get widget dimensions in grid cells
   * @param {string} size - Widget size
   * @returns {Object} { width, height }
   */
  getWidgetDimensions(size) {
    const dimensions = {
      [WidgetSizes.SMALL]: { width: 2, height: 2 },
      [WidgetSizes.MEDIUM]: { width: 4, height: 2 },
      [WidgetSizes.LARGE]: { width: 4, height: 4 },
      [WidgetSizes.EXTRA_LARGE]: { width: 6, height: 4 }
    };

    return dimensions[size] || dimensions[WidgetSizes.MEDIUM];
  }

  /**
   * Check if position is valid
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} size - Widget size
   * @param {string} excludeInstanceId - Instance ID to exclude from collision check
   * @returns {boolean}
   */
  isValidPosition(x, y, size, excludeInstanceId = null) {
    const { columns, rows } = this.gridConfig;
    const { width, height } = this.getWidgetDimensions(size);

    // Check bounds
    if (x < 0 || y < 0 || x + width > columns || y + height > rows) {
      return false;
    }

    // Check collisions
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        const cellKey = `${x + dx},${y + dy}`;
        const occupant = this.occupiedCells.get(cellKey);
        
        if (occupant && occupant !== excludeInstanceId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Find first available position for a widget
   * @param {string} size - Widget size
   * @param {string} excludeInstanceId - Instance ID to exclude
   * @returns {Object|null} { x, y }
   */
  findAvailablePosition(size, excludeInstanceId = null) {
    const { columns, rows } = this.gridConfig;
    const { width, height } = this.getWidgetDimensions(size);

    for (let y = 0; y <= rows - height; y++) {
      for (let x = 0; x <= columns - width; x++) {
        if (this.isValidPosition(x, y, size, excludeInstanceId)) {
          return { x, y };
        }
      }
    }

    return null;
  }

  /**
   * Update occupied cells for all widgets
   * @param {Array} instances - Widget instances
   */
  updateOccupiedCells(instances) {
    this.occupiedCells.clear();

    instances.forEach(instance => {
      if (!instance.visible) return;

      const { x, y } = instance.position;
      const { width, height } = this.getWidgetDimensions(instance.size);

      for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) {
          const cellKey = `${x + dx},${y + dy}`;
          this.occupiedCells.set(cellKey, instance.id);
        }
      }
    });
  }

  /**
   * Recalculate occupied cells from current instances
   */
  recalculateOccupiedCells() {
    // This will be called with instances from WidgetManager
    // Placeholder for now
  }

  /**
   * Move widget to new position with collision detection
   * @param {string} instanceId - Widget instance ID
   * @param {number} newX - New X position
   * @param {number} newY - New Y position
   * @param {string} size - Widget size
   * @returns {Object|null} { x, y } or null if invalid
   */
  moveWidget(instanceId, newX, newY, size) {
    // Try exact position first
    if (this.isValidPosition(newX, newY, size, instanceId)) {
      return { x: newX, y: newY };
    }

    // Try to find nearest valid position
    const { columns, rows } = this.gridConfig;
    const { width, height } = this.getWidgetDimensions(size);

    // Search in expanding radius
    for (let radius = 1; radius < Math.max(columns, rows); radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const testX = newX + dx;
          const testY = newY + dy;

          if (this.isValidPosition(testX, testY, size, instanceId)) {
            return { x: testX, y: testY };
          }
        }
      }
    }

    // No valid position found
    return null;
  }

  /**
   * Check if resize is valid
   * @param {string} instanceId - Widget instance ID
   * @param {number} x - Current X position
   * @param {number} y - Current Y position
   * @param {string} newSize - New size
   * @returns {boolean}
   */
  canResize(instanceId, x, y, newSize) {
    return this.isValidPosition(x, y, newSize, instanceId);
  }

  /**
   * Get widget position in pixels
   * @param {number} x - Grid X position
   * @param {number} y - Grid Y position
   * @returns {Object} { left, top }
   */
  getPositionInPixels(x, y) {
    const { cellWidth, cellHeight } = this.gridConfig;
    return {
      left: x * cellWidth,
      top: y * cellHeight
    };
  }

  /**
   * Get widget size in pixels
   * @param {string} size - Widget size
   * @returns {Object} { width, height }
   */
  getSizeInPixels(size) {
    const { cellWidth, cellHeight } = this.gridConfig;
    const { width, height } = this.getWidgetDimensions(size);
    
    return {
      width: width * cellWidth,
      height: height * cellHeight
    };
  }

  /**
   * Convert pixel position to grid position
   * @param {number} pixelX - Pixel X position
   * @param {number} pixelY - Pixel Y position
   * @returns {Object} { x, y }
   */
  pixelToGrid(pixelX, pixelY) {
    const { cellWidth, cellHeight } = this.gridConfig;
    return {
      x: Math.round(pixelX / cellWidth),
      y: Math.round(pixelY / cellHeight)
    };
  }

  /**
   * Snap position to grid
   * @param {number} pixelX - Pixel X position
   * @param {number} pixelY - Pixel Y position
   * @returns {Object} { x, y }
   */
  snapToGrid(pixelX, pixelY) {
    const gridPos = this.pixelToGrid(pixelX, pixelY);
    const { columns, rows } = this.gridConfig;
    
    return {
      x: Math.max(0, Math.min(gridPos.x, columns - 1)),
      y: Math.max(0, Math.min(gridPos.y, rows - 1))
    };
  }

  /**
   * Auto-arrange widgets to minimize gaps
   * @param {Array} instances - Widget instances
   * @returns {Array} Updated instances with new positions
   */
  autoArrange(instances) {
    const sortedInstances = [...instances].sort((a, b) => a.order - b.order);
    const { columns, rows } = this.gridConfig;
    
    let currentX = 0;
    let currentY = 0;
    const maxY = rows;

    this.occupiedCells.clear();

    const arrangedInstances = sortedInstances.map(instance => {
      if (!instance.visible) return instance;

      const { width, height } = this.getWidgetDimensions(instance.size);

      // Find next available position
      while (currentY + height > maxY) {
        currentX = 0;
        currentY = 0;
      }

      while (!this.isValidPosition(currentX, currentY, instance.size, instance.id)) {
        currentX++;
        if (currentX + width > columns) {
          currentX = 0;
          currentY++;
        }
        if (currentY + height > maxY) {
          currentX = 0;
          currentY = 0;
          break;
        }
      }

      const newPosition = { x: currentX, y: currentY };

      // Mark cells as occupied
      for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) {
          this.occupiedCells.set(`${currentX + dx},${currentY + dy}`, instance.id);
        }
      }

      // Move to next position
      currentX += width;
      if (currentX >= columns) {
        currentX = 0;
        currentY++;
      }

      return {
        ...instance,
        position: newPosition
      };
    });

    return arrangedInstances;
  }

  /**
   * Reset to default layout
   * @param {Array} instances - Widget instances
   * @returns {Array} Auto-arranged instances
   */
  resetLayout(instances) {
    return this.autoArrange(instances);
  }
}

// Singleton instance
const widgetLayoutManager = new WidgetLayoutManager();

export default widgetLayoutManager;
