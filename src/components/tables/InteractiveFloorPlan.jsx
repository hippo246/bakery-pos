/**
 * Interactive Floor Plan
 * Visual floor plan with drag/drop/resize/rotate functionality
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import floorEngine, { FLOOR_LAYERS } from '../../tables/FloorEngine.js';
import tableEngine, { 
  TABLE_STATES, 
  STATE_COLORS, 
  STATE_ICONS, 
  TABLE_PRIORITIES, 
  PRIORITY_COLORS,
  TABLE_ALERTS,
  ALERT_ICONS,
  SECTION_TYPES,
  TABLE_SHAPES 
} from '../../tables/TableEngine.js';
import FloorEditorModal from './FloorEditorModal';

function InteractiveFloorPlan({ 
  tables = [], 
  orders = [], 
  currentWaiterId = null,
  viewMode = 'manager', // 'waiter', 'manager', 'owner'
  onTableClick = null,
  onTableDoubleClick = null,
  onReservationDrop = null,
  onWaiterDrop = null,
  onMergeTables = null,
  onTableUpdate = null,   // (updatedTable) => void — called after drag/resize end
  onTableAdd = null,      // (newTable) => void — called when a table is added in edit mode
}) {
  const canvasRef = useRef(null);
  // NOTE: was previously initialized to the literal 'floor-main', which does not
  // match the default floor's real id ('main-floor') created below. That mismatch
  // meant `floorEngine.getFloor(selectedFloor)` always returned undefined on first
  // load. Starting from null lets the init effect assign the real id once floors exist.
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTables, setSelectedTables] = useState(new Set()); // Multi-select
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Pending drag: only becomes a real drag after 5px movement threshold
  const pendingDrag = useRef(null); // { table, startX, startY, offsetX, offsetY }
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Drag and drop state for reservations and waiters
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'reservation' | 'waiter', data: any }
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState(new Set());
  
  // Grid system
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  
  // Alignment guides state
  const [alignmentGuides, setAlignmentGuides] = useState({ vertical: [], horizontal: [] });

  // Live operational display
  const [heatMapMode, setHeatMapMode] = useState(null); // null, 'occupancy', 'revenue', 'wait_time', 'kitchen_delay', 'turnover'
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showTableList, setShowTableList] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Right-click context menu
  const [contextMenu, setContextMenu] = useState(null); // { x, y, table }
  // Layout editor
  const [showFloorEditor, setShowFloorEditor] = useState(false);
  const [layoutUpdateTrigger, setLayoutUpdateTrigger] = useState(0);
  
  // Live data cache for performance
  const [liveData, setLiveData] = useState({
    tableTimers: new Map(),
    orderProgress: new Map(),
    kitchenStatus: new Map(),
    waiterStatus: new Map()
  });

  // Initialize engines
  useEffect(() => {
    floorEngine.initialize();
    tableEngine.initialize();

    // Create default floor if none exists
    if (floorEngine.getAllFloors().length === 0) {
      floorEngine.createFloor({
        id: 'main-floor',
        name: 'Main Floor',
        level: 1,
        dimensions: { width: 1200, height: 900 }
      });

      // Create default section
      floorEngine.createSection('main-floor', {
        id: 'main-section',
        name: 'Main Dining',
        type: 'indoor',
        position: { x: 0, y: 0 },
        dimensions: { width: 1200, height: 900 },
        color: '#e8f5e9'
      });
    }

    // Set initial floor
    const floors = floorEngine.getAllFloors();
    if (floors.length > 0 && !selectedFloor) {
      setSelectedFloor(floors[0].id);
    }
  }, [selectedFloor]);

  // Sync external tables with table engine
  useEffect(() => {
    tables.forEach(table => {
      tableEngine.upsertTable(table);
    });
  }, [tables]);

  // Get current floor
  const floor = useMemo(() => floorEngine.getFloor(selectedFloor), [selectedFloor, layoutUpdateTrigger]);
  const sections = useMemo(() => floor ? floorEngine.getFloorSections(selectedFloor) : [], [floor, selectedFloor, layoutUpdateTrigger]);
  const floorTables = floor ? tableEngine.getTablesByFloor(selectedFloor) : [];

  // If no floor tables, show all tables (for backward compatibility)
  const displayTables = floorTables.length > 0 ? floorTables : tables;

  // Filter tables based on view mode
  const visibleTables = useCallback(() => {
    const tablesToFilter = displayTables;
    if (viewMode === 'waiter' && currentWaiterId) {
      return tablesToFilter.filter(t => t.assignedWaiter === currentWaiterId && !t.disabled);
    }
    return tablesToFilter.filter(t => !t.disabled);
  }, [displayTables, viewMode, currentWaiterId]);

  // Update live data periodically (optimized for performance)
  useEffect(() => {
    const updateLiveData = () => {
      const newTableTimers = new Map();
      const newOrderProgress = new Map();
      const newKitchenStatus = new Map();
      const newWaiterStatus = new Map();

      const tablesToUpdate = visibleTables();
      
      // Batch updates for performance
      tablesToUpdate.forEach(table => {
        // Update table timers
        const timerStatus = tableEngine.getTableTimerStatus(table.id);
        if (timerStatus) {
          newTableTimers.set(table.id, timerStatus);
        }

        // Update order progress
        const tableOrderId = table.currentOrderId || table.currentOrder;
        if (tableOrderId) {
          const order = orders.find(o => o.id === tableOrderId);
          if (order) {
            newOrderProgress.set(table.id, {
              status: order.status,
              progress: calculateOrderProgress(order.status),
              items: order.items?.length || 0,
              total: order.total || 0
            });
          }
        }

        // Update kitchen status
        if (table.status === TABLE_STATES.KITCHEN || table.status === TABLE_STATES.READY_FOR_PICKUP) {
          newKitchenStatus.set(table.id, {
            status: table.status,
            estimatedTime: table.timers?.kitchen_start ? 
              Math.floor((Date.now() - table.timers.kitchen_start) / 60000) : 0,
            delayed: table.alerts?.includes(TABLE_ALERTS.LATE_RESERVATION)
          });
        }

        // Update waiter status (cached per waiter, not per table)
        if (table.assignedWaiter && !newWaiterStatus.has(table.assignedWaiter)) {
          const waiterTables = tableEngine.getTablesByWaiter(table.assignedWaiter);
          const waiterOrders = waiterTables.filter(t => t.currentOrder).length;
          const readyTables = waiterTables.filter(t => t.status === TABLE_STATES.READY_FOR_PICKUP).length;
          
          newWaiterStatus.set(table.assignedWaiter, {
            tablesAssigned: waiterTables.length,
            ordersPending: waiterOrders,
            readyForPickup: readyTables,
            overloaded: waiterTables.length > 5
          });
        }
      });

      setLiveData({
        tableTimers: newTableTimers,
        orderProgress: newOrderProgress,
        kitchenStatus: newKitchenStatus,
        waiterStatus: newWaiterStatus
      });
    };

    updateLiveData();
    const interval = setInterval(updateLiveData, 3000); // Reduced to 3 seconds for faster updates

    return () => clearInterval(interval);
  }, [tables, orders, visibleTables]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = visibleTables().filter(table => {
      const tableNumber = String(table.number).toLowerCase().includes(query);
      const reservedFor = table.reservedFor?.toLowerCase().includes(query);
      const assignedWaiter = table.assignedWaiter?.toLowerCase().includes(query);
      const hasAlert = table.alerts?.some(a => a.toLowerCase().includes(query));
      const orderId = table.currentOrder?.toLowerCase().includes(query);
      
      return tableNumber || reservedFor || assignedWaiter || hasAlert || orderId;
    });

    setSearchResults(results);
  }, [searchQuery, visibleTables]);

  // Calculate order progress percentage
  const calculateOrderProgress = (status) => {
    const progressMap = {
      'pending': 10,
      'confirmed': 20,
      'preparing': 50,
      'ready': 80,
      'served': 90,
      'completed': 100
    };
    return progressMap[status] || 0;
  };

  // Get heat map color based on mode
  const getHeatMapColor = (table, mode) => {
    if (!mode) return null;

    switch (mode) {
      case 'occupancy':
        if (!table.capacity) return '#9e9e9e';
        const occupancy = table.currentGuests / table.capacity;
        if (occupancy >= 1) return '#f44336';
        if (occupancy >= 0.7) return '#ff9800';
        if (occupancy >= 0.4) return '#4caf50';
        return '#9e9e9e';
      
      case 'revenue':
        const order = orders.find(o => o.id === (table.currentOrderId || table.currentOrder));
        const revenue = order?.total || 0;
        if (revenue >= 100) return '#4caf50';
        if (revenue >= 50) return '#2196f3';
        if (revenue > 0) return '#ff9800';
        return '#9e9e9e';
      
      case 'wait_time':
        const timer = liveData.tableTimers.get(table.id);
        if (!timer) return '#9e9e9e';
        if (timer.critical) return '#f44336';
        if (timer.warning) return '#ff9800';
        return '#4caf50';
      
      case 'kitchen_delay':
        const kitchen = liveData.kitchenStatus.get(table.id);
        if (!kitchen) return '#9e9e9e';
        if (kitchen.delayed) return '#f44336';
        if (kitchen.estimatedTime > 30) return '#ff9800';
        return '#4caf50';
      
      case 'turnover':
        const history = tableEngine.getTableHistory(table.id);
        const turnover = history?.metrics?.avgTurnover || 0;
        if (turnover >= 5) return '#4caf50';
        if (turnover >= 3) return '#2196f3';
        return '#9e9e9e';
      
      default:
        return null;
    }
  };

  // Get timer color based on threshold
  const getTimerColor = (timerStatus) => {
    if (!timerStatus) return 'rgba(255,255,255,0.7)';
    if (timerStatus.critical) return '#f44336';
    if (timerStatus.warning) return '#ff9800';
    return 'rgba(255,255,255,0.7)';
  };

  // Format duration for display
  const formatDuration = (timestamp) => {
    if (!timestamp) return '--';
    const elapsed = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (elapsed < 60) return `${elapsed}m`;
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    return `${hours}h ${mins}m`;
  };

  // Get section statistics
  const getSectionStats = useCallback((sectionId) => {
    const sectionTables = tableEngine.getTablesBySection(sectionId);
    const occupied = sectionTables.filter(t => t.status === TABLE_STATES.OCCUPIED || t.status === TABLE_STATES.DINING).length;
    const available = sectionTables.filter(t => t.status === TABLE_STATES.AVAILABLE).length;
    const cleaning = sectionTables.filter(t => t.status === TABLE_STATES.CLEANING).length;
    
    const sectionOrders = sectionTables
      .filter(t => t.currentOrder)
      .map(t => orders.find(o => o.id === (t.currentOrderId || t.currentOrder)))
      .filter(Boolean);
    
    const revenue = sectionOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
      total: sectionTables.length,
      occupied,
      available,
      cleaning,
      revenue,
      occupancy: sectionTables.length > 0 ? Math.round((occupied / sectionTables.length) * 100) : 0
    };
  }, [orders]);

  // Handle table selection
  const handleTableClick = (e, table) => {
    e.stopPropagation();
    
    // Handle drop if dragging an item
    if (draggedItem) {
      if (draggedItem.type === 'reservation' && onReservationDrop) {
        onReservationDrop(draggedItem.data, table.id);
      } else if (draggedItem.type === 'waiter' && onWaiterDrop) {
        onWaiterDrop(draggedItem.data, table.id);
      }
      setDraggedItem(null);
      return;
    }
    
    // Handle merge mode
    if (mergeMode) {
      const newCandidates = new Set(mergeCandidates);
      if (newCandidates.has(table.id)) {
        newCandidates.delete(table.id);
      } else {
        newCandidates.add(table.id);
      }
      setMergeCandidates(newCandidates);
      return;
    }
    
    // Multi-select with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      const newSelection = new Set(selectedTables);
      if (newSelection.has(table.id)) {
        newSelection.delete(table.id);
      } else {
        newSelection.add(table.id);
      }
      setSelectedTables(newSelection);
      setSelectedTable(table);
    } else {
      // Single select
      setSelectedTable(table);
      setSelectedTables(new Set([table.id]));
    }
    
    if (onTableClick) {
      onTableClick(table);
    }
  };

  // Select a table from the Tables list panel. Mirrors handleTableClick's
  // merge-mode / external-drop / selection behavior, minus the DOM-event
  // specifics (stopPropagation, ctrlKey multi-select) that only make sense
  // for a canvas click. `openDetails` lets the list's info button jump
  // straight to the details panel for that table.
  const handleSelectTableFromList = (table, openDetails = false) => {
    if (draggedItem) {
      if (draggedItem.type === 'reservation' && onReservationDrop) {
        onReservationDrop(draggedItem.data, table.id);
      } else if (draggedItem.type === 'waiter' && onWaiterDrop) {
        onWaiterDrop(draggedItem.data, table.id);
      }
      setDraggedItem(null);
      return;
    }

    if (mergeMode) {
      const newCandidates = new Set(mergeCandidates);
      if (newCandidates.has(table.id)) {
        newCandidates.delete(table.id);
      } else {
        newCandidates.add(table.id);
      }
      setMergeCandidates(newCandidates);
      return;
    }

    setSelectedTable(table);
    setSelectedTables(new Set([table.id]));
    if (openDetails) setShowDetailsPanel(true);
    if (onTableClick) onTableClick(table);
  };

  // Handle table double-click
  const handleTableDoubleClick = (e, table) => {
    e.stopPropagation();
    if (onTableDoubleClick) {
      onTableDoubleClick(table);
    }
  };

  // Handle drag start — just records the mousedown; actual drag activates after threshold in handleDragMove
  const handleDragStart = (e, table) => {
    if (viewMode !== 'manager') return;
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    pendingDrag.current = {
      table,
      startX: e.clientX,
      startY: e.clientY,
      // Divide by scale so the offset is in canvas-space coordinates.
      // Without this, tables jump on first mousedown at zoom != 1.
      offsetX: (e.clientX - rect.left) / scale,
      offsetY: (e.clientY - rect.top) / scale,
    };
  };

  // Handle resize start
  const handleResizeStart = (e, table, handle) => {
    if (viewMode !== 'manager') return;
    e.stopPropagation();
    e.preventDefault(); // same native-drag/selection guard as handleDragStart
    setIsResizing(true);
    setSelectedTable(table);
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
      handle // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
    });
  };

  // Handle resize move
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !selectedTable) return;

    const deltaX = e.clientX - dragOffset.x;
    const deltaY = e.clientY - dragOffset.y;
    const handle = dragOffset.handle;

    let newWidth = selectedTable.dimensions.width;
    let newHeight = selectedTable.dimensions.height;
    let newX = selectedTable.position.x;
    let newY = selectedTable.position.y;

    // Resize based on handle
    if (handle.includes('e')) {
      newWidth = Math.max(40, selectedTable.dimensions.width + deltaX / scale);
    }
    if (handle.includes('w')) {
      newWidth = Math.max(40, selectedTable.dimensions.width - deltaX / scale);
      newX = selectedTable.position.x + deltaX / scale;
    }
    if (handle.includes('s')) {
      newHeight = Math.max(40, selectedTable.dimensions.height + deltaY / scale);
    }
    if (handle.includes('n')) {
      newHeight = Math.max(40, selectedTable.dimensions.height - deltaY / scale);
      newY = selectedTable.position.y + deltaY / scale;
    }

    // Snap to grid
    newWidth = snapToGridValue(newWidth);
    newHeight = snapToGridValue(newHeight);
    newX = snapToGridValue(newX);
    newY = snapToGridValue(newY);

    tableEngine.updateTableDimensions(selectedTable.id, { width: newWidth, height: newHeight });
    tableEngine.upsertTable({
      ...selectedTable,
      position: { x: newX, y: newY },
      dimensions: { width: newWidth, height: newHeight }
    });
    setSelectedTable({ ...selectedTable, position: { x: newX, y: newY }, dimensions: { width: newWidth, height: newHeight } });
    setDragOffset({ x: e.clientX, y: e.clientY, handle });
  }, [isResizing, selectedTable, dragOffset, scale, snapToGrid, gridSize]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    if (selectedTable && onTableUpdate) {
      onTableUpdate({ ...selectedTable });
    }
  }, [selectedTable, onTableUpdate]);

  // Handle rotation start
  const handleRotationStart = (e, table) => {
    if (viewMode !== 'manager') return;
    e.stopPropagation();
    e.preventDefault(); // same native-drag/selection guard as handleDragStart
    setIsRotating(true);
    setSelectedTable(table);
    // Same fix as handleDragStart: use currentTarget, not target, so the rotation
    // handle's own glyph can't cause the center point to be computed incorrectly.
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setDragOffset({
      x: centerX,
      y: centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX)
    });
  };

  // Handle rotation move
  const handleRotationMove = useCallback((e) => {
    if (!isRotating || !selectedTable) return;

    const centerX = dragOffset.x;
    const centerY = dragOffset.y;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleDiff = currentAngle - dragOffset.startAngle;
    const newRotation = (selectedTable.rotation || 0) + (angleDiff * 180 / Math.PI);

    tableEngine.updateTableRotation(selectedTable.id, newRotation);
    setSelectedTable({ ...selectedTable, rotation: newRotation });
  }, [isRotating, selectedTable, dragOffset]);

  // Handle rotation end
  const handleRotationEnd = useCallback(() => {
    setIsRotating(false);
    if (selectedTable && onTableUpdate) {
      onTableUpdate({ ...selectedTable });
    }
  }, [selectedTable, onTableUpdate]);

  // Snap to grid helper
  const snapToGridValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Calculate alignment guides
  const calculateAlignmentGuides = useCallback((table, allTables) => {
    if (!showAlignmentGuides) return { vertical: [], horizontal: [] };

    const guides = { vertical: [], horizontal: [] };
    const threshold = 10; // pixels

    allTables.forEach(otherTable => {
      if (otherTable.id === table.id) return;

      // Vertical alignment (left, center, right)
      const tableLeft = table.position.x;
      const tableCenter = table.position.x + table.dimensions.width / 2;
      const tableRight = table.position.x + table.dimensions.width;

      const otherLeft = otherTable.position.x;
      const otherCenter = otherTable.position.x + otherTable.dimensions.width / 2;
      const otherRight = otherTable.position.x + otherTable.dimensions.width;

      if (Math.abs(tableLeft - otherLeft) < threshold) guides.vertical.push(otherLeft);
      if (Math.abs(tableCenter - otherCenter) < threshold) guides.vertical.push(otherCenter);
      if (Math.abs(tableRight - otherRight) < threshold) guides.vertical.push(otherRight);

      // Horizontal alignment (top, center, bottom)
      const tableTop = table.position.y;
      const tableCenterY = table.position.y + table.dimensions.height / 2;
      const tableBottom = table.position.y + table.dimensions.height;

      const otherTop = otherTable.position.y;
      const otherCenterY = otherTable.position.y + otherTable.dimensions.height / 2;
      const otherBottom = otherTable.position.y + otherTable.dimensions.height;

      if (Math.abs(tableTop - otherTop) < threshold) guides.horizontal.push(otherTop);
      if (Math.abs(tableCenterY - otherCenterY) < threshold) guides.horizontal.push(otherCenterY);
      if (Math.abs(tableBottom - otherBottom) < threshold) guides.horizontal.push(otherBottom);
    });

    return guides;
  }, [showAlignmentGuides]);

  // Handle drag move — activates drag only after 5px threshold
  const handleDragMove = useCallback((e) => {
    // Check if a pending drag should become a real drag
    if (pendingDrag.current && !isDragging) {
      const dx = e.clientX - pendingDrag.current.startX;
      const dy = e.clientY - pendingDrag.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        // Threshold crossed — activate drag
        setIsDragging(true);
        setSelectedTable(pendingDrag.current.table);
        setDragOffset({ x: pendingDrag.current.offsetX, y: pendingDrag.current.offsetY });
        pendingDrag.current = null;
      }
      return;
    }
    if (!isDragging || !selectedTable) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    let x = (e.clientX - canvasRect.left - pan.x) / scale - dragOffset.x;
    let y = (e.clientY - canvasRect.top - pan.y) / scale - dragOffset.y;

    // Snap to grid
    x = snapToGridValue(x);
    y = snapToGridValue(y);

    // Calculate alignment guides
    const guides = calculateAlignmentGuides(
      { ...selectedTable, position: { x, y } },
      visibleTables()
    );
    setAlignmentGuides(guides);

    // Apply alignment snapping
    if (guides.vertical.length > 0) {
      const closestGuide = guides.vertical.reduce((prev, curr) => 
        Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev
      );
      if (Math.abs(closestGuide - x) < 10) x = closestGuide;
    }

    if (guides.horizontal.length > 0) {
      const closestGuide = guides.horizontal.reduce((prev, curr) => 
        Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
      );
      if (Math.abs(closestGuide - y) < 10) y = closestGuide;
    }

    tableEngine.upsertTable({
      ...selectedTable,
      position: { x, y }
    });
    setSelectedTable({ ...selectedTable, position: { x, y } });
  }, [isDragging, selectedTable, dragOffset, pan, scale, snapToGrid, gridSize, calculateAlignmentGuides, visibleTables]);

  // Handle drag end — also clears pending drag
  const handleDragEnd = useCallback((e) => {
    if (pendingDrag.current && !isDragging) {
      // Never crossed threshold — treat as click since preventDefault in mousedown swallowed native click
      handleTableClick(e, pendingDrag.current.table);
      pendingDrag.current = null;
      return;
    }
    pendingDrag.current = null;
    setIsDragging(false);
    setAlignmentGuides({ vertical: [], horizontal: [] });
    // Persist updated position to parent state
    if (selectedTable && onTableUpdate) {
      onTableUpdate({ ...selectedTable });
    }
  }, [isDragging, handleTableClick, selectedTable, onTableUpdate]);

  // Handle external drag start (reservations, waiters)
  const handleExternalDragStart = (e, type, data) => {
    e.preventDefault();
    setDraggedItem({ type, data });
  };

  // Handle external drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle external drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  // Handle external drop on canvas
  const handleExternalDrop = (e) => {
    e.preventDefault();
    setDraggedItem(null);
  };

  // Add a brand-new table to the current floor and select it immediately so
  // its resize/rotate handles show up and it's ready to reposition.
  // Verified against the real TableEngine.js/FloorEngine.js: tables link to a
  // floor via `floorId` only, and upsertTable() already fills in sensible
  // defaults (status, priority, capacity, alerts, etc.) for anything we don't
  // set here, so this only needs to supply what actually varies per-table.
  const handleAddTable = () => {
    if (!selectedFloor) return;

    const currentTables = visibleTables();
    const nextNumber = currentTables.reduce(
      (max, t) => Math.max(max, Number(t.number) || 0), 0
    ) + 1;

    // Cascade new tables across a loose grid instead of always dropping them
    // in the exact same spot, so repeated clicks don't stack tables on top
    // of each other.
    const cascadeIndex = currentTables.length;
    const spacing = 100;
    const columns = 6;

    // upsertTable() returns the actual stored table (with TableEngine's own
    // resolved defaults and dimension clamping applied), so select that
    // instead of a hand-built copy that could drift from what's really there.
    const createdTable = tableEngine.upsertTable({
      id: `table-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      number: nextNumber,
      floorId: selectedFloor,
      sectionId: sections[0]?.id || null,
      shape: TABLE_SHAPES.RECT,
      position: {
        x: 60 + (cascadeIndex % columns) * spacing,
        y: 60 + Math.floor(cascadeIndex / columns) * spacing
      },
      dimensions: { width: 80, height: 80 }
    });

    setSelectedTable(createdTable);
    setSelectedTables(new Set([createdTable.id]));
  };

  // Toggle merge mode
  const toggleMergeMode = () => {
    setMergeMode(!mergeMode);
    setMergeCandidates(new Set());
  };

  // Confirm merge
  const confirmMerge = () => {
    if (mergeCandidates.size > 1 && onMergeTables) {
      onMergeTables(Array.from(mergeCandidates));
    }
    setMergeMode(false);
    setMergeCandidates(new Set());
  };

  // Cancel merge
  const cancelMerge = () => {
    setMergeMode(false);
    setMergeCandidates(new Set());
  };

  // Handle pan start
  const handlePanStart = (e) => {
    // BUG FIX: previously required e.target === canvasRef.current, but the inner
    // transform wrapper (which visually covers the entire floor) was always the
    // real click target, so this never matched and panning never activated except
    // by accident. Instead, bail only when the click originated on an interactive
    // element (a table or one of its resize/rotate handles), which are marked with
    // data-table-interactive. Everything else (grid, sections, empty canvas) pans.
    if (e.button !== 0) return;
    if (e.target.closest('[data-table-interactive]')) return;
    e.preventDefault(); // same native-drag/selection guard as handleDragStart
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle pan move
  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle zoom
  const handleZoom = (delta) => {
    setScale(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  // Reset view
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to screen
  const fitToScreen = () => {
    if (!floor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const floorWidth = floor.dimensions.width;
    const floorHeight = floor.dimensions.height;
    // Use slightly smaller area for padding; allow up to 2x scale so small floors fill screen
    const canvasWidth  = canvas.clientWidth  - 48;
    const canvasHeight = canvas.clientHeight - 48;

    const scaleX = canvasWidth  / floorWidth;
    const scaleY = canvasHeight / floorHeight;
    const newScale = Math.min(scaleX, scaleY, 2);

    setScale(newScale);
    setPan({
      x: (canvasWidth  - floorWidth  * newScale) / 2,
      y: (canvasHeight - floorHeight * newScale) / 2,
    });
  };

  // Shared "let go of whatever is being grabbed" logic, used by both the Escape
  // key and the left-click safety net below, so the two can't drift apart.
  const releaseAnyActiveGrab = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setIsPanning(false);
    setAlignmentGuides({ vertical: [], horizontal: [] });
  }, []);

  // Escape key: release any in-progress grab (drag/resize/rotate/pan) that got
  // stuck — e.g. if the mouse left the window/browser before mouseup fired, so
  // handleDragEnd/handleResizeEnd/etc. never ran and the table kept following
  // the cursor. Also clears an external drag-item and exits merge mode.
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key !== 'Escape') return;
      releaseAnyActiveGrab();
      setDraggedItem(null);
      if (mergeMode) {
        setMergeMode(false);
        setMergeCandidates(new Set());
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [mergeMode, releaseAnyActiveGrab]);

  // Left-click safety net: a mousedown can only fire once the previous mouse
  // button press has genuinely ended (browsers won't fire a second mousedown
  // while the button is still down), so any new left-click is a 100% reliable
  // signal that leftover drag/resize/rotate/pan state is stale and should be
  // dropped. This runs in the capture phase so it clears stale state *before*
  // the click's own handler (e.g. starting a fresh drag on the table you just
  // clicked) runs, so a legitimate new grab still works right after.
  useEffect(() => {
    const handleLeftClickRelease = (e) => {
      if (e.button !== 0) return;
      releaseAnyActiveGrab();
    };

    window.addEventListener('mousedown', handleLeftClickRelease, true);
    return () => window.removeEventListener('mousedown', handleLeftClickRelease, true);
  }, [releaseAnyActiveGrab]);

  // Removed useEffect event listeners to prevent dropped events during re-renders
  const handleGlobalMouseMove = useCallback((e) => {
    if (isDragging || pendingDrag.current) handleDragMove(e);
    if (isPanning) handlePanMove(e);
    if (isResizing) handleResizeMove(e);
    if (isRotating) handleRotationMove(e);
  }, [isDragging, pendingDrag, handleDragMove, isPanning, handlePanMove, isResizing, handleResizeMove, isRotating, handleRotationMove]);

  const handleGlobalMouseUp = useCallback((e) => {
    if (isDragging || pendingDrag.current) handleDragEnd(e);
    if (isPanning) handlePanEnd(e);
    if (isResizing) handleResizeEnd(e);
    if (isRotating) handleRotationEnd(e);
  }, [isDragging, pendingDrag, handleDragEnd, isPanning, handlePanEnd, isResizing, handleResizeEnd, isRotating, handleRotationEnd]);

  // Get table color based on state
  const getTableColor = (table) => {
    if (heatMapMode) return getHeatMapColor(table, heatMapMode) || 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
    switch (table.status) {
      case 'available': return 'linear-gradient(135deg, var(--cafe-success, #10b981) 0%, #059669 100%)';
      case 'occupied': return 'linear-gradient(135deg, var(--cafe-accent, #f59e0b) 0%, #d97706 100%)';
      case 'reserved': return 'linear-gradient(135deg, var(--cafe-info, #3b82f6) 0%, #2563eb 100%)';
      case 'cleaning': return 'linear-gradient(135deg, var(--cafe-purple, #8b5cf6) 0%, #6d28d9 100%)';
      case 'attention': return 'linear-gradient(135deg, var(--cafe-danger, #ef4444) 0%, #dc2626 100%)';
      default: return 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
    }
  };

  const getTableOrderStatus = (table) => {
    const orderId = table.currentOrderId || table.currentOrder;
    if (!orderId) return null;
    const order = orders.find(o => o.id === orderId);
    return order ? order.status : null;
  };

  const getTableOrder = (table) => {
    const orderId = table.currentOrderId || table.currentOrder;
    if (!orderId) return null;
    return orders.find(o => o.id === orderId) || null;
  };

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cafe-bg-surface)' }}
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => { if (!e.target.closest('[data-table-interactive]')) e.preventDefault(); }}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
    >
      {/* Toolbar */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--cafe-border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select 
            value={selectedFloor || ''}
            onChange={(e) => setSelectedFloor(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-card)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13
            }}
          >
            {floorEngine.getAllFloors().map(floor => (
              <option key={floor.id} value={floor.id}>{floor.name}</option>
            ))}
          </select>
          {viewMode === 'manager' && (
            <>
              <button
                onClick={() => setShowFloorEditor(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--cafe-radius-sm)',
                  border: '1px solid var(--cafe-border-light)',
                  background: 'var(--cafe-bg-card)',
                  color: 'var(--cafe-text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Edit Layout
              </button>
              <button
                onClick={handleAddTable}
                disabled={!selectedFloor}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--cafe-radius-sm)',
                  border: '1px solid var(--cafe-accent-border)',
                  background: 'var(--cafe-accent-bg)',
                  color: 'var(--cafe-accent)',
                  fontSize: 13,
                  cursor: selectedFloor ? 'pointer' : 'not-allowed',
                  opacity: selectedFloor ? 1 : 0.5,
                  fontWeight: 600
                }}
              >
                + Add Table
              </button>
            </>
          )}
          <button
            onClick={toggleMergeMode}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: mergeMode ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
              background: mergeMode ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
              color: mergeMode ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {mergeMode ? 'Cancel Merge' : 'Merge Tables'}
          </button>
          {mergeMode && mergeCandidates.size > 1 && (
            <button
              onClick={confirmMerge}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: '1px solid var(--cafe-success-border)',
                background: 'var(--cafe-success-bg)',
                color: 'var(--cafe-success)',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Merge ({mergeCandidates.size})
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables..."
              style={{
                padding: '6px 12px 6px 32px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: '1px solid var(--cafe-border-light)',
                background: 'var(--cafe-bg-card)',
                color: 'var(--cafe-text-primary)',
                fontSize: 13,
                width: 180
              }}
            />
            <span style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              color: 'var(--cafe-text-tertiary)'
            }}>⌕</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--cafe-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0
                }}
              >
                ×
              </button>
            )}

            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                background: 'var(--cafe-bg-card)',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-sm)',
                padding: '8px 12px',
                fontSize: 12,
                color: 'var(--cafe-text-secondary)',
                whiteSpace: 'nowrap',
                zIndex: 100
              }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          <div style={{ 
            padding: '4px 12px',
            borderRadius: 'var(--cafe-radius-sm)',
            background: 'var(--cafe-bg-card)',
            border: '1px solid var(--cafe-border-light)',
            fontSize: 13,
            color: 'var(--cafe-text-secondary)'
          }}>
            {visibleTables().length} tables
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => handleZoom(-0.1)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-card)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            −
          </button>
          <button 
            onClick={() => handleZoom(0.1)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-card)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button 
            onClick={resetView}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-card)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          <button 
            onClick={fitToScreen}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--cafe-radius-sm)',
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-card)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Fit
          </button>
        </div>

        {viewMode === 'manager' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setShowGrid(!showGrid)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: showGrid ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: showGrid ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: showGrid ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Grid
            </button>
            <button 
              onClick={() => setSnapToGrid(!snapToGrid)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: snapToGrid ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: snapToGrid ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: snapToGrid ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Snap
            </button>
            <button 
              onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: showAlignmentGuides ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: showAlignmentGuides ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: showAlignmentGuides ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Align
            </button>
            <select
              value={heatMapMode || ''}
              onChange={(e) => setHeatMapMode(e.target.value || null)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: heatMapMode ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: heatMapMode ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: heatMapMode ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <option value="">Heat Map</option>
              <option value="occupancy">Occupancy</option>
              <option value="revenue">Revenue</option>
              <option value="wait_time">Wait Time</option>
              <option value="kitchen_delay">Kitchen Delay</option>
              <option value="turnover">Turnover</option>
            </select>
            <button 
              onClick={() => setShowTableList(!showTableList)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: showTableList ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: showTableList ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: showTableList ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Tables
            </button>
            <button 
              onClick={() => setShowLegend(!showLegend)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: showLegend ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: showLegend ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: showLegend ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Legend
            </button>
            <button 
              onClick={() => setShowDetailsPanel(!showDetailsPanel)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--cafe-radius-sm)',
                border: showDetailsPanel ? '1px solid var(--cafe-accent-border)' : '1px solid var(--cafe-border-light)',
                background: showDetailsPanel ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
                color: showDetailsPanel ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Details
            </button>
          </div>
        )}
      </div>

      {/* Floor Canvas */}
      <div 
        ref={canvasRef}
        onMouseDown={handlePanStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleExternalDrop}
        style={{ 
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : draggedItem ? 'copy' : mergeMode ? 'crosshair' : 'grab',
          background: '#f5f5f5'
        }}
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: floor?.dimensions?.width || 1200,
            height: floor?.dimensions?.height || 900,
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {/* Render Grid */}
          {showGrid && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
              pointerEvents: 'none',
              zIndex: 0
            }} />
          )}

          {/* Render Alignment Guides */}
          {showAlignmentGuides && (alignmentGuides.vertical.length > 0 || alignmentGuides.horizontal.length > 0) && (
            <>
              {alignmentGuides.vertical.map((x, i) => (
                <div
                  key={`v-${i}`}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 0,
                    width: 1,
                    height: '100%',
                    background: 'var(--cafe-accent)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: 100
                  }}
                />
              ))}
              {alignmentGuides.horizontal.map((y, i) => (
                <div
                  key={`h-${i}`}
                  style={{
                    position: 'absolute',
                    top: y,
                    left: 0,
                    width: '100%',
                    height: 1,
                    background: 'var(--cafe-accent)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: 100
                  }}
                />
              ))}
            </>
          )}

          {/* Render Sections */}
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                position: 'absolute',
                left: section.position?.x || 0,
                top: section.position?.y || 0,
                width: section.dimensions?.width || 400,
                height: section.dimensions?.height || 300,
                background: section.color || '#e8f5e9',
                border: '2px dashed rgba(0,0,0,0.1)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {section.name}
            </div>
          ))}

          {/* Render Tables */}
          {visibleTables().map(table => (
            <div
              key={table.id}
              data-table-interactive="true"
              onClick={(e) => handleTableClick(e, table)}
              onDoubleClick={(e) => handleTableDoubleClick(e, table)}
              onMouseDown={(e) => handleDragStart(e, table)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, table });
              }}
              style={{
                position: 'absolute',
                left: table.position?.x || 0,
                top: table.position?.y || 0,
                width: table.dimensions?.width || 80,
                height: table.dimensions?.height || 80,
                background: getTableColor(table),
                border: selectedTable?.id === table.id ? '3px solid var(--cafe-accent)' : 
                        mergeCandidates.has(table.id) ? '3px solid var(--cafe-success)' :
                        '2px solid rgba(0,0,0,0.2)',
                borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'oval' ? '50%' : 8,
                cursor: viewMode === 'manager' ? 'move' : 'pointer',
                // Belt-and-suspenders alongside e.preventDefault() in handleDragStart:
                // stops the browser from ever treating the table's text content
                // (number, timer, icons) as selectable/draggable, which is what
                // was hijacking the mouse and leaving the table stuck to the cursor.
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                WebkitUserDrag: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: selectedTable?.id === table.id 
                  ? '0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0,0,0,0.15)' 
                  : mergeCandidates.has(table.id)
                  ? '0 8px 24px rgba(76, 175, 80, 0.4), 0 2px 8px rgba(0,0,0,0.15)'
                  : '0 4px 12px rgba(0,0,0,0.15)',
                transform: `rotate(${table.rotation || 0}deg)`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(table.priority === 'urgent' && {
                  boxShadow: '0 0 0 3px #f44336, 0 8px 24px rgba(244, 67, 54, 0.4)',
                  animation: 'pulse 2s infinite'
                }),
                ...(table.visible === false && {
                  opacity: 0.3,
                  pointerEvents: 'none'
                })
              }}
            >
              {/* Resize Handles (manager mode, selected) */}
              {viewMode === 'manager' && selectedTable?.id === table.id && (
                <>
                  {/* Corner handles */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'nw')}
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'nw-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'ne')}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'ne-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'se')}
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'se-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'sw')}
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      left: -6,
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'sw-resize',
                      zIndex: 10
                    }}
                  />
                  {/* Edge handles */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'n')}
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'n-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 's')}
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 's-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'e')}
                    style={{
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'e-resize',
                      zIndex: 10
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, table, 'w')}
                    style={{
                      position: 'absolute',
                      left: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 12,
                      height: 12,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: 'w-resize',
                      zIndex: 10
                    }}
                  />
                  {/* Rotation handle */}
                  <div
                    onMouseDown={(e) => handleRotationStart(e, table)}
                    style={{
                      position: 'absolute',
                      top: -25,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 16,
                      height: 16,
                      background: 'var(--cafe-accent)',
                      border: '2px solid white',
                      borderRadius: '50%',
                      cursor: 'grab',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10
                    }}
                  >
                    ↻
                  </div>
                </>
              )}
              {/* Table Number with State Icon */}
              <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                {STATE_ICONS[table.status] && <span style={{ fontSize: 14 }}>{STATE_ICONS[table.status]}</span>}
                {table.number}
              </div>

              {/* Guest Count / Order Info */}
              {(() => {
                const order = getTableOrder(table);
                if (order) {
                  return (
                    <>
                      <div style={{ fontSize: 9, opacity: 0.95, fontWeight: 700, marginTop: 1 }}>
                        ₹{(order.total || 0).toFixed(0)}
                      </div>
                      <div style={{ fontSize: 8, opacity: 0.8 }}>
                        {order.items?.length || 0} items
                      </div>
                    </>
                  );
                }
                if (table.currentGuests > 0) {
                  return (
                    <div style={{ fontSize: 10, opacity: 0.9 }}>
                      {table.currentGuests} / {table.capacity}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Live Timer */}
              {liveData.tableTimers.has(table.id) && (
                <div style={{ 
                  fontSize: 9, 
                  opacity: 0.8, 
                  marginTop: 2,
                  color: getTimerColor(liveData.tableTimers.get(table.id))
                }}>
                  {liveData.tableTimers.get(table.id).duration}m
                </div>
              )}

              {/* Order Progress Bar */}
              {liveData.orderProgress.has(table.id) && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${liveData.orderProgress.get(table.id).progress}%`,
                    height: '100%',
                    background: liveData.orderProgress.get(table.id).progress >= 80 ? '#4caf50' : 
                             liveData.orderProgress.get(table.id).progress >= 50 ? '#2196f3' : '#ff9800',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}

              {/* Alert Badges (stacked intelligently) */}
              {table.alerts && table.alerts.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {table.alerts.slice(0, 3).map((alert, idx) => (
                    <div
                      key={alert}
                      style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 8,
                        fontSize: 9,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transform: `translateY(${idx * -12}px)`,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {ALERT_ICONS[alert] || alert}
                    </div>
                  ))}
                  {table.alerts.length > 3 && (
                    <div style={{
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 8,
                      fontSize: 8,
                      fontWeight: 600,
                      transform: `translateY(-36px)`
                    }}>
                      +{table.alerts.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Priority Indicator */}
              {table.priority !== TABLE_PRIORITIES.NORMAL && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: PRIORITY_COLORS[table.priority],
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {table.priority === TABLE_PRIORITIES.URGENT ? '!' : 
                   table.priority === TABLE_PRIORITIES.VIP ? '⭐' : 
                   table.priority === TABLE_PRIORITIES.EMERGENCY ? '🚨' : '↑'}
                </div>
              )}

              {/* Waiter Avatar with overload indicator */}
              {table.assignedWaiter && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: liveData.waiterStatus.get(table.assignedWaiter)?.overloaded ? '#f44336' : 'var(--cafe-accent)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {table.assignedWaiter.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Kitchen Status */}
              {liveData.kitchenStatus.has(table.id) && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: table.assignedWaiter ? 20 : -8,
                  background: liveData.kitchenStatus.get(table.id).delayed ? '#f44336' : '#ff9800',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 8,
                  fontSize: 8,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  {liveData.kitchenStatus.get(table.id).estimatedTime}m
                </div>
              )}

              {/* Heat Map Overlay */}
              {heatMapMode && getHeatMapColor(table, heatMapMode) && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: getHeatMapColor(table, heatMapMode),
                  opacity: 0.3,
                  borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'oval' ? '50%' : 8,
                  pointerEvents: 'none'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Legend */}
      {showLegend && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--cafe-border-light)',
          background: 'var(--cafe-bg-card)',
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          fontSize: 11,
          color: 'var(--cafe-text-secondary)'
        }}>
          {/* States */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>States</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(STATE_COLORS).slice(0, 7).map(([state, color]) => (
                <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span>{state.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>Priorities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
                <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <span>{priority.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>Alerts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(ALERT_ICONS).slice(0, 6).map(([alert, icon]) => (
                <div key={alert} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{icon}</span>
                  <span>{alert.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timer Thresholds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>Timers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#4caf50' }} />
                <span>Normal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ff9800' }} />
                <span>Warning</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f44336' }} />
                <span>Critical</span>
              </div>
            </div>
          </div>

          {/* Heat Map */}
          {heatMapMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>
                Heat Map: {heatMapMode.replace('_', ' ')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#4caf50' }} />
                  <span>Low</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ff9800' }} />
                  <span>Medium</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f44336' }} />
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--cafe-bg-card)',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            zIndex: 99999,
            minWidth: 200,
            overflow: 'hidden',
            animation: 'kdsCardIn 0.15s ease'
          }}
        >
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cafe-text-primary)' }}>Table {contextMenu.table.number}</div>
            <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
              {contextMenu.table.status} · {contextMenu.table.capacity} seats
            </div>
          </div>

          {/* Actions */}
          {[
            { icon: '👁️', label: 'View Details', color: 'var(--cafe-text-secondary)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
            ...(contextMenu.table.status === 'available' ? [
              { icon: '🪑', label: 'Seat Guest', color: 'var(--cafe-success)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
              { icon: '📅', label: 'Reserve', color: 'var(--cafe-info)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
            ] : []),
            ...(contextMenu.table.status === 'occupied' ? [
              { icon: '🍽️', label: 'View Order', color: 'var(--cafe-accent)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
              { icon: '🔄', label: 'Transfer Table', color: 'var(--cafe-text-secondary)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
              { icon: '✅', label: 'Clear Table', color: 'var(--cafe-success)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
            ] : []),
            ...(contextMenu.table.status === 'cleaning' ? [
              { icon: '✨', label: 'Mark Available', color: 'var(--cafe-success)', action: () => { onTableClick?.(contextMenu.table); setContextMenu(null); } },
            ] : []),
            { icon: '✏️', label: 'Edit Table', color: 'var(--cafe-text-secondary)', action: () => { if (onTableDoubleClick) onTableDoubleClick(contextMenu.table); setContextMenu(null); } },
            { icon: '⇄', label: 'Merge With...', color: 'var(--cafe-purple)', action: () => { toggleMergeMode(); setMergeCandidates(new Set([contextMenu.table.id])); setContextMenu(null); } },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                color: item.color, fontSize: 13, fontWeight: 600,
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cafe-bg-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Tables List Panel: click a row to select/grab that table (same as
          clicking it on the canvas); click the (i) button to jump straight
          to its details panel. */}
      {showTableList && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: 16,
          width: 230,
          maxHeight: 'calc(100% - 140px)',
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--cafe-border-light)',
            background: 'var(--cafe-bg-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
              Tables ({visibleTables().length})
            </div>
            <button
              onClick={() => setShowTableList(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                color: 'var(--cafe-text-tertiary)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              ×
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {visibleTables().length === 0 && (
              <div style={{ padding: 16, fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                No tables on this floor yet.
              </div>
            )}
            {visibleTables()
              .slice()
              .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
              .map(table => (
                <div
                  key={table.id}
                  onClick={() => handleSelectTableFromList(table)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--cafe-border-light)',
                    background: selectedTable?.id === table.id
                      ? 'var(--cafe-accent-bg)'
                      : mergeCandidates.has(table.id)
                      ? 'var(--cafe-success-bg)'
                      : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: (table.shape === 'circle' || table.shape === 'oval') ? '50%' : 2,
                    background: getTableColor(table),
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--cafe-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {STATE_ICONS[table.status] && <span style={{ fontSize: 11 }}>{STATE_ICONS[table.status]}</span>}
                      Table {table.number}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                      {(table.status || '').replace('_', ' ')} · {table.currentGuests || 0}/{table.capacity}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelectTableFromList(table, true); }}
                    title="View details"
                    style={{
                      background: 'none',
                      border: '1px solid var(--cafe-border-light)',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--cafe-text-secondary)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    i
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mini Map */}
      {floor && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          width: 150,
          height: 100,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 50
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: '#f5f5f5'
          }}>
            {/* Mini map floor */}
            {sections.map(section => (
              <div
                key={section.id}
                style={{
                  position: 'absolute',
                  left: (section.position?.x || 0) / floor.dimensions.width * 100,
                  top: (section.position?.y || 0) / floor.dimensions.height * 100,
                  width: (section.dimensions?.width || 400) / floor.dimensions.width * 100,
                  height: (section.dimensions?.height || 300) / floor.dimensions.height * 100,
                  background: section.color || '#e8f5e9',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 2
                }}
              />
            ))}
            {visibleTables().map(table => (
              <div
                key={table.id}
                style={{
                  position: 'absolute',
                  left: (table.position?.x || 0) / floor.dimensions.width * 100,
                  top: (table.position?.y || 0) / floor.dimensions.height * 100,
                  width: (table.dimensions?.width || 80) / floor.dimensions.width * 100,
                  height: (table.dimensions?.height || 80) / floor.dimensions.height * 100,
                  background: getTableColor(table),
                  borderRadius: table.shape === 'circle' ? '50%' : 2,
                  opacity: 0.8
                }}
              />
            ))}
            {/* Viewport indicator */}
            <div
              style={{
                position: 'absolute',
                left: (-pan.x / scale) / floor.dimensions.width * 100,
                top: (-pan.y / scale) / floor.dimensions.height * 100,
                // BUG FIX: was window.innerWidth/innerHeight, which ignores the
                // toolbar/legend/panels that shrink the actual canvas viewport,
                // making this rectangle wrong. Use the canvas element's real size.
                width: ((canvasRef.current?.clientWidth || window.innerWidth) / scale) / floor.dimensions.width * 100,
                height: ((canvasRef.current?.clientHeight || window.innerHeight) / scale) / floor.dimensions.height * 100,
                border: '2px solid var(--cafe-accent)',
                background: 'rgba(99, 102, 241, 0.1)',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Table Details Panel */}
      {showDetailsPanel && selectedTable && (
        <div style={{
          position: 'absolute',
          top: 60,
          right: 20,
          width: 320,
          maxHeight: 'calc(100% - 140px)',
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--cafe-border-light)',
            background: 'var(--cafe-bg-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
              Table {selectedTable.number}
            </div>
            <button
              onClick={() => setShowDetailsPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                color: 'var(--cafe-text-tertiary)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: STATE_COLORS[selectedTable.status]
                }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                  {selectedTable.status.replace('_', ' ')}
                </span>
                {STATE_ICONS[selectedTable.status] && (
                  <span style={{ fontSize: 16 }}>{STATE_ICONS[selectedTable.status]}</span>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                CAPACITY
              </div>
              <div style={{ fontSize: 14, color: 'var(--cafe-text-primary)' }}>
                {selectedTable.currentGuests || 0} / {selectedTable.capacity} seats
                {selectedTable.currentGuests > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginLeft: 8 }}>
                    ({Math.round((selectedTable.currentGuests / selectedTable.capacity) * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Timer */}
            {liveData.tableTimers.has(selectedTable.id) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  DURATION
                </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: getTimerColor(liveData.tableTimers.get(selectedTable.id)),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {liveData.tableTimers.get(selectedTable.id).duration} minutes
                  {liveData.tableTimers.get(selectedTable.id).critical && (
                    <span style={{ fontSize: 12 }}>⚠️ Critical</span>
                  )}
                </div>
              </div>
            )}

            {/* Waiter */}
            {selectedTable.assignedWaiter && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  ASSIGNED WAITER
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: liveData.waiterStatus.get(selectedTable.assignedWaiter)?.overloaded ? '#f44336' : 'var(--cafe-accent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700
                  }}>
                    {selectedTable.assignedWaiter.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--cafe-text-primary)' }}>
                      {selectedTable.assignedWaiter}
                    </div>
                    {liveData.waiterStatus.get(selectedTable.assignedWaiter) && (
                      <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                        {liveData.waiterStatus.get(selectedTable.assignedWaiter).tablesAssigned} tables, 
                        {liveData.waiterStatus.get(selectedTable.assignedWaiter).ordersPending} orders
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Progress */}
            {liveData.orderProgress.has(selectedTable.id) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  ORDER PROGRESS
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{
                    height: 6,
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${liveData.orderProgress.get(selectedTable.id).progress}%`,
                      height: '100%',
                      background: liveData.orderProgress.get(selectedTable.id).progress >= 80 ? '#4caf50' : 
                               liveData.orderProgress.get(selectedTable.id).progress >= 50 ? '#2196f3' : '#ff9800',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                  {liveData.orderProgress.get(selectedTable.id).status} • 
                  {liveData.orderProgress.get(selectedTable.id).items} items • 
                  ${liveData.orderProgress.get(selectedTable.id).total}
                </div>
              </div>
            )}

            {/* Alerts */}
            {selectedTable.alerts && selectedTable.alerts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  ALERTS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedTable.alerts.map(alert => (
                    <div
                      key={alert}
                      style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {ALERT_ICONS[alert] || alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority */}
            {selectedTable.priority !== TABLE_PRIORITIES.NORMAL && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  PRIORITY
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: PRIORITY_COLORS[selectedTable.priority]
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {selectedTable.priority.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Reservation */}
            {selectedTable.status === TABLE_STATES.RESERVED && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  RESERVATION
                </div>
                <div style={{ fontSize: 14, color: 'var(--cafe-text-primary)' }}>
                  {selectedTable.reservedFor}
                </div>
                {selectedTable.reservedTime && (
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                    {new Date(selectedTable.reservedTime).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedTable.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                  NOTES
                </div>
                <div style={{ fontSize: 13, color: 'var(--cafe-text-primary)', lineHeight: 1.4 }}>
                  {selectedTable.notes}
                </div>
              </div>
            )}

            {/* Table History */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                METRICS
              </div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                <div>Turnover: {tableEngine.getTableHistory(selectedTable.id)?.metrics?.avgTurnover || 0}</div>
                <div>Avg Stay: {tableEngine.getTableHistory(selectedTable.id)?.metrics?.avgOccupancyTime || 0}m</div>
                <div>Total Visits: {tableEngine.getTableHistory(selectedTable.id)?.totalVisits || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floor Editor Modal */}
      {showFloorEditor && (
        <FloorEditorModal 
          onClose={() => setShowFloorEditor(false)}
          onUpdate={() => setLayoutUpdateTrigger(prev => prev + 1)}
        />
      )}
    </div>
  );
}

export default InteractiveFloorPlan;
