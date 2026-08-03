/**
 * Drag & Drop Manager
 * Handles widget drag and drop operations with smooth animations
 */

import widgetLayoutManager from './WidgetLayoutManager.js';

class DragDropManager {
  constructor() {
    this.isDragging = false;
    this.draggedWidget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.initialPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };
    this.onDragStart = null;
    this.onDrag = null;
    this.onDragEnd = null;
    this.animationFrame = null;
  }

  /**
   * Start dragging a widget
   * @param {string} instanceId - Widget instance ID
   * @param {Object} startPosition - Initial position { x, y }
   * @param {Object} offset - Mouse offset from widget corner { x, y }
   * @param {Object} callbacks - Event callbacks { onDragStart, onDrag, onDragEnd }
   */
  startDrag(instanceId, startPosition, offset, callbacks = {}) {
    this.isDragging = true;
    this.draggedWidget = instanceId;
    this.initialPosition = { ...startPosition };
    this.currentPosition = { ...startPosition };
    this.dragOffset = { ...offset };
    this.onDragStart = callbacks.onDragStart;
    this.onDrag = callbacks.onDrag;
    this.onDragEnd = callbacks.onDragEnd;

    if (this.onDragStart) {
      this.onDragStart(instanceId, startPosition);
    }
  }

  /**
   * Update drag position
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {Object} containerBounds - Container bounds { left, top }
   * @param {string} size - Widget size
   */
  updateDrag(clientX, clientY, containerBounds, size) {
    if (!this.isDragging) return;

    // Calculate new position in pixels
    const pixelX = clientX - containerBounds.left - this.dragOffset.x;
    const pixelY = clientY - containerBounds.top - this.dragOffset.y;

    // Snap to grid
    const gridPos = widgetLayoutManager.snapToGrid(pixelX, pixelY);

    // Check for valid position
    const isValid = widgetLayoutManager.isValidPosition(
      gridPos.x,
      gridPos.y,
      size,
      this.draggedWidget
    );

    this.currentPosition = gridPos;

    if (this.onDrag) {
      this.onDrag(this.draggedWidget, gridPos, isValid);
    }
  }

  /**
   * End drag operation
   * @param {string} size - Widget size
   * @returns {Object|null} Final position { x, y } or null if invalid
   */
  endDrag(size) {
    if (!this.isDragging) return null;

    const finalPosition = widgetLayoutManager.moveWidget(
      this.draggedWidget,
      this.currentPosition.x,
      this.currentPosition.y,
      size
    );

    const result = finalPosition || this.initialPosition;

    if (this.onDragEnd) {
      this.onDragEnd(this.draggedWidget, result);
    }

    this.isDragging = false;
    this.draggedWidget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.initialPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };

    return result;
  }

  /**
   * Cancel drag operation
   */
  cancelDrag() {
    if (!this.isDragging) return;

    if (this.onDragEnd) {
      this.onDragEnd(this.draggedWidget, this.initialPosition, true);
    }

    this.isDragging = false;
    this.draggedWidget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.initialPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };
  }

  /**
   * Check if currently dragging
   * @returns {boolean}
   */
  isActive() {
    return this.isDragging;
  }

  /**
   * Get currently dragged widget
   * @returns {string|null}
   */
  getDraggedWidget() {
    return this.draggedWidget;
  }

  /**
   * Get current drag position
   * @returns {Object} { x, y }
   */
  getCurrentPosition() {
    return { ...this.currentPosition };
  }
}

// Singleton instance
const dragDropManager = new DragDropManager();

export default dragDropManager;
