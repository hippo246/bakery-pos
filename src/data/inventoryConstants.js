// Initial inventory data for BrewCRM

export const INIT_INVENTORY = [
  { id: "inv-001", name: "Coffee Beans (Arabica)", category: "Ingredients", quantity: 50, unit: "kg", minStock: 10, cost: 800, supplier: "Coffee Co", lastRestock: "2026-06-10" },
  { id: "inv-002", name: "Milk (Whole)", category: "Dairy", quantity: 20, unit: "liters", minStock: 5, cost: 60, supplier: "Dairy Fresh", lastRestock: "2026-06-12" },
  { id: "inv-003", name: "Milk (Oat)", category: "Dairy", quantity: 15, unit: "liters", minStock: 5, cost: 120, supplier: "Oatly", lastRestock: "2026-06-11" },
  { id: "inv-004", name: "Sugar", category: "Ingredients", quantity: 30, unit: "kg", minStock: 10, cost: 40, supplier: "Sugar Corp", lastRestock: "2026-06-08" },
  { id: "inv-005", name: "Chocolate Syrup", category: "Syrups", quantity: 5, unit: "liters", minStock: 2, cost: 200, supplier: "Flavor Co", lastRestock: "2026-06-05" },
  { id: "inv-006", name: "Vanilla Syrup", category: "Syrups", quantity: 4, unit: "liters", minStock: 2, cost: 180, supplier: "Flavor Co", lastRestock: "2026-06-05" },
  { id: "inv-007", name: "Caramel Syrup", category: "Syrups", quantity: 3, unit: "liters", minStock: 2, cost: 190, supplier: "Flavor Co", lastRestock: "2026-06-04" },
  { id: "inv-008", name: "Avocados", category: "Fresh Produce", quantity: 20, unit: "pieces", minStock: 10, cost: 40, supplier: "Farm Fresh", lastRestock: "2026-06-13" },
  { id: "inv-009", name: "Sourdough Bread", category: "Bakery", quantity: 15, unit: "loaves", minStock: 5, cost: 50, supplier: "Local Bakery", lastRestock: "2026-06-13" },
  { id: "inv-010", name: "Eggs", category: "Dairy", quantity: 60, unit: "pieces", minStock: 20, cost: 6, supplier: "Farm Fresh", lastRestock: "2026-06-12" },
  { id: "inv-011", name: "Cheese (Cheddar)", category: "Dairy", quantity: 8, unit: "kg", minStock: 3, cost: 400, supplier: "Dairy Fresh", lastRestock: "2026-06-10" },
  { id: "inv-012", name: "Ice Cubes", category: "Ingredients", quantity: 100, unit: "trays", minStock: 30, cost: 10, supplier: "Ice Co", lastRestock: "2026-06-13" },
  { id: "inv-013", name: "Cups (Small)", category: "Supplies", quantity: 500, unit: "pieces", minStock: 100, cost: 500, supplier: "Packaging Co", lastRestock: "2026-06-01" },
  { id: "inv-014", name: "Cups (Large)", category: "Supplies", quantity: 400, unit: "pieces", minStock: 100, cost: 600, supplier: "Packaging Co", lastRestock: "2026-06-01" },
  { id: "inv-015", name: "Lids", category: "Supplies", quantity: 900, unit: "pieces", minStock: 200, cost: 450, supplier: "Packaging Co", lastRestock: "2026-06-01" },
  { id: "inv-016", name: "Napkins", category: "Supplies", quantity: 2000, unit: "pieces", minStock: 500, cost: 200, supplier: "Packaging Co", lastRestock: "2026-06-01" },
];

export const INVENTORY_CATEGORIES = ["All", "Ingredients", "Dairy", "Syrups", "Fresh Produce", "Bakery", "Supplies"];

export const SUPPLIERS = ["Coffee Co", "Dairy Fresh", "Oatly", "Sugar Corp", "Flavor Co", "Farm Fresh", "Local Bakery", "Ice Co", "Packaging Co"];
