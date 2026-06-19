// Initial table data for BrewCRM

export const INIT_TABLES = [
  { id: "tbl-001", number: 1, capacity: 2, status: "available", type: "indoor", area: "main", currentOrder: null },
  { id: "tbl-002", number: 2, capacity: 4, status: "occupied", type: "indoor", area: "main", currentOrder: "ORD-001" },
  { id: "tbl-003", number: 3, capacity: 4, status: "available", type: "indoor", area: "main", currentOrder: null },
  { id: "tbl-004", number: 4, capacity: 6, status: "reserved", type: "indoor", area: "main", currentOrder: null, reservedFor: "John Doe", reservedTime: "14:00" },
  { id: "tbl-005", number: 5, capacity: 2, status: "available", type: "indoor", area: "main", currentOrder: null },
  { id: "tbl-006", number: 6, capacity: 8, status: "occupied", type: "indoor", area: "main", currentOrder: "ORD-002" },
  { id: "tbl-007", number: 7, capacity: 4, status: "available", type: "outdoor", area: "terrace", currentOrder: null },
  { id: "tbl-008", number: 8, capacity: 6, status: "occupied", type: "outdoor", area: "terrace", currentOrder: "ORD-003" },
  { id: "tbl-009", number: 9, capacity: 4, status: "available", type: "outdoor", area: "terrace", currentOrder: null },
  { id: "tbl-010", number: 10, capacity: 2, status: "available", type: "indoor", area: "quiet", currentOrder: null },
  { id: "tbl-011", number: 11, capacity: 4, status: "occupied", type: "indoor", area: "quiet", currentOrder: "ORD-004" },
  { id: "tbl-012", number: 12, capacity: 2, status: "available", type: "indoor", area: "quiet", currentOrder: null },
];

export const TABLE_TYPES = ["All", "indoor", "outdoor"];
export const TABLE_AREAS = ["All", "main", "terrace", "quiet"];
export const TABLE_STATUS = ["All", "available", "occupied", "reserved", "cleaning"];
