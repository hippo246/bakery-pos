// Initial table data for BrewCRM

export const INIT_TABLES = [
  { id: "tbl-001", number: 1, capacity: 2, status: "available", type: "indoor", area: "main", currentOrder: null, shape: "rect", rotation: 0, dimensions: { width: 80, height: 60 }, position: { x: 50, y: 50 }, layer: 0, visible: true },
  { id: "tbl-002", number: 2, capacity: 4, status: "occupied", type: "indoor", area: "main", currentOrder: "ORD-001", shape: "rect", rotation: 0, dimensions: { width: 100, height: 80 }, position: { x: 150, y: 50 }, layer: 0, visible: true },
  { id: "tbl-003", number: 3, capacity: 4, status: "available", type: "indoor", area: "main", currentOrder: null, shape: "square", rotation: 0, dimensions: { width: 80, height: 80 }, position: { x: 270, y: 50 }, layer: 0, visible: true },
  { id: "tbl-004", number: 4, capacity: 6, status: "reserved", type: "indoor", area: "main", currentOrder: null, reservedFor: "John Doe", reservedTime: "14:00", shape: "rect", rotation: 0, dimensions: { width: 120, height: 80 }, position: { x: 370, y: 50 }, layer: 0, visible: true },
  { id: "tbl-005", number: 5, capacity: 2, status: "available", type: "indoor", area: "main", currentOrder: null, shape: "circle", rotation: 0, dimensions: { width: 60, height: 60 }, position: { x: 50, y: 150 }, layer: 0, visible: true },
  { id: "tbl-006", number: 6, capacity: 8, status: "occupied", type: "indoor", area: "main", currentOrder: "ORD-002", shape: "rect", rotation: 0, dimensions: { width: 140, height: 100 }, position: { x: 150, y: 150 }, layer: 0, visible: true },
  { id: "tbl-007", number: 7, capacity: 4, status: "available", type: "outdoor", area: "terrace", currentOrder: null, shape: "oval", rotation: 0, dimensions: { width: 100, height: 70 }, position: { x: 600, y: 50 }, layer: 0, visible: true },
  { id: "tbl-008", number: 8, capacity: 6, status: "occupied", type: "outdoor", area: "terrace", currentOrder: "ORD-003", shape: "rect", rotation: 0, dimensions: { width: 120, height: 80 }, position: { x: 720, y: 50 }, layer: 0, visible: true },
  { id: "tbl-009", number: 9, capacity: 4, status: "available", type: "outdoor", area: "terrace", currentOrder: null, shape: "square", rotation: 0, dimensions: { width: 80, height: 80 }, position: { x: 850, y: 50 }, layer: 0, visible: true },
  { id: "tbl-010", number: 10, capacity: 2, status: "available", type: "indoor", area: "quiet", currentOrder: null, shape: "rect", rotation: 0, dimensions: { width: 70, height: 60 }, position: { x: 50, y: 280 }, layer: 0, visible: true },
  { id: "tbl-011", number: 11, capacity: 4, status: "occupied", type: "indoor", area: "quiet", currentOrder: "ORD-004", shape: "rect", rotation: 0, dimensions: { width: 100, height: 80 }, position: { x: 150, y: 280 }, layer: 0, visible: true },
  { id: "tbl-012", number: 12, capacity: 2, status: "available", type: "indoor", area: "quiet", currentOrder: null, shape: "circle", rotation: 0, dimensions: { width: 60, height: 60 }, position: { x: 270, y: 280 }, layer: 0, visible: true },
];

export const TABLE_TYPES = ["All", "indoor", "outdoor"];
export const TABLE_AREAS = ["All", "main", "terrace", "quiet"];
export const TABLE_STATUS = ["All", "available", "occupied", "reserved", "cleaning"];
export const TABLE_SHAPES = ["rect", "square", "circle", "oval", "booth", "bar_seat", "custom"];
